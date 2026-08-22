const express = require('express');
const router = express.Router();
const { analyzeCartNutrition, PRODUCT_NUTRITION_PROFILES } = require('../ml/nutrition-advisor');
const { getActiveFlashDeals } = require('../ml/flash-sale-ai');

// POST /api/nutrition/analyze - Analyze cart items for nutrition & allergens
router.post('/analyze', (req, res) => {
  const { items = [], allergies = [] } = req.body;
  try {
    const analysis = analyzeCartNutrition(items, allergies);
    res.json({
      success: true,
      data: analysis
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Nutrition analysis error: ' + err.message });
  }
});

// GET /api/nutrition/profile/:productId - Get single product nutritional specs
router.get('/profile/:productId', (req, res) => {
  const profile = PRODUCT_NUTRITION_PROFILES[req.params.productId];
  if (!profile) {
    return res.status(404).json({ success: false, message: 'Nutrition profile not found' });
  }
  res.json({
    success: true,
    data: profile
  });
});

// GET /api/nutrition/flash-deals - Get dynamic flash sale discounts based on shelf-life
router.get('/flash-deals', (req, res) => {
  const limit = parseInt(req.query.limit) || 6;
  const deals = getActiveFlashDeals(limit);
  res.json({
    success: true,
    count: deals.length,
    data: deals
  });
});

module.exports = router;
