const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { optionalAuth } = require('../middleware/auth');

// In-memory fallback for guest carts
const guestCarts = new Map();

function getGuestCart(sessionId) {
  if (!guestCarts.has(sessionId)) {
    guestCarts.set(sessionId, { items: [], updatedAt: new Date().toISOString() });
  }
  return guestCarts.get(sessionId);
}

function calculateTotals(items) {
  const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const deliveryFee = subtotal > 500 || subtotal === 0 ? 0 : 49;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    deliveryFee: Math.round(deliveryFee * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    freeDeliveryThreshold: 500
  };
}

// Helper to fetch user's cart items from DB
function getUserCartItems(userId) {
  const db = getDb();
  const rows = db.prepare(`
    SELECT c.product_id as productId, c.quantity, p.name, p.emoji, p.price, p.unit, p.stock,
           p.image_url, p.image_key, p.image_alt, p.brand, p.mrp, p.discount
    FROM cart_items c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `).all(userId);
  return rows;
}

// GET /api/cart - Get cart contents
router.get('/', optionalAuth, (req, res) => {
  if (req.user) {
    const items = getUserCartItems(req.user.id);
    const totals = calculateTotals(items);
    return res.json({
      success: true,
      data: {
        items,
        ...totals,
        updatedAt: new Date().toISOString()
      }
    });
  }

  const sessionId = req.headers['x-session-id'] || 'default';
  const cart = getGuestCart(sessionId);
  res.json({ success: true, data: { ...cart, ...calculateTotals(cart.items) } });
});

// POST /api/cart/add - Add item to cart
router.post('/add', optionalAuth, (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const db = getDb();

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  if (quantity < 1 || quantity > product.stock) {
    return res.status(400).json({ success: false, message: `Invalid quantity. Available stock: ${product.stock}` });
  }

  if (req.user) {
    const existing = db.prepare('SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?')
      .get(req.user.id, productId);

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > product.stock) {
        return res.status(400).json({ success: false, message: `Stock limit reached (${product.stock})` });
      }
      db.prepare('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?')
        .run(newQty, req.user.id, productId);
    } else {
      db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)')
        .run(req.user.id, productId, quantity);
    }

    // Log interaction for ML Recommendation
    try {
      db.prepare(`
        INSERT INTO user_interactions (user_id, product_id, action, rating, created_at)
        VALUES (?, ?, 'cart', NULL, datetime('now'))
      `).run(req.user.id, productId);
    } catch (e) {}

    const items = getUserCartItems(req.user.id);
    return res.json({
      success: true,
      message: `${product.name} added to cart`,
      data: { items, ...calculateTotals(items) }
    });
  }

  // Guest Cart handling
  const sessionId = req.headers['x-session-id'] || 'default';
  const cart = getGuestCart(sessionId);
  const existingItem = cart.items.find(item => item.productId === productId);

  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    if (newQty > product.stock) {
      return res.status(400).json({ success: false, message: `Cannot add more. Stock limit: ${product.stock}` });
    }
    existingItem.quantity = newQty;
  } else {
    cart.items.push({
      productId: product.id,
      name: product.name,
      emoji: product.emoji,
      price: product.price,
      unit: product.unit,
      quantity,
      image_url: product.image_url,
      image_key: product.image_key,
      image_alt: product.image_alt,
      brand: product.brand,
      mrp: product.mrp,
      discount: product.discount
    });
  }

  cart.updatedAt = new Date().toISOString();
  res.json({
    success: true,
    message: `${product.name} added to cart`,
    data: { ...cart, ...calculateTotals(cart.items) }
  });
});

// PUT /api/cart/update - Update item quantity
router.put('/update', optionalAuth, (req, res) => {
  const { productId, quantity } = req.body;
  const db = getDb();

  const product = db.prepare('SELECT stock FROM products WHERE id = ?').get(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  if (quantity < 0 || quantity > product.stock) {
    return res.status(400).json({ success: false, message: `Invalid quantity. Stock: ${product.stock}` });
  }

  if (req.user) {
    if (quantity === 0) {
      db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?').run(req.user.id, productId);
    } else {
      db.prepare('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?')
        .run(quantity, req.user.id, productId);
    }
    const items = getUserCartItems(req.user.id);
    return res.json({ success: true, data: { items, ...calculateTotals(items) } });
  }

  const sessionId = req.headers['x-session-id'] || 'default';
  const cart = getGuestCart(sessionId);
  if (quantity === 0) {
    cart.items = cart.items.filter(i => i.productId !== productId);
  } else {
    const item = cart.items.find(i => i.productId === productId);
    if (item) item.quantity = quantity;
  }
  cart.updatedAt = new Date().toISOString();
  res.json({ success: true, data: { ...cart, ...calculateTotals(cart.items) } });
});

// DELETE /api/cart/remove/:productId
router.delete('/remove/:productId', optionalAuth, (req, res) => {
  const { productId } = req.params;
  const db = getDb();

  if (req.user) {
    db.prepare('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?').run(req.user.id, productId);
    const items = getUserCartItems(req.user.id);
    return res.json({ success: true, message: 'Item removed', data: { items, ...calculateTotals(items) } });
  }

  const sessionId = req.headers['x-session-id'] || 'default';
  const cart = getGuestCart(sessionId);
  cart.items = cart.items.filter(i => i.productId !== productId);
  cart.updatedAt = new Date().toISOString();
  res.json({ success: true, message: 'Item removed', data: { ...cart, ...calculateTotals(cart.items) } });
});

// DELETE /api/cart/clear
router.delete('/clear', optionalAuth, (req, res) => {
  if (req.user) {
    const db = getDb();
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
    return res.json({ success: true, message: 'Cart cleared', data: { items: [], ...calculateTotals([]) } });
  }

  const sessionId = req.headers['x-session-id'] || 'default';
  guestCarts.set(sessionId, { items: [], updatedAt: new Date().toISOString() });
  res.json({ success: true, message: 'Cart cleared', data: { items: [], ...calculateTotals([]) } });
});

module.exports = {
  router,
  getGuestCart,
  getUserCartItems,
  calculateTotals
};
