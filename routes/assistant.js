const express = require('express');
const router = express.Router();
const { processAssistantQuery, RECIPE_KNOWLEDGE_BASE } = require('../ml/recipe-assistant');

// POST /api/assistant/chat - Conversational AI query
router.post('/chat', (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  const result = processAssistantQuery(message);
  res.json({
    success: true,
    data: result
  });
});

// GET /api/assistant/recipes - List all pre-configured recipes
router.get('/recipes', (req, res) => {
  res.json({
    success: true,
    data: RECIPE_KNOWLEDGE_BASE
  });
});

module.exports = router;
