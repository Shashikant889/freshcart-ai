const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { optionalAuth } = require('../middleware/auth');

// GET /api/products - Get all products with filters
router.get('/', optionalAuth, (req, res) => {
  const db = getDb();
  const { category, search, sort } = req.query;

  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  switch (sort) {
    case 'price-asc':
      query += ' ORDER BY price ASC';
      break;
    case 'price-desc':
      query += ' ORDER BY price DESC';
      break;
    case 'name':
      query += ' ORDER BY name ASC';
      break;
    case 'rating':
    default:
      query += ' ORDER BY rating DESC';
      break;
  }

  try {
    const products = db.prepare(query).all(...params);
    const parsedProducts = products.map(p => ({
      ...p,
      tags: JSON.parse(p.tags || '[]')
    }));

    res.json({
      success: true,
      count: parsedProducts.length,
      data: parsedProducts
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database error: ' + err.message });
  }
});

// GET /api/products/categories - Get list of unique categories
router.get('/categories', (req, res) => {
  const db = getDb();
  try {
    const rows = db.prepare('SELECT DISTINCT category FROM products').all();
    const categories = rows.map(r => r.category);
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database error: ' + err.message });
  }
});

// GET /api/products/:id - Get single product & log view interaction
router.get('/:id', optionalAuth, (req, res) => {
  const db = getDb();
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.tags = JSON.parse(product.tags || '[]');

    // Track interaction if user is logged in
    if (req.user && req.user.id) {
      try {
        db.prepare(`
          INSERT INTO user_interactions (user_id, product_id, action, rating, created_at)
          VALUES (?, ?, 'view', NULL, datetime('now'))
        `).run(req.user.id, product.id);
      } catch (e) {
        // Ignore interaction logging failure
      }
    }

    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database error: ' + err.message });
  }
});

module.exports = router;
