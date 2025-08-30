# Environment Setup for VoxLLM

This document explains how to configure the API key for different deployment environments.

## Local Development

### Option 1: Environment Variables (Recommended)

1. Create a `.env` file in the project root:
```bash
# Ollama Cloud API Key
OLLAMA_API_KEY=your_ollama_cloud_api_key_here
```

2. If you're using a build tool that supports environment variables, it will automatically pick up the `.env` file.

### Option 2: Browser Console (for static hosting)

1. Open your browser's developer console (F12)
2. Run the following command:
```javascript
setApiKey("your_ollama_cloud_api_key_here")
```
3. Refresh the page

## GitHub Pages Deployment

Since GitHub Pages is a static hosting service, you cannot use server-side environment variables. Use one of these approaches:

### Option 1: Browser Console (Recommended)

1. Deploy your site to GitHub Pages
2. Open the deployed site in your browser
3. Open developer console (F12)
4. Run: `setApiKey("your_ollama_cloud_api_key_here")`
5. Refresh the page

### Option 2: Custom Configuration File

1. Create a `config-override.js` file (add to .gitignore)
2. Add your API key:
```javascript
window.OLLAMA_API_KEY = "your_ollama_cloud_api_key_here";
```
3. Include this file in your HTML before the main scripts

### Option 3: URL Parameter (Less Secure)

You can modify the application to accept the API key as a URL parameter, but this is less secure as it will be visible in the URL.

## Security Notes

- Never commit your API key to version control
- Add `.env` and `config-override.js` to your `.gitignore` file
- Consider using a separate API key for development and production
- Regularly rotate your API keys

## Getting Your Ollama Cloud API Key

1. Visit https://ollama.com
2. Sign up or log in to your account
3. Navigate to your API settings
4. Generate a new API key
5. Copy the key and use it in your configuration

## Troubleshooting

### "No API key found" Warning

If you see this warning in the console, it means the API key hasn't been set properly. Check that:

1. Your `.env` file exists and contains the correct key
2. You've run `setApiKey()` in the browser console

### API Call Failures

If API calls are failing:

1. Check that your API key is valid
2. Verify you have sufficient credits in your Ollama Cloud account
3. Check the browser console for detailed error messages
4. Ensure you're using the correct model name (`gpt-oss:120b`)
