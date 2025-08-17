// VoxLLM Configuration File
// Customise your Ollama settings here

const VoxLLMConfig = {
    // Ollama API endpoint
    defaultApiEndpoint: 'http://localhost:11434/api/generate',
    
    // Model identifier for Ollama
    defaultModel: 'gpt-oss:20b',
    
    // Available models on your Ollama system
    availableModels: [
        'gpt-oss:20b',
        'llama2:13b',
        'mistral:7b',
        'codellama:13b'
    ],
    
    // API call settings (Ollama specific)
    apiSettings: {
        stream: false,           // Disable streaming for consistent responses
        temperature: 0.3,        // Lower for more consistent responses
        topP: 0.9               // Nucleus sampling parameter
    },
    
    // Chatbot settings
    chatbot: {
        messageDelay: 1000,     // Delay between messages (ms)
        typingIndicator: true,   // Show typing indicators
        autoScroll: true         // Auto-scroll to bottom
    },
    
    // Legal analysis settings
    legalAnalysis: {
        enableDetailedAnalysis: true,
        includeCaseLaw: true,
        includeStatutoryGuidance: true
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoxLLMConfig;
} else {
    // Browser environment
    window.VoxLLMConfig = VoxLLMConfig;
}
