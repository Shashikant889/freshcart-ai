const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { optionalAuth } = require('../middleware/auth');

// GET /api/products - Get products with pagination, category filter, search & sorting
router.get('/', optionalAuth, (req, res) => {
  const db = getDb();
  const { category, search, sort, diet } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limitParam = req.query.limit;
  const isAll = limitParam === 'all' || limitParam === '-1';
  let limit = parseInt(limitParam) || 24;
  if (!isAll && limit > 100) limit = 100;
  if (limit <= 0) limit = 24;
  if (isAll) limit = 10000;
  const offset = Math.max(0, (page - 1) * limit);

  let baseWhere = ' WHERE 1=1';
  const params = [];

  if (category && category !== 'all') {
    baseWhere += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    baseWhere += ' AND (name LIKE ? OR description LIKE ? OR category LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (diet && diet !== 'all') {
    baseWhere += ' AND tags LIKE ?';
    params.push(`%${diet}%`);
  }

  // Count total matching items
  let total = 0;
  try {
    const countRow = db.prepare(`SELECT COUNT(*) as cnt FROM products${baseWhere}`).get(...params);
    total = countRow ? countRow.cnt : 0;
  } catch (e) {
    total = 0;
  }

  let orderClause = ' ORDER BY rating DESC';
  if (search && (!sort || sort === 'rating')) {
    const cleanSearch = String(search).replace(/['"\\]/g, '');
    orderClause = ` ORDER BY (CASE WHEN name LIKE '${cleanSearch}%' THEN 1 WHEN name LIKE '% ${cleanSearch}%' THEN 2 WHEN name LIKE '%${cleanSearch}%' THEN 3 ELSE 4 END) ASC, rating DESC, id ASC`;
  } else {
    switch (sort) {
      case 'price-asc':
        orderClause = ' ORDER BY price ASC';
        break;
      case 'price-desc':
        orderClause = ' ORDER BY price DESC';
        break;
      case 'name':
        orderClause = ' ORDER BY name ASC';
        break;
      case 'rating':
      default:
        orderClause = ' ORDER BY rating DESC, id ASC';
        break;
    }
  }

  let query = `SELECT * FROM products${baseWhere}${orderClause}`;
  if (!isAll) {
    query += ` LIMIT ${limit} OFFSET ${offset}`;
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
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      limit,
      data: parsedProducts
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database error: ' + err.message });
  }
});

// GET /api/products/categories - Get list of unique categories with metadata
router.get('/categories', (req, res) => {
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT category, COUNT(*) as product_count 
      FROM products 
      GROUP BY category 
      ORDER BY product_count DESC
    `).all();
    
    // Check if rich categories.json exists for extra metadata
    let categoryMeta = [];
    try {
      const catFile = require('../data/categories.json');
      categoryMeta = catFile;
    } catch (e) {}

    const metaMap = new Map(categoryMeta.map(c => [c.id, c]));

    const enriched = rows.map(r => {
      const meta = metaMap.get(r.category) || {};
      return {
        id: r.category,
        name: meta.name || (r.category.charAt(0).toUpperCase() + r.category.slice(1).replace(/_/g, ' ')),
        department: meta.department || 'General Grocery',
        emoji: meta.emoji || '🛒',
        productCount: r.product_count,
        dietaryTags: meta.dietary_tags || []
      };
    });

    // Also provide raw category strings for backward compatibility
    const categoryStrings = rows.map(r => r.category);

    res.json({ 
      success: true, 
      count: enriched.length,
      data: categoryStrings,
      categories: enriched
    });
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
