// LLM API Handler for VoxLLM
// Handles communication with GPT-OSS for case analysis and synthesis

class LLMAPI {
    constructor() {
        // Configuration for self-hosted open source model
        this.apiEndpoint = VoxLLMConfig.defaultApiEndpoint;
        this.model = VoxLLMConfig.defaultModel;
        
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
     * Make a call to the LLM API
     * @param {string} prompt - The prompt to send to the LLM
     * @param {string} systemMessage - Optional system message
     * @returns {Promise<string>} - The LLM response
     */
    async callLLM(prompt, systemMessage = null) {
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
            temperature: VoxLLMConfig.apiSettings.temperature,
            max_tokens: VoxLLMConfig.apiSettings.maxTokens,
            top_p: VoxLLMConfig.apiSettings.topP
        };
        
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                    // No API key required for self-hosted system
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`API call failed: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            const llmResponse = data.choices[0].message.content;
            
            // Store the response for debugging
            this.apiResponses.push({
                timestamp: new Date().toISOString(),
                prompt: prompt,
                response: llmResponse,
                model: this.model
            });
            
            return llmResponse;
            
        } catch (error) {
            console.error('LLM API call failed:', error);
            throw error;
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
        const systemMessage = `You are a legal expert specialising in UK school exclusion law. Your role is to synthesise information from multiple sources to create a clear, factual summary of the school's position in an exclusion case. Be objective, accurate, and focus on identifying key facts and evidence.`;
        
        const prompt = `Please synthesise the following information about a school exclusion case to create a clear summary of the school's position:

EXCLUSION LETTER CONTENT:
${exclusionLetter}

SCHOOL'S VERSION OF EVENTS (from parent input):
${schoolFactsInput}

SCHOOL'S EVIDENCE:
${schoolEvidenceInput}

Please provide a synthesised summary that:
1. Identifies the key facts presented by the school
2. Highlights any inconsistencies or gaps in the information
3. Summarises the evidence provided
4. Presents the information in a clear, structured format

Focus on factual accuracy and avoid speculation. If there are contradictions between sources, note them clearly.`;
        
        return await this.callLLM(prompt, systemMessage);
    }
    
    /**
     * Extract the reason for exclusion from the exclusion letter
     * @param {string} exclusionLetter - Content of the exclusion letter
     * @returns {Promise<string>} - Extracted exclusion reason
     */
    async extractExclusionReason(exclusionLetter) {
        const systemMessage = `You are a legal expert specialising in UK school exclusion law. Your role is to extract and clearly state the specific reason(s) given for a school exclusion from official documentation. Be precise and identify all stated reasons.`;
        
        const prompt = `Please extract the specific reason(s) given for the school exclusion from the following exclusion letter:

EXCLUSION LETTER:
${exclusionLetter}

Please:
1. Identify and list all stated reasons for the exclusion
2. Quote the exact language used in the letter where possible
3. Categorise the reasons (e.g., behavioural, academic, safety concerns)
4. Note if the exclusion is permanent or fixed-term
5. Identify any specific incidents or dates mentioned

Present your response in a clear, structured format.`;
        
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
        const systemMessage = `You are a legal expert specialising in UK school exclusion law. Your role is to synthesise information about the student's perspective and whether proper procedures were followed. Focus on identifying potential procedural breaches and the strength of the student's case.`;
        
        const prompt = `Please synthesise the following information about a school exclusion case from the student's perspective:

STUDENT AGREES WITH SCHOOL'S VERSION: ${schoolFactsConfirm ? 'Yes' : 'No'}

STUDENT'S VERSION OF EVENTS: ${parentsFactsInput}

WITNESSES AVAILABLE: ${parentsFactsWitnessesInput ? 'Yes' : 'No'}

STUDENT VOICE HEARD BEFORE EXCLUSION: ${isStudentVoiceHeard ? 'Yes' : 'No'}

Please provide a synthesised analysis that:
1. Identifies any contradictions between school and student versions
2. Assesses the strength of the student's position
3. Highlights potential procedural breaches (especially regarding student voice)
4. Notes the availability and potential impact of witnesses
5. Identifies key legal issues that may arise

Present your response in a clear, structured format focusing on legal implications.`;
        
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
