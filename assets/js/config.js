// VoxLLM Configuration File
// Customise your GPT-OSS settings here

const VoxLLMConfig = {
    // Self-hosted open source model endpoint
    // This will be your RAG system endpoint
    defaultApiEndpoint: 'https://your-domain.com/api/llm', // Update this to your actual endpoint
    
    // Model identifier for your open source model
    defaultModel: 'vox-legal-ai',
    
    // Available models on your system
    availableModels: [
        'vox-legal-ai',
        'vox-legal-ai-fast',
        'vox-legal-ai-detailed'
    ],
    
    // API call settings
    apiSettings: {
        temperature: 0.3,        // Lower for more consistent responses
        maxTokens: 1000,         // Maximum response length
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
