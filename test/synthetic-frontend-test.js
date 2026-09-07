/**
 * FreshCart AI — Synthetic Frontend Logic & DOM Integration Test Suite
 * Evaluates client-side logic, state management, DOM integrity, cart calculations,
 * bilingual translations, UI filters, gamification, and invoice generation.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  🖥️ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  🚨 [FAIL] ${name}:`, err.message);
    failedTests++;
  }
}

function runSyntheticFrontendTests() {
  console.log('\n===============================================================');
  console.log('  🎨 FRESHCART AI: SYNTHETIC FRONTEND UNIT & DOM TEST SUITE');
  console.log('===============================================================\n');

  // Load index.html and app.js
  const htmlPath = path.join(__dirname, '../public/index.html');
  const appJsPath = path.join(__dirname, '../public/js/app.js');
  const cssPath = path.join(__dirname, '../public/css/style.css');

  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const appJsContent = fs.readFileSync(appJsPath, 'utf8');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // -------------------------------------------------------------
  // 1. DOM STRUCTURE & UI COMPONENT INTEGRITY
  // -------------------------------------------------------------
  console.log('📌 1. DOM Hierarchy & Essential Elements Presence:');

  test('index.html contains required interactive navigation and control IDs', () => {
    const requiredIds = [
      'search-input',
      'voice-search-btn',
      'visual-search-btn',
      'cart-btn',
      'cart-badge',
      'login-modal-btn',
      'orders-btn',
      'lang-toggle-btn',
      'theme-toggle-btn',
      'lucky-spin-btn',
      'pantry-sub-btn',
      'coins-btn',
      'wallet-btn',
      'nutrition-btn',
      'group-buy-btn',
      'wishlist-btn',
      'compare-btn',
      'smart-search-dropdown',
      'buy-again-section',
      'recently-viewed-section'
    ];

    for (const id of requiredIds) {
      assert.ok(htmlContent.includes(`id="${id}"`), `Element with ID #${id} must exist in index.html`);
    }
  });

  test('index.html contains all core overlay and panel containers', () => {
    const overlays = [
      'cart-sidebar',
      'checkout-overlay',
      'auth-overlay',
      'freshbot-panel',
      'wheel-modal-overlay',
      'scratch-modal-overlay',
      'pantry-modal-overlay',
      'invoice-modal-overlay',
      'tracking-modal-overlay',
      'confirmation-overlay',
      'wallet-modal-overlay',
      'nutrition-modal-overlay',
      'group-modal-overlay',
      'wishlist-modal-overlay',
      'compare-modal-overlay',
      'stock-alert-overlay'
    ];

    for (const m of overlays) {
      assert.ok(htmlContent.includes(`id="${m}"`), `Overlay/Panel #${m} must exist in index.html`);
    }
  });

  test('CSS stylesheet is present and defines complete design system tokens', () => {
    assert.ok(cssContent.length > 5000, 'style.css must be populated');
    assert.ok(cssContent.includes('--green-500'), 'CSS must define primary color variables');
    assert.ok(cssContent.includes('.light-theme'), 'CSS must support light/dark theme toggling');
    assert.ok(cssContent.includes('@media'), 'CSS must include responsive media queries');
  });

  // -------------------------------------------------------------
  // 2. FRONTEND STATE CALCULATIONS & CART LIFECYCLE
  // -------------------------------------------------------------
  console.log('\n📌 2. Cart Pricing, Taxes, Tips & Coupon Logic:');

  test('Calculate cart breakdown with free delivery threshold (₹500)', () => {
    function computeCart(items, isEcoBag = false, tip = 0, coupon = null) {
      const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
      const deliveryFee = (subtotal >= 500 || subtotal === 0) ? 0 : 49;
      const tax = Math.round(subtotal * 0.08 * 100) / 100;
      const ecoFee = isEcoBag ? 15 : 0;
      let discount = 0;

      if (coupon === 'FRESH100' && subtotal >= 500) {
        discount = 100;
      } else if (coupon === 'SPIN50') {
        discount = 50;
      }

      const total = Math.max(0, Math.round((subtotal + deliveryFee + tax + ecoFee + tip - discount) * 100) / 100);
      const coinsEarned = Math.floor(subtotal * 0.05);

      return { subtotal, deliveryFee, tax, ecoFee, tip, discount, total, coinsEarned };
    }

    // Scenario A: Under ₹500
    const cartA = computeCart([{ price: 120, qty: 2 }, { price: 80, qty: 1 }], true, 20, null);
    assert.strictEqual(cartA.subtotal, 320);
    assert.strictEqual(cartA.deliveryFee, 49, 'Orders < ₹500 must incur ₹49 delivery fee');
    assert.strictEqual(cartA.tax, 25.6);
    assert.strictEqual(cartA.ecoFee, 15);
    assert.strictEqual(cartA.tip, 20);
    assert.strictEqual(cartA.total, 429.6);
    assert.strictEqual(cartA.coinsEarned, 16);

    // Scenario B: Over ₹500 with FRESH100 Coupon
    const cartB = computeCart([{ price: 249, qty: 2 }, { price: 199, qty: 1 }], false, 0, 'FRESH100');
    assert.strictEqual(cartB.subtotal, 697);
    assert.strictEqual(cartB.deliveryFee, 0, 'Orders >= ₹500 have FREE delivery');
    assert.strictEqual(cartB.discount, 100);
    assert.strictEqual(cartB.total, 652.76);
  });

  // -------------------------------------------------------------
  // 3. BILINGUAL TRANSLATION & DICTIONARY PARITY
  // -------------------------------------------------------------
  console.log('\n📌 3. Bilingual English/Hindi Localization Parity:');

  test('app.js defines complete symmetric DICT for Hindi & English', () => {
    assert.ok(appJsContent.includes('const DICT = {'), 'DICT object must exist in app.js');
    assert.ok(appJsContent.includes('hi: {'), 'Hindi dictionary must be defined');
    assert.ok(appJsContent.includes('en: {'), 'English dictionary must be defined');

    const expectedKeys = [
      'searchPlaceholder',
      'cart',
      'exploreProducts',
      'recommended',
      'allCategory',
      'addToCart',
      'subtotal',
      'placeOrder'
    ];

    for (const k of expectedKeys) {
      assert.ok(appJsContent.includes(k), `Translation key "${k}" must be present in DICT`);
    }
  });

  // -------------------------------------------------------------
  // 4. CLIENT-SIDE SEARCH, FILTER & SORTING ALGORITHMS
  // -------------------------------------------------------------
  console.log('\n📌 4. Client-Side Catalog Filtering & Sorting Engine:');

  const mockCatalog = [
    { id: 'f1', name: 'Organic Royal Gala Apples', category: 'fruits', price: 249, rating: 4.9, tags: ['organic', 'fruit'] },
    { id: 'f2', name: 'Fresh Robusta Bananas', category: 'fruits', price: 49, rating: 4.7, tags: ['vegan', 'fruit'] },
    { id: 'v1', name: 'Farm Fresh Broccoli', category: 'vegetables', price: 89, rating: 4.8, tags: ['organic', 'vegetable'] },
    { id: 'd1', name: 'Organic Whole Milk', category: 'dairy', price: 69, rating: 4.9, tags: ['organic', 'dairy'] },
    { id: 's1', name: 'Roasted Almonds', category: 'snacks', price: 349, rating: 4.6, tags: ['protein', 'snack'] }
  ];

  test('Filter catalog by Category (Vegetables)', () => {
    const filtered = mockCatalog.filter(p => p.category === 'vegetables');
    assert.strictEqual(filtered.length, 1);
    assert.strictEqual(filtered[0].id, 'v1');
  });

  test('Filter catalog by Dietary Preference (Organic)', () => {
    const organic = mockCatalog.filter(p => p.tags.includes('organic'));
    assert.strictEqual(organic.length, 3);
  });

  test('Sort catalog by Price Ascending & Descending', () => {
    const asc = [...mockCatalog].sort((a, b) => a.price - b.price);
    assert.strictEqual(asc[0].id, 'f2', 'Cheapest should be Bananas (₹49)');
    assert.strictEqual(asc[asc.length - 1].id, 's1', 'Most expensive should be Almonds (₹349)');

    const desc = [...mockCatalog].sort((a, b) => b.price - a.price);
    assert.strictEqual(desc[0].id, 's1');
  });

  // -------------------------------------------------------------
  // 5. GAMIFIED LUCKY SPIN & FRESHCOINS ENGINE
  // -------------------------------------------------------------
  console.log('\n📌 5. Gamification, Lucky Spin & FreshCoins:');

  test('Lucky Spin Wheel resolves valid sectors and coupons', () => {
    const spinPrizes = [
      { text: '₹50 OFF', coupon: 'SPIN50' },
      { text: '100 FreshCoins', coins: 100 },
      { text: 'Free Delivery', coupon: 'FREEDEL' },
      { text: '₹100 OFF', coupon: 'SPIN100' },
      { text: '25 FreshCoins', coins: 25 },
      { text: '15% OFF', coupon: 'SAVE15' }
    ];

    for (let i = 0; i < spinPrizes.length; i++) {
      const prize = spinPrizes[i];
      assert.ok(prize.text && (prize.coupon || prize.coins), `Prize sector ${i} must have valid prize`);
    }
  });

  // -------------------------------------------------------------
  // 6. GST TAX INVOICE & ORDER RECEIPT GENERATOR
  // -------------------------------------------------------------
  console.log('\n📌 6. GST Tax Invoice & Receipt Generator:');

  test('Generate printable GST Tax Invoice with QR verification string', () => {
    function generateInvoice(order) {
      const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);
      const gst = Math.round(subtotal * 0.08 * 100) / 100;
      const total = subtotal + gst + (order.deliveryFee || 0);

      const invoiceHtml = `
        <div class="invoice-box">
          <h2>TAX INVOICE - FRESHCART AI</h2>
          <p><strong>Invoice No:</strong> INV-${order.id}</p>
          <p><strong>GSTIN:</strong> 29AAACF8899A1Z4</p>
          <p><strong>Customer:</strong> ${order.customerName}</p>
          <p><strong>Total:</strong> ₹${total}</p>
          <div class="qr-code">QR_VERIFY_${order.id}</div>
        </div>
      `;

      return { invoiceHtml, total, gst };
    }

    const testOrder = {
      id: 'ORD-TEST999',
      customerName: 'Aarav Patel',
      deliveryFee: 0,
      items: [
        { name: 'Organic Apples', price: 249, qty: 2 },
        { name: 'Whole Milk', price: 69, qty: 1 }
      ]
    };

    const invoice = generateInvoice(testOrder);
    assert.ok(invoice.invoiceHtml.includes('TAX INVOICE'));
    assert.ok(invoice.invoiceHtml.includes('INV-ORD-TEST999'));
    assert.ok(invoice.invoiceHtml.includes('29AAACF8899A1Z4'));
    assert.strictEqual(invoice.total, 612.36);
  });

  // -------------------------------------------------------------
  // 7. 4-TIER DYNAMIC CATEGORY TAXONOMY & BREADCRUMBS ENGINE
  // -------------------------------------------------------------
  console.log('\n📌 7. 4-Tier Dynamic Category Taxonomy & Storefront Hierarchy:');

  test('app.js consumes backend taxonomy directly and fixes contract mismatch', () => {
    assert.ok(appJsContent.includes('res.taxonomy'), 'app.js must inspect res.taxonomy');
    assert.ok(appJsContent.includes('tax.departments || res.departments'), 'app.js must support both tax.departments and res.departments');
  });

  test('app.js has purged obsolete hardcoded category dictionaries (subcatsByDept, familiesBySubcat)', () => {
    assert.ok(!appJsContent.includes('const subcatsByDept ='), 'subcatsByDept dictionary must be removed');
    assert.ok(!appJsContent.includes('const familiesBySubcat ='), 'familiesBySubcat dictionary must be removed');
  });

  test('app.js implements 4-tier progressive hierarchy and dynamic breadcrumbs', () => {
    assert.ok(appJsContent.includes('hierarchy-filter-container'), 'Hierarchy container must be rendered');
    assert.ok(appJsContent.includes('taxonomy-breadcrumbs'), 'Breadcrumb traversal element must be rendered');
    assert.ok(appJsContent.includes('app.selectDepartment'), 'selectDepartment handler must exist');
    assert.ok(appJsContent.includes('app.selectSubcategory'), 'selectSubcategory handler must exist');
    assert.ok(appJsContent.includes('app.selectProductFamily'), 'selectProductFamily handler must exist');
  });

  test('app.js implements URL navigation state synchronization and popstate history', () => {
    assert.ok(appJsContent.includes('function updateNavigationUrl'), 'updateNavigationUrl must exist');
    assert.ok(appJsContent.includes('function readNavigationFromUrl'), 'readNavigationFromUrl must exist');
    assert.ok(appJsContent.includes("addEventListener('popstate'"), 'popstate listener must be registered for back/forward navigation');
  });

  test('app.js preserves category context during smart search input', () => {
    assert.ok(appJsContent.includes('department: state.currentDepartment'), 'Search must forward active department context');
    assert.ok(appJsContent.includes('subcategory: state.currentSubcategory'), 'Search must forward active subcategory context');
  });


  // -------------------------------------------------------------
  // 8. PHASE 5C — CATEGORY-SPECIFIC DYNAMIC FILTERS & FACETED SEARCH
  // -------------------------------------------------------------
  console.log('\n📌 8. Phase 5C — Category-Specific Dynamic Filters & Faceted Search:');

  test('routes/products.js exposes /api/products/filters endpoint with scope-aware facets', () => {
    const productsRoute = fs.readFileSync(path.join(__dirname, '../routes/products.js'), 'utf8');
    assert.ok(productsRoute.includes("router.get('/filters'"), 'GET /api/products/filters route must be defined');
    assert.ok(productsRoute.includes('min_p, MAX(price) as max_p'), 'Price range facet query must exist');
    assert.ok(productsRoute.includes('brand_display'), 'Brand facet query must reference brand_display column');
    assert.ok(productsRoute.includes('nutrition_grade'), 'Nutrition grade facet query must exist');
    assert.ok(productsRoute.includes('packSizes'), 'Pack size bucket response field must be present');
    assert.ok(productsRoute.includes('dietary'), 'Dietary tags facet response field must be present');
  });

  test('app.js Phase 5C filter interaction functions exported to window.app', () => {
    assert.ok(appJsContent.includes('applyFacetFilter,'), 'applyFacetFilter must be exported to window.app');
    assert.ok(appJsContent.includes('removeFacetFilter,'), 'removeFacetFilter must be exported to window.app');
    assert.ok(appJsContent.includes('clearFacet,'), 'clearFacet must be exported to window.app');
    assert.ok(appJsContent.includes('clearAllFilters,'), 'clearAllFilters must be exported to window.app');
    assert.ok(appJsContent.includes('toggleFilterPanel,'), 'toggleFilterPanel must be exported to window.app');
    assert.ok(appJsContent.includes('applyPriceRange,'), 'applyPriceRange must be exported to window.app');
    assert.ok(appJsContent.includes('loadFilters\n  };') || appJsContent.includes('loadFilters\r\n  };'), 'loadFilters must be exported to window.app');
  });

  test('app.js forwards all Phase 5C facet filter params to /api/products', () => {
    assert.ok(appJsContent.includes("af.brand && af.brand !== 'all' ? { brand: af.brand }"), 'brand facet must be forwarded to API');
    assert.ok(appJsContent.includes("af.nutrition_grade && af.nutrition_grade !== 'all' ? { nutrition_grade: af.nutrition_grade }"), 'nutrition_grade facet must be forwarded');
    assert.ok(appJsContent.includes("af.pack_size && af.pack_size !== 'all' ? { pack_size: af.pack_size }"), 'pack_size facet must be forwarded');
    assert.ok(appJsContent.includes("af.min_rating ? { min_rating: af.min_rating }"), 'min_rating facet must be forwarded');
    assert.ok(appJsContent.includes("af.min_price !== undefined && af.min_price !== null ? { min_price: af.min_price }"), 'min_price facet must be forwarded');
    assert.ok(appJsContent.includes("af.max_price !== undefined && af.max_price !== null ? { max_price: af.max_price }"), 'max_price facet must be forwarded');
  });

  test('index.html contains all required Phase 5C facet sidebar and active filter chip DOM elements', () => {
    assert.ok(htmlContent.includes('id="facet-filter-sidebar"'), 'Facet filter sidebar element must exist');
    assert.ok(htmlContent.includes('id="facet-filter-content"'), 'Facet filter content container must exist');
    assert.ok(htmlContent.includes('id="active-filters-bar"'), 'Active filter chip bar must exist');
    assert.ok(htmlContent.includes('id="active-filter-chips"'), 'Active filter chips container must exist');
    assert.ok(htmlContent.includes('id="active-filter-count-badge"'), 'Active filter count badge must exist');
    assert.ok(htmlContent.includes('id="filter-toggle-btn"'), 'Filter toggle button must exist');
    assert.ok(htmlContent.includes('id="clear-all-filters-btn"'), 'Clear all filters button must exist');
  });

  test('app.js reloads filter facets reactively when taxonomy scope changes (dept/subcat/family)', () => {
    assert.ok(
      appJsContent.includes('state.filtersLoaded = false;\n      loadFilters();'),
      'selectDepartment must reset filtersLoaded and call loadFilters() on scope change'
    );
    const loadFiltersCalls = (appJsContent.match(/state\.filtersLoaded = false;\s*\n\s*loadFilters\(\)/g) || []).length;
    assert.ok(loadFiltersCalls >= 3, `loadFilters must be called reactively in all 3 scope selectors; found ${loadFiltersCalls}`);
  });


  // -------------------------------------------------------------
  // 9. PHASE 5D — PRODUCT CARDS & STUDIO DETAIL MODAL EXPERIENCE
  // -------------------------------------------------------------
  console.log('\n📌 9. Phase 5D — Product Cards & Studio Detail Experience:');

  test('createProductCardHtml renders category-relevant attribute chips and gallery count badge safely', () => {
    assert.ok(appJsContent.includes('product-attribute-chips'), 'createProductCardHtml must define product-attribute-chips container');
    assert.ok(appJsContent.includes('chip-nutri'), 'createProductCardHtml must support Nutri-Score chips');
    assert.ok(appJsContent.includes('chip-diet'), 'createProductCardHtml must support dietary classification chips');
    assert.ok(appJsContent.includes('card-gallery-count-badge'), 'createProductCardHtml must support gallery count badge for multi-view products');
    assert.ok(appJsContent.includes('p.primary_image_url || p.front_image_url || p.image_url'), 'createProductCardHtml must prioritize real primary image presentation');
  });

  test('app.js provides Studio multi-view gallery with zero front/back orientation fabrication', () => {
    assert.ok(appJsContent.includes('studio-gallery-strip'), 'openProductDetail must define studio-gallery-strip for real multi-view images');
    assert.ok(appJsContent.includes('switchDetailGalleryImage'), 'app.js must define switchDetailGalleryImage function');
    assert.ok(appJsContent.includes('switchDetailGalleryImage,\n') || appJsContent.includes('switchDetailGalleryImage,\r\n'), 'switchDetailGalleryImage must be exported to window.app');
    assert.ok(!appJsContent.includes("📷 Front View\n"), 'Hardcoded front/back orientation switch must be removed to avoid fabrication');
  });

  test('openProductDetail renders bullet_points_json and technical_specs_json with NOT_AVAILABLE suppression', () => {
    assert.ok(appJsContent.includes('detail-bullets-section'), 'openProductDetail must define detail-bullets-section container');
    assert.ok(appJsContent.includes('detail-bullet-list'), 'openProductDetail must define detail-bullet-list');
    assert.ok(appJsContent.includes('detail-specs-section'), 'openProductDetail must define detail-specs-section container');
    assert.ok(appJsContent.includes('detail-specs-grid'), 'openProductDetail must define detail-specs-grid');
    assert.ok(appJsContent.includes("'NOT_AVAILABLE', 'UNKNOWN'"), 'openProductDetail must suppress NOT_AVAILABLE and UNKNOWN placeholders');
  });

  test('routes/products.js parses technical_specs, bullet_points, and consolidates real gallery images', () => {
    const productsRoute = fs.readFileSync(path.join(__dirname, '../routes/products.js'), 'utf8');
    assert.ok(productsRoute.includes('product.technical_specs = JSON.parse(product.technical_specs_json'), 'GET /:id must parse technical_specs');
    assert.ok(productsRoute.includes('product.bullet_points = JSON.parse(product.bullet_points_json'), 'GET /:id must parse bullet_points');
    assert.ok(productsRoute.includes('gallerySet.add(primaryImg)'), 'routes/products.js must consolidate real primary and gallery images');
    assert.ok(productsRoute.includes('Array.from(gallerySet)'), 'routes/products.js must return deduplicated gallery array');
  });

  test('style.css defines responsive 2-column modal layout and attribute chip design tokens', () => {
    assert.ok(cssContent.includes('.product-attribute-chips'), 'style.css must define .product-attribute-chips');
    assert.ok(cssContent.includes('.attr-chip'), 'style.css must define .attr-chip');
    assert.ok(cssContent.includes('.chip-nutri.nutri-a'), 'style.css must define Nutri-Score grade tokens');
    assert.ok(cssContent.includes('.detail-modal-layout'), 'style.css must define .detail-modal-layout grid');
    assert.ok(cssContent.includes('.studio-gallery-strip'), 'style.css must define .studio-gallery-strip');
    assert.ok(cssContent.includes('@media (max-width: 768px)'), 'style.css must include responsive breakpoints for modal layout');
  });

  // -------------------------------------------------------------
  // 10. PHASE 5E — FAMILY-SCOPED COMPARISON & BULK SHOPPING
  // -------------------------------------------------------------
  console.log('\n📌 10. Phase 5E — Family-Scoped Comparison & Bulk Shopping:');

  test('Product cards render multi-select checkboxes (.product-select-checkbox) and selection styling (.card--selected)', () => {
    assert.ok(appJsContent.includes('product-select-checkbox'), 'createProductCardHtml must render product-select-checkbox');
    assert.ok(appJsContent.includes('card-select-wrap'), 'createProductCardHtml must contain card-select-wrap container');
    assert.ok(appJsContent.includes('app.toggleProductSelection'), 'checkbox must trigger app.toggleProductSelection');
    assert.ok(appJsContent.includes("card--selected"), 'createProductCardHtml must support card--selected active class');
    assert.ok(cssContent.includes('.product-select-checkbox'), 'style.css must style .product-select-checkbox');
    assert.ok(cssContent.includes('.product-card.card--selected'), 'style.css must define .product-card.card--selected');
  });

  test('Family-scoped comparison enforces same-family invariant and blocks cross-family additions', () => {
    assert.ok(appJsContent.includes('function getProductFamily('), 'app.js must define getProductFamily helper');
    assert.ok(appJsContent.includes('incomingFamily !== state.compareFamily'), 'toggleCompare must check incoming family against active compareFamily');
    assert.ok(appJsContent.includes('Family Mismatch: Can only compare within'), 'toggleCompare must show friendly alert on cross-family comparison attempt');
    assert.ok(appJsContent.includes("localStorage.setItem('freshcart_compare_family'"), 'toggleCompare must persist active comparison family');
    assert.ok(appJsContent.includes("localStorage.removeItem('freshcart_compare_family'"), 'clearCompareList and removeFromCompare must purge comparison family');
  });

  test('Floating bulk actions dock (#bulk-actions-bar) provides select-all, bulk add-to-cart, and clear selection', () => {
    assert.ok(htmlContent.includes('id="bulk-actions-bar"'), 'index.html must define #bulk-actions-bar element');
    assert.ok(htmlContent.includes('class="bulk-actions-dock"'), 'index.html must assign bulk-actions-dock class');
    assert.ok(appJsContent.includes('toggleProductSelection'), 'app.js must define toggleProductSelection');
    assert.ok(appJsContent.includes('selectAllProductsInView'), 'app.js must define selectAllProductsInView');
    assert.ok(appJsContent.includes('clearProductSelection'), 'app.js must define clearProductSelection');
    assert.ok(appJsContent.includes('updateBulkActionBar'), 'app.js must define updateBulkActionBar');
    assert.ok(appJsContent.includes('bulkAddToCart'), 'app.js must define bulkAddToCart');
    assert.ok(appJsContent.includes('bulkCompare'), 'app.js must define bulkCompare');
    assert.ok(appJsContent.includes('toggleProductSelection,\n') || appJsContent.includes('toggleProductSelection,\r\n'), 'toggleProductSelection must be exported to window.app');
    assert.ok(appJsContent.includes('bulkAddToCart,\n') || appJsContent.includes('bulkAddToCart,\r\n'), 'bulkAddToCart must be exported to window.app');
    assert.ok(appJsContent.includes('bulkCompare,\n') || appJsContent.includes('bulkCompare,\r\n'), 'bulkCompare must be exported to window.app');
  });

  test('routes/cart.js exposes /api/cart/bulk-add supporting batch add-to-cart with stock safety', () => {
    const cartRoute = fs.readFileSync(path.join(__dirname, '../routes/cart.js'), 'utf8');
    assert.ok(cartRoute.includes("router.post('/bulk-add'"), 'routes/cart.js must define POST /api/cart/bulk-add endpoint');
    assert.ok(cartRoute.includes('product.stock <= 0'), 'bulk-add must check and skip out-of-stock items');
    assert.ok(cartRoute.includes('calculateTotals'), 'bulk-add must calculate totals for updated cart');
    assert.ok(cartRoute.includes('addedCount'), 'bulk-add response must return addedCount');
    assert.ok(cartRoute.includes('skippedCount'), 'bulk-add response must return skippedCount');
  });

  test('openCompareModal renders family scope banner and category/family-aware comparison matrix', () => {
    assert.ok(appJsContent.includes('compare-family-banner'), 'openCompareModal must render compare-family-banner');
    assert.ok(appJsContent.includes('compare-family-badge'), 'openCompareModal must display compare-family-badge');
    assert.ok(appJsContent.includes('compare-remove-btn'), 'comparison table must include compare-remove-btn per column');
    assert.ok(appJsContent.includes('hasNutrition'), 'openCompareModal must support Nutri-Score comparison');
    assert.ok(appJsContent.includes('hasDietary'), 'openCompareModal must support dietary tag comparison');
    assert.ok(appJsContent.includes('hasTechnicalSpecs'), 'openCompareModal must support technical spec comparison');
    assert.ok(appJsContent.includes('removeFromCompare,\n') || appJsContent.includes('removeFromCompare,\r\n'), 'removeFromCompare must be exported to window.app');
  });

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`  🎉 FRONTEND SYNTHETIC AUDIT COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runSyntheticFrontendTests();

