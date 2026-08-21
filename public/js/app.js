/**
 * FreshCart AI — Frontend Application Logic
 * Integrates:
 * - JWT Auth State Management
 * - AI Hybrid Personalized Recommendations
 * - NLP TF-IDF Smart Search
 * - Apriori "Frequently Bought Together" Modals
 * - Smart Cart Add-ons
 * - INR E-Commerce Flow (Cart, Checkout, Orders)
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
    currentSort: 'rating',
    searchQuery: '',
    searchTimeout: null
  };

  // Save session ID
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
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
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
        <div class="product-emoji">${p.emoji}</div>
        <div class="product-info">
          <div class="product-category">${p.category}</div>
          <div class="product-name">${p.name}</div>
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

    if (state.products.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted); font-size:1.1rem;">No products found matching your filter.</div>';
      return;
    }

    grid.innerHTML = state.products.map(p => `
      <div class="product-card">
        <div class="product-emoji">${p.emoji}</div>
        <div class="product-info">
          <div class="product-category">${p.category}</div>
          <div class="product-name">${p.name}</div>
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
  // Smart NLP Search
  // ----------------------------------------------------

  function handleSearchInput(query) {
    const clearBtn = $('#search-clear');
    const dropdown = $('#smart-search-dropdown');

    if (query.trim()) {
      clearBtn.style.display = 'block';
    } else {
      clearBtn.style.display = 'none';
      dropdown.style.display = 'none';
      state.searchQuery = '';
      loadProducts();
      return;
    }

    clearTimeout(state.searchTimeout);
    state.searchTimeout = setTimeout(async () => {
      try {
        const res = await api(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.data.length > 0) {
          dropdown.innerHTML = res.data.map(item => `
            <div class="search-result-item" onclick="app.selectSearchResult('${item.product.id}', '${item.product.name}')">
              <div class="search-item-left">
                <span class="search-item-emoji">${item.product.emoji}</span>
                <div>
                  <div class="search-item-name">${item.product.name}</div>
                  <small style="color:var(--text-muted);">₹${item.product.price} / ${item.product.unit}</small>
                </div>
              </div>
              <span class="search-item-score">${item.matchConfidence} Relevance</span>
            </div>
          `).join('');
          dropdown.style.display = 'block';
        } else {
          dropdown.innerHTML = '<div style="padding:10px; color:var(--text-muted); font-size:0.85rem;">No exact semantic matches found.</div>';
          dropdown.style.display = 'block';
        }
      } catch (e) {}
    }, 200);
  }

  function selectSearchResult(productId, productName) {
    $('#smart-search-dropdown').style.display = 'none';
    $('#search-input').value = productName;
    state.searchQuery = productName;
    loadProducts();
  }

  // ----------------------------------------------------
  // Frequently Bought Together Modal (Apriori Mining)
  // ----------------------------------------------------

  async function openFBTModal(productId) {
    try {
      const [targetProd, fbtRes] = await Promise.all([
        api(`/api/products/${productId}`),
        api(`/api/recommendations/frequently-bought/${productId}`)
      ]);

      const container = $('#fbt-content');
      const target = targetProd.data;
      const fbtItems = fbtRes.data;

      container.innerHTML = `
        <div style="display:flex; align-items:center; gap:16px; margin-bottom:20px; padding:14px; background:rgba(255,255,255,0.05); border-radius:var(--radius-md);">
          <span style="font-size:2.5rem;">${target.emoji}</span>
          <div>
            <h4>${target.name}</h4>
            <div style="color:var(--green-400); font-weight:700;">₹${target.price}</div>
          </div>
        </div>

        <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:14px;">
          Customers who bought <strong>${target.name}</strong> also frequently purchased:
        </p>

        <div style="display:flex; flex-direction:column; gap:12px;">
          ${fbtItems.map(item => `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:12px; background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-sm);">
              <div style="display:flex; align-items:center; gap:12px;">
                <span style="font-size:1.8rem;">${item.emoji}</span>
                <div>
                  <div style="font-weight:600;">${item.name}</div>
                  <div style="color:var(--text-muted); font-size:0.8rem;">₹${item.price} • Lift: ${item.lift}x (${item.confidence} confidence)</div>
                </div>
              </div>
              <button class="btn-add-cart" onclick="app.addToCart('${item.id}'); app.closeFBTModal();">+ Add Both</button>
            </div>
          `).join('')}
        </div>
      `;

      $('#fbt-overlay').style.display = 'flex';
    } catch (e) {}
  }

  function closeFBTModal() {
    $('#fbt-overlay').style.display = 'none';
  }

  // ----------------------------------------------------
  // Cart Management
  // ----------------------------------------------------

  async function loadCart() {
    try {
      const res = await api('/api/cart');
      state.cart = res.data;
      updateCartUI();
      loadCartSuggestions();
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
      showToast(res.message || 'Added to cart!');
      loadCartSuggestions();
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
      loadCartSuggestions();
    } catch (e) {}
  }

  async function clearCart() {
    try {
      const res = await api('/api/cart/clear', { method: 'DELETE' });
      state.cart = res.data;
      updateCartUI();
      showToast('Cart cleared');
      loadCartSuggestions();
    } catch (e) {}
  }

  async function loadCartSuggestions() {
    const addonsBox = $('#smart-cart-addons');
    const addonsContainer = $('#addon-items');
    if (!state.cart.items || state.cart.items.length === 0) {
      addonsBox.style.display = 'none';
      return;
    }

    try {
      const productIds = state.cart.items.map(i => i.productId);
      const res = await api('/api/recommendations/cart-suggestions', {
        method: 'POST',
        body: JSON.stringify({ productIds })
      });

      if (res.data.length > 0) {
        addonsContainer.innerHTML = res.data.map(item => `
          <div class="addon-card">
            <span>${item.emoji}</span>
            <div>
              <div style="font-weight:600;">${item.name}</div>
              <div style="color:var(--green-400);">₹${item.price}</div>
            </div>
            <button class="btn-add-cart" style="padding:4px 8px; font-size:0.75rem;" onclick="app.addToCart('${item.id}')">+</button>
          </div>
        `).join('');
        addonsBox.style.display = 'block';
      } else {
        addonsBox.style.display = 'none';
      }
    } catch (e) {}
  }

  function updateCartUI() {
    $('#cart-badge').textContent = state.cart.itemCount || 0;

    // Delivery progress
    const subtotal = state.cart.subtotal || 0;
    const threshold = state.cart.freeDeliveryThreshold || 500;
    const pct = Math.min(100, Math.round((subtotal / threshold) * 100));

    $('#delivery-progress').style.width = pct + '%';
    if (subtotal >= threshold) {
      $('#delivery-text').textContent = '🎉 You unlocked Free Delivery!';
      $('#cart-delivery').textContent = 'FREE';
    } else {
      const rem = Math.round((threshold - subtotal) * 100) / 100;
      $('#delivery-text').textContent = `Add ₹${rem} more for Free Delivery!`;
      $('#cart-delivery').textContent = `₹${state.cart.deliveryFee.toFixed(2)}`;
    }

    $('#cart-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    $('#cart-tax').textContent = `₹${(state.cart.tax || 0).toFixed(2)}`;
    $('#cart-total').textContent = `₹${(state.cart.total || 0).toFixed(2)}`;

    updateCartNutrition();

    // Items list
    const container = $('#cart-items');
    if (!state.cart.items || state.cart.items.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:40px 20px; color:var(--text-muted);">
          <div style="font-size:3rem; margin-bottom:10px;">🛒</div>
          <p>Your shopping cart is empty.</p>
        </div>
      `;
      $('#checkout-btn').disabled = true;
      $('#checkout-btn').style.opacity = '0.5';
      return;
    }

    $('#checkout-btn').disabled = false;
    $('#checkout-btn').style.opacity = '1';

    container.innerHTML = state.cart.items.map(item => `
      <div class="cart-item">
        <div class="cart-item-left">
          <span class="cart-item-emoji">${item.emoji}</span>
          <div>
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">₹${item.price} / ${item.unit}</div>
          </div>
        </div>
        <div class="qty-controls">
          <button class="qty-btn" onclick="app.updateCartQty('${item.productId}', ${item.quantity - 1})">−</button>
          <span>${item.quantity}</span>
          <button class="qty-btn" onclick="app.updateCartQty('${item.productId}', ${item.quantity + 1})">+</button>
        </div>
      </div>
    `).join('');
  }

  function openCart() {
    $('#cart-sidebar').classList.add('open');
    $('#cart-overlay').style.display = 'block';
  }

  function closeCart() {
    $('#cart-sidebar').classList.remove('open');
    $('#cart-overlay').style.display = 'none';
  }

  // ----------------------------------------------------
  // Checkout & Order Placement
  // ----------------------------------------------------

  function openCheckout() {
    closeCart();
    $('#checkout-total-val').textContent = `₹${(state.cart.total || 0).toFixed(2)}`;
    if (state.user) {
      $('#cust-name').value = state.user.name;
    }
    $('#checkout-overlay').style.display = 'flex';
  }

  function closeCheckout() {
    $('#checkout-overlay').style.display = 'none';
  }

  async function handlePlaceOrder(e) {
    e.preventDefault();
    const customerName = $('#cust-name').value;
    const address = $('#cust-address').value;
    const phone = $('#cust-phone').value;
    const paymentMethod = $('#cust-payment').value;

    try {
      const res = await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ customerName, address, phone, paymentMethod })
      });

      closeCheckout();
      showOrderConfirmation(res.data);
      loadCart();
      loadRecommendations(); // refresh AI recommendations after purchase!
    } catch (e) {}
  }

  function showOrderConfirmation(order) {
    $('#confirmed-order-id').textContent = order.id;
    $('#confirmed-items-list').innerHTML = `
      <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); margin-top:14px; text-align:left;">
        <div style="font-weight:700; margin-bottom:8px;">Deliver to: ${order.customerName} (${order.phone})</div>
        <div style="color:var(--text-muted); font-size:0.85rem; margin-bottom:12px;">📍 ${order.address}</div>
        <div style="border-top:1px solid var(--border-subtle); padding-top:10px; display:flex; justify-content:space-between; font-weight:700; color:var(--green-400);">
          <span>Total Amount Paid</span>
          <span>₹${order.total.toFixed(2)}</span>
        </div>
      </div>
    `;
    $('#confirmation-overlay').style.display = 'flex';
  }

  // ----------------------------------------------------
  // Orders History
  // ----------------------------------------------------

  async function openOrders() {
    try {
      const res = await api('/api/orders');
      const container = $('#orders-list');

      if (!res.data || res.data.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:30px;">No past orders found.</p>';
      } else {
        container.innerHTML = res.data.map(o => `
          <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:16px; margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <div>
                <span style="font-weight:700; color:var(--green-400);">${o.id}</span>
                <small style="color:var(--text-muted); margin-left:10px;">${new Date(o.created_at || o.createdAt).toLocaleDateString()}</small>
              </div>
              <span style="background:rgba(16,185,129,0.15); color:var(--green-400); font-size:0.75rem; font-weight:700; padding:2px 8px; border-radius:10px;">${o.status.toUpperCase()}</span>
            </div>
            <div style="color:var(--text-muted); font-size:0.85rem; margin-bottom:10px;">
              ${(o.items || []).map(i => `${i.emoji || ''} ${i.name} × ${i.quantity}`).join(', ')}
            </div>
            <div style="font-weight:700; font-size:1.05rem;">Total: ₹${o.total}</div>
          </div>
        `).join('');
      }

      $('#orders-overlay').style.display = 'flex';
    } catch (e) {}
  }

  // ----------------------------------------------------
  // Setup Event Listeners & Initialize
  // ----------------------------------------------------

  function setupEventListeners() {
    // Search
    $('#search-input').addEventListener('input', (e) => handleSearchInput(e.target.value));
    $('#search-clear').addEventListener('click', () => {
      $('#search-input').value = '';
      handleSearchInput('');
    });

    // Cart Sidebar
    $('#cart-btn').addEventListener('click', openCart);
    $('#cart-close').addEventListener('click', closeCart);
    $('#cart-overlay').addEventListener('click', closeCart);
    $('#clear-cart-btn').addEventListener('click', clearCart);

    // Checkout
    $('#checkout-btn').addEventListener('click', openCheckout);
    $('#checkout-close').addEventListener('click', closeCheckout);
    $('#checkout-form').addEventListener('submit', handlePlaceOrder);

    // Modals Close
    $('#fbt-close').addEventListener('click', closeFBTModal);
    $('#continue-shopping-btn').addEventListener('click', () => {
      $('#confirmation-overlay').style.display = 'none';
    });
    $('#orders-btn').addEventListener('click', openOrders);
    $('#orders-close').addEventListener('click', () => {
      $('#orders-overlay').style.display = 'none';
    });

    // Auth
    $('#auth-close').addEventListener('click', closeAuthModal);
    $('#tab-login').addEventListener('click', () => switchAuthTab('login'));
    $('#tab-register').addEventListener('click', () => switchAuthTab('register'));

    $('#login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      handleLogin($('#login-email').value, $('#login-password').value);
    });

    $('#register-form').addEventListener('submit', (e) => {
      e.preventDefault();
      handleRegister($('#reg-name').value, $('#reg-email').value, $('#reg-password').value);
    });

    // Hero buttons
    $('#hero-shop-btn').addEventListener('click', () => {
      $('#catalog-section').scrollIntoView({ behavior: 'smooth' });
    });

    $('#demo-login-btn').addEventListener('click', () => {
      handleLogin('customer@freshcart.com', 'customer123');
    });

    // Category pills
    $$('.cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        $$('.cat-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.currentCategory = pill.dataset.category;
        loadProducts();
      });
    });

    // Sort select
    $('#sort-select').addEventListener('change', (e) => {
      state.currentSort = e.target.value;
      loadProducts();
    });

    // Visual Search
    const visualBtn = $('#visual-search-btn');
    const visualModal = $('#visual-modal-overlay');
    const visualClose = $('#visual-close');

    if (visualBtn) {
      visualBtn.addEventListener('click', () => {
        visualModal.style.display = 'flex';
      });
    }

    if (visualClose) {
      visualClose.addEventListener('click', () => {
        visualModal.style.display = 'none';
      });
    }

    $$('.visual-sample-card').forEach(card => {
      card.addEventListener('click', async () => {
        const hint = card.dataset.hint;
        const resBox = $('#visual-results-box');
        const list = $('#visual-matches-list');

        try {
          const res = await api('/api/visual/search', {
            method: 'POST',
            body: JSON.stringify({ queryHint: hint })
          });

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

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeCart();
        closeCheckout();
        closeFBTModal();
        closeAuthModal();
        $('#orders-overlay').style.display = 'none';
        $('#confirmation-overlay').style.display = 'none';
      }
    });
  }

  // ----------------------------------------------------
  // FreshBot Conversational AI Assistant
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

    // Quick chips
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

    // 1. Append User Message
    const userMsg = document.createElement('div');
    userMsg.className = 'bot-msg';
    userMsg.innerHTML = `<div class="msg-bubble user">${userText}</div>`;
    container.appendChild(userMsg);
    container.scrollTop = container.scrollHeight;

    // 2. Loading placeholder
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
      } else if (data.type === 'search' && data.products) {
        botMsg.innerHTML = `
          <div class="msg-bubble bot">
            <p>${data.reply}</p>
            <div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
              ${data.products.map(p => `
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2); padding:6px 10px; border-radius:6px;">
                  <span>${p.emoji} ${p.name} (₹${p.price})</span>
                  <button class="btn-add-cart" style="padding:3px 8px; font-size:0.75rem;" onclick="app.addToCart('${p.id}')">+ Add</button>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } else {
        botMsg.innerHTML = `<div class="msg-bubble bot">${data.reply}</div>`;
      }

      container.appendChild(botMsg);
      container.scrollTop = container.scrollHeight;
    } catch (e) {
      botLoading.innerHTML = `<div class="msg-bubble bot" style="color:var(--red-400);">Sorry, I had trouble processing that. Please try again!</div>`;
    }
  }

  async function addBundleToCart(items) {
    for (const item of items) {
      await addToCart(item.id, item.quantity);
    }
    openCart();
    showToast(`Added ${items.length} recipe ingredients to your cart!`);
  }

  // ----------------------------------------------------
  // Live Cart Nutrition Macro Calculator
  // ----------------------------------------------------

  function updateCartNutrition() {
    const card = $('#cart-nutrition-card');
    if (!state.cart.items || state.cart.items.length === 0) {
      card.style.display = 'none';
      return;
    }

    // Macro estimation multipliers per unit
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
      else if (name.includes('nuts')) { protein += 15 * qty; calories += 320 * qty; }
      else { calories += 100 * qty; fiber += 1 * qty; protein += 2 * qty; }
    }

    $('#macro-protein').textContent = protein + 'g';
    $('#macro-fiber').textContent = fiber + 'g';
    $('#macro-calories').textContent = calories + ' kcal';

  // Expose methods to global app namespace for inline onclick handlers
  window.app = {
    addToCart,
    updateCartQty,
    openFBTModal,
    closeFBTModal,
    selectSearchResult,
    addBundleToCart
  };

  // Boot Application
  async function init() {
    setupEventListeners();
    setupFreshBot();
    await checkAuth();
    await Promise.all([
      loadProducts(),
      loadRecommendations(),
      loadCart()
    ]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
