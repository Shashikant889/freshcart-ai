const express = require('express');
const router = express.Router();
const { processAssistantQuery, RECIPE_KNOWLEDGE_BASE } = require('../ml/recipe-assistant');
const { processAgenticChat, resetSession, getOrCreateSession } = require('../services/chatbot-agent');
const { optionalAuth } = require('../middleware/auth');
const aiClient = require('../services/ai-client');

// POST /api/assistant/chat - Conversational Agentic AI query with Real Backend Tools & Guardrails
router.post('/chat', optionalAuth, async (req, res) => {
  const { message, conversationId = 'default', context = {} } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  const userId = req.user ? req.user.id : null;
  const sessionId = req.headers['x-session-id'] || req.body.sessionId || 'default';

  try {
    const agentResult = await processAgenticChat({
      message: message.trim(),
      conversationId,
      context,
      userId,
      sessionId
    });

    // If RAG result is needed for academic benchmarks or compatibility
    if (!agentResult.rag && agentResult.intent === 'POLICY_RAG') {
      try {
        const ragRes = await aiClient.queryRAG({ query: message });
        agentResult.rag = {
          engine: ragRes.engine,
          citations: ragRes.citations,
          confidenceScore: ragRes.confidenceScore,
          abstention: ragRes.abstention,
          retrievalMethod: ragRes.retrievalMethod,
          isFallback: ragRes.isFallback
        };
      } catch (e) {}
    }

    res.json({
      success: true,
      data: agentResult
    });
  } catch (err) {
    // Graceful fallback to legacy recipe parser if an unexpected error occurs
    const fallbackResult = processAssistantQuery(message);
    res.json({
      success: true,
      data: {
        message: fallbackResult.reply || fallbackResult.message || 'I am your FreshCart AI assistant. How can I help you today?',
        reply: fallbackResult.reply || fallbackResult.message || 'I am your FreshCart AI assistant. How can I help you today?',
        type: fallbackResult.type || 'general',
        recipe: fallbackResult.recipe || null,
        items: fallbackResult.items || (fallbackResult.recipe ? fallbackResult.recipe.items : []),
        isFallback: true,
        error: err.message
      }
    });
  }
});

// POST /api/assistant/chat/stream - Server-Sent Events (SSE) Streaming Response
router.post('/chat/stream', optionalAuth, async (req, res) => {
  const { message, conversationId = 'default', context = {} } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  const userId = req.user ? req.user.id : null;
  const sessionId = req.headers['x-session-id'] || req.body.sessionId || 'default';

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    sendEvent('status', { phase: 'thinking', message: 'Analyzing request and selecting tools...' });

    const agentResult = await processAgenticChat({
      message: message.trim(),
      conversationId,
      context,
      userId,
      sessionId,
      onToolCall: (toolName) => {
        sendEvent('tool_call', { tool: toolName, message: `Executing tool: ${toolName}` });
      }
    });

    const fullText = agentResult.message || '';
    if (fullText.length > 0) {
      const words = fullText.split(' ');
      for (let i = 0; i < words.length; i += 4) {
        const chunk = words.slice(i, i + 4).join(' ') + (i + 4 < words.length ? ' ' : '');
        sendEvent('chunk', { text: chunk });
        await new Promise(r => setTimeout(r, 12));
      }
    }

    sendEvent('done', agentResult);
    res.end();
  } catch (err) {
    sendEvent('error', { error: err.message });
    res.end();
  }
});

// POST /api/assistant/action/confirm - Confirm and execute pending high-impact or shopping action
router.post('/action/confirm', optionalAuth, async (req, res) => {
  const { conversationId = 'default', confirmed = true } = req.body;
  const userId = req.user ? req.user.id : null;
  const sessionId = req.headers['x-session-id'] || 'default';

  try {
    const actionText = confirmed ? 'yes, confirm action' : 'cancel action';
    const result = await processAgenticChat({
      message: actionText,
      conversationId,
      userId,
      sessionId
    });

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/assistant/reset - Clear conversational short-term memory
router.post('/reset', (req, res) => {
  const { conversationId = 'default' } = req.body;
  const cleared = resetSession(conversationId);
  res.json({
    success: true,
    message: cleared ? `Conversation session ${conversationId} reset.` : 'Session was already clean.'
  });
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
