const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { optionalAuth } = require('../middleware/auth');
const aiClient = require('../services/ai-client');
const {
  getHybridRecommendations,
  getSimilarProductsContentBased,
  getFrequentlyBoughtTogether,
  getSmartCartSuggestions,
  getTrendingProducts,
  findProductSubstitutes,
  getBuyAgainProducts,
  getSmartBundles,
  compareProducts,
  evaluateRecommendationMetrics
} = require('../ml/recommendation-engine');

// GET /api/recommendations/personal - Personalized recommendations for user
router.get('/personal', optionalAuth, async (req, res) => {
  const userId = req.user ? req.user.id : null;
  const limit = parseInt(req.query.limit) || 6;
  
  try {
    const aiRes = await aiClient.getRecommendations({ userId, topK: limit });
    const db = getDb();
    
    // Map recommended product IDs to complete database product records
    const productIds = aiRes.recommendations.map(r => r.product_id);
    let dbProducts = [];
    if (productIds.length > 0) {
      const placeholders = productIds.map(() => '?').join(',');
      dbProducts = db.prepare(`SELECT * FROM products WHERE id IN (${placeholders})`).all(...productIds);
    }
    const dbMap = new Map(dbProducts.map(p => [p.id, p]));
    
    const enriched = aiRes.recommendations.map((r, idx) => {
      const p = dbMap.get(r.product_id) || {};
      const score = r.score !== undefined ? r.score : Math.round((1.0 - (idx * 0.05)) * 100) / 100;
      return {
        ...p,
        id: r.product_id,
        name: p.name || r.name,
        price: p.price !== undefined ? p.price : r.price,
        category: p.category || r.category,
        score: score,
        matchScore: Math.round(score * 100),
        reason: r.reason || 'Recommended by FreshCart AI'
      };
    });

    res.json({
      success: true,
      algorithm: aiRes.modelUsed || (userId ? 'Hybrid (Collaborative + Content-Based)' : 'Trending Popularity (Guest Mode)'),
      engine: aiRes.engine,
      isFallback: aiRes.isFallback,
      count: enriched.length,
      data: enriched
    });
  } catch (err) {
    const recommendations = getHybridRecommendations(userId, limit);
    res.json({
      success: true,
      algorithm: userId ? 'Hybrid (Collaborative + Content-Based)' : 'Trending Popularity (Guest Mode)',
      engine: 'node_fallback',
      isFallback: true,
      count: recommendations.length,
      data: recommendations
    });
  }
});

// GET /api/recommendations/buy-again - Reorder past purchased items
router.get('/buy-again', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : null;
  const limit = parseInt(req.query.limit) || 6;
  const items = getBuyAgainProducts(userId, limit);
  res.json({
    success: true,
    algorithm: 'Customer Lifetime Frequency & Recency Purchase Extractor',
    count: items.length,
    data: items
  });
});

// GET /api/recommendations/smart-bundles - Dynamic Curated Meal Kits & Combos
router.get('/smart-bundles', (req, res) => {
  const limit = parseInt(req.query.limit) || 4;
  const bundles = getSmartBundles(limit);
  res.json({
    success: true,
    algorithm: 'Cross-Category Complementary Bundle Solver with 15% Dynamic Savings',
    count: bundles.length,
    data: bundles
  });
});

// POST /api/recommendations/compare - Side-by-Side Product Comparison
router.post('/compare', (req, res) => {
  const { productIds = [] } = req.body;
  const comparison = compareProducts(productIds);
  res.json(comparison);
});

// GET /api/recommendations/similar/:productId - Content-Based Similar Products
router.get('/similar/:productId', (req, res) => {
  const limit = parseInt(req.query.limit) || 4;
  const similar = getSimilarProductsContentBased(req.params.productId, limit);
  res.json({
    success: true,
    algorithm: 'Content-Based Cosine Similarity Feature Vector',
    data: similar
  });
});

// GET /api/recommendations/frequently-bought/:productId - Association Rule Mining
router.get('/frequently-bought/:productId', (req, res) => {
  const limit = parseInt(req.query.limit) || 3;
  const items = getFrequentlyBoughtTogether(req.params.productId, limit);
  res.json({
    success: true,
    algorithm: 'Apriori Association Rule Mining (Support, Confidence, Lift)',
    data: items
  });
});

// POST /api/recommendations/cart-suggestions - Smart Cart Complementary Items
router.post('/cart-suggestions', (req, res) => {
  const { productIds = [] } = req.body;
  const limit = parseInt(req.query.limit) || 4;
  const suggestions = getSmartCartSuggestions(productIds, limit);
  res.json({
    success: true,
    algorithm: 'Smart Cart Complementary Association',
    data: suggestions
  });
});

// GET /api/recommendations/trending - Popular items
router.get('/trending', (req, res) => {
  const limit = parseInt(req.query.limit) || 6;
  const trending = getTrendingProducts(limit);
  res.json({ success: true, data: trending });
});

// GET /api/recommendations/substitutes/:productId - Intelligent Product Substitution
router.get('/substitutes/:productId', (req, res) => {
  const limit = parseInt(req.query.limit) || 3;
  const substitutes = findProductSubstitutes(req.params.productId, limit);
  res.json({
    success: true,
    algorithm: 'Multi-Factor Product Substitution (Category, Price Proximity, Rating, Content Cosine)',
    productId: req.params.productId,
    count: substitutes.length,
    data: substitutes
  });
});

// GET & POST /api/recommendations/sequential - SASRec Multi-Head Self-Attention Sequential Recommendation
router.all('/sequential', async (req, res) => {
  try {
    const rawSeq = req.method === 'POST' ? req.body.sequence : req.query.sequence;
    let sequence = [1, 2, 4];
    if (Array.isArray(rawSeq)) {
      sequence = rawSeq.map(n => parseInt(n)).filter(n => !isNaN(n));
    } else if (typeof rawSeq === 'string') {
      sequence = rawSeq.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    }
    const limit = parseInt(req.query.limit || req.body?.limit) || 4;
    const result = await aiClient.predictSequentialNextPick({ sequence, topK: limit });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/recommendations/metrics - Precision@K & Recall@K
router.get('/metrics', (req, res) => {
  const k = parseInt(req.query.k) || 5;
  const metrics = evaluateRecommendationMetrics(k);
  res.json({ success: true, data: metrics });
});

module.exports = router;
