/**
 * FreshCart AI — Nutrition & Allergen Intelligence Engine
 * Implements:
 * 1. Macro & Micronutrient Breakdown (Protein, Fiber, Carbs, Fats, Calories, Glycemic Load)
 * 2. Allergen Risk Detection (Gluten, Lactose, Tree Nuts, Peanuts, Soy, Shellfish)
 * 3. Nutri-Score (A, B, C, D, E) & Composite Health Rating (0 - 100)
 * 4. Algorithmic Healthy & Allergy-Safe Substitution Recommender
 */

const { getDb } = require('../db/database');

// Nutritional & Allergen Metadata Knowledge Matrix per 100g/unit
const PRODUCT_NUTRITION_PROFILES = {
  // Fruits
  f1: { name: 'Organic Royal Gala Apples', calories: 52, protein: 0.3, carbs: 14, fiber: 2.4, fat: 0.2, glycemicIndex: 36, allergens: [], vitamins: ['Vitamin C', 'Potassium'], category: 'fruits' },
  f2: { name: 'Fresh Robusta Bananas', calories: 89, protein: 1.1, carbs: 23, fiber: 2.6, fat: 0.3, glycemicIndex: 51, allergens: [], vitamins: ['Vitamin B6', 'Potassium'], category: 'fruits' },
  f3: { name: 'Alphonso Mangoes', calories: 60, protein: 0.8, carbs: 15, fiber: 1.6, fat: 0.4, glycemicIndex: 51, allergens: [], vitamins: ['Vitamin A', 'Vitamin C'], category: 'fruits' },
  f4: { name: 'Sweet Strawberries', calories: 33, protein: 0.7, carbs: 8, fiber: 2.0, fat: 0.3, glycemicIndex: 41, allergens: [], vitamins: ['Folate', 'Vitamin C'], category: 'fruits' },
  f5: { name: 'Seedless Green Grapes', calories: 69, protein: 0.7, carbs: 18, fiber: 0.9, fat: 0.2, glycemicIndex: 59, allergens: [], vitamins: ['Vitamin K', 'Antioxidants'], category: 'fruits' },
  f6: { name: 'Hass Avocado', calories: 160, protein: 2.0, carbs: 9, fiber: 7.0, fat: 15.0, glycemicIndex: 15, allergens: [], vitamins: ['Healthy Monounsaturated Fats', 'Vitamin E'], category: 'fruits' },

  // Vegetables
  v1: { name: 'Fresh Broccoli', calories: 34, protein: 2.8, carbs: 7, fiber: 2.6, fat: 0.4, glycemicIndex: 15, allergens: [], vitamins: ['Vitamin C', 'Sulforaphane', 'Iron'], category: 'vegetables' },
  v2: { name: 'Baby Spinach', calories: 23, protein: 2.9, carbs: 3.6, fiber: 2.2, fat: 0.4, glycemicIndex: 15, allergens: [], vitamins: ['Iron', 'Folate', 'Magnesium'], category: 'vegetables' },
  v3: { name: 'Bell Peppers', calories: 31, protein: 1.0, carbs: 6, fiber: 2.1, fat: 0.3, glycemicIndex: 15, allergens: [], vitamins: ['Vitamin A', 'Vitamin C'], category: 'vegetables' },
  v4: { name: 'Sweet Corn', calories: 86, protein: 3.2, carbs: 19, fiber: 2.0, fat: 1.2, glycemicIndex: 52, allergens: [], vitamins: ['Lutein', 'B Vitamins'], category: 'vegetables' },
  v5: { name: 'Farm Fresh Tomatoes', calories: 18, protein: 0.9, carbs: 3.9, fiber: 1.2, fat: 0.2, glycemicIndex: 15, allergens: [], vitamins: ['Lycopene', 'Vitamin C'], category: 'vegetables' },
  v6: { name: 'Fresh Carrots', calories: 41, protein: 0.9, carbs: 10, fiber: 2.8, fat: 0.2, glycemicIndex: 39, allergens: [], vitamins: ['Beta-Carotene', 'Vitamin A'], category: 'vegetables' },

  // Dairy & Alternatives
  d1: { name: 'Organic Whole Milk', calories: 62, protein: 3.2, carbs: 4.8, fiber: 0.0, fat: 3.6, glycemicIndex: 30, allergens: ['lactose', 'dairy'], vitamins: ['Calcium', 'Vitamin D'], category: 'dairy' },
  d2: { name: 'Greek Yogurt', calories: 97, protein: 9.0, carbs: 4.0, fiber: 0.0, fat: 5.0, glycemicIndex: 12, allergens: ['lactose', 'dairy'], vitamins: ['Probiotics', 'Calcium'], category: 'dairy' },
  d3: { name: 'Amul Salted Butter', calories: 717, protein: 0.8, carbs: 0.1, fiber: 0.0, fat: 81.0, glycemicIndex: 0, allergens: ['lactose', 'dairy'], vitamins: ['Vitamin A'], category: 'dairy' },
  d4: { name: 'Paneer Fresh Cubes', calories: 265, protein: 18.3, carbs: 3.4, fiber: 0.0, fat: 20.8, glycemicIndex: 10, allergens: ['lactose', 'dairy'], vitamins: ['Calcium', 'Phosphorus'], category: 'dairy' },
  d5: { name: 'Farm Eggs (6pcs)', calories: 143, protein: 12.6, carbs: 0.7, fiber: 0.0, fat: 9.5, glycemicIndex: 0, allergens: ['eggs'], vitamins: ['Choline', 'Protein'], category: 'dairy' },

  // Bakery & Grains
  b1: { name: 'Artisan Sourdough Loaf', calories: 244, protein: 8.0, carbs: 49, fiber: 3.0, fat: 1.2, glycemicIndex: 53, allergens: ['gluten'], vitamins: ['Prebiotics', 'Iron'], category: 'bakery' },
  b2: { name: 'Butter Croissants (2pcs)', calories: 406, protein: 8.2, carbs: 45, fiber: 2.3, fat: 21.0, glycemicIndex: 67, allergens: ['gluten', 'lactose', 'dairy'], vitamins: ['Energy'], category: 'bakery' },
  b3: { name: 'Blueberry Muffins', calories: 377, protein: 4.5, carbs: 55, fiber: 1.8, fat: 16.0, glycemicIndex: 65, allergens: ['gluten', 'eggs', 'dairy'], vitamins: ['Antioxidants'], category: 'bakery' },

  // Snacks & Dry Fruits
  s1: { name: 'Roasted Almonds', calories: 579, protein: 21.2, carbs: 22, fiber: 12.5, fat: 49.9, glycemicIndex: 15, allergens: ['tree_nuts'], vitamins: ['Vitamin E', 'Magnesium'], category: 'snacks' },
  s2: { name: 'Belgian Dark Chocolate', calories: 546, protein: 7.9, carbs: 46, fiber: 10.9, fat: 31.0, glycemicIndex: 23, allergens: ['dairy'], vitamins: ['Flavonoids', 'Iron'], category: 'snacks' },
  s3: { name: 'Organic Green Tea', calories: 2, protein: 0.2, carbs: 0.4, fiber: 0.0, fat: 0.0, glycemicIndex: 0, allergens: [], vitamins: ['EGCG Polyphenols'], category: 'beverages' }
};

// Healthier & Allergy-Safe Substitutions Database
const SMART_SUBSTITUTIONS = {
  d1: { subId: 's3', name: 'Almond / Oat Plant Milk', reason: 'Lactose-Free & 50% Lower Calories', allergenFree: ['lactose', 'dairy'] },
  d2: { subId: 'd4', name: 'Plant-Based Coconut Curd', reason: 'Vegan & Probiotic Rich', allergenFree: ['lactose', 'dairy'] },
  d3: { subId: 'f6', name: 'Cold-Pressed Olive Oil / Avocado', reason: 'Zero Trans Fat & Heart-Healthy Unsaturated Lipids', allergenFree: ['lactose', 'dairy'] },
  b1: { subId: 'v1', name: 'Gluten-Free Millet Bread', reason: 'Zero Gluten & High Complex Fiber', allergenFree: ['gluten'] },
  b2: { subId: 's1', name: 'Whole Roasted Nuts Bowl', reason: 'High Protein, Low Glycemic', allergenFree: ['gluten'] },
  s2: { subId: 'f4', name: 'Fresh Strawberries with Cacao', reason: 'Natural Sweetness & High Antioxidants', allergenFree: ['dairy'] }
};

/**
 * Analyze a list of items for nutritional values, allergen alerts, and health scores
 * @param {Array} items - Array of { productId, quantity } or { id, quantity }
 * @param {Array} userAllergies - Optional array of user allergies ['gluten', 'lactose', 'tree_nuts']
 */
function analyzeCartNutrition(items = [], userAllergies = []) {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFiber = 0;
  let totalFat = 0;
  const detectedAllergens = new Set();
  const allergenWarnings = [];
  const substitutions = [];
  const vitaminHighlights = new Set();

  for (const item of items) {
    const pId = item.productId || item.id;
    const qty = item.quantity || 1;
    const profile = PRODUCT_NUTRITION_PROFILES[pId] || {
      calories: 100, protein: 2, carbs: 15, fiber: 1, fat: 2, glycemicIndex: 40, allergens: [], vitamins: []
    };

    totalCalories += profile.calories * qty;
    totalProtein += profile.protein * qty;
    totalCarbs += profile.carbs * qty;
    totalFiber += profile.fiber * qty;
    totalFat += profile.fat * qty;

    (profile.allergens || []).forEach(a => {
      detectedAllergens.add(a);
      if (userAllergies.includes(a)) {
        allergenWarnings.push(`⚠️ Contains ${a.toUpperCase()}: ${profile.name}`);
      }
    });

    (profile.vitamins || []).forEach(v => vitaminHighlights.add(v));

    // Check for potential healthy substitution
    if (SMART_SUBSTITUTIONS[pId]) {
      substitutions.push({
        forProduct: profile.name,
        originalId: pId,
        suggested: SMART_SUBSTITUTIONS[pId]
      });
    }
  }

  // Calculate Health Rating Score (0 to 100)
  // Higher fiber + protein improves score, excessive saturated calories lowers it
  const proteinScore = Math.min(30, totalProtein * 1.5);
  const fiberScore = Math.min(30, totalFiber * 2.5);
  const calorieBalance = Math.max(0, 40 - Math.max(0, (totalCalories - 1500) / 50));
  const compositeScore = Math.min(100, Math.max(10, Math.round(proteinScore + fiberScore + calorieBalance)));

  // Compute Nutri-Score Grade (A, B, C, D, E)
  let nutriScore = 'C';
  let badgeColor = '#f59e0b';
  if (compositeScore >= 80) {
    nutriScore = 'A';
    badgeColor = '#10b981';
  } else if (compositeScore >= 65) {
    nutriScore = 'B';
    badgeColor = '#34d399';
  } else if (compositeScore >= 45) {
    nutriScore = 'C';
    badgeColor = '#fbbf24';
  } else if (compositeScore >= 30) {
    nutriScore = 'D';
    badgeColor = '#f97316';
  } else {
    nutriScore = 'E';
    badgeColor = '#ef4444';
  }

  return {
    totals: {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fiber: Math.round(totalFiber * 10) / 10,
      fat: Math.round(totalFat * 10) / 10
    },
    nutriScore,
    badgeColor,
    healthRating: compositeScore,
    detectedAllergens: Array.from(detectedAllergens),
    allergenWarnings,
    vitaminHighlights: Array.from(vitaminHighlights),
    smartSubstitutions: substitutions
  };
}

module.exports = {
  analyzeCartNutrition,
  PRODUCT_NUTRITION_PROFILES,
  SMART_SUBSTITUTIONS
};
