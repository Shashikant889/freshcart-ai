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

// GET /api/recommendations/metrics - Precision@K & Recall@K
router.get('/metrics', (req, res) => {
  const k = parseInt(req.query.k) || 5;
  const metrics = evaluateRecommendationMetrics(k);
  res.json({ success: true, data: metrics });
});

module.exports = router;
