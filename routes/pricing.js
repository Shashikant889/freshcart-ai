const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const aiClient = require('../services/ai-client');
const { getProductElasticity, simulatePriceChange } = require('../ml/dynamic-pricing');

// GET /api/pricing/elasticity/:productId
router.get('/elasticity/:productId', (req, res) => {
  const result = getProductElasticity(req.params.productId);
  if (!result) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: result });
});

// GET /api/pricing/simulate/:productId?price=...
router.get('/simulate/:productId', async (req, res) => {
  const proposedPrice = parseFloat(req.query.price);
  if (isNaN(proposedPrice) || proposedPrice <= 0) {
    return res.status(400).json({ success: false, message: 'Valid proposed price required' });
  }

  const db = getDb();
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.productId);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  try {
    const result = simulatePriceChange(req.params.productId, proposedPrice);
    let aiPricing = null;
    try {
      aiPricing = await aiClient.recommendPrice({
        productId: product.id,
        category: product.category,
        basePrice: product.price
      });
    } catch (e) {}
    
    res.json({
      success: true,
      data: {
        ...result,
        engine: aiPricing ? aiPricing.engine : 'node_ml_fallback',
        optimalRevenuePrice: aiPricing?.recommendedPrice || result.optimalRevenuePrice,
        priceElasticityModel: aiPricing?.modelUsed || 'Log-Linear OLS Price Elasticity of Demand (PED)',
        explanationSteps: result.explanationSteps,
        disclaimer: result.disclaimer || aiPricing?.disclaimer || 'Simulated pricing is an econometric estimation based on historical price elasticity.'
      }
    });
  } catch (err) {
    const result = simulatePriceChange(req.params.productId, proposedPrice);
    res.json({ success: true, data: result });
  }
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

// GET /api/pricing/bandit-promo - Multi-Armed Bandit Dynamic Storefront Promotion
router.get('/bandit-promo', async (req, res) => {
  try {
    const context = req.query.context || 'storefront_hero';
    const result = await aiClient.sampleBanditArm({ context });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/pricing/bandit-feedback - Reward feedback for bandit promo interaction
router.post('/bandit-feedback', async (req, res) => {
  try {
    const { arm_id, reward } = req.body;
    const result = await aiClient.recordBanditFeedback({
      armId: arm_id,
      reward: reward !== undefined ? Number(reward) : 1.0
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
