const express = require('express');
const router = express.Router();
const aiClient = require('../services/ai-client');
const { SCENE_PRESETS } = require('../ml/fridge-vision-ai');

// POST /api/visual/search - Visual image query match
router.post('/search', async (req, res) => {
  const { queryHint = 'red apple fruit', top_k = 4 } = req.body;
  try {
    const result = await aiClient.searchVisualProducts({ queryHint, topK: top_k });
    res.json({
      success: true,
      queryHint: result.queryHint,
      algorithm: 'Computer Vision (5-Channel Color Moments + Cosine Distance)',
      engine: result.engine,
      isFallback: result.isFallback,
      data: result.matches
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/visual/fridge-presets - List available fridge/pantry scan scenes
router.get('/fridge-presets', (req, res) => {
  res.json({
    success: true,
    presets: Object.keys(SCENE_PRESETS).map(key => ({
      key,
      name: SCENE_PRESETS[key].name,
      description: SCENE_PRESETS[key].description,
      confidence: SCENE_PRESETS[key].confidence
    }))
  });
});

// POST /api/visual/smart-fridge-scan - Multimodal fridge image & pantry scanner
router.post('/smart-fridge-scan', async (req, res) => {
  try {
    const sceneKey = req.body.presetKey || req.body.scene_key || 'breakfast_depleted';
    const result = await aiClient.scanFridgeInventory({ sceneKey });
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;


