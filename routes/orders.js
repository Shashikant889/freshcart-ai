const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { optionalAuth } = require('../middleware/auth');
const { getGuestCart } = require('./cart');

// POST /api/orders - Place an order
router.post('/', optionalAuth, (req, res) => {
  const db = getDb();
  const { customerName, address, phone, paymentMethod = 'cash' } = req.body;

  if (!customerName || !address || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Please provide customerName, address, and phone'
    });
  }

  let items = [];
  const userId = req.user ? req.user.id : null;

  if (userId) {
    items = db.prepare(`
      SELECT c.product_id as productId, c.quantity, p.name, p.emoji, p.price, p.unit
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      WHERE c.user_id = ?
    `).all(userId);
  } else {
    const sessionId = req.headers['x-session-id'] || 'default';
    const guestCart = getGuestCart(sessionId);
    items = guestCart.items;
  }

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }

  // Validate stock availability for each item
  for (const item of items) {
    if (!item.quantity || item.quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid item quantity' });
    }
    const p = db.prepare('SELECT stock, name FROM products WHERE id = ?').get(item.productId);
    if (!p) {
      return res.status(400).json({ success: false, message: `Product ${item.productId} not found` });
    }
    if (p.stock < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for ${p.name}. Available: ${p.stock}`
      });
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal > 500 ? 0 : 49;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = Math.round((subtotal + deliveryFee + tax) * 100) / 100;

  const orderId = 'ORD-' + uuidv4().split('-')[0].toUpperCase();

  // ML Fraud & Anomaly Risk Assessment
  const { evaluateOrderRisk } = require('../ml/fraud-detection');
  const riskAnalysis = evaluateOrderRisk({
    userId,
    customerName,
    address,
    phone,
    total,
    items
  });

  const insertOrderTx = db.transaction(() => {
    // 1. Insert into orders table
    db.prepare(`
      INSERT INTO orders (id, user_id, subtotal, delivery_fee, tax, total, status, customer_name, address, phone, payment_method, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?, ?, datetime('now'))
    `).run(orderId, userId, subtotal, deliveryFee, tax, total, customerName, address, phone, paymentMethod);

    // 2. Insert order items and log interactions
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
      VALUES (?, ?, ?, ?)
    `);

    const insertInteraction = db.prepare(`
      INSERT INTO user_interactions (user_id, product_id, action, rating, created_at)
      VALUES (?, ?, 'purchase', NULL, datetime('now'))
    `);

    const updateStock = db.prepare(`
      UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?
    `);

    for (const item of items) {
      insertItem.run(orderId, item.productId, item.quantity, item.price);
      updateStock.run(item.quantity, item.productId);

      if (userId) {
        insertInteraction.run(userId, item.productId);
      }
    }

    // 3. Clear cart
    if (userId) {
      db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
    } else {
      const sessionId = req.headers['x-session-id'] || 'default';
      const guestCart = getGuestCart(sessionId);
      guestCart.items = [];
    }
  });

  try {
    insertOrderTx();
    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      data: {
        id: orderId,
        items,
        subtotal,
        deliveryFee,
        tax,
        total,
        customerName,
        address,
        phone,
        paymentMethod,
        status: 'confirmed',
        estimatedDelivery: '30-45 minutes',
        createdAt: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to place order: ' + err.message });
  }
});

// GET /api/orders - Get orders for user or session
router.get('/', optionalAuth, (req, res) => {
  const db = getDb();
  let ordersList = [];

  try {
    if (req.user) {
      ordersList = db.prepare(`
        SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC
      `).all(req.user.id);
    } else {
      const phone = req.query.phone;
      if (phone) {
        ordersList = db.prepare(`
          SELECT * FROM orders WHERE phone = ? ORDER BY created_at DESC LIMIT 20
        `).all(phone);
      } else {
        ordersList = db.prepare(`
          SELECT * FROM orders ORDER BY created_at DESC LIMIT 10
        `).all();
      }
    }

    // Attach items to each order
    const getItems = db.prepare(`
      SELECT oi.product_id as productId, oi.quantity, oi.price_at_purchase as price, p.name, p.emoji, p.unit
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `);

    const enrichedOrders = ordersList.map(order => ({
      ...order,
      items: getItems.all(order.id)
    }));

    res.json({ success: true, data: enrichedOrders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database error: ' + err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const items = db.prepare(`
      SELECT oi.product_id as productId, oi.quantity, oi.price_at_purchase as price, p.name, p.emoji, p.unit
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `).all(order.id);

    res.json({ success: true, data: { ...order, items } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database error: ' + err.message });
  }
});

module.exports = router;
