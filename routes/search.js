const express = require('express');
const router = express.Router();
const { smartSearch } = require('../ml/smart-search');

// GET /api/search?q=... - NLP TF-IDF Semantic Search
router.get('/', (req, res) => {
  const query = req.query.q || '';
  const limit = parseInt(req.query.limit) || 12;

  if (!query.trim()) {
    return res.json({ success: true, count: 0, algorithm: 'TF-IDF Smart Search', data: [] });
  }

  const results = smartSearch(query, limit);

  res.json({
    success: true,
    query,
    count: results.length,
    algorithm: 'TF-IDF Vector Space Model + Levenshtein Typo Tolerance + Hindi Synonym Expansion',
    data: results
  });
});

module.exports = router;
