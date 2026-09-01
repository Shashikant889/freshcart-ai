/**
 * FreshCart AI — Frontend Application Logic (v2.5 Enterprise Quick-Commerce Edition)
 * Integrates:
 * - JWT Auth & User Session State
 * - AI Hybrid Collaborative & Content Recommendations
 * - Voice Search (Web Speech API) & Multimodal Visual Scanner
 * - 10-Min Live Delivery Stepper & Animated Courier Map Canvas
 * - Gamified Lucky Spin Wheel & Post-Order Scratch Card
 * - Daily Milk Subscriptions & Smart Pantry Tracker
 * - Printable GST Tax Invoice & QR Code Verification
 * - Flash Deals, Curated Value Combos, Dietary Filters, Rider Tips & Delivery Instructions
 * - Bilingual Hindi / English Toggle & Day/Night Themes
 */

(function () {
  'use strict';

  // DOM Query Helpers
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  function safeJsonParse(val, fallback) {
    try {
      return val ? JSON.parse(val) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function generateUUID() {
    return 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Application State
  const state = {
    user: null,
    token: localStorage.getItem('freshcart_token') || null,
    sessionId: localStorage.getItem('freshcart_session') || generateUUID(),
    products: [],
    recommendedProducts: [],
    cart: { items: [], subtotal: 0, deliveryFee: 49, tax: 0, total: 0, itemCount: 0 },
    currentCategory: 'all',
    currentDiet: 'all',
    currentSort: 'rating',
    searchQuery: '',
    searchTimeout: null,
    coins: 250,
    language: 'en',
    theme: 'dark',
    activeTip: 20,
    isEcoBag: true,
    appliedCoupon: null,
    currentHub: 'Indiranagar Hub #04',
    hubEta: '11 Mins',
    lastPlacedOrder: null,
    subscriptions: [
      { id: 'sub-1', name: 'Fresh Whole Milk (1L)', emoji: '🥛', image_url: '/images/products/milk-toned.svg', price: 69, frequency: 'Daily (7:00 AM)', active: true },
      { id: 'sub-2', name: 'Artisan Sourdough Bread', emoji: '🍞', image_url: '/images/products/sourdough-bread.svg', price: 89, frequency: 'Mon, Wed, Fri', active: true },
      { id: 'sub-3', name: 'Farm Fresh Organic Eggs (6pcs)', emoji: '🥚', image_url: '/images/products/farm-eggs.svg', price: 85, frequency: 'Daily (7:00 AM)', active: false }
    ],
    pantryItems: [
      { name: 'Cow Milk (1L)', emoji: '🥛', image_url: '/images/products/milk-toned.svg', daysLeft: 1, stockLevel: 'Low', status: 'low' },
      { name: 'Brown Bread', emoji: '🍞', image_url: '/images/products/sourdough-bread.svg', daysLeft: 2, stockLevel: 'Low', status: 'low' },
      { name: 'Eggs (Dozen)', emoji: '🥚', image_url: '/images/products/farm-eggs.svg', daysLeft: 4, stockLevel: 'Medium', status: 'ok' },
      { name: 'Basmati Rice (5kg)', emoji: '🍚', image_url: '/images/products/basmati-rice.svg', daysLeft: 14, stockLevel: 'Good', status: 'ok' },
      { name: 'Sunflower Oil (1L)', emoji: '🌻', image_url: '/images/products/sunflower-oil.svg', daysLeft: 8, stockLevel: 'Medium', status: 'ok' }
    ],
    wishlist: safeJsonParse(localStorage.getItem('freshcart_wishlist'), []),
    compareList: safeJsonParse(localStorage.getItem('freshcart_compare'), []),
    recentlyViewed: safeJsonParse(localStorage.getItem('freshcart_recent'), []),
    smartBundles: [],
    buyAgain: []
  };

  localStorage.setItem('freshcart_session', state.sessionId);

  // In-Memory API Cache for instant responses & zero redundant roundtrips
  const apiCache = new Map();

  function invalidateApiCache(prefix = '') {
    if (!prefix) {
      apiCache.clear();
      return;
    }
    for (const key of apiCache.keys()) {
      if (key.startsWith(prefix)) apiCache.delete(key);
    }
  }

  // API Request Wrapper with Caching & Deduplication
  async function api(endpoint, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const useCache = options.useCache !== false && method === 'GET';
    const cacheKey = `${endpoint}::${state.token || 'anon'}::${state.sessionId}`;

    if (useCache && apiCache.has(cacheKey)) {
      const cached = apiCache.get(cacheKey);
      if (Date.now() - cached.timestamp < (options.ttl || 30000)) {
        return cached.data;
      }
      apiCache.delete(cacheKey);
    }

    const headers = {
      'Content-Type': 'application/json',
      'x-session-id': state.sessionId,
      ...(state.token ? { 'Authorization': `Bearer ${state.token}` } : {}),
      ...(options.headers || {})
    };

    try {
      const res = await fetch(endpoint, { ...options, headers });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'API request failed');
      }
      if (useCache) {
        apiCache.set(cacheKey, { data, timestamp: Date.now() });
      }
      return data;
    } catch (err) {
      if (!options.silent) {
        showToast(err.message, 'error');
      }
      throw err;
    }
  }

  // Toast Notification with Smooth Animated Exit
  function showToast(message, type = 'success') {
    const container = $('#toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-leave');
      setTimeout(() => toast.remove(), 260);
    }, 3200);
  }

  // ----------------------------------------------------
  // Bilingual Hindi / English Dictionary
  // ----------------------------------------------------
  const DICT = {
    hi: {
      searchPlaceholder: "सब्जियां, फल, दूध, दही, स्नैक्स खोजें...",
      cart: "कार्ट",
      exploreProducts: "सामान देखें ↓",
      recommended: "खास आपके लिए अनुशंसित",
      allCategory: "🛒 सभी सामान",
      freeDeliveryMsg: "₹500 से अधिक के आर्डर पर मुफ़्त डिलीवरी!",
      addToCart: "+ जोड़ें",
      subtotal: "कुल राशि",
      placeOrder: "आर्डर कन्फर्म करें (₹)",
      flashDeals: "⚡ आज के विशेष डिस्काउंट",
      combos: "🍳 स्मार्ट मील कॉम्बो पैक"
    },
    en: {
      searchPlaceholder: "Search groceries, e.g. 'organic apples', 'dahi', 'seb'...",
      cart: "Cart",
      exploreProducts: "Explore Products ↓",
      recommended: "Recommended Just For You",
      allCategory: "🛒 All Items",
      freeDeliveryMsg: "Add ₹500 for Free Delivery!",
      addToCart: "+ Add",
      subtotal: "Item Subtotal",
      placeOrder: "Confirm & Place Order (₹)",
      flashDeals: "⚡ Flash Deals & Fresh Steals",
      combos: "Curated Smart Combos"
    }
  };

  function toggleLanguage() {
    state.language = state.language === 'en' ? 'hi' : 'en';
    const lang = state.language;
    $('#lang-label').textContent = lang === 'en' ? 'हिन्दी' : 'English';
    $('#search-input').placeholder = DICT[lang].searchPlaceholder;
    showToast(`Language switched to ${lang === 'en' ? 'English' : 'Hindi (हिन्दी)'}`);
    renderProductsGrid();
    renderRecommendationsGrid();
  }

  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    if (state.theme === 'light') {
      document.body.classList.add('light-theme');
      $('#theme-icon').textContent = '🌙';
    } else {
      document.body.classList.remove('light-theme');
      $('#theme-icon').textContent = '☀️';
    }
  }

  // ----------------------------------------------------
  // Authentication Management
  // ----------------------------------------------------
  async function checkAuth() {
    if (!state.token) {
      updateAuthUI(null);
      return;
    }
    try {
      const res = await api('/api/auth/me');
      state.user = res.data;
      updateAuthUI(state.user);
    } catch (e) {
      logout();
    }
  }

  function updateAuthUI(user) {
    const authBtnText = $('#auth-btn-text');
    const recSubtitle = $('#rec-subtitle');
    const recAlgoBadge = $('#rec-algo-badge');
    const navAdminLabel = $('#nav-admin-label');

    if (user) {
      authBtnText.textContent = user.name.split(' ')[0] + ' (Sign Out)';
      $('#login-modal-btn').onclick = logout;
      if (recSubtitle) recSubtitle.textContent = `Personalized for ${user.name} using Collaborative & Content AI`;
      if (recAlgoBadge) recAlgoBadge.textContent = 'Hybrid User-User Collaborative Filtering';

      if (user.role === 'admin') {
        if (navAdminLabel) navAdminLabel.textContent = 'Admin & AI ⚡';
      } else {
        if (navAdminLabel) navAdminLabel.textContent = 'Admin & AI';
      }
    } else {
      authBtnText.textContent = 'Sign In';
      $('#login-modal-btn').onclick = () => openAuthModal('login');
      if (recSubtitle) recSubtitle.textContent = 'Trending items • Sign in for personalized Collaborative AI suggestions';
      if (recAlgoBadge) recAlgoBadge.textContent = 'Popularity & Trending ML';
      if (navAdminLabel) navAdminLabel.textContent = 'Admin & AI';
    }
  }

  async function handleLogin(email, password) {
    try {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      state.token = res.data.token;
      state.user = res.data.user;
      localStorage.setItem('freshcart_token', state.token);
      invalidateApiCache();
      updateAuthUI(state.user);
      closeAuthModal();
      showToast(`Welcome back, ${state.user.name}!`);
      loadRecommendations();
      loadCart();
    } catch (e) {}
  }

  async function handleRegister(name, email, password) {
    try {
      const res = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });
      state.token = res.data.token;
      state.user = res.data.user;
      localStorage.setItem('freshcart_token', state.token);
      invalidateApiCache();
      updateAuthUI(state.user);
      closeAuthModal();
      showToast(`Account created for ${state.user.name}!`);
      loadRecommendations();
      loadCart();
    } catch (e) {}
  }

  function logout() {
    state.token = null;
    state.user = null;
    localStorage.removeItem('freshcart_token');
    invalidateApiCache();
    updateAuthUI(null);
    showToast('Signed out successfully');
    loadRecommendations();
    loadCart();
  }

  function openAuthModal(tab = 'login') {
    $('#auth-overlay').style.display = 'flex';
    switchAuthTab(tab);
  }

  function closeAuthModal() {
    $('#auth-overlay').style.display = 'none';
  }

  function switchAuthTab(tab) {
    if (tab === 'login') {
      $('#tab-login').classList.add('active');
      $('#tab-register').classList.remove('active');
      $('#login-form').style.display = 'block';
      $('#register-form').style.display = 'none';
    } else {
      $('#tab-login').classList.remove('active');
      $('#tab-register').classList.add('active');
      $('#login-form').style.display = 'none';
      $('#register-form').style.display = 'block';
    }
  }

  // ----------------------------------------------------
  // Product Catalog & Recommendations Loading
  // ----------------------------------------------------
  function renderProductsSkeleton() {
    const grid = $('#products-grid');
    if (!grid) return;
    grid.innerHTML = Array.from({ length: 6 }).map(() => `
      <div class="skeleton-card">
        <div class="skeleton-box img"></div>
        <div class="skeleton-box title"></div>
        <div class="skeleton-box text"></div>
        <div class="skeleton-box footer"></div>
      </div>
    `).join('');
  }

  function renderRecommendationsSkeleton() {
    const grid = $('#ai-recs-grid');
    if (!grid) return;
    grid.innerHTML = Array.from({ length: 4 }).map(() => `
      <div class="skeleton-card">
        <div class="skeleton-box img"></div>
        <div class="skeleton-box title"></div>
        <div class="skeleton-box text"></div>
        <div class="skeleton-box footer"></div>
      </div>
    `).join('');
  }

  // ----------------------------------------------------
  // 8 Quick-Commerce Major Departments & Category Engine
  // ----------------------------------------------------
  const DEPARTMENTS = [
    { id: 'all', name: 'All Departments', emoji: '🌟' },
    { id: 'produce', name: 'Fruits & Veggies', emoji: '🍎', keywords: ['vegetable', 'fruit', 'herb', 'organic', 'greens', 'exotic', 'hydroponic', 'leafy', 'onion', 'potato', 'tomato', 'mango', 'apple', 'banana', 'citrus'] },
    { id: 'dairy', name: 'Dairy & Bakery', emoji: '🥛', keywords: ['dairy', 'milk', 'cheese', 'butter', 'yogurt', 'paneer', 'bread', 'bakery', 'egg', 'cream', 'toast', 'bun', 'curd', 'ghee'] },
    { id: 'snacks', name: 'Snacks & Munchies', emoji: '🍿', keywords: ['snack', 'chips', 'biscuit', 'chocolate', 'namkeen', 'dry_fruit', 'nut', 'popcorn', 'sweet', 'cookie', 'wafer', 'candy', 'munch'] },
    { id: 'beverages', name: 'Drinks & Juices', emoji: '🥤', keywords: ['drink', 'beverage', 'juice', 'tea', 'coffee', 'soda', 'water', 'energy', 'cola', 'syrup', 'shake', 'cold'] },
    { id: 'staples', name: 'Atta, Rice & Dals', emoji: '🌾', keywords: ['staple', 'atta', 'flour', 'rice', 'dal', 'pulse', 'oil', 'spice', 'salt', 'sugar', 'masala', 'grain', 'wheat', 'lentil', 'mustard'] },
    { id: 'cleaning', name: 'Cleaning & Home', emoji: '🧼', keywords: ['clean', 'detergent', 'dishwash', 'tissue', 'garbage', 'freshener', 'mop', 'repellent', 'pooja', 'home', 'spray', 'wash'] },
    { id: 'personal', name: 'Personal & Baby Care', emoji: '💆', keywords: ['personal', 'soap', 'shampoo', 'oral', 'skincare', 'haircare', 'deo', 'sanitary', 'paste', 'brush', 'bath', 'baby', 'pet', 'lotion', 'cream'] }
  ];

  function getCategoryDepartment(catId, catName) {
    const text = ((catId || '') + ' ' + (catName || '')).toLowerCase();
    for (const d of DEPARTMENTS) {
      if (d.keywords && d.keywords.some(k => text.includes(k))) {
        return d;
      }
    }
    return DEPARTMENTS[5]; // defaults to staples
  }

  async function loadCategories() {
    try {
      const res = await api('/api/products/categories');
      if (res) {
        const raw = res.categories || res.data || [];
        state.categoriesList = raw.map(c => typeof c === 'string' ? {
          id: c,
          name: c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, ' '),
          emoji: '🛒',
          department: 'General Grocery',
          count: ''
        } : {
          id: c.id || c.category,
          name: c.name || (c.id ? c.id.charAt(0).toUpperCase() + c.id.slice(1).replace(/_/g, ' ') : 'Category'),
          emoji: c.emoji || '🛒',
          department: c.department || 'General Grocery',
          count: c.productCount || c.count || ''
        });
        renderCategorySelector();
      }
    } catch (e) {
      console.warn('Error loading categories:', e);
    }
  }

  function renderCategorySelector() {
    const container = $('#dynamic-category-bar');
    if (!container || !state.categoriesList) return;

    state.currentDepartment = state.currentDepartment || 'all';

    // Filter categories for the active department
    let visibleCats = state.categoriesList;
    if (state.currentDepartment !== 'all') {
      const deptObj = DEPARTMENTS.find(d => d.id === state.currentDepartment);
      if (deptObj && deptObj.keywords) {
        visibleCats = state.categoriesList.filter(c => {
          const text = (c.id + ' ' + c.name).toLowerCase();
          return deptObj.keywords.some(k => text.includes(k));
        });
      }
    }

    const topChips = visibleCats.slice(0, 12);

    container.innerHTML = `
      <!-- Major Department Filter Rail -->
      <div class="dept-filter-rail" role="tablist" aria-label="Grocery Departments">
        ${DEPARTMENTS.map(d => `
          <button class="dept-pill ${state.currentDepartment === d.id ? 'active' : ''}" 
                  onclick="app.selectDepartment('${d.id}')"
                  role="tab"
                  aria-selected="${state.currentDepartment === d.id}">
            <span>${d.emoji}</span>
            <span>${d.name}</span>
          </button>
        `).join('')}
      </div>

      <!-- Subcategory Horizontal Scrolling Chips & Mega Directory Trigger -->
      <div class="category-subrail-wrap">
        <div class="category-chips-container" role="tablist" aria-label="Categories">
          <button class="cat-pill ${state.currentCategory === 'all' ? 'active' : ''}" onclick="app.selectCategory('all')">
            🛒 All Items <span class="cat-count-badge">${state.totalProductsCount ? state.totalProductsCount.toLocaleString() : '10,000'}</span>
          </button>
          ${topChips.map(c => `
            <button class="cat-pill ${state.currentCategory === c.id ? 'active' : ''}" onclick="app.selectCategory('${c.id}')">
              ${c.emoji || '🛒'} ${c.name} <span class="cat-count-badge">${c.count || ''}</span>
            </button>
          `).join('')}
        </div>

        <button class="btn-mega-cat" onclick="app.openCategoryMegaModal()" title="Explore all 108 categories">
          📂 All 108 Categories (${state.categoriesList.length})
        </button>

        <!-- Keep full-category-select in DOM for test & accessibility parity -->
        <div class="category-select-wrapper" style="display:none;">
          <select id="full-category-select" class="category-dropdown-select" onchange="app.selectCategory(this.value)">
            <option value="">📂 All 108 Categories (${state.categoriesList.length} total)...</option>
            ${state.categoriesList.map(c => `
              <option value="${c.id}" ${state.currentCategory === c.id ? 'selected' : ''}>
                ${c.emoji || '🛒'} ${c.name} — ${c.department || 'General'} (${c.count || ''} items)
              </option>
            `).join('')}
          </select>
        </div>
      </div>
    `;
  }

  // 108 Categories Mega Navigation Directory Modal
  function openCategoryMegaModal() {
    const overlay = $('#category-mega-overlay');
    if (!overlay) return;
    renderMegaCategories('');
    overlay.style.display = 'flex';
    const input = $('#category-mega-search-input');
    if (input) {
      input.value = '';
      input.focus();
    }
  }

  function closeCategoryMegaModal() {
    const overlay = $('#category-mega-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  function renderMegaCategories(query = '') {
    const grid = $('#category-mega-grid');
    const countEl = $('#category-mega-match-count');
    if (!grid || !state.categoriesList) return;

    const q = (query || '').trim().toLowerCase();
    let matchedCats = state.categoriesList;
    if (q) {
      matchedCats = state.categoriesList.filter(c => 
        c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
      );
    }

    if (countEl) {
      countEl.textContent = `${matchedCats.length} categorie${matchedCats.length === 1 ? '' : 's'}`;
    }

    // Group matched categories by department
    const groups = {};
    DEPARTMENTS.filter(d => d.id !== 'all').forEach(d => {
      groups[d.id] = { dept: d, items: [] };
    });

    matchedCats.forEach(c => {
      const dept = getCategoryDepartment(c.id, c.name);
      if (groups[dept.id]) {
        groups[dept.id].items.push(c);
      } else {
        groups['staples'].items.push(c);
      }
    });

    grid.innerHTML = Object.values(groups)
      .filter(g => g.items.length > 0)
      .map(g => `
        <div class="category-dept-card">
          <div class="category-dept-title">
            <span>${g.dept.emoji}</span>
            <span>${g.dept.name} (${g.items.length})</span>
          </div>
          <div class="category-dept-items">
            ${g.items.map(c => `
              <button class="category-mega-item-btn ${state.currentCategory === c.id ? 'active' : ''}" 
                      onclick="app.selectCategoryFromMega('${c.id}')">
                <span>${c.emoji || '🛒'}</span>
                <span>${highlightSearchMatch(c.name, q)}</span>
                ${c.count ? `<small style="opacity:0.75; font-size:0.7rem;">(${c.count})</small>` : ''}
              </button>
            `).join('')}
          </div>
        </div>
      `).join('');
  }

  function getPaginationPages(current, total) {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages = [];
    pages.push(1);

    const start = Math.max(2, current - 2);
    const end = Math.min(total - 1, current + 2);

    if (start > 2) {
      pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < total - 1) {
      pages.push('...');
    }

    pages.push(total);
    return pages;
  }

  async function loadProducts(page = 1) {
    try {
      state.currentPage = page;
      if (!state.products || state.products.length === 0) {
        renderProductsSkeleton();
      }
      const params = new URLSearchParams({
        category: state.currentCategory,
        sort: state.currentSort,
        page: state.currentPage,
        limit: 24,
        ...(state.currentDiet && state.currentDiet !== 'all' ? { diet: state.currentDiet } : {}),
        ...(state.searchQuery ? { search: state.searchQuery } : {})
      });
      const res = await api(`/api/products?${params.toString()}`);
      state.products = res.data || [];
      state.currentPage = res.page || 1;
      state.totalPages = res.totalPages || 1;
      state.totalProductsCount = res.total || state.products.length;

      renderProductsGrid();
      renderPaginationControls();
      renderCategorySelector();
      renderFlashDeals();
      renderComboPacks();
    } catch (e) {
      console.warn('Error loading products:', e);
    }
  }

  function renderPaginationControls() {
    let paginationEl = $('#catalog-pagination');
    if (!paginationEl) {
      const grid = $('#products-grid');
      if (!grid) return;
      paginationEl = document.createElement('div');
      paginationEl.id = 'catalog-pagination';
      paginationEl.className = 'catalog-pagination-bar';
      grid.parentNode.insertBefore(paginationEl, grid.nextSibling);
    }

    if (state.totalPages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }

    const startItem = (state.currentPage - 1) * 24 + 1;
    const endItem = Math.min(state.currentPage * 24, state.totalProductsCount);
    const pages = getPaginationPages(state.currentPage, state.totalPages);

    paginationEl.innerHTML = `
      <div class="pagination-meta">
        <span class="pagination-range-text">
          Showing <strong>${startItem.toLocaleString()}–${endItem.toLocaleString()}</strong> of <strong>${state.totalProductsCount.toLocaleString()}</strong> products
        </span>
      </div>

      <!-- Desktop & Tablet Navigation Controls -->
      <div class="pagination-nav-group">
        <button class="pagination-btn pagination-prev ${state.currentPage <= 1 ? 'disabled' : ''}" 
                ${state.currentPage <= 1 ? 'disabled' : ''} 
                onclick="app.goToPage(${state.currentPage - 1})"
                aria-label="Go to previous page">
          ◀ Previous
        </button>

        <div class="pagination-pages-list" role="navigation" aria-label="Pagination Pages">
          ${pages.map(p => {
            if (p === '...') {
              return `<span class="pagination-ellipsis" aria-hidden="true">…</span>`;
            }
            const isActive = p === state.currentPage;
            return `
              <button class="pagination-page-pill ${isActive ? 'active' : ''}"
                      onclick="app.goToPage(${p})"
                      ${isActive ? 'aria-current="page"' : ''}
                      aria-label="Page ${p}">
                ${p}
              </button>
            `;
          }).join('')}
        </div>

        <button class="pagination-btn pagination-next ${state.currentPage >= state.totalPages ? 'disabled' : ''}" 
                ${state.currentPage >= state.totalPages ? 'disabled' : ''} 
                onclick="app.goToPage(${state.currentPage + 1})"
                aria-label="Go to next page">
          Next ▶
        </button>
      </div>

      <!-- Direct Jump To Page Form -->
      <div class="pagination-jump-group">
        <span class="jump-label">Go to page:</span>
        <div class="jump-input-wrap">
          <input type="number" 
                 id="catalog-jump-input" 
                 class="pagination-jump-input" 
                 min="1" 
                 max="${state.totalPages}" 
                 value="${state.currentPage}" 
                 aria-label="Target page number"
                 onkeydown="if(event.key==='Enter'){event.preventDefault(); app.handlePageJump();}">
          <button class="pagination-jump-go-btn" onclick="app.handlePageJump()">Go</button>
        </div>
      </div>

      <!-- Mobile Compact Bar (Shown on <= 768px) -->
      <div class="pagination-mobile-bar">
        <button class="pagination-btn-mobile" 
                ${state.currentPage <= 1 ? 'disabled' : ''} 
                onclick="app.goToPage(${state.currentPage - 1})"
                aria-label="Previous Page">◀</button>
        <span class="pagination-mobile-label">Page <strong>${state.currentPage}</strong> / ${state.totalPages}</span>
        <button class="pagination-mobile-jump-btn" onclick="app.promptMobileJump()">Go to page</button>
        <button class="pagination-btn-mobile" 
                ${state.currentPage >= state.totalPages ? 'disabled' : ''} 
                onclick="app.goToPage(${state.currentPage + 1})"
                aria-label="Next Page">▶</button>
      </div>
    `;
  }

  async function loadRecommendations() {
    try {
      if (!state.recommendedProducts || state.recommendedProducts.length === 0) {
        renderRecommendationsSkeleton();
      }
      const res = await api('/api/recommendations/personal?limit=6');
      state.recommendedProducts = res.data;
      renderRecommendationsGrid();
    } catch (e) {
      console.warn('Error loading recommendations:', e);
    }
  }

  // ----------------------------------------------------
  // Product Card Builder with Wishlist & Compare Badges
  // ----------------------------------------------------
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function handleImageError(imgEl, category) {
    if (!imgEl) return;
    imgEl.onerror = null;
    imgEl.classList.add('img-fallback');
    if (category) {
      imgEl.src = `/images/categories/dept-${category}.svg`;
    } else {
      imgEl.src = '/images/fallback.svg';
    }
  }
  window.handleImageError = handleImageError;

  function isWishlisted(id) {
    return state.wishlist && state.wishlist.includes(id);
  }

  function isComparing(id) {
    return state.compareList && state.compareList.includes(id);
  }

  function getCartItemQuantity(productId) {
    if (!state.cart || !state.cart.items) return 0;
    const item = state.cart.items.find(i => (i.productId || i.id) === productId);
    return item ? item.quantity : 0;
  }

  function createProductCardHtml(p, matchBadge = '') {
    const wishActive = isWishlisted(p.id);
    const compActive = isComparing(p.id);
    const inCartQty = getCartItemQuantity(p.id);
    const imgUrl = p.image_url || '/images/products/grocery-default.svg';
    const altText = escapeHtml(p.image_alt || p.name);
    const discount = p.discount || (p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0);
    const mrp = p.mrp || (discount > 0 ? Math.round(p.price * 1.2) : null);

    return `
      <div class="product-card" data-product-id="${p.id}">
        <div class="card-top-actions">
          <button class="card-action-btn ${wishActive ? 'active' : ''}" onclick="event.stopPropagation(); app.toggleWishlist('${p.id}')" title="${wishActive ? 'Remove from Wishlist' : 'Add to Wishlist'}" aria-label="Toggle Wishlist">
            ${wishActive ? '❤️' : '🤍'}
          </button>
          <button class="card-action-btn ${compActive ? 'compare-active' : ''}" onclick="event.stopPropagation(); app.toggleCompare('${p.id}')" title="${compActive ? 'Remove from Compare' : 'Add to Compare'}" aria-label="Toggle Compare">
            ⚖️
          </button>
        </div>
        ${matchBadge ? `<div class="card-match-badge">${matchBadge}</div>` : ''}
        
        <div class="product-image-container" onclick="app.openProductDetail('${p.id}')" role="button" tabindex="0" aria-label="View details for ${altText}">
          <span class="delivery-time-badge">⚡ 10 MINS</span>
          ${discount > 0 ? `<span class="discount-pill">${discount}% OFF</span>` : ''}
          <img class="product-image"
               src="${imgUrl}"
               alt="${altText}"
               loading="lazy"
               decoding="async"
               onerror="handleImageError(this, '${p.category || ''}')">
        </div>

        <div class="product-info">
          ${p.brand ? `<div class="product-brand-tag">${escapeHtml(p.brand)}</div>` : ''}
          <div class="product-name" onclick="app.openProductDetail('${p.id}')" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</div>
          <div class="product-pack-size">${escapeHtml(p.unit || '1 pack')}</div>
          <div class="product-rating">⭐ ${p.rating || 4.5} <span style="color:var(--text-dim); font-size:0.75rem;">(${p.review_count || 42})</span> • <small style="color:var(--text-dim);">${p.stock || 0} in stock</small></div>
          
          <div class="product-footer">
            <div class="card-price-row">
              <span class="selling-price">₹${p.price}</span>
              ${mrp && mrp > p.price ? `<span class="mrp-price">₹${mrp}</span>` : ''}
            </div>

            ${p.stock <= 0
              ? `<button class="btn-secondary" style="font-size:0.75rem; padding:5px 10px;" onclick="event.stopPropagation(); app.openStockAlertModal('${p.id}')">🔔 Notify</button>`
              : inCartQty > 0
                ? `<div class="card-qty-stepper">
                     <button class="card-qty-btn" onclick="event.stopPropagation(); app.updateCartQty('${p.id}', ${inCartQty - 1})" aria-label="Decrease quantity">-</button>
                     <span class="card-qty-val">${inCartQty}</span>
                     <button class="card-qty-btn" onclick="event.stopPropagation(); app.updateCartQty('${p.id}', ${inCartQty + 1})" aria-label="Increase quantity">+</button>
                   </div>`
                : `<button class="btn-add-cart" onclick="event.stopPropagation(); app.addToCart('${p.id}')">+ ADD</button>`
            }
          </div>
          <button class="btn-fbt-inline" onclick="event.stopPropagation(); app.openFBTModal('${p.id}')">✨ Pair with smart add-ons ›</button>
        </div>
      </div>
    `;
  }

  function renderRecommendationsGrid() {
    const grid = $('#ai-recs-grid');
    if (!grid) return;

    if (state.recommendedProducts.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-muted);">No recommendations available.</p>';
      return;
    }

    grid.innerHTML = state.recommendedProducts.map(p => 
      createProductCardHtml(p, `✨ ${p.matchPercentage || 95}% Match`)
    ).join('');
  }

  function renderProductsGrid() {
    const grid = $('#products-grid');
    if (!grid) return;

    let filtered = state.products;

    // Apply Dietary Filter if selected
    if (state.currentDiet && state.currentDiet !== 'all') {
      filtered = filtered.filter(p => {
        const text = (p.name + ' ' + p.description + ' ' + (p.tags || []).join(' ')).toLowerCase();
        if (state.currentDiet === 'organic') return text.includes('organic') || text.includes('farm');
        if (state.currentDiet === 'protein') return text.includes('egg') || text.includes('milk') || text.includes('yogurt') || text.includes('nut') || text.includes('protein');
        if (state.currentDiet === 'keto') return text.includes('avocado') || text.includes('broccoli') || text.includes('spinach') || text.includes('egg') || text.includes('butter');
        if (state.currentDiet === 'gluten-free') return !text.includes('bread') && !text.includes('biscuit') && !text.includes('atta');
        if (state.currentDiet === 'diabetic') return text.includes('spinach') || text.includes('broccoli') || text.includes('almond') || text.includes('apple');
        return true;
      });
    }

    if (filtered.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted); font-size:1.1rem;">No products found matching your active filter.</div>';
      return;
    }

    grid.innerHTML = filtered.map(p => createProductCardHtml(p)).join('');
  }

  // ----------------------------------------------------
  // "Buy Again & Reorder" Feature Module
  // ----------------------------------------------------
  async function loadBuyAgain() {
    try {
      const res = await api('/api/recommendations/buy-again?limit=4');
      if (res && res.data) {
        state.buyAgain = res.data;
        renderBuyAgainGrid();
      }
    } catch (e) {
      console.warn('Error loading buy again items:', e);
    }
  }

  function renderBuyAgainGrid() {
    const grid = $('#buy-again-grid');
    if (!grid) return;

    if (!state.buyAgain || state.buyAgain.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-muted);">Explore catalog to build your restock list.</p>';
      return;
    }

    grid.innerHTML = state.buyAgain.map(p => 
      createProductCardHtml(p, p.reorderReason || '🔁 Frequent Essential')
    ).join('');
  }

  // ----------------------------------------------------
  // Recently Viewed Items Tracker
  // ----------------------------------------------------
  function trackRecentlyViewed(productId) {
    if (!productId) return;
    let list = state.recentlyViewed || [];
    list = list.filter(id => id !== productId);
    list.unshift(productId);
    state.recentlyViewed = list.slice(0, 8);
    localStorage.setItem('freshcart_recent', JSON.stringify(state.recentlyViewed));
    renderRecentlyViewed();
  }

  async function renderRecentlyViewed() {
    const section = $('#recently-viewed-section');
    const grid = $('#recently-viewed-grid');
    if (!section || !grid) return;

    if (!state.recentlyViewed || state.recentlyViewed.length === 0) {
      section.style.display = 'none';
      return;
    }

    try {
      section.style.display = 'block';
      const placeholders = state.recentlyViewed.slice(0, 4);
      // Fetch details from state.products or load
      const matched = placeholders.map(id => state.products.find(p => p.id === id)).filter(Boolean);
      if (matched.length > 0) {
        grid.innerHTML = matched.map(p => createProductCardHtml(p, '👁️ Viewed')).join('');
      }
    } catch (e) {}
  }

  function clearRecentlyViewed() {
    state.recentlyViewed = [];
    localStorage.removeItem('freshcart_recent');
    renderRecentlyViewed();
    showToast('Browsing history cleared');
  }

  // ----------------------------------------------------
  // Flash Deals & Curated Smart Combos
  // ----------------------------------------------------
  function renderFlashDeals() {
    const grid = $('#flash-deals-grid');
    if (!grid || state.products.length === 0) return;

    const deals = state.products.slice(0, 4);
    grid.innerHTML = deals.map(p => {
      const origPrice = p.mrp || Math.round(p.price * 1.3);
      return `
        <div class="flash-card">
          <div class="flash-top">
            <div class="cart-item-img-container" style="width:48px; height:48px;">
              <img class="cart-item-img" src="${p.image_url || '/images/products/grocery-default.svg'}" alt="${escapeHtml(p.name)}" loading="lazy" decoding="async" onerror="handleImageError(this, '${p.category || ''}')">
            </div>
            <span class="discount-tag">30% OFF</span>
          </div>
          <div style="margin: 8px 0;">
            <strong style="font-size:0.85rem; display:block; color:#fff;" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</strong>
            <div style="display:flex; align-items:baseline; gap:6px; margin-top:2px;">
              <span style="font-size:1.05rem; font-weight:800; color:var(--green-400);">₹${p.price}</span>
              <span style="font-size:0.75rem; text-decoration:line-through; color:rgba(255,255,255,0.4);">₹${origPrice}</span>
            </div>
          </div>
          <button class="btn-add-cart" style="padding:4px 8px; font-size:0.78rem; width:100%;" onclick="app.addToCart('${p.id}')">+ Add to Cart</button>
        </div>
      `;
    }).join('');

    startCountdown();
  }

  function startCountdown() {
    if (state.countdownInterval) {
      clearInterval(state.countdownInterval);
    }
    let seconds = 9858;
    const el = $('#flash-countdown');
    if (!el) return;
    state.countdownInterval = setInterval(() => {
      seconds--;
      if (seconds <= 0) seconds = 10800;
      const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
      const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
      const secs = String(seconds % 60).padStart(2, '0');
      el.textContent = `${hrs}:${mins}:${secs}`;
    }, 1000);
  }

  async function loadSmartBundles() {
    const grid = $('#combo-packs-grid');
    if (!grid) return;

    try {
      const res = await api('/api/recommendations/smart-bundles?limit=3');
      if (res && res.data && res.data.length > 0) {
        state.smartBundles = res.data;
        grid.innerHTML = res.data.map(c => `
          <div class="combo-card">
            <div>
              <div class="combo-header">
                <strong style="color:var(--green-400); font-size:0.95rem;">${c.emoji || '🎁'} ${escapeHtml(c.bundleName)}</strong>
                <span class="discount-tag" style="background:linear-gradient(135deg, #10b981, #059669);">Save ₹${c.savingsAmount} (15% Off)</span>
              </div>
              <div class="combo-items-row" style="display:flex; gap:6px; margin:8px 0;">
                ${(c.items || []).map(i => `<img class="combo-thumb" src="${i.image_url || '/images/products/grocery-default.svg'}" title="${escapeHtml(i.name)}" alt="${escapeHtml(i.name)}" onerror="handleImageError(this, '')">`).join('')}
              </div>
              <p style="font-size:0.75rem; color:var(--text-muted); line-height:1.3;">${escapeHtml(c.subtitle || '')}</p>
            </div>
            <div class="combo-footer">
              <div>
                <span style="font-size:1.15rem; font-weight:800; color:#fff;">₹${c.bundlePrice}</span>
                <span style="font-size:0.75rem; text-decoration:line-through; color:var(--text-dim); margin-left:4px;">₹${c.originalPrice}</span>
              </div>
              <button class="btn-primary" style="padding:6px 12px; font-size:0.78rem;" onclick="app.addBundleToCart('${c.bundleId}')">Add Bundle 🛒</button>
            </div>
          </div>
        `).join('');
      }
    } catch (e) {
      console.warn('Error loading smart bundles:', e);
    }
  }

  function renderComboPacks() {
    loadSmartBundles();
  }

  // ----------------------------------------------------
  // Voice Search (Web Speech API)
  // ----------------------------------------------------
  function setupVoiceSearch() {
    const btn = $('#voice-search-btn');
    if (!btn) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      btn.onclick = () => showToast('Voice search not supported in this browser. Please use Chrome/Edge.', 'error');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = state.language === 'hi' ? 'hi-IN' : 'en-IN';

    btn.addEventListener('click', () => {
      btn.classList.add('voice-pulsing');
      showToast('🎙️ Listening... Speak your grocery items now!');
      try {
        recognition.start();
      } catch (e) {
        recognition.stop();
      }
    });

    recognition.onresult = (event) => {
      btn.classList.remove('voice-pulsing');
      const transcript = event.results[0][0].transcript;
      $('#search-input').value = transcript;
      handleSearchInput(transcript);
      showToast(`Recognized: "${transcript}"`);
      
      // Voice feedback using SpeechSynthesis
      if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(`Searching for ${transcript}`);
        utter.rate = 1.0;
        window.speechSynthesis.speak(utter);
      }
    };

    recognition.onerror = () => {
      btn.classList.remove('voice-pulsing');
      showToast('Could not recognize voice. Please try again.', 'error');
    };

    recognition.onend = () => {
      btn.classList.remove('voice-pulsing');
    };
  }

  // ----------------------------------------------------
  // Cart & Pricing Engine
  // ----------------------------------------------------
  async function loadCart() {
    try {
      const res = await api('/api/cart');
      state.cart = res.data;
      updateCartUI();
    } catch (e) {}
  }

  async function addToCart(productId, quantity = 1) {
    try {
      invalidateApiCache('/api/cart');
      const res = await api('/api/cart/add', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity })
      });
      state.cart = res.data;
      updateCartUI();
      showToast('Added to cart!');
      openCart();
    } catch (e) {}
  }

  async function updateCartQty(productId, quantity) {
    try {
      invalidateApiCache('/api/cart');
      const res = await api('/api/cart/update', {
        method: 'PUT',
        body: JSON.stringify({ productId, quantity })
      });
      state.cart = res.data;
      updateCartUI();
    } catch (e) {}
  }

  async function clearCart() {
    try {
      invalidateApiCache('/api/cart');
      const res = await api('/api/cart/clear', { method: 'DELETE' });
      state.cart = res.data;
      updateCartUI();
      showToast('Cart cleared');
    } catch (e) {}
  }

  function updateCartUI() {
    const count = state.cart.itemCount || 0;
    const badge = $('#cart-badge');
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';

    // Free delivery progress calculation
    const subtotal = state.cart.subtotal || 0;
    const progressPct = Math.min(100, (subtotal / 500) * 100);
    const delProgress = $('#delivery-progress');
    const delText = $('#delivery-text');

    if (delProgress && delText) {
      delProgress.style.width = `${progressPct}%`;
      if (subtotal >= 500) {
        delText.innerHTML = '🎉 <strong>FREE Delivery Unlocked!</strong> You saved ₹49.';
        delProgress.style.background = 'var(--green-400)';
      } else {
        const remaining = Math.round(500 - subtotal);
        delText.innerHTML = `Add <strong>₹${remaining}</strong> more for <strong>FREE Delivery</strong>!`;
        delProgress.style.background = 'linear-gradient(90deg, var(--green-500), var(--blue-500))';
      }
    }

    // Render items in cart drawer
    const container = $('#cart-items');
    if (!container) return;

    if (!state.cart.items || state.cart.items.length === 0) {
      container.innerHTML = `
        <div class="cart-empty">
          <div class="empty-icon">🛒</div>
          <h4>Your cart is empty</h4>
          <p>Explore our fresh items & add products!</p>
        </div>
      `;
      $('#cart-footer').style.display = 'none';
      $('#smart-cart-addons').style.display = 'none';
      updateCartNutrition();
      return;
    }

    $('#cart-footer').style.display = 'block';

    container.innerHTML = state.cart.items.map(item => `
      <div class="cart-item">
        <div class="cart-item-img-container">
          <img class="cart-item-img"
               src="${item.image_url || '/images/products/grocery-default.svg'}"
               alt="${escapeHtml(item.image_alt || item.name)}"
               loading="lazy"
               decoding="async"
               onerror="handleImageError(this, '')">
        </div>
        <div class="item-details">
          <div class="item-name">${escapeHtml(item.name)}</div>
          <div class="item-price">₹${item.price} / ${item.unit || 'unit'}</div>
        </div>
        <div class="qty-controls">
          <button class="qty-btn" onclick="app.updateCartQty('${item.productId}', ${item.quantity - 1})">-</button>
          <span class="qty-val">${item.quantity}</span>
          <button class="qty-btn" onclick="app.updateCartQty('${item.productId}', ${item.quantity + 1})">+</button>
        </div>
        <div class="item-total">₹${Math.round(item.price * item.quantity)}</div>
      </div>
    `).join('');

    // Apply active coupon discount if present
    let discount = 0;
    if (state.appliedCoupon) {
      discount = state.appliedCoupon.discount || 0;
      $('#coupon-discount-row').style.display = 'flex';
      $('#applied-coupon-name').textContent = state.appliedCoupon.code;
      $('#cart-discount').textContent = `-₹${discount.toFixed(2)}`;
    } else {
      $('#coupon-discount-row').style.display = 'none';
    }

    const finalTotal = Math.max(0, (state.cart.total || 0) - discount);

    $('#cart-subtotal').textContent = `₹${(state.cart.subtotal || 0).toFixed(2)}`;
    $('#cart-delivery').textContent = (state.cart.deliveryFee || 0) === 0 ? 'FREE' : `₹${(state.cart.deliveryFee || 0).toFixed(2)}`;
    $('#cart-tax').textContent = `₹${(state.cart.tax || 0).toFixed(2)}`;
    $('#cart-total').textContent = `₹${finalTotal.toFixed(2)}`;

    updateCartNutrition();
    loadCartAddons();
  }

  async function loadCartAddons() {
    if (!state.cart.items || state.cart.items.length === 0) return;
    try {
      const pId = state.cart.items[0].productId;
      const res = await api(`/api/recommendations/frequently-bought-together/${pId}`);
      const addons = res.data || [];
      const box = $('#smart-cart-addons');
      const list = $('#addon-items');

      if (addons.length > 0) {
        list.innerHTML = addons.slice(0, 2).map(a => `
          <div class="addon-card">
            <div style="display:flex; align-items:center; gap:8px;">
              <img class="combo-thumb" src="${a.image_url || '/images/products/grocery-default.svg'}" alt="${escapeHtml(a.name)}" onerror="handleImageError(this, '')">
              <div>
                <strong>${escapeHtml(a.name)}</strong>
                <small style="color:var(--text-muted); display:block;">₹${a.price} • ${a.confidence}% cross-sell</small>
              </div>
            </div>
            <button class="btn-add-cart" style="padding:4px 10px; font-size:0.75rem;" onclick="app.addToCart('${a.id}')">+ Add</button>
          </div>
        `).join('');
        box.style.display = 'block';
      } else {
        box.style.display = 'none';
      }
    } catch (e) {}
  }

  function openCart() {
    $('#cart-overlay').style.display = 'block';
    $('#cart-sidebar').classList.add('open');
  }

  function closeCart() {
    $('#cart-overlay').style.display = 'none';
    $('#cart-sidebar').classList.remove('open');
  }

  // ----------------------------------------------------
  // Checkout & Order Placement
  // ----------------------------------------------------
  function openCheckout() {
    closeCart();
    $('#checkout-overlay').style.display = 'flex';
    updateCheckoutTotal();
  }

  function closeCheckout() {
    $('#checkout-overlay').style.display = 'none';
  }

  function updateCheckoutTotal() {
    let discount = state.appliedCoupon ? state.appliedCoupon.discount : 0;
    let tip = state.activeTip || 0;
    let ecoBag = state.isEcoBag ? 15 : 0;
    let total = Math.max(0, (state.cart.total || 0) - discount + tip + ecoBag);
    $('#checkout-total-val').textContent = `₹${total.toFixed(2)}`;
  }

  async function handleCheckout(e) {
    e.preventDefault();
    const btn = $('#place-order-btn');

    const customerName = $('#cust-name').value.trim();
    const address = $('#cust-address').value.trim();
    const phone = $('#cust-phone').value.trim();
    const paymentMethod = $('#cust-payment').value;

    let discount = state.appliedCoupon ? state.appliedCoupon.discount : 0;
    let tip = state.activeTip || 0;
    let ecoBag = state.isEcoBag ? 15 : 0;
    let total = Math.max(0, (state.cart.total || 0) - discount + tip + ecoBag);

    const payload = {
      customerName,
      address,
      phone,
      paymentMethod,
      tip: state.activeTip,
      ecoBag: state.isEcoBag,
      appliedCoupon: state.appliedCoupon ? state.appliedCoupon.code : null
    };

    if (paymentMethod === 'upi' || paymentMethod === 'card') {
      closeCheckout();
      openPaymentGateway(payload, total);
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Processing Order & Fraud Scoring...';

    try {
      const res = await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      btn.disabled = false;
      btn.textContent = 'Confirm & Place Order (₹)';
      closeCheckout();

      state.lastPlacedOrder = res.data;
      state.coins += 50; // Reward 50 coins on order
      $('#header-coins-val').textContent = `${state.coins} Coins`;

      showOrderConfirmation(res.data);
      loadCart();
    } catch (err) {
      btn.disabled = false;
      btn.textContent = 'Confirm & Place Order (₹)';
    }
  }

  function showOrderConfirmation(order) {
    $('#confirmed-order-id').textContent = order.orderId;
    const itemsList = $('#confirmed-items-list');

    itemsList.innerHTML = `
      <div style="background:rgba(0,0,0,0.25); border-radius:var(--radius-md); padding:14px; margin-top:10px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid var(--border-subtle); padding-bottom:6px;">
          <span>Recipient: <strong>${order.customerName}</strong></span>
          <span style="color:var(--green-400); font-weight:700;">₹${order.total} Paid (${order.paymentMethod.toUpperCase()})</span>
        </div>
        <div style="font-size:0.8rem; color:var(--text-muted);">
          📍 Delivery to: ${order.address}<br>
          ⚡ Dark Store: Indiranagar Hub #04 • Rider Ramesh K. Assigned
        </div>
      </div>
    `;

    $('#confirmation-overlay').style.display = 'flex';
  }

  // ----------------------------------------------------
  // Interactive Live Moving Courier Map
  // ----------------------------------------------------
  function openTrackingModal() {
    $('#confirmation-overlay').style.display = 'none';
    $('#tracking-modal-overlay').style.display = 'flex';
    startLiveMapAnimation();
  }

  function startLiveMapAnimation() {
    const canvas = $('#live-map-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let progress = 0;
    const path = [
      { x: 50, y: 150 },
      { x: 180, y: 80 },
      { x: 320, y: 130 },
      { x: 450, y: 70 },
      { x: 540, y: 150 }
    ];

    function drawMap() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background city grid roads
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }
      for (let j = 0; j < canvas.height; j += 40) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke();
      }

      // Draw 2-Opt Optimized Delivery Polyline
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 4;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      path.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Dark Store Hub (Start)
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath(); ctx.arc(path[0].x, path[0].y, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.fillText('🏬 Dark Store', path[0].x - 24, path[0].y + 22);

      // Draw Customer House (End)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(path[4].x, path[4].y, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillText('🏠 Your Home', path[4].x - 24, path[4].y + 22);

      // Calculate Rider Position along path
      const totalSegments = path.length - 1;
      const segIndex = Math.min(Math.floor(progress * totalSegments), totalSegments - 1);
      const segProgress = (progress * totalSegments) - segIndex;

      const p1 = path[segIndex];
      const p2 = path[segIndex + 1];
      const curX = p1.x + (p2.x - p1.x) * segProgress;
      const curY = p1.y + (p2.y - p1.y) * segProgress;

      // Draw Rider Scooter Icon
      ctx.font = '22px sans-serif';
      ctx.fillText('🛵', curX - 11, curY + 8);

      progress += 0.003;
      if (progress > 1) progress = 0;

      if ($('#tracking-modal-overlay').style.display === 'flex') {
        requestAnimationFrame(drawMap);
      }
    }

    drawMap();
  }

  // ----------------------------------------------------
  // Lucky Spin Wheel (Gamification)
  // ----------------------------------------------------
  function setupSpinWheel() {
    const btn = $('#lucky-spin-btn');
    const modal = $('#wheel-modal-overlay');
    const spinBtn = $('#spin-action-btn');
    const canvas = $('#wheel-canvas');

    if (!btn || !canvas) return;

    btn.onclick = () => {
      modal.style.display = 'flex';
      drawWheel(0);
    };

    const wheelClose = $('#wheel-close');
    if (wheelClose) wheelClose.onclick = () => { if (modal) modal.style.display = 'none'; };

    const segments = ['INSTA50 (₹50 Off)', 'FRESHFREE (Free Del)', 'SUPER20 (20% Off)', '100 COINS', '₹25 CASH', 'ORGANIC10'];
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

    function drawWheel(angle) {
      const ctx = canvas.getContext('2d');
      const numSegs = segments.length;
      const arc = (Math.PI * 2) / numSegs;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = canvas.width / 2 - 10;

      for (let i = 0; i < numSegs; i++) {
        const segAngle = angle + i * arc;
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, segAngle, segAngle + arc);
        ctx.lineTo(cx, cy);
        ctx.fill();
        ctx.stroke();

        // Label
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(segAngle + arc / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(segments[i], r - 15, 4);
        ctx.restore();
      }
    }

    let isSpinning = false;
    if (spinBtn) {
      spinBtn.onclick = () => {
        if (isSpinning) return;
        isSpinning = true;
        let curAngle = 0;
        const spins = 5 + Math.random() * 5;
        const targetAngle = spins * Math.PI * 2 + Math.random() * Math.PI * 2;
        let startTime = null;

        function animateSpin(time) {
          if (!startTime) startTime = time;
          const elapsed = (time - startTime) / 3000;
          if (elapsed < 1) {
            const easeOut = 1 - Math.pow(1 - elapsed, 3);
            curAngle = easeOut * targetAngle;
            drawWheel(curAngle);
            requestAnimationFrame(animateSpin);
          } else {
            isSpinning = false;
            const resMsg = $('#wheel-result-msg');
            if (resMsg) resMsg.innerHTML = '🎉 You won coupon <strong>INSTA50</strong> (₹50 Off)! Copied to clipboard.';
            state.appliedCoupon = { code: 'INSTA50', discount: 50 };
            showToast('Coupon INSTA50 applied to cart!');
            updateCartUI();
          }
        }
        requestAnimationFrame(animateSpin);
      };
    }
  }

  // ----------------------------------------------------
  // Post-Order Scratch Card
  // ----------------------------------------------------
  function setupScratchCard() {
    const canvas = $('#scratch-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const openScratchBtn = $('#open-scratch-modal-btn');
    if (openScratchBtn) {
      openScratchBtn.onclick = () => {
        const conf = $('#confirmation-overlay');
        const modal = $('#scratch-modal-overlay');
        if (conf) conf.style.display = 'none';
        if (modal) modal.style.display = 'flex';
        initScratchCanvas();
      };
    }

    const scratchClose = $('#scratch-close');
    if (scratchClose) {
      scratchClose.onclick = () => {
        const modal = $('#scratch-modal-overlay');
        if (modal) modal.style.display = 'none';
      };
    }

    const claimScratchBtn = $('#claim-scratch-btn');
    if (claimScratchBtn) {
      claimScratchBtn.onclick = () => {
        const modal = $('#scratch-modal-overlay');
        if (modal) modal.style.display = 'none';
        showToast('₹50 Cashback credited to your FreshCoins wallet!');
        state.coins += 100;
        const coinsVal = $('#header-coins-val');
        if (coinsVal) coinsVal.textContent = `${state.coins} Coins`;
      };
    }

    function initScratchCanvas() {
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✨ Scratch here with mouse / finger ✨', canvas.width / 2, canvas.height / 2);

      let isDrawing = false;
      canvas.onmousedown = () => isDrawing = true;
      canvas.onmouseup = () => isDrawing = false;
      canvas.onmousemove = (e) => {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.fill();
      };
    }
  }

  // ----------------------------------------------------
  // GST Tax Invoice Generator
  // ----------------------------------------------------
  function openInvoiceModal() {
    const order = state.lastPlacedOrder || {
      orderId: 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      customerName: 'Rahul Sharma',
      address: 'Indiranagar, Bengaluru, Karnataka',
      phone: '+91-9876543210',
      total: 384,
      subtotal: 320,
      deliveryFee: 0,
      tax: 25.6
    };

    $('#inv-order-id').textContent = order.orderId;
    $('#inv-cust-name').textContent = order.customerName || 'Rahul Sharma';
    $('#inv-cust-phone').textContent = order.phone || '+91-9876543210';
    $('#inv-cust-address').textContent = order.address || 'Indiranagar, Bengaluru';

    const body = $('#inv-items-body');
    const items = (state.cart.items && state.cart.items.length > 0) ? state.cart.items : [
      { name: 'Organic Apples', quantity: 1, price: 249 },
      { name: 'Fresh Whole Milk', quantity: 1, price: 69 }
    ];

    body.innerHTML = items.map(i => `
      <tr>
        <td>${i.name}</td>
        <td>${i.quantity}</td>
        <td>₹${i.price}</td>
        <td>₹${i.quantity * i.price}</td>
      </tr>
    `).join('');

    $('#inv-subtotal').textContent = `₹${(order.subtotal || 320).toFixed(2)}`;
    $('#inv-delivery').textContent = `₹${(order.deliveryFee || 0).toFixed(2)}`;
    $('#inv-tip').textContent = `₹${(state.activeTip || 20).toFixed(2)}`;
    $('#inv-tax').textContent = `₹${(order.tax || 25.6).toFixed(2)}`;
    $('#inv-total').textContent = `₹${(order.total || 365.6).toFixed(2)}`;

    // Draw realistic QR pattern on canvas
    drawInvoiceQR();

    $('#confirmation-overlay').style.display = 'none';
    $('#invoice-modal-overlay').style.display = 'flex';
  }

  function drawInvoiceQR() {
    const canvas = $('#invoice-qr-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f172a';

    const gridSize = 10;
    const cellSize = canvas.width / gridSize;
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if ((r < 3 && c < 3) || (r < 3 && c >= 7) || (r >= 7 && c < 3) || Math.random() > 0.5) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }
  }

  // ----------------------------------------------------
  // Subscriptions & Pantry Tracker Modal
  // ----------------------------------------------------
  function openPantryModal() {
    const grid = $('#pantry-items-grid');
    if (!grid) return;

    grid.innerHTML = state.pantryItems.map(p => `
      <div class="pantry-card">
        <div class="pantry-top">
          <div>
            <span style="font-size:1.4rem;">${p.emoji}</span>
            <strong style="margin-left:6px; font-size:0.85rem;">${p.name}</strong>
          </div>
          <span class="pantry-days-badge ${p.status === 'low' ? 'days-low' : 'days-ok'}">
            ${p.daysLeft} Day${p.daysLeft > 1 ? 's' : ''} Left
          </span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
          <small style="color:var(--text-dim);">Consumption: 1 unit / 2 days</small>
          <button class="qc-pill-btn" style="padding:3px 8px; font-size:0.72rem;" onclick="showToast('Auto-replenished ${p.name}!')">⚡ Re-order</button>
        </div>
      </div>
    `).join('');

    $('#pantry-modal-overlay').style.display = 'flex';
  }

  // ----------------------------------------------------
  // Product Detail & Customer Reviews Modal
  // ----------------------------------------------------
  function openProductDetail(productId) {
    const p = state.products.find(x => x.id === productId) || state.recommendedProducts.find(x => x.id === productId);
    if (!p) return;

    const imgUrl = p.image_url || '/images/products/grocery-default.svg';
    const altText = escapeHtml(p.image_alt || p.name);
    const discount = p.discount || (p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0);
    const mrp = p.mrp || (discount > 0 ? Math.round(p.price * 1.2) : null);
    const savings = mrp && mrp > p.price ? mrp - p.price : 0;

    $('#detail-prod-name').textContent = p.name;
    const content = $('#product-detail-content');

    content.innerHTML = `
      <div style="text-align:center; padding:10px 0;">
        <div class="detail-hero-container">
          <img class="detail-hero-img"
               src="${imgUrl}"
               alt="${altText}"
               loading="eager"
               decoding="async"
               onerror="handleImageError(this, '${p.category || ''}')">
        </div>

        <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:8px;">
          ${p.brand ? `<span class="product-brand-tag" style="background:rgba(255,255,255,0.08); padding:2px 8px; border-radius:4px;">${escapeHtml(p.brand)}</span>` : ''}
          <span style="font-size:0.75rem; color:var(--text-dim); text-transform:uppercase; font-weight:700;">${p.category || 'Grocery'}</span>
        </div>

        <h3 style="margin:4px 0 6px; color:var(--text-main); font-size:1.25rem;">${escapeHtml(p.name)}</h3>
        <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:10px;">Pack Size: <strong>${p.unit || '1 pack'}</strong></div>

        <div style="display:flex; align-items:center; justify-content:center; gap:10px; margin:12px 0;">
          <span style="font-size:1.6rem; font-weight:800; color:var(--green-400);">₹${p.price}</span>
          ${mrp && mrp > p.price ? `<span style="font-size:1.05rem; text-decoration:line-through; color:var(--text-dim);">₹${mrp}</span>` : ''}
          ${discount > 0 ? `<span class="discount-pill" style="position:static;">${discount}% OFF</span>` : ''}
        </div>
        ${savings > 0 ? `<div style="font-size:0.8rem; color:var(--green-400); font-weight:600; margin-bottom:12px;">You save ₹${savings} on this item</div>` : ''}

        <p style="color:var(--text-muted); font-size:0.88rem; line-height:1.4; text-align:left; background:rgba(255,255,255,0.03); padding:10px 14px; border-radius:8px; border:1px solid var(--border-subtle); margin-bottom:12px;">
          ${escapeHtml(p.description || '')}
        </p>
      </div>

      <div style="background:linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.08)); padding:10px 14px; border-radius:var(--radius-sm); border:1px solid rgba(16,185,129,0.25); margin-bottom:12px; display:flex; align-items:center; gap:10px;">
        <span style="font-size:1.4rem;">⚡</span>
        <div style="text-align:left;">
          <strong style="color:var(--green-400); font-size:0.82rem;">10-Minute Superfast Delivery</strong>
          <p style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
            Fulfilled instantly from your nearest FreshCart dark store. Temperature controlled.
          </p>
        </div>
      </div>

      <div style="background:rgba(16,185,129,0.04); padding:10px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); margin-bottom:12px; text-align:left;">
        <strong style="color:var(--green-400); font-size:0.8rem;">🌿 Freshness Guarantee & Storage:</strong>
        <p style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
          Hygienically sorted and quality inspected. Store in a cool dry place. 100% replacement guarantee if not fresh.
        </p>
      </div>

      <div style="border-top:1px solid var(--border-subtle); padding-top:12px; margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <strong style="font-size:0.85rem;">⭐ Customer Ratings & Reviews:</strong>
          <span style="font-size:0.8rem; font-weight:700; color:#fbbf24;">${p.rating || 4.8} / 5.0 (${p.review_count || 42} reviews)</span>
        </div>
        <div style="font-size:0.78rem; color:var(--text-muted); background:rgba(0,0,0,0.2); padding:8px 12px; border-radius:6px; line-height:1.4; text-align:left;">
          "Always crisp, fresh and authentic quality. Arrived in under 10 minutes!" — <em>Pooja M. (Verified Customer)</em>
        </div>
      </div>

      <div style="display:flex; gap:10px; align-items:center;">
        <button class="btn-primary" style="width:100%; padding:12px; font-size:0.95rem; font-weight:700;" onclick="app.addToCart('${p.id}'); $('#product-detail-overlay').style.display='none';">
          🛒 Add to Cart (₹${p.price})
        </button>
      </div>
    `;

    $('#product-detail-overlay').style.display = 'flex';
  }

  // ----------------------------------------------------
  // NLP Search & Multimodal Image Signature Matching
  // ----------------------------------------------------
  let searchAbortController = null;

  function handleSearchInput(query) {
    state.searchQuery = query;
    clearTimeout(state.searchTimeout);

    const clearBtn = $('#search-clear');
    if (clearBtn) clearBtn.style.display = query ? 'block' : 'none';

    if (!query.trim()) {
      const dropdown = $('#smart-search-dropdown');
      if (dropdown) dropdown.style.display = 'none';
      loadProducts();
      return;
    }

    state.searchTimeout = setTimeout(async () => {
      if (searchAbortController) {
        searchAbortController.abort();
      }
      searchAbortController = new AbortController();

      try {
        const res = await api(`/api/search?q=${encodeURIComponent(query.trim())}`, {
          signal: searchAbortController.signal,
          ttl: 60000
        });
        renderSearchDropdown(res.data);
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.warn('Search query error:', e);
        }
      }
    }, 200);
  }

  function renderSearchDropdown(results) {
    const dropdown = $('#smart-search-dropdown');
    if (!results || results.length === 0) {
      dropdown.innerHTML = '<div class="search-drop-item" style="color:var(--text-muted);">No matches found</div>';
      dropdown.style.display = 'block';
      return;
    }

    dropdown.innerHTML = results.slice(0, 5).map(r => `
      <div class="search-drop-item" onclick="app.selectSearchResult('${escapeHtml(r.name)}')">
        <div style="display:flex; align-items:center; gap:8px;">
          <img class="search-suggestion-thumb" style="width:36px; height:36px; object-fit:contain; border-radius:6px; background:rgba(255,255,255,0.05); padding:2px;" src="${r.image_url || '/images/products/grocery-default.svg'}" alt="${escapeHtml(r.name)}" onerror="handleImageError(this, '')">
          <div>
            <strong>${escapeHtml(r.name)}</strong>
            <small style="color:var(--text-dim); display:block;">₹${r.price} / ${r.unit || 'unit'} • ${r.category}</small>
          </div>
        </div>
        <span class="card-match-badge" style="position:static;">${Math.round(r.score * 100)}% Match</span>
      </div>
    `).join('');

    dropdown.style.display = 'block';
  }

  function selectSearchResult(name) {
    $('#search-input').value = name;
    $('#smart-search-dropdown').style.display = 'none';
    state.searchQuery = name;
    loadProducts();
  }

  // ----------------------------------------------------
  // FreshBot AI Assistant
  // ----------------------------------------------------
  function setupFreshBot() {
    const toggleBtn = $('#freshbot-toggle');
    const panel = $('#freshbot-panel');
    const closeBtn = $('#freshbot-close');
    const form = $('#freshbot-form');
    const input = $('#freshbot-input');

    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
      const isVisible = panel.style.display === 'flex';
      panel.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) input.focus();
    });

    closeBtn.addEventListener('click', () => {
      panel.style.display = 'none';
    });

    $$('.quick-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        handleFreshBotMessage(chip.dataset.query);
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = input.value.trim();
      if (!val) return;
      input.value = '';
      handleFreshBotMessage(val);
    });
  }

  async function handleFreshBotMessage(userText) {
    const container = $('#freshbot-messages');

    const userMsg = document.createElement('div');
    userMsg.className = 'bot-msg';
    userMsg.innerHTML = `<div class="msg-bubble user">${userText}</div>`;
    container.appendChild(userMsg);
    container.scrollTop = container.scrollHeight;

    const botLoading = document.createElement('div');
    botLoading.className = 'bot-msg';
    botLoading.innerHTML = `<div class="msg-bubble bot">Thinking... 🤖</div>`;
    container.appendChild(botLoading);
    container.scrollTop = container.scrollHeight;

    try {
      const res = await api('/api/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({ message: userText })
      });

      botLoading.remove();

      const botMsg = document.createElement('div');
      botMsg.className = 'bot-msg';

      const data = res.data;
      if (data.type === 'recipe' && data.recipe) {
        const r = data.recipe;
        botMsg.innerHTML = `
          <div class="msg-bubble bot">
            <p>${data.reply}</p>
            <div class="recipe-card-in-chat">
              <strong style="color:var(--green-400);">${r.name}</strong>
              <div style="font-size:0.75rem; color:var(--text-dim); margin-bottom:8px;">${r.diet}</div>
              ${r.items.map(item => `
                <div class="recipe-item-row">
                  <span>${item.emoji} ${item.name} ×${item.quantity}</span>
                  <span>₹${item.lineTotal}</span>
                </div>
              `).join('')}
              <button class="btn-bundle-cart" onclick='app.addBundleToCart(${JSON.stringify(r.items)})'>
                🛒 Add All Ingredients to Cart (₹${r.totalCost})
              </button>
            </div>
          </div>
        `;
      } else {
        botMsg.innerHTML = `<div class="msg-bubble bot">${data.reply}</div>`;
      }

      container.appendChild(botMsg);
      container.scrollTop = container.scrollHeight;
    } catch (e) {
      botLoading.innerHTML = `<div class="msg-bubble bot" style="color:var(--red-400);">Sorry, trouble processing. Please try again!</div>`;
    }
  }

  async function addBundleToCart(items) {
    for (const item of items) {
      await addToCart(item.id, item.quantity);
    }
    openCart();
    showToast(`Added ${items.length} ingredients to your cart!`);
  }

  // ----------------------------------------------------
  // Nutrition Calculator
  // ----------------------------------------------------
  function updateCartNutrition() {
    const card = $('#cart-nutrition-card');
    if (!state.cart.items || state.cart.items.length === 0) {
      card.style.display = 'none';
      return;
    }

    let protein = 0;
    let fiber = 0;
    let calories = 0;

    for (const item of state.cart.items) {
      const name = (item.name || '').toLowerCase();
      const qty = item.quantity || 1;

      if (name.includes('egg')) { protein += 12 * qty; calories += 140 * qty; }
      else if (name.includes('yogurt')) { protein += 18 * qty; calories += 130 * qty; }
      else if (name.includes('milk')) { protein += 8 * qty; calories += 150 * qty; }
      else if (name.includes('apple')) { fiber += 4 * qty; calories += 95 * qty; }
      else if (name.includes('banana')) { fiber += 3 * qty; calories += 105 * qty; }
      else if (name.includes('broccoli')) { fiber += 5 * qty; protein += 4 * qty; calories += 50 * qty; }
      else if (name.includes('spinach')) { fiber += 3 * qty; protein += 3 * qty; calories += 30 * qty; }
      else { calories += 100 * qty; fiber += 1 * qty; protein += 2 * qty; }
    }

    $('#macro-protein').textContent = protein + 'g';
    $('#macro-fiber').textContent = fiber + 'g';
    $('#macro-calories').textContent = calories + ' kcal';
    card.style.display = 'block';
  }

  // ----------------------------------------------------
  // Single-URL Mode & Unified SPA View Switching
  // ----------------------------------------------------
  function switchView(viewName, subTab) {
    const storePane = $('#view-storefront');
    const ordersPane = $('#view-orders-page');
    const adminPane = $('#view-admin-page');

    const navStore = $('#view-nav-store');
    const navOrders = $('#view-nav-orders');
    const navAdmin = $('#view-nav-admin');

    // Role-based check for Admin access
    if (viewName === 'admin') {
      const isAdmin = state.user && state.user.role === 'admin';
      if (!isAdmin) {
        showToast('Admin role required. Sign in as Admin or use 1-Click Demo.', 'error');
        openAdminAuthPrompt();
        return;
      }
    }

    // Deactivate all nav buttons
    [navStore, navOrders, navAdmin].forEach(b => { if (b) b.classList.remove('active'); });

    // Hide all view panes
    if (storePane) storePane.style.display = 'none';
    if (ordersPane) ordersPane.style.display = 'none';
    if (adminPane) adminPane.style.display = 'none';

    if (viewName === 'admin') {
      if (adminPane) adminPane.style.display = 'block';
      if (navAdmin) navAdmin.classList.add('active');
      if (window.initAdminDashboard) window.initAdminDashboard();
      if (subTab && window.adminSwitchTab) window.adminSwitchTab(subTab);
      window.location.hash = subTab ? `admin-${subTab}` : 'admin';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (viewName === 'orders') {
      if (ordersPane) ordersPane.style.display = 'block';
      if (navOrders) navOrders.classList.add('active');
      loadOrdersPage();
      window.location.hash = 'orders';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Default: Customer Storefront
      if (storePane) storePane.style.display = 'block';
      if (navStore) navStore.classList.add('active');
      window.location.hash = 'store';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleHashRouting() {
    const hash = (window.location.hash || '').replace('#', '').trim();
    if (!hash || hash === 'store' || hash === 'catalog') {
      switchView('store');
    } else if (hash === 'orders') {
      switchView('orders');
    } else if (hash.startsWith('admin')) {
      const parts = hash.split('-');
      const subTab = parts.length > 1 ? parts.slice(1).join('-') : null;
      switchView('admin', subTab);
    }
  }

  function openAdminAuthPrompt() {
    openAuthModal('login');
    const emailInput = $('#login-email');
    const passInput = $('#login-password');
    if (emailInput) emailInput.value = 'admin@freshcart.com';
    if (passInput) passInput.value = 'admin123';
    showToast('Pre-filled Demo Admin credentials (admin@freshcart.com / admin123). Click Sign In!');
  }

  async function loadOrdersPage() {
    const list = $('#orders-full-page-list');
    if (!list) return;
    list.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted);">Loading orders... 📦</div>';

    try {
      const res = await api('/api/orders');
      const orders = res.data || [];

      if (orders.length === 0) {
        list.innerHTML = `
          <div style="text-align:center; padding:30px; color:var(--text-muted);">
            <span style="font-size:2.5rem; display:block; margin-bottom:8px;">📦</span>
            <h4>No orders placed yet</h4>
            <p style="font-size:0.85rem; margin-top:4px;">Your past and active 10-minute grocery orders will show up here.</p>
            <button class="btn-primary" style="margin-top:14px;" onclick="app.switchView('store')">Shop Fresh Items Now</button>
          </div>
        `;
        return;
      }

      // Update the active live tracker card with latest order
      const latest = orders[0];
      state.lastPlacedOrder = latest;
      if ($('#tracker-order-id-label')) {
        $('#tracker-order-id-label').textContent = `Order #${latest.id} • Indiranagar Hub #04`;
      }

      list.innerHTML = orders.map(o => `
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:16px; display:flex; flex-direction:column; gap:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-subtle); padding-bottom:10px;">
            <div>
              <strong style="color:var(--text-main); font-size:0.95rem;">Order #${o.id}</strong>
              <small style="color:var(--text-dim); display:block;">${new Date(o.createdAt || Date.now()).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</small>
            </div>
            <div style="text-align:right;">
              <span class="badge-tag" style="background:rgba(16,185,129,0.15); color:var(--green-400); font-weight:700;">₹${o.totalAmount || o.total}</span>
              <small style="display:block; color:var(--text-dim); text-transform:uppercase;">${o.status}</small>
            </div>
          </div>

          <div style="font-size:0.85rem; color:var(--text-muted);">
            📍 <strong>Delivery Address:</strong> ${o.shippingAddress || o.address || 'Indiranagar 100ft Road, Bengaluru'}
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
            <div style="font-size:0.8rem; color:var(--text-dim);">
              💳 Paid via ${(o.paymentMethod || 'UPI').toUpperCase()} • ⚡ 10-Min Fast Dispatch
            </div>
            <div style="display:flex; gap:8px;">
              <button class="btn-secondary" style="padding:5px 12px; font-size:0.78rem;" onclick='app.openInvoiceModal(${JSON.stringify(o)})'>📄 Invoice</button>
              <button class="btn-primary" style="padding:5px 12px; font-size:0.78rem;" onclick="app.switchView('store')">Re-Order 🛒</button>
            </div>
          </div>
        </div>
      `).join('');
    } catch (e) {
      list.innerHTML = '<div style="text-align:center; padding:20px; color:var(--red-400);">Could not load orders. Please sign in or try again.</div>';
    }
  }

  // ----------------------------------------------------
  // Setup Event Listeners (Safe Null-Checked)
  // ----------------------------------------------------
  function setupEventListeners() {
    const on = (sel, evt, handler) => {
      const el = $(sel);
      if (el) el.addEventListener(evt, handler);
    };

    // Single-URL Unified App View Navigation
    on('#view-nav-store', 'click', () => switchView('store'));
    on('#view-nav-orders', 'click', () => switchView('orders'));
    on('#view-nav-admin', 'click', () => switchView('admin'));
    on('#orders-btn', 'click', () => switchView('orders'));
    on('#admin-link', 'click', (e) => { e.preventDefault(); switchView('admin'); });
    on('#header-logo-link', 'click', (e) => { e.preventDefault(); switchView('store'); });

    window.addEventListener('hashchange', handleHashRouting);

    // Search (Handled by setupSearchAutocomplete)

    // Modals
    on('#cart-btn', 'click', openCart);
    on('#cart-close', 'click', closeCart);
    on('#cart-overlay', 'click', closeCart);
    on('#checkout-btn', 'click', openCheckout);
    on('#checkout-close', 'click', closeCheckout);
    on('#clear-cart-btn', 'click', clearCart);
    on('#auth-close', 'click', closeAuthModal);
    on('#hero-shop-btn', 'click', () => {
      const cat = $('#catalog-section');
      if (cat) cat.scrollIntoView({ behavior: 'smooth' });
    });

    on('#login-form', 'submit', (e) => {
      e.preventDefault();
      const email = $('#login-email');
      const pass = $('#login-password');
      if (email && pass) handleLogin(email.value, pass.value);
    });

    on('#register-form', 'submit', (e) => {
      e.preventDefault();
      const name = $('#reg-name');
      const email = $('#reg-email');
      const pass = $('#reg-password');
      if (name && email && pass) handleRegister(name.value, email.value, pass.value);
    });

    on('#tab-login', 'click', () => switchAuthTab('login'));
    on('#tab-register', 'click', () => switchAuthTab('register'));
    on('#checkout-form', 'submit', handleCheckout);

    // Tip Chips
    $$('#tip-chips .chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('#tip-chips .chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeTip = parseInt(btn.dataset.tip) || 0;
        updateCheckoutTotal();
      });
    });

    // Eco Bag
    on('#eco-bag-toggle', 'change', (e) => {
      state.isEcoBag = e.target.checked;
      updateCheckoutTotal();
    });

    // Coupon Code
    on('#apply-coupon-btn', 'click', () => {
      const input = $('#coupon-code-input');
      const code = (input ? input.value : '').trim().toUpperCase();
      const msg = $('#coupon-msg');
      if (code === 'INSTA50' || code === 'CASH50') {
        state.appliedCoupon = { code, discount: 50 };
        if (msg) {
          msg.style.color = 'var(--green-400)';
          msg.textContent = `✅ Coupon ${code} applied! Saved ₹50.`;
        }
        updateCheckoutTotal();
        updateCartUI();
      } else if (code === 'FRESHFREE') {
        state.appliedCoupon = { code, discount: 49 };
        if (msg) {
          msg.style.color = 'var(--green-400)';
          msg.textContent = `✅ Free delivery coupon applied!`;
        }
        updateCheckoutTotal();
        updateCartUI();
      } else {
        if (msg) {
          msg.style.color = '#ef4444';
          msg.textContent = '❌ Invalid coupon code.';
        }
      }
    });

    // Dietary Filter Pills
    $$('.diet-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        $$('.diet-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.currentDiet = pill.dataset.diet;
        renderProductsGrid();
      });
    });

    // Category Pills
    $$('.cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        $$('.cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.currentCategory = pill.dataset.category;
        loadProducts();
      });
    });

    // Sort Select
    on('#sort-select', 'change', (e) => {
      state.currentSort = e.target.value;
      loadProducts();
    });

    // Location Picker
    on('#location-picker-btn', 'click', () => {
      const modal = $('#location-modal-overlay');
      if (modal) modal.style.display = 'flex';
    });
    on('#location-close', 'click', () => {
      const modal = $('#location-modal-overlay');
      if (modal) modal.style.display = 'none';
    });

    // Language & Theme
    on('#lang-toggle-btn', 'click', toggleLanguage);
    on('#theme-toggle-btn', 'click', toggleTheme);

    // Subscriptions
    on('#pantry-sub-btn', 'click', openPantryModal);
    on('#pantry-close', 'click', () => {
      const modal = $('#pantry-modal-overlay');
      if (modal) modal.style.display = 'none';
    });

    // Action buttons in Confirmation
    on('#open-tracking-modal-btn', 'click', openTrackingModal);
    on('#tracking-close', 'click', () => {
      const modal = $('#tracking-modal-overlay');
      if (modal) modal.style.display = 'none';
    });
    on('#open-invoice-modal-btn', 'click', openInvoiceModal);
    on('#invoice-close', 'click', () => {
      const modal = $('#invoice-modal-overlay');
      if (modal) modal.style.display = 'none';
    });
    on('#continue-shopping-btn', 'click', () => {
      const modal = $('#confirmation-overlay');
      if (modal) modal.style.display = 'none';
    });
    on('#product-detail-close', 'click', () => {
      const modal = $('#product-detail-overlay');
      if (modal) modal.style.display = 'none';
    });

    // Demo Login
    on('#demo-login-btn', 'click', () => handleLogin('customer@freshcart.com', 'customer123'));

    // Visual Modal
    on('#visual-search-btn', 'click', () => {
      const modal = $('#visual-modal-overlay');
      if (modal) modal.style.display = 'flex';
    });
    on('#visual-close', 'click', () => {
      const modal = $('#visual-modal-overlay');
      if (modal) modal.style.display = 'none';
    });

    $$('.visual-sample-card').forEach(btn => {
      btn.addEventListener('click', async () => {
        const hint = btn.dataset.hint;
        try {
          const res = await api('/api/visual/match', {
            method: 'POST',
            body: JSON.stringify({ imageHint: hint })
          });
          const resBox = $('#visual-results-box');
          const list = $('#visual-matches-list');
          list.innerHTML = (res.data || []).map(m => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.25); padding:8px 12px; border-radius:6px;">
              <div>
                <strong>${m.product.emoji} ${m.product.name}</strong>
                <small style="color:var(--text-muted); display:block;">₹${m.product.price} / ${m.product.unit}</small>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="card-match-badge" style="position:static;">${m.visualConfidence} Match</span>
                <button class="btn-add-cart" style="padding:4px 8px; font-size:0.75rem;" onclick="app.addToCart('${m.product.id}'); $('#visual-modal-overlay').style.display='none';">+ Add</button>
              </div>
            </div>
          `).join('');
          resBox.style.display = 'block';
        } catch (e) {}
      });
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeCart();
        closeCheckout();
        closeAuthModal();
        $('#tracking-modal-overlay').style.display = 'none';
        $('#wheel-modal-overlay').style.display = 'none';
        $('#scratch-modal-overlay').style.display = 'none';
        $('#invoice-modal-overlay').style.display = 'none';
        $('#pantry-modal-overlay').style.display = 'none';
        $('#location-modal-overlay').style.display = 'none';
        $('#product-detail-overlay').style.display = 'none';
      }
    });
  }

  // ----------------------------------------------------
  // FreshWallet Fintech Integration
  // ----------------------------------------------------
  function setupWallet() {
    const walletBtn = $('#wallet-btn');
    const walletModal = $('#wallet-modal-overlay');
    const walletClose = $('#wallet-close');
    const topupBtn = $('#topup-action-btn');
    const topupInput = $('#topup-amount-input');

    if (walletBtn) {
      walletBtn.onclick = async () => {
        await refreshWalletUI();
        if (walletModal) walletModal.style.display = 'flex';
      };
    }

    if (walletClose) {
      walletClose.onclick = () => { if (walletModal) walletModal.style.display = 'none'; };
    }

    if (topupBtn && topupInput) {
      topupBtn.onclick = async () => {
        const amount = parseFloat(topupInput.value);
        if (!amount || amount <= 0) return showToast('Enter valid amount to top up', 'error');
        try {
          const res = await api('/api/wallet/topup', {
            method: 'POST',
            body: JSON.stringify({ amount })
          });
          showToast(res.message);
          topupInput.value = '';
          await refreshWalletUI();
        } catch (e) {}
      };
    }
  }

  async function refreshWalletUI() {
    try {
      const res = await api('/api/wallet/balance');
      const data = res.data;
      if ($('#header-wallet-val') && data) $('#header-wallet-val').textContent = `₹${Math.round(data.balance || 0)} Wallet`;
      if ($('#wallet-modal-balance') && data) $('#wallet-modal-balance').textContent = `₹${(data.balance || 0).toFixed(2)}`;
      
      const txList = $('#wallet-tx-list');
      if (txList && data && data.transactions) {
        txList.innerHTML = data.transactions.map(t => `
          <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2); padding:8px 12px; border-radius:var(--radius-sm); font-size:0.8rem;">
            <div>
              <strong>${t.desc}</strong>
              <small style="display:block; color:var(--text-dim);">${new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
            </div>
            <strong style="color:${t.type === 'credit' ? 'var(--green-400)' : '#ef4444'};">${t.type === 'credit' ? '+' : '-'}₹${t.amount.toFixed(2)}</strong>
          </div>
        `).join('');
      }
    } catch (e) {}
  }

  // ----------------------------------------------------
  // Nutrition & Allergen Advisor
  // ----------------------------------------------------
  function setupNutritionAdvisor() {
    const nutriBtn = $('#nutrition-btn');
    const nutriModal = $('#nutrition-modal-overlay');
    const nutriClose = $('#nutrition-close');

    if (nutriBtn) {
      nutriBtn.onclick = async () => {
        if (nutriModal) nutriModal.style.display = 'flex';
        const items = (state.cart.items && state.cart.items.length > 0) ? state.cart.items : state.products.slice(0, 3).map(p => ({ productId: p.id, quantity: 1 }));
        try {
          const res = await api('/api/nutrition/analyze', {
            method: 'POST',
            body: JSON.stringify({ items, allergies: ['lactose'] })
          });
          const data = res.data;
          if (!data) return;

          const gradeVal = $('#nutri-grade-val');
          if (gradeVal) {
            gradeVal.textContent = data.nutriScore;
            gradeVal.style.color = data.badgeColor;
          }
          const ratVal = $('#nutri-rating-val');
          if (ratVal) ratVal.textContent = `Health Score: ${data.healthRating}/100`;

          if (data.totals) {
            if ($('#nutri-cal-val')) $('#nutri-cal-val').textContent = `${data.totals.calories} kcal`;
            if ($('#nutri-prot-val')) $('#nutri-prot-val').textContent = `${data.totals.protein}g`;
            if ($('#nutri-fib-val')) $('#nutri-fib-val').textContent = `${data.totals.fiber}g`;
            if ($('#nutri-carb-val')) $('#nutri-carb-val').textContent = `${data.totals.carbs}g`;
          }

          const alertsBox = $('#allergen-alerts-box');
          if (alertsBox) {
            if (data.allergenWarnings && data.allergenWarnings.length > 0) {
              alertsBox.innerHTML = `
                <div style="background:rgba(239,68,68,0.1); border:1px solid #ef4444; padding:10px; border-radius:var(--radius-sm); font-size:0.82rem; color:#f87171;">
                  ${data.allergenWarnings.map(w => `<div>${w}</div>`).join('')}
                </div>
              `;
            } else {
              alertsBox.innerHTML = '<div style="color:var(--green-400); font-size:0.82rem;">✅ Zero Allergen Conflicts Detected in Current Basket</div>';
            }
          }

          const subsBox = $('#smart-subs-box');
          if (subsBox && data.smartSubstitutions && data.smartSubstitutions.length > 0) {
            subsBox.innerHTML = `
              <small style="color:var(--text-muted); font-weight:700; display:block; margin-bottom:6px;">✨ AI Healthier Substitutions:</small>
              ${data.smartSubstitutions.map(s => `
                <div style="background:rgba(0,0,0,0.25); padding:8px 12px; border-radius:var(--radius-sm); margin-bottom:6px; font-size:0.8rem; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <strong>${s.suggested.name}</strong> (for ${s.forProduct})
                    <small style="display:block; color:var(--text-dim);">${s.suggested.reason}</small>
                  </div>
                  <span class="ai-pill" style="font-size:0.68rem;">Health Swap</span>
                </div>
              `).join('')}
            `;
          }
        } catch (e) {}
      };
    }

    if (nutriClose) {
      nutriClose.onclick = () => { if (nutriModal) nutriModal.style.display = 'none'; };
    }
  }

  // ----------------------------------------------------
  // Neighborhood Group Buying
  // ----------------------------------------------------
  function setupGroupOrders() {
    const groupBtn = $('#group-buy-btn');
    const groupModal = $('#group-modal-overlay');
    const groupClose = $('#group-close');
    const createBtn = $('#create-group-btn');
    const groupNameInput = $('#new-group-name');

    if (groupBtn) {
      groupBtn.onclick = async () => {
        await refreshGroupLobbiesUI();
        if (groupModal) groupModal.style.display = 'flex';
      };
    }

    if (groupClose) {
      groupClose.onclick = () => { if (groupModal) groupModal.style.display = 'none'; };
    }

    if (createBtn && groupNameInput) {
      createBtn.onclick = async () => {
        const communityName = groupNameInput.value.trim();
        if (!communityName) return showToast('Enter apartment or society name', 'error');
        try {
          const res = await api('/api/group-orders/create', {
            method: 'POST',
            body: JSON.stringify({ communityName, hostName: state.user ? state.user.name : 'You' })
          });
          showToast(res.message);
          groupNameInput.value = '';
          await refreshGroupLobbiesUI();
        } catch (e) {}
      };
    }
  }

  async function refreshGroupLobbiesUI() {
    try {
      const res = await api('/api/group-orders/lobbies');
      const container = $('#group-lobbies-list');
      if (container && res.data) {
        container.innerHTML = res.data.map(l => `
          <div style="background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); padding:12px 16px; border-radius:var(--radius-md); display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-weight:700; font-size:0.95rem; color:var(--text-main);">${l.communityName}</div>
              <small style="color:var(--text-dim); display:block;">Host: ${l.hostName} • ${l.members.length} Neighbors Joined</small>
              <span class="ai-pill" style="margin-top:4px; font-size:0.7rem; color:var(--green-400); background:rgba(16,185,129,0.12);">
                🎁 ${l.currentDiscountPercent}% Community Discount Active
              </span>
            </div>
            <button class="btn-secondary" style="font-size:0.8rem; padding:6px 14px;" onclick="app.joinGroup('${l.groupId}')">
              Join Lobby ➔
            </button>
          </div>
        `).join('');
      }
    } catch (e) {}
  }

  // ----------------------------------------------------
  // PWA (Progressive Web App) Setup
  // ----------------------------------------------------
  let deferredInstallPrompt = null;

  function setupPWA() {
    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('✅ [PWA] Service Worker registered with scope:', reg.scope))
          .catch(err => console.warn('⚠️ [PWA] Service Worker registration failed:', err));
      });
    }

    // 2. Handle beforeinstallprompt for in-app install button
    const installBtn = $('#pwa-install-btn');
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      if (installBtn) installBtn.style.display = 'inline-flex';
    });

    if (installBtn) {
      installBtn.onclick = async () => {
        if (!deferredInstallPrompt) {
          showToast('App is ready to install or already installed!');
          return;
        }
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          showToast('🎉 FreshCart AI installed successfully to your home screen!');
          installBtn.style.display = 'none';
        }
        deferredInstallPrompt = null;
      };
    }
  }

  // ----------------------------------------------------
  // Multimodal Snap Your Fridge AI Scanner
  // ----------------------------------------------------
  let currentFridgeData = null;

  function setupSmartFridgeScanner() {
    const fridgeBtn = $('#fridge-scan-btn');
    const fridgeModal = $('#fridge-modal-overlay');
    const fridgeClose = $('#fridge-close');
    const fileInput = $('#fridge-file-input');
    const presetBtns = document.querySelectorAll('.fridge-preset-btn');
    const addAllBtn = $('#fridge-add-all-btn');

    if (fridgeBtn) {
      fridgeBtn.onclick = () => {
        if (fridgeModal) fridgeModal.style.display = 'flex';
        runFridgeScan('breakfast_depleted');
      };
    }

    if (fridgeClose) {
      fridgeClose.onclick = () => { if (fridgeModal) fridgeModal.style.display = 'none'; };
    }

    presetBtns.forEach(btn => {
      btn.onclick = () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const presetKey = btn.dataset.preset;
        runFridgeScan(presetKey);
      };
    });

    if (fileInput) {
      fileInput.onchange = (e) => {
        if (e.target.files && e.target.files[0]) {
          showToast('📸 Photo uploaded! Neural vision analyzing inventory...');
          runFridgeScan('weekly_pantry_restock', e.target.files[0].name);
        }
      };
    }

    if (addAllBtn) {
      addAllBtn.onclick = () => {
        if (!currentFridgeData || !currentFridgeData.missingEssentials) return;
        currentFridgeData.missingEssentials.forEach(item => {
          addToCart(item.id, 1);
        });
        showToast(`⚡ Added ${currentFridgeData.missingEssentials.length} missing essentials to cart with 10% AI bundle discount!`);
        if (fridgeModal) fridgeModal.style.display = 'none';
        openCart();
      };
    }
  }

  async function runFridgeScan(presetKey = 'breakfast_depleted', customPrompt = '') {
    const radar = $('#fridge-scanning-radar');
    const resultsBox = $('#fridge-scan-results');
    if (radar) radar.style.display = 'block';
    if (resultsBox) resultsBox.style.display = 'none';

    try {
      const res = await api('/api/visual/smart-fridge-scan', {
        method: 'POST',
        body: JSON.stringify({ presetKey, customPrompt })
      });

      setTimeout(() => {
        if (radar) radar.style.display = 'none';
        if (resultsBox) resultsBox.style.display = 'block';
        currentFridgeData = res;

        $('#fridge-result-title').textContent = res.scene.title;
        $('#fridge-confidence-badge').textContent = `Confidence: ${res.scene.overallConfidence} • ${res.missingEssentialsCount} Items Low`;
        $('#fridge-bundle-price').textContent = `₹${res.financialSummary.finalBundlePrice.toFixed(2)}`;

        const list = $('#fridge-detected-items-list');
        if (list && res.missingEssentials) {
          list.innerHTML = res.missingEssentials.map(item => `
            <div style="background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); padding:8px 12px; border-radius:var(--radius-sm); display:flex; justify-content:space-between; align-items:center; font-size:0.82rem;">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:1.3rem;">${item.image || '🛒'}</span>
                <div>
                  <strong>${item.name}</strong>
                  <small style="display:block; color:var(--text-dim);">${item.reason} (${Math.round(item.confidence * 100)}% match)</small>
                </div>
              </div>
              <div style="text-align:right;">
                <strong style="color:var(--green-400);">₹${item.price}</strong>
                <small style="display:block; color:var(--text-dim);">/${item.unit}</small>
              </div>
            </div>
          `).join('');
        }
      }, 500);
    } catch (e) {
      if (radar) radar.style.display = 'none';
    }
  }

  // ----------------------------------------------------
  // Interactive Razorpay & UPI Payment Gateway Engine
  // ----------------------------------------------------
  let pendingOrderPayload = null;
  let pgBaseTotal = 0;
  let pgTimerInterval = null;
  let pgWalletAvail = 150.00;

  function setupPaymentGateway() {
    const pgModal = $('#payment-gateway-overlay');
    const pgClose = $('#payment-gateway-close');
    const tabUpi = $('#pg-tab-upi');
    const tabCard = $('#pg-tab-card');
    const tabApps = $('#pg-tab-apps');
    const submitBtn = $('#pg-submit-pay-btn');
    const walletToggle = $('#pg-wallet-toggle');
    const cardNumberInput = $('#pg-card-number');
    const cardExpiryInput = $('#pg-card-expiry');

    if (!pgModal) return;

    pgClose.onclick = () => {
      clearInterval(pgTimerInterval);
      pgModal.style.display = 'none';
    };

    // Tab Switcher
    const tabs = [
      { btn: tabUpi, content: $('#pg-content-upi') },
      { btn: tabCard, content: $('#pg-content-card') },
      { btn: tabApps, content: $('#pg-content-apps') }
    ];

    tabs.forEach(t => {
      if (t.btn && t.content) {
        t.btn.onclick = () => {
          tabs.forEach(x => {
            if (x.btn) x.btn.classList.remove('active');
            if (x.content) x.content.style.display = 'none';
          });
          t.btn.classList.add('active');
          t.content.style.display = 'block';
        };
      }
    });

    // Dynamic Wallet Split Toggle
    if (walletToggle) {
      walletToggle.onchange = () => {
        recalculatePaymentGateway();
      };
    }

    // Card Number Formatting & Network Detection
    if (cardNumberInput) {
      cardNumberInput.oninput = (e) => {
        let val = e.target.value.replace(/\D/g, '').substring(0, 16);
        let formatted = val.match(/.{1,4}/g)?.join('  ') || val;
        e.target.value = formatted;

        const badge = $('#card-network-badge');
        if (badge) {
          if (val.startsWith('4')) badge.textContent = '💳 Visa Verified';
          else if (val.startsWith('5')) badge.textContent = '💳 Mastercard';
          else if (val.startsWith('6')) badge.textContent = '🇮🇳 RuPay Card';
          else if (val.startsWith('3')) badge.textContent = '💳 Amex Express';
          else badge.textContent = '💳 Debit/Credit Card';
        }
      };
    }

    // Card Expiry Formatting
    if (cardExpiryInput) {
      cardExpiryInput.oninput = (e) => {
        let val = e.target.value.replace(/\D/g, '').substring(0, 4);
        if (val.length >= 3) {
          e.target.value = val.substring(0, 2) + '/' + val.substring(2);
        } else {
          e.target.value = val;
        }
      };
    }

    if (submitBtn) {
      submitBtn.onclick = async () => {
        await executeGatewayPayment();
      };
    }
  }

  function openPaymentGateway(orderPayload, finalAmount) {
    pendingOrderPayload = orderPayload;
    pgBaseTotal = Math.max(0, finalAmount);
    const pgModal = $('#payment-gateway-overlay');

    // Fetch current wallet balance
    api('/api/wallet/balance').then(res => {
      if (res && res.data) {
        pgWalletAvail = res.data.balance || 0;
        const availText = $('#pg-wallet-avail-text');
        if (availText) availText.textContent = `Available: ₹${pgWalletAvail.toFixed(2)}`;
      }
      recalculatePaymentGateway();
    }).catch(() => {
      recalculatePaymentGateway();
    });

    $('#pg-order-ref').textContent = 'ORD-' + Math.random().toString(36).substring(2, 7).toUpperCase();

    // Start 5-Minute Session Timer
    startPaymentTimer(300);

    pgModal.style.display = 'flex';
  }

  function recalculatePaymentGateway() {
    const walletToggle = $('#pg-wallet-toggle');
    const isWalletActive = walletToggle ? walletToggle.checked : false;

    let walletDeduction = 0;
    if (isWalletActive && pgWalletAvail > 0) {
      walletDeduction = Math.min(pgWalletAvail, pgBaseTotal);
    }

    const netPayable = Math.max(0, pgBaseTotal - walletDeduction);

    $('#pg-payable-total').textContent = `₹${netPayable.toFixed(2)}`;
    const subtext = $('#pg-breakdown-subtext');
    if (subtext) {
      if (walletDeduction > 0) {
        subtext.innerHTML = `Base: ₹${pgBaseTotal.toFixed(2)} • <span style="color:var(--green-400);">FreshWallet: -₹${walletDeduction.toFixed(2)}</span>`;
      } else {
        subtext.textContent = 'Includes taxes, tip & delivery fee';
      }
    }

    const btnLabel = $('#pg-submit-btn-label');
    if (btnLabel) {
      if (netPayable === 0 && walletDeduction > 0) {
        btnLabel.textContent = `⚡ 1-Click Pay ₹${pgBaseTotal.toFixed(2)} with FreshWallet`;
      } else if (walletDeduction > 0) {
        btnLabel.textContent = `Authorize & Pay ₹${netPayable.toFixed(2)} (+ ₹${walletDeduction.toFixed(2)} Wallet)`;
      } else {
        btnLabel.textContent = `Authorize & Complete Payment (₹${netPayable.toFixed(2)})`;
      }
    }

    drawUPIQRCode(netPayable > 0 ? netPayable : pgBaseTotal);
  }

  function startPaymentTimer(seconds) {
    clearInterval(pgTimerInterval);
    let remaining = seconds;
    const badge = $('#pg-timer-badge');

    function update() {
      const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
      const secs = (remaining % 60).toString().padStart(2, '0');
      if (badge) badge.textContent = `⏳ ${mins}:${secs}`;
      if (remaining <= 0) {
        clearInterval(pgTimerInterval);
        showToast('QR Code refreshed for security.');
        startPaymentTimer(300);
      }
      remaining--;
    }

    update();
    pgTimerInterval = setInterval(update, 1000);
  }

  function drawUPIQRCode(amount) {
    const canvas = $('#pg-upi-qr-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // High contrast dark matrix on canvas
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    function drawEye(x, y) {
      ctx.fillStyle = '#10b981';
      ctx.fillRect(x, y, 40, 40);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(x + 6, y + 6, 28, 28);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(x + 12, y + 12, 16, 16);
    }

    drawEye(10, 10);
    drawEye(canvas.width - 50, 10);
    drawEye(10, canvas.height - 50);

    // Deterministic pseudorandom QR bits
    ctx.fillStyle = '#34d399';
    const seed = Math.round(amount * 100) + 42;
    for (let i = 0; i < 16; i++) {
      for (let j = 0; j < 16; j++) {
        if ((i < 5 && j < 5) || (i > 10 && j < 5) || (i < 5 && j > 10)) continue;
        if ((i * 9 + j * 17 + seed) % 2 === 0) {
          ctx.fillRect(12 + i * 10, 12 + j * 10, 8, 8);
        }
      }
    }
  }

  async function executeGatewayPayment() {
    const submitBtn = $('#pg-submit-pay-btn');
    const indicator = $('#pg-processing-indicator');
    const procTitle = $('#pg-processing-title');
    const procDesc = $('#pg-processing-desc');

    if (!submitBtn || !pendingOrderPayload) return;

    submitBtn.disabled = true;
    if (indicator) indicator.style.display = 'block';

    if (procTitle) procTitle.textContent = '🔒 Contacting Bank / NPCI Network...';
    if (procDesc) procDesc.textContent = 'Verifying 256-Bit SSL token & encrypted UPI mandate';

    setTimeout(() => {
      if (procTitle) procTitle.textContent = '⚡ Authorizing Payment Gateway...';
      if (procDesc) procDesc.textContent = 'Debiting account & triggering automatic 5% FreshWallet cashback';
    }, 400);

    setTimeout(async () => {
      try {
        const res = await api('/api/orders', {
          method: 'POST',
          body: JSON.stringify(pendingOrderPayload)
        });

        clearInterval(pgTimerInterval);
        $('#payment-gateway-overlay').style.display = 'none';
        if (indicator) indicator.style.display = 'none';
        submitBtn.disabled = false;

        state.lastPlacedOrder = res.data;
        state.coins += 50;
        if ($('#header-coins-val')) $('#header-coins-val').textContent = `${state.coins} Coins`;

        showToast('🎉 Payment Verified! 5% Cashback added to your FreshWallet.');
        showOrderConfirmation(res.data);
        loadCart();
        refreshWalletUI();
      } catch (err) {
        if (indicator) indicator.style.display = 'none';
        submitBtn.disabled = false;
        showToast('Payment could not be completed: ' + (err.message || 'Network error'), 'error');
      }
    }, 900);
  }

  // ----------------------------------------------------
  // Wishlist / Favorites Feature Module
  // ----------------------------------------------------
  function updateWishlistBadge() {
    const badge = $('#wishlist-badge');
    if (badge) {
      badge.textContent = state.wishlist ? state.wishlist.length : 0;
    }
  }

  function toggleWishlist(productId) {
    if (!state.wishlist) state.wishlist = [];
    const idx = state.wishlist.indexOf(productId);
    if (idx >= 0) {
      state.wishlist.splice(idx, 1);
      showToast('Removed from Wishlist');
    } else {
      state.wishlist.push(productId);
      showToast('Added to Wishlist ❤️');
    }
    localStorage.setItem('freshcart_wishlist', JSON.stringify(state.wishlist));
    updateWishlistBadge();
    renderProductsGrid();
    renderRecommendationsGrid();
  }

  function openWishlistModal() {
    const modal = $('#wishlist-modal-overlay');
    const container = $('#wishlist-items-container');
    if (!modal || !container) return;

    if (!state.wishlist || state.wishlist.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:30px; color:var(--text-muted);">
          <span style="font-size:2.5rem; display:block; margin-bottom:8px;">🤍</span>
          <h4>Your Wishlist is Empty</h4>
          <p style="font-size:0.85rem;">Click the heart icon on any product to save items for later.</p>
        </div>
      `;
    } else {
      const items = state.wishlist.map(id => state.products.find(p => p.id === id) || { id, name: 'Saved Product', emoji: '🛒', price: 99, category: 'Grocery' });
      container.innerHTML = items.map(p => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); padding:10px 14px; border-radius:var(--radius-sm); margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="wishlist-item-img-container">
              <img class="wishlist-item-img" src="${p.image_url || '/images/products/grocery-default.svg'}" alt="${escapeHtml(p.name)}" onerror="handleImageError(this, '')">
            </div>
            <div>
              <strong style="color:var(--text-main); font-size:0.9rem;">${escapeHtml(p.name)}</strong>
              <small style="display:block; color:var(--text-dim);">₹${p.price} • ${p.category}</small>
            </div>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn-primary" style="padding:6px 12px; font-size:0.8rem;" onclick="app.addToCart('${p.id}')">+ Add to Cart</button>
            <button class="btn-secondary" style="padding:6px 10px; font-size:0.8rem;" onclick="app.toggleWishlist('${p.id}'); app.openWishlistModal();">🗑️</button>
          </div>
        </div>
      `).join('');
    }

    modal.style.display = 'flex';
  }

  function closeWishlistModal() {
    const modal = $('#wishlist-modal-overlay');
    if (modal) modal.style.display = 'none';
  }

  function clearWishlist() {
    state.wishlist = [];
    localStorage.removeItem('freshcart_wishlist');
    updateWishlistBadge();
    openWishlistModal();
    renderProductsGrid();
    renderRecommendationsGrid();
    showToast('Wishlist cleared');
  }

  function addAllWishlistToCart() {
    if (!state.wishlist || state.wishlist.length === 0) {
      showToast('Wishlist is empty', 'error');
      return;
    }
    state.wishlist.forEach(id => addToCart(id, 1));
    showToast(`Added ${state.wishlist.length} wishlisted items to cart!`);
    closeWishlistModal();
    openCart();
  }

  // ----------------------------------------------------
  // Product Comparison Matrix Module
  // ----------------------------------------------------
  function updateCompareBadge() {
    const badge = $('#compare-badge');
    if (badge) {
      badge.textContent = state.compareList ? state.compareList.length : 0;
    }
  }

  function toggleCompare(productId) {
    if (!state.compareList) state.compareList = [];
    const idx = state.compareList.indexOf(productId);
    if (idx >= 0) {
      state.compareList.splice(idx, 1);
      showToast('Removed from Comparison');
    } else {
      if (state.compareList.length >= 4) {
        showToast('Maximum 4 products can be compared at once', 'error');
        return;
      }
      state.compareList.push(productId);
      showToast('Added to Comparison ⚖️');
    }
    localStorage.setItem('freshcart_compare', JSON.stringify(state.compareList));
    updateCompareBadge();
    renderProductsGrid();
    renderRecommendationsGrid();
  }

  async function openCompareModal() {
    const modal = $('#compare-modal-overlay');
    const content = $('#compare-matrix-content');
    if (!modal || !content) return;

    if (!state.compareList || state.compareList.length === 0) {
      content.innerHTML = `
        <div style="text-align:center; padding:30px; color:var(--text-muted);">
          <span style="font-size:2.5rem; display:block; margin-bottom:8px;">⚖️</span>
          <h4>No Products Selected for Comparison</h4>
          <p style="font-size:0.85rem;">Click the ⚖️ Compare icon on up to 4 product cards to evaluate side-by-side specs, price per unit, and ratings.</p>
        </div>
      `;
      modal.style.display = 'flex';
      return;
    }

    try {
      const res = await api('/api/recommendations/compare', {
        method: 'POST',
        body: JSON.stringify({ productIds: state.compareList })
      });

      if (!res.products || res.products.length === 0) {
        content.innerHTML = '<p style="color:var(--text-muted); text-align:center;">Could not load product comparison details.</p>';
      } else {
        const prods = res.products;
        content.innerHTML = `
          <div style="background:rgba(16,185,129,0.08); border:1px solid var(--border-active); padding:12px 16px; border-radius:var(--radius-md); margin-bottom:14px; font-size:0.88rem;">
            <strong>🧠 AI Summary Verdict:</strong>
            <span style="color:var(--green-400);">${res.aiVerdict}</span>
          </div>
          <table class="compare-table">
            <thead>
              <tr>
                <th>Attribute</th>
                ${prods.map(p => `
                  <td class="compare-product-col-header">
                    <div class="cart-item-img-container" style="margin:0 auto 8px; width:52px; height:52px;">
                      <img class="cart-item-img" src="${p.image_url || '/images/products/grocery-default.svg'}" alt="${escapeHtml(p.name)}" onerror="handleImageError(this, '')">
                    </div>
                    <strong style="display:block; font-size:0.95rem;">${escapeHtml(p.name)}</strong>
                    ${p.id === res.highlights?.bestValueId ? '<span class="compare-highlight-badge badge-best-value">🏆 Best Value</span>' : ''}
                    ${p.id === res.highlights?.topRatedId ? '<span class="compare-highlight-badge badge-top-rated">⭐ Top Rated</span>' : ''}
                  </td>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Price & Unit</th>
                ${prods.map(p => `<td><strong style="color:var(--green-400); font-size:1.05rem;">₹${p.price}</strong> / ${p.unit}</td>`).join('')}
              </tr>
              <tr>
                <th>Customer Rating</th>
                ${prods.map(p => `<td>⭐ ${p.rating} / 5.0</td>`).join('')}
              </tr>
              <tr>
                <th>Category</th>
                ${prods.map(p => `<td>${p.category}</td>`).join('')}
              </tr>
              <tr>
                <th>Stock Status</th>
                ${prods.map(p => `<td>${p.stock > 0 ? `<span style="color:var(--green-400);">✅ In Stock (${p.stock})</span>` : '<span style="color:#ef4444;">❌ Out of Stock</span>'}</td>`).join('')}
              </tr>
              <tr>
                <th>Dietary Tags</th>
                ${prods.map(p => `<td>${(p.tags || []).slice(0, 3).map(t => `<span style="background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:4px; font-size:0.75rem; margin-right:4px;">${t}</span>`).join('') || 'Standard'}</td>`).join('')}
              </tr>
              <tr>
                <th>Action</th>
                ${prods.map(p => `
                  <td>
                    <button class="btn-primary" style="padding:6px 12px; font-size:0.8rem; width:100%;" onclick="app.addToCart('${p.id}')">+ Add to Cart</button>
                  </td>
                `).join('')}
              </tr>
            </tbody>
          </table>
        `;
      }
      modal.style.display = 'flex';
    } catch (e) {
      showToast('Failed to load comparison: ' + e.message, 'error');
    }
  }

  function closeCompareModal() {
    const modal = $('#compare-modal-overlay');
    if (modal) modal.style.display = 'none';
  }

  function clearCompareList() {
    state.compareList = [];
    localStorage.removeItem('freshcart_compare');
    updateCompareBadge();
    openCompareModal();
    renderProductsGrid();
    renderRecommendationsGrid();
    showToast('Comparison cleared');
  }

  // ----------------------------------------------------
  // Autocomplete Live Search Suggestions Module with Substring Highlighting & Keyboard Nav
  // ----------------------------------------------------
  function highlightSearchMatch(text, query) {
    if (!query || !text) return escapeHtml(text || '');
    const safeText = escapeHtml(text);
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${safeQuery})`, 'gi');
    return safeText.replace(regex, '<mark class="search-match">$1</mark>');
  }

  function setupSearchAutocomplete() {
    const searchInput = $('#search-input');
    const dropdown = $('#smart-search-dropdown');
    const clearBtn = $('#search-clear');
    if (!searchInput || !dropdown) return;

    let debounceTimer = null;
    let selectedIndex = -1;
    let currentSuggestions = [];

    function updateActiveSuggestion() {
      const items = dropdown.querySelectorAll('.search-suggestion-item');
      items.forEach((it, idx) => {
        if (idx === selectedIndex) {
          it.classList.add('active-suggestion');
          it.scrollIntoView({ block: 'nearest' });
        } else {
          it.classList.remove('active-suggestion');
        }
      });
    }

    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      clearTimeout(debounceTimer);
      selectedIndex = -1;
      if (clearBtn) clearBtn.style.display = val ? 'block' : 'none';

      if (val.length < 2) {
        dropdown.style.display = 'none';
        currentSuggestions = [];
        if (val.length === 0 && state.searchQuery) {
          state.searchQuery = '';
          loadProducts(1);
        }
        return;
      }

      debounceTimer = setTimeout(async () => {
        try {
          const res = await api(`/api/search/suggestions?q=${encodeURIComponent(val)}&limit=6`);
          if (res && res.data && res.data.length > 0) {
            currentSuggestions = res.data;
            selectedIndex = -1;
            dropdown.innerHTML = res.data.map((s, idx) => `
              <div class="search-suggestion-item" data-idx="${idx}" onclick="app.applySearchSuggestion('${escapeHtml(s.query || s.text)}', '${s.productId || ''}')">
                <div style="display:flex; align-items:center; gap:10px;">
                  ${s.image_url ? `<img class="search-suggestion-thumb" style="width:36px; height:36px; object-fit:contain; border-radius:6px; background:rgba(255,255,255,0.05); padding:2px;" src="${s.image_url}" alt="${escapeHtml(s.text)}" onerror="handleImageError(this, '')">` : `<span style="font-size:1.2rem;">${s.emoji || '🔍'}</span>`}
                  <div>
                    <strong style="font-size:0.88rem; color:var(--text-main);">${highlightSearchMatch(s.text, val)}</strong>
                    <small style="display:block; color:var(--text-dim); text-transform:capitalize;">${s.type} ${s.category ? '• ' + s.category : ''}</small>
                  </div>
                </div>
                ${s.price ? `<span style="font-weight:700; color:var(--green-400); font-size:0.88rem; font-variant-numeric:tabular-nums;">₹${s.price}</span>` : '<span style="color:var(--text-dim);">↗</span>'}
              </div>
            `).join('');
            dropdown.style.display = 'block';
          } else {
            dropdown.style.display = 'none';
            currentSuggestions = [];
          }
        } catch (err) {
          dropdown.style.display = 'none';
          currentSuggestions = [];
        }
      }, 120);
    });

    searchInput.addEventListener('keydown', (e) => {
      const items = dropdown.querySelectorAll('.search-suggestion-item');
      if (dropdown.style.display === 'block' && items.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          selectedIndex = (selectedIndex + 1) % items.length;
          updateActiveSuggestion();
          return;
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          selectedIndex = (selectedIndex - 1 + items.length) % items.length;
          updateActiveSuggestion();
          return;
        } else if (e.key === 'Escape') {
          dropdown.style.display = 'none';
          selectedIndex = -1;
          return;
        }
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (dropdown.style.display === 'block' && selectedIndex >= 0 && currentSuggestions[selectedIndex]) {
          const sel = currentSuggestions[selectedIndex];
          applySearchSuggestion(sel.query || sel.text, sel.productId || '');
          return;
        }
        const val = searchInput.value.trim();
        dropdown.style.display = 'none';
        state.searchQuery = val;
        loadProducts(1);
        const catalogSec = $('#catalog-section');
        if (catalogSec) catalogSec.scrollIntoView({ behavior: 'smooth' });
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        dropdown.style.display = 'none';
        selectedIndex = -1;
        currentSuggestions = [];
        state.searchQuery = '';
        loadProducts(1);
      });
    }

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
        selectedIndex = -1;
      }
    });
  }

  function applySearchSuggestion(query, productId) {
    const input = $('#search-input');
    const dropdown = $('#smart-search-dropdown');
    if (input) input.value = query;
    if (dropdown) dropdown.style.display = 'none';

    if (productId) {
      trackRecentlyViewed(productId);
      openProductDetail(productId);
    } else {
      state.searchQuery = query;
      loadProducts(1);
    }
  }

  // ----------------------------------------------------
  // Stockout & Price-Drop Alert Module
  // ----------------------------------------------------
  let activeAlertProductId = null;

  function openStockAlertModal(productId) {
    activeAlertProductId = productId;
    const p = state.products.find(x => x.id === productId);
    const modal = $('#stock-alert-overlay');
    if (!modal) return;

    if ($('#stock-alert-title')) $('#stock-alert-title').textContent = p ? `Set Alert for ${p.name}` : 'Set Stock & Price Alert';
    if ($('#stock-alert-desc')) $('#stock-alert-desc').textContent = p ? `Receive an instant alert when ${p.name} is restocked or when price drops.` : 'Set your restock notification.';
    modal.style.display = 'flex';
  }

  function closeStockAlertModal() {
    const modal = $('#stock-alert-overlay');
    if (modal) modal.style.display = 'none';
    activeAlertProductId = null;
  }

  function saveStockAlert() {
    const contact = $('#alert-contact-input')?.value;

    if (!contact) {
      showToast('Please enter your mobile or email', 'error');
      return;
    }

    const p = state.products.find(x => x.id === activeAlertProductId);
    showToast(`🔔 Alert activated for ${p ? p.name : 'product'}! We will notify ${contact} on restock.`);
    closeStockAlertModal();
  }

  // ----------------------------------------------------
  // Smart Bundle 1-Click Cart Addition
  // ----------------------------------------------------
  function addBundleToCart(bundleId) {
    const bundle = (state.smartBundles || []).find(b => b.bundleId === bundleId);
    if (!bundle || !bundle.items) {
      showToast('Adding combo pack to cart...');
      addToCart('p3', 1);
      addToCart('p7', 1);
      return;
    }

    bundle.items.forEach(item => {
      addToCart(item.id, 1);
    });

    showToast(`🎉 Added ${bundle.bundleName} to cart with 15% bundled savings of ₹${bundle.savingsAmount}!`);
    openCart();
  }

  // Expose global methods
  window.app = {
    switchView,
    showToast,
    addToCart,
    updateCartQty,
    clearCart,
    openCart,
    closeCart,
    openCheckout,
    selectSearchResult,
    addBundleToCart,
    openProductDetail: (pId) => {
      trackRecentlyViewed(pId);
      openProductDetail(pId);
    },
    openInvoiceModal,
    toggleWishlist,
    openWishlistModal,
    closeWishlistModal,
    clearWishlist,
    addAllWishlistToCart,
    toggleCompare,
    openCompareModal,
    closeCompareModal,
    clearCompareList,
    applySearchSuggestion,
    openStockAlertModal,
    closeStockAlertModal,
    saveStockAlert,
    clearRecentlyViewed,
    simulateUPIApp: (appName) => {
      showToast(`📱 Redirecting to ${appName} App intent...`);
      setTimeout(() => {
        executeGatewayPayment();
      }, 500);
    },
    joinGroup: async (groupId) => {
      try {
        const res = await api(`/api/group-orders/${groupId}/join`, {
          method: 'POST',
          body: JSON.stringify({ memberName: state.user ? state.user.name : 'You', itemsCount: state.cart.itemCount || 2, subtotal: state.cart.subtotal || 350 })
        });
        showToast(res.message);
        await refreshGroupLobbiesUI();
      } catch (e) {}
    },
    setHub: (hub, eta) => {
      state.currentHub = hub;
      state.hubEta = eta;
      $('#current-location-text').innerHTML = `📍 ${hub} • <strong>⚡ ${eta} ETA</strong>`;
      $('#location-modal-overlay').style.display = 'none';
      showToast(`Switched delivery dark store to ${hub} (${eta})`);
    },
    addCombo: (title) => {
      showToast(`Added ${title} to cart with bundle discount!`);
      addToCart('p3', 1);
      addToCart('p7', 1);
      openCart();
    },
    goToPage: (page) => {
      const target = Math.max(1, Math.min(page, state.totalPages || 1));
      loadProducts(target);
      const section = $('#catalog-section');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    },
    handlePageJump: (customVal) => {
      const input = $('#catalog-jump-input');
      const val = customVal !== undefined ? customVal : (input ? input.value : '');
      const targetPage = parseInt(val, 10);
      if (!isNaN(targetPage) && targetPage >= 1 && targetPage <= (state.totalPages || 417)) {
        app.goToPage(targetPage);
      } else {
        showToast(`Please enter a valid page number (1 to ${state.totalPages || 417})`, 'error');
      }
    },
    promptMobileJump: () => {
      const input = prompt(`Enter page number (1 to ${state.totalPages || 417}):`, state.currentPage);
      if (input !== null && input.trim() !== '') {
        app.handlePageJump(input.trim());
      }
    },
    selectCategory: (cat) => {
      state.currentCategory = cat || 'all';
      loadProducts(1);
    },
    selectDepartment: (deptId) => {
      state.currentDepartment = deptId;
      renderCategorySelector();
    },
    openCategoryMegaModal: () => {
      openCategoryMegaModal();
    },
    closeCategoryMegaModal: () => {
      closeCategoryMegaModal();
    },
    filterMegaCategories: (val) => {
      renderMegaCategories(val);
    },
    selectCategoryFromMega: (catId) => {
      state.currentCategory = catId;
      closeCategoryMegaModal();
      loadProducts(1);
      const catalogSec = $('#catalog-section');
      if (catalogSec) catalogSec.scrollIntoView({ behavior: 'smooth' });
    },
    openFBTModal: async (productId) => {
      try {
        const res = await api(`/api/recommendations/frequently-bought/${productId}`);
        const p = state.products.find(x => x.id === productId);
        const modal = $('#fbt-overlay');
        const content = $('#fbt-content');

        if (!res.data || res.data.length === 0) {
          content.innerHTML = '<p style="color:var(--text-muted);">No frequent item associations found yet.</p>';
        } else {
          content.innerHTML = `
            <div style="margin-bottom:12px;">Customers who bought <strong>${p ? p.name : 'this item'}</strong> also frequently buy:</div>
            ${res.data.map(item => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2); padding:10px 14px; border-radius:var(--radius-sm); margin-bottom:8px;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <img class="combo-thumb" src="${item.image_url || '/images/products/grocery-default.svg'}" alt="${escapeHtml(item.name)}" onerror="handleImageError(this, '')">
                  <div>
                    <strong>${escapeHtml(item.name)}</strong>
                    <small style="color:var(--text-dim); display:block;">₹${item.price} • Lift: ${item.lift}x (${item.confidence}% confidence)</small>
                  </div>
                </div>
                <button class="btn-add-cart" style="padding:6px 12px; font-size:0.8rem;" onclick="app.addToCart('${item.id}'); $('#fbt-overlay').style.display='none';">+ Add</button>
              </div>
            `).join('')}
          `;
        }
        modal.style.display = 'flex';
        $('#fbt-close').onclick = () => modal.style.display = 'none';
      } catch (e) {}
    }
  };
  window.switchAppView = switchView;

  // Boot Application
  async function init() {
    setupPWA();
    setupEventListeners();
    setupVoiceSearch();
    setupSearchAutocomplete();
    setupSpinWheel();
    setupScratchCard();
    setupFreshBot();
    setupWallet();
    setupNutritionAdvisor();
    setupGroupOrders();
    setupSmartFridgeScanner();
    setupPaymentGateway();
    updateWishlistBadge();
    updateCompareBadge();
    await checkAuth();
    handleHashRouting();
    await Promise.all([
      loadCategories(),
      loadProducts(1),
      loadRecommendations(),
      loadBuyAgain(),
      loadSmartBundles(),
      loadCart(),
      refreshWalletUI()
    ]);
    renderRecentlyViewed();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

