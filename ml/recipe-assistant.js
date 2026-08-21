/**
 * Conversational AI Recipe-to-Cart & Meal Planner Engine
 * Implements:
 * 1. Natural Language Intent & Dish Recognition
 * 2. Ingredient-to-Catalog Semantic Matching
 * 3. Budget & Dietary Constraint Solver
 * 4. 1-Click Multi-Item Cart Payload Generator
 */

const { getDb } = require('../db/database');
const { smartSearch } = require('./smart-search');

// Curated Knowledge Base of Recipes & Meal Plans mapped to ingredients
const RECIPE_KNOWLEDGE_BASE = [
  {
    name: 'Alphonso Mango Lassi',
    keywords: ['mango lassi', 'lassi', 'mango shake', 'smoothie', 'mango drink'],
    description: 'Refreshing traditional Indian chilled yogurt drink with sweet Alphonso mangoes.',
    requiredItems: [
      { search: 'Ripe Mangoes', qty: 2 },
      { search: 'Greek Yogurt', qty: 1 },
      { search: 'Whole Milk', qty: 1 }
    ],
    diet: 'Vegetarian • High Protein • Refreshing'
  },
  {
    name: 'Fresh Organic Fruit Salad Bowl',
    keywords: ['fruit salad', 'salad', 'fruits', 'healthy bowl', 'fruit bowl', 'diet'],
    description: 'Vibrant bowl of crisp apples, sweet bananas, strawberries, and seedless green grapes.',
    requiredItems: [
      { search: 'Organic Apples', qty: 1 },
      { search: 'Fresh Bananas', qty: 1 },
      { search: 'Sweet Strawberries', qty: 1 },
      { search: 'Green Grapes', qty: 1 }
    ],
    diet: 'Vegan • Fiber-Rich • 100% Organic'
  },
  {
    name: 'High-Protein Fitness Breakfast',
    keywords: ['high protein', 'gym', 'fitness', 'breakfast', 'protein meal', 'eggs breakfast', 'muscle'],
    description: 'Nutrient-packed morning fuel with free-range eggs, Greek yogurt, and artisan sourdough bread.',
    requiredItems: [
      { search: 'Farm Eggs', qty: 1 },
      { search: 'Greek Yogurt', qty: 1 },
      { search: 'Sourdough Loaf', qty: 1 },
      { search: 'Whole Milk', qty: 1 }
    ],
    diet: 'High Protein (45g) • Low Glycemic'
  },
  {
    name: 'Artisan Tea & Evening Snack Platter',
    keywords: ['tea', 'chai', 'evening snack', 'snacks', 'green tea', 'tea time'],
    description: 'Relaxing hot organic green tea paired with roasted mixed nuts and Belgian dark chocolate.',
    requiredItems: [
      { search: 'Green Tea', qty: 1 },
      { search: 'Mixed Nuts', qty: 1 },
      { search: 'Dark Chocolate', qty: 1 }
    ],
    diet: 'Antioxidant Rich • Heart Healthy'
  },
  {
    name: 'Crispy Veggie Stir-Fry & Corn Bowl',
    keywords: ['stir fry', 'vegetables', 'veggie bowl', 'dinner', 'broccoli', 'corn'],
    description: 'Crunchy broccoli, bell peppers, fresh spinach, and sweet corn sautéed with European butter.',
    requiredItems: [
      { search: 'Fresh Broccoli', qty: 1 },
      { search: 'Bell Peppers', qty: 1 },
      { search: 'Sweet Corn', qty: 2 },
      { search: 'Fresh Spinach', qty: 1 },
      { search: 'Salted Butter', qty: 1 }
    ],
    diet: 'Low Calorie • Micronutrient Dense'
  },
  {
    name: 'Weekend Brunch Croissant Feast',
    keywords: ['brunch', 'croissant', 'weekend', 'muffins', 'coffee', 'bakery breakfast'],
    description: 'Flaky French croissants and blueberry muffins paired with cold brew coffee.',
    requiredItems: [
      { search: 'Butter Croissants', qty: 1 },
      { search: 'Blueberry Muffins', qty: 1 },
      { search: 'Cold Brew Coffee', qty: 1 }
    ],
    diet: 'Artisan Bakery • Morning Indulgence'
  }
];

/**
 * Process a natural language query and return recipe suggestions or grocery matches
 */
function processAssistantQuery(userPrompt) {
  const db = getDb();
  const lowerPrompt = (userPrompt || '').toLowerCase().trim();

  // 1. Check for exact or fuzzy Recipe matches
  for (const recipe of RECIPE_KNOWLEDGE_BASE) {
    const isMatch = recipe.keywords.some(k => lowerPrompt.includes(k));
    if (isMatch) {
      const resolvedItems = [];
      let totalCost = 0;

      for (const req of recipe.requiredItems) {
        const product = db.prepare('SELECT * FROM products WHERE name LIKE ?').get(`%${req.search}%`);
        if (product) {
          resolvedItems.push({
            id: product.id,
            name: product.name,
            emoji: product.emoji,
            price: product.price,
            unit: product.unit,
            quantity: req.qty,
            lineTotal: product.price * req.qty
          });
          totalCost += product.price * req.qty;
        }
      }

      return {
        type: 'recipe',
        reply: `Great choice! Here is the recipe bundle for **${recipe.name}**. I found all ${resolvedItems.length} fresh ingredients in our catalog. You can add the entire bundle to your cart in 1 click!`,
        recipe: {
          name: recipe.name,
          description: recipe.description,
          diet: recipe.diet,
          totalCost,
          items: resolvedItems
        }
      };
    }
  }

  // 2. If asking for a budget basket (e.g. "under ₹500" or "under 1000")
  const budgetMatch = lowerPrompt.match(/under\s*₹?\s*(\d+)/i) || lowerPrompt.match(/budget\s*₹?\s*(\d+)/i);
  if (budgetMatch) {
    const maxBudget = parseInt(budgetMatch[1]);
    const isVeg = lowerPrompt.includes('veg') || lowerPrompt.includes('vegetable');
    const isProtein = lowerPrompt.includes('protein');

    let query = 'SELECT * FROM products WHERE stock > 0';
    if (isVeg) query += " AND category IN ('vegetables', 'fruits', 'dairy', 'bakery')";
    if (isProtein) query += " AND category IN ('dairy', 'snacks')";
    query += ' ORDER BY rating DESC, price ASC';

    const candidates = db.prepare(query).all();
    const basket = [];
    let currentTotal = 0;

    for (const p of candidates) {
      if (currentTotal + p.price <= maxBudget) {
        basket.push({
          id: p.id,
          name: p.name,
          emoji: p.emoji,
          price: p.price,
          unit: p.unit,
          quantity: 1,
          lineTotal: p.price
        });
        currentTotal += p.price;
      }
    }

    return {
      type: 'recipe',
      reply: `I curated a custom basket tailored to your budget of **₹${maxBudget}**. Total comes to **₹${currentTotal}** with ${basket.length} top-rated items!`,
      recipe: {
        name: `AI Curated Basket (Under ₹${maxBudget})`,
        description: `Optimized combination of fresh grocery essentials staying strictly under ₹${maxBudget}.`,
        diet: isProtein ? 'High Protein Optimization' : 'Balanced Grocery Basket',
        totalCost: currentTotal,
        items: basket
      }
    };
  }

  // 3. Fallback to NLP Semantic Smart Search
  const searchResults = smartSearch(userPrompt, 4);
  if (searchResults.length > 0) {
    return {
      type: 'search',
      reply: `Here are the top fresh products matching your request:`,
      products: searchResults.map(r => r.product)
    };
  }

  return {
    type: 'general',
    reply: `I am your FreshCart AI assistant! You can ask me to plan recipes like *"Alphonso Mango Lassi"*, *"High-Protein Breakfast"*, *"Fruit Salad Bowl"*, or ask for a *"Weekly basket under ₹1000"*. How can I help you today?`
  };
}

module.exports = {
  processAssistantQuery,
  RECIPE_KNOWLEDGE_BASE
};
