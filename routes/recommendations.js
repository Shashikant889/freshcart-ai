const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const {
  getHybridRecommendations,
  getSimilarProductsContentBased,
  getFrequentlyBoughtTogether,
  getSmartCartSuggestions,
  getTrendingProducts,
  evaluateRecommendationMetrics
} = require('../ml/recommendation-engine');

// GET /api/recommendations/personal - Personalized recommendations for user
router.get('/personal', optionalAuth, (req, res) => {
  const userId = req.user ? req.user.id : null;
  const limit = parseInt(req.query.limit) || 6;
  const recommendations = getHybridRecommendations(userId, limit);
  res.json({
    success: true,
    algorithm: userId ? 'Hybrid (Collaborative + Content-Based)' : 'Trending Popularity (Guest Mode)',
    count: recommendations.length,
    data: recommendations
  });
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
