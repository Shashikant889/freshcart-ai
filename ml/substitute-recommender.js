/**
 * FreshCart AI — Smart Substitute Recommendation Engine (ml/substitute-recommender.js)
 * 
 * Inspired by Instacart & Amazon Fresh substitute recommendation systems.
 * When a grocery item is out-of-stock, low-stock, or substituted by user preference,
 * this engine evaluates multi-attribute compatibility across:
 * 1. Category alignment (W_cat = 0.45)
 * 2. Price proximity within consumer willingness-to-pay band (W_price = 0.25)
 * 3. Semantic keyword & tag overlap (W_sem = 0.20)
 * 4. Product rating & inventory availability (W_rel = 0.10)
 */

const { getDb } = require('../db/database');
const defaultProducts = require('../data/products');

// Related categories adjacency graph for cross-category fallback
const CATEGORY_ADJACENCY = {
  fruits: ['vegetables', 'snacks', 'beverages'],
  vegetables: ['fruits', 'dairy'],
  dairy: ['beverages', 'bakery'],
  bakery: ['dairy', 'snacks'],
  beverages: ['dairy', 'fruits'],
  snacks: ['bakery', 'fruits']
};

/**
 * Tokenize string into cleaned lowercase word set
 */
function tokenize(text) {
  if (!text) return new Set();
  const words = text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  return new Set(words);
}

/**
 * Compute Jaccard token similarity between two text descriptions
 */
function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0.5;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * Find top smart substitute alternatives for a product
 * @param {string} productId Target product identifier
 * @param {number} topN Maximum number of alternatives to return (default: 3)
 * @returns {Array} Ranked substitute recommendations
 */
function getSmartSubstitutes(productId, topN = 3) {
  let catalog = [];
  try {
    const db = getDb();
    if (db) {
      catalog = db.prepare('SELECT id, name, emoji, category, price, unit, description, stock, rating, tags FROM products').all();
    }
  } catch (e) {
    catalog = defaultProducts;
  }

  if (!catalog || catalog.length === 0) {
    catalog = defaultProducts;
  }

  const target = catalog.find(p => p.id === productId);
  if (!target) return [];

  const targetTokens = tokenize(`${target.name} ${target.description || ''} ${target.category || ''}`);

  const candidates = catalog
    .filter(p => p.id !== target.id)
    .map(p => {
      // 1. Category score
      let catScore = 0.05;
      if (p.category === target.category) {
        catScore = 1.0;
      } else if (CATEGORY_ADJACENCY[target.category]?.includes(p.category)) {
        catScore = 0.45;
      }

      // 2. Price proximity score (Gaussian decay on relative price delta)
      const maxP = Math.max(target.price, p.price, 1);
      const absDelta = Math.abs(target.price - p.price);
      const relDelta = absDelta / maxP;
      const priceScore = Math.max(0, 1 - relDelta);

      // 3. Semantic / keyword similarity
      const candTokens = tokenize(`${p.name} ${p.description || ''} ${p.category || ''}`);
      const semScore = jaccardSimilarity(targetTokens, candTokens);

      // 4. Rating & stock health
      const ratingNorm = (p.rating || 4.0) / 5.0;
      const stockBonus = p.stock > 0 ? (p.stock >= 10 ? 1.0 : 0.6) : 0.1;
      const reliabilityScore = (ratingNorm * 0.7) + (stockBonus * 0.3);

      // Composite multi-attribute score
      const rawScore = (catScore * 0.45) + (priceScore * 0.25) + (semScore * 0.20) + (reliabilityScore * 0.10);
      const matchScore = Math.round(rawScore * 100);

      // Formatting human-friendly rationale
      const diffVal = p.price - target.price;
      const priceDiffStr = diffVal === 0 ? 'Same price' : (diffVal > 0 ? `+₹${diffVal}` : `-₹${Math.abs(diffVal)}`);

      let reason = '';
      if (p.category === target.category) {
        reason = `Same ${p.category} category • ${priceDiffStr} • In-stock (${p.stock} left)`;
      } else {
        reason = `Complementary alternative • ${priceDiffStr} • Highly rated (★${p.rating})`;
      }

      return {
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        category: p.category,
        price: p.price,
        unit: p.unit,
        description: p.description,
        stock: p.stock,
        rating: p.rating,
        matchScore: Math.min(99, Math.max(55, matchScore)),
        substitutionScore: Math.min(99, Math.max(55, matchScore)),
        substituteScore: Math.min(99, Math.max(55, matchScore)),
        priceDiff: priceDiffStr,
        priceDelta: diffVal,
        reason,
        substitutionReason: reason,
        explanation: reason
      };
    });

  // Sort descending by matchScore and return topN
  candidates.sort((a, b) => b.matchScore - a.matchScore || b.stock - a.stock);
  return candidates.slice(0, topN);
}

module.exports = {
  getSmartSubstitutes
};
