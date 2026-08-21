const express = require('express');
const router = express.Router();
const { matchImageToProducts } = require('../ml/visual-search');

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

module.exports = router;
