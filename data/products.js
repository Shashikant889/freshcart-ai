const products = [
  // Fruits
  { id: 'f1', name: 'Organic Apples', emoji: '🍎', category: 'fruits', price: 249, unit: 'kg', description: 'Crisp & sweet organic Fuji apples', stock: 50, rating: 4.8 },
  { id: 'f2', name: 'Fresh Bananas', emoji: '🍌', category: 'fruits', price: 49, unit: 'dozen', description: 'Perfectly ripe yellow bananas', stock: 80, rating: 4.6 },
  { id: 'f3', name: 'Juicy Oranges', emoji: '🍊', category: 'fruits', price: 149, unit: 'kg', description: 'Valencia oranges, bursting with flavor', stock: 45, rating: 4.7 },
  { id: 'f4', name: 'Sweet Strawberries', emoji: '🍓', category: 'fruits', price: 199, unit: '250g', description: 'Farm-fresh premium strawberries', stock: 30, rating: 4.9 },
  { id: 'f5', name: 'Ripe Mangoes', emoji: '🥭', category: 'fruits', price: 99, unit: 'each', description: 'Alphonso mangoes, tropical delight', stock: 40, rating: 4.8 },
  { id: 'f6', name: 'Green Grapes', emoji: '🍇', category: 'fruits', price: 179, unit: 'kg', description: 'Seedless Thompson green grapes', stock: 35, rating: 4.5 },

  // Vegetables
  { id: 'v1', name: 'Fresh Broccoli', emoji: '🥦', category: 'vegetables', price: 89, unit: 'head', description: 'Crisp green broccoli crowns', stock: 60, rating: 4.5 },
  { id: 'v2', name: 'Red Tomatoes', emoji: '🍅', category: 'vegetables', price: 49, unit: 'kg', description: 'Vine-ripened Roma tomatoes', stock: 70, rating: 4.6 },
  { id: 'v3', name: 'Baby Carrots', emoji: '🥕', category: 'vegetables', price: 79, unit: '500g', description: 'Sweet & crunchy baby carrots', stock: 55, rating: 4.4 },
  { id: 'v4', name: 'Fresh Spinach', emoji: '🥬', category: 'vegetables', price: 39, unit: 'bunch', description: 'Tender baby spinach leaves', stock: 40, rating: 4.7 },
  { id: 'v5', name: 'Bell Peppers', emoji: '🫑', category: 'vegetables', price: 149, unit: 'kg', description: 'Mixed color bell peppers', stock: 45, rating: 4.3 },
  { id: 'v6', name: 'Sweet Corn', emoji: '🌽', category: 'vegetables', price: 29, unit: 'each', description: 'Fresh sweet corn on the cob', stock: 50, rating: 4.6 },

  // Dairy
  { id: 'd1', name: 'Whole Milk', emoji: '🥛', category: 'dairy', price: 69, unit: 'liter', description: 'Farm-fresh pasteurized whole milk', stock: 100, rating: 4.7 },
  { id: 'd2', name: 'Cheddar Cheese', emoji: '🧀', category: 'dairy', price: 249, unit: '200g', description: 'Aged sharp cheddar block', stock: 40, rating: 4.8 },
  { id: 'd3', name: 'Greek Yogurt', emoji: '🫙', category: 'dairy', price: 179, unit: '500g', description: 'Thick & creamy Greek yogurt', stock: 60, rating: 4.6 },
  { id: 'd4', name: 'Farm Eggs', emoji: '🥚', category: 'dairy', price: 99, unit: 'dozen', description: 'Free-range organic eggs', stock: 50, rating: 4.9 },
  { id: 'd5', name: 'Salted Butter', emoji: '🧈', category: 'dairy', price: 249, unit: '250g', description: 'Premium European-style butter', stock: 35, rating: 4.7 },

  // Bakery
  { id: 'b1', name: 'Sourdough Loaf', emoji: '🍞', category: 'bakery', price: 199, unit: 'loaf', description: 'Artisan sourdough bread', stock: 25, rating: 4.8 },
  { id: 'b2', name: 'Butter Croissants', emoji: '🥐', category: 'bakery', price: 249, unit: '4-pack', description: 'Flaky French-style croissants', stock: 30, rating: 4.9 },
  { id: 'b3', name: 'Bagels', emoji: '🥯', category: 'bakery', price: 199, unit: '6-pack', description: 'New York style plain bagels', stock: 35, rating: 4.5 },
  { id: 'b4', name: 'Chocolate Cake', emoji: '🍰', category: 'bakery', price: 599, unit: 'each', description: 'Rich dark chocolate layer cake', stock: 15, rating: 4.9 },
  { id: 'b5', name: 'Blueberry Muffins', emoji: '🧁', category: 'bakery', price: 299, unit: '4-pack', description: 'Fresh-baked blueberry muffins', stock: 20, rating: 4.7 },

  // Beverages
  { id: 'bv1', name: 'Orange Juice', emoji: '🧃', category: 'beverages', price: 149, unit: 'liter', description: 'Freshly squeezed OJ, no pulp', stock: 40, rating: 4.6 },
  { id: 'bv2', name: 'Green Tea', emoji: '🍵', category: 'beverages', price: 249, unit: '20-bags', description: 'Organic Japanese green tea', stock: 50, rating: 4.8 },
  { id: 'bv3', name: 'Sparkling Water', emoji: '💧', category: 'beverages', price: 199, unit: '6-pack', description: 'Natural mineral sparkling water', stock: 70, rating: 4.4 },
  { id: 'bv4', name: 'Cold Brew Coffee', emoji: '☕', category: 'beverages', price: 349, unit: 'bottle', description: 'Premium cold brew concentrate', stock: 30, rating: 4.9 },

  // Snacks
  { id: 's1', name: 'Mixed Nuts', emoji: '🥜', category: 'snacks', price: 399, unit: '300g', description: 'Roasted & salted premium mix', stock: 45, rating: 4.7 },
  { id: 's2', name: 'Dark Chocolate', emoji: '🍫', category: 'snacks', price: 249, unit: '100g', description: '72% cacao Belgian dark chocolate', stock: 50, rating: 4.8 },
  { id: 's3', name: 'Potato Chips', emoji: '🥔', category: 'snacks', price: 99, unit: '150g', description: 'Sea salt & vinegar kettle chips', stock: 60, rating: 4.5 },
  { id: 's4', name: 'Granola Bars', emoji: '🥣', category: 'snacks', price: 299, unit: '6-pack', description: 'Oat & honey crunchy bars', stock: 40, rating: 4.6 },
  { id: 's5', name: 'Dried Mangoes', emoji: '🥭', category: 'snacks', price: 199, unit: '200g', description: 'Naturally sweet dried mango slices', stock: 35, rating: 4.7 }
];

module.exports = products;
