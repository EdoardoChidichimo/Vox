// Configuration for VoxLLM
// This file contains configuration settings that can be modified for different environments

const VoxConfig = {
    // LLM Configuration
    llm: {
        // Default model to use
        defaultModel: 'gpt-oss:120b',
        
        // Default temperature for responses
        defaultTemperature: 0.2,
        
        // API key configuration
        // For local development: Set OLLAMA_API_KEY environment variable
        // For GitHub Pages: Set window.OLLAMA_API_KEY in browser console or use a config override
        apiKey: null, // Will be set dynamically
        
        // Ollama Cloud host
        host: 'https://ollama.com'
    },
    
    // Application settings
    app: {
        // Debug mode
        debug: true,
        
        // Maximum number of API responses to store
        maxStoredResponses: 50,
        
        // Timeout for API calls (in milliseconds)
        apiTimeout: 30000
    }
};

// Function to set API key dynamically
// This can be called from browser console or from another script
function setApiKey(apiKey) {
    if (typeof window !== 'undefined') {
        window.OLLAMA_API_KEY = apiKey;
        console.log('✅ API key set successfully');
    }
}

// Function to get API key with fallback
function getApiKey() {
    // Try to get from window object first (for browser environment)
    if (typeof window !== 'undefined' && window.OLLAMA_API_KEY) {
        return window.OLLAMA_API_KEY;
    }
    
    // Try to get from environment variable (for Node.js environment)
    if (typeof process !== 'undefined' && process.env && process.env.OLLAMA_API_KEY) {
        return process.env.OLLAMA_API_KEY;
    }
    
    // Return null if no key found
    return null;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VoxConfig, setApiKey, getApiKey };
} else {
    // Browser environment
    window.VoxConfig = VoxConfig;
    window.setApiKey = setApiKey;
    window.getApiKey = getApiKey;
    
    // Log configuration instructions
    console.log('🔧 VoxLLM Configuration Loaded');
    console.log('📝 To set your API key for GitHub Pages:');
    console.log('   1. Open browser console (F12)');
    console.log('   2. Run: setApiKey("your-api-key-here")');
    console.log('   3. Refresh the page');
    console.log('');
    console.log('🔐 For local development, set OLLAMA_API_KEY environment variable');
}
