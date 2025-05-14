const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Mock API endpoints for different LLMs
const LLM_ENDPOINTS = {
  chatgpt: 'https://api.openai.com/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/v1/chat',
  claude: 'https://api.anthropic.com/v1/complete',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
};

// Route to handle all LLM requests
app.post('/api/query', async (req, res) => {
  const { prompt, llm } = req.body;
  
  if (!prompt || !llm) {
    return res.status(400).json({ error: 'Prompt and LLM selection are required' });
  }
  
  try {
    // In a real implementation, you would make actual API calls here
    // For now, we'll just simulate a response
    const response = {
      id: `mock_${Date.now()}`,
      content: `This is a mock response from ${llm} for: "${prompt}"`,
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});