/**
 * FreshCart AI — Big Data Analytics (BDA) API Routes
 * 
 * Provides columnar Star-Schema OLAP analysis (Slice-and-Dice, Rollup, Drilldown)
 * and MapReduce distributed stream processing over retail transaction streams.
 */

const express = require('express');
const router = express.Router();
const aiClient = require('../services/ai-client');

/**
 * GET /api/bda/cube
 * Get OLAP multidimensional cube metadata and high-level KPIs.
 */
router.get('/cube', async (req, res) => {
  try {
    const result = await aiClient.getOLAPCube();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/bda/slice-dice
 * Execute multidimensional slice-and-dice query over the columnar event log.
 */
router.post('/slice-dice', async (req, res) => {
  try {
    const { dimensions, metrics, filters } = req.body;
    const result = await aiClient.sliceAndDiceOLAP({
      dimensions: Array.isArray(dimensions) && dimensions.length > 0 ? dimensions : ['category', 'region'],
      metrics: Array.isArray(metrics) && metrics.length > 0 ? metrics : ['gross_sales', 'units_sold'],
      filters: filters || {}
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/bda/map-reduce
 * Trigger MapReduce parallel stream aggregation job across retail partitions.
 */
router.post('/map-reduce', async (req, res) => {
  try {
    const { mapper, reducer, filterStage } = req.body;
    const result = await aiClient.runMapReduceStream({
      mapper: mapper || 'CATEGORY_SALES_AGG',
      reducer: reducer || 'SUM',
      filterStage: filterStage || null
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
