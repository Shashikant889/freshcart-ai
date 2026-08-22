const express = require('express');
const router = express.Router();
const { matchImageToProducts } = require('../ml/visual-search');
const { analyzeFridgeImage, SCENE_PRESETS } = require('../ml/fridge-vision-ai');

// POST /api/visual/search - Visual image query match
router.post('/search', (req, res) => {
  const { queryHint = 'red apple fruit' } = req.body;
  const matches = matchImageToProducts(queryHint, 4);
  res.json({
    success: true,
    queryHint,
    algorithm: 'Computer Vision (Dominant RGB Histogram + Visual Cosine Similarity)',
    data: matches
  });
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
router.post('/smart-fridge-scan', (req, res) => {
  try {
    const result = analyzeFridgeImage(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

