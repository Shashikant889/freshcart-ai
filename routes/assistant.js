const express = require('express');
const router = express.Router();
const { processAssistantQuery, RECIPE_KNOWLEDGE_BASE } = require('../ml/recipe-assistant');
const aiClient = require('../services/ai-client');

// POST /api/assistant/chat - Conversational AI query with RAG + Meal Planner
router.post('/chat', async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  try {
    // 1. Run local RAG retrieval & generation
    const ragResult = await aiClient.queryRAG({ query: message });

    // 2. Check if query matches meal / recipe intents
    const recipeResult = processAssistantQuery(message);
    const hasRecipeMatch = recipeResult && (recipeResult.type === 'recipe' || (recipeResult.recipe && recipeResult.recipe.items && recipeResult.recipe.items.length > 0));


    let finalResponse = {
      type: hasRecipeMatch ? (recipeResult.type || 'recipe') : 'rag',
      message: ragResult.answer,
      rag: {
        engine: ragResult.engine,
        citations: ragResult.citations,
        confidenceScore: ragResult.confidenceScore,
        abstention: ragResult.abstention,
        retrievalMethod: ragResult.retrievalMethod,
        isFallback: ragResult.isFallback
      }
    };

    // If recipe matched, attach cart recipe payload
    if (hasRecipeMatch) {
      finalResponse.recipe = recipeResult.recipe;
      finalResponse.items = recipeResult.items || (recipeResult.recipe ? recipeResult.recipe.items : []);
      finalResponse.totalEstimatedCost = recipeResult.totalEstimatedCost || (recipeResult.recipe ? recipeResult.recipe.totalCost : 0);
      finalResponse.diet = recipeResult.diet;
      if (ragResult.abstention || !ragResult.citations || ragResult.citations.length === 0) {
        finalResponse.message = recipeResult.message;
      }
    } else if (ragResult.abstention) {
      finalResponse.message = recipeResult.message || ragResult.answer;
    }


    res.json({
      success: true,
      data: finalResponse
    });
  } catch (err) {
    const fallbackResult = processAssistantQuery(message);
    res.json({
      success: true,
      data: fallbackResult
    });
  }
});

// POST /api/assistant/rag - Explicit RAG Query API
router.post('/rag', async (req, res) => {
  const { query, top_k } = req.body;
  if (!query || !query.trim()) {
    return res.status(400).json({ success: false, message: 'Query is required' });
  }
  const result = await aiClient.queryRAG({ query, topK: top_k || 3 });
  res.json({ success: true, data: result });
});

// GET /api/assistant/recipes - List all pre-configured recipes
router.get('/recipes', (req, res) => {
  res.json({
    success: true,
    data: RECIPE_KNOWLEDGE_BASE
  });
});

module.exports = router;

