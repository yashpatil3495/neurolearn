// server.js — Express backend: serves static files + proxies Claude API calls
require('dotenv').config();
const express = require('express');
const fetch   = require('node-fetch');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// Parse incoming JSON request bodies
app.use(express.json());

// Serve all frontend files (HTML, CSS, JS, lessons) as static assets
app.use(express.static(path.join(__dirname)));

// POST /api/adapt — receives emotion + lesson context, returns Claude-adapted text
app.post('/api/adapt', async (req, res) => {
  const { emotion, topic, currentText } = req.body;

  // Build an emotion-specific instruction to guide Claude's tone and approach
  const emotionInstructions = {
    confused:    'Simplify the explanation significantly and use a relatable real-world analogy.',
    bored:       'Add an interesting surprising fun fact or pose a quick quiz question to re-engage.',
    frustrated:  'Gently suggest a 30-second mental break, then re-explain the concept calmly and simply.',
    focused:     'Go deeper — add an advanced insight, a challenge question, or a fascinating extension of the concept.'
  };

  const instruction = emotionInstructions[emotion] || 'Explain clearly and encouragingly.';

  // Construct the prompt sent to Claude
  const prompt = `You are a patient, adaptive tutor. The student is learning about ${topic}. They currently appear ${emotion}. ${instruction} The current lesson content is: '${currentText}'. Rewrite this content in 3-4 sentences adapted to their emotional state. Be warm, clear, and encouraging. Return only the adapted lesson text, no extra commentary.`;

  try {
    // Call the Claude API using the key stored securely in .env
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages:   [{ role: 'user', content: prompt }]
      })
    });

    const data        = await response.json();
    const adaptedText = data?.content?.[0]?.text?.trim();
    if (!adaptedText) throw new Error('Empty response from Claude');

    res.json({ adaptedText });

  } catch (err) {
    // On any failure, fall back gracefully to the original lesson text
    console.error('Claude API error:', err.message);
    res.json({ adaptedText: currentText });
  }
});

// Start listening
app.listen(PORT, () => {
  console.error(`NeuroLearn running at http://localhost:${PORT}`);
});
