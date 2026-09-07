const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const { optionalAuth } = require('../middleware/auth');

// Lightweight TTL cache for read-heavy static catalog facets
const filterCache = new Map();
let categoryCache = null;
let categoryCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

// GET /api/products - Get products with pagination, category filter, hierarchy & search
router.get('/', optionalAuth, (req, res) => {
  const db = getDb();
  const { category, department, subcategory, product_family, brand, search, sort, diet, min_price, max_price, dataset_status } = req.query;
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

  // Active status filter: exclude deactivated synthetic Pooja records from normal catalog browse/search
  if (req.query.include_inactive !== 'true') {
    baseWhere += ' AND (is_active = 1 OR is_active IS NULL)';
  }

  // Backward-compatible category filter with Category-First Guardrail
  if (category && category !== 'all') {
    baseWhere += ' AND (category = ? OR subcategory = ? OR department = ?)';
    params.push(category, category, category);

    // Primary category navigation must include only HIGH confidence MAPPED products
    if (req.query.include_review !== 'true' && !req.query.category_status) {
      baseWhere += " AND (category_confidence = 'HIGH' OR category_confidence IS NULL) AND (category_status = 'MAPPED' OR category_status IS NULL)";
    }
  }

  // Admin Review Queue / explicit category status filter
  if (req.query.category_status && req.query.category_status !== 'all') {
    baseWhere += ' AND category_status = ?';
    params.push(req.query.category_status);
  }

  // 4-Level Taxonomy Filters
  if (department && department !== 'all') {
    if (department === 'Electronics') {
      baseWhere += ' AND (department LIKE ? OR department = ?)';
      params.push('%Electronics%', 'Electronics');
    } else if (department === 'Home & Personal Care') {
      baseWhere += ' AND (department = ? OR department LIKE ?)';
      params.push('Home & Personal Care', 'Home %');
    } else {
      baseWhere += ' AND department = ?';
      params.push(department);
    }
  }

  if (subcategory && subcategory !== 'all') {
    baseWhere += ' AND subcategory = ?';
    params.push(subcategory);
  }

  if (product_family && product_family !== 'all') {
    baseWhere += ' AND product_family = ?';
    params.push(product_family);
  }

  if (brand && brand !== 'all') {
    baseWhere += ' AND brand = ?';
    params.push(brand);
  }

  if (dataset_status && dataset_status !== 'all') {
    baseWhere += ' AND dataset_status = ?';
    params.push(dataset_status);
  }

  if (min_price !== undefined && !isNaN(Number(min_price))) {
    baseWhere += ' AND price >= ?';
    params.push(Number(min_price));
  }

  if (max_price !== undefined && !isNaN(Number(max_price))) {
    baseWhere += ' AND price <= ?';
    params.push(Number(max_price));
  }

  if (search) {
    baseWhere += ' AND (name LIKE ? OR description LIKE ? OR category LIKE ? OR brand LIKE ? OR model LIKE ? OR barcode LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (diet && diet !== 'all') {
    baseWhere += ' AND tags LIKE ?';
    params.push(`%${diet}%`);
  }

  // Phase 5C: Nutrition grade filter (Grocery & Food only)
  const { nutrition_grade, pack_size, min_rating } = req.query;
  if (nutrition_grade && nutrition_grade !== 'all') {
    baseWhere += ' AND nutrition_grade = ?';
    params.push(nutrition_grade);
  }

  // Phase 5C: Pack size bucket filter
  if (pack_size && pack_size !== 'all') {
    if (pack_size === 'Single') {
      baseWhere += " AND (package_size LIKE '%single%' OR package_size LIKE '%1 unit%' OR package_size = 'Single Unit')";
    } else if (pack_size === 'Multipack') {
      baseWhere += " AND package_size LIKE '%multipack%'";
    } else if (pack_size === 'Family Pack') {
      baseWhere += " AND package_size LIKE '%family%'";
    } else {
      baseWhere += ' AND package_size = ?';
      params.push(pack_size);
    }
  }

  // Phase 5C: Minimum rating filter
  if (min_rating && !isNaN(Number(min_rating))) {
    baseWhere += ' AND rating >= ?';
    params.push(Number(min_rating));
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
    const parsedProducts = products.map(p => {
      let attributes = {};
      try { attributes = JSON.parse(p.attributes_json || '{}'); } catch (e) {}
      let gallery = [];
      try { gallery = JSON.parse(p.gallery_images || '[]'); } catch (e) {}
      let tags = [];
      try { tags = JSON.parse(p.tags || '[]'); } catch (e) {}
      let technical_specs = {};
      try { technical_specs = JSON.parse(p.technical_specs_json || '{}'); } catch (e) {}
      let bullet_points = [];
      try { bullet_points = JSON.parse(p.bullet_points_json || '[]'); } catch (e) {}
      let dimensions = {};
      try { dimensions = JSON.parse(p.dimensions_json || '{}'); } catch (e) {}
      let weight = {};
      try { weight = JSON.parse(p.weight_json || '{}'); } catch (e) {}

      // Consolidate real gallery images without fabricating orientation
      const gallerySet = new Set();
      const primaryImg = p.primary_image_url || p.front_image_url || p.image_url;
      if (primaryImg) gallerySet.add(primaryImg);
      if (Array.isArray(gallery)) {
        gallery.forEach(img => { if (img && typeof img === 'string') gallerySet.add(img); });
      }
      if (p.packaging_image_url) gallerySet.add(p.packaging_image_url);
      if (p.nutrition_image_url) gallerySet.add(p.nutrition_image_url);
      if (p.ingredients_image_url) gallerySet.add(p.ingredients_image_url);
      if (p.back_image_url) gallerySet.add(p.back_image_url);

      return {
        ...p,
        tags,
        attributes,
        technical_specs,
        bullet_points,
        dimensions,
        weight,
        gallery_images: Array.from(gallerySet),
        front_image: p.front_image_url || p.image_url,
        back_image: p.back_image_url || null
      };
    });

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

// GET /api/products/categories - Get list of unique categories & 4-tier hierarchy metadata
router.get('/categories', (req, res) => {
  if (categoryCache && (Date.now() - categoryCacheTime < CACHE_TTL_MS)) {
    return res.json(categoryCache);
  }
  const db = getDb();
  try {
    const rows = db.prepare(`
      SELECT category, COUNT(*) as product_count 
      FROM products 
      WHERE (is_active = 1 OR is_active IS NULL)
        AND (category_confidence = 'HIGH' OR category_confidence IS NULL)
        AND (category_status = 'MAPPED' OR category_status IS NULL)
      GROUP BY category 
      ORDER BY product_count DESC
    `).all();

    // Generate dynamic 4-tier taxonomy directly from active catalog records
    const rawRows = db.prepare(`
      SELECT 
        department,
        subcategory,
        product_family,
        COUNT(*) as count
      FROM products
      WHERE (is_active = 1 OR is_active IS NULL)
      GROUP BY department, subcategory, product_family
    `).all();

    const DEPT_META = {
      'Grocery & Food': { id: 'Grocery & Food', name: 'Grocery & Food', emoji: '🥦', description: 'Fresh produce, staples, dairy, beverages & packaged foods', order: 1 },
      'Electronics': { id: 'Electronics', name: 'Electronics', emoji: '🎧', description: 'Personal audio, wearables, phone cases, cables & adapters', order: 2 },
      'Pooja Essentials': { id: 'Pooja Essentials', name: 'Pooja Essentials', emoji: '🪔', description: 'Authentic agarbatti, pure dhoop, brass diyas & sacred samagri', order: 3 },
      'Home & Personal Care': { id: 'Home & Personal Care', name: 'Home & Personal', emoji: '✨', description: 'Household cleaning, hygiene, grooming & daily living', order: 4 },
      'Apparel & Footwear': { id: 'Apparel & Footwear', name: 'Apparel & Footwear', emoji: '👟', description: 'Footwear and lifestyle apparel', order: 5 },
      'Fashion & Accessories': { id: 'Fashion & Accessories', name: 'Fashion & Jewelry', emoji: '💍', description: 'Fashion accessories and fine jewelry', order: 6 }
    };

    const subcatEmojiMap = {
      'Personal Electronics': '🎧',
      'Audio & Sound': '🎵',
      'Smart Gadgets': '⌚',
      'Mobile Accessories': '📱',
      'Mobile & Audio Accessories': '🔌',
      'Fast Chargers & Cables': '⚡',
      'Desk & Mounts': '📐',
      'Cables & Power': '🔌',
      'Staples & Grains': '🌾',
      'Organic Staples': '🌱',
      'Dairy & Breakfast': '🥛',
      'Beverages': '🥤',
      'Cold Pressed Juices': '🧃',
      'Snacks & Munchies': '🍪',
      'Sweets & Chocolates': '🍫',
      'Fresh Produce': '🍎',
      'Fresh Fruits': '🍉',
      'Fresh Vegetables': '🥬',
      'Bakery & Breads': '🍞',
      'Canned & Preserved': '🥫',
      'Cooking Essentials': '🧂',
      'Condiments & Sauces': '🍯',
      'Frozen Specialties': '🧊',
      'Household & Cleaning': '🧹',
      'Personal Care & Grooming': '🧼',
      'Incense & Fragrance': '🌸',
      'Lighting & Sacred Wicks': '🪔',
      'Pooja Consumables & Kits': '🕉️'
    };

    const deptMap = new Map();
    const subcatMap = new Map();
    const familyMap = new Map();

    for (const row of rawRows) {
      let deptName = row.department || 'General';
      let majorDept = deptName;
      if (deptName.startsWith('Electronics')) {
        majorDept = 'Electronics';
      } else if (deptName.startsWith('Home &') || deptName === 'Home Hardware' || deptName === 'Home & Merchandise' || deptName === 'Home & Living' || deptName === 'Home & Kitchen') {
        majorDept = 'Home & Personal Care';
      }

      if (!deptMap.has(majorDept)) {
        const meta = DEPT_META[majorDept] || { id: majorDept, name: majorDept, emoji: '📦', description: '', order: 99 };
        deptMap.set(majorDept, { ...meta, productCount: 0 });
      }
      deptMap.get(majorDept).productCount += row.count;

      const subcatName = row.subcategory || 'General';
      const subcatKey = `${majorDept}:::${subcatName}`;
      if (!subcatMap.has(subcatKey)) {
        subcatMap.set(subcatKey, {
          id: subcatName,
          category_id: majorDept,
          department: majorDept,
          name: subcatName,
          emoji: subcatEmojiMap[subcatName] || '📁',
          productCount: 0
        });
      }
      subcatMap.get(subcatKey).productCount += row.count;

      const familyName = row.product_family || 'General';
      const familyKey = `${majorDept}:::${subcatName}:::${familyName}`;
      if (!familyMap.has(familyKey)) {
        familyMap.set(familyKey, {
          id: familyName,
          subcategory_id: subcatName,
          subcategory: subcatName,
          department: majorDept,
          name: familyName,
          productCount: 0
        });
      }
      familyMap.get(familyKey).productCount += row.count;
    }

    const departments = Array.from(deptMap.values()).sort((a, b) => a.order - b.order || b.productCount - a.productCount);
    const subcategories = Array.from(subcatMap.values()).sort((a, b) => b.productCount - a.productCount);
    const productFamilies = Array.from(familyMap.values()).sort((a, b) => b.productCount - a.productCount);

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

    // Backward-compatible category strings
    const categoryStrings = rows.map(r => r.category);

    const payload = { 
      success: true, 
      count: enriched.length,
      data: categoryStrings,
      categories: enriched,
      departments,
      subcategories,
      productFamilies,
      taxonomy: {
        departments,
        subcategories,
        productFamilies
      }
    };
    categoryCache = payload;
    categoryCacheTime = Date.now();
    res.json(payload);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database error: ' + err.message });
  }
});

// GET /api/products/filters — Phase 5C: Category-scoped dynamic facets
// Returns live filter options based on the active taxonomy selection.
// Never fabricates values; only returns what exists in the DB for the current scope.
router.get('/filters', (req, res) => {
  const cacheKey = `${req.query.department || ''}::${req.query.subcategory || ''}::${req.query.product_family || ''}::${req.query.category || ''}`;
  const cached = filterCache.get(cacheKey);
  if (cached && (Date.now() - cached.time < CACHE_TTL_MS)) {
    return res.json(cached.data);
  }
  const db = getDb();
  try {
    const { department, subcategory, product_family, category } = req.query;

    // Build the same scope WHERE as the main list endpoint
    let scopeWhere = ' WHERE (is_active = 1 OR is_active IS NULL)';
    const scopeParams = [];

    if (department && department !== 'all') {
      if (department === 'Electronics') {
        scopeWhere += ' AND (department LIKE ? OR department = ?)';
        scopeParams.push('%Electronics%', 'Electronics');
      } else if (department === 'Home & Personal Care') {
        scopeWhere += ' AND (department = ? OR department LIKE ?)';
        scopeParams.push('Home & Personal Care', 'Home %');
      } else {
        scopeWhere += ' AND department = ?';
        scopeParams.push(department);
      }
    }
    if (subcategory && subcategory !== 'all') {
      scopeWhere += ' AND subcategory = ?';
      scopeParams.push(subcategory);
    }
    if (product_family && product_family !== 'all') {
      scopeWhere += ' AND product_family = ?';
      scopeParams.push(product_family);
    }
    if (category && category !== 'all') {
      scopeWhere += ' AND (category = ? OR subcategory = ? OR department = ?)';
      scopeParams.push(category, category, category);
    }

    // 1. Price range
    const priceRow = db.prepare(`
      SELECT MIN(price) as min_p, MAX(price) as max_p
      FROM products${scopeWhere}
    `).get(...scopeParams);

    // 2. Top 20 brands (by product count) that have a real brand_display value
    const brandRows = db.prepare(`
      SELECT brand_display as brand, COUNT(*) as cnt
      FROM products${scopeWhere}
        AND brand_display IS NOT NULL
        AND brand_display != ''
        AND brand_display != 'FreshCart Basics'
      GROUP BY brand_display
      ORDER BY cnt DESC
      LIMIT 20
    `).all(...scopeParams);

    // 3. Nutrition grades — only for Grocery & Food context
    let nutritionGrades = [];
    const isDepartmentGrocery = !department || department === 'all' || department === 'Grocery & Food';
    if (isDepartmentGrocery) {
      const gradeRows = db.prepare(`
        SELECT nutrition_grade as grade, COUNT(*) as cnt
        FROM products${scopeWhere}
          AND nutrition_grade IS NOT NULL
          AND nutrition_grade NOT IN ('UNKNOWN', 'NOT-APPLICABLE', '')
        GROUP BY nutrition_grade
        ORDER BY CASE nutrition_grade WHEN 'A' THEN 1 WHEN 'B' THEN 2 WHEN 'C' THEN 3 WHEN 'D' THEN 4 WHEN 'E' THEN 5 ELSE 6 END
      `).all(...scopeParams);
      nutritionGrades = gradeRows.filter(r => r.cnt > 0);
    }

    // 4. Pack size buckets (single-pass conditional aggregation)
    const packSizeBuckets = [];
    if (isDepartmentGrocery) {
      const packRow = db.prepare(`
        SELECT 
          SUM(CASE WHEN (package_size LIKE '%single%' OR package_size LIKE '%1 unit%' OR package_size = 'Single Unit') THEN 1 ELSE 0 END) as singleCnt,
          SUM(CASE WHEN (package_size = 'Standard' OR package_size = 'Standard Retail Pack') THEN 1 ELSE 0 END) as stdCnt,
          SUM(CASE WHEN package_size LIKE '%multipack%' THEN 1 ELSE 0 END) as multiCnt,
          SUM(CASE WHEN package_size LIKE '%family%' THEN 1 ELSE 0 END) as familyCnt
        FROM products${scopeWhere}
      `).get(...scopeParams);

      if (packRow) {
        if (packRow.singleCnt > 0) packSizeBuckets.push({ id: 'Single', label: 'Single Unit', count: packRow.singleCnt });
        if (packRow.stdCnt > 0) packSizeBuckets.push({ id: 'Standard', label: 'Standard Pack', count: packRow.stdCnt });
        if (packRow.multiCnt > 0) packSizeBuckets.push({ id: 'Multipack', label: 'Multipack', count: packRow.multiCnt });
        if (packRow.familyCnt > 0) packSizeBuckets.push({ id: 'Family Pack', label: 'Family Pack', count: packRow.familyCnt });
      }
    }

    // 5. Dietary tags & Ratings & Total in single-pass conditional aggregation
    const aggRow = db.prepare(`
      SELECT 
        COUNT(*) as totalCnt,
        SUM(CASE WHEN rating >= 4.0 THEN 1 ELSE 0 END) as highRatedCnt,
        SUM(CASE WHEN rating >= 4.5 THEN 1 ELSE 0 END) as topRatedCnt,
        SUM(CASE WHEN tags LIKE '%organic%' THEN 1 ELSE 0 END) as organicCnt,
        SUM(CASE WHEN tags LIKE '%vegan%' THEN 1 ELSE 0 END) as veganCnt,
        SUM(CASE WHEN tags LIKE '%gluten-free%' THEN 1 ELSE 0 END) as glutenFreeCnt,
        SUM(CASE WHEN tags LIKE '%protein%' THEN 1 ELSE 0 END) as proteinCnt,
        SUM(CASE WHEN tags LIKE '%diabetic%' THEN 1 ELSE 0 END) as diabeticCnt
      FROM products${scopeWhere}
    `).get(...scopeParams);

    const dietaryAvailable = [];
    if (aggRow) {
      if (aggRow.organicCnt > 0) dietaryAvailable.push({ id: 'organic', label: '🌱 Organic', count: aggRow.organicCnt });
      if (aggRow.veganCnt > 0) dietaryAvailable.push({ id: 'vegan', label: '🌿 Vegan', count: aggRow.veganCnt });
      if (aggRow.glutenFreeCnt > 0) dietaryAvailable.push({ id: 'gluten-free', label: '🌾 Gluten-Free', count: aggRow.glutenFreeCnt });
      if (aggRow.proteinCnt > 0) dietaryAvailable.push({ id: 'protein', label: '💪 High Protein', count: aggRow.proteinCnt });
      if (aggRow.diabeticCnt > 0) dietaryAvailable.push({ id: 'diabetic', label: '🩺 Diabetic Safe', count: aggRow.diabeticCnt });
    }

    const highRatedCnt = aggRow ? { cnt: aggRow.highRatedCnt || 0 } : { cnt: 0 };
    const topRatedCnt = aggRow ? { cnt: aggRow.topRatedCnt || 0 } : { cnt: 0 };
    const totalRow = aggRow ? { cnt: aggRow.totalCnt || 0 } : { cnt: 0 };

    const payload = {
      success: true,
      scope: { department: department || 'all', subcategory: subcategory || 'all', product_family: product_family || 'all' },
      totalInScope: totalRow ? totalRow.cnt : 0,
      filters: {
        price: priceRow ? {
          min: Math.floor(priceRow.min_p || 0),
          max: Math.ceil(priceRow.max_p || 5000)
        } : { min: 0, max: 5000 },
        brands: brandRows.map(r => ({ id: r.brand, label: r.brand, count: r.cnt })),
        nutritionGrades,
        packSizes: packSizeBuckets,
        dietary: dietaryAvailable,
        rating: [
          { id: '4', label: '⭐ 4+ Stars', count: highRatedCnt ? highRatedCnt.cnt : 0 },
          { id: '4.5', label: '⭐ 4.5+ Stars', count: topRatedCnt ? topRatedCnt.cnt : 0 }
        ].filter(r => r.count > 0)
      }
    };
    filterCache.set(cacheKey, { data: payload, time: Date.now() });
    res.json(payload);
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

    try { product.tags = JSON.parse(product.tags || '[]'); } catch (e) { product.tags = []; }
    try { product.attributes = JSON.parse(product.attributes_json || '{}'); } catch (e) { product.attributes = {}; }
    try { product.gallery_images = JSON.parse(product.gallery_images || '[]'); } catch (e) { product.gallery_images = []; }
    try { product.nutriments = JSON.parse(product.nutriments_json || '{}'); } catch (e) { product.nutriments = {}; }
    try { product.technical_specs = JSON.parse(product.technical_specs_json || '{}'); } catch (e) { product.technical_specs = {}; }
    try { product.bullet_points = JSON.parse(product.bullet_points_json || '[]'); } catch (e) { product.bullet_points = []; }
    try { product.dimensions = JSON.parse(product.dimensions_json || '{}'); } catch (e) { product.dimensions = {}; }
    try { product.weight = JSON.parse(product.weight_json || '{}'); } catch (e) { product.weight = {}; }

    // Consolidate real gallery images without fabricating orientation
    const gallerySet = new Set();
    const primaryImg = product.primary_image_url || product.front_image_url || product.image_url;
    if (primaryImg) gallerySet.add(primaryImg);
    if (Array.isArray(product.gallery_images)) {
      product.gallery_images.forEach(img => { if (img && typeof img === 'string') gallerySet.add(img); });
    }
    if (product.packaging_image_url) gallerySet.add(product.packaging_image_url);
    if (product.nutrition_image_url) gallerySet.add(product.nutrition_image_url);
    if (product.ingredients_image_url) gallerySet.add(product.ingredients_image_url);
    if (product.back_image_url) gallerySet.add(product.back_image_url);
    product.gallery_images = Array.from(gallerySet);

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
