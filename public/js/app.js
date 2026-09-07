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
    language: localStorage.getItem('freshcart_lang') || 'en',
    theme: localStorage.getItem('freshcart_theme') || 'dark',
    accent: localStorage.getItem('freshcart_accent') || 'emerald',
    notifications: safeJsonParse(localStorage.getItem('freshcart_notifs'), [
      {
        id: 'notif-1',
        category: 'deals',
        icon: '🎁',
        title: 'Thompson Sampling Flash Deal',
        message: '10-Minute Free Express Delivery unlocked via Bayesian exploration!',
        time: 'Just now',
        unread: true,
        action: { text: 'Claim Deal', target: '#bandit-storefront-banner' }
      },
      {
        id: 'notif-2',
        category: 'orders',
        icon: '🛵',
        title: 'Superfast Delivery Active',
        message: 'Indiranagar Dark Store Hub #04 is delivering at 9.4 mins average ETA.',
        time: '14m ago',
        unread: true,
        action: { text: 'View Status', target: '#view-nav-orders' }
      },
      {
        id: 'notif-3',
        category: 'fridge',
        icon: '🥛',
        title: 'Smart Fridge Low Stock Alert',
        message: 'Milk & Eggs are flagged low in your crisper drawer. 1-click reorder ready.',
        time: '1h ago',
        unread: true,
        action: { text: 'Snap Fridge', target: '#fridge-scan-btn' }
      },
      {
        id: 'notif-4',
        category: 'deals',
        icon: '⚡',
        title: 'SASRec Transformer Next-Pick',
        message: 'Self-attention basket predictions updated for your browsing trajectory.',
        time: '3h ago',
        unread: false,
        action: { text: 'See Tray', target: '#sasrec-tray-section' }
      }
    ]),
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
    compareFamily: localStorage.getItem('freshcart_compare_family') || null,
    selectedProductIds: new Set(),
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
      const contentType = res.headers.get('content-type') || '';
      let data;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error(`API error (${res.status}): Server returned non-JSON response`);
        }
      }
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
  // 5-Language Internationalization (i18n) Dictionary
  // ----------------------------------------------------
  const DICT = {
    en: {
      searchPlaceholder: "Search fresh veggies, milk, fruits, snacks, atta, cold brew...",
      cart: "Cart",
      navStore: "Store",
      navOrders: "Orders",
      navAdmin: "Admin & AI",
      signIn: "Sign In",
      exploreProducts: "Explore Products ↓",
      recommended: "Recommended Just For You",
      allCategory: "🛒 All Items",
      freeDeliveryMsg: "Add ₹500 for Free Delivery!",
      addToCart: "+ Add",
      subtotal: "Item Subtotal",
      placeOrder: "Confirm & Place Order (₹)",
      flashDeals: "⚡ Flash Deals & Fresh Steals",
      combos: "Curated Smart Combos",
      notificationsTitle: "Notifications",
      markAllRead: "Mark Read",
      clearAll: "Clear",
      notifAll: "All",
      notifOrders: "🛵 Orders",
      notifDeals: "⚡ AI Deals",
      notifFridge: "🥛 Fridge",
      dayMode: "Day Mode",
      nightMode: "Night Mode",
      langName: "English"
    },
    hi: {
      searchPlaceholder: "ताज़ी सब्जियां, दूध, फल, स्नैक्स, आटा, कोल्ड ब्रू खोजें...",
      cart: "कार्ट",
      navStore: "स्टोर",
      navOrders: "आर्डर ट्रैकिंग",
      navAdmin: "एडमिन व एआई",
      signIn: "साइन इन",
      exploreProducts: "सामान देखें ↓",
      recommended: "खास आपके लिए अनुशंसित",
      allCategory: "🛒 सभी सामान",
      freeDeliveryMsg: "₹500 से अधिक पर मुफ़्त डिलीवरी!",
      addToCart: "+ जोड़ें",
      subtotal: "कुल राशि",
      placeOrder: "आर्डर कन्फर्म करें (₹)",
      flashDeals: "⚡ आज के विशेष डिस्काउंट",
      combos: "🍳 स्मार्ट मील कॉम्बो पैक",
      notificationsTitle: "सूचनाएं",
      markAllRead: "पढ़ा हुआ मार्क करें",
      clearAll: "साफ करें",
      notifAll: "सभी",
      notifOrders: "🛵 आर्डर्स",
      notifDeals: "⚡ एआई ऑफर्स",
      notifFridge: "🥛 फ्रिज अलर्ट",
      dayMode: "डे मोड (दिन)",
      nightMode: "नाइट मोड (रात)",
      langName: "हिन्दी"
    },
    es: {
      searchPlaceholder: "Buscar verduras frescas, leche, frutas, aperitivos, café...",
      cart: "Carrito",
      navStore: "Tienda",
      navOrders: "Pedidos",
      navAdmin: "Admin e IA",
      signIn: "Iniciar sesión",
      exploreProducts: "Explorar productos ↓",
      recommended: "Recomendado para ti",
      allCategory: "🛒 Todos los artículos",
      freeDeliveryMsg: "¡Entrega gratis en pedidos > ₹500!",
      addToCart: "+ Añadir",
      subtotal: "Subtotal",
      placeOrder: "Confirmar pedido (₹)",
      flashDeals: "⚡ Ofertas flash exclusivas",
      combos: "Combos inteligentes",
      notificationsTitle: "Notificaciones",
      markAllRead: "Marcar leídas",
      clearAll: "Borrar",
      notifAll: "Todo",
      notifOrders: "🛵 Pedidos",
      notifDeals: "⚡ Ofertas IA",
      notifFridge: "🥛 Nevera",
      dayMode: "Modo Día",
      nightMode: "Modo Noche",
      langName: "Español"
    },
    fr: {
      searchPlaceholder: "Rechercher légumes frais, lait, fruits, collations, café...",
      cart: "Panier",
      navStore: "Boutique",
      navOrders: "Commandes",
      navAdmin: "Admin & IA",
      signIn: "Connexion",
      exploreProducts: "Explorer les produits ↓",
      recommended: "Recommandé pour vous",
      allCategory: "🛒 Tous les articles",
      freeDeliveryMsg: "Livraison gratuite dès ₹500 !",
      addToCart: "+ Ajouter",
      subtotal: "Sous-total",
      placeOrder: "Confirmer la commande (₹)",
      flashDeals: "⚡ Ventes flash & réductions",
      combos: "Paniers intelligents",
      notificationsTitle: "Notifications",
      markAllRead: "Tout marquer lu",
      clearAll: "Effacer",
      notifAll: "Tous",
      notifOrders: "🛵 Commandes",
      notifDeals: "⚡ Offres IA",
      notifFridge: "🥛 Frigo",
      dayMode: "Mode Jour",
      nightMode: "Mode Nuit",
      langName: "Français"
    },
    de: {
      searchPlaceholder: "Frisches Gemüse, Milch, Obst, Snacks, Mehl suchen...",
      cart: "Warenkorb",
      navStore: "Shop",
      navOrders: "Bestellungen",
      navAdmin: "Admin & KI",
      signIn: "Anmelden",
      exploreProducts: "Produkte entdecken ↓",
      recommended: "Für Sie empfohlen",
      allCategory: "🛒 Alle Artikel",
      freeDeliveryMsg: "Kostenlose Lieferung ab ₹500!",
      addToCart: "+ Hinzufügen",
      subtotal: "Zwischensumme",
      placeOrder: "Bestellung aufgeben (₹)",
      flashDeals: "⚡ Blitzangebote & Frische-Deals",
      combos: "Smarte Menü-Kombis",
      notificationsTitle: "Benachrichtigungen",
      markAllRead: "Als gelesen markieren",
      clearAll: "Löschen",
      notifAll: "Alle",
      notifOrders: "🛵 Bestellungen",
      notifDeals: "⚡ KI-Deals",
      notifFridge: "🥛 Kühlschrank",
      dayMode: "Tagmodus",
      nightMode: "Nachtmodus",
      langName: "Deutsch"
    }
  };

  function getLanguageNativeName(code) {
    return DICT[code]?.langName || code.toUpperCase();
  }

  function applyTranslations(lang) {
    const dict = DICT[lang] || DICT.en;
    const searchInput = $('#search-input');
    if (searchInput) searchInput.placeholder = dict.searchPlaceholder;

    const langLabel = $('#lang-label');
    if (langLabel) langLabel.textContent = dict.langName;

    const themeText = $('#theme-text');
    if (themeText) {
      themeText.textContent = state.theme === 'light' ? dict.nightMode : dict.dayMode;
    }

    // Translate elements with data-i18n attributes
    $$('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });
  }

  function setLanguage(lang) {
    if (!DICT[lang]) lang = 'en';
    state.language = lang;
    localStorage.setItem('freshcart_lang', lang);

    $$('#lang-dropdown-menu .popover-item').forEach(btn => {
      if (btn.dataset.setLang === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const menu = $('#lang-dropdown-menu');
    if (menu) menu.classList.remove('open');

    applyTranslations(lang);
    showToast(`🌐 Language switched to ${getLanguageNativeName(lang)}`);
    renderProductsGrid();
    renderRecommendationsGrid();
  }

  function toggleLanguage() {
    const menu = $('#lang-dropdown-menu');
    if (menu) {
      menu.classList.toggle('open');
      const accentMenu = $('#accent-dropdown-menu');
      if (accentMenu) accentMenu.classList.remove('open');
      return;
    }
    // Fallback toggle between English and Hindi
    const nextLang = state.language === 'en' ? 'hi' : 'en';
    setLanguage(nextLang);
  }

  // ----------------------------------------------------
  // Theme & Accent Palette Management
  // ----------------------------------------------------
  function setTheme(theme) {
    state.theme = theme;
    localStorage.setItem('freshcart_theme', theme);
    const dict = DICT[state.language] || DICT.en;

    if (theme === 'light') {
      document.body.classList.add('light-theme');
      document.documentElement.setAttribute('data-theme', 'light');
      const icon = $('#theme-icon');
      if (icon) icon.textContent = '🌙';
      const text = $('#theme-text');
      if (text) text.textContent = dict.nightMode;
    } else {
      document.body.classList.remove('light-theme');
      document.documentElement.setAttribute('data-theme', 'dark');
      const icon = $('#theme-icon');
      if (icon) icon.textContent = '☀️';
      const text = $('#theme-text');
      if (text) text.textContent = dict.dayMode;
    }
  }

  function toggleTheme() {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    showToast(nextTheme === 'light' ? '☀️ Day Mode activated' : '🌙 Night Mode activated');
  }

  function setAccent(accent) {
    state.accent = accent;
    localStorage.setItem('freshcart_accent', accent);
    document.documentElement.setAttribute('data-accent', accent);
    document.body.setAttribute('data-accent', accent);

    $$('#accent-dropdown-menu .popover-item').forEach(btn => {
      if (btn.dataset.setAccent === accent) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const menu = $('#accent-dropdown-menu');
    if (menu) menu.classList.remove('open');

    showToast(`🎨 Color Accent: ${accent.charAt(0).toUpperCase() + accent.slice(1)}`);
  }

  function initThemeAndAccent() {
    setTheme(state.theme);
    setAccent(state.accent);
    applyTranslations(state.language);
  }

  // ----------------------------------------------------
  // Real-Time Notification Center Management
  // ----------------------------------------------------
  function updateNotificationBadge() {
    const badge = $('#notification-badge');
    const tag = $('#notification-unread-tag');
    const unreadCount = (state.notifications || []).filter(n => n.unread).length;

    if (badge) {
      badge.textContent = unreadCount;
      badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
    if (tag) {
      tag.textContent = `${unreadCount} New`;
    }
  }

  function renderNotifications(filter = 'all') {
    const container = $('#notification-items-container');
    if (!container) return;

    let items = state.notifications || [];
    if (filter !== 'all') {
      items = items.filter(n => n.category === filter);
    }

    if (items.length === 0) {
      container.innerHTML = `
        <div class="notification-empty-state">
          <span class="notification-empty-icon">🎉</span>
          <p style="margin:0; font-weight:600; color:var(--text-main);">All Caught Up!</p>
          <small style="color:var(--text-dim);">No unread notifications in this filter.</small>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(n => `
      <div class="notification-item ${n.unread ? 'unread' : ''}" data-id="${n.id}">
        <div class="notification-icon-wrap">${n.icon || '🔔'}</div>
        <div class="notification-content">
          <div class="notification-title-row">
            <span class="notification-title">${n.title}</span>
            <span class="notification-time">${n.time}</span>
          </div>
          <div class="notification-msg">${n.message}</div>
          ${n.action ? `<button class="notification-action-btn" data-action-target="${n.action.target || ''}">${n.action.text || 'View'}</button>` : ''}
        </div>
      </div>
    `).join('');

    // Wire item click to mark read and trigger action
    container.querySelectorAll('.notification-item').forEach(itemEl => {
      itemEl.addEventListener('click', (e) => {
        const notifId = itemEl.dataset.id;
        const notif = state.notifications.find(n => n.id === notifId);
        if (notif) {
          notif.unread = false;
          localStorage.setItem('freshcart_notifs', JSON.stringify(state.notifications));
          itemEl.classList.remove('unread');
          updateNotificationBadge();
        }

        const actionBtn = e.target.closest('.notification-action-btn');
        if (actionBtn && actionBtn.dataset.actionTarget) {
          const target = actionBtn.dataset.actionTarget;
          closeNotificationDrawer();
          if (target.startsWith('#')) {
            const el = document.querySelector(target);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              if (target === '#fridge-scan-btn') el.click();
            }
          }
        }
      });
    });
  }

  function openNotificationDrawer() {
    const overlay = $('#notification-overlay');
    const drawer = $('#notification-center-drawer');
    if (overlay) overlay.classList.add('open');
    if (drawer) drawer.classList.add('open');
    renderNotifications('all');
  }

  function closeNotificationDrawer() {
    const overlay = $('#notification-overlay');
    const drawer = $('#notification-center-drawer');
    if (overlay) overlay.classList.remove('open');
    if (drawer) drawer.classList.remove('open');
  }

  function markAllNotificationsRead() {
    (state.notifications || []).forEach(n => n.unread = false);
    localStorage.setItem('freshcart_notifs', JSON.stringify(state.notifications));
    updateNotificationBadge();
    renderNotifications();
    showToast('✅ All notifications marked as read');
  }

  function clearAllNotifications() {
    state.notifications = [];
    localStorage.setItem('freshcart_notifs', JSON.stringify([]));
    updateNotificationBadge();
    renderNotifications();
    showToast('Notifications cleared');
  }

  function addNotification(notif) {
    if (!state.notifications) state.notifications = [];
    state.notifications.unshift({
      id: 'notif-' + Date.now(),
      category: notif.category || 'deals',
      icon: notif.icon || '🔔',
      title: notif.title || 'Notification',
      message: notif.message || '',
      time: 'Just now',
      unread: true,
      action: notif.action || null
    });
    localStorage.setItem('freshcart_notifs', JSON.stringify(state.notifications));
    updateNotificationBadge();
    showToast(`🔔 ${notif.title}`);
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
  // 4-Tier Normalized Retail Taxonomy & Hierarchy Engine
  // ----------------------------------------------------
  const PRIMARY_DEPARTMENTS = [
    { id: 'all', name: 'All Catalog', emoji: '🌟' },
    { id: 'Grocery & Food', name: 'Grocery & Food', emoji: '🥦' },
    { id: 'Electronics', name: 'Electronics', emoji: '🎧' },
    { id: 'Pooja Essentials', name: 'Pooja Essentials', emoji: '🪔' },
    { id: 'Home & Personal Care', name: 'Home & Personal', emoji: '✨' }
  ];

  // Backward-compatible alias array for legacy test suites
  const DEPARTMENTS = [
    { id: 'all', name: 'All Departments', emoji: '🌟' },
    { id: 'Grocery & Food', name: 'Grocery & Food', emoji: '🥦', keywords: ['grocery', 'food', 'produce', 'dairy', 'staple', 'fruit', 'snack'] },
    { id: 'Electronics', name: 'Electronics', emoji: '🎧', keywords: ['electronic', 'earbud', 'headphone', 'watch', 'cable', 'charger', 'audio'] },
    { id: 'Pooja Essentials', name: 'Pooja Essentials', emoji: '🪔', keywords: ['pooja', 'puja', 'agarbatti', 'dhoop', 'diya', 'incense', 'camphor'] },
    { id: 'produce', name: 'Fruits & Veggies', emoji: '🍎', keywords: ['vegetable', 'fruit', 'herb', 'organic', 'greens'] },
    { id: 'dairy', name: 'Dairy & Bakery', emoji: '🥛', keywords: ['dairy', 'milk', 'cheese', 'butter', 'yogurt', 'paneer'] },
    { id: 'snacks', name: 'Snacks & Munchies', emoji: '🍿', keywords: ['snack', 'chips', 'biscuit', 'chocolate', 'namkeen'] },
    { id: 'beverages', name: 'Drinks & Juices', emoji: '🥤', keywords: ['drink', 'beverage', 'juice', 'tea', 'coffee', 'soda'] },
    { id: 'staples', name: 'Atta, Rice & Dals', emoji: '🌾', keywords: ['staple', 'atta', 'flour', 'rice', 'dal', 'pulse'] }
  ];

  function getCategoryDepartment(catId, catName) {
    const text = ((catId || '') + ' ' + (catName || '')).toLowerCase();
    for (const d of DEPARTMENTS) {
      if (d.keywords && d.keywords.some(k => text.includes(k))) {
        return d;
      }
    }
    return DEPARTMENTS[1]; // defaults to Grocery & Food
  }

  async function loadCategories() {
    try {
      const res = await api('/api/products/categories');
      if (res) {
        const tax = res.taxonomy || {};
        state.taxonomy = {
          departments: tax.departments || res.departments || [],
          subcategories: tax.subcategories || res.subcategories || [],
          productFamilies: tax.productFamilies || res.productFamilies || []
        };
        const raw = res.categories || res.data || [];
        state.categoriesList = raw.map(c => typeof c === 'string' ? {
          id: c,
          name: c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, ' '),
          emoji: '🛒',
          department: 'Grocery & Food',
          count: ''
        } : {
          id: c.id || c.category,
          name: c.name || (c.id ? c.id.charAt(0).toUpperCase() + c.id.slice(1).replace(/_/g, ' ') : 'Category'),
          emoji: c.emoji || '🛒',
          department: c.department || 'Grocery & Food',
          count: c.productCount || c.count || ''
        });
        renderCategorySelector();
      }
    } catch (e) {
      console.warn('Error loading categories:', e);
    }
  }

  // ============================================================
  // PHASE 5C — Category-Specific Dynamic Filters & Faceted Search
  // ============================================================

  // Initialize activeFilters state (cleared on scope change)
  function initActiveFilters() {
    if (!state.activeFilters) {
      state.activeFilters = {};
    }
  }

  // Fetch and render dynamic filter facets from the live DB for the current scope
  async function loadFilters() {
    initActiveFilters();
    const content = $('#facet-filter-content');
    if (content) content.innerHTML = '<div class="facet-loading">⏳ Loading filters…</div>';

    try {
      const params = new URLSearchParams();
      if (state.currentDepartment && state.currentDepartment !== 'all') params.set('department', state.currentDepartment);
      if (state.currentSubcategory && state.currentSubcategory !== 'all') params.set('subcategory', state.currentSubcategory);
      if (state.currentProductFamily && state.currentProductFamily !== 'all') params.set('product_family', state.currentProductFamily);
      if (state.currentCategory && state.currentCategory !== 'all') params.set('category', state.currentCategory);

      const res = await api(`/api/products/filters?${params.toString()}`, { useCache: false });
      if (res && res.filters) {
        state.currentFilterData = res.filters;
        state.filterScope = res.scope;
        renderFilterPanel(res.filters, res.scope);
      }
    } catch (e) {
      if (content) content.innerHTML = '<div class="facet-loading">Filters unavailable</div>';
      console.warn('Phase 5C: loadFilters error', e);
    }
  }

  // Render the filter panel HTML from live facet data
  function renderFilterPanel(filters, scope) {
    const content = $('#facet-filter-content');
    if (!content) return;
    const af = state.activeFilters || {};

    const sections = [];

    // 1. Price Range
    const pf = filters.price || { min: 0, max: 5000 };
    const curMin = af.min_price !== undefined ? af.min_price : '';
    const curMax = af.max_price !== undefined ? af.max_price : '';
    sections.push(`
      <div class="facet-section" id="facet-price-section">
        <div class="facet-section-title">
          <span>💰 Price Range</span>
          ${(af.min_price !== undefined || af.max_price !== undefined) ? `<span class="facet-section-clear" onclick="app.clearFacet('price')">Clear</span>` : ''}
        </div>
        <div class="price-range-wrap">
          <div class="price-range-display">
            <span>₹${pf.min.toLocaleString()}</span>
            <span>₹${pf.max.toLocaleString()}</span>
          </div>
          <div class="price-inputs-row">
            <input type="number" id="facet-price-min" class="price-input-field"
                   placeholder="Min ₹" min="${pf.min}" max="${pf.max}"
                   value="${curMin}"
                   onkeydown="if(event.key==='Enter') app.applyPriceRange()">
            <span style="color:var(--text-dim); font-size:0.8rem;">–</span>
            <input type="number" id="facet-price-max" class="price-input-field"
                   placeholder="Max ₹" min="${pf.min}" max="${pf.max}"
                   value="${curMax}"
                   onkeydown="if(event.key==='Enter') app.applyPriceRange()">
            <button class="price-apply-btn" onclick="app.applyPriceRange()">Go</button>
          </div>
        </div>
      </div>
    `);

    // 2. Rating
    if (filters.rating && filters.rating.length > 0) {
      const ratingItems = filters.rating.map(r => `
        <label class="facet-item">
          <input type="checkbox" ${af.min_rating === r.id ? 'checked' : ''}
                 onchange="app.applyFacetFilter('min_rating', '${r.id}', this.checked, '${r.label}')">
          <span class="facet-item-label">${r.label}</span>
          <span class="facet-item-count">${Number(r.count).toLocaleString()}</span>
        </label>
      `).join('');
      sections.push(`
        <div class="facet-section">
          <div class="facet-section-title">
            <span>⭐ Rating</span>
            ${af.min_rating ? `<span class="facet-section-clear" onclick="app.clearFacet('min_rating')">Clear</span>` : ''}
          </div>
          ${ratingItems}
        </div>
      `);
    }

    // 3. Nutrition Grade (Grocery only)
    if (filters.nutritionGrades && filters.nutritionGrades.length > 0) {
      const gradeColors = { A: '#10b981', B: '#34d399', C: '#fbbf24', D: '#f97316', E: '#ef4444' };
      const gradeItems = filters.nutritionGrades.map(g => `
        <label class="facet-item">
          <input type="checkbox" ${af.nutrition_grade === g.grade ? 'checked' : ''}
                 onchange="app.applyFacetFilter('nutrition_grade', '${g.grade}', this.checked, 'Grade ${g.grade}')">
          <span class="grade-dot grade-dot-${g.grade}"></span>
          <span class="facet-item-label">Nutri-Grade ${g.grade}</span>
          <span class="facet-item-count">${Number(g.cnt).toLocaleString()}</span>
        </label>
      `).join('');
      sections.push(`
        <div class="facet-section">
          <div class="facet-section-title">
            <span>🥗 Nutrition Grade</span>
            ${af.nutrition_grade ? `<span class="facet-section-clear" onclick="app.clearFacet('nutrition_grade')">Clear</span>` : ''}
          </div>
          ${gradeItems}
        </div>
      `);
    }

    // 4. Pack Size (Grocery only)
    if (filters.packSizes && filters.packSizes.length > 0) {
      const packItems = filters.packSizes.map(p => `
        <label class="facet-item">
          <input type="checkbox" ${af.pack_size === p.id ? 'checked' : ''}
                 onchange="app.applyFacetFilter('pack_size', '${escapeHtml(p.id)}', this.checked, '${escapeHtml(p.label)}')">
          <span class="facet-item-label">${escapeHtml(p.label)}</span>
          <span class="facet-item-count">${Number(p.count).toLocaleString()}</span>
        </label>
      `).join('');
      sections.push(`
        <div class="facet-section">
          <div class="facet-section-title">
            <span>📦 Pack Size</span>
            ${af.pack_size ? `<span class="facet-section-clear" onclick="app.clearFacet('pack_size')">Clear</span>` : ''}
          </div>
          ${packItems}
        </div>
      `);
    }

    // 5. Dietary Tags
    if (filters.dietary && filters.dietary.length > 0) {
      const dietItems = filters.dietary.map(d => `
        <label class="facet-item">
          <input type="checkbox" ${af.dietary_tag === d.id ? 'checked' : ''}
                 onchange="app.applyFacetFilter('dietary_tag', '${d.id}', this.checked, '${escapeHtml(d.label)}')">
          <span class="facet-item-label">${escapeHtml(d.label)}</span>
          <span class="facet-item-count">${Number(d.count).toLocaleString()}</span>
        </label>
      `).join('');
      sections.push(`
        <div class="facet-section">
          <div class="facet-section-title">
            <span>🌿 Dietary</span>
            ${af.dietary_tag ? `<span class="facet-section-clear" onclick="app.clearFacet('dietary_tag')">Clear</span>` : ''}
          </div>
          ${dietItems}
        </div>
      `);
    }

    // 6. Brand (top 15; only if we have real brands for this scope)
    if (filters.brands && filters.brands.length > 0) {
      const topBrands = filters.brands.slice(0, 15);
      const brandItems = topBrands.map(b => `
        <label class="facet-item">
          <input type="checkbox" ${af.brand === b.id ? 'checked' : ''}
                 onchange="app.applyFacetFilter('brand', ${JSON.stringify(b.id)}, this.checked, ${JSON.stringify(b.label)})">
          <span class="facet-item-label" title="${escapeHtml(b.label)}">${escapeHtml(b.label.length > 22 ? b.label.substring(0, 22) + '…' : b.label)}</span>
          <span class="facet-item-count">${Number(b.count).toLocaleString()}</span>
        </label>
      `).join('');
      sections.push(`
        <div class="facet-section">
          <div class="facet-section-title">
            <span>🏷️ Brand</span>
            ${af.brand ? `<span class="facet-section-clear" onclick="app.clearFacet('brand')">Clear</span>` : ''}
          </div>
          ${brandItems}
          ${filters.brands.length > 15 ? `<div style="font-size:0.75rem; color:var(--text-dim); text-align:center; margin-top:4px;">Showing top 15 of ${filters.brands.length} brands</div>` : ''}
        </div>
      `);
    }

    content.innerHTML = sections.join('');
  }

  // Apply a single facet filter (only one value per facet type at a time for simplicity)
  function applyFacetFilter(filterKey, value, isChecked, label) {
    initActiveFilters();
    if (isChecked) {
      state.activeFilters[filterKey] = value;
      state.activeFilterLabels = state.activeFilterLabels || {};
      state.activeFilterLabels[filterKey] = label;
    } else {
      delete state.activeFilters[filterKey];
      if (state.activeFilterLabels) delete state.activeFilterLabels[filterKey];
    }
    // Also sync to diet state for the dietary_tag filter
    if (filterKey === 'dietary_tag') {
      state.currentDiet = isChecked ? value : 'all';
      // keep diet-pill UI in sync
      document.querySelectorAll('.diet-pill').forEach(p => {
        const d = p.getAttribute('data-diet') || 'all';
        p.classList.toggle('active', d === state.currentDiet);
      });
    }
    invalidateApiCache('/api/products');
    loadProducts(1);
    // Re-render the panel to update clear buttons
    if (state.currentFilterData) {
      renderFilterPanel(state.currentFilterData, state.filterScope);
    }
  }

  // Remove a single facet filter by key
  function removeFacetFilter(filterKey) {
    initActiveFilters();
    if (filterKey === 'dietary_tag') state.currentDiet = 'all';
    if (filterKey === 'min_price') delete state.activeFilters.min_price;
    else if (filterKey === 'max_price') delete state.activeFilters.max_price;
    else if (filterKey === 'price') {
      delete state.activeFilters.min_price;
      delete state.activeFilters.max_price;
      if (state.activeFilterLabels) {
        delete state.activeFilterLabels.min_price;
        delete state.activeFilterLabels.max_price;
      }
    } else {
      delete state.activeFilters[filterKey];
    }
    if (state.activeFilterLabels) delete state.activeFilterLabels[filterKey];
    invalidateApiCache('/api/products');
    loadProducts(1);
    if (state.currentFilterData) renderFilterPanel(state.currentFilterData, state.filterScope);
  }

  // Clear a specific facet group (alias for panel clear buttons)
  function clearFacet(filterKey) {
    removeFacetFilter(filterKey);
  }

  // Clear all active facet filters
  function clearAllFilters() {
    state.activeFilters = {};
    state.activeFilterLabels = {};
    state.currentDiet = 'all';
    document.querySelectorAll('.diet-pill').forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-diet') === 'all');
    });
    invalidateApiCache('/api/products');
    loadProducts(1);
    if (state.currentFilterData) renderFilterPanel(state.currentFilterData, state.filterScope);
  }

  // Apply price range from the input fields
  function applyPriceRange() {
    initActiveFilters();
    const minEl = $('#facet-price-min');
    const maxEl = $('#facet-price-max');
    const minVal = minEl ? parseFloat(minEl.value) : NaN;
    const maxVal = maxEl ? parseFloat(maxEl.value) : NaN;

    if (!isNaN(minVal)) {
      state.activeFilters.min_price = minVal;
      state.activeFilterLabels = state.activeFilterLabels || {};
      state.activeFilterLabels.min_price = `₹${minVal}+`;
    } else {
      delete state.activeFilters.min_price;
    }
    if (!isNaN(maxVal)) {
      state.activeFilters.max_price = maxVal;
      state.activeFilterLabels = state.activeFilterLabels || {};
      state.activeFilterLabels.max_price = `≤₹${maxVal}`;
    } else {
      delete state.activeFilters.max_price;
    }
    invalidateApiCache('/api/products');
    loadProducts(1);
  }

  // Sync the active filter chips bar above the grid
  function updateActiveFilterChips() {
    const bar = $('#active-filters-bar');
    const chipsEl = $('#active-filter-chips');
    const badge = $('#active-filter-count-badge');
    const toggleBtn = $('#filter-toggle-btn');

    if (!bar || !chipsEl) return;

    const af = state.activeFilters || {};
    const labels = state.activeFilterLabels || {};

    // Build the set of active filter chips (exclude empty/null values)
    const chips = [];
    if (af.brand) chips.push({ key: 'brand', label: `Brand: ${labels.brand || af.brand}` });
    if (af.nutrition_grade) chips.push({ key: 'nutrition_grade', label: `Grade: ${labels.nutrition_grade || af.nutrition_grade}` });
    if (af.pack_size) chips.push({ key: 'pack_size', label: `Pack: ${labels.pack_size || af.pack_size}` });
    if (af.min_rating) chips.push({ key: 'min_rating', label: labels.min_rating || `${af.min_rating}+ Stars` });
    if (af.dietary_tag) chips.push({ key: 'dietary_tag', label: labels.dietary_tag || af.dietary_tag });
    if (af.min_price !== undefined) chips.push({ key: 'min_price', label: `₹${af.min_price}+` });
    if (af.max_price !== undefined) chips.push({ key: 'max_price', label: `≤₹${af.max_price}` });

    const count = chips.length;

    if (count > 0) {
      bar.style.display = 'flex';
      chipsEl.innerHTML = chips.map(c => `
        <span class="active-filter-chip">
          ${escapeHtml(c.label)}
          <button class="active-filter-chip-remove" onclick="app.removeFacetFilter('${c.key}')" aria-label="Remove ${escapeHtml(c.label)} filter">✕</button>
        </span>
      `).join('');
    } else {
      bar.style.display = 'none';
      chipsEl.innerHTML = '';
    }

    // Update filter badge count on toggle button
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
    if (toggleBtn) {
      toggleBtn.classList.toggle('filters-active', count > 0);
    }
  }

  // Update the result count label in the catalog toolbar
  function updateResultCount() {
    const el = $('#catalog-result-count');
    if (!el) return;
    if (state.totalProductsCount !== undefined) {
      el.textContent = `${Number(state.totalProductsCount).toLocaleString()} products`;
    }
  }

  // Toggle the filter sidebar panel (desktop: collapse/expand; mobile: drawer open/close)
  function toggleFilterPanel(forceState) {
    const sidebar = $('#facet-filter-sidebar');
    const backdrop = $('#filter-backdrop');
    const toggleBtn = $('#filter-toggle-btn');
    if (!sidebar) return;

    const isMobile = window.innerWidth <= 900;

    if (isMobile) {
      const isOpen = sidebar.classList.contains('sidebar-open');
      const open = forceState !== undefined ? forceState : !isOpen;
      sidebar.classList.toggle('sidebar-open', open);
      sidebar.classList.toggle('sidebar-collapsed', !open);
      if (backdrop) backdrop.classList.toggle('active', open);
      if (toggleBtn) toggleBtn.setAttribute('aria-expanded', String(open));
    } else {
      const isCollapsed = sidebar.classList.contains('sidebar-collapsed');
      const collapse = forceState !== undefined ? !forceState : !isCollapsed;
      sidebar.classList.toggle('sidebar-collapsed', collapse);
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-expanded', String(!collapse));
      }
    }

    // Load filters on first open
    if (!state.filtersLoaded) {
      state.filtersLoaded = true;
      loadFilters();
    }
  }

  function renderCategorySelector() {
    const container = $('#dynamic-category-bar');
    if (!container) return;

    state.currentDepartment = state.currentDepartment || 'all';
    state.currentSubcategory = state.currentSubcategory || 'all';
    state.currentProductFamily = state.currentProductFamily || 'all';

    const allDepts = (state.taxonomy && state.taxonomy.departments && state.taxonomy.departments.length > 0)
      ? state.taxonomy.departments
      : PRIMARY_DEPARTMENTS.filter(d => d.id !== 'all');
    const allSubcats = (state.taxonomy && state.taxonomy.subcategories) || [];
    const allFamilies = (state.taxonomy && state.taxonomy.productFamilies) || [];

    const totalCatalogCount = allDepts.reduce((sum, d) => sum + (d.productCount || 0), 0) || state.totalProductsCount || 97046;

    // Level 1: Departments List with All Catalog option
    const deptList = [
      { id: 'all', name: 'All Catalog', emoji: '🌟', productCount: totalCatalogCount },
      ...allDepts
    ];

    // Level 2: Subcategories dynamically filtered for active department
    const activeSubcats = (state.currentDepartment && state.currentDepartment !== 'all')
      ? allSubcats.filter(s => s.department === state.currentDepartment || s.category_id === state.currentDepartment)
      : [];

    // Level 3: Product Families dynamically filtered for active subcategory
    const activeFamilies = (state.currentSubcategory && state.currentSubcategory !== 'all')
      ? allFamilies.filter(f => f.subcategory === state.currentSubcategory || f.subcategory_id === state.currentSubcategory)
      : [];

    // Find current department & subcategory metadata
    const activeDeptObj = allDepts.find(d => d.id === state.currentDepartment);
    const activeSubcatObj = allSubcats.find(s => s.id === state.currentSubcategory);

    // Filter categories for the active department
    let visibleCats = state.categoriesList || [];
    if (state.currentDepartment !== 'all') {
      const deptMatch = state.currentDepartment.toLowerCase();
      visibleCats = (state.categoriesList || []).filter(c => {
        const text = (c.id + ' ' + c.name + ' ' + (c.department || '')).toLowerCase();
        return text.includes(deptMatch) || 
               (deptMatch.includes('grocery') && !text.includes('electronic') && !text.includes('pooja') && !text.includes('apparel') && !text.includes('fashion'));
      });
    }
    const topChips = visibleCats.slice(0, 12);

    container.innerHTML = `
      <!-- 4-Tier Normalized Retail Hierarchy Filter Rail -->
      <div class="hierarchy-filter-container">
        <!-- Level 1: Primary Department Selector -->
        <div>
          <div class="hierarchy-level-label"><span>🏛️ Department / Category Hierarchy</span></div>
          <div class="hierarchy-rail" role="tablist" aria-label="Department Hierarchy">
            ${deptList.map(d => `
              <button class="dept-pill ${state.currentDepartment === d.id ? 'active' : ''}" 
                      onclick="app.selectDepartment('${escapeHtml(d.id)}')"
                      role="tab"
                      aria-selected="${state.currentDepartment === d.id}">
                <span>${d.emoji || '🛒'}</span>
                <span>${escapeHtml(d.name)}</span>
                <span class="cat-count-badge">${d.productCount ? Number(d.productCount).toLocaleString() : ''}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Breadcrumbs Traversal (Progressive Navigation) -->
        <div class="taxonomy-breadcrumbs" role="navigation" aria-label="Category Breadcrumbs">
          <span class="crumb-link" onclick="app.selectDepartment('all')" title="View all departments">
            <span class="crumb-icon">🏠</span> Home
          </span>
          ${state.currentDepartment !== 'all' ? `
            <span class="crumb-sep">›</span>
            <span class="crumb-link ${state.currentSubcategory === 'all' && state.currentProductFamily === 'all' ? 'active-crumb' : ''}" 
                  onclick="app.selectDepartment('${escapeHtml(state.currentDepartment)}')"
                  title="Department: ${escapeHtml(state.currentDepartment)}">
              ${escapeHtml(state.currentDepartment)}
            </span>
          ` : ''}
          ${state.currentSubcategory !== 'all' ? `
            <span class="crumb-sep">›</span>
            <span class="crumb-link ${state.currentProductFamily === 'all' ? 'active-crumb' : ''}" 
                  onclick="app.selectSubcategory('${escapeHtml(state.currentSubcategory)}')"
                  title="Subcategory: ${escapeHtml(state.currentSubcategory)}">
              ${escapeHtml(state.currentSubcategory)}
            </span>
          ` : ''}
          ${state.currentProductFamily !== 'all' ? `
            <span class="crumb-sep">›</span>
            <span class="active-crumb" style="color:var(--text-main); font-weight:700;">
              ${escapeHtml(state.currentProductFamily)}
            </span>
          ` : ''}
        </div>

        ${activeSubcats.length > 0 ? `
          <!-- Level 2: Subcategory Rail -->
          <div>
            <div class="hierarchy-level-label"><span>📁 Subcategory in ${escapeHtml(state.currentDepartment)}</span></div>
            <div class="hierarchy-rail" role="tablist" aria-label="Subcategory Hierarchy">
              <button class="subcat-pill ${state.currentSubcategory === 'all' ? 'active' : ''}" 
                      onclick="app.selectSubcategory('all')">
                <span>⚡ All ${escapeHtml(state.currentDepartment)}</span>
                ${activeDeptObj && activeDeptObj.productCount ? `<span class="cat-count-badge">${Number(activeDeptObj.productCount).toLocaleString()}</span>` : ''}
              </button>
              ${activeSubcats.map(s => `
                <button class="subcat-pill ${state.currentSubcategory === s.id ? 'active' : ''}" 
                        onclick="app.selectSubcategory('${escapeHtml(s.id)}')">
                  <span>${s.emoji || '📁'}</span>
                  <span>${escapeHtml(s.name)}</span>
                  <span class="cat-count-badge">${Number(s.productCount || 0).toLocaleString()}</span>
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${activeFamilies.length > 0 ? `
          <!-- Level 3: Product Family Rail -->
          <div>
            <div class="hierarchy-level-label"><span>🏷️ Product Family in ${escapeHtml(state.currentSubcategory)}</span></div>
            <div class="hierarchy-rail" role="tablist" aria-label="Product Family Hierarchy">
              <button class="family-pill ${state.currentProductFamily === 'all' ? 'active' : ''}" 
                      onclick="app.selectProductFamily('all')">
                <span>All ${escapeHtml(state.currentSubcategory)}</span>
                ${activeSubcatObj && activeSubcatObj.productCount ? `<span class="cat-count-badge">${Number(activeSubcatObj.productCount).toLocaleString()}</span>` : ''}
              </button>
              ${activeFamilies.map(f => `
                <button class="family-pill ${state.currentProductFamily === f.id ? 'active' : ''}" 
                        onclick="app.selectProductFamily('${escapeHtml(f.id)}')">
                  <span>🏷️</span>
                  <span>${escapeHtml(f.name)}</span>
                  <span class="cat-count-badge">${Number(f.productCount || 0).toLocaleString()}</span>
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Backward-Compatible Subcategory Scrolling Chips & Mega Directory Trigger -->
      <div class="category-subrail-wrap">
        <div class="category-chips-container" role="tablist" aria-label="Categories">
          <button class="cat-pill ${state.currentCategory === 'all' ? 'active' : ''}" onclick="app.selectCategory('all')">
            🛒 All Items <span class="cat-count-badge">${state.totalProductsCount ? state.totalProductsCount.toLocaleString() : totalCatalogCount.toLocaleString()}</span>
          </button>
          ${topChips.map(c => `
            <button class="cat-pill ${state.currentCategory === c.id ? 'active' : ''}" onclick="app.selectCategory('${c.id}')">
              ${c.emoji || '🛒'} ${c.name} <span class="cat-count-badge">${c.count ? Number(c.count).toLocaleString() : ''}</span>
            </button>
          `).join('')}
        </div>

        <button class="btn-mega-cat" onclick="app.openCategoryMegaModal()" title="Explore all categories">
          📂 All Categories (${(state.categoriesList || []).length})
        </button>

        <!-- Keep full-category-select in DOM for test & accessibility parity -->
        <div class="category-select-wrapper" style="display:none;">
          <select id="full-category-select" class="category-dropdown-select" onchange="app.selectCategory(this.value)">
            <option value="">📂 All Categories (${(state.categoriesList || []).length} total)...</option>
            ${(state.categoriesList || []).map(c => `
              <option value="${c.id}" ${state.currentCategory === c.id ? 'selected' : ''}>
                ${c.emoji || '🛒'} ${c.name} — ${c.department || 'General'} (${c.count || ''} items)
              </option>
            `).join('')}
          </select>
        </div>
      </div>
    `;
  }

  // ----------------------------------------------------
  // Category & Storefront URL State Synchronization
  // ----------------------------------------------------
  function updateNavigationUrl() {
    const rawHash = (window.location.hash || '').replace('#', '').trim();
    if (rawHash.startsWith('admin') || rawHash === 'orders') {
      return;
    }
    const params = new URLSearchParams();
    if (state.currentDepartment && state.currentDepartment !== 'all') {
      params.set('dept', state.currentDepartment);
    }
    if (state.currentSubcategory && state.currentSubcategory !== 'all') {
      params.set('subcat', state.currentSubcategory);
    }
    if (state.currentProductFamily && state.currentProductFamily !== 'all') {
      params.set('family', state.currentProductFamily);
    }
    if (state.currentCategory && state.currentCategory !== 'all') {
      params.set('cat', state.currentCategory);
    }
    if (state.currentPage && state.currentPage > 1) {
      params.set('page', state.currentPage);
    }
    const qs = params.toString();
    const newHash = qs ? `store?${qs}` : 'store';
    const currentHash = (window.location.hash || '').replace('#', '');
    if (currentHash !== newHash) {
      history.pushState(null, '', '#' + newHash);
    }
  }

  function readNavigationFromUrl() {
    const rawHash = (window.location.hash || '').replace('#', '').trim();
    if (rawHash.startsWith('store') || (!rawHash.startsWith('admin') && rawHash !== 'orders' && rawHash.includes('?'))) {
      const qIdx = rawHash.indexOf('?');
      if (qIdx !== -1) {
        const queryPart = rawHash.slice(qIdx + 1);
        const params = new URLSearchParams(queryPart);
        state.currentDepartment = params.get('dept') || 'all';
        state.currentSubcategory = params.get('subcat') || 'all';
        state.currentProductFamily = params.get('family') || 'all';
        state.currentCategory = params.get('cat') || 'all';
        if (params.get('page')) {
          state.currentPage = parseInt(params.get('page'), 10) || 1;
        }
        return true;
      }
    }
    return false;
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

      // Phase 5C: Pull active facet filters from state
      const af = state.activeFilters || {};

      const params = new URLSearchParams({
        category: state.currentCategory || 'all',
        sort: state.currentSort || 'rating',
        page: state.currentPage,
        limit: 24,
        ...(state.currentDepartment && state.currentDepartment !== 'all' ? { department: state.currentDepartment } : {}),
        ...(state.currentSubcategory && state.currentSubcategory !== 'all' ? { subcategory: state.currentSubcategory } : {}),
        ...(state.currentProductFamily && state.currentProductFamily !== 'all' ? { product_family: state.currentProductFamily } : {}),
        ...(state.currentDiet && state.currentDiet !== 'all' ? { diet: state.currentDiet } : {}),
        ...(state.searchQuery ? { search: state.searchQuery } : {}),
        // Facet filters (Phase 5C)
        ...(af.brand && af.brand !== 'all' ? { brand: af.brand } : {}),
        ...(af.nutrition_grade && af.nutrition_grade !== 'all' ? { nutrition_grade: af.nutrition_grade } : {}),
        ...(af.pack_size && af.pack_size !== 'all' ? { pack_size: af.pack_size } : {}),
        ...(af.min_rating ? { min_rating: af.min_rating } : {}),
        ...(af.min_price !== undefined && af.min_price !== null ? { min_price: af.min_price } : {}),
        ...(af.max_price !== undefined && af.max_price !== null ? { max_price: af.max_price } : {})
      });

      const res = await api(`/api/products?${params.toString()}`);
      state.products = res.data || [];
      state.currentPage = res.page || 1;
      state.totalPages = res.totalPages || 1;
      state.totalProductsCount = res.total || state.products.length;

      renderProductsGrid();
      renderPaginationControls();
      updateNavigationUrl();
      updateActiveFilterChips();
      updateResultCount();

      if (!state.categoriesRendered) {
        renderCategorySelector();
        renderFlashDeals();
        renderComboPacks();
        state.categoriesRendered = true;
      }
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

  const DEPT_SVG_MAP = {
    fruits: 'fresh-produce',
    vegetables: 'fresh-produce',
    leafy_greens: 'fresh-produce',
    exotic_fruits: 'fresh-produce',
    dairy: 'dairy-eggs',
    milk_dairy: 'dairy-eggs',
    eggs: 'dairy-eggs',
    bakery: 'bakery',
    bread_buns: 'bakery',
    beverages: 'beverages',
    tea_coffee: 'beverages',
    snacks: 'snacks-munchies',
    chips_crisps: 'snacks-munchies',
    staples: 'staples-grains',
    rice_grains: 'staples-grains',
    pulses_dals: 'staples-grains',
    cooking_oils: 'staples-grains',
    instant_foods: 'instant-foods',
    confectionery: 'confectionery',
    dry_fruits: 'dry-fruits',
    personal_care: 'personal-care',
    household_cleaning: 'household-cleaning',
    pooja_essentials: 'pooja-essentials',
    pet_supplies: 'pet-supplies',
    baby_care: 'baby-care',
    frozen_foods: 'frozen-foods'
  };

  function handleImageError(imgEl, category) {
    if (!imgEl) return;
    imgEl.onerror = () => {
      imgEl.onerror = null;
      imgEl.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23131c31"/><text x="50%" y="54%" font-size="36" text-anchor="middle" dominant-baseline="middle">🛒</text></svg>';
    };
    imgEl.classList.add('img-fallback');
    const dept = category ? (DEPT_SVG_MAP[category] || (category.replace(/_/g, '-'))) : null;
    if (dept) {
      imgEl.src = `/images/categories/dept-${dept}.svg`;
    } else {
      imgEl.src = '/images/products/grocery-default.svg';
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

  function syncProductCardSteppers() {
    const cards = document.querySelectorAll('.product-card[data-product-id]');
    cards.forEach(card => {
      const pId = card.getAttribute('data-product-id');
      if (!pId) return;
      const qty = getCartItemQuantity(pId);
      const footer = card.querySelector('.product-footer');
      if (!footer) return;

      const existingStepper = footer.querySelector('.card-qty-stepper');
      const existingAddBtn = footer.querySelector('.btn-add-cart');

      if (qty > 0) {
        if (existingStepper) {
          const valEl = existingStepper.querySelector('.card-qty-val');
          if (valEl && valEl.textContent !== String(qty)) valEl.textContent = qty;
        } else if (existingAddBtn) {
          const stepper = document.createElement('div');
          stepper.className = 'card-qty-stepper';
          stepper.innerHTML = `
            <button class="card-qty-btn" onclick="event.stopPropagation(); app.updateCartQty('${pId}', ${qty - 1})" aria-label="Decrease quantity">-</button>
            <span class="card-qty-val">${qty}</span>
            <button class="card-qty-btn" onclick="event.stopPropagation(); app.updateCartQty('${pId}', ${qty + 1})" aria-label="Increase quantity">+</button>
          `;
          existingAddBtn.replaceWith(stepper);
        }
      } else {
        if (existingStepper) {
          const addBtn = document.createElement('button');
          addBtn.className = 'btn-add-cart';
          addBtn.setAttribute('onclick', `event.stopPropagation(); app.addToCart('${pId}')`);
          addBtn.textContent = '+ ADD';
          existingStepper.replaceWith(addBtn);
        }
      }
    });
  }

  function createProductCardHtml(p, matchBadge = '') {
    const wishActive = isWishlisted(p.id);
    const compActive = isComparing(p.id);
    const inCartQty = getCartItemQuantity(p.id);
    const imgUrl = p.primary_image_url || p.front_image_url || p.image_url || '/images/products/grocery-default.svg';
    const altText = escapeHtml(p.image_alt || p.name);
    const discount = p.discount || (p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0);
    const mrp = p.mrp || (discount > 0 ? Math.round(p.price * 1.2) : null);
    const gallery = Array.isArray(p.gallery_images) ? p.gallery_images : [];

    // Phase 5D: Category-relevant attribute chips from activated catalog data
    const chips = [];

    // 1. Nutri-Score badge (A–E)
    if (p.nutrition_grade && ['A', 'B', 'C', 'D', 'E'].includes(p.nutrition_grade.toUpperCase())) {
      const grade = p.nutrition_grade.toUpperCase();
      chips.push(`<span class="attr-chip chip-nutri nutri-${grade.toLowerCase()}" title="Nutri-Score Grade ${grade}">Nutri-Score ${grade}</span>`);
    }

    // 2. Parse attributes_json safely
    let attrs = {};
    if (typeof p.attributes === 'object' && p.attributes !== null) {
      attrs = p.attributes;
    } else if (p.attributes_json) {
      try { attrs = JSON.parse(p.attributes_json); } catch (e) {}
    }

    // 3. Dietary classification or tags
    if (attrs.dietary_classification && !['NOT_AVAILABLE', 'UNKNOWN'].includes(attrs.dietary_classification)) {
      chips.push(`<span class="attr-chip chip-diet">${escapeHtml(attrs.dietary_classification)}</span>`);
    } else if (Array.isArray(p.tags) && p.tags.length > 0) {
      const dietTag = p.tags.find(t => ['organic', 'vegan', 'gluten-free', 'protein', 'diabetic'].includes(String(t).toLowerCase()));
      if (dietTag) {
        chips.push(`<span class="attr-chip chip-diet">${escapeHtml(dietTag.charAt(0).toUpperCase() + dietTag.slice(1))}</span>`);
      }
    }

    // 4. Category-specific attributes (Electronics, Pooja, Home)
    if (attrs.connectivity && !['NOT_AVAILABLE', 'UNKNOWN'].includes(attrs.connectivity)) {
      chips.push(`<span class="attr-chip chip-spec">${escapeHtml(attrs.connectivity)}</span>`);
    } else if (attrs.battery_life && !['NOT_AVAILABLE', 'UNKNOWN'].includes(attrs.battery_life)) {
      chips.push(`<span class="attr-chip chip-spec">🔋 ${escapeHtml(attrs.battery_life)}</span>`);
    } else if (attrs.material && !['NOT_AVAILABLE', 'UNKNOWN'].includes(attrs.material)) {
      chips.push(`<span class="attr-chip chip-spec">${escapeHtml(attrs.material)}</span>`);
    } else if (attrs.country && chips.length < 2 && !['NOT_AVAILABLE', 'UNKNOWN'].includes(attrs.country)) {
      chips.push(`<span class="attr-chip chip-spec">📍 ${escapeHtml(attrs.country)}</span>`);
    }

    // 5. Stock level indicator
    if (p.stock !== undefined && p.stock !== null) {
      if (p.stock > 0 && p.stock <= 10) {
        chips.push(`<span class="attr-chip chip-stock-low" title="Only ${p.stock} units left in darkstore">⚡ Only ${p.stock} left</span>`);
      } else if (p.stock > 10 && chips.length < 3) {
        chips.push(`<span class="attr-chip chip-stock-ok">✓ In Stock</span>`);
      }
    }

    const chipsHtml = chips.length > 0 
      ? `<div class="product-attribute-chips">${chips.slice(0, 3).join('')}</div>` 
      : '';

    const galleryCountBadge = gallery.length > 1
      ? `<span class="card-gallery-count-badge" title="${gallery.length} verified image views">📷 ${gallery.length}</span>`
      : '';

    const isSelected = state.selectedProductIds && state.selectedProductIds.has(p.id);

    return `
      <div class="product-card ${isSelected ? 'card--selected' : ''}" data-product-id="${p.id}">
        <div class="card-glare"></div>
        <div class="card-select-wrap" onclick="event.stopPropagation();">
          <input type="checkbox"
                 class="product-select-checkbox"
                 id="select-prod-${p.id}"
                 data-product-id="${p.id}"
                 ${isSelected ? 'checked' : ''}
                 onchange="app.toggleProductSelection('${p.id}', this.checked)"
                 aria-label="Select ${escapeHtml(p.name)} for bulk actions">
        </div>
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
          ${galleryCountBadge}
          <img class="product-image"
               src="${imgUrl}"
               alt="${altText}"
               loading="lazy"
               decoding="async"
               onerror="handleImageError(this, '${p.category || p.department || ''}')">
        </div>

        <div class="product-info">
          ${p.brand ? `<div class="product-brand-tag">${escapeHtml(p.brand)}</div>` : ''}
          <div class="product-name" onclick="app.openProductDetail('${p.id}')" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</div>
          <div class="product-pack-size">${escapeHtml(p.package_size || p.unit || '1 pack')}</div>
          ${chipsHtml}
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
  // Thompson Sampling Dynamic Promotion (Bandit)
  // ----------------------------------------------------
  async function loadStorefrontBanditPromo() {
    try {
      const res = await api('/api/pricing/bandit-promo?context=storefront_hero');
      if (res && res.success && res.selected_arm) {
        const banner = $('#bandit-storefront-banner');
        if (!banner) return;
        const arm = res.selected_arm;
        const badgeEl = $('#bandit-banner-badge');
        const titleEl = $('#bandit-banner-title');
        const taglineEl = $('#bandit-banner-tagline');
        if (badgeEl) badgeEl.textContent = arm.badge || '⚡ Thompson Sampling Deal';
        if (titleEl) titleEl.textContent = arm.title || arm.name;
        if (taglineEl) taglineEl.textContent = arm.tagline || 'Special dynamic AI offer';
        banner.style.display = 'flex';

        const claimBtn = $('#btn-claim-bandit-deal');
        if (claimBtn) {
          claimBtn.onclick = async () => {
            claimBtn.disabled = true;
            claimBtn.textContent = 'Claimed! ✓';
            showToast(`🎁 Claimed deal: ${arm.title || arm.name}`);
            try {
              await api('/api/pricing/bandit-feedback', {
                method: 'POST',
                body: JSON.stringify({ arm_id: arm.arm_id || arm.id, reward: 1 })
              });
            } catch (e) {}
          };
        }
      }
    } catch (e) {
      console.warn('Bandit promo load failed:', e);
    }
  }

  // ----------------------------------------------------
  // Sequential Transformer (SASRec) Next-Pick Recommendations
  // ----------------------------------------------------
  async function loadStorefrontSASRec() {
    const grid = $('#sasrec-storefront-grid');
    if (!grid) return;

    try {
      // Build session trajectory from cart items or recently viewed, fallback to default
      let trajectory = (state.cart?.items || []).map(i => i.product_id || i.id);
      if (trajectory.length === 0 && state.recentlyViewed && state.recentlyViewed.length > 0) {
        trajectory = state.recentlyViewed.slice(0, 4);
      }
      if (trajectory.length === 0) {
        trajectory = ['p1', 'p2', 'p4'];
      }

      const res = await api('/api/recommendations/sequential', {
        method: 'POST',
        body: JSON.stringify({ sequence: trajectory, limit: 4 })
      });

      if (res && res.success && (res.top_next_predictions || res.top_predictions)) {
        const preds = res.top_next_predictions || res.top_predictions;
        const items = preds.map(pred => {
          const matched = (state.products || []).find(p => String(p.id) === String(pred.product_id) || `p${p.id}` === String(pred.product_id));
          if (matched) {
            return {
              ...matched,
              sasrecScore: pred.confidence_percent || Math.round((pred.probability || 0.25) * 100)
            };
          }
          return {
            id: pred.product_id,
            name: pred.name,
            category: pred.category,
            emoji: pred.emoji || '📦',
            price: pred.price || 99,
            stock: 25,
            rating: 4.8,
            unit: '1 pack',
            sasrecScore: pred.confidence_percent || 85
          };
        });

        grid.innerHTML = items.map(p => 
          createProductCardHtml(p, `⚡ Next-Pick (${p.sasrecScore || 90}%)`)
        ).join('');
      }
    } catch (e) {
      console.warn('Error loading SASRec recommendations:', e);
    }
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
      if (typeof triggerFlyToCart === 'function') {
        triggerFlyToCart(productId);
      }
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
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
    const mobileBadge = $('#mobile-cart-badge');
    if (mobileBadge) {
      mobileBadge.textContent = count;
    }

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
      syncProductCardSteppers();
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
    syncProductCardSteppers();
  }

  async function loadCartAddons() {
    if (!state.cart.items || state.cart.items.length === 0) return;
    try {
      const pId = state.cart.items[0].productId;
      const res = await api(`/api/recommendations/frequently-bought/${pId}`, { silent: true });
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
    } catch (e) {
      const box = $('#smart-cart-addons');
      if (box) box.style.display = 'none';
    }
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
  function openInvoiceModal(customOrder) {
    const order = customOrder || state.lastPlacedOrder || {
      orderId: 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      customerName: 'Rahul Sharma',
      address: 'Indiranagar, Bengaluru, Karnataka',
      phone: '+91-9876543210',
      total: 384,
      subtotal: 320,
      deliveryFee: 0,
      tax: 25.6
    };

    const orderIdLabel = order.orderId || order.id || 'ORD-LATEST';
    const invOrderId = $('#inv-order-id');
    if (invOrderId) invOrderId.textContent = orderIdLabel;
    const invCustName = $('#inv-cust-name');
    if (invCustName) invCustName.textContent = order.customerName || (state.user ? state.user.name : 'Rahul Sharma');
    const invCustPhone = $('#inv-cust-phone');
    if (invCustPhone) invCustPhone.textContent = order.phone || '+91-9876543210';
    const invCustAddr = $('#inv-cust-address');
    if (invCustAddr) invCustAddr.textContent = order.shippingAddress || order.address || 'Indiranagar, Bengaluru';

    const body = $('#inv-items-body');
    const items = (order.items && order.items.length > 0) ? order.items : (state.cart.items && state.cart.items.length > 0) ? state.cart.items : [
      { name: 'Organic Apples', quantity: 1, price: 249 },
      { name: 'Fresh Whole Milk', quantity: 1, price: 69 }
    ];

    if (body) {
      body.innerHTML = items.map(i => {
        const q = i.quantity || i.qty || 1;
        const pr = i.price || 0;
        return `
          <tr>
            <td>${escapeHtml(i.name || i.productName || 'Grocery Item')}</td>
            <td>${q}</td>
            <td>₹${pr}</td>
            <td>₹${Math.round(q * pr)}</td>
          </tr>
        `;
      }).join('');
    }

    const sub = Number(order.subtotal || order.subtotalAmount || 320);
    const del = Number(order.deliveryFee || 0);
    const tip = Number(order.tip || state.activeTip || 20);
    const tax = Number(order.tax || order.taxAmount || 25.6);
    const tot = Number(order.total || order.totalAmount || 365.6);

    const invSub = $('#inv-subtotal');
    if (invSub) invSub.textContent = `₹${sub.toFixed(2)}`;
    const invDel = $('#inv-delivery');
    if (invDel) invDel.textContent = `₹${del.toFixed(2)}`;
    const invTip = $('#inv-tip');
    if (invTip) invTip.textContent = `₹${tip.toFixed(2)}`;
    const invTax = $('#inv-tax');
    if (invTax) invTax.textContent = `₹${tax.toFixed(2)}`;
    const invTot = $('#inv-total');
    if (invTot) invTot.textContent = `₹${tot.toFixed(2)}`;

    // Draw realistic QR pattern on canvas
    drawInvoiceQR();

    const conf = $('#confirmation-overlay');
    if (conf) conf.style.display = 'none';
    const inv = $('#invoice-modal-overlay');
    if (inv) inv.style.display = 'flex';
  }

  function openInvoiceModalById(orderId) {
    const o = (state.ordersList || []).find(x => String(x.id) === String(orderId)) || state.lastPlacedOrder;
    openInvoiceModal(o);
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
  // ----------------------------------------------------
  // Product Detail & Studio Multi-View Gallery Experience
  // ----------------------------------------------------
  function switchDetailGalleryImage(imgSrc, btnEl) {
    const heroImg = $('#modal-detail-hero-img');
    if (heroImg && imgSrc) {
      heroImg.src = imgSrc;
    }
    const strip = $('#modal-gallery-strip');
    if (strip) {
      strip.querySelectorAll('.gallery-thumb-btn').forEach(b => b.classList.remove('active'));
    }
    if (btnEl) {
      btnEl.classList.add('active');
    }
  }

  async function openProductDetail(productId) {
    let p = state.products.find(x => x.id === productId) || (state.recommendedProducts || []).find(x => x.id === productId);
    
    // Asynchronously fetch enriched specifications, bullets, and gallery
    try {
      const res = await api('/api/products/' + productId);
      if (res && res.data) p = res.data;
    } catch (e) {}
    if (!p) return;

    // Consolidate real gallery images without fabricating orientation
    const gallery = [];
    const seenImgs = new Set();
    const addImg = (u) => {
      if (u && typeof u === 'string' && u.trim().length > 0 && !seenImgs.has(u.trim())) {
        seenImgs.add(u.trim());
        gallery.push(u.trim());
      }
    };

    addImg(p.primary_image_url);
    addImg(p.front_image_url);
    addImg(p.image_url);
    if (Array.isArray(p.gallery_images)) {
      p.gallery_images.forEach(addImg);
    } else if (p.gallery_images && typeof p.gallery_images === 'string') {
      try {
        const parsed = JSON.parse(p.gallery_images);
        if (Array.isArray(parsed)) parsed.forEach(addImg);
      } catch (e) {}
    }
    addImg(p.packaging_image_url);
    addImg(p.nutrition_image_url);
    addImg(p.ingredients_image_url);
    addImg(p.back_image_url);

    const mainImg = gallery[0] || '/images/products/grocery-default.svg';
    const altText = escapeHtml(p.image_alt || p.name);
    const discount = p.discount || (p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0);
    const mrp = p.mrp || (discount > 0 ? Math.round(p.price * 1.2) : null);
    const savings = mrp && mrp > p.price ? mrp - p.price : 0;

    let attrs = {};
    if (typeof p.attributes === 'object' && p.attributes !== null) {
      attrs = p.attributes;
    } else if (p.attributes_json) {
      try { attrs = JSON.parse(p.attributes_json); } catch (e) {}
    }

    let nutriments = {};
    if (typeof p.nutriments === 'object' && p.nutriments !== null) {
      nutriments = p.nutriments;
    } else if (p.nutriments_json) {
      try { nutriments = JSON.parse(p.nutriments_json); } catch (e) {}
    }

    // Parse bullet points safely
    let bulletPoints = [];
    if (Array.isArray(p.bullet_points)) {
      bulletPoints = p.bullet_points;
    } else if (p.bullet_points_json) {
      try { bulletPoints = JSON.parse(p.bullet_points_json); } catch (e) {}
    }
    if (!Array.isArray(bulletPoints)) bulletPoints = [];
    const validBullets = bulletPoints
      .map(b => String(b || '').trim())
      .filter(b => b.length > 0 && !['NOT_AVAILABLE', 'UNKNOWN', 'N/A', 'NONE'].includes(b.toUpperCase()));

    // Parse technical specs, dimensions, weight safely
    let techSpecs = {};
    if (typeof p.technical_specs === 'object' && p.technical_specs !== null) {
      techSpecs = p.technical_specs;
    } else if (p.technical_specs_json) {
      try { techSpecs = JSON.parse(p.technical_specs_json); } catch (e) {}
    }

    let dimensions = typeof p.dimensions === 'object' && p.dimensions !== null ? p.dimensions : {};
    if (p.dimensions_json && Object.keys(dimensions).length === 0) {
      try { dimensions = JSON.parse(p.dimensions_json); } catch (e) {}
    }
    let weight = typeof p.weight === 'object' && p.weight !== null ? p.weight : {};
    if (p.weight_json && Object.keys(weight).length === 0) {
      try { weight = JSON.parse(p.weight_json); } catch (e) {}
    }

    const combinedSpecs = { ...techSpecs };
    if (dimensions && Object.keys(dimensions).length > 0) {
      Object.entries(dimensions).forEach(([dk, dv]) => { if (dv) combinedSpecs['dimension_' + dk] = dv; });
    }
    if (weight && Object.keys(weight).length > 0) {
      Object.entries(weight).forEach(([wk, wv]) => { if (wv) combinedSpecs['weight_' + wk] = wv; });
    }

    const formatSpecKey = (key) => {
      return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .replace(/\bAsin\b/g, 'ASIN')
        .replace(/\bGtin\b/g, 'GTIN')
        .replace(/\bAnc\b/g, 'ANC');
    };

    const validSpecEntries = Object.entries(combinedSpecs).filter(([k, v]) => {
      if (v === null || v === undefined || v === '') return false;
      const str = String(v).trim().toUpperCase();
      return !['NOT_AVAILABLE', 'UNKNOWN', 'N/A', 'NONE'].includes(str);
    });

    // Category attributes not in tech specs or nutriments
    const categoryAttrEntries = Object.entries(attrs).filter(([k, v]) => {
      if (['calories_kcal_100g', 'fiber_g', 'vitamin_c_mg', 'proteins_g', 'dietary_classification', 'asin'].includes(k)) return false;
      if (combinedSpecs[k] !== undefined) return false;
      if (v === null || v === undefined || v === '') return false;
      const str = String(v).trim().toUpperCase();
      return !['NOT_AVAILABLE', 'UNKNOWN', 'N/A', 'NONE'].includes(str);
    });

    $('#detail-prod-name').textContent = p.name;
    const content = $('#product-detail-content');

    const galleryStripHtml = gallery.length > 1 ? `
      <div class="studio-gallery-strip" id="modal-gallery-strip" role="tablist" aria-label="Studio Product Views">
        ${gallery.map((img, idx) => `
          <button class="gallery-thumb-btn ${idx === 0 ? 'active' : ''}"
                  type="button"
                  data-src="${escapeHtml(img)}"
                  onclick="app.switchDetailGalleryImage('${escapeHtml(img)}', this)"
                  aria-label="View image ${idx + 1}"
                  title="View image ${idx + 1}">
            <img src="${img}" alt="Thumbnail ${idx + 1}" onerror="this.parentElement.style.display='none'">
          </button>
        `).join('')}
      </div>
    ` : '';

    const bulletsHtml = validBullets.length > 0 ? `
      <div class="detail-section detail-bullets-section">
        <h4 class="detail-section-title">✨ Key Highlights</h4>
        <ul class="detail-bullet-list">
          ${validBullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}
        </ul>
      </div>
    ` : '';

    const techSpecsHtml = validSpecEntries.length > 0 ? `
      <div class="detail-section detail-specs-section">
        <h4 class="detail-section-title">⚙️ Technical Specifications</h4>
        <div class="detail-specs-grid">
          ${validSpecEntries.map(([k, v]) => `
            <div class="spec-card">
              <span class="spec-label">${formatSpecKey(k)}</span>
              <span class="spec-val">${escapeHtml(String(v))}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    const categoryAttrsHtml = categoryAttrEntries.length > 0 ? `
      <div class="detail-section detail-cat-attrs-section">
        <h4 class="detail-section-title">🏷️ Key Attributes</h4>
        <div class="detail-specs-grid">
          ${categoryAttrEntries.map(([k, v]) => `
            <div class="spec-card">
              <span class="spec-label">${formatSpecKey(k)}</span>
              <span class="spec-val">${typeof v === 'boolean' ? (v ? 'Yes' : 'No') : escapeHtml(String(v))}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    const nutritionHtml = (p.ingredients_text || Object.keys(nutriments).length > 0) ? `
      <div class="detail-section detail-nutrition-section">
        <h4 class="detail-section-title" style="color:var(--green-400);">🥗 Ingredients & Nutrition Profile</h4>
        ${p.ingredients_text ? `<p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:8px; line-height:1.4;"><strong>Ingredients:</strong> ${escapeHtml(p.ingredients_text)}</p>` : ''}
        ${Object.keys(nutriments).length > 0 ? `
          <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:6px;">
            ${Object.entries(nutriments).map(([nk, nv]) => `
              <span class="spec-badge">
                <strong>${nk.replace(/_/g, ' ')}:</strong> ${nv}
              </span>
            `).join('')}
          </div>
        ` : ''}
      </div>
    ` : '';

    const storageHtml = (p.storage_information || p.shelf_life_claim) ? `
      <div class="detail-section detail-storage-section">
        <h4 class="detail-section-title" style="color:var(--blue-400);">📦 Storage & Shelf-Life</h4>
        ${p.storage_information ? `<p style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;"><strong>Storage:</strong> ${escapeHtml(p.storage_information)}</p>` : ''}
        ${p.shelf_life_claim ? `<p style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;"><strong>Shelf Life:</strong> ${escapeHtml(p.shelf_life_claim)}</p>` : ''}
      </div>
    ` : '';

    const breadcrumbsHtml = p.department ? `
      <div class="taxonomy-breadcrumbs" style="margin-bottom:10px;">
        <span class="crumb-link" onclick="$('#product-detail-overlay').style.display='none'; app.selectDepartment('${escapeHtml(p.department)}');">${escapeHtml(p.department)}</span>
        ${p.subcategory ? `<span class="crumb-sep">›</span><span class="crumb-link" onclick="$('#product-detail-overlay').style.display='none'; app.selectSubcategory('${escapeHtml(p.subcategory)}');">${escapeHtml(p.subcategory)}</span>` : ''}
        ${p.product_family ? `<span class="crumb-sep">›</span><span style="color:var(--text-muted); font-weight:600;">${escapeHtml(p.product_family)}</span>` : ''}
      </div>
    ` : '';

    content.innerHTML = `
      <div class="detail-modal-layout">
        <!-- Media Column -->
        <div class="detail-modal-media-col">
          <div class="detail-hero-container">
            <img class="detail-hero-img"
                 id="modal-detail-hero-img"
                 src="${mainImg}"
                 alt="${altText}"
                 loading="eager"
                 decoding="async"
                 onerror="handleImageError(this, '${p.category || p.department || ''}')">
          </div>
          ${galleryStripHtml}

          <!-- Academic Provenance & Verification Badge Bar -->
          <div class="detail-provenance-bar">
            <span class="provenance-pill ${p.dataset_status === 'verified_real' ? 'verified' : 'curated'}">
              ${p.dataset_status === 'verified_real' ? '✓ Real-World Dataset' : '📜 Curated Catalog'} • ${p.source_dataset || 'FreshCart'}
            </span>
            ${p.barcode ? `<span class="barcode-badge">BARCODE / GTIN: ${p.barcode}</span>` : ''}
            ${p.license ? `<span class="provenance-pill">License: ${p.license}</span>` : ''}
          </div>

          <div class="detail-delivery-badge-box">
            <span style="font-size:1.4rem;">⚡</span>
            <div style="text-align:left;">
              <strong style="color:var(--green-400); font-size:0.82rem;">10-Minute Superfast Delivery</strong>
              <p style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
                Fulfilled instantly from nearest FreshCart dark store. Temperature controlled.
              </p>
            </div>
          </div>
        </div>

        <!-- Information Column -->
        <div class="detail-modal-info-col">
          ${breadcrumbsHtml}

          <div style="display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin:4px 0 8px;">
            ${p.brand ? `<span class="product-brand-tag" style="background:rgba(255,255,255,0.08); padding:2px 8px; border-radius:4px; font-weight:700;">${escapeHtml(p.brand)}</span>` : ''}
            <span style="font-size:0.75rem; color:var(--text-dim); text-transform:uppercase; font-weight:700;">${p.subcategory || p.category || 'Grocery'}</span>
            ${p.nutrition_grade && ['A', 'B', 'C', 'D', 'E'].includes(p.nutrition_grade.toUpperCase()) 
              ? `<span class="attr-chip chip-nutri nutri-${p.nutrition_grade.toLowerCase()}">Nutri-Score ${p.nutrition_grade.toUpperCase()}</span>` 
              : ''}
          </div>

          <h3 class="detail-modal-title">${escapeHtml(p.name)}</h3>
          <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px;">Package Size: <strong>${p.package_size || p.unit || '1 pack'}</strong></div>

          <div style="display:flex; align-items:center; gap:10px; margin:10px 0;">
            <span style="font-size:1.6rem; font-weight:800; color:var(--green-400);">₹${p.price}</span>
            ${mrp && mrp > p.price ? `<span style="font-size:1.05rem; text-decoration:line-through; color:var(--text-dim);">₹${mrp}</span>` : ''}
            ${discount > 0 ? `<span class="discount-pill" style="position:static;">${discount}% OFF</span>` : ''}
          </div>
          ${savings > 0 ? `<div style="font-size:0.8rem; color:var(--green-400); font-weight:600; margin-bottom:12px;">You save ₹${savings} on this item</div>` : ''}

          <div style="display:flex; gap:10px; align-items:center; margin-bottom:16px;">
            <button class="btn-primary" style="flex:1; padding:12px; font-size:0.95rem; font-weight:700;" onclick="app.addToCart('${p.id}'); $('#product-detail-overlay').style.display='none';">
              🛒 Add to Cart (₹${p.price})
            </button>
            <button class="card-action-btn ${isWishlisted(p.id) ? 'active' : ''}" onclick="app.toggleWishlist('${p.id}')" title="Wishlist" style="width:44px; height:44px; border-radius:10px; font-size:1.2rem;">
              ${isWishlisted(p.id) ? '❤️' : '🤍'}
            </button>
            <button class="card-action-btn ${isComparing(p.id) ? 'compare-active' : ''}" onclick="app.toggleCompare('${p.id}')" title="Compare" style="width:44px; height:44px; border-radius:10px; font-size:1.2rem;">
              ⚖️
            </button>
          </div>

          ${p.description ? `
            <p style="color:var(--text-muted); font-size:0.88rem; line-height:1.4; text-align:left; background:rgba(255,255,255,0.03); padding:10px 14px; border-radius:8px; border:1px solid var(--border-subtle); margin-bottom:12px;">
              ${escapeHtml(p.description)}
            </p>
          ` : ''}

          ${bulletsHtml}
          ${techSpecsHtml}
          ${categoryAttrsHtml}
          ${nutritionHtml}
          ${storageHtml}

          <div style="border-top:1px solid var(--border-subtle); padding-top:12px; margin-top:14px; margin-bottom:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <strong style="font-size:0.85rem;">⭐ Customer Ratings & Reviews:</strong>
              <span style="font-size:0.8rem; font-weight:700; color:#fbbf24;">${p.rating || 4.8} / 5.0 (${p.review_count || 42} reviews)</span>
            </div>
            <div style="font-size:0.78rem; color:var(--text-muted); background:rgba(0,0,0,0.2); padding:8px 12px; border-radius:6px; line-height:1.4; text-align:left;">
              "Always crisp, fresh and authentic quality. Arrived in under 10 minutes!" — <em>Verified Customer</em>
            </div>
          </div>
        </div>
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
        const searchParams = new URLSearchParams({
          q: query.trim(),
          ...(state.currentDepartment && state.currentDepartment !== 'all' ? { department: state.currentDepartment } : {}),
          ...(state.currentSubcategory && state.currentSubcategory !== 'all' ? { subcategory: state.currentSubcategory } : {}),
          ...(state.currentProductFamily && state.currentProductFamily !== 'all' ? { product_family: state.currentProductFamily } : {})
        });
        const res = await api(`/api/search?${searchParams.toString()}`, {
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

    dropdown.innerHTML = results.slice(0, 5).map(r => {
      const p = r.product || r;
      const scoreVal = r.score !== undefined ? r.score : (r.relevanceScore || 1);
      return `
      <div class="search-drop-item" onclick="app.selectSearchResult('${escapeHtml(p.name)}')">
        <div style="display:flex; align-items:center; gap:8px;">
          <img class="search-suggestion-thumb" style="width:36px; height:36px; object-fit:contain; border-radius:6px; background:rgba(255,255,255,0.05); padding:2px;" src="${p.image_url || '/images/products/grocery-default.svg'}" alt="${escapeHtml(p.name)}" onerror="handleImageError(this, '')">
          <div>
            <strong>${escapeHtml(p.name)}</strong>
            <small style="color:var(--text-dim); display:block;">₹${p.price} / ${p.unit || 'unit'} • ${p.category}</small>
          </div>
        </div>
        <span class="card-match-badge" style="position:static;">${r.matchConfidence || (Math.round(scoreVal * 100) + '%')} Match</span>
      </div>
    `;
    }).join('');

    dropdown.style.display = 'block';
  }

  function selectSearchResult(name) {
    $('#search-input').value = name;
    $('#smart-search-dropdown').style.display = 'none';
    state.searchQuery = name;
    loadProducts();
  }
  // ----------------------------------------------------
  // FreshCart AI Agentic Floating Assistant (World-Class UX)
  // ----------------------------------------------------
  let _isDraggingBot = false;
  let _botDragStartX = 0;
  let _botDragStartY = 0;
  let _botPanelInitLeft = 0;
  let _botPanelInitTop = 0;
  let _botConversationId = localStorage.getItem('freshcart_bot_conv') || ('conv_' + Math.random().toString(36).substring(2, 11));

  function setupFreshBot() {
    const toggleBtn = $('#freshbot-toggle');
    const panel = $('#freshbot-panel');
    const dragHandle = $('#freshbot-drag-handle');
    const closeBtn = $('#freshbot-close');
    const minBtn = $('#freshbot-minimize');
    const maxBtn = $('#freshbot-maximize');
    const restoreBtn = $('#freshbot-restore');
    const clearBtn = $('#freshbot-clear');
    const form = $('#freshbot-form');
    const input = $('#freshbot-input');

    if (!toggleBtn || !panel) return;

    // Restore saved panel position from sessionStorage
    const savedLeft = sessionStorage.getItem('freshcart_bot_left');
    const savedTop = sessionStorage.getItem('freshcart_bot_top');
    if (savedLeft && savedTop) {
      const x = parseInt(savedLeft, 10);
      const y = parseInt(savedTop, 10);
      if (!isNaN(x) && !isNaN(y) && x < window.innerWidth - 60 && y < window.innerHeight - 60) {
        panel.style.left = `${Math.max(10, x)}px`;
        panel.style.top = `${Math.max(10, y)}px`;
        panel.style.bottom = 'auto';
      }
    }

    // Toggle panel visibility
    toggleBtn.addEventListener('click', () => {
      const isHidden = panel.style.display === 'none' || !panel.style.display;
      panel.style.display = isHidden ? 'flex' : 'none';
      toggleBtn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
      if (isHidden) {
        panel.classList.remove('minimized');
        setTimeout(() => input && input.focus(), 100);
      }
    });

    // Close button
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        panel.style.display = 'none';
        toggleBtn.setAttribute('aria-expanded', 'false');
      });
    }

    // Minimize button
    if (minBtn) {
      minBtn.addEventListener('click', () => {
        panel.classList.toggle('minimized');
      });
    }

    // Restore from minimized dock
    if (restoreBtn) {
      restoreBtn.addEventListener('click', () => {
        panel.classList.remove('minimized');
      });
    }

    // Maximize / Expand button
    if (maxBtn) {
      maxBtn.addEventListener('click', () => {
        const isMax = panel.classList.toggle('maximized');
        maxBtn.textContent = isMax ? '🗗' : '⛶';
        maxBtn.title = isMax ? 'Restore Size' : 'Maximize Panel';
      });
    }

    // Clear Conversation
    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        const container = $('#freshbot-messages');
        if (container) {
          container.innerHTML = `
            <div class="bot-msg">
              <div class="msg-bubble bot">
                🧹 Conversation cleared. How can I help with your groceries today?
              </div>
            </div>
          `;
        }
        try {
          await api('/api/assistant/reset', {
            method: 'POST',
            body: JSON.stringify({ conversationId: _botConversationId })
          });
        } catch (e) {}
      });
    }

    // Drag & Drop Handling (Mouse & Touch)
    if (dragHandle) {
      // Mouse events
      dragHandle.addEventListener('mousedown', (e) => {
        if (e.target.closest('.bot-header-controls') || e.target.closest('button')) return;
        _isDraggingBot = true;
        _botDragStartX = e.clientX;
        _botDragStartY = e.clientY;

        const rect = panel.getBoundingClientRect();
        _botPanelInitLeft = rect.left;
        _botPanelInitTop = rect.top;

        panel.style.bottom = 'auto';
        panel.style.right = 'auto';
        panel.style.left = `${rect.left}px`;
        panel.style.top = `${rect.top}px`;

        document.addEventListener('mousemove', onBotDragMove);
        document.addEventListener('mouseup', onBotDragEnd);
      });

      // Touch events for mobile/tablet
      dragHandle.addEventListener('touchstart', (e) => {
        if (e.target.closest('.bot-header-controls') || e.target.closest('button')) return;
        const touch = e.touches[0];
        _isDraggingBot = true;
        _botDragStartX = touch.clientX;
        _botDragStartY = touch.clientY;

        const rect = panel.getBoundingClientRect();
        _botPanelInitLeft = rect.left;
        _botPanelInitTop = rect.top;

        panel.style.bottom = 'auto';
        panel.style.right = 'auto';
        panel.style.left = `${rect.left}px`;
        panel.style.top = `${rect.top}px`;

        document.addEventListener('touchmove', onBotTouchMove, { passive: false });
        document.addEventListener('touchend', onBotDragEnd);
      });
    }

    function onBotDragMove(e) {
      if (!_isDraggingBot) return;
      const dx = e.clientX - _botDragStartX;
      const dy = e.clientY - _botDragStartY;
      clampAndMovePanel(_botPanelInitLeft + dx, _botPanelInitTop + dy);
    }

    function onBotTouchMove(e) {
      if (!_isDraggingBot) return;
      e.preventDefault();
      const touch = e.touches[0];
      const dx = touch.clientX - _botDragStartX;
      const dy = touch.clientY - _botDragStartY;
      clampAndMovePanel(_botPanelInitLeft + dx, _botPanelInitTop + dy);
    }

    function clampAndMovePanel(newX, newY) {
      const panelWidth = panel.offsetWidth || 400;
      const panelHeight = panel.offsetHeight || 500;
      const maxX = Math.max(10, window.innerWidth - panelWidth - 10);
      const maxY = Math.max(10, window.innerHeight - panelHeight - 10);

      const clampedX = Math.max(10, Math.min(maxX, newX));
      const clampedY = Math.max(10, Math.min(maxY, newY));

      panel.style.left = `${clampedX}px`;
      panel.style.top = `${clampedY}px`;

      sessionStorage.setItem('freshcart_bot_left', clampedX);
      sessionStorage.setItem('freshcart_bot_top', clampedY);
    }

    function onBotDragEnd() {
      _isDraggingBot = false;
      document.removeEventListener('mousemove', onBotDragMove);
      document.removeEventListener('mouseup', onBotDragEnd);
      document.removeEventListener('touchmove', onBotTouchMove);
      document.removeEventListener('touchend', onBotDragEnd);
    }

    // Quick suggestion chips
    $$('.quick-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        handleFreshBotMessage(chip.dataset.query);
      });
    });

    // Chat submit form
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = input.value.trim();
        if (!val) return;
        input.value = '';
        handleFreshBotMessage(val);
      });
    }
  }

  // Markdown formatter helper
  function formatChatMarkdown(text = '') {
    let html = escapeHtml(text);
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Bullet points
    html = html.replace(/^[•\-\*]\s+(.*)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul style="margin:6px 0 6px 18px; padding:0;">$1</ul>');
    // Linebreaks
    html = html.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
    return html;
  }

  async function handleFreshBotMessage(userText) {
    const container = $('#freshbot-messages');
    if (!container) return;

    // Append user bubble
    const userMsg = document.createElement('div');
    userMsg.className = 'bot-msg';
    userMsg.innerHTML = `<div class="msg-bubble user">${escapeHtml(userText)}</div>`;
    container.appendChild(userMsg);
    container.scrollTop = container.scrollHeight;

    // Append thinking indicator
    const botLoading = document.createElement('div');
    botLoading.className = 'bot-msg';
    botLoading.innerHTML = `
      <div class="msg-bubble bot" style="display:flex; align-items:center; gap:8px;">
        <span>Thinking</span>
        <div class="typing-dots">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    container.appendChild(botLoading);
    container.scrollTop = container.scrollHeight;

    // Gather live application context
    const currentProductMeta = state.activeProductId ? { id: state.activeProductId } : null;
    const cartSummary = {
      itemCount: state.cart ? state.cart.itemCount : 0,
      total: state.cart ? state.cart.total : 0,
      items: (state.cart && state.cart.items ? state.cart.items : []).map(i => ({
        id: i.productId || i.id,
        name: i.name,
        quantity: i.quantity,
        price: i.price
      }))
    };

    try {
      const res = await api('/api/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: userText,
          conversationId: _botConversationId,
          context: {
            currentPage: window.location.hash || 'store',
            currentProduct: currentProductMeta,
            cartSummary,
            language: state.language
          }
        })
      });

      botLoading.remove();

      const botMsg = document.createElement('div');
      botMsg.className = 'bot-msg';

      const data = res.data;
      let cardContent = '';

      // 1. Structured Product Cards
      if (data.products && Array.isArray(data.products) && data.products.length > 0) {
        cardContent += `
          <div class="chat-products-grid">
            ${data.products.map(p => `
              <div class="chat-product-card">
                <div>
                  <div class="chat-product-header">
                    <img class="chat-product-img" src="${p.image_url || '/images/products/grocery-default.svg'}" alt="${escapeHtml(p.name)}" onerror="handleImageError(this, '')">
                    <div>
                      <div class="chat-product-title">${escapeHtml(p.name)}</div>
                      <div class="chat-product-meta">${escapeHtml(p.unit || 'unit')} • ${p.rating ? p.rating + '★' : 'Fresh'}</div>
                    </div>
                  </div>
                  <div class="chat-product-price-row">
                    <span class="chat-product-price">₹${p.price}</span>
                    ${p.discount > 0 ? `<span class="chat-product-discount">${p.discount}% OFF</span>` : ''}
                  </div>
                </div>
                <div class="chat-product-actions">
                  <button class="chat-btn-view" onclick="app.openProductDetail('${p.id || p.productId}')">View</button>
                  <button class="chat-btn-add" onclick="app.chatAddToCart('${p.id || p.productId}', 1, '${escapeHtml(p.name)}')">+ Add</button>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }

      // 2. Recipe Bundle Card
      if (data.type === 'recipe' && data.recipe) {
        const r = data.recipe;
        cardContent += `
          <div class="recipe-card-in-chat">
            <strong style="color:var(--green-400); display:block; margin-bottom:4px;">${escapeHtml(r.name)}</strong>
            <div style="font-size:0.75rem; color:var(--text-dim); margin-bottom:8px;">${escapeHtml(r.diet || '')}</div>
            ${(r.items || []).map(item => `
              <div class="recipe-item-row" style="display:flex; justify-content:space-between; font-size:0.8rem; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                <span>${item.emoji || '📦'} ${escapeHtml(item.name)} ×${item.quantity}</span>
                <span style="font-weight:700; color:var(--green-400);">₹${item.lineTotal || (item.price * item.quantity)}</span>
              </div>
            `).join('')}
            <button class="btn-primary" style="width:100%; margin-top:10px; font-size:0.82rem; padding:8px;" onclick='app.addBundleToCart(${JSON.stringify(r.items)})'>
              🛒 Add All Ingredients to Cart (₹${r.totalCost})
            </button>
          </div>
        `;
      }

      // 3. Action Confirmation Card (e.g. Budget Plan or Clear Cart)
      if (data.requiresConfirmation && data.pendingAction) {
        const pa = data.pendingAction;
        cardContent += `
          <div class="chat-confirm-box">
            <div class="chat-confirm-title">
              <span>⚠️</span>
              <span>Action Confirmation Required</span>
            </div>
            <p style="font-size:0.8rem; color:var(--text-muted); margin:0 0 8px 0;">
              ${escapeHtml(pa.description || 'Confirm action')}
            </p>
            <div class="chat-confirm-actions">
              <button class="btn-confirm-act" onclick="app.confirmChatAction(true)">
                ${pa.totalCost ? `🛒 Confirm & Add to Cart (₹${pa.totalCost})` : '✓ Confirm'}
              </button>
              <button class="btn-cancel-act" onclick="app.confirmChatAction(false)">✕ Cancel</button>
            </div>
          </div>
        `;
      }

      // 4. Action Buttons (e.g. View Cart, Live Tracking)
      if (data.actions && Array.isArray(data.actions) && data.actions.length > 0 && !data.requiresConfirmation) {
        cardContent += `
          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:10px;">
            ${data.actions.map(act => {
              if (act.type === 'open_product' || act.type === 'view_product') {
                return `<button class="btn-primary" style="padding:6px 12px; font-size:0.78rem;" onclick="app.openProductDetail('${act.payload.productId}')">${escapeHtml(act.label)}</button>`;
              }
              if (act.type === 'open_cart') {
                return `<button class="btn-primary" style="padding:6px 12px; font-size:0.78rem;" onclick="app.openCart()">${escapeHtml(act.label)}</button>`;
              }
              if (act.type === 'open_checkout') {
                return `<button class="btn-checkout" style="padding:6px 12px; font-size:0.78rem;" onclick="app.openCart()">${escapeHtml(act.label)}</button>`;
              }
              if (act.type === 'navigate') {
                return `<button class="btn-primary" style="padding:6px 12px; font-size:0.78rem;" onclick="app.switchView('${act.payload.view || 'store'}')">${escapeHtml(act.label)}</button>`;
              }
              if (act.type === 'query_bot') {
                return `<button class="quick-chip" onclick="app.triggerChatQuery('${escapeHtml(act.payload.query)}')">${escapeHtml(act.label)}</button>`;
              }
              return '';
            }).join('')}
          </div>
        `;
      }

      // 5. RAG / Store Policy Source Citations & Transparency
      const sourcesList = (data.sources && Array.isArray(data.sources) && data.sources.length > 0)
        ? data.sources
        : (data.rag && data.rag.citations ? data.rag.citations : []);
      if (sourcesList.length > 0) {
        cardContent += `
          <div style="margin-top:8px; padding-top:6px; border-top:1px solid rgba(255,255,255,0.08); font-size:0.72rem; color:var(--text-dim);">
            <strong>📖 Grounded Source:</strong> ${escapeHtml(sourcesList.join(' • '))}
          </div>
        `;
      }

      // 6. Dynamic Contextual Suggestion Chips
      if (data.suggestions && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        cardContent += `
          <div class="chat-suggestion-chips">
            ${data.suggestions.map(s => `
              <button class="chat-suggestion-chip" onclick="app.triggerChatQuery('${escapeHtml(s)}')">💡 ${escapeHtml(s)}</button>
            `).join('')}
          </div>
        `;
      }

      // 7. Tool Telemetry & Activity Indicators
      if (data.toolCalls && Array.isArray(data.toolCalls) && data.toolCalls.length > 0) {
        cardContent += `
          <div class="chat-tool-pills">
            ${data.toolCalls.map(tc => `
              <span class="chat-tool-pill" title="Execution latency: ${tc.latencyMs || 0}ms">⚙️ ${escapeHtml(tc.tool)}</span>
            `).join('')}
          </div>
        `;
      }

      botMsg.innerHTML = `
        <div class="msg-bubble bot">
          <div>${formatChatMarkdown(data.message || data.reply || '')}</div>
          ${cardContent}
        </div>
      `;

      container.appendChild(botMsg);
      container.scrollTop = container.scrollHeight;
    } catch (e) {
      botLoading.innerHTML = `<div class="msg-bubble bot" style="color:var(--red-400);">Sorry, trouble processing query. Please check connection and try again.</div>`;
    }
  }

  async function addBundleToCart(items) {
    let addedCount = 0;
    for (const item of items) {
      await addToCart(item.id || item.productId, item.quantity || 1);
      addedCount++;
    }
    openCart();
    showToast(`Added ${addedCount} fresh ingredients to your cart!`);
  }

  async function confirmChatAction(confirmed) {
    try {
      const res = await api('/api/assistant/action/confirm', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: _botConversationId,
          confirmed: Boolean(confirmed)
        })
      });

      const container = $('#freshbot-messages');
      if (container && res.data) {
        const botMsg = document.createElement('div');
        botMsg.className = 'bot-msg';
        botMsg.innerHTML = `
          <div class="msg-bubble bot">
            ${formatChatMarkdown(res.data.message || 'Action executed.')}
          </div>
        `;
        container.appendChild(botMsg);
        container.scrollTop = container.scrollHeight;
      }

      if (confirmed) {
        await loadCart();
        showToast('Cart updated successfully!');
      }
    } catch (e) {
      showToast('Action execution failed');
    }
  }

  async function chatAddToCart(productId, qty = 1, productName = '') {
    await addToCart(productId, qty);
    showToast(`Added ${productName || 'item'} to cart!`);
  }

  function triggerChatQuery(queryText) {
    if (queryText) handleFreshBotMessage(queryText);
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
  function switchView(viewName, subTab, updateHash = true) {
    const storePane = $('#view-storefront');
    const ordersPane = $('#view-orders-page');
    const adminPane = $('#view-admin-page');

    const navStore = $('#view-nav-store');
    const navOrders = $('#view-nav-orders');
    const navAdmin = $('#view-nav-admin');

    // Admin access navigates to the dedicated ML & Operations Suite
    if (viewName === 'admin') {
      window.location.href = '/admin.html';
      return;
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
      if (updateHash) {
        updateNavigationUrl();
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleHashRouting() {
    const rawHash = (window.location.hash || '').replace('#', '').trim();
    if (!rawHash || rawHash.startsWith('store') || rawHash === 'catalog') {
      const hadNav = readNavigationFromUrl();
      switchView('store', null, false);
      if (hadNav) {
        renderCategorySelector();
        loadProducts(state.currentPage || 1);
      }
    } else if (rawHash === 'orders') {
      switchView('orders');
    } else if (rawHash.startsWith('admin')) {
      const parts = rawHash.split('-');
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
      state.ordersList = orders;
      const latest = orders[0];
      state.lastPlacedOrder = latest;
      if ($('#tracker-order-id-label')) {
        $('#tracker-order-id-label').textContent = `Order #${latest.id} • ${state.currentHub || 'Bandra West Express (HUB-01)'}`;
      }
      setTimeout(renderLiveCourierRadar, 150);

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
            📍 <strong>Delivery Address:</strong> ${escapeHtml(o.shippingAddress || o.address || 'Indiranagar 100ft Road, Bengaluru')}
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;">
            <div style="font-size:0.8rem; color:var(--text-dim);">
              💳 Paid via ${(o.paymentMethod || 'UPI').toUpperCase()} • ⚡ 10-Min Fast Dispatch
            </div>
            <div style="display:flex; gap:8px;">
              <button class="btn-secondary" style="padding:5px 12px; font-size:0.78rem;" onclick="app.openInvoiceModalById('${o.id}')">📄 Invoice</button>
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
    window.addEventListener('popstate', handleHashRouting);

    // Search (Handled by setupSearchAutocomplete)

    // Modals & Utilities
    on('#barcode-scan-top-btn', 'click', openBarcodeScanner);
    on('#prime-vip-top-btn', 'click', openLoyaltyModal);
    on('#location-picker-btn', 'click', openHubSwitcher);
    on('#cart-btn', 'click', openCart);
    on('#cart-close', 'click', closeCart);
    on('#cart-overlay', 'click', closeCart);
    on('#wishlist-btn', 'click', openWishlistModal);
    on('#compare-btn', 'click', openCompareModal);
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

    // Language & Theme & Accent & Notifications
    on('#lang-toggle-btn', 'click', (e) => {
      e.stopPropagation();
      toggleLanguage();
    });
    $$('#lang-dropdown-menu .popover-item').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        setLanguage(btn.dataset.setLang);
      };
    });

    on('#accent-picker-btn', 'click', (e) => {
      e.stopPropagation();
      const menu = $('#accent-dropdown-menu');
      if (menu) {
        menu.classList.toggle('open');
        const langMenu = $('#lang-dropdown-menu');
        if (langMenu) langMenu.classList.remove('open');
      }
    });
    $$('#accent-dropdown-menu .popover-item').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        setAccent(btn.dataset.setAccent);
      };
    });

    // Close popovers on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#lang-toggle-btn') && !e.target.closest('#lang-dropdown-menu')) {
        const menu = $('#lang-dropdown-menu');
        if (menu) menu.classList.remove('open');
      }
      if (!e.target.closest('#accent-picker-btn') && !e.target.closest('#accent-dropdown-menu')) {
        const menu = $('#accent-dropdown-menu');
        if (menu) menu.classList.remove('open');
      }
    });

    on('#theme-toggle-btn', 'click', toggleTheme);

    // Notification Center Listeners
    on('#notification-bell-btn', 'click', openNotificationDrawer);
    on('#notification-overlay', 'click', closeNotificationDrawer);
    on('#notif-close-btn', 'click', closeNotificationDrawer);
    on('#notif-mark-all-read', 'click', markAllNotificationsRead);
    on('#notif-clear-all', 'click', clearAllNotifications);

    $$('.notification-tab-btn').forEach(tab => {
      tab.onclick = () => {
        $$('.notification-tab-btn').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderNotifications(tab.dataset.filter);
      };
    });

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
  // Multimodal Snap Your Fridge AI Scanner & Visual Feature Matcher
  // ----------------------------------------------------
  let currentFridgeData = null;

  function switchVisionTab(tab) {
    const tabFridge = $('#vision-tab-fridge');
    const tabSearch = $('#vision-tab-search');
    const paneFridge = $('#vision-pane-fridge');
    const paneSearch = $('#vision-pane-search');

    if (tab === 'search') {
      if (tabFridge) tabFridge.classList.remove('active');
      if (tabSearch) tabSearch.classList.add('active');
      if (paneFridge) paneFridge.style.display = 'none';
      if (paneSearch) paneSearch.style.display = 'block';
      runVisualSearch('red apple');
    } else {
      if (tabSearch) tabSearch.classList.remove('active');
      if (tabFridge) tabFridge.classList.add('active');
      if (paneSearch) paneSearch.style.display = 'none';
      if (paneFridge) paneFridge.style.display = 'block';
      runFridgeScan('breakfast_depleted');
    }
  }

  function setupSmartFridgeScanner() {
    const fridgeBtn = $('#fridge-scan-btn');
    const searchVisualBtn = $('#visual-search-btn');
    const fridgeModal = $('#fridge-modal-overlay');
    const fridgeClose = $('#fridge-close');
    const fileInput = $('#fridge-file-input');
    const presetBtns = document.querySelectorAll('.fridge-preset-btn');
    const addAllBtn = $('#fridge-add-all-btn');

    if (fridgeBtn) {
      fridgeBtn.onclick = () => {
        if (fridgeModal) fridgeModal.style.display = 'flex';
        switchVisionTab('fridge');
      };
    }

    if (searchVisualBtn) {
      searchVisualBtn.onclick = () => {
        if (fridgeModal) fridgeModal.style.display = 'flex';
        switchVisionTab('search');
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
          runFridgeScan('weekly_restock', e.target.files[0].name);
        }
      };
    }

    if (addAllBtn) {
      addAllBtn.onclick = () => {
        if (!currentFridgeData) return;
        const items = currentFridgeData.replenishment_items || currentFridgeData.missingEssentials || [];
        if (items.length === 0) return;
        items.forEach(item => {
          const pid = item.product_id || item.id;
          if (pid) addToCart(pid, 1);
        });
        showToast(`⚡ Added ${items.length} replenishment essentials to cart with 10% AI bundle discount!`);
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
        body: JSON.stringify({ presetKey, sceneKey: presetKey, customPrompt })
      });

      setTimeout(() => {
        if (radar) radar.style.display = 'none';
        if (resultsBox) resultsBox.style.display = 'block';
        currentFridgeData = res;

        const sceneTitle = res.scene_title || res.scene?.title || 'Refrigerator Depletion Scene';
        if ($('#fridge-result-title')) $('#fridge-result-title').textContent = sceneTitle;
        const confText = res.urgency_score ? `Urgency: ${Math.round(res.urgency_score * 100)}% • ${res.replenishment_items?.length || 3} Items Low` : `Confidence: ${res.scene?.overallConfidence || '95%'} • ${res.missingEssentialsCount || 3} Items Low`;
        if ($('#fridge-confidence-badge')) $('#fridge-confidence-badge').textContent = confText;

        const bundlePrice = res.financialSummary?.finalBundlePrice || 285.00;
        if ($('#fridge-bundle-price')) $('#fridge-bundle-price').textContent = `₹${bundlePrice.toFixed ? bundlePrice.toFixed(2) : bundlePrice}`;

        // Bounding boxes
        const boxesContainer = $('#fridge-bounding-boxes-container');
        if (boxesContainer && res.detected_regions) {
          boxesContainer.innerHTML = res.detected_regions.map(r => `
            <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.4); border-radius:var(--radius-sm); padding:10px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="font-size:0.85rem; color:#ef4444;">🚨 ${escapeHtml(r.label)}</strong>
                <span style="font-size:0.7rem; background:${r.action === 'MONITOR' ? '#eab308' : '#ef4444'}; color:#fff; padding:1px 6px; border-radius:4px; font-weight:700;">${r.action}</span>
              </div>
              <small style="display:block; color:var(--text-dim); margin-top:4px;">Conf: ${Math.round((r.confidence || 0.9) * 100)}% • Box: [${(r.box || []).join(', ')}]</small>
            </div>
          `).join('');
        }

        // Replenishment items list
        const list = $('#fridge-detected-items-list');
        const items = res.replenishment_items || res.missingEssentials || [];
        if (list && items.length > 0) {
          list.innerHTML = items.map(item => {
            const pid = item.product_id || item.id;
            const p = state.products.find(x => x.id === pid) || {};
            const price = item.price || p.price || 65;
            const unit = item.unit || p.unit || 'pack';
            return `
              <div style="background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); padding:8px 12px; border-radius:var(--radius-sm); display:flex; justify-content:space-between; align-items:center; font-size:0.82rem;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span style="font-size:1.3rem;">${item.image || p.emoji || '🛒'}</span>
                  <div>
                    <strong>${escapeHtml(item.name || p.name || 'Replenishment Item')}</strong>
                    <small style="display:block; color:var(--text-dim);">${item.category || item.reason || 'Depleted Stock'}</small>
                  </div>
                </div>
                <div style="text-align:right;">
                  <strong style="color:var(--green-400);">₹${price}</strong>
                  <small style="display:block; color:var(--text-dim);">/${unit}</small>
                </div>
              </div>
            `;
          }).join('');
        }
      }, 400);
    } catch (e) {
      if (radar) radar.style.display = 'none';
      showToast('Fridge scan error: ' + e.message, 'error');
    }
  }

  async function runVisualSearch(queryHint = '') {
    const input = $('#visual-search-query-input');
    const query = (queryHint || (input ? input.value : '') || 'red apple').trim();
    if (input) input.value = query;

    const vecBox = $('#visual-feature-vector-box');
    const grid = $('#visual-search-matches-grid');

    if (grid) {
      grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:20px; color:var(--text-dim);"><span class="pulse-dot"></span> Extracting 5-channel visual features...</div>';
    }

    try {
      const res = await api('/api/visual/search', {
        method: 'POST',
        body: JSON.stringify({ queryHint: query, top_k: 4 })
      });

      if (res && res.data) {
        if (vecBox) {
          vecBox.style.display = 'block';
          vecBox.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <strong style="font-size:0.82rem; color:var(--green-400);">🧬 5-Channel Dominant Color & Moment Feature Vector:</strong>
              <small style="color:var(--text-dim); font-size:0.75rem;">Metric: Cosine Distance</small>
            </div>
            <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:8px; text-align:center; font-size:0.75rem;">
              <div style="background:rgba(239,68,68,0.15); padding:6px; border-radius:4px; border:1px solid rgba(239,68,68,0.3); color:#fca5a5;">
                <span style="display:block; font-weight:700;">Red (R)</span>
                <code>0.824</code>
              </div>
              <div style="background:rgba(34,197,94,0.15); padding:6px; border-radius:4px; border:1px solid rgba(34,197,94,0.3); color:#86efac;">
                <span style="display:block; font-weight:700;">Green (G)</span>
                <code>0.195</code>
              </div>
              <div style="background:rgba(59,130,246,0.15); padding:6px; border-radius:4px; border:1px solid rgba(59,130,246,0.3); color:#93c5fd;">
                <span style="display:block; font-weight:700;">Blue (B)</span>
                <code>0.180</code>
              </div>
              <div style="background:rgba(234,179,8,0.15); padding:6px; border-radius:4px; border:1px solid rgba(234,179,8,0.3); color:#fde047;">
                <span style="display:block; font-weight:700;">Brightness</span>
                <code>0.385</code>
              </div>
              <div style="background:rgba(168,85,247,0.15); padding:6px; border-radius:4px; border:1px solid rgba(168,85,247,0.3); color:#d8b4fe;">
                <span style="display:block; font-weight:700;">Saturation</span>
                <code>0.781</code>
              </div>
            </div>
          `;
        }

        if (grid) {
          grid.innerHTML = res.data.map(m => {
            const p = state.products.find(x => x.id === m.id || x.id === m.product_id) || {};
            const sim = m.similarity_score !== undefined ? (m.similarity_score * 100).toFixed(1) : (m.confidence !== undefined ? m.confidence : 92);
            return `
              <div class="vision-match-card">
                <img class="vision-match-thumb" src="${m.image_url || p.image_url || '/images/products/grocery-default.svg'}" alt="${escapeHtml(m.name)}" onerror="handleImageError(this, '')">
                <strong style="display:block; font-size:0.85rem; margin-bottom:2px;">${escapeHtml(m.name)}</strong>
                <span style="font-size:0.75rem; color:var(--green-400); font-weight:700; display:block; margin-bottom:6px;">⭐ ${sim}% Visual Match</span>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                  <strong style="color:var(--text-main); font-size:0.9rem;">₹${m.price || p.price || 99}</strong>
                  <button class="btn-add-cart" style="padding:4px 10px; font-size:0.78rem;" onclick="app.addToCart('${m.id || m.product_id || p.id}')">+ Add</button>
                </div>
              </div>
            `;
          }).join('');
        }
      }
    } catch (e) {
      if (grid) grid.innerHTML = '<div style="grid-column:1/-1; color:var(--text-muted); text-align:center; padding:20px;">Could not complete visual search: ' + escapeHtml(e.message) + '</div>';
    }
  }

  function triggerVisualSample(query) {
    runVisualSearch(query);
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
  // Phase 5E: Family-Scoped Product Comparison Matrix Module
  // ----------------------------------------------------
  function getProductFamily(product) {
    if (!product) return 'General Catalog';
    return product.product_family || product.subcategory || product.category || 'General Catalog';
  }

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
      if (state.compareList.length === 0) {
        state.compareFamily = null;
        localStorage.removeItem('freshcart_compare_family');
      }
      showToast('Removed from Comparison');
    } else {
      if (state.compareList.length >= 4) {
        showToast('Maximum 4 products can be compared at once', 'error');
        return;
      }

      // Identify product data to determine product family scope
      const prod = (state.products || []).find(p => p.id === productId) ||
                   (state.recommendedProducts || []).find(p => p.id === productId);
      const incomingFamily = getProductFamily(prod);

      // Enforce product-family-scoped comparison invariant
      if (state.compareList.length > 0 && state.compareFamily) {
        if (incomingFamily !== state.compareFamily) {
          showToast(`⚠️ Family Mismatch: Can only compare within "${state.compareFamily}". Clear comparison to compare "${incomingFamily}".`, 'error');
          return;
        }
      }

      if (state.compareList.length === 0) {
        state.compareFamily = incomingFamily;
        localStorage.setItem('freshcart_compare_family', incomingFamily);
      }

      state.compareList.push(productId);
      showToast(`Added to Comparison (${incomingFamily}) ⚖️`);
    }

    localStorage.setItem('freshcart_compare', JSON.stringify(state.compareList));
    updateCompareBadge();
    renderProductsGrid();
    renderRecommendationsGrid();
  }

  function removeFromCompare(productId) {
    if (!state.compareList) return;
    const idx = state.compareList.indexOf(productId);
    if (idx >= 0) {
      state.compareList.splice(idx, 1);
      if (state.compareList.length === 0) {
        state.compareFamily = null;
        localStorage.removeItem('freshcart_compare_family');
      }
      localStorage.setItem('freshcart_compare', JSON.stringify(state.compareList));
      updateCompareBadge();
      renderProductsGrid();
      renderRecommendationsGrid();
      openCompareModal();
      showToast('Item removed from comparison');
    }
  }

  async function openCompareModal() {
    const modal = $('#compare-modal-overlay');
    const content = $('#compare-matrix-content');
    const bannerBox = $('#compare-family-banner-container');
    if (!modal || !content) return;

    if (!state.compareList || state.compareList.length === 0) {
      if (bannerBox) {
        bannerBox.style.display = 'none';
        bannerBox.innerHTML = '';
      }
      content.innerHTML = `
        <div style="text-align:center; padding:36px 20px; color:var(--text-muted);">
          <span style="font-size:2.8rem; display:block; margin-bottom:10px;">⚖️</span>
          <h4 style="color:#fff; margin-bottom:6px;">No Products Selected for Comparison</h4>
          <p style="font-size:0.88rem; max-width:480px; margin:0 auto 12px; color:var(--text-dim);">
            Click the <strong>⚖️ Compare</strong> button on up to 4 product cards, or select multiple checkboxes and click <strong>⚖️ Compare Selected</strong>.
          </p>
          <small style="display:inline-block; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.25); color:var(--green-400); padding:4px 12px; border-radius:9999px;">
            🔒 Family Scoped: Comparisons are restricted to the same product family for side-by-side attribute alignment.
          </small>
        </div>
      `;
      modal.style.display = 'flex';
      return;
    }

    // Loading State
    content.innerHTML = `
      <div style="text-align:center; padding:40px; color:var(--text-muted);">
        <span class="pulse-dot" style="margin-right:8px;"></span> Loading side-by-side comparison matrix...
      </div>
    `;
    modal.style.display = 'flex';

    try {
      const res = await api('/api/recommendations/compare', {
        method: 'POST',
        body: JSON.stringify({ productIds: state.compareList })
      });

      if (!res.products || res.products.length === 0) {
        content.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:24px;">Could not load product comparison details.</p>';
        return;
      }

      const prods = res.products;
      const commonFamily = res.product_family || prods[0].product_family || state.compareFamily || 'General Catalog';

      // Render Family Scope Banner
      if (bannerBox) {
        bannerBox.innerHTML = `
          <div class="compare-family-banner">
            <span class="compare-family-badge">🏷️ Product Family: ${escapeHtml(commonFamily)}</span>
            <span class="compare-scope-tag">Comparing ${prods.length} of max 4 items</span>
          </div>
        `;
        bannerBox.style.display = 'block';
      }

      // Check if food / grocery attributes apply
      const hasNutrition = prods.some(p => p.nutrition_grade);
      const hasStorage = prods.some(p => p.storage_information || p.shelf_life_claim);
      const hasDietary = prods.some(p => (p.tags && p.tags.length > 0) || p.isOrganic || p.isHighProtein || p.isKeto);
      const hasTechnicalSpecs = prods.some(p => p.technical_specs && Object.keys(p.technical_specs).length > 0);

      content.innerHTML = `
        <div style="background:rgba(16,185,129,0.08); border:1px solid var(--border-active); padding:12px 16px; border-radius:var(--radius-md); margin-bottom:14px; font-size:0.88rem;">
          <strong>🧠 AI Summary Verdict:</strong>
          <span style="color:var(--green-400);">${res.aiVerdict}</span>
        </div>

        <table class="compare-table">
          <thead>
            <tr>
              <th>Product</th>
              ${prods.map(p => `
                <td class="compare-product-col-header">
                  <button class="compare-remove-btn" onclick="app.removeFromCompare('${p.id}')" title="Remove from comparison">✕</button>
                  <div class="cart-item-img-container" style="margin:0 auto 8px; width:56px; height:56px;">
                    <img class="cart-item-img"
                         src="${p.primary_image_url || p.image_url || '/images/products/grocery-default.svg'}"
                         alt="${escapeHtml(p.name)}"
                         onerror="handleImageError(this, '${p.category || ''}')">
                  </div>
                  <strong style="display:block; font-size:0.92rem; line-height:1.3; margin-bottom:4px;">${escapeHtml(p.name)}</strong>
                  ${p.brand ? `<small style="color:var(--text-dim); display:block; margin-bottom:4px;">${escapeHtml(p.brand)}</small>` : ''}
                  ${p.id === res.highlights?.bestValueId ? '<span class="compare-highlight-badge badge-best-value">🏆 Best Value</span>' : ''}
                  ${p.id === res.highlights?.topRatedId ? '<span class="compare-highlight-badge badge-top-rated">⭐ Top Rated</span>' : ''}
                </td>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Price & Pack</th>
              ${prods.map(p => `
                <td>
                  <strong style="color:${p.id === res.highlights?.bestValueId ? 'var(--green-400)' : 'var(--text-light)'}; font-size:1.05rem;">
                    ₹${p.price}
                  </strong>
                  <span style="color:var(--text-dim); font-size:0.85rem;"> / ${p.package_size || p.unit || 'unit'}</span>
                  ${p.mrp && p.mrp > p.price ? `<div style="font-size:0.75rem; color:var(--text-dim); text-decoration:line-through;">MRP: ₹${p.mrp}</div>` : ''}
                </td>
              `).join('')}
            </tr>

            <tr>
              <th>Customer Rating</th>
              ${prods.map(p => `
                <td>
                  <span style="font-weight:${p.id === res.highlights?.topRatedId ? '700' : '500'}; color:${p.id === res.highlights?.topRatedId ? '#fbbf24' : 'inherit'};">
                    ⭐ ${p.rating || 4.5} / 5.0
                  </span>
                </td>
              `).join('')}
            </tr>

            <tr>
              <th>Stock Status</th>
              ${prods.map(p => `
                <td>
                  ${p.stock > 0
                    ? `<span style="color:var(--green-400);">✅ In Stock (${p.stock})</span>`
                    : '<span style="color:#ef4444;">❌ Out of Stock</span>'}
                </td>
              `).join('')}
            </tr>

            <tr>
              <th>Brand</th>
              ${prods.map(p => `<td>${escapeHtml(p.brand || 'FreshCart Verified')}</td>`).join('')}
            </tr>

            <tr>
              <th>Product Family</th>
              ${prods.map(p => `<td><span class="compare-family-badge" style="font-size:0.75rem;">${escapeHtml(p.product_family || commonFamily)}</span></td>`).join('')}
            </tr>

            ${hasNutrition ? `
              <tr>
                <th>Nutri-Score Grade</th>
                ${prods.map(p => `
                  <td>
                    ${p.nutrition_grade
                      ? `<span class="attr-chip chip-nutri nutri-${p.nutrition_grade.toLowerCase()}">Nutri-Score ${p.nutrition_grade.toUpperCase()}</span>`
                      : '<span style="color:var(--text-dim); font-size:0.8rem;">Not Graded</span>'}
                  </td>
                `).join('')}
              </tr>
            ` : ''}

            ${hasDietary ? `
              <tr>
                <th>Dietary Tags</th>
                ${prods.map(p => {
                  const tagChips = (p.tags || []).slice(0, 3).map(t =>
                    `<span class="attr-chip chip-diet" style="margin-bottom:2px;">${escapeHtml(String(t))}</span>`
                  );
                  if (p.isOrganic && !p.tags?.includes('organic')) {
                    tagChips.unshift('<span class="attr-chip chip-diet">Organic</span>');
                  }
                  return `<td>${tagChips.length > 0 ? tagChips.join(' ') : '<span style="color:var(--text-dim); font-size:0.8rem;">Standard</span>'}</td>`;
                }).join('')}
              </tr>
            ` : ''}

            ${hasStorage ? `
              <tr>
                <th>Storage & Shelf Life</th>
                ${prods.map(p => `
                  <td style="font-size:0.82rem; color:var(--text-dim);">
                    ${escapeHtml(p.storage_information || p.shelf_life_claim || 'Standard ambient storage')}
                  </td>
                `).join('')}
              </tr>
            ` : ''}

            ${hasTechnicalSpecs ? `
              <tr>
                <th>Key Specifications</th>
                ${prods.map(p => {
                  const specs = p.technical_specs || {};
                  const entries = Object.entries(specs)
                    .filter(([k, v]) => v && v !== 'NOT_AVAILABLE' && v !== 'UNKNOWN' && v !== 'null')
                    .slice(0, 3);
                  if (entries.length === 0) return '<td style="color:var(--text-dim); font-size:0.8rem;">Standard Spec</td>';
                  return `
                    <td style="font-size:0.8rem;">
                      ${entries.map(([k, v]) => `<div><strong>${escapeHtml(k.replace(/_/g, ' '))}:</strong> ${escapeHtml(String(v))}</div>`).join('')}
                    </td>
                  `;
                }).join('')}
              </tr>
            ` : ''}

            <tr>
              <th>Action</th>
              ${prods.map(p => `
                <td>
                  <button class="btn-primary"
                          style="padding:7px 12px; font-size:0.82rem; width:100%;"
                          onclick="app.addToCart('${p.id}')"
                          ${p.stock <= 0 ? 'disabled style="opacity:0.5;"' : ''}>
                    ${p.stock <= 0 ? 'Out of Stock' : '+ Add to Cart'}
                  </button>
                </td>
              `).join('')}
            </tr>
          </tbody>
        </table>
      `;
    } catch (e) {
      content.innerHTML = `
        <div style="text-align:center; padding:30px; color:#ef4444;">
          <p>Failed to load comparison: ${escapeHtml(e.message)}</p>
          <button class="btn-secondary" onclick="app.openCompareModal()" style="margin-top:10px;">Retry</button>
        </div>
      `;
    }
  }

  function closeCompareModal() {
    const modal = $('#compare-modal-overlay');
    if (modal) modal.style.display = 'none';
  }

  function clearCompareList() {
    state.compareList = [];
    state.compareFamily = null;
    localStorage.removeItem('freshcart_compare');
    localStorage.removeItem('freshcart_compare_family');
    updateCompareBadge();
    openCompareModal();
    renderProductsGrid();
    renderRecommendationsGrid();
    showToast('Comparison cleared');
  }

  // ----------------------------------------------------
  // Phase 5E: Multi-Select Product Checkboxes & Bulk Actions Dock Module
  // ----------------------------------------------------
  function toggleProductSelection(productId, isChecked) {
    if (!state.selectedProductIds) state.selectedProductIds = new Set();

    if (isChecked) {
      state.selectedProductIds.add(productId);
    } else {
      state.selectedProductIds.delete(productId);
    }

    // Synchronize DOM card visual styling
    const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
    if (card) {
      card.classList.toggle('card--selected', isChecked);
      const cb = card.querySelector('.product-select-checkbox');
      if (cb && cb.checked !== isChecked) cb.checked = isChecked;
    }

    updateBulkActionBar();
  }

  function selectAllProductsInView() {
    if (!state.selectedProductIds) state.selectedProductIds = new Set();
    const cards = document.querySelectorAll('#products-grid .product-card[data-product-id]');
    let count = 0;

    cards.forEach(card => {
      const id = card.getAttribute('data-product-id');
      if (id) {
        state.selectedProductIds.add(id);
        card.classList.add('card--selected');
        const cb = card.querySelector('.product-select-checkbox');
        if (cb) cb.checked = true;
        count++;
      }
    });

    updateBulkActionBar();
    showToast(`Selected ${count} visible items`);
  }

  function clearProductSelection() {
    if (state.selectedProductIds) state.selectedProductIds.clear();
    document.querySelectorAll('.product-card.card--selected').forEach(c => c.classList.remove('card--selected'));
    document.querySelectorAll('.product-select-checkbox').forEach(cb => cb.checked = false);
    updateBulkActionBar();
    showToast('Product selection cleared');
  }

  function updateBulkActionBar() {
    const bar = $('#bulk-actions-bar');
    if (!bar) return;

    const count = state.selectedProductIds ? state.selectedProductIds.size : 0;
    if (count === 0) {
      bar.classList.remove('visible');
      return;
    }

    // Calculate total price of selected items
    let totalPrice = 0;
    const selectedArr = Array.from(state.selectedProductIds);
    selectedArr.forEach(id => {
      const prod = (state.products || []).find(p => p.id === id) ||
                   (state.recommendedProducts || []).find(p => p.id === id);
      if (prod && prod.price) totalPrice += prod.price;
    });

    const countBadge = $('#bulk-selected-count');
    const totalBadge = $('#bulk-selected-total');
    const addCartBtn = $('#bulk-add-cart-btn');
    const compareBtn = $('#bulk-compare-btn');

    if (countBadge) countBadge.textContent = `${count} item${count === 1 ? '' : 's'} selected`;
    if (totalBadge) totalBadge.textContent = totalPrice > 0 ? `₹${totalPrice}` : '';
    if (addCartBtn) addCartBtn.textContent = `🛒 Add (${count}) to Cart`;
    if (compareBtn) {
      compareBtn.textContent = `⚖️ Compare (${count})`;
      compareBtn.disabled = count < 2 || count > 4;
      compareBtn.title = (count >= 2 && count <= 4)
        ? 'Compare selected items within same family'
        : 'Select 2 to 4 items to compare';
    }

    bar.classList.add('visible');
  }

  async function bulkAddToCart() {
    if (!state.selectedProductIds || state.selectedProductIds.size === 0) {
      showToast('No products selected for bulk add', 'error');
      return;
    }

    const ids = Array.from(state.selectedProductIds);
    const addBtn = $('#bulk-add-cart-btn');
    if (addBtn) {
      addBtn.disabled = true;
      addBtn.textContent = 'Adding to cart...';
    }

    try {
      const res = await api('/api/cart/bulk-add', {
        method: 'POST',
        body: JSON.stringify({ productIds: ids })
      });

      if (res && res.success) {
        state.cart = res.data;
        updateCartUI();
        syncProductCardSteppers();
        showToast(res.message || `Added ${res.addedCount} items to cart 🛒`);
        clearProductSelection();
        openCart();
      } else {
        showToast(res?.message || 'Failed to add items to cart', 'error');
      }
    } catch (e) {
      // Graceful fallback to sequential addToCart
      let added = 0;
      for (const id of ids) {
        await addToCart(id, 1);
        added++;
      }
      showToast(`Added ${added} items to cart 🛒`);
      clearProductSelection();
    } finally {
      if (addBtn) addBtn.disabled = false;
    }
  }

  async function bulkCompare() {
    if (!state.selectedProductIds || state.selectedProductIds.size < 2) {
      showToast('Please select at least 2 items to compare', 'error');
      return;
    }
    if (state.selectedProductIds.size > 4) {
      showToast('Maximum 4 items can be compared at once', 'error');
      return;
    }

    const ids = Array.from(state.selectedProductIds);
    const selectedProducts = ids.map(id => {
      return (state.products || []).find(p => p.id === id) ||
             (state.recommendedProducts || []).find(p => p.id === id);
    }).filter(Boolean);

    // Enforce family consistency across all bulk selected items
    const families = Array.from(new Set(selectedProducts.map(p => getProductFamily(p))));
    if (families.length > 1) {
      showToast(`⚠️ Cannot compare across different families: ${families.join(' vs ')}. Select items from the same product family.`, 'error');
      return;
    }

    state.compareList = ids;
    state.compareFamily = families[0] || null;
    localStorage.setItem('freshcart_compare', JSON.stringify(state.compareList));
    if (state.compareFamily) {
      localStorage.setItem('freshcart_compare_family', state.compareFamily);
    }
    updateCompareBadge();
    clearProductSelection();
    openCompareModal();
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

      dropdown.innerHTML = `
        <div class="search-drop-loading">
          <span class="pulse-dot" style="margin-right:8px;"></span> Searching 10,000+ items...
        </div>
      `;
      dropdown.style.display = 'block';

      debounceTimer = setTimeout(async () => {
        try {
          const sugParams = new URLSearchParams({
            q: val,
            limit: 6,
            ...(state.currentDepartment && state.currentDepartment !== 'all' ? { department: state.currentDepartment } : {}),
            ...(state.currentSubcategory && state.currentSubcategory !== 'all' ? { subcategory: state.currentSubcategory } : {}),
            ...(state.currentProductFamily && state.currentProductFamily !== 'all' ? { product_family: state.currentProductFamily } : {})
          });
          const res = await api(`/api/search/suggestions?${sugParams.toString()}`);
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
            currentSuggestions = [];
            dropdown.innerHTML = `
              <div class="search-empty-state">
                <p>No products found for "<strong>${escapeHtml(val)}</strong>"</p>
                <div class="search-empty-pills">
                  <button class="search-empty-pill" onclick="app.applySearchSuggestion('Milk')">🥛 Milk</button>
                  <button class="search-empty-pill" onclick="app.applySearchSuggestion('Apples')">🍎 Apples</button>
                  <button class="search-empty-pill" onclick="app.applySearchSuggestion('Bread')">🍞 Bread</button>
                  <button class="search-empty-pill" onclick="app.applySearchSuggestion('Chips')">🥔 Chips</button>
                  <button class="search-empty-pill" onclick="app.applySearchSuggestion('Organic')">🌱 Organic</button>
                </div>
              </div>
            `;
            dropdown.style.display = 'block';
          }
        } catch (err) {
          dropdown.innerHTML = '<div class="search-empty-state"><p>Search is momentarily unavailable. Please try again.</p></div>';
          dropdown.style.display = 'block';
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

  // ----------------------------------------------------
  // Audio Chime Synthesizer (Barcode & Alert Sounds)
  // ----------------------------------------------------
  function playBarcodeBeep() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1850, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  }

  // ----------------------------------------------------
  // 1. Web Barcode & QR Scanner
  // ----------------------------------------------------
  let barcodeStream = null;

  function openBarcodeScanner() {
    const modal = $('#barcode-scanner-modal');
    if (modal) modal.style.display = 'flex';
    const video = $('#barcode-video-stream');
    const placeholder = $('#barcode-camera-placeholder');

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && video) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          barcodeStream = stream;
          video.srcObject = stream;
          video.style.display = 'block';
          if (placeholder) placeholder.style.display = 'none';
        })
        .catch(() => {
          if (placeholder) {
            placeholder.style.display = 'block';
            placeholder.innerHTML = `
              <span style="font-size:2.4rem; display:block; margin-bottom:8px;">📷</span>
              <strong style="color:var(--text-main); display:block; margin-bottom:4px;">Barcode Reticle Simulation Active</strong>
              <small>Click any sample product below to simulate immediate scanning</small>
            `;
          }
        });
    }
  }

  function closeBarcodeScanner() {
    const modal = $('#barcode-scanner-modal');
    if (modal) modal.style.display = 'none';
    if (barcodeStream) {
      barcodeStream.getTracks().forEach(track => track.stop());
      barcodeStream = null;
    }
    const video = $('#barcode-video-stream');
    if (video) video.style.display = 'none';
  }

  function simulateBarcodeScan(productId) {
    playBarcodeBeep();
    addToCart(productId, 1);
    const prod = state.products.find(p => p.id === productId);
    showToast(`⚡ Barcode Scanned: ${prod ? prod.name : 'Product'} added to cart!`);
    triggerConfetti({ count: 40, x: 0.5, y: 0.5 });
    closeBarcodeScanner();
  }

  // ----------------------------------------------------
  // 2. Hyperlocal Dark Store Hub Switcher
  // ----------------------------------------------------
  async function openHubSwitcher() {
    const modal = $('#hub-switcher-modal');
    if (modal) modal.style.display = 'flex';
    await renderDarkStoreList();
  }

  function closeHubSwitcher() {
    const modal = $('#hub-switcher-modal');
    if (modal) modal.style.display = 'none';
  }

  async function renderDarkStoreList() {
    const list = $('#dark-store-cards-list');
    if (!list) return;
    list.innerHTML = '<div style="text-align:center; padding:16px; color:var(--text-dim);">Loading fulfillment hubs...</div>';

    try {
      const res = await api('/api/dark-stores');
      const hubs = res.data || [];
      list.innerHTML = hubs.map(h => {
        const isCurrent = (state.currentHub || '').includes(h.code) || (state.currentHub || '').includes(h.name);
        return `
          <div style="background:rgba(255,255,255,${isCurrent ? '0.08' : '0.03'}); border:1px solid ${isCurrent ? 'var(--green-500)' : 'var(--border-subtle)'}; border-radius:var(--radius-md); padding:14px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="badge-tag" style="background:rgba(16,185,129,0.15); color:var(--green-400);">${h.code}</span>
                <strong style="color:var(--text-main); font-size:0.95rem;">${h.name}</strong>
              </div>
              <small style="color:var(--text-dim); display:block; margin:3px 0;">${h.address} • Pincode: ${h.pincode}</small>
              <div style="display:flex; gap:10px; font-size:0.78rem; color:var(--green-400);">
                <span>🛵 ${h.activeCouriers} Active Couriers</span>
                <span>⚡ 10-Min SLA</span>
              </div>
            </div>
            <div>
              <button class="btn-${isCurrent ? 'secondary' : 'primary'}" style="padding:6px 14px; font-size:0.8rem;" onclick="app.selectHub('${h.id}', '${h.name} (${h.code})', '8 Mins')">
                ${isCurrent ? 'Selected ✅' : 'Select Hub'}
              </button>
            </div>
          </div>
        `;
      }).join('');
    } catch (e) {
      list.innerHTML = '<div style="color:#ef4444; padding:12px;">Failed to load dark stores.</div>';
    }
  }

  function selectHub(hubId, hubName, eta) {
    state.currentHub = hubName;
    state.hubEta = eta || '9 Mins';
    const locEl = $('#current-location-text');
    if (locEl) {
      locEl.innerHTML = `
        <span class="location-title">Delivery in ${eta}</span>
        <span class="location-sub">📍 ${hubName}</span>
      `;
    }
    showToast(`📍 Switched to ${hubName} (${eta} ETA)`);
    closeHubSwitcher();
  }

  async function locateByPincode() {
    const pinInput = $('#hub-pincode-input');
    const pin = pinInput ? pinInput.value.trim() : '';
    if (!pin) {
      showToast('Please enter a valid 6-digit Mumbai Pincode', 'error');
      return;
    }
    try {
      const res = await api('/api/dark-stores/locate', {
        method: 'POST',
        body: JSON.stringify({ pincode: pin })
      });
      if (res.data) {
        const h = res.data;
        selectHub(h.id, `${h.name} (${h.code})`, `${h.estimatedMinutes} Mins`);
      }
    } catch (e) {
      showToast('Could not resolve pincode', 'error');
    }
  }

  // ----------------------------------------------------
  // 3. FreshCart Prime VIP Loyalty & Rewards
  // ----------------------------------------------------
  async function openLoyaltyModal() {
    const modal = $('#loyalty-prime-modal');
    if (modal) modal.style.display = 'flex';
    try {
      const res = await api('/api/loyalty/profile');
      if (res.data) {
        const d = res.data;
        const tierName = $('#vip-tier-name');
        if (tierName) tierName.textContent = `Prime ${d.tier} Member`;
        const badgeIcon = $('#vip-badge-icon');
        if (badgeIcon) badgeIcon.textContent = d.badge;
        const pointsVal = $('#vip-points-val');
        if (pointsVal) pointsVal.textContent = `${d.points.toLocaleString()} Pts`;
        const nextLabel = $('#vip-next-tier-label');
        if (nextLabel) nextLabel.textContent = d.nextTier === 'Max Tier' ? 'VIP Maximum Tier' : `${d.nextTier} (${d.nextThreshold} Pts)`;
        const fill = $('#vip-progress-fill');
        if (fill) fill.style.width = `${Math.min(100, Math.max(10, d.progressPct))}%`;
        const streakMsg = $('#vip-streak-msg');
        if (streakMsg) streakMsg.textContent = d.streakRewardText;

        const perksList = $('#vip-perks-list');
        if (perksList) {
          perksList.innerHTML = (d.perks || []).map(p => `
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.25); padding:8px 12px; border-radius:var(--radius-sm);">
              <span style="font-size:0.85rem; color:var(--text-main);">✨ ${p}</span>
              <button class="btn-secondary" style="padding:3px 8px; font-size:0.75rem;" onclick="app.claimPerk('${p}')">Claim</button>
            </div>
          `).join('');
        }
      }
    } catch (e) {}
  }

  function closeLoyaltyModal() {
    const modal = $('#loyalty-prime-modal');
    if (modal) modal.style.display = 'none';
  }

  async function claimPerk(perkName) {
    try {
      const res = await api('/api/loyalty/claim-perk', {
        method: 'POST',
        body: JSON.stringify({ perkName })
      });
      showToast(res.message);
      triggerConfetti({ count: 60, x: 0.5, y: 0.5 });
    } catch (e) {}
  }

  // ----------------------------------------------------
  // 4. Verified Product Reviews & AI Sentiment
  // ----------------------------------------------------
  async function openReviewsModal(productId) {
    const modal = $('#product-reviews-modal');
    if (modal) modal.style.display = 'flex';
    const body = $('#product-reviews-rendered-body');
    if (!body) return;
    body.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-dim);">Loading verified reviews...</div>';

    try {
      const res = await api(`/api/reviews/${productId}`);
      const data = res;
      body.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); border-radius:var(--radius-md); padding:14px; margin-bottom:14px;">
          <div>
            <h4 style="margin:0; font-size:1.05rem; color:var(--text-main);">${escapeHtml(data.productName)}</h4>
            <div style="font-size:1.6rem; font-weight:800; color:var(--yellow-400); margin:4px 0;">
              ${data.rating}★ <small style="font-size:0.85rem; color:var(--text-dim);">(${data.totalReviews} verified reviews)</small>
            </div>
          </div>
          <button class="btn-primary" style="padding:6px 14px; font-size:0.8rem;" onclick="$('#review-submit-box').style.display='block'">+ Write Review</button>
        </div>

        <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.25); border-radius:var(--radius-md); padding:12px; margin-bottom:16px;">
          <strong style="font-size:0.82rem; color:var(--green-400); display:block; margin-bottom:6px;">🤖 AI Aspect Sentiment Breakdown:</strong>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            ${(data.aiSentiment?.aspects || []).map(a => `
              <div style="background:rgba(0,0,0,0.25); padding:8px 10px; border-radius:6px; font-size:0.78rem;">
                <div style="display:flex; justify-content:space-between; font-weight:700; color:var(--text-main);">
                  <span>${a.aspect}</span>
                  <span style="color:var(--green-400);">${a.scorePct}%</span>
                </div>
                <small style="color:var(--text-dim);">${a.verdict}</small>
              </div>
            `).join('')}
          </div>
        </div>

        <div id="review-submit-box" style="display:none; background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:12px; margin-bottom:16px;">
          <h5 style="margin-bottom:8px;">Rate this grocery item:</h5>
          <select id="new-review-rating" style="padding:6px 10px; border-radius:4px; background:rgba(0,0,0,0.5); color:#fff; border:1px solid var(--border-subtle); margin-bottom:8px;">
            <option value="5">⭐⭐⭐⭐⭐ (5 Stars - Outstanding)</option>
            <option value="4">⭐⭐⭐⭐ (4 Stars - Great)</option>
            <option value="3">⭐⭐⭐ (3 Stars - Average)</option>
          </select>
          <textarea id="new-review-comment" placeholder="Describe the freshness, taste, and packaging..." rows="2" style="width:100%; padding:8px; border-radius:4px; background:rgba(0,0,0,0.5); color:#fff; border:1px solid var(--border-subtle); font-size:0.85rem; margin-bottom:8px;"></textarea>
          <button class="btn-primary" style="padding:6px 14px; font-size:0.8rem;" onclick="app.submitReview('${productId}')">Post Verified Review</button>
        </div>

        <div style="display:flex; flex-direction:column; gap:10px;">
          ${(data.reviews || []).map(r => `
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:12px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <div>
                  <strong style="color:var(--text-main); font-size:0.88rem;">${escapeHtml(r.user)}</strong>
                  <span style="background:rgba(16,185,129,0.15); color:var(--green-400); font-size:0.7rem; padding:1px 6px; border-radius:999px; margin-left:6px;">VERIFIED BUYER</span>
                </div>
                <span style="color:var(--yellow-400); font-size:0.85rem;">${'★'.repeat(r.rating)}</span>
              </div>
              <p style="font-size:0.82rem; color:var(--text-muted); margin:4px 0;">${escapeHtml(r.comment)}</p>
              <div style="display:flex; gap:6px; margin-top:6px;">
                ${(r.tags || []).map(t => `<span style="font-size:0.7rem; color:var(--text-dim); background:rgba(255,255,255,0.06); padding:1px 6px; border-radius:4px;">${t}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (e) {
      body.innerHTML = '<div style="color:#ef4444; padding:12px;">Failed to load reviews.</div>';
    }
  }

  function closeReviewsModal() {
    const modal = $('#product-reviews-modal');
    if (modal) modal.style.display = 'none';
  }

  async function submitReview(productId) {
    const ratingEl = $('#new-review-rating');
    const commentEl = $('#new-review-comment');
    const rating = ratingEl ? parseInt(ratingEl.value, 10) : 5;
    const comment = commentEl ? commentEl.value.trim() : '';

    if (!comment) {
      showToast('Please add a comment about your experience', 'error');
      return;
    }

    try {
      await api(`/api/reviews/${productId}`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment, tags: ['Verified Freshness'] })
      });
      showToast('✅ Review submitted & verified!');
      await openReviewsModal(productId);
    } catch (e) {
      showToast('Failed to post review', 'error');
    }
  }

  // ----------------------------------------------------
  // 5. AI Smart Substitutes Modal
  // ----------------------------------------------------
  async function openSubstitutesModal(productId) {
    const modal = $('#substitutes-modal');
    if (modal) modal.style.display = 'flex';
    const container = $('#substitutes-cards-container');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center; padding:16px; color:var(--text-dim);">Analyzing multi-attribute substitutes...</div>';

    try {
      const res = await api(`/api/recommendations/substitutes/${productId}`);
      const list = res.data || [];
      if (list.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); text-align:center;">No close substitutes found.</p>';
        return;
      }

      container.innerHTML = list.map(item => `
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:14px; display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-size:2rem;">${item.emoji || '🛒'}</span>
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <strong style="color:var(--text-main); font-size:0.95rem;">${escapeHtml(item.name)}</strong>
                <span class="badge-tag" style="background:rgba(16,185,129,0.15); color:var(--green-400); font-weight:700;">${item.matchScore || item.matchPercentage || 92}% MATCH</span>
              </div>
              <small style="color:var(--text-dim); display:block; margin:3px 0;">₹${item.price} / ${item.unit || 'unit'} • ${item.priceDiff || 'Comparable price'}</small>
              <small style="color:var(--green-400); font-size:0.75rem;">${item.reason || item.substitutionReason || 'Same category alternative'}</small>
            </div>
          </div>
          <button class="btn-primary" style="padding:6px 14px; font-size:0.8rem;" onclick="app.swapSubstitute('${productId}', '${item.id}')">
            Swap In 🔄
          </button>
        </div>
      `).join('');
    } catch (e) {
      container.innerHTML = '<div style="color:#ef4444; padding:12px;">Failed to load substitutes.</div>';
    }
  }

  function closeSubstitutesModal() {
    const modal = $('#substitutes-modal');
    if (modal) modal.style.display = 'none';
  }

  function swapSubstitute(oldProdId, newProdId) {
    const existing = state.cart.items.find(i => (i.id === oldProdId || i.productId === oldProdId));
    if (existing) {
      const qty = existing.quantity || 1;
      updateCartQty(oldProdId, 0);
      addToCart(newProdId, qty);
      showToast('🔄 Smart substitute swapped into your basket!');
    } else {
      addToCart(newProdId, 1);
      showToast('Added substitute to cart!');
    }
    closeSubstitutesModal();
  }

  // ----------------------------------------------------
  // 6. Live Animated EV Courier Radar Telemetry
  // ----------------------------------------------------
  let radarAnimId = null;
  let radarProgress = 0.35;

  function renderLiveCourierRadar() {
    const canvas = $('#live-courier-radar-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.parentElement.clientWidth || 300;
    const h = canvas.height = 130;

    function drawFrame() {
      ctx.clearRect(0, 0, w, h);

      // Grid background
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Waypoint Coordinates
      const startX = 35;
      const startY = h / 2;
      const endX = w - 45;
      const endY = h / 2;

      // Pulse Rings around Dark Store Hub
      const pulse = (Date.now() / 600) % 2;
      ctx.strokeStyle = `rgba(16,185,129,${Math.max(0, 0.6 - pulse * 0.3)})`;
      ctx.beginPath();
      ctx.arc(startX, startY, 10 + pulse * 14, 0, Math.PI * 2);
      ctx.stroke();

      // Route Polyline
      ctx.strokeStyle = 'rgba(16,185,129,0.3)';
      ctx.lineWidth = 4;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Start Hub Icon
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(startX, startY, 7, 0, Math.PI * 2);
      ctx.fill();

      // Destination Pin
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(endX, endY, 7, 0, Math.PI * 2);
      ctx.fill();

      // Dynamic Rider Position along Waypoint
      radarProgress = (radarProgress + 0.002) % 1.0;
      const curX = startX + (endX - startX) * radarProgress;
      const curY = startY + Math.sin(Date.now() / 400) * 3;

      // Rider Marker
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(curX, curY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Radar Sweep Glow
      ctx.fillStyle = 'rgba(245,158,11,0.2)';
      ctx.beginPath();
      ctx.arc(curX, curY, 18, 0, Math.PI * 2);
      ctx.fill();

      // Telemetry HUD updates
      const speedEl = $('#telemetry-speed');
      if (speedEl) {
        const jitter = Math.floor(Math.sin(Date.now() / 800) * 3);
        speedEl.textContent = `${29 + jitter} km/h`;
      }
      const distEl = $('#telemetry-dist');
      if (distEl) {
        const remainingKm = Math.max(0.2, (1.2 * (1.0 - radarProgress))).toFixed(1);
        distEl.textContent = `${remainingKm} km left`;
      }

      radarAnimId = requestAnimationFrame(drawFrame);
    }

    if (radarAnimId) cancelAnimationFrame(radarAnimId);
    radarAnimId = requestAnimationFrame(drawFrame);
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
    openProductDetail: async (pId) => {
      trackRecentlyViewed(pId);
      return await openProductDetail(pId);
    },
    switchDetailGalleryImage,
    openInvoiceModal,
    openInvoiceModalById,
    toggleWishlist,
    openWishlistModal,
    closeWishlistModal,
    clearWishlist,
    addAllWishlistToCart,
    toggleCompare,
    removeFromCompare,
    openCompareModal,
    closeCompareModal,
    clearCompareList,
    toggleProductSelection,
    selectAllProductsInView,
    clearProductSelection,
    updateBulkActionBar,
    bulkAddToCart,
    bulkCompare,
    applySearchSuggestion,
    openStockAlertModal,
    closeStockAlertModal,
    saveStockAlert,
    clearRecentlyViewed,
    openBarcodeScanner,
    closeBarcodeScanner,
    simulateBarcodeScan,
    openHubSwitcher,
    closeHubSwitcher,
    renderDarkStoreList,
    selectHub,
    locateByPincode,
    openLoyaltyModal,
    closeLoyaltyModal,
    claimPerk,
    openReviewsModal,
    closeReviewsModal,
    submitReview,
    openSubstitutesModal,
    closeSubstitutesModal,
    swapSubstitute,
    renderLiveCourierRadar,
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
      if (cat && cat !== 'all') {
        state.currentDepartment = 'all';
        state.currentSubcategory = 'all';
        state.currentProductFamily = 'all';
      }
      renderCategorySelector();
      updateNavigationUrl();
      loadProducts(1);
    },
    selectDepartment: (deptId) => {
      state.currentDepartment = deptId || 'all';
      state.currentSubcategory = 'all';
      state.currentProductFamily = 'all';
      state.currentCategory = 'all';
      // Phase 5C: reset facet filters & reload facets for the new department scope
      state.activeFilters = {};
      state.activeFilterLabels = {};
      state.currentDiet = 'all';
      state.filtersLoaded = false;
      loadFilters();
      renderCategorySelector();
      updateNavigationUrl();
      loadProducts(1);
    },
    selectSubcategory: (subId) => {
      state.currentSubcategory = subId || 'all';
      state.currentProductFamily = 'all';
      // Phase 5C: reset facet filters & reload facets for the new subcategory scope
      state.activeFilters = {};
      state.activeFilterLabels = {};
      state.filtersLoaded = false;
      loadFilters();
      renderCategorySelector();
      updateNavigationUrl();
      loadProducts(1);
    },
    selectProductFamily: (familyId) => {
      state.currentProductFamily = familyId || 'all';
      // Phase 5C: reset facet filters & reload facets for the new product family scope
      state.activeFilters = {};
      state.activeFilterLabels = {};
      state.filtersLoaded = false;
      loadFilters();
      renderCategorySelector();
      updateNavigationUrl();
      loadProducts(1);
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
      updateNavigationUrl();
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
    },
    switchVisionTab,
    runVisualSearch,
    triggerVisualSample,
    chatAddToCart,
    confirmChatAction,
    addBundleToCart,
    triggerChatQuery,
    triggerConfetti,
    triggerFlyToCart,
    // Phase 5C: Faceted Search & Dynamic Filter exports
    applyFacetFilter,
    removeFacetFilter,
    clearFacet,
    clearAllFilters,
    toggleFilterPanel,
    applyPriceRange,
    loadFilters
  };
  window.switchAppView = switchView;

  // Micro-Animation & 3D Interactive Engine
  function setupMicroAnimations() {
    // 1. 3D Hero Canvas Physics Engine
    try {
      initHero3DCanvas();
    } catch (e) {}

    // 2. Multi-Layer 3D Tilt & Holographic Glare
    try {
      initMultiLayerTiltAndGlare();
    } catch (e) {}

    // 3. Smart Auto-Popup Flash Deal Reward
    try {
      initAutoPopupReward();
    } catch (e) {}

    // 4. Social Proof Live 3D Toasts
    try {
      initSocialProofToasts();
    } catch (e) {}

    // 5. IntersectionObserver for scroll-reveal animations
    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
          }
        });
      }, {
        root: null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.08
      });

      function observeElements() {
        document.querySelectorAll('.reveal:not(.revealed), .reveal-left:not(.revealed), .reveal-scale:not(.revealed), [data-reveal]:not(.revealed)').forEach(el => {
          revealObserver.observe(el);
        });
      }

      observeElements();

      const mutationObserver = new MutationObserver(() => {
        observeElements();
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true });
    } else {
      document.querySelectorAll('.reveal, .reveal-left, .reveal-scale, [data-reveal]').forEach(el => {
        el.classList.add('revealed');
      });
    }

    // 6. Ripple click effect on interactive buttons
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-primary, .btn-secondary, .btn-checkout, .qc-pill-btn, .btn-add-cart, .nav-btn, .tab-btn, .btn-claim-3d');
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const circle = document.createElement('span');
      const diameter = Math.max(rect.width, rect.height);
      const radius = diameter / 2;

      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - rect.left - radius}px`;
      circle.style.top = `${e.clientY - rect.top - radius}px`;
      circle.className = 'ripple-span';

      btn.classList.add('ripple-container');
      const existingRipple = btn.querySelector('.ripple-span');
      if (existingRipple) existingRipple.remove();

      btn.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
    });

    // 7. Smooth counter animation utility
    window.animateCounter = function (element, targetValue, duration = 1000, prefix = '', suffix = '') {
      if (!element) return;
      const start = 0;
      const startTime = performance.now();
      const isFloat = String(targetValue).includes('.');

      function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = start + (targetValue - start) * easeOut;

        element.textContent = `${prefix}${isFloat ? current.toFixed(1) : Math.round(current)}${suffix}`;

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      }
      requestAnimationFrame(update);
    };
  }

  // 1. 3D Hero Canvas Physics Engine
  function initHero3DCanvas() {
    const canvas = document.getElementById('hero-3d-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width, height;
    function resize() {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      width = canvas.width = rect.width || 360;
      height = canvas.height = rect.height || 340;
    }
    resize();
    window.addEventListener('resize', resize);

    const emojis = ['🍎', '🥑', '🥛', '🍇', '🥦', '🍊', '🍓', '🥕'];
    const items = [];
    const ITEM_COUNT = 14;

    for (let i = 0; i < ITEM_COUNT; i++) {
      items.push({
        emoji: emojis[i % emojis.length],
        x: (Math.random() - 0.5) * 550,
        y: (Math.random() - 0.5) * 380,
        z: Math.random() * 450 + 100,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        vz: (Math.random() - 0.5) * 0.5,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        baseSize: Math.random() * 14 + 28
      });
    }

    const particles = [];
    const PARTICLE_COUNT = 30;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 600,
        y: (Math.random() - 0.5) * 450,
        z: Math.random() * 500 + 50,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        vz: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.6 + 0.2
      });
    }

    let targetRotX = 0, targetRotY = 0;
    let curRotX = 0, curRotY = 0;

    canvas.parentElement.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - rect.width / 2);
      const mouseY = (e.clientY - rect.top - rect.height / 2);
      targetRotX = (mouseY / rect.height) * 0.35;
      targetRotY = (mouseX / rect.width) * 0.35;
    });

    canvas.parentElement.addEventListener('mouseleave', () => {
      targetRotX = 0;
      targetRotY = 0;
    });

    function render() {
      ctx.clearRect(0, 0, width, height);

      curRotX += (targetRotX - curRotX) * 0.05;
      curRotY += (targetRotY - curRotY) * 0.05;

      const fov = 340;
      const cx = width / 2;
      const cy = height / 2;

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        if (p.z > 550) p.z = 50;
        if (p.z < 50) p.z = 550;
        if (p.x > 300) p.x = -300;
        if (p.x < -300) p.x = 300;
        if (p.y > 220) p.y = -220;
        if (p.y < -220) p.y = 220;

        const cosY = Math.cos(curRotY), sinY = Math.sin(curRotY);
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;

        const cosX = Math.cos(curRotX), sinX = Math.sin(curRotX);
        const y1 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;

        if (z2 > 0) {
          const scale = fov / (fov + z2);
          const screenX = cx + x1 * scale;
          const screenY = cy + y1 * scale;

          ctx.beginPath();
          ctx.arc(screenX, screenY, p.radius * scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(52, 211, 153, ${p.alpha * scale})`;
          ctx.fill();
        }
      });

      const projectedItems = [];
      items.forEach(it => {
        it.x += it.vx;
        it.y += it.vy;
        it.z += it.vz;
        it.rot += it.rotSpeed;

        if (it.z > 550) it.z = 100;
        if (it.z < 100) it.z = 550;
        if (it.x > 280) it.x = -280;
        if (it.x < -280) it.x = 280;
        if (it.y > 190) it.y = -190;
        if (it.y < -190) it.y = 190;

        const cosY = Math.cos(curRotY), sinY = Math.sin(curRotY);
        const x1 = it.x * cosY - it.z * sinY;
        const z1 = it.z * cosY + it.x * sinY;

        const cosX = Math.cos(curRotX), sinX = Math.sin(curRotX);
        const y1 = it.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + it.y * sinX;

        if (z2 > 0) {
          const scale = fov / (fov + z2);
          projectedItems.push({
            emoji: it.emoji,
            screenX: cx + x1 * scale,
            screenY: cy + y1 * scale,
            scale,
            z: z2,
            rot: it.rot,
            baseSize: it.baseSize
          });
        }
      });

      projectedItems.sort((a, b) => b.z - a.z);

      projectedItems.forEach(pi => {
        ctx.save();
        ctx.translate(pi.screenX, pi.screenY);
        ctx.rotate(pi.rot);
        const size = Math.round(pi.baseSize * pi.scale);
        ctx.font = `${size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = Math.min(1, Math.max(0.2, (pi.scale * 1.3)));
        ctx.shadowColor = 'rgba(0,0,0,0.45)';
        ctx.shadowBlur = 8 * pi.scale;
        ctx.fillText(pi.emoji, 0, 0);
        ctx.restore();
      });

      requestAnimationFrame(render);
    }
    render();
  }

  // 2. Multi-Layer 3D Tilt & Holographic Glare
  function initMultiLayerTiltAndGlare() {
    document.addEventListener('mousemove', (e) => {
      const card = e.target.closest('.product-card');
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const normX = (x / rect.width) * 2 - 1;
      const normY = (y / rect.height) * 2 - 1;

      const maxRotate = 12;
      const rotX = -normY * maxRotate;
      const rotY = normX * maxRotate;

      card.style.setProperty('--glare-x', `${(normX + 1) * 50}%`);
      card.style.setProperty('--glare-y', `${(normY + 1) * 50}%`);
      card.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-6px) scale3d(1.02, 1.02, 1.02)`;
    });

    document.addEventListener('mouseout', (e) => {
      const card = e.target.closest('.product-card');
      if (!card || (e.relatedTarget && card.contains(e.relatedTarget))) return;
      card.style.transform = '';
    });
  }

  // 3. Parabolic 3D Fly-to-Cart Animation
  function triggerFlyToCart(productId) {
    try {
      const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
      const cartBtn = document.getElementById('cart-btn') || document.getElementById('mobile-nav-cart');
      if (!card || !cartBtn) return;

      const img = card.querySelector('.product-image') || card;
      const startRect = img.getBoundingClientRect();
      const endRect = cartBtn.getBoundingClientRect();

      const ghost = document.createElement('div');
      ghost.className = 'fly-to-cart-ghost';

      const product = state.products.find(p => p.id === productId);
      const emojiIcon = (product && product.tags && product.tags[0]) || '🛍️';
      ghost.textContent = emojiIcon;
      ghost.style.left = `${startRect.left + startRect.width / 2 - 22}px`;
      ghost.style.top = `${startRect.top + startRect.height / 2 - 22}px`;
      ghost.style.width = '44px';
      ghost.style.height = '44px';

      document.body.appendChild(ghost);

      const deltaX = (endRect.left + endRect.width / 2) - (startRect.left + startRect.width / 2);
      const deltaY = (endRect.top + endRect.height / 2) - (startRect.top + startRect.height / 2);

      requestAnimationFrame(() => {
        ghost.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.35) rotate(720deg)`;
        ghost.style.opacity = '0.4';
      });

      setTimeout(() => {
        ghost.remove();
        cartBtn.classList.add('cart-bounce');
        const badge = document.getElementById('cart-badge');
        if (badge) badge.classList.add('cart-bounce');
        setTimeout(() => {
          cartBtn.classList.remove('cart-bounce');
          if (badge) badge.classList.remove('cart-bounce');
        }, 600);
      }, 750);
    } catch (e) {}
  }
  window.triggerFlyToCart = triggerFlyToCart;

  // 4. Celebratory 3D Confetti Cannon Engine
  function triggerConfetti({ count = 90, x = 0.5, y = 0.4 } = {}) {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#10b981', '#34d399', '#3b82f6', '#60a5fa', '#a855f7', '#fbbf24', '#f87171'];
    const originX = canvas.width * x;
    const originY = canvas.height * y;

    const confetti = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 16 + 8;
      confetti.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        width: Math.random() * 10 + 6,
        height: Math.random() * 6 + 4,
        tiltAngle: Math.random() * Math.PI,
        tiltSpeed: Math.random() * 0.12 + 0.05,
        drag: 0.96,
        gravity: 0.45,
        opacity: 1
      });
    }

    function step() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      confetti.forEach(c => {
        c.vx *= c.drag;
        c.vy *= c.drag;
        c.vy += c.gravity;
        c.x += c.vx;
        c.y += c.vy;
        c.tiltAngle += c.tiltSpeed;
        c.opacity -= 0.012;

        if (c.opacity > 0 && c.y < canvas.height) {
          alive = true;
          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.rotate(c.tiltAngle);
          ctx.scale(Math.cos(c.tiltAngle), 1);
          ctx.fillStyle = c.color;
          ctx.globalAlpha = Math.max(0, c.opacity);
          ctx.fillRect(-c.width / 2, -c.height / 2, c.width, c.height);
          ctx.restore();
        }
      });

      if (alive) {
        requestAnimationFrame(step);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    requestAnimationFrame(step);
  }
  window.triggerConfetti = triggerConfetti;

  // 5. Smart Auto-Popup Flash Deal Reward
  function initAutoPopupReward() {
    const popup = document.getElementById('auto-deal-popup');
    if (!popup) return;

    const seen = sessionStorage.getItem('freshcart_auto_popup_seen');
    if (seen) return;

    setTimeout(() => {
      popup.classList.add('active');
      sessionStorage.setItem('freshcart_auto_popup_seen', '1');

      let timeLeft = 299;
      const timerEl = document.getElementById('popup-countdown');
      const timerInt = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
          clearInterval(timerInt);
          if (timerEl) timerEl.textContent = '00:00';
          return;
        }
        const m = Math.floor(timeLeft / 60);
        const s = timeLeft % 60;
        if (timerEl) timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }, 1000);

      function closePopup() {
        clearInterval(timerInt);
        popup.classList.remove('active');
      }

      const closeBtn = document.getElementById('btn-close-auto-popup');
      const dismissBtn = document.getElementById('btn-dismiss-auto-deal');
      const claimBtn = document.getElementById('btn-claim-auto-deal');

      if (closeBtn) closeBtn.onclick = closePopup;
      if (dismissBtn) dismissBtn.onclick = closePopup;
      popup.onclick = (e) => {
        if (e.target === popup) closePopup();
      };

      if (claimBtn) {
        claimBtn.onclick = () => {
          triggerConfetti({ count: 120, x: 0.5, y: 0.45 });
          showToast('🎉 Deal Claimed! 25% Off + 10-Min Free Express Delivery unlocked!');
          closePopup();
          const cat = document.getElementById('catalog-section');
          if (cat) cat.scrollIntoView({ behavior: 'smooth' });
        };
      }
    }, 3200);
  }

  // 6. Social Proof Live 3D Toasts
  function initSocialProofToasts() {
    const toast = document.getElementById('social-proof-toast');
    if (!toast) return;

    const feeds = [
      { avatar: '🥑', title: 'Indiranagar: Sneha ordered Organic Avocados', sub: '⚡ Express dispatch: 8 mins away' },
      { avatar: '🥛', title: 'Koramangala: Arjun bought Farm Fresh Milk (2L)', sub: '⚡ Delivered in 9 mins' },
      { avatar: '🍎', title: 'HSR Layout: Priya claimed 20% Flash Deal', sub: '⚡ Saved ₹180 on Fresh Produce' },
      { avatar: '🥭', title: 'Whitefield: Vikram reordered Alphonso Mangoes', sub: '⚡ 10-min courier en route' },
      { avatar: '🥦', title: 'Jayanagar: Neha added Curated Salad Kit', sub: '⚡ Smart meal kit solver match' }
    ];

    let feedIndex = 0;
    setInterval(() => {
      const cur = feeds[feedIndex % feeds.length];
      feedIndex++;

      const avatarEl = document.getElementById('sp-avatar');
      const titleEl = document.getElementById('sp-title');
      const subEl = document.getElementById('sp-sub');

      if (avatarEl) avatarEl.textContent = cur.avatar;
      if (titleEl) titleEl.textContent = cur.title;
      if (subEl) subEl.textContent = cur.sub;

      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 5000);
    }, 18000);
  }

  // Boot Application
  async function init() {
    initThemeAndAccent();
    setupMicroAnimations();
    updateNotificationBadge();
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
      loadStorefrontBanditPromo(),
      loadStorefrontSASRec(),
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

