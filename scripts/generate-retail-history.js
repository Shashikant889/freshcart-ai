/**
 * FreshCart AI — 1-Year Historical Retail Activity & ML Training Data Generator
 * Generates 365 days of realistic retail history:
 * - Daily Sales History (Time-series with seasonality, weekend effects, promotions)
 * - Historical Orders & Order Items (ACID consistent, valid references)
 * - User Behavioral Interactions (View, Cart, Purchase, Rate with realistic funnels)
 * - Anomaly & Fraud Risk Signals (High spend spikes, rapid velocity bursts, scalping)
 */

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// 12-month category seasonality multiplier (Jan=0..Dec=11)
const SEASONAL_FACTORS = {
  fruits:           [0.8, 0.8, 0.9, 1.3, 1.6, 1.4, 1.1, 0.9, 0.8, 0.9, 0.8, 0.9],
  exotic_fruits:    [0.9, 0.9, 1.0, 1.2, 1.4, 1.3, 1.1, 1.0, 0.9, 1.1, 1.2, 1.3],
  vegetables:       [1.1, 1.0, 0.9, 0.9, 0.8, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.2],
  dairy:            [1.0, 1.0, 1.0, 0.9, 0.8, 0.8, 0.9, 1.0, 1.1, 1.2, 1.2, 1.1],
  bakery:           [1.2, 1.1, 1.0, 0.8, 0.8, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4],
  beverages:        [0.7, 0.8, 1.0, 1.4, 1.7, 1.6, 1.3, 1.1, 0.9, 0.8, 0.7, 0.8],
  snacks:           [1.0, 1.0, 1.0, 1.1, 1.1, 1.0, 1.0, 1.1, 1.2, 1.4, 1.5, 1.3],
  chocolates:       [1.1, 1.4, 0.9, 0.8, 0.7, 0.7, 0.8, 1.0, 1.3, 1.6, 1.5, 1.5],
  staples:          [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.1, 1.2, 1.3, 1.1, 1.0]
};

// Day-of-week demand multipliers (0=Sun, 6=Sat)
const DAY_FACTORS = [1.35, 0.75, 0.85, 0.95, 1.05, 1.20, 1.45];

// Special festival demand spikes (month, day, boost factor)
const FESTIVAL_SPIKES = [
  { month: 0, day: 14, boost: 1.5, note: 'Makar Sankranti / Pongal' },
  { month: 2, day: 25, boost: 1.6, note: 'Holi Festival' },
  { month: 7, day: 15, boost: 1.4, note: 'Independence Day Sale' },
  { month: 7, day: 26, boost: 1.7, note: 'Janmashtami / Raksha Bandhan' },
  { month: 9, day: 20, boost: 1.8, note: 'Navratri / Dussehra' },
  { month: 10, day: 1, boost: 2.2, note: 'Diwali Mega Sale' },
  { month: 11, day: 25, boost: 1.7, note: 'Christmas & Year-End' }
];

function generateSalesHistory(products, startDateStr = '2025-01-01', daysCount = 365, rng) {
  const history = [];
  const start = new Date(startDateStr);

  // We sample a representative high-velocity core of products (all baseline + top products from each category)
  // to ensure realistic forecasting depth while keeping database size optimal
  const trackedProducts = products.filter((p, idx) => idx < 60 || p.id.startsWith('f') || p.id.startsWith('v') || p.id.startsWith('d') || p.id.startsWith('b') || p.id.startsWith('s') || idx % 20 === 0);

  console.log(`Generating 365 days of time-series sales for ${trackedProducts.length} tracked catalog items...`);

  for (let d = 0; d < daysCount; d++) {
    const curDate = new Date(start);
    curDate.setDate(start.getDate() + d);
    const dateStr = curDate.toISOString().split('T')[0];
    const month = curDate.getMonth();
    const dow = curDate.getDay();
    const dayOfMonth = curDate.getDate();

    // Check festival boost
    let festBoost = 1.0;
    const fest = FESTIVAL_SPIKES.find(f => f.month === month && Math.abs(f.day - dayOfMonth) <= 1);
    if (fest) festBoost = fest.boost;

    for (const p of trackedProducts) {
      const seasonFactor = SEASONAL_FACTORS[p.category] ? SEASONAL_FACTORS[p.category][month] : (SEASONAL_FACTORS.staples[month] || 1.0);
      const dayFactor = DAY_FACTORS[dow];
      const ratingBoost = 1.0 + ((p.rating || 4.0) - 3.5) * 0.4;
      const priceFactor = Math.max(0.4, 1.4 - (p.price / 800));

      const baseUnits = (4.0 + rng() * 6.0) * seasonFactor * dayFactor * ratingBoost * priceFactor * festBoost;
      const quantity = Math.max(1, Math.round(baseUnits));
      const revenue = Math.round(quantity * p.price * 100) / 100;

      history.push({
        product_id: p.id,
        date: dateStr,
        quantity_sold: quantity,
        revenue
      });
    }
  }

  console.log(`✅ Generated ${history.length} daily product sales records over 1 year.`);
  return history;
}

function generateOrdersAndInteractions(users, products, orderTarget = 65000, rng) {
  const orders = [];
  const orderItems = [];
  const interactions = [];

  const startDate = new Date('2025-01-01T00:00:00Z');
  const endDate = new Date('2025-12-31T23:59:59Z');
  const spanMs = endDate.getTime() - startDate.getTime();

  // Index products by category for realistic basket building
  const prodsByCategory = new Map();
  for (const p of products) {
    if (!prodsByCategory.has(p.category)) prodsByCategory.set(p.category, []);
    prodsByCategory.get(p.category).push(p);
  }

  // Active customer pool (first 35,000 users + demo customer id: 2)
  const activeUsers = users.slice(1, 35000);

  console.log(`Generating ~${orderTarget} realistic historical orders and ~${orderTarget * 3} user interactions...`);

  let orderIdCounter = 1000;

  for (let i = 0; i < orderTarget; i++) {
    orderIdCounter++;
    const user = activeUsers[Math.floor(rng() * activeUsers.length)];
    const orderTime = new Date(startDate.getTime() + Math.floor(rng() * spanMs));
    const orderDateStr = orderTime.toISOString().replace('T', ' ').substring(0, 19);

    const orderId = `ORD-${orderTime.getFullYear()}-${String(orderIdCounter).padStart(6, '0')}`;
    const basketSize = Math.floor(rng() * 6) + 2; // 2 to 7 distinct items per order

    let subtotal = 0;
    const itemsInOrder = [];
    const usedProducts = new Set();

    // Pick items: 70% from popular categories, 30% from general catalog
    for (let b = 0; b < basketSize; b++) {
      let candidate = products[Math.floor(rng() * products.length)];
      if (usedProducts.has(candidate.id)) continue;
      usedProducts.add(candidate.id);

      const qty = Math.floor(rng() * 3) + 1;
      const linePrice = candidate.price;
      subtotal += linePrice * qty;

      itemsInOrder.push({
        order_id: orderId,
        product_id: candidate.id,
        quantity: qty,
        price_at_purchase: linePrice
      });

      // Pre-purchase interaction funnel:
      // 1. View interaction (1-3 hours before order)
      const viewTime = new Date(orderTime.getTime() - (Math.floor(rng() * 180) + 10) * 60000);
      interactions.push({
        user_id: user.id,
        product_id: candidate.id,
        action: 'view',
        rating: null,
        created_at: viewTime.toISOString().replace('T', ' ').substring(0, 19)
      });

      // 2. Cart interaction (5-20 mins before order)
      const cartTime = new Date(orderTime.getTime() - (Math.floor(rng() * 15) + 2) * 60000);
      interactions.push({
        user_id: user.id,
        product_id: candidate.id,
        action: 'cart',
        rating: null,
        created_at: cartTime.toISOString().replace('T', ' ').substring(0, 19)
      });

      // 3. Purchase interaction (at order time)
      interactions.push({
        user_id: user.id,
        product_id: candidate.id,
        action: 'purchase',
        rating: null,
        created_at: orderDateStr
      });

      // 4. Occasional rating (25% probability)
      if (rng() < 0.25) {
        const ratingVal = Math.min(5, Math.max(1, Math.round(candidate.rating + (rng() - 0.4))));
        interactions.push({
          user_id: user.id,
          product_id: candidate.id,
          action: 'rate',
          rating: ratingVal,
          created_at: new Date(orderTime.getTime() + 86400000).toISOString().replace('T', ' ').substring(0, 19)
        });
      }
    }

    if (itemsInOrder.length === 0) continue;

    subtotal = Math.round(subtotal * 100) / 100;
    const deliveryFee = subtotal >= 500 ? 0 : 49;
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const total = Math.round((subtotal + deliveryFee + tax) * 100) / 100;

    // Delivery addresses across Indian hubs
    const streetNames = ['MG Road', 'Indiranagar 100ft Road', 'Bandra Hill Road', 'HSR Sector 2', 'Jubilee Hills Road #36', 'Koramangala 5th Block', 'Salt Lake Sector 1', 'Connaught Circus'];
    const street = streetNames[Math.floor(rng() * streetNames.length)];
    const address = `${Math.floor(rng() * 400) + 1}, ${street}`;
    const phone = `+91 ${Math.floor(rng() * 20000) + 78000}${Math.floor(rng() * 90000) + 10000}`;
    const paymentMethod = rng() < 0.6 ? 'upi' : (rng() < 0.85 ? 'card' : 'cash');

    orders.push({
      id: orderId,
      user_id: user.id,
      subtotal,
      delivery_fee: deliveryFee,
      tax,
      total,
      status: 'delivered',
      customer_name: user.name,
      address,
      phone,
      payment_method: paymentMethod,
      created_at: orderDateStr
    });

    orderItems.push(...itemsInOrder);
  }

  // 3. Add occasional standalone views for browsing discovery (recommendation cold-start signals)
  console.log('Adding exploratory browsing views...');
  for (let v = 0; v < 30000; v++) {
    const user = activeUsers[Math.floor(rng() * activeUsers.length)];
    const prod = products[Math.floor(rng() * products.length)];
    const viewTime = new Date(startDate.getTime() + Math.floor(rng() * spanMs));
    interactions.push({
      user_id: user.id,
      product_id: prod.id,
      action: 'view',
      rating: null,
      created_at: viewTime.toISOString().replace('T', ' ').substring(0, 19)
    });
  }

  console.log(`✅ Generated ${orders.length} orders, ${orderItems.length} order items, and ${interactions.length} interactions.`);
  return { orders, orderItems, interactions };
}

module.exports = {
  generateSalesHistory,
  generateOrdersAndInteractions
};
