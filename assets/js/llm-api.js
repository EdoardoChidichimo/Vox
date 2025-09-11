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
        
        // Try to get from environment variable (check both hyphenated and underscore versions)
        if (typeof process !== 'undefined' && process.env) {
            // Check for hyphenated version first (OLLAMA-API-KEY)
            
            if (process.env['OLLAMA_API_KEY']) {
                console.log('✅ Found API key in OLLAMA_API_KEY environment variable');
                return process.env['OLLAMA_API_KEY'];
            }
            
            // Check for underscore version (OLLAMA_API_KEY)
            if (process.env.OLLAMA_API_KEY) {
                console.log('✅ Found API key in OLLAMA_API_KEY environment variable');
                return process.env.OLLAMA_API_KEY;
            }
        }
        
        // For browser environment, try to get from a global variable
        if (typeof window !== 'undefined') {
            if (window['OLLAMA-API-KEY']) {
                console.log('✅ Found API key in window.OLLAMA-API-KEY');
                return window['OLLAMA-API-KEY'];
            }
            if (window.OLLAMA_API_KEY) {
                console.log('✅ Found API key in window.OLLAMA_API_KEY');
                return window.OLLAMA_API_KEY;
            }
        }
        
        // Fallback to a default key (this should be overridden in production)
        console.warn('⚠️ No API key found in environment variables (OLLAMA-API-KEY or OLLAMA_API_KEY). Using fallback key.');
        console.log('💡 Make sure to set your API key using: export OLLAMA-API-KEY="your_api_key_here"');
        return '';
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
        console.log('System message length:', systemMessage ? systemMessage.length : 0);
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
        
        // Calculate payload size for monitoring
        const payloadSize = JSON.stringify(requestBody).length;
        console.log('📊 Estimated payload size:', payloadSize, 'bytes');
        if (payloadSize > 100000) {
            console.warn('⚠️ Large payload detected! Size:', Math.round(payloadSize / 1024), 'KB');
        }
        
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
            // Access LLMPrompts from window object in browser environment
            const prompts = typeof window !== 'undefined' ? window.LLMPrompts : LLMPrompts;
            const testPrompt = prompts.testPrompts.connectionTest.prompt;
            const response = await this.callLLM(testPrompt, prompts.testPrompts.connectionTest.systemMessage);
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
     * @param {string} exclusionLetterContent - Content of the exclusion letter
     * @param {string} schoolVersionEvents - School's version of events
     * @param {string} schoolEvidence - School's evidence
     * @returns {Promise<string>} - Synthesised facts
     */
    async synthesiseSchoolFacts(exclusionLetterContent, schoolVersionEvents, schoolEvidence) {
        const prompts = typeof window !== 'undefined' ? window.LLMPrompts : LLMPrompts;
        const systemMessage = prompts.systemMessages.schoolFactsSynthesis;
        
        const prompt = prompts.prompts.synthesiseSchoolFacts
            .replace('{exclusionLetterContent}', exclusionLetterContent)
            .replace('{schoolVersionEvents}', schoolVersionEvents)
            .replace('{schoolEvidence}', schoolEvidence);
        
        return await this.callLLM(prompt, systemMessage);
    }
    
    /**
     * Extract the reason for exclusion from the exclusion letter
     * @param {string} exclusionLetterContent - Content of the exclusion letter
     * @returns {Promise<string>} - Extracted exclusion reason
     */
    async extractExclusionReason(exclusionLetterContent) {
        const prompts = typeof window !== 'undefined' ? window.LLMPrompts : LLMPrompts;
        const systemMessage = prompts.systemMessages.exclusionReasonExtraction;
        
        const prompt = prompts.prompts.extractExclusionReason
            .replace('{exclusionLetterContent}', exclusionLetterContent);
        
        return await this.callLLM(prompt, systemMessage);
    }
    
    /**
     * Synthesise parents facts and student voice information
     * @param {boolean} studentAgreesWithSchool - Whether student agrees with school's version
     * @param {string} studentVersionEvents - Student's version of events
     * @param {string} witnessesDetails - Details about witnesses
     * @param {string} studentVoiceHeardDetails - Details about whether student voice was heard
     * @returns {Promise<string>} - Synthesised parents facts
     */
    async synthesiseParentsFacts(studentAgreesWithSchool, studentVersionEvents, witnessesDetails, studentVoiceHeardDetails) {
        const prompts = typeof window !== 'undefined' ? window.LLMPrompts : LLMPrompts;
        const systemMessage = prompts.systemMessages.studentPerspectiveAnalysis;
        
        const prompt = prompts.prompts.synthesiseParentsFacts
            .replace('{studentAgreesWithSchool}', studentAgreesWithSchool ? 'Yes' : 'No')
            .replace('{studentVersionEvents}', studentVersionEvents)
            .replace('{witnessesDetails}', witnessesDetails)
            .replace('{studentVoiceHeardDetails}', studentVoiceHeardDetails);
        
        return await this.callLLM(prompt, systemMessage);
    }
    
    /**
     * Intelligently chunk large text documents to reduce payload size
     * @param {string} text - The text to chunk
     * @param {number} maxLength - Maximum length per chunk (default: 15000 chars)
     * @returns {string} - Truncated or summarised text
     */
    chunkLargeDocument(text, maxLength = 15000) {
        if (text.length <= maxLength) {
            return text;
        }
        
        console.log(`📄 Document too large (${text.length} chars), chunking to ${maxLength} chars`);
        
        // For structured documents, try to keep important sections
        const lines = text.split('\n');
        let result = '';
        let currentLength = 0;
        
        // Prioritise headings and first paragraphs of sections
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Always include headings (markdown style or numbered)
            if (trimmedLine.startsWith('#') || 
                trimmedLine.startsWith('##') || 
                /^\d+\./.test(trimmedLine) ||
                trimmedLine.toUpperCase() === trimmedLine && trimmedLine.length < 100) {
                
                if (currentLength + line.length < maxLength) {
                    result += line + '\n';
                    currentLength += line.length + 1;
                } else {
                    break;
                }
            }
            // Include content lines until we hit the limit
            else if (trimmedLine.length > 0) {
                if (currentLength + line.length < maxLength) {
                    result += line + '\n';
                    currentLength += line.length + 1;
                } else {
                    break;
                }
            }
        }
        
        result += '\n\n[Document truncated to fit payload limits. Original length: ' + text.length + ' characters]';
        
        console.log(`📄 Document chunked from ${text.length} to ${result.length} characters`);
        return result;
    }

    /**
     * Generate position statement document
     * @param {string} exclusionReason - The reason for exclusion
     * @param {string} synthesisedSchoolFacts - School's synthesised facts
     * @param {string} synthesisedParentsFacts - Student perspective analysis
     * @param {string} backgroundSummary - Child background summary
     * @param {string} suspensionsGuidance - Content from suspensions.txt
     * @param {string} behaviourInSchoolsGuidance - Content from behaviour_in_schools.txt
     * @param {string} positionStatementGrounds - JSON content from position_statement_grounds.json
     * @param {string} stageInfo - Stage information and procedural details
     * @param {string} otherInformationProvided - Any additional information provided by the user
     * @returns {Promise<string>} - Generated position statement
     */
    async generatePositionStatement(exclusionReason, synthesisedSchoolFacts, synthesisedParentsFacts, backgroundSummary, suspensionsGuidance, behaviourInSchoolsGuidance, positionStatementGrounds, stageInfo, otherInformationProvided) {
        const prompts = typeof window !== 'undefined' ? window.LLMPrompts : LLMPrompts;
        const systemMessage = prompts.systemMessages.legalExpert;
        
        // Chunk large documents to prevent payload size issues
        const chunkedSuspensionsGuidance = this.chunkLargeDocument(suspensionsGuidance, 20000);
        const chunkedBehaviourGuidance = this.chunkLargeDocument(behaviourInSchoolsGuidance, 15000);
        const chunkedPositionGrounds = this.chunkLargeDocument(positionStatementGrounds, 25000);
        
        console.log('📊 Document sizes after chunking:');
        console.log('- Suspensions guidance:', chunkedSuspensionsGuidance.length, 'chars');
        console.log('- Behaviour guidance:', chunkedBehaviourGuidance.length, 'chars');
        console.log('- Position grounds:', chunkedPositionGrounds.length, 'chars');
        console.log('- Total guidance content:', 
            chunkedSuspensionsGuidance.length + chunkedBehaviourGuidance.length + chunkedPositionGrounds.length, 'chars');
        
        const prompt = prompts.prompts.generatePositionStatement
            .replace('{exclusionReason}', exclusionReason)
            .replace('{synthesisedSchoolFacts}', synthesisedSchoolFacts)
            .replace('{synthesisedParentsFacts}', synthesisedParentsFacts)
            .replace('{backgroundSummary}', backgroundSummary)
            .replace('{suspensionsGuidance}', chunkedSuspensionsGuidance)
            .replace('{behaviourInSchoolsGuidance}', chunkedBehaviourGuidance)
            .replace('{positionStatementGrounds}', chunkedPositionGrounds)
            .replace('{stageInfo}', stageInfo)
            .replace('{otherInformationProvided}', otherInformationProvided);
        
        return await this.callLLM(prompt, systemMessage);
    }
    
    /**
     * Format position statement into structured JSON format
     * @param {string} positionStatement - The raw position statement text
     * @returns {Promise<string>} - Formatted JSON string
     */
    async formatPositionStatement(positionStatement) {
        const prompts = typeof window !== 'undefined' ? window.LLMPrompts : LLMPrompts;
        const systemMessage = prompts.systemMessages.legalExpert;
        
        const prompt = prompts.prompts.formatPositionStatement
            .replace('{positionStatement}', positionStatement);
        
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
