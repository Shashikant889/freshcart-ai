const express = require('express');
const router = express.Router();
const { optimizeDeliveryDispatch } = require('../ml/route-optimizer');

// GET /api/dispatch/optimize - Compute VRP TSP shortest delivery route
router.get('/optimize', (req, res) => {
  const batchSize = parseInt(req.query.batchSize) || 8;
  const result = optimizeDeliveryDispatch(batchSize);
  res.json({
    success: true,
    data: result
  });
});

module.exports = router;
