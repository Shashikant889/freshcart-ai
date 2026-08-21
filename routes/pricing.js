const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { getProductElasticity, simulatePriceChange } = require('../ml/dynamic-pricing');

// GET /api/pricing/elasticity/:productId
router.get('/elasticity/:productId', (req, res) => {
  const result = getProductElasticity(req.params.productId);
  if (!result) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: result });
});

// GET /api/pricing/simulate/:productId?price=...
router.get('/simulate/:productId', (req, res) => {
  const proposedPrice = parseFloat(req.query.price);
  if (isNaN(proposedPrice) || proposedPrice <= 0) {
    return res.status(400).json({ success: false, message: 'Valid proposed price required' });
  }

  const result = simulatePriceChange(req.params.productId, proposedPrice);
  res.json({ success: true, data: result });
});

// GET /api/pricing/all - List all products with elasticity profiles
router.get('/all', (req, res) => {
  const db = getDb();
  const products = db.prepare('SELECT id, name, emoji, category, price, stock FROM products').all();
  const profiles = products.map(p => {
    const el = getProductElasticity(p.id);
    const simDefault = simulatePriceChange(p.id, p.price);
    return {
      ...p,
      elasticity: el.elasticityCoefficient,
      elasticityType: el.elasticityType,
      optimalPrice: simDefault.optimalRevenuePrice
    };
  });
  res.json({ success: true, count: profiles.length, data: profiles });
});

module.exports = router;
