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
      { id: 'sub-1', name: 'Fresh Whole Milk (1L)', emoji: '🥛', price: 69, frequency: 'Daily (7:00 AM)', active: true },
      { id: 'sub-2', name: 'Artisan Sourdough Bread', emoji: '🍞', price: 89, frequency: 'Mon, Wed, Fri', active: true },
      { id: 'sub-3', name: 'Farm Fresh Organic Eggs (6pcs)', emoji: '🥚', price: 85, frequency: 'Daily (7:00 AM)', active: false }
    ],
    pantryItems: [
      { name: 'Cow Milk (1L)', emoji: '🥛', daysLeft: 1, stockLevel: 'Low', status: 'low' },
      { name: 'Brown Bread', emoji: '🍞', daysLeft: 2, stockLevel: 'Low', status: 'low' },
      { name: 'Eggs (Dozen)', emoji: '🥚', daysLeft: 4, stockLevel: 'Medium', status: 'ok' },
      { name: 'Basmati Rice (5kg)', emoji: '🍚', daysLeft: 14, stockLevel: 'Good', status: 'ok' },
      { name: 'Sunflower Oil (1L)', emoji: '🌻', daysLeft: 8, stockLevel: 'Medium', status: 'ok' }
    ]
  };

  localStorage.setItem('freshcart_session', state.sessionId);

  function generateUUID() {
    return 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // DOM Helper
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  // API Request Wrapper
  async function api(endpoint, options = {}) {
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
      return data;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  }

  // Toast Notification
  function showToast(message, type = 'success') {
    const container = $('#toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
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

    if (user) {
      authBtnText.textContent = user.name.split(' ')[0] + ' (Sign Out)';
      $('#login-modal-btn').onclick = logout;
      recSubtitle.textContent = `Personalized for ${user.name} using Collaborative & Content AI`;
      recAlgoBadge.textContent = 'Hybrid User-User Collaborative Filtering';
    } else {
      authBtnText.textContent = 'Sign In';
      $('#login-modal-btn').onclick = () => openAuthModal('login');
      recSubtitle.textContent = 'Trending items • Sign in for personalized Collaborative AI suggestions';
      recAlgoBadge.textContent = 'Popularity & Trending ML';
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
  async function loadProducts() {
    try {
      const params = new URLSearchParams({
        category: state.currentCategory,
        sort: state.currentSort,
        ...(state.searchQuery ? { search: state.searchQuery } : {})
      });
      const res = await api(`/api/products?${params.toString()}`);
      state.products = res.data;
      renderProductsGrid();
      renderFlashDeals();
      renderComboPacks();
    } catch (e) {}
  }

  async function loadRecommendations() {
    try {
      const res = await api('/api/recommendations/personal?limit=6');
      state.recommendedProducts = res.data;
      renderRecommendationsGrid();
    } catch (e) {}
  }

  function renderRecommendationsGrid() {
    const grid = $('#ai-recs-grid');
    if (!grid) return;

    if (state.recommendedProducts.length === 0) {
      grid.innerHTML = '<p style="color:var(--text-muted);">No recommendations available.</p>';
      return;
    }

    grid.innerHTML = state.recommendedProducts.map(p => `
      <div class="product-card">
        <div class="card-match-badge">✨ ${p.matchPercentage || 95}% Match</div>
        <div class="product-emoji" onclick="app.openProductDetail('${p.id}')">${p.emoji}</div>
        <div class="product-info">
          <div class="product-category">${p.category}</div>
          <div class="product-name" onclick="app.openProductDetail('${p.id}')">${p.name}</div>
          <div class="product-desc">${p.description}</div>
          <div class="product-rating">⭐ ${p.rating} / 5.0</div>
          <div class="product-footer">
            <div class="price-box">
              <span class="product-price">₹${p.price}</span>
              <span class="product-unit">per ${p.unit}</span>
            </div>
            <button class="btn-add-cart" onclick="app.addToCart('${p.id}')">+ Add</button>
          </div>
          <button class="btn-fbt" onclick="app.openFBTModal('${p.id}')">🔗 Frequently Bought Together</button>
        </div>
      </div>
    `).join('');
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

    grid.innerHTML = filtered.map(p => `
      <div class="product-card">
        <div class="product-emoji" onclick="app.openProductDetail('${p.id}')">${p.emoji}</div>
        <div class="product-info">
          <div class="product-category">${p.category}</div>
          <div class="product-name" onclick="app.openProductDetail('${p.id}')">${p.name}</div>
          <div class="product-desc">${p.description}</div>
          <div class="product-rating">⭐ ${p.rating} / 5.0 • <small style="color:var(--text-dim);">${p.stock} in stock</small></div>
          <div class="product-footer">
            <div class="price-box">
              <span class="product-price">₹${p.price}</span>
              <span class="product-unit">per ${p.unit}</span>
            </div>
            <button class="btn-add-cart" onclick="app.addToCart('${p.id}')">+ Add</button>
          </div>
          <button class="btn-fbt" onclick="app.openFBTModal('${p.id}')">🔗 Frequently Bought Together</button>
        </div>
      </div>
    `).join('');
  }

  // ----------------------------------------------------
  // Flash Deals & Curated Combo Packs
  // ----------------------------------------------------
  function renderFlashDeals() {
    const grid = $('#flash-deals-grid');
    if (!grid || state.products.length === 0) return;

    const deals = state.products.slice(0, 4);
    grid.innerHTML = deals.map(p => {
      const origPrice = Math.round(p.price * 1.4);
      return `
        <div class="flash-card">
          <div class="flash-top">
            <span style="font-size:1.8rem;">${p.emoji}</span>
            <span class="discount-tag">30% OFF</span>
          </div>
          <div style="margin: 8px 0;">
            <strong style="font-size:0.85rem; display:block; color:#fff;">${p.name}</strong>
            <div style="display:flex; align-items:baseline; gap:6px; margin-top:2px;">
              <span style="font-size:1.05rem; font-weight:800; color:var(--green-400);">₹${p.price}</span>
              <span style="font-size:0.75rem; text-decoration:line-through; color:rgba(255,255,255,0.4);">₹${origPrice}</span>
            </div>
          </div>
          <button class="btn-add-cart" style="padding:4px 8px; font-size:0.78rem; width:100%;" onclick="app.addToCart('${p.id}')">+ Add to Cart</button>
        </div>
      `;
    }).join('');

    // Start countdown timer
    startCountdown();
  }

  function startCountdown() {
    let seconds = 9858;
    const el = $('#flash-countdown');
    if (!el) return;
    setInterval(() => {
      seconds--;
      if (seconds <= 0) seconds = 10800;
      const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
      const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
      const secs = String(seconds % 60).padStart(2, '0');
      el.textContent = `${hrs}:${mins}:${secs}`;
    }, 1000);
  }

  function renderComboPacks() {
    const grid = $('#combo-packs-grid');
    if (!grid) return;

    const combos = [
      {
        title: '🍳 Power Breakfast Combo',
        desc: 'Whole Milk (1L) + Sourdough Bread + Eggs (6) + Salted Butter',
        emojis: '🥛 🍞 🥚 🧈',
        origPrice: 260,
        dealPrice: 220,
        items: ['p3', 'p7', 'p8']
      },
      {
        title: '🥗 Detox Green Salad Box',
        desc: 'Organic Spinach + Fresh Broccoli + Hass Avocado + Fresh Lime',
        emojis: '🥬 🥦 🥑 🍋',
        origPrice: 350,
        dealPrice: 299,
        items: ['p4', 'p5', 'p6']
      },
      {
        title: '☕ Evening Chai & Snack Pack',
        desc: 'Assam Tea Leaves + Pure Cow Milk + Refined Sugar + Butter Cookies',
        emojis: '🍵 🥛 🍬 🍪',
        origPrice: 220,
        dealPrice: 180,
        items: ['p3', 'p9', 'p10']
      }
    ];

    grid.innerHTML = combos.map(c => `
      <div class="combo-card">
        <div>
          <div class="combo-header">
            <strong style="color:var(--green-400); font-size:0.95rem;">${c.title}</strong>
            <span class="discount-tag" style="background:linear-gradient(135deg, #10b981, #059669);">Save ₹${c.origPrice - c.dealPrice}</span>
          </div>
          <div class="combo-items-row">${c.emojis}</div>
          <p style="font-size:0.75rem; color:var(--text-muted); line-height:1.3;">${c.desc}</p>
        </div>
        <div class="combo-footer">
          <div>
            <span style="font-size:1.15rem; font-weight:800; color:#fff;">₹${c.dealPrice}</span>
            <span style="font-size:0.75rem; text-decoration:line-through; color:var(--text-dim); margin-left:4px;">₹${c.origPrice}</span>
          </div>
          <button class="btn-primary" style="padding:6px 12px; font-size:0.78rem;" onclick="app.addCombo('${c.title}')">Add Combo 🛒</button>
        </div>
      </div>
    `).join('');
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
        <div class="item-emoji">${item.emoji}</div>
        <div class="item-details">
          <div class="item-name">${item.name}</div>
          <div class="item-price">₹${item.price} / ${item.unit}</div>
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
            <div>
              <strong>${a.emoji} ${a.name}</strong>
              <small style="color:var(--text-muted); display:block;">₹${a.price} • ${a.confidence}% cross-sell</small>
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

    $('#wheel-close').onclick = () => modal.style.display = 'none';

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
          $('#wheel-result-msg').innerHTML = '🎉 You won coupon <strong>INSTA50</strong> (₹50 Off)! Copied to clipboard.';
          state.appliedCoupon = { code: 'INSTA50', discount: 50 };
          showToast('Coupon INSTA50 applied to cart!');
          updateCartUI();
        }
      }
      requestAnimationFrame(animateSpin);
    };
  }

  // ----------------------------------------------------
  // Post-Order Scratch Card
  // ----------------------------------------------------
  function setupScratchCard() {
    const canvas = $('#scratch-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    $('#open-scratch-modal-btn').onclick = () => {
      $('#confirmation-overlay').style.display = 'none';
      $('#scratch-modal-overlay').style.display = 'flex';
      initScratchCanvas();
    };

    $('#scratch-close').onclick = () => $('#scratch-modal-overlay').style.display = 'none';
    $('#claim-scratch-btn').onclick = () => {
      $('#scratch-modal-overlay').style.display = 'none';
      showToast('₹50 Cashback credited to your FreshCoins wallet!');
      state.coins += 100;
      $('#header-coins-val').textContent = `${state.coins} Coins`;
    };

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

    $('#detail-prod-name').textContent = `${p.emoji} ${p.name}`;
    const content = $('#product-detail-content');

    content.innerHTML = `
      <div style="text-align:center; padding:10px 0;">
        <span style="font-size:3.5rem;">${p.emoji}</span>
        <h3 style="margin-top:6px; color:var(--text-main);">${p.name}</h3>
        <p style="color:var(--text-muted); font-size:0.85rem;">${p.description}</p>
        <div style="font-size:1.3rem; font-weight:800; color:var(--green-400); margin:8px 0;">
          ₹${p.price} <small style="font-size:0.8rem; color:var(--text-dim);">per ${p.unit}</small>
        </div>
      </div>

      <div style="background:rgba(16,185,129,0.06); padding:10px 14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); margin-bottom:12px;">
        <strong style="color:var(--green-400); font-size:0.8rem;">🌿 Freshness & Storage Tip:</strong>
        <p style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
          Store at 2-4°C in vegetable crisper drawer. Peak freshness within 4 days of delivery.
        </p>
      </div>

      <div style="border-top:1px solid var(--border-subtle); padding-top:10px;">
        <strong style="font-size:0.85rem;">⭐ Customer Reviews (4.9/5.0):</strong>
        <div style="font-size:0.78rem; color:var(--text-muted); margin-top:6px; background:rgba(0,0,0,0.2); padding:8px; border-radius:6px;">
          "Super fresh! Delivered in literally 9 minutes. Will definitely order again." — <em>Pooja M. (Verified Buyer)</em>
        </div>
      </div>

      <button class="btn-primary" style="width:100%; margin-top:16px;" onclick="app.addToCart('${p.id}'); $('#product-detail-overlay').style.display='none';">
        🛒 Add to Cart (₹${p.price})
      </button>
    `;

    $('#product-detail-overlay').style.display = 'flex';
  }

  // ----------------------------------------------------
  // NLP Search & Multimodal Image Signature Matching
  // ----------------------------------------------------
  function handleSearchInput(query) {
    state.searchQuery = query;
    clearTimeout(state.searchTimeout);

    const clearBtn = $('#search-clear');
    clearBtn.style.display = query ? 'block' : 'none';

    state.searchTimeout = setTimeout(async () => {
      if (!query.trim()) {
        $('#smart-search-dropdown').style.display = 'none';
        loadProducts();
        return;
      }

      try {
        const res = await api(`/api/search?q=${encodeURIComponent(query)}`);
        renderSearchDropdown(res.data);
      } catch (e) {}
    }, 250);
  }

  function renderSearchDropdown(results) {
    const dropdown = $('#smart-search-dropdown');
    if (!results || results.length === 0) {
      dropdown.innerHTML = '<div class="search-drop-item" style="color:var(--text-muted);">No matches found</div>';
      dropdown.style.display = 'block';
      return;
    }

    dropdown.innerHTML = results.slice(0, 5).map(r => `
      <div class="search-drop-item" onclick="app.selectSearchResult('${r.name}')">
        <div>
          <span style="font-size:1.2rem; margin-right:6px;">${r.emoji}</span>
          <strong>${r.name}</strong>
          <small style="color:var(--text-dim); display:block;">₹${r.price} / ${r.unit} • ${r.category}</small>
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
  // Setup Event Listeners
  // ----------------------------------------------------
  function setupEventListeners() {
    // Search
    $('#search-input').addEventListener('input', (e) => handleSearchInput(e.target.value));
    $('#search-clear').addEventListener('click', () => {
      $('#search-input').value = '';
      handleSearchInput('');
    });

    // Modals
    $('#cart-btn').addEventListener('click', openCart);
    $('#cart-close').addEventListener('click', closeCart);
    $('#cart-overlay').addEventListener('click', closeCart);
    $('#checkout-btn').addEventListener('click', openCheckout);
    $('#checkout-close').addEventListener('click', closeCheckout);
    $('#clear-cart-btn').addEventListener('click', clearCart);
    $('#auth-close').addEventListener('click', closeAuthModal);
    $('#hero-shop-btn').addEventListener('click', () => $('#catalog-section').scrollIntoView({ behavior: 'smooth' }));

    $('#login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      handleLogin($('#login-email').value, $('#login-password').value);
    });

    $('#register-form').addEventListener('submit', (e) => {
      e.preventDefault();
      handleRegister($('#reg-name').value, $('#reg-email').value, $('#reg-password').value);
    });

    $('#tab-login').addEventListener('click', () => switchAuthTab('login'));
    $('#tab-register').addEventListener('click', () => switchAuthTab('register'));
    $('#checkout-form').addEventListener('submit', handleCheckout);

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
    $('#eco-bag-toggle').addEventListener('change', (e) => {
      state.isEcoBag = e.target.checked;
      updateCheckoutTotal();
    });

    // Coupon Code
    $('#apply-coupon-btn').addEventListener('click', () => {
      const code = ($('#coupon-code-input').value || '').trim().toUpperCase();
      const msg = $('#coupon-msg');
      if (code === 'INSTA50' || code === 'CASH50') {
        state.appliedCoupon = { code, discount: 50 };
        msg.style.color = 'var(--green-400)';
        msg.textContent = `✅ Coupon ${code} applied! Saved ₹50.`;
        updateCheckoutTotal();
        updateCartUI();
      } else if (code === 'FRESHFREE') {
        state.appliedCoupon = { code, discount: 49 };
        msg.style.color = 'var(--green-400)';
        msg.textContent = `✅ Free delivery coupon applied!`;
        updateCheckoutTotal();
        updateCartUI();
      } else {
        msg.style.color = '#ef4444';
        msg.textContent = '❌ Invalid coupon code.';
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
    $('#sort-select').addEventListener('change', (e) => {
      state.currentSort = e.target.value;
      loadProducts();
    });

    // Location Picker
    $('#location-picker-btn').addEventListener('click', () => $('#location-modal-overlay').style.display = 'flex');
    $('#location-close').addEventListener('click', () => $('#location-modal-overlay').style.display = 'none');

    // Language & Theme
    $('#lang-toggle-btn').addEventListener('click', toggleLanguage);
    $('#theme-toggle-btn').addEventListener('click', toggleTheme);

    // Subscriptions
    $('#pantry-sub-btn').addEventListener('click', openPantryModal);
    $('#pantry-close').addEventListener('click', () => $('#pantry-modal-overlay').style.display = 'none');

    // Action buttons in Confirmation
    $('#open-tracking-modal-btn').addEventListener('click', openTrackingModal);
    $('#tracking-close').addEventListener('click', () => $('#tracking-modal-overlay').style.display = 'none');
    $('#open-invoice-modal-btn').addEventListener('click', openInvoiceModal);
    $('#invoice-close').addEventListener('click', () => $('#invoice-modal-overlay').style.display = 'none');
    $('#continue-shopping-btn').addEventListener('click', () => $('#confirmation-overlay').style.display = 'none');
    $('#product-detail-close').addEventListener('click', () => $('#product-detail-overlay').style.display = 'none');

    // Demo Login
    $('#demo-login-btn').addEventListener('click', () => handleLogin('customer@freshcart.com', 'customer123'));

    // Visual Modal
    $('#visual-search-btn').addEventListener('click', () => $('#visual-modal-overlay').style.display = 'flex');
    $('#visual-close').addEventListener('click', () => $('#visual-modal-overlay').style.display = 'none');

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

    if (!walletBtn) return;

    walletBtn.onclick = async () => {
      await refreshWalletUI();
      walletModal.style.display = 'flex';
    };

    walletClose.onclick = () => { walletModal.style.display = 'none'; };

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

  async function refreshWalletUI() {
    try {
      const res = await api('/api/wallet/balance');
      const data = res.data;
      if ($('#header-wallet-val')) $('#header-wallet-val').textContent = `₹${Math.round(data.balance)} Wallet`;
      if ($('#wallet-modal-balance')) $('#wallet-modal-balance').textContent = `₹${data.balance.toFixed(2)}`;
      
      const txList = $('#wallet-tx-list');
      if (txList && data.transactions) {
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

    if (!nutriBtn) return;

    nutriBtn.onclick = async () => {
      nutriModal.style.display = 'flex';
      const items = state.cart.items.length > 0 ? state.cart.items : state.products.slice(0, 3).map(p => ({ productId: p.id, quantity: 1 }));
      try {
        const res = await api('/api/nutrition/analyze', {
          method: 'POST',
          body: JSON.stringify({ items, allergies: ['lactose'] })
        });
        const data = res.data;

        $('#nutri-grade-val').textContent = data.nutriScore;
        $('#nutri-grade-val').style.color = data.badgeColor;
        $('#nutri-rating-val').textContent = `Health Score: ${data.healthRating}/100`;

        $('#nutri-cal-val').textContent = `${data.totals.calories} kcal`;
        $('#nutri-prot-val').textContent = `${data.totals.protein}g`;
        $('#nutri-fib-val').textContent = `${data.totals.fiber}g`;
        $('#nutri-carb-val').textContent = `${data.totals.carbs}g`;

        const alertsBox = $('#allergen-alerts-box');
        if (data.allergenWarnings && data.allergenWarnings.length > 0) {
          alertsBox.innerHTML = `
            <div style="background:rgba(239,68,68,0.1); border:1px solid #ef4444; padding:10px; border-radius:var(--radius-sm); font-size:0.82rem; color:#f87171;">
              ${data.allergenWarnings.map(w => `<div>${w}</div>`).join('')}
            </div>
          `;
        } else {
          alertsBox.innerHTML = '<div style="color:var(--green-400); font-size:0.82rem;">✅ Zero Allergen Conflicts Detected in Current Basket</div>';
        }

        const subsBox = $('#smart-subs-box');
        if (data.smartSubstitutions && data.smartSubstitutions.length > 0) {
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

    nutriClose.onclick = () => { nutriModal.style.display = 'none'; };
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

    if (!groupBtn) return;

    groupBtn.onclick = async () => {
      await refreshGroupLobbiesUI();
      groupModal.style.display = 'flex';
    };

    groupClose.onclick = () => { groupModal.style.display = 'none'; };

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

    if (!fridgeBtn || !fridgeModal) return;

    fridgeBtn.onclick = () => {
      fridgeModal.style.display = 'flex';
      runFridgeScan('breakfast_depleted');
    };

    fridgeClose.onclick = () => { fridgeModal.style.display = 'none'; };

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
        fridgeModal.style.display = 'none';
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
  // Interactive Razorpay & UPI Payment Gateway
  // ----------------------------------------------------
  let pendingOrderPayload = null;

  function setupPaymentGateway() {
    const pgModal = $('#payment-gateway-overlay');
    const pgClose = $('#payment-gateway-close');
    const tabUpi = $('#pg-tab-upi');
    const tabCard = $('#pg-tab-card');
    const tabApps = $('#pg-tab-apps');
    const submitBtn = $('#pg-submit-pay-btn');

    if (!pgModal) return;

    pgClose.onclick = () => { pgModal.style.display = 'none'; };

    // Tabs Switcher
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

    if (submitBtn) {
      submitBtn.onclick = async () => {
        await executeGatewayPayment();
      };
    }
  }

  function openPaymentGateway(orderPayload, finalAmount) {
    pendingOrderPayload = orderPayload;
    const pgModal = $('#payment-gateway-overlay');
    $('#pg-payable-total').textContent = `₹${finalAmount.toFixed(2)}`;
    $('#pg-btn-amount').textContent = `${finalAmount.toFixed(2)}`;
    $('#pg-order-ref').textContent = 'ORD-' + Math.random().toString(36).substring(2, 7).toUpperCase();

    drawUPIQRCode(finalAmount);
    pgModal.style.display = 'flex';
  }

  function drawUPIQRCode(amount) {
    const canvas = $('#pg-upi-qr-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stylized QR matrix pattern
    ctx.fillStyle = '#10b981';
    // Corner Position Detectors
    function drawQRMarker(x, y) {
      ctx.fillStyle = '#10b981';
      ctx.fillRect(x, y, 36, 36);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x + 6, y + 6, 24, 24);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(x + 10, y + 10, 16, 16);
    }

    drawQRMarker(12, 12);
    drawQRMarker(canvas.width - 48, 12);
    drawQRMarker(12, canvas.height - 48);

    // Dynamic pseudorandom bits based on amount
    const seed = Math.round(amount * 100);
    for (let i = 0; i < 14; i++) {
      for (let j = 0; j < 14; j++) {
        if ((i < 4 && j < 4) || (i > 9 && j < 4) || (i < 4 && j > 9)) continue;
        if ((i * 7 + j * 13 + seed) % 3 === 0) {
          ctx.fillRect(16 + i * 9, 16 + j * 9, 7, 7);
        }
      }
    }
  }

  async function executeGatewayPayment() {
    const submitBtn = $('#pg-submit-pay-btn');
    if (!submitBtn || !pendingOrderPayload) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '🔒 Verifying 256-Bit SSL Bank Token...';

    setTimeout(async () => {
      try {
        const res = await api('/api/orders', {
          method: 'POST',
          body: JSON.stringify(pendingOrderPayload)
        });

        $('#payment-gateway-overlay').style.display = 'none';
        submitBtn.disabled = false;
        submitBtn.innerHTML = '🔒 Authorize & Complete Payment';

        state.lastPlacedOrder = res.data;
        state.coins += 50;
        if ($('#header-coins-val')) $('#header-coins-val').textContent = `${state.coins} Coins`;

        showToast('🎉 Payment Authorized! Order placed successfully.');
        showOrderConfirmation(res.data);
        loadCart();
        refreshWalletUI();
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '🔒 Authorize & Complete Payment';
      }
    }, 700);
  }

  // Expose global methods
  window.app = {
    addToCart,
    updateCartQty,
    selectSearchResult,
    addBundleToCart,
    openProductDetail,
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
                <div>
                  <span style="font-size:1.2rem;">${item.emoji}</span>
                  <strong>${item.name}</strong>
                  <small style="color:var(--text-dim); display:block;">₹${item.price} • Lift: ${item.lift}x (${item.confidence}% confidence)</small>
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

  // Boot Application
  async function init() {
    setupPWA();
    setupEventListeners();
    setupVoiceSearch();
    setupSpinWheel();
    setupScratchCard();
    setupFreshBot();
    setupWallet();
    setupNutritionAdvisor();
    setupGroupOrders();
    setupSmartFridgeScanner();
    setupPaymentGateway();
    await checkAuth();
    await Promise.all([
      loadProducts(),
      loadRecommendations(),
      loadCart(),
      refreshWalletUI()
    ]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

