const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { optimizeWarehousePickerRoute } = require('../ml/dark-store-picker');

// GET /api/supplier/reorder-alerts - Compute automated Reorder Points (ROP) & Safety Stock
router.get('/reorder-alerts', requireAuth, requireAdmin, (req, res) => {
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
        priority: p.stock < safetyStock ? 'CRITICAL' : (needsReorder ? 'WARNING' : 'HEALTHY')
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
router.post('/warehouse-picker-route', requireAuth, requireAdmin, (req, res) => {
  const { productIds = ['f1', 'v2', 'd1', 'b1', 's2'] } = req.body;
  try {
    const result = optimizeWarehousePickerRoute(productIds);
    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Warehouse routing error: ' + err.message });
  }
});

module.exports = router;
