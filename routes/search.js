const express = require('express');
const router = express.Router();
const { smartSearch, getSearchSuggestions } = require('../ml/smart-search');

// GET /api/search/suggestions?q=... - Autocomplete Search Suggestions
router.get('/suggestions', (req, res) => {
  const query = req.query.q || '';
  const limit = parseInt(req.query.limit) || 6;

  if (!query.trim()) {
    return res.json({ success: true, count: 0, data: [] });
  }

  const suggestions = getSearchSuggestions(query, limit);
  res.json({
    success: true,
    query,
    count: suggestions.length,
    data: suggestions
  });
});

// GET /api/search?q=... - NLP TF-IDF Semantic Search with Facet Filters
router.get('/', (req, res) => {
  const query = req.query.q || '';
  const limit = parseInt(req.query.limit) || 12;
  const { category, minPrice, maxPrice, minRating, diet, sort } = req.query;

  if (!query.trim()) {
    return res.json({ success: true, count: 0, algorithm: 'TF-IDF Smart Search', data: [] });
  }

  const results = smartSearch(query, limit, {
    category,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    minRating: minRating ? Number(minRating) : undefined,
    diet,
    sort
  });

  res.json({
    success: true,
    query,
    count: results.length,
    algorithm: 'TF-IDF Vector Space Model + Levenshtein Typo Tolerance + Hindi Synonym Expansion',
    data: results
  });
});

module.exports = router;
