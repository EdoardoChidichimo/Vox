const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

// Serve static files
app.use(express.static('.'));

// Parse JSON bodies with increased limit for large documents
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Proxy endpoint for Ollama Cloud API
app.post('/api/ollama-proxy', async (req, res) => {
    try {
        const { endpoint, apiKey, requestBody } = req.body;
        
        console.log('🔄 Proxying request to Ollama Cloud:', endpoint);
        
        const response = await fetch(`https://ollama.com${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': apiKey
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Ollama API error:', errorText);
            return res.status(response.status).json({ error: errorText });
        }
        
        const data = await response.json();
        console.log('✅ Ollama API response received');
        res.json(data);
        
    } catch (error) {
        console.error('❌ Proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Proxy endpoint for status check
app.get('/api/ollama-status', async (req, res) => {
    try {
        const { apiKey } = req.query;
        
        console.log('🔍 Checking Ollama Cloud status...');
        
        const response = await fetch('https://ollama.com/api/tags', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': apiKey
            }
        });
        
        if (!response.ok) {
            return res.status(response.status).json({ error: 'Service check failed' });
        }
        
        const data = await response.json();
        console.log('✅ Ollama Cloud status check successful');
        res.json(data);
        
    } catch (error) {
        console.error('❌ Status check error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'VoxLLM proxy server is running' });
});

app.listen(PORT, () => {
    console.log(`🚀 VoxLLM proxy server running on http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${path.resolve('.')}`);
    console.log(`🔗 Test page: http://localhost:${PORT}/test-llm-api.html`);
    console.log(`🔗 Main app: http://localhost:${PORT}/voxllm.html`);
});
