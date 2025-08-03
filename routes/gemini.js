const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
require('dotenv').config();

router.post('/gemini', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `You're an Islamic assistant. Question: ${prompt}` }] }]
        })
      }
    );

    const data = await response.json();
    if (data.error) {
      console.error('Gemini API error:', data.error);
      return res.status(400).json({ error: data.error.message || 'Gemini API error' });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json({ reply: reply || 'No valid response from Gemini.' });

  } catch (error) {
    console.error('Gemini fetch error:', error);
    res.status(500).json({ error: 'Failed to contact Gemini API' });
  }
});

module.exports = router;
