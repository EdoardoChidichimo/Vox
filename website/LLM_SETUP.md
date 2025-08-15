# VoxLLM - Self-Hosted LLM Setup Guide

## Overview
VoxLLM is configured to work with your self-hosted open source language model and RAG system. This guide explains how to configure the system for your infrastructure.

## Configuration Files

### 1. `assets/js/config.js`
This file contains the main configuration for your LLM system:

```javascript
const VoxLLMConfig = {
    // Update this to your actual endpoint
    defaultApiEndpoint: 'https://your-domain.com/api/llm',
    
    // Model identifier for your system
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
    }
};
```

### 2. `assets/js/llm-api.js`
This file handles all LLM API communication. It's designed to work with standard chat completion APIs.

## Required API Endpoint

Your server must provide an endpoint that accepts POST requests with the following structure:

### Request Format
```json
{
    "model": "vox-legal-ai",
    "messages": [
        {
            "role": "system",
            "content": "System message content"
        },
        {
            "role": "user",
            "content": "User message content"
        }
    ],
    "temperature": 0.3,
    "max_tokens": 1000,
    "top_p": 0.9
}
```

### Response Format
```json
{
    "choices": [
        {
            "message": {
                "content": "LLM response content"
            }
        }
    ]
}
```

## Implementation Steps

### 1. Update Configuration
- Edit `assets/js/config.js`
- Set `defaultApiEndpoint` to your actual API endpoint
- Update `defaultModel` to match your model identifier
- Adjust `availableModels` list as needed

### 2. Server Setup
Ensure your server:
- Accepts POST requests to your LLM endpoint
- Handles CORS if needed (for cross-origin requests)
- Returns responses in the expected format
- Integrates with your RAG system for legal document retrieval

### 3. RAG Integration
Your RAG system should:
- Store UK school exclusion law documents
- Include statutory guidance (behaviour, SEND, suspensions)
- Contain relevant case law and precedents
- Provide context-aware responses based on user queries

## Security Considerations

- No API keys are required (system is self-hosted)
- All communication happens between user's browser and your server
- Consider implementing rate limiting and request validation
- Ensure proper authentication if the system is publicly accessible

## Testing

1. Update the configuration with your endpoint
2. Test the API endpoint independently
3. Verify the chatbot can successfully call your LLM
4. Check that responses are properly formatted and displayed

## Troubleshooting

### Common Issues
- **CORS errors**: Ensure your server allows requests from the VoxLLM domain
- **API format mismatch**: Verify your endpoint returns data in the expected format
- **Timeout issues**: Check if your LLM processing takes longer than expected

### Debug Information
The system logs all API calls and responses. Check the browser console for:
- API request details
- Response data
- Error messages
- Timing information

## Customisation

### Adding New Analysis Types
To add new LLM analysis functions:
1. Add new methods to the `LLMAPI` class in `llm-api.js`
2. Update the `provideCaseSummary` function in `voxllm.js`
3. Add corresponding UI elements if needed

### Modifying Prompts
Edit the system messages and prompts in `llm-api.js` to:
- Adjust the tone and style of responses
- Include specific legal frameworks
- Reference particular guidance documents
- Customise the analysis depth

## Support

For technical support or questions about the LLM integration, contact your development team or refer to your RAG system documentation.
