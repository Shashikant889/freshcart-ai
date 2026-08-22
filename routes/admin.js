const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Apply admin auth to all admin routes
router.use(requireAuth, requireAdmin);

// GET /api/admin/dashboard - High level stats
router.get('/dashboard', (req, res) => {
  const db = getDb();
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "customer"').get().count;
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    const orderStats = db.prepare(`
      SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(total), 0) as totalRevenue,
        COALESCE(AVG(total), 0) as avgOrderValue
      FROM orders
    `).get();

    const lowStockCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE stock < 15').get().count;

    // Recent 5 orders
    const recentOrders = db.prepare(`
      SELECT id, customer_name, total, status, created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    // Top 5 selling products
    const topProducts = db.prepare(`
      SELECT p.id, p.name, p.emoji, p.category, SUM(oi.quantity) as totalSold, SUM(oi.quantity * oi.price_at_purchase) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      GROUP BY p.id
      ORDER BY totalSold DESC
      LIMIT 5
    `).all();

    res.json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        totalOrders: orderStats.totalOrders,
        totalRevenue: Math.round(orderStats.totalRevenue * 100) / 100,
        avgOrderValue: Math.round(orderStats.avgOrderValue * 100) / 100,
        lowStockCount,
        recentOrders,
        topProducts
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database error: ' + err.message });
  }
});

// GET /api/admin/products - List all products for management
router.get('/products', (req, res) => {
  const db = getDb();
  try {
    const products = db.prepare('SELECT * FROM products ORDER BY category, name').all();
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/products/:id - Update product stock or price
router.put('/products/:id', (req, res) => {
  const db = getDb();
  const { stock, price } = req.body;
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const finalStock = (stock !== undefined && stock !== null) ? Number(stock) : existing.stock;
    const finalPrice = (price !== undefined && price !== null) ? Number(price) : existing.price;

    db.prepare('UPDATE products SET stock = ?, price = ? WHERE id = ?').run(finalStock, finalPrice, req.params.id);
    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/orders - All orders with pagination
router.get('/orders', (req, res) => {
  const db = getDb();
  try {
    const orders = db.prepare(`
      SELECT o.*, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 100
    `).all();

    const getItems = db.prepare(`
      SELECT oi.quantity, oi.price_at_purchase, p.name, p.emoji
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `);

    const { evaluateOrderRisk } = require('../ml/fraud-detection');

    const enriched = orders.map(o => {
      const items = getItems.all(o.id);
      const risk = evaluateOrderRisk({
        userId: o.user_id,
        customerName: o.customer_name,
        address: o.address,
        phone: o.phone,
        total: o.total,
        items
      });
      return {
        ...o,
        items,
        fraudRisk: risk
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/orders/:id/status - Update order status
router.put('/orders/:id/status', (req, res) => {
  const db = getDb();
  const { status } = req.body;
  try {
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ success: true, message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/users - Users list
router.get('/users', (req, res) => {
  const db = getDb();
  try {
    const users = db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.created_at,
        COUNT(DISTINCT o.id) as totalOrders,
        COALESCE(SUM(o.total), 0) as totalSpent
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id
      ORDER BY totalSpent DESC
    `).all();

    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
