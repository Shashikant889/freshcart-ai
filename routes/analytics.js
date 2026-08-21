const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { requireAuth, requireAdmin, optionalAuth } = require('../middleware/auth');
const {
  forecastProductDemand,
  forecastCategoryDemand,
  getInventoryStockAlerts
} = require('../ml/demand-forecasting');
const {
  getCustomerSegmentation,
  extractRFMMetrics
} = require('../ml/customer-segmentation');
const { evaluateRecommendationMetrics } = require('../ml/recommendation-engine');

// GET /api/analytics/demand-forecast/:productId - Demand forecast for product
router.get('/demand-forecast/:productId', optionalAuth, (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const forecast = forecastProductDemand(req.params.productId, days);
  res.json({ success: true, data: forecast });
});

// GET /api/analytics/demand-forecast/category/:category - Demand forecast for category
router.get('/demand-forecast/category/:category', optionalAuth, (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const forecast = forecastCategoryDemand(req.params.category, days);
  res.json({ success: true, data: forecast });
});

// GET /api/analytics/stock-alerts - Inventory alerts
router.get('/stock-alerts', optionalAuth, (req, res) => {
  const alerts = getInventoryStockAlerts();
  res.json({ success: true, count: alerts.length, data: alerts });
});

// GET /api/analytics/segments - Customer segmentation
router.get('/segments', optionalAuth, (req, res) => {
  const k = parseInt(req.query.k) || 4;
  const segments = getCustomerSegmentation(k);
  res.json({ success: true, data: segments });
});

// GET /api/analytics/rfm - Raw RFM metrics
router.get('/rfm', optionalAuth, (req, res) => {
  const rfm = extractRFMMetrics();
  res.json({ success: true, count: rfm.length, data: rfm });
});

// GET /api/analytics/sales-trends - Historical daily sales aggregation
router.get('/sales-trends', optionalAuth, (req, res) => {
  const db = getDb();
  const days = parseInt(req.query.days) || 30;

  try {
    const trends = db.prepare(`
      SELECT date, SUM(quantity_sold) as totalQuantity, ROUND(SUM(revenue), 2) as totalRevenue
      FROM sales_history
      GROUP BY date
      ORDER BY date DESC
      LIMIT ?
    `).all(days);

    res.json({ success: true, data: trends.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/analytics/category-revenue - Category revenue share
router.get('/category-revenue', optionalAuth, (req, res) => {
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT p.category, 
        ROUND(SUM(sh.revenue), 2) as revenue, 
        SUM(sh.quantity_sold) as quantity
      FROM sales_history sh
      JOIN products p ON sh.product_id = p.id
      GROUP BY p.category
      ORDER BY revenue DESC
    `).all();

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/analytics/ml-metrics - All ML model performance metrics combined
router.get('/ml-metrics', optionalAuth, (req, res) => {
  // 1. Recommendation metrics
  const recMetrics = evaluateRecommendationMetrics(5);

  // 2. Sample demand forecast metrics across all products
  const db = getDb();
  const sampleProducts = db.prepare('SELECT id FROM products LIMIT 5').all();
  const forecastMetrics = sampleProducts.map(p => forecastProductDemand(p.id, 7).metrics);

  const avgRmse = forecastMetrics.reduce((s, m) => s + (m?.rmse || 0), 0) / forecastMetrics.length;
  const avgMae = forecastMetrics.reduce((s, m) => s + (m?.mae || 0), 0) / forecastMetrics.length;

  // 3. Customer segmentation metrics
  const segData = getCustomerSegmentation(4);

  res.json({
    success: true,
    data: {
      recommendationEngine: recMetrics,
      demandForecasting: {
        model: 'Linear Regression (OLS) + 7-Day Moving Average + Day-of-Week Seasonality',
        averageRMSE: Math.round(avgRmse * 100) / 100,
        averageMAE: Math.round(avgMae * 100) / 100,
        evaluationWindow: '30-day holdout validation split'
      },
      customerSegmentation: {
        algorithm: 'K-Means (k=4) + RFM Min-Max Normalization',
        totalEvaluated: segData.totalCustomersEvaluated,
        wcss: segData.wcss,
        elbowCurve: segData.elbowCurve
      }
    }
  });
});

module.exports = router;
