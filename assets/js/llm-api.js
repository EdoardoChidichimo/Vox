// LLM API Handler for VoxLLM
// Handles communication with Ollama for case analysis and synthesis

class LLMAPI {
    constructor() {
        // Configuration for Ollama API
        this.apiEndpoint = 'http://localhost:11434/api/generate';
        this.model = 'gpt-oss:20b';
        
        // Store API responses for debugging and reference
        this.apiResponses = [];
    }
    
    /**
     * Set the model to use for API calls
     * @param {string} model - The model identifier
     */
    setModel(model) {
        this.model = model;
    }
    
    /**
     * Make a call to the Ollama API
     * @param {string} prompt - The prompt to send to the LLM
     * @param {string} systemMessage - Optional system message
     * @returns {Promise<string>} - The LLM response
     */
    async callLLM(prompt, systemMessage = null) {
        console.log('🔍 LLM API call initiated');
        console.log('Model:', this.model);
        console.log('Endpoint:', this.apiEndpoint);
        console.log('Prompt length:', prompt.length);
        console.log('System message:', systemMessage);
        
        // Combine system message and user prompt if system message is provided
        let fullPrompt = prompt;
        if (systemMessage) {
            fullPrompt = `${systemMessage}\n\n${prompt}`;
        }
        
        const requestBody = {
            model: this.model,
            prompt: fullPrompt,
            stream: false
        };
        
        console.log('Request body:', requestBody);
        console.log('Full prompt length:', fullPrompt.length);
        
        try {
            console.log('📡 Sending request to Ollama API...');
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            console.log('📥 Response received:', response);
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            if (!response.ok) {
                throw new Error(`API call failed: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📋 Response data:', data);
            const llmResponse = data.response;
            
            // Store the response for debugging
            this.apiResponses.push({
                timestamp: new Date().toISOString(),
                prompt: fullPrompt,
                response: llmResponse,
                model: this.model
            });
            
            console.log('✅ Ollama API response:', llmResponse);
            console.log('📊 Total API responses stored:', this.apiResponses.length);
            return llmResponse;
            
        } catch (error) {
            console.error('❌ Ollama API call failed:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                endpoint: this.apiEndpoint,
                model: this.model
            });
            throw error;
        }
    }
    
    /**
     * Test the connection to Ollama API
     * @returns {Promise<boolean>} - True if connection successful
     */
    async testConnection() {
        console.log('🧪 Testing Ollama API connection...');
        try {
            const testPrompt = LLMPrompts.testPrompts.connectionTest.prompt;
            const response = await this.callLLM(testPrompt, LLMPrompts.testPrompts.connectionTest.systemMessage);
            console.log('✅ Connection test successful:', response);
            return true;
        } catch (error) {
            console.error('❌ Connection test failed:', error);
            return false;
        }
    }

    /**
     * Check if Ollama service is accessible
     * @returns {Promise<boolean>} - True if service is accessible
     */
    async checkServiceStatus() {
        console.log('🔍 Checking Ollama service status...');
        try {
            const response = await fetch('http://localhost:11434/api/tags', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Ollama service is accessible. Available models:', data);
                return true;
            } else {
                console.log('❌ Ollama service responded with status:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Ollama service check failed:', error);
            return false;
        }
    }

    /**
     * Synthesise school facts from multiple sources
     * @param {string} exclusionLetter - Content of the exclusion letter
     * @param {string} schoolFactsInput - Parent's input about school's version
     * @param {string} schoolEvidenceInput - School's evidence
     * @returns {Promise<string>} - Synthesised facts
     */
    async synthesiseSchoolFacts(exclusionLetter, schoolFactsInput, schoolEvidenceInput) {
        const systemMessage = LLMPrompts.systemMessages.schoolFactsSynthesis;
        
        const prompt = LLMPrompts.prompts.synthesiseSchoolFacts
            .replace('{exclusionLetter}', exclusionLetter)
            .replace('{schoolFactsInput}', schoolFactsInput)
            .replace('{schoolEvidenceInput}', schoolEvidenceInput);
        
        return await this.callLLM(prompt, systemMessage);
    }
    
    /**
     * Extract the reason for exclusion from the exclusion letter
     * @param {string} exclusionLetter - Content of the exclusion letter
     * @returns {Promise<string>} - Extracted exclusion reason
     */
    async extractExclusionReason(exclusionLetter) {
        const systemMessage = LLMPrompts.systemMessages.exclusionReasonExtraction;
        
        const prompt = LLMPrompts.prompts.extractExclusionReason
            .replace('{exclusionLetter}', exclusionLetter);
        
        return await this.callLLM(prompt, systemMessage);
    }
    
    /**
     * Synthesise parents facts and student voice information
     * @param {boolean} schoolFactsConfirm - Whether student agrees with school's version
     * @param {string} parentsFactsInput - Student's version of events
     * @param {boolean} parentsFactsWitnessesInput - Whether there are supporting witnesses
     * @param {boolean} isStudentVoiceHeard - Whether school spoke with student before exclusion
     * @returns {Promise<string>} - Synthesised parents facts
     */
    async synthesiseParentsFacts(schoolFactsConfirm, parentsFactsInput, parentsFactsWitnessesInput, isStudentVoiceHeard) {
        const systemMessage = LLMPrompts.systemMessages.studentPerspectiveAnalysis;
        
        const prompt = LLMPrompts.prompts.synthesiseParentsFacts
            .replace('{schoolFactsConfirm}', schoolFactsConfirm ? 'Yes' : 'No')
            .replace('{parentsFactsInput}', parentsFactsInput)
            .replace('{parentsFactsWitnessesInput}', parentsFactsWitnessesInput ? 'Yes' : 'No')
            .replace('{isStudentVoiceHeard}', isStudentVoiceHeard ? 'Yes' : 'No');
        
        return await this.callLLM(prompt, systemMessage);
    }
    
    /**
     * Get the stored API responses for debugging
     * @returns {Array} - Array of stored API responses
     */
    getApiResponses() {
        return this.apiResponses;
    }
    
    /**
     * Clear stored API responses
     */
    clearApiResponses() {
        this.apiResponses = [];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LLMAPI;
} else {
    // Browser environment
    window.LLMAPI = LLMAPI;
}
