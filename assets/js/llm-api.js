// LLM API Handler for VoxLLM
// Handles communication with Ollama Cloud for case analysis and synthesis

class LLMAPI {
    constructor() {
        // Configuration for Ollama Cloud API
        this.host = typeof VoxConfig !== 'undefined' ? VoxConfig.llm.host : 'https://ollama.com';
        this.model = typeof VoxConfig !== 'undefined' ? VoxConfig.llm.defaultModel : 'gpt-oss:120b';
        
        // CORS proxy for browser requests (optional)
        this.useCorsProxy = true; // Set to false to disable proxy
        this.useLocalProxy = true; // Use local proxy server instead of CORS proxy
        
        // Get API key from environment variable or fallback
        this.apiKey = this.getApiKey();
        
        // Store API responses for debugging and reference
        this.apiResponses = [];
    }
    
    /**
     * Get API key from environment variable or fallback
     * @returns {string} - The API key
     */
    getApiKey() {
        // Try to get from configuration system first
        if (typeof getApiKey === 'function') {
            const configKey = getApiKey();
            if (configKey) {
                return configKey;
            }
        }
        
        // Try to get from environment variable
        if (typeof process !== 'undefined' && process.env && process.env.OLLAMA_API_KEY) {
            return process.env.OLLAMA_API_KEY;
        }
        
        // For browser environment, try to get from a global variable
        if (typeof window !== 'undefined' && window.OLLAMA_API_KEY) {
            return window.OLLAMA_API_KEY;
        }
        
        // Fallback to a default key (this should be overridden in production)
        console.warn('⚠️ No API key found in environment variables. Using fallback key.');
        return 'dbc56a448a8a48d39c6982bf59d5c731.qhdWodXgEf_tLKbJAEwqlgkY';
    }
    
    /**
     * Set the model to use for API calls
     * @param {string} model - The model identifier
     */
    setModel(model) {
        this.model = model;
    }
    
    /**
     * Set the API key
     * @param {string} apiKey - The API key
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }
    
    /**
     * Make a call to the Ollama Cloud API
     * @param {string} prompt - The prompt to send to the LLM
     * @param {string} systemMessage - Optional system message
     * @param {number} temperature - Temperature for response generation
     * @returns {Promise<string>} - The LLM response
     */
    async callLLM(prompt, systemMessage = null, temperature = null) {
        // Use default temperature from config if not provided
        if (temperature === null) {
            temperature = typeof VoxConfig !== 'undefined' ? VoxConfig.llm.defaultTemperature : 0.7;
        }
        console.log('🔍 LLM API call initiated');
        console.log('Model:', this.model);
        console.log('Host:', this.host);
        console.log('Prompt length:', prompt.length);
        console.log('System message:', systemMessage);
        console.log('Temperature:', temperature);
        
        const messages = [];
        
        // Add system message if provided
        if (systemMessage) {
            messages.push({
                role: 'system',
                content: systemMessage
            });
        }
        
        // Add user message
        messages.push({
            role: 'user',
            content: prompt
        });
        
        const requestBody = {
            model: this.model,
            messages: messages,
            stream: false,
            options: {
                temperature: temperature
            }
        };
        
        console.log('Request body:', requestBody);
        
        try {
            console.log('📡 Sending request to Ollama Cloud API...');
            
            // Use local proxy server if enabled and in browser environment
            let apiUrl = `${this.host}/api/chat`;
            let useProxy = false;
            
            if (this.useLocalProxy && typeof window !== 'undefined') {
                apiUrl = `http://localhost:3000/api/ollama-proxy`;
                useProxy = true;
                console.log('🔗 Using local proxy server:', apiUrl);
            } else if (this.useCorsProxy && typeof window !== 'undefined') {
                apiUrl = `https://cors-anywhere.herokuapp.com/${this.host}/api/chat`;
                console.log('🔗 Using CORS proxy:', apiUrl);
            }
            
            let response;
            if (useProxy) {
                // Use local proxy server
                response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        endpoint: '/api/chat',
                        apiKey: this.apiKey,
                        requestBody: requestBody
                    })
                });
            } else {
                // Direct API call
                response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': this.apiKey
                    },
                    body: JSON.stringify(requestBody)
                });
            }
            
            console.log('📥 Response received:', response);
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
            }
            
            const data = await response.json();
            console.log('📋 Response data:', data);
            const llmResponse = data.message.content;
            
            // Store the response for debugging
            this.apiResponses.push({
                timestamp: new Date().toISOString(),
                prompt: prompt,
                systemMessage: systemMessage,
                response: llmResponse,
                model: this.model,
                temperature: temperature
            });
            
            console.log('✅ Ollama Cloud API response:', llmResponse);
            console.log('📊 Total API responses stored:', this.apiResponses.length);
            return llmResponse;
            
        } catch (error) {
            console.error('❌ Ollama Cloud API call failed:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                host: this.host,
                model: this.model
            });
            throw error;
        }
    }
    
    /**
     * Test the connection to Ollama Cloud API
     * @returns {Promise<boolean>} - True if connection successful
     */
    async testConnection() {
        console.log('🧪 Testing Ollama Cloud API connection...');
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
     * Check if Ollama Cloud service is accessible
     * @returns {Promise<boolean>} - True if service is accessible
     */
    async checkServiceStatus() {
        console.log('🔍 Checking Ollama Cloud service status...');
        try {
            // Use local proxy server if enabled and in browser environment
            let apiUrl = `${this.host}/api/tags`;
            let useProxy = false;
            
            if (this.useLocalProxy && typeof window !== 'undefined') {
                apiUrl = `http://localhost:3000/api/ollama-status?apiKey=${encodeURIComponent(this.apiKey)}`;
                useProxy = true;
                console.log('🔗 Using local proxy server for status check:', apiUrl);
            } else if (this.useCorsProxy && typeof window !== 'undefined') {
                apiUrl = `https://cors-anywhere.herokuapp.com/${this.host}/api/tags`;
                console.log('🔗 Using CORS proxy for status check:', apiUrl);
            }
            
            let response;
            if (useProxy) {
                // Use local proxy server
                response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            } else {
                // Direct API call
                response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': this.apiKey
                    }
                });
            }
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Ollama Cloud service is accessible. Available models:', data);
                return true;
            } else {
                console.log('❌ Ollama Cloud service responded with status:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Ollama Cloud service check failed:', error);
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
