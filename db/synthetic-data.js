/**
 * Synthetic Data Generator for ML Training
 * Generates realistic grocery purchase patterns for:
 * - Collaborative filtering (user interactions)
 * - Demand forecasting (sales history)
 * - Customer segmentation (varied user profiles)
 */

// User personas for realistic data generation
const USER_PERSONAS = [
  { type: 'health_conscious', categories: ['fruits', 'vegetables', 'dairy'], priceRange: [100, 400], orderFreq: 8, basketSize: [4, 8] },
  { type: 'budget_shopper', categories: ['vegetables', 'dairy', 'snacks'], priceRange: [20, 150], orderFreq: 10, basketSize: [3, 6] },
  { type: 'premium_buyer', categories: ['fruits', 'bakery', 'beverages', 'snacks'], priceRange: [150, 600], orderFreq: 6, basketSize: [5, 10] },
  { type: 'bulk_purchaser', categories: ['dairy', 'vegetables', 'snacks', 'beverages'], priceRange: [30, 300], orderFreq: 4, basketSize: [8, 15] },
  { type: 'occasional_visitor', categories: ['fruits', 'bakery'], priceRange: [50, 250], orderFreq: 2, basketSize: [2, 4] },
  { type: 'family_shopper', categories: ['fruits', 'vegetables', 'dairy', 'bakery', 'beverages', 'snacks'], priceRange: [30, 400], orderFreq: 12, basketSize: [6, 12] },
];

// Seasonal multipliers by category (month index 0-11)
const SEASONAL_FACTORS = {
  fruits:     [0.7, 0.7, 0.9, 1.2, 1.5, 1.3, 1.0, 0.9, 0.8, 0.8, 0.7, 0.8],
  vegetables: [0.9, 0.9, 1.0, 1.0, 0.9, 0.8, 0.8, 0.9, 1.0, 1.1, 1.2, 1.0],
  dairy:      [1.0, 1.0, 1.0, 0.9, 0.8, 0.7, 0.7, 0.8, 0.9, 1.0, 1.1, 1.1],
  bakery:     [1.1, 1.0, 0.9, 0.8, 0.7, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3],
  beverages:  [0.8, 0.8, 0.9, 1.1, 1.3, 1.4, 1.4, 1.3, 1.1, 0.9, 0.8, 0.8],
  snacks:     [1.0, 1.0, 1.0, 1.0, 1.1, 1.1, 1.0, 1.0, 1.0, 1.1, 1.2, 1.2],
};

// Day-of-week multipliers (0=Sun, 6=Sat)
const DAY_FACTORS = [1.3, 0.7, 0.8, 0.9, 1.0, 1.1, 1.4];

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pickRandom(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function pickWeighted(rng, items, weights) {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

/**
 * Generate synthetic users
 */
function generateUsers(count, rng) {
  const firstNames = ['Aarav','Vivaan','Aditya','Vihaan','Arjun','Reyansh','Sai','Arnav','Dhruv','Kabir',
    'Ananya','Saanvi','Aanya','Isha','Pari','Diya','Myra','Sara','Prisha','Riya',
    'Rahul','Neha','Priya','Amit','Sneha','Kiran','Vikram','Pooja','Rohan','Meera',
    'Suresh','Lakshmi','Rajesh','Divya','Nikhil','Kavya','Sanjay','Nisha','Manish','Tanvi',
    'Gaurav','Swati','Harish','Bhavna','Deepak','Ankita','Kunal','Pallavi','Ashish','Shruti'];
  const lastNames = ['Sharma','Patel','Kumar','Singh','Reddy','Gupta','Verma','Mehta','Joshi','Nair',
    'Iyer','Rao','Das','Pillai','Chopra','Malhotra','Bhat','Kapoor','Agarwal','Tiwari'];

  const users = [];
  for (let i = 0; i < count; i++) {
    const first = firstNames[i % firstNames.length];
    const last = pickRandom(rng, lastNames);
    const persona = USER_PERSONAS[i % USER_PERSONAS.length];
    users.push({
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}${i + 1}@email.com`,
      persona: persona.type,
      personaConfig: persona,
    });
  }
  return users;
}

/**
 * Generate 12 months of sales history for each product
 */
function generateSalesHistory(products, startDate, days, rng) {
  const history = [];
  const start = new Date(startDate);

  for (let d = 0; d < days; d++) {
    const date = new Date(start);
    date.setDate(start.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];
    const month = date.getMonth();
    const dow = date.getDay();

    for (const product of products) {
      const seasonFactor = SEASONAL_FACTORS[product.category]?.[month] || 1.0;
      const dayFactor = DAY_FACTORS[dow];
      const baseDemand = 3 + (product.rating - 4) * 5; // higher rated = more demand
      const priceFactor = Math.max(0.5, 1.5 - product.price / 500); // cheaper = more demand

      let qty = Math.round(baseDemand * seasonFactor * dayFactor * priceFactor * (0.7 + rng() * 0.6));
      qty = Math.max(0, qty);

      if (qty > 0) {
        history.push({
          product_id: product.id,
          date: dateStr,
          quantity_sold: qty,
          revenue: Math.round(qty * product.price * 100) / 100,
        });
      }
    }
  }
  return history;
}

/**
 * Generate user interactions and orders from synthetic purchase patterns
 */
function generateUserActivity(users, products, months, rng) {
  const interactions = [];
  const orders = [];
  const orderItems = [];
  let orderCounter = 0;

  const now = new Date();
  const startDate = new Date(now);
  startDate.setMonth(startDate.getMonth() - months);

  for (const user of users) {
    const config = user.personaConfig;
    const totalOrders = Math.round(config.orderFreq * months * (0.7 + rng() * 0.6));
    const userProducts = products.filter(p => config.categories.includes(p.category));

    // Generate view interactions (3-5× more than purchases)
    const viewCount = totalOrders * randomInt(rng, 3, 5);
    for (let v = 0; v < viewCount; v++) {
      const product = pickRandom(rng, products); // views can be any product
      const daysAgo = randomInt(rng, 0, months * 30);
      const viewDate = new Date(now);
      viewDate.setDate(viewDate.getDate() - daysAgo);
      interactions.push({
        user_id: user.dbId,
        product_id: product.id,
        action: 'view',
        rating: null,
        created_at: viewDate.toISOString(),
      });
    }

    // Generate orders
    for (let o = 0; o < totalOrders; o++) {
      const daysAgo = randomInt(rng, 0, months * 30);
      const orderDate = new Date(now);
      orderDate.setDate(orderDate.getDate() - daysAgo);

      const basketSize = randomInt(rng, config.basketSize[0], config.basketSize[1]);
      const selectedProducts = [];
      const used = new Set();

      for (let b = 0; b < basketSize && b < userProducts.length; b++) {
        let p;
        let tries = 0;
        do {
          p = pickRandom(rng, rng() < 0.7 ? userProducts : products);
          tries++;
        } while (used.has(p.id) && tries < 20);
        if (!used.has(p.id)) {
          used.add(p.id);
          selectedProducts.push(p);
        }
      }

      if (selectedProducts.length === 0) continue;

      orderCounter++;
      const orderId = `SYN${String(orderCounter).padStart(6, '0')}`;
      let subtotal = 0;
      const items = [];

      for (const p of selectedProducts) {
        const qty = randomInt(rng, 1, 3);
        const lineTotal = p.price * qty;
        subtotal += lineTotal;
        items.push({ order_id: orderId, product_id: p.id, quantity: qty, price_at_purchase: p.price });

        // Purchase interaction
        interactions.push({
          user_id: user.dbId,
          product_id: p.id,
          action: 'purchase',
          rating: null,
          created_at: orderDate.toISOString(),
        });

        // Some users rate products (30% chance)
        if (rng() < 0.3) {
          const rating = Math.min(5, Math.max(1, Math.round(p.rating + (rng() - 0.5) * 2)));
          interactions.push({
            user_id: user.dbId,
            product_id: p.id,
            action: 'rate',
            rating,
            created_at: orderDate.toISOString(),
          });
        }

        // Cart interaction (always before purchase)
        interactions.push({
          user_id: user.dbId,
          product_id: p.id,
          action: 'cart',
          rating: null,
          created_at: new Date(orderDate.getTime() - 300000).toISOString(),
        });
      }

      const deliveryFee = subtotal > 500 ? 0 : 49;
      const tax = Math.round(subtotal * 0.08 * 100) / 100;
      const total = Math.round((subtotal + deliveryFee + tax) * 100) / 100;

      orders.push({
        id: orderId,
        user_id: user.dbId,
        subtotal: Math.round(subtotal * 100) / 100,
        delivery_fee: deliveryFee,
        tax,
        total,
        status: 'delivered',
        customer_name: user.name,
        address: `${randomInt(rng, 1, 500)} ${pickRandom(rng, ['MG Road', 'Park Street', 'Brigade Road', 'Nehru Nagar', 'Gandhi Path', 'Laxmi Nagar', 'Koramangala', 'Banjara Hills', 'Andheri West', 'Salt Lake'])}`,
        phone: `+91 ${randomInt(rng, 70000, 99999)}${randomInt(rng, 10000, 99999)}`,
        payment_method: pickRandom(rng, ['cash', 'card', 'upi']),
        created_at: orderDate.toISOString(),
      });

      orderItems.push(...items);
    }
  }

  return { interactions, orders, orderItems };
}

module.exports = {
  generateUsers,
  generateSalesHistory,
  generateUserActivity,
  USER_PERSONAS,
  SEASONAL_FACTORS,
  seededRandom,
};
