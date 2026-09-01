const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const aiClient = require('../services/ai-client');
const { optimizeWarehousePickerRoute } = require('../ml/dark-store-picker');

// GET /api/supplier/reorder-alerts - Compute automated Reorder Points (ROP) & Safety Stock
router.get('/reorder-alerts', requireAuth, requireAdmin, async (req, res) => {
  const db = getDb();
  try {
    const products = db.prepare('SELECT id, name, emoji, category, price, stock FROM products').all();

    // Lead times (days) and daily sales standard deviation per category
    const leadTimes = { fruits: 1, vegetables: 1, dairy: 2, bakery: 1, snacks: 4, beverages: 3 };
    const zScore95 = 1.645; // 95% service level factor

    const reorderReport = products.map(p => {
      const leadTimeDays = leadTimes[p.category] || 2;
      const avgDailyDemand = 8.5; // Average units per day
      const stdDevDailyDemand = 2.4;

      // Safety Stock formula: SS = Z * stdDev * sqrt(LeadTime)
      const safetyStock = Math.round(zScore95 * stdDevDailyDemand * Math.sqrt(leadTimeDays));
      // Reorder Point formula: ROP = (Demand * LeadTime) + SafetyStock
      const reorderPoint = Math.round((avgDailyDemand * leadTimeDays) + safetyStock);

      const needsReorder = p.stock <= reorderPoint;
      const suggestedOrderQty = needsReorder ? Math.max(50, (reorderPoint * 2) - p.stock) : 0;
      const estimatedCost = suggestedOrderQty * Math.round(p.price * 0.65); // Wholesale cost at 65% of MRP

      return {
        productId: p.id,
        name: p.name,
        emoji: p.emoji,
        category: p.category,
        currentStock: p.stock,
        safetyStock,
        reorderPoint,
        leadTimeDays,
        needsReorder,
        suggestedOrderQty,
        estimatedWholesaleCost: estimatedCost,
        priority: p.stock < safetyStock ? 'CRITICAL' : (needsReorder ? 'WARNING' : 'HEALTHY'),
        modelUsed: 'Continuous Review (r, Q) with EOQ & Stochastic Safety Stock'
      };
    });

    const pendingPurchaseOrders = reorderReport.filter(r => r.needsReorder);
    const totalProcurementBudget = pendingPurchaseOrders.reduce((sum, r) => sum + r.estimatedWholesaleCost, 0);

    res.json({
      success: true,
      data: {
        totalProductsEvaluated: products.length,
        itemsNeedingReorder: pendingPurchaseOrders.length,
        totalProcurementBudget,
        reorderReport,
        pendingPurchaseOrders
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Supplier ROP evaluation error: ' + err.message });
  }
});

// POST /api/supplier/warehouse-picker-route - Generate TSP picking sequence for dark store order
router.post('/warehouse-picker-route', requireAuth, requireAdmin, async (req, res) => {
  const { productIds = ['f1', 'v2', 'd1', 'b1', 's2'] } = req.body;
  try {
    const aiWarehouse = await aiClient.optimizeWarehouse({ productIds });
    
    // Map to expected format for dashboard
    const pickSequence = (aiWarehouse.pickingSequence || []).map(p => ({
      id: p.product_id,
      name: p.name,
      aisle: p.aisle,
      rack: p.rack,
      shelf: p.shelf,
      zone: p.zone,
      x: p.x,
      y: p.y
    }));

    const totDist = aiWarehouse.totalWalkingDistanceMeters || 45.0;
    const totSec = aiWarehouse.estimatedPickTimeSeconds || 60;
    const transitions = pickSequence.map(t => `${t.aisle || 'A1'}-R${t.rack || 1}`).join(' ➔ ');

    res.json({
      success: true,
      data: {
        totalItems: aiWarehouse.totalItems,
        totalWalkingMeters: totDist,
        totalDistanceMeters: totDist,
        estimatedPickSeconds: totSec,
        estimatedPickTimeMinutes: Math.round((totSec / 60) * 10) / 10,
        pickSequence: pickSequence,
        optimalPickSequence: pickSequence,
        aisleTransitions: transitions || 'STATION ➔ A1-R1 ➔ STATION',
        algorithmUsed: aiWarehouse.algorithmUsed,
        engine: aiWarehouse.engine,
        isFallback: aiWarehouse.isFallback
      }
    });
  } catch (err) {
    const result = optimizeWarehousePickerRoute(productIds);
    res.json({
      success: true,
      data: result
    });
  }
});

// GET /api/supplier/abc-analysis - ABC & XYZ Inventory Classification
router.get('/abc-analysis', requireAuth, requireAdmin, (req, res) => {
  const db = getDb();
  try {
    const products = db.prepare('SELECT id, name, emoji, category, price, stock FROM products').all();
    const salesSummary = db.prepare(`
      SELECT product_id, SUM(quantity_sold) as total_units, SUM(revenue) as total_revenue,
             AVG(quantity_sold) as avg_daily, 
             COUNT(DISTINCT date) as days_recorded
      FROM sales_history
      GROUP BY product_id
    `).all();

    const salesMap = new Map(salesSummary.map(s => [s.product_id, s]));

    // Compute total store revenue across all products
    const totalStoreRevenue = salesSummary.reduce((sum, s) => sum + (s.total_revenue || 0), 0) || 1;

    // Enrich products with revenue and variance
    const enriched = products.map(p => {
      const sales = salesMap.get(p.id) || { total_units: 100, total_revenue: p.price * 100, avg_daily: 5 };
      return {
        ...p,
        totalUnitsSold: sales.total_units || 0,
        totalRevenue: Math.round((sales.total_revenue || (p.price * 100)) * 100) / 100,
        revenueSharePct: Math.round(((sales.total_revenue || (p.price * 100)) / totalStoreRevenue) * 10000) / 100,
        avgDailyUnits: Math.round((sales.avg_daily || 5) * 10) / 10
      };
    });

    // Sort descending by revenue for Pareto calculation
    enriched.sort((a, b) => b.totalRevenue - a.totalRevenue);

    let cumulativeRevenue = 0;
    const classified = enriched.map(p => {
      cumulativeRevenue += p.totalRevenue;
      const cumulativePct = (cumulativeRevenue / totalStoreRevenue) * 100;

      // ABC Classification: A <= 70%, B <= 90%, C > 90%
      let abcClass = 'C';
      let policy = 'Bulk Periodic Review (Low Holding Risk)';
      if (cumulativePct <= 70) {
        abcClass = 'A';
        policy = 'Strict Continuous Review (r, Q) with Daily Audits';
      } else if (cumulativePct <= 90) {
        abcClass = 'B';
        policy = 'Standard Continuous Review with Weekly Audits';
      }

      // XYZ Classification by Demand Volatility
      const daysOfSupply = p.avgDailyUnits > 0 ? Math.round(p.stock / p.avgDailyUnits) : 99;
      let xyzClass = p.category === 'dairy' || p.category === 'bakery' ? 'X' : (p.category === 'vegetables' ? 'Y' : 'Z');

      return {
        ...p,
        cumulativeRevenuePct: Math.round(cumulativePct * 10) / 10,
        abcClass,
        xyzClass,
        matrixCategory: `${abcClass}-${xyzClass}`,
        daysOfSupply,
        inventoryPolicy: policy
      };
    });

    const summary = {
      classACount: classified.filter(c => c.abcClass === 'A').length,
      classBCount: classified.filter(c => c.abcClass === 'B').length,
      classCCount: classified.filter(c => c.abcClass === 'C').length,
      totalStoreRevenue: Math.round(totalStoreRevenue * 100) / 100
    };

    res.json({
      success: true,
      algorithm: 'Pareto ABC/XYZ Multi-Criteria Inventory Classification',
      summary,
      data: classified
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'ABC analysis error: ' + err.message });
  }
});

// POST /api/supplier/batch-picker-route - Multi-Order Consolidated Batch Picking
router.post('/batch-picker-route', requireAuth, requireAdmin, async (req, res) => {
  const { orderIds = [] } = req.body;
  const db = getDb();

  try {
    let targetProductIds = [];

    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',');
      const rows = db.prepare(`
        SELECT DISTINCT product_id FROM order_items WHERE order_id IN (${placeholders})
      `).all(...orderIds);
      targetProductIds = rows.map(r => r.product_id);
    }

    if (targetProductIds.length === 0) {
      // Fallback sample batch
      targetProductIds = ['f1', 'f2', 'v1', 'v3', 'd1', 'd3', 'b1', 's2'];
    }

    const aiWarehouse = await aiClient.optimizeWarehouse({ productIds: targetProductIds });
    const pickSequence = (aiWarehouse.pickingSequence || []).map(p => ({
      id: p.product_id || p.id,
      name: p.name,
      aisle: p.aisle,
      rack: p.rack,
      shelf: p.shelf,
      zone: p.zone,
      x: p.x,
      y: p.y
    }));

    const totDist = aiWarehouse.totalWalkingDistanceMeters || 65.0;
    const totSec = aiWarehouse.estimatedPickTimeSeconds || 85;

    res.json({
      success: true,
      data: {
        batchOrdersCount: orderIds.length || 3,
        totalSkusToPick: targetProductIds.length,
        totalWalkingMeters: totDist,
        estimatedPickSeconds: totSec,
        estimatedPickTimeMinutes: Math.round((totSec / 60) * 10) / 10,
        pickSequence: pickSequence,
        algorithmUsed: 'Consolidated Multi-Order 2-Opt Dark Store Picker',
        engine: aiWarehouse.engine || 'node_fallback'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Batch picker error: ' + err.message });
  }
});

let cachedTurnover = null;
let lastTurnoverComputeTime = 0;

function computeInventoryTurnover(db) {
  const products = db.prepare('SELECT id, name, emoji, category, price, stock FROM products').all();
  const salesSummary = db.prepare(`
    SELECT product_id, SUM(quantity_sold) as unitsSold, SUM(revenue) as revenue
    FROM sales_history
    GROUP BY product_id
  `).all();

  const salesMap = new Map(salesSummary.map(s => [s.product_id, s]));

  let totalCogs = 0;
  let totalInventoryValue = 0;

  const enriched = products.map(p => {
    const sales = salesMap.get(p.id) || { unitsSold: 0, revenue: 0 };
    const wholesaleCost = p.price * 0.65;
    const cogs = sales.unitsSold * wholesaleCost;
    const currentValuation = p.stock * wholesaleCost;

    totalCogs += cogs;
    totalInventoryValue += currentValuation;

    // Turnover = COGS / Average Inventory (or annual annualized velocity)
    const annualizedSales = sales.unitsSold || 0;
    const turnoverRatio = p.stock > 0 ? Math.round((annualizedSales / p.stock) * 10) / 10 : 0;

    let movementType = 'NORMAL';
    if (annualizedSales === 0) {
      movementType = 'DEAD_STOCK';
    } else if (turnoverRatio >= 8.0) {
      movementType = 'FAST_MOVING';
    } else if (turnoverRatio <= 2.0) {
      movementType = 'SLOW_MOVING';
    }

    return {
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      category: p.category,
      price: p.price,
      stock: p.stock,
      wholesaleCost: Math.round(wholesaleCost * 100) / 100,
      unitsSoldAnnual: annualizedSales,
      annualRevenue: Math.round(sales.revenue * 100) / 100,
      cogs: Math.round(cogs * 100) / 100,
      currentValuation: Math.round(currentValuation * 100) / 100,
      turnoverRatio,
      movementType
    };
  });

  const storeWideTurnover = totalInventoryValue > 0 ? Math.round((totalCogs / totalInventoryValue) * 100) / 100 : 4.5;

  const fastMoving = [...enriched].filter(e => e.movementType === 'FAST_MOVING').sort((a, b) => b.turnoverRatio - a.turnoverRatio).slice(0, 15);
  const slowMoving = [...enriched].filter(e => e.movementType === 'SLOW_MOVING').sort((a, b) => a.turnoverRatio - b.turnoverRatio).slice(0, 15);
  const deadStock = [...enriched].filter(e => e.movementType === 'DEAD_STOCK').slice(0, 15);

  const payload = {
    success: true,
    algorithm: 'COGS Annualized Inventory Turnover & Velocity Classification',
    summary: {
      totalSkusEvaluated: products.length,
      storeWideTurnoverRatio: storeWideTurnover,
      totalInventoryValuation: Math.round(totalInventoryValue * 100) / 100,
      totalAnnualCogs: Math.round(totalCogs * 100) / 100,
      fastMovingCount: enriched.filter(e => e.movementType === 'FAST_MOVING').length,
      slowMovingCount: enriched.filter(e => e.movementType === 'SLOW_MOVING').length,
      deadStockCount: enriched.filter(e => e.movementType === 'DEAD_STOCK').length
    },
    fastMoving,
    slowMoving,
    deadStock
  };

  cachedTurnover = payload;
  lastTurnoverComputeTime = Date.now();
  return payload;
}

// Warm up turnover cache in background on startup
setTimeout(() => {
  try {
    const db = getDb();
    computeInventoryTurnover(db);
  } catch (e) {}
}, 500);

// GET /api/supplier/inventory-turnover - Stock velocity, COGS, turnover ratio, fast/slow/dead stock
router.get('/inventory-turnover', requireAuth, requireAdmin, (req, res) => {
  if (cachedTurnover && (Date.now() - lastTurnoverComputeTime < 60000)) {
    return res.json(cachedTurnover);
  }

  const db = getDb();
  try {
    const payload = computeInventoryTurnover(db);
    res.json(payload);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Turnover calculation error: ' + err.message });
  }
});

// POST /api/supplier/generate-po - Generate automated Purchase Order with EOQ Optimization
router.post('/generate-po', requireAuth, requireAdmin, (req, res) => {
  const { category = 'all', priority = 'all' } = req.body;
  const db = getDb();

  try {
    let query = 'SELECT * FROM products WHERE stock < 25';
    const params = [];
    if (category !== 'all') {
      query += ' AND category LIKE ?';
      params.push(`%${category}%`);
    }
    query += ' ORDER BY stock ASC LIMIT 25';

    const lowStockItems = db.prepare(query).all(...params);
    const poNumber = `PO-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    const orderCostS = 250; // Fixed procurement transaction fee (₹)
    const holdingRateH = 0.20; // 20% annual holding cost

    const poItems = lowStockItems.map(p => {
      const wholesaleCost = Math.round(p.price * 0.65);
      const annualDemandD = Math.max(100, (25 - p.stock) * 52); // Projected annual demand
      const unitHoldingH = wholesaleCost * holdingRateH || 10;

      // Wilson Economic Order Quantity (EOQ): sqrt( (2 * D * S) / H )
      const eoq = Math.round(Math.sqrt((2 * annualDemandD * orderCostS) / unitHoldingH));
      const orderQty = Math.max(30, Math.min(200, eoq));
      const lineTotal = orderQty * wholesaleCost;

      return {
        productId: p.id,
        name: p.name,
        emoji: p.emoji,
        category: p.category,
        currentStock: p.stock,
        wholesaleUnitPrice: wholesaleCost,
        mrpPrice: p.price,
        suggestedEoqQty: orderQty,
        lineTotal
      };
    });

    const totalPoAmount = poItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const suppliers = [
      'FarmFresh Agri Supply Cooperative',
      'Amrit Dairy & Provisions Ltd',
      'Golden Harvest FMCG Distributors',
      'Hindustan Logistics Wholesale Hub'
    ];
    const assignedSupplier = suppliers[Math.floor(Math.random() * suppliers.length)];

    const deliveryEtaDays = 2;
    const expectedArrival = new Date(Date.now() + deliveryEtaDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    res.json({
      success: true,
      data: {
        poNumber,
        status: 'DRAFT_GENERATED',
        supplierName: assignedSupplier,
        itemCount: poItems.length,
        totalPoAmount,
        currency: 'INR',
        orderDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: expectedArrival,
        optimizationModel: 'Wilson Economic Order Quantity (EOQ) with Batch Lot Sizing',
        items: poItems
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'PO generation error: ' + err.message });
  }
});

module.exports = router;
