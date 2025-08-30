# VoxLLM - School Exclusion Support System

VoxLLM is an AI-powered companion for navigating school exclusion cases in the UK. It provides personalised guidance and support throughout the exclusion process, combining artificial intelligence with deep knowledge of UK school exclusion law and procedures.

## Features

- **Legal Assessment**: Automatic analysis of cases against stored legislation and guidance
- **Privacy-Focused**: No storage or sharing of personal details
- **Position Statement Generation**: Creates position statements for appeals
- **AI-Powered Analysis**: Uses advanced AI technology for case analysis

## Recent Updates

### Ollama Cloud API Integration

The system has been updated to use Ollama Cloud API instead of local Ollama instances:

- **Model**: `gpt-oss:120b` (upgraded from `gpt-oss:20b`)
- **API Endpoint**: `https://ollama.com/api/chat`
- **Authentication**: API key-based authentication
- **Environment Variables**: Secure API key management

## Setup Instructions

### 1. Get Your Ollama Cloud API Key

1. Visit [https://ollama.com](https://ollama.com)
2. Sign up or log in to your account
3. Navigate to your API settings
4. Generate a new API key

### 2. Configure the API Key

#### For Local Development:
Create a `.env` file in the project root:
```bash
OLLAMA_API_KEY=your_ollama_cloud_api_key_here
```

#### For GitHub Pages:
1. Open your deployed site in a browser
2. Open developer console (F12)
3. Run: `setApiKey("your_ollama_cloud_api_key_here")`
4. Refresh the page

### 3. Testing the API

Use the included test page to verify your setup:
1. Open `test-llm-api.html` in your browser
2. Enter your API key
3. Run the connection tests

## File Structure

```
Vox/
├── assets/
│   ├── js/
│   │   ├── config.js          # Configuration and API key management
│   │   ├── llm-api.js         # Ollama Cloud API integration
│   │   ├── llm-prompts.js     # LLM prompts and system messages
│   │   └── voxllm.js          # Main application logic
│   └── ...
├── documents/                 # Legal documents and templates
├── images/                    # Application images
├── test-llm-api.html         # API testing page
├── voxllm.html               # Main application page
└── ENVIRONMENT_SETUP.md       # Detailed setup instructions
```

## Security Notes

- Never commit API keys to version control
- Add `.env` files to `.gitignore`
- Use separate API keys for development and production
- Regularly rotate your API keys

## Troubleshooting

### Common Issues

1. **"No API key found" Warning**
   - Check that your API key is set correctly
   - Verify the key format matches the expected pattern

2. **API Call Failures**
   - Ensure your Ollama Cloud account has sufficient credits
   - Check the browser console for detailed error messages
   - Verify the model name is correct (`gpt-oss:120b`)

3. **Connection Issues**
   - Test your internet connection
   - Verify the Ollama Cloud service is accessible
   - Check if there are any firewall restrictions

## Support

For detailed setup instructions and troubleshooting, see `ENVIRONMENT_SETUP.md`.

## License

This project is licensed under the terms specified in the LICENSE file.
