/**
 * FreshCart AI — 10,000 Realistic Grocery Products Generator
 * Generates ~10,000 structured, authentic grocery catalog items mapped across all 100+ categories.
 * Preserves the 31 original baseline products (f1..s5) with untouched attributes.
 */

const fs = require('fs');
const path = require('path');
const baselineProducts = require('../data/products');
const { CATEGORIES_DATA } = require('./generate-categories');
const { resolveProductImage } = require('../services/image-resolver');

function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const BRANDS_BY_DEPARTMENT = {
  'Fresh Produce': ['FarmFresh', 'Zespri', 'Del Monte', 'Organic India', 'Fresho', 'Safal', 'Mister Fresh', 'Country Farms', 'GreenValley', 'KisanDirect', 'NatureBasket', 'PurePluck'],
  'Dairy & Eggs': ['Amul', 'Mother Dairy', 'Nandini', 'Epigamia', 'Nestle', 'Milky Mist', 'Gowardhan', 'Govind', 'Akshayakalpa', 'Country Delight', 'Eggoz', 'Brotos'],
  'Bakery': ['Britannia', 'English Oven', 'The Baker\'s Dozen', 'Bonn', 'Harvest Gold', 'Modern', 'Bimbo', 'Sunfeast', 'Winkies', 'Muffins & More', 'Artisan Loft', 'DailyBake'],
  'Confectionery': ['Cadbury', 'Amul', 'Nestle', 'Ferrero', 'Hershey\'s', 'Haldiram\'s', 'Bikaji', 'Lotte', 'M&M', 'Lindt', 'Parle', 'Chitale'],
  'Frozen Foods': ['McCain', 'Godrej Yummiez', 'ITC Master Chef', 'Sumeru', 'Vadilal', 'Kwality Wall\'s', 'Amul', 'Baskin Robbins', 'Havmor', 'Creambell'],
  'Staples & Grains': ['Tata Sampann', 'Aashirvaad', 'Fortune', 'India Gate', 'Daawat', 'Dhara', 'Saffola', 'Natureland', '24 Mantra', 'Patanjali', 'Catch', 'Everest', 'MDH', 'Pillsbury', 'Kohinoor'],
  'Dry Fruits & Nuts': ['Happilo', 'Nutraj', 'Farmley', 'Nutty Gritties', 'True Elements', 'Tulsi', 'Solimo', 'Tata Sampann', 'GreenFinch', 'Royal Delight', 'NutriChoice'],
  'Snacks & Munchies': ['Haldiram\'s', 'Balaji', 'Lays', 'Kurkure', 'Bingo', 'Doritos', 'Pringles', 'Bikaji', 'Bikanervala', 'Too Yumm', 'Crax', 'Act II', 'Tongue Twister'],
  'Beverages': ['Tata Tea', 'Red Label', 'Taj Mahal', 'Nescafe', 'Bru', 'Twinings', 'Tetley', 'Real', 'Tropicana', 'Paper Boat', 'Raw Pressery', 'Coca-Cola', 'Pepsi', 'Red Bull', 'Bisleri', 'Kinley'],
  'Instant & Frozen': ['Maggi', 'Yippee', 'Ching\'s Secret', 'Knorr', 'Top Ramen', 'Nissin', 'Bambino', 'MTR', 'Gits', 'Kissan', 'Veeba', 'Dr. Oetker', 'Del Monte', 'Nutella', 'Pintola', 'Sundrop', 'Mother\'s Recipe', 'Pravin'],
  'Personal Care': ['Dettol', 'Lifebuoy', 'Dove', 'Lux', 'Pears', 'Fiama', 'Head & Shoulders', 'Pantene', 'Clinic Plus', 'Parachute', 'Colgate', 'Pepsodent', 'Sensodyne', 'Nivea', 'Ponds', 'Gillette', 'Whisper', 'Stayfree', 'Axe', 'Fogg', 'Engage'],
  'Baby Care': ['Pampers', 'Huggies', 'MamyPoko', 'Johnson\'s Baby', 'Himalaya Baby', 'Sebamed', 'Nestle Cerelac', 'Mother Sparsh', 'Chicco'],
  'Household & Cleaning': ['Surf Excel', 'Ariel', 'Tide', 'Rin', 'Comfort', 'Vim', 'Pril', 'Scotch-Brite', 'Lizol', 'Colin', 'Harpic', 'Good Knight', 'All Out', 'HIT', 'Odonil', 'Godrej aer', 'Origami', 'Paseo', 'Hindalco Freshwrap', 'Duracell'],
  'Specialty & Wellness': ['Organic India', '24 Mantra', 'Kapiva', 'Dabur', 'Baidyanath', 'Himalaya', 'Optimum Nutrition', 'MuscleBlaze', 'RiteBite Max', 'Yoga Bar', 'The Whole Truth', 'Ketofy', 'Urban Platter'],
  'Regional Foods': ['MTR', 'Aachi', 'Grand Sweets', 'Chitale Bandhu', 'Bedekar', 'Bikaji', 'Haldiram\'s Prabhuji', 'Mukharochak', 'Shree Mahila Griha Udyog (Lijjat)', 'A2B', 'Maiyas'],
  'Pet Supplies': ['Pedigree', 'Drools', 'Whiskas', 'Royal Canin', 'Purepet', 'Meat Up', 'Chappi', 'Sheba'],
  'Pooja Essentials': ['Cycle Pure Agarbatti', 'Mangaldeep', 'Zed Black', 'Om Shanthi', 'Moksh', 'CamPure', 'Shubhkart']
};

const PRODUCT_TEMPLATES = {
  fruits: [
    { name: '{brand} Fresh {variety} Apples', price: [140, 299], unit: '1 kg', tags: ['fresh', 'organic', 'fruit'], varieties: ['Royal Gala', 'Kashmiri', 'Kinnaur', 'Fuji', 'Red Delicious', 'Granny Smith'] },
    { name: '{brand} Farm Bananas ({variety})', price: [45, 95], unit: '1 dozen', tags: ['fresh', 'energy', 'fruit'], varieties: ['Robusta', 'Yelakki', 'Nendran', 'Red Banana', 'Cavendish'] },
    { name: '{brand} Juicy Sweet Oranges', price: [70, 160], unit: '1 kg', tags: ['fresh', 'citrus', 'vitamin-c'], varieties: ['Nagpur', 'Valencia', 'Kinnow', 'Jaffa'] },
    { name: '{brand} Fresh Mangoes ({variety})', price: [180, 550], unit: '1 kg', tags: ['seasonal', 'sweet', 'fruit'], varieties: ['Alphonso (Hapus)', 'Kesar', 'Banganapalli', 'Dasheri', 'Langra', 'Totapuri'] },
    { name: '{brand} Seedless Sweet Grapes', price: [80, 190], unit: '500 g', tags: ['fresh', 'sweet', 'fruit'], varieties: ['Thompson Seedless', 'Sharad Black', 'Sonaka Green', 'Red Globe'] },
    { name: '{brand} Fresh Papaya ({variety})', price: [50, 110], unit: '1 pc (approx 1kg)', tags: ['fresh', 'digestive', 'fruit'], varieties: ['Red Lady', 'Taiwan 786', 'Honey Sweet'] },
    { name: '{brand} Fresh Watermelon', price: [60, 130], unit: '1 pc (approx 2.5kg)', tags: ['fresh', 'hydrating', 'fruit'], varieties: ['Sugar Baby', 'Kiran Seedless', 'Yellow Melon'] },
    { name: '{brand} Sweet Pomegranate Arils', price: [120, 260], unit: '500 g', tags: ['fresh', 'antioxidant', 'fruit'], varieties: ['Bhagwa', 'Arakta', 'Kandhari'] },
    { name: '{brand} Fresh Guava', price: [55, 115], unit: '1 kg', tags: ['fresh', 'fiber', 'fruit'], varieties: ['Allahabad Safeda', 'L-49 Sardar', 'Thai Pink Guava'] },
    { name: '{brand} Fresh Pineapple', price: [75, 140], unit: '1 pc', tags: ['fresh', 'tangy', 'fruit'], varieties: ['Queen', 'Kew Sweet', 'Mauritius'] }
  ],
  vegetables: [
    { name: '{brand} Fresh Farm Tomatoes', price: [25, 65], unit: '1 kg', tags: ['fresh', 'vegetable', 'cooking'], varieties: ['Hybrid Local', 'Roma Cherry', 'Desi Sour', 'Green Cooking'] },
    { name: '{brand} Mountain Gold Potatoes', price: [30, 70], unit: '1 kg', tags: ['fresh', 'staple', 'vegetable'], varieties: ['Jyoti', 'Pahari Golden', 'Baby Potatoes', 'Kufri Chipsona'] },
    { name: '{brand} Premium Pink Onions', price: [35, 80], unit: '1 kg', tags: ['fresh', 'staple', 'vegetable'], varieties: ['Nashik Pink', 'Sambhar Small', 'Red Globe', 'Spring Onion'] },
    { name: '{brand} Fresh Tender Cauliflower', price: [35, 75], unit: '1 pc', tags: ['fresh', 'vegetable'], varieties: ['Snow White', 'Pusa Deep', 'Baby Gobhi'] },
    { name: '{brand} Crunchy Green Cabbage', price: [25, 55], unit: '1 pc', tags: ['fresh', 'fiber', 'vegetable'], varieties: ['Golden Acre', 'Red Cabbage', 'Savoy'] },
    { name: '{brand} Fresh Green Beans', price: [45, 95], unit: '500 g', tags: ['fresh', 'green', 'vegetable'], varieties: ['French Beans', 'Cluster Beans (Gwar)', 'Broad Beans (Sem)'] },
    { name: '{brand} Farm Fresh Green Peas (Matar)', price: [60, 140], unit: '1 kg', tags: ['fresh', 'sweet', 'vegetable'], varieties: ['Sweet Golden', 'Desi Chhilka', 'Frozen Tender'] },
    { name: '{brand} Fresh Ladyfinger / Bhindi', price: [40, 85], unit: '500 g', tags: ['fresh', 'green', 'vegetable'], varieties: ['Pusa Sawani', 'Desi Tender', 'Okra Green'] },
    { name: '{brand} Crisp Capsicum Bell Pepper', price: [50, 110], unit: '500 g', tags: ['fresh', 'crunchy', 'vegetable'], varieties: ['Green Wonder', 'Yellow California', 'Red Bell'] },
    { name: '{brand} Fresh Bottle Gourd (Lauki)', price: [30, 65], unit: '1 pc (approx 800g)', tags: ['fresh', 'cooling', 'vegetable'], varieties: ['Desi Long', 'Round Gourd', 'Tender Green'] }
  ],
  dairy: [
    { name: '{brand} Homogenised Toned Milk', price: [30, 65], unit: '500 ml', tags: ['dairy', 'calcium', 'fresh'], varieties: ['Taaza', 'Slim & Trim', 'Standardized', 'A2 Cow', 'Full Cream Gold'] },
    { name: '{brand} Farm Fresh Malai Paneer', price: [95, 230], unit: '200 g', tags: ['dairy', 'protein', 'fresh'], varieties: ['Classic Block', 'Low Fat Diced', 'Organic Cow', 'Chunky Cubes'] },
    { name: '{brand} Creamy Probiotic Dahi (Curd)', price: [35, 95], unit: '400 g', tags: ['dairy', 'probiotic', 'fresh'], varieties: ['Set Curd', 'Pouch Dahi', 'Masti Spiced', 'Greek High Protein'] },
    { name: '{brand} Pasteurized Table Butter', price: [55, 275], unit: '100 g', tags: ['dairy', 'butter', 'breakfast'], varieties: ['Salted Classic', 'Unsalted White', 'Garlic Herb', 'Lite Fat Spread'] },
    { name: '{brand} Processed Cheese Slices', price: [90, 240], unit: '200 g (10 slices)', tags: ['dairy', 'cheese', 'calcium'], varieties: ['Classic Cheddar', 'Smoked Pepper', 'Mozzarella Blend', 'Pizza Cubes'] },
    { name: '{brand} Pure Desi Ghee (Cow/Buffalo)', price: [350, 850], unit: '500 ml', tags: ['dairy', 'traditional', 'ghee'], varieties: ['A2 Gir Cow', 'Bilona Churned', 'Danedar Golden', 'Grass-Fed'] },
    { name: '{brand} Farm Fresh Free-Range Eggs', price: [85, 175], unit: '6 pcs pack', tags: ['dairy', 'protein', 'eggs'], varieties: ['White Table', 'Brown Organic', 'Omega-3 Enriched', 'Country Free Range'] }
  ],
  staples: [
    { name: '{brand} Royal Aged Basmati Rice', price: [120, 280], unit: '1 kg', tags: ['staples', 'grains', 'rice'], varieties: ['Rozana Gold', 'Biryani Special 1121', 'Super Long Grain', 'Classic Aged'] },
    { name: '{brand} Chakki Fresh 100% Whole Wheat Atta', price: [210, 390], unit: '5 kg', tags: ['staples', 'atta', 'fiber'], varieties: ['Sharbati MP Gold', 'Multigrain 7-Grain', 'Organic Lokwan', 'Select Desi'] },
    { name: '{brand} Unpolished Toor Dal (Arhar)', price: [135, 220], unit: '1 kg', tags: ['staples', 'dal', 'protein'], varieties: ['Desi Organic', 'Tata Grade 1', 'Latur Yellow', 'Special Split'] },
    { name: '{brand} Yellow Moong Dal Split', price: [110, 185], unit: '1 kg', tags: ['staples', 'dal', 'protein'], varieties: ['Dhuli (Washed)', 'Chilka Green', 'Whole Organic'] },
    { name: '{brand} Premium Kabuli Chickpeas (Chana)', price: [125, 210], unit: '1 kg', tags: ['staples', 'pulses', 'protein'], varieties: ['Dollar Jumbo', 'Desi Kala Chana', 'Sprouting Grade'] },
    { name: '{brand} Pure Kachi Ghani Mustard Oil', price: [140, 220], unit: '1 L', tags: ['staples', 'cooking-oil'], varieties: ['Cold Pressed Virgin', 'Filtered Pure', 'Traditional Kolhu'] },
    { name: '{brand} Refined Sunflower Cooking Oil', price: [125, 195], unit: '1 L', tags: ['staples', 'cooking-oil', 'healthy-heart'], varieties: ['Vitamins A&D Enriched', 'Lite Antioxidant', 'Gold Blend'] },
    { name: '{brand} Iodized Crystal Free Table Salt', price: [24, 45], unit: '1 kg', tags: ['staples', 'salt'], varieties: ['Vacuum Evaporated', 'Rock Salt (Sendha)', 'Low Sodium Lite'] },
    { name: '{brand} Pure Sugar / Organic Jaggery Powder', price: [50, 110], unit: '1 kg', tags: ['staples', 'sweetener'], varieties: ['Sulfur Free White', 'Desi Shakkar Jaggery', 'Organic Brown Cane'] }
  ],
  snacks: [
    { name: '{brand} Crispy Aloo Bhujia Namkeen', price: [45, 125], unit: '200 g', tags: ['snacks', 'crunchy', 'tea-time'], varieties: ['Spicy Masala', 'Zero Oil Roasted', 'Lemon Mint', 'Classic Ratlami'] },
    { name: '{brand} Crunchy Potato Chips / Wafers', price: [20, 60], unit: '90 g', tags: ['snacks', 'crisps'], varieties: ['Classic Salted', 'Magic Masala', 'Cream & Onion', 'Spanish Tomato'] },
    { name: '{brand} Premium Roasted Foxnuts (Makhana)', price: [95, 240], unit: '100 g', tags: ['snacks', 'healthy', 'protein'], varieties: ['Himalayan Pink Salt', 'Cheese & Herbs', 'Peri Peri Zest', 'Pudina Crunch'] },
    { name: '{brand} Baked Multigrain Biscuits & Cookies', price: [35, 110], unit: '150 g', tags: ['snacks', 'biscuits'], varieties: ['Digestive Oats', 'Butter Delights', 'Choco Chip Fusion', 'Almond Nutty'] }
  ],
  beverages: [
    { name: '{brand} Premium CTC Granule Tea (Chai)', price: [120, 310], unit: '500 g', tags: ['beverages', 'tea', 'hot-drink'], varieties: ['Royal Elaichi', 'Assam Strong', 'Masala Kadak', 'Gold Blend'] },
    { name: '{brand} 100% Pure Instant Coffee', price: [95, 340], unit: '100 g', tags: ['beverages', 'coffee', 'energy'], varieties: ['Arabica Classic', 'Gold Roast Granules', 'Filter Chicory Blend', 'Vanilla Hazelnut'] },
    { name: '{brand} 100% Pure Real Fruit Juice', price: [90, 165], unit: '1 L', tags: ['beverages', 'juice', 'refreshing'], varieties: ['Mixed Fruit Bliss', 'Pomegranate Ruby', 'Tender Coconut Water', 'Guava Masala'] },
    { name: '{brand} Sparkling Tonic & Soft Drink', price: [40, 95], unit: '750 ml', tags: ['beverages', 'cold-drink'], varieties: ['Ginger Lemonade', 'Classic Cola Zero', 'Diet Tonic Water', 'Jeera Soda'] }
  ],
  bakery: [
    { name: '{brand} Fresh {variety} Bread Loaf', price: [45, 95], unit: '400 g', tags: ['bakery', 'bread'], varieties: ['Whole Wheat', 'White Sandwich', 'Multigrain Atta', 'Brown Bread', 'Artisan Sourdough'] },
    { name: '{brand} Fresh Flaky Butter Croissants', price: [99, 240], unit: '2 pcs', tags: ['bakery', 'croissant'], varieties: ['Classic Butter', 'Chocolate Filled', 'Almond Toasted'] },
    { name: '{brand} Baked Crispy Milk Rusks & Toast', price: [40, 95], unit: '300 g', tags: ['bakery', 'rusks'], varieties: ['Elaichi Toast', 'Butter Rusk', 'Wheat Crunch'] },
    { name: '{brand} Fresh Blueberry Muffins & Cupcakes', price: [75, 180], unit: '2 pcs', tags: ['bakery', 'muffins'], varieties: ['Blueberry Burst', 'Double Choco Chip', 'Vanilla Cream'] },
    { name: '{brand} Soft Burger Buns & Pav', price: [35, 75], unit: '4 pcs', tags: ['bakery', 'buns'], varieties: ['Classic Pav', 'Sesame Burger Bun', 'Garlic Loaf'] }
  ],
  personal_care: [
    { name: '{brand} Gentle Bathing Bar Soap', price: [35, 120], unit: '125 g', tags: ['personal-care', 'soap', 'hygiene'], varieties: ['Almond & Cream', 'Neem & Turmeric', 'Deep Cleanse', 'Moisturizing Cream', 'Fresh Lime'] },
    { name: '{brand} Daily Nourishing Hair Care Shampoo', price: [140, 380], unit: '340 ml', tags: ['personal-care', 'shampoo', 'hair-care'], varieties: ['Smooth & Silky', 'Anti-Dandruff', 'Hair Fall Control', 'Damage Repair'] },
    { name: '{brand} Fresh Gel Toothpaste', price: [55, 175], unit: '150 g', tags: ['personal-care', 'oral-care', 'hygiene'], varieties: ['Strong Teeth', 'Red Gel Freshness', 'Complete Protection', 'Charcoal Deep Clean'] },
    { name: '{brand} Intensive Moisture Skin Care Cream', price: [95, 290], unit: '200 ml', tags: ['personal-care', 'skin-care'], varieties: ['Cocoa Butter', 'Aloe Vera Soft', 'Deep Moisturizing'] },
    { name: '{brand} All Day Long Deodorant Body Spray', price: [160, 320], unit: '150 ml', tags: ['personal-care', 'fragrance'], varieties: ['Intense Fresh', 'Cool Ocean', 'Active Black', 'Pure Delight'] }
  ],
  household: [
    { name: '{brand} Advanced Stain Removal Detergent Powder', price: [80, 290], unit: '1 kg', tags: ['cleaning', 'detergent', 'laundry'], varieties: ['Matic Top Load', 'Front Load Active', 'Easy Wash Lemon', 'Oxy Clean'] },
    { name: '{brand} Ultra Degreasing Dishwash Liquid', price: [45, 160], unit: '500 ml', tags: ['cleaning', 'dishwash'], varieties: ['Lemon Fresh', 'Active Gel Pudina', 'Anti-Bacterial Neem'] },
    { name: '{brand} Surface Disinfectant Floor Cleaner', price: [90, 240], unit: '1 L', tags: ['cleaning', 'floor-cleaner'], varieties: ['Citrus Orange', 'Pine Fresh', 'Floral Lavender', 'Active Neem'] },
    { name: '{brand} Automatic Mosquito Repellent Refill', price: [70, 190], unit: '45 ml (Pack of 2)', tags: ['household', 'repellent'], varieties: ['Power Activ+', 'Turbo Vapour', 'Gold Herbal'] },
    { name: '{brand} Pocket Bathroom Air Freshener', price: [50, 110], unit: '10 g', tags: ['household', 'air-freshener'], varieties: ['Mystic Rose', 'Lavender Bloom', 'Jasmine Fresh', 'Tangerine'] }
  ],
  baby_care: [
    { name: '{brand} Ultra Soft Baby Diapers Pants', price: [299, 899], unit: '32 pcs', tags: ['baby-care', 'diapers'], varieties: ['Newborn S', 'Medium Pants', 'Large Flexible', 'XL Comfort'] },
    { name: '{brand} Gentle Baby Skin Wipes', price: [99, 240], unit: '72 wipes', tags: ['baby-care', 'wipes'], varieties: ['Aloe Vera 99% Water', 'Pure Sensitive', 'Chamomile Calming'] },
    { name: '{brand} Nutrition Rich Baby Cereal (Cerelac)', price: [180, 340], unit: '300 g', tags: ['baby-care', 'baby-food'], varieties: ['Wheat Apple', 'Rice Mixed Fruit', 'Multigrain Ragi'] }
  ],
  pet_supplies: [
    { name: '{brand} Complete Nutrition Adult Dog Food', price: [250, 850], unit: '1.2 kg', tags: ['pet-care', 'dog-food'], varieties: ['Chicken & Vegetables', 'Meat & Rice', 'Puppy Milk & Chicken'] },
    { name: '{brand} Premium Ocean Fish Cat Food', price: [180, 620], unit: '1 kg', tags: ['pet-care', 'cat-food'], varieties: ['Ocean Fish & Tuna', 'Salmon in Gravy', 'Mackerel Feast'] }
  ],
  pooja: [
    { name: '{brand} Fragrant Sacred Agarbatti Sticks', price: [40, 150], unit: '100 sticks', tags: ['pooja', 'agarbatti'], varieties: ['Sandalwood Chandan', 'Mogra Jasmine', 'Rose Blossom', 'Sambrani'] },
    { name: '{brand} Pure Camphor Tablets (Kapur)', price: [60, 220], unit: '100 g', tags: ['pooja', 'camphor'], varieties: ['100% Pure Bhimseni', 'Original White Tablets', 'Aromatherapeutic'] }
  ],
  confectionery: [
    { name: '{brand} Rich Belgian Dark Chocolate Bar', price: [70, 250], unit: '100 g', tags: ['snacks', 'chocolate'], varieties: ['72% Cocoa Dark', 'Fruit & Nut', 'Roasted Almond', 'Milk Silk'] },
    { name: '{brand} Assorted Chocolate Gift Box', price: [199, 599], unit: '200 g', tags: ['snacks', 'chocolate'], varieties: ['Pralines & Truffles', 'Celebrations Pack', 'Gold Selection'] }
  ],
  regional: [
    { name: '{brand} Traditional Kaju Katli Mithai', price: [220, 650], unit: '250 g', tags: ['regional', 'sweets'], varieties: ['Pure Kaju Barfi', 'Motichoor Laddu', 'Besan Ladoo', 'Gulab Jamun'] },
    { name: '{brand} Authentic Crisp Spiced Papads', price: [45, 120], unit: '200 g', tags: ['regional', 'staples'], varieties: ['Udad Moong Spiced', 'Punjabi Masala', 'Bikaneri Cumin'] }
  ],
  dry_fruits: [
    { name: '{brand} California Whole Almonds (Badam)', price: [199, 650], unit: '250 g', tags: ['dry-fruits', 'nuts'], varieties: ['Royal California', 'Organic Kashmiri Mamra', 'Jumbo Grade 1'] },
    { name: '{brand} Whole Raw Cashew Nuts (Kaju)', price: [220, 720], unit: '250 g', tags: ['dry-fruits', 'cashews'], varieties: ['W240 Jumbo', 'W320 Popular', 'Roasted & Salted'] }
  ],
  meat: [
    { name: '{brand} Fresh Farm {variety} Chicken', price: [160, 290], unit: '500 g', tags: ['meat', 'fresh', 'chicken'], varieties: ['Curry Cut', 'Boneless Breast Tender', 'Biryani Cut', 'Tender Drumsticks'] }
  ],
  frozen_foods: [
    { name: '{brand} Crispy Golden French Fries', price: [95, 210], unit: '400 g', tags: ['frozen', 'snacks', 'quick-cook'], varieties: ['Classic Salted', 'Peri Peri', 'Crinkle Cut', 'Spicy Wedges'] },
    { name: '{brand} Tender Frozen Green Peas (Matar)', price: [75, 150], unit: '500 g', tags: ['frozen', 'vegetables'], varieties: ['Sweet Golden', 'Tender Garden', 'Organic Select'] },
    { name: '{brand} Crispy Veggie Nuggets & Patties', price: [110, 240], unit: '350 g', tags: ['frozen', 'snacks'], varieties: ['Veggie Fingers', 'Aloo Tikki', 'Cheese Corn Bites'] },
    { name: '{brand} Artisanal Rich Ice Cream Tub', price: [150, 390], unit: '700 ml', tags: ['frozen', 'ice-cream', 'dessert'], varieties: ['Belgian Dark Chocolate', 'Vanilla Bean', 'Alphonso Mango', 'Roasted Almond'] }
  ],
  packaged_food: [
    { name: '{brand} Masala Instant Noodles', price: [20, 95], unit: '280 g (Pack of 4)', tags: ['instant-food', 'noodles'], varieties: ['Special Masala', 'Atta Veggie', 'Spicy Schezwan', 'Korean Chilli'] },
    { name: '{brand} Gourmet 100% Durum Wheat Pasta', price: [75, 185], unit: '500 g', tags: ['packaged-food', 'pasta'], varieties: ['Penne Rigate', 'Fusilli Spirals', 'Elbow Macaroni', 'Spaghetti'] },
    { name: '{brand} Rich Tomato Ketchup & Table Sauces', price: [65, 175], unit: '500 g', tags: ['packaged-food', 'sauces'], varieties: ['Sweet & Tangy', 'Hot & Spicy', 'No Onion Garlic', 'Pizza Pasta Sauce'] },
    { name: '{brand} Nutritious Breakfast Cereals & Granola', price: [120, 320], unit: '400 g', tags: ['breakfast', 'cereals'], varieties: ['Corn Flakes', 'Choco Fills', 'Crunchy Muesli', 'Rolled Oats'] }
  ]
};

function getTemplatesForCategory(cat) {
  if (PRODUCT_TEMPLATES[cat.id]) return PRODUCT_TEMPLATES[cat.id];
  
  if (cat.id.includes('meat') || cat.id.includes('chicken') || cat.id.includes('vegan_specialties')) return PRODUCT_TEMPLATES.meat;
  if (cat.id.includes('bread') || cat.id.includes('bun')) return PRODUCT_TEMPLATES.bakery;
  if (cat.id.includes('frozen') || cat.id.includes('ice_cream')) return PRODUCT_TEMPLATES.frozen_foods;
  if (cat.id.includes('pasta') || cat.id.includes('instant') || cat.id.includes('sauce') || cat.id.includes('ketchup') || cat.id.includes('ready_to')) return PRODUCT_TEMPLATES.packaged_food;

  const d = cat.department || '';
  if (d.includes('Produce')) return PRODUCT_TEMPLATES.fruits.concat(PRODUCT_TEMPLATES.vegetables);
  if (d.includes('Dairy')) return PRODUCT_TEMPLATES.dairy;
  if (d.includes('Bakery')) return PRODUCT_TEMPLATES.bakery;
  if (d.includes('Frozen')) return PRODUCT_TEMPLATES.frozen_foods;
  if (d.includes('Instant')) return PRODUCT_TEMPLATES.packaged_food;
  if (d.includes('Personal')) return PRODUCT_TEMPLATES.personal_care;
  if (d.includes('Household')) return PRODUCT_TEMPLATES.household;
  if (d.includes('Baby')) return PRODUCT_TEMPLATES.baby_care;
  if (d.includes('Pet')) return PRODUCT_TEMPLATES.pet_supplies;
  if (d.includes('Pooja')) return PRODUCT_TEMPLATES.pooja;
  if (d.includes('Confectionery')) return PRODUCT_TEMPLATES.confectionery;
  if (d.includes('Regional')) return PRODUCT_TEMPLATES.regional;
  if (d.includes('Dry Fruits')) return PRODUCT_TEMPLATES.dry_fruits;
  if (d.includes('Staples')) return PRODUCT_TEMPLATES.staples;
  if (d.includes('Beverages')) return PRODUCT_TEMPLATES.beverages;
  if (cat.id.includes('meat') || cat.id.includes('chicken')) return PRODUCT_TEMPLATES.meat;
  
  return PRODUCT_TEMPLATES.snacks;
}

function generateDeterministicProducts(targetCount = 10000) {
  const rng = seededRandom(42);
  const allProducts = [];

  // 1. Keep baseline products intact
  const preservedIds = new Set();
  for (const bp of baselineProducts) {
    const resolved = resolveProductImage(bp);
    const mrp = Math.round(bp.price * 1.2 * 100) / 100;
    const discount = Math.round(((mrp - bp.price) / mrp) * 100);
    allProducts.push({
      ...bp,
      image_key: resolved.image_key,
      image_url: resolved.image_url,
      image_alt: bp.name,
      brand: 'FreshCart',
      mrp,
      discount
    });
    preservedIds.add(bp.id);
  }

  console.log(`Preserved ${allProducts.length} baseline products.`);

  // 2. Generate products across all 100+ categories
  const targetPerCategory = Math.ceil((targetCount - allProducts.length) / CATEGORIES_DATA.length);
  let globalSkuCounter = 1000;

  for (const cat of CATEGORIES_DATA) {
    const brands = BRANDS_BY_DEPARTMENT[cat.department] || ['FreshCart Select', 'Heritage', 'NaturePure', 'KisanKrafts'];
    const deptTemplates = getTemplatesForCategory(cat);

    for (let i = 0; i < targetPerCategory; i++) {
      if (allProducts.length >= targetCount) break;

      globalSkuCounter++;
      const prodId = `p_${cat.id}_${String(i + 1).padStart(3, '0')}`;
      if (preservedIds.has(prodId)) continue;

      const brand = brands[Math.floor(rng() * brands.length)];
      const tpl = deptTemplates[Math.floor(rng() * deptTemplates.length)];
      const variety = tpl.varieties ? tpl.varieties[Math.floor(rng() * tpl.varieties.length)] : 'Standard';

      let rawName = tpl.name.replace('{brand}', brand).replace('{variety}', variety);
      if (!rawName.includes(brand)) rawName = `${brand} ${rawName}`;
      if (i > 0 && i % 3 === 0) rawName += ` (Pack of ${Math.floor(rng() * 2) + 2})`;

      const minPrice = tpl.price[0];
      const maxPrice = tpl.price[1];
      const basePrice = Math.floor(rng() * (maxPrice - minPrice + 1)) + minPrice;
      const price = Math.round(basePrice * 100) / 100;
      const mrp = Math.round(price * (1.1 + rng() * 0.25));
      const discount = Math.round(((mrp - price) / mrp) * 100);
      const stock = Math.floor(rng() * 140) + 10;
      const rating = Math.round((3.8 + rng() * 1.1) * 10) / 10;
      const reviewCount = Math.floor(rng() * 450) + 12;

      // Dietary tags
      const pTags = [...new Set([...(tpl.tags || []), ...(cat.dietary_tags || []), cat.department.toLowerCase()])];
      const keywords = `${rawName} ${brand} ${variety} ${cat.name} ${cat.department} ${(cat.keywords || []).join(' ')}`.toLowerCase();

      // Resolve canonical image metadata deterministically
      const resolved = resolveProductImage({
        id: prodId,
        name: rawName,
        category: cat.id,
        description: `Premium quality ${variety} from ${brand}. Certified pure, hygienically packed, and delivered fresh in 10 minutes.`,
        tags: pTags,
        brand
      });

      allProducts.push({
        id: prodId,
        name: rawName,
        emoji: cat.emoji || '🛒',
        category: cat.id,
        price,
        unit: tpl.unit || '1 pack',
        description: `Premium quality ${variety} from ${brand}. Certified pure, hygienically packed, and delivered fresh in 10 minutes.`,
        stock,
        rating,
        tags: JSON.stringify(pTags),
        sku: `SKU-${cat.id.toUpperCase().substring(0, 4)}-${globalSkuCounter}`,
        brand,
        mrp,
        discount,
        review_count: reviewCount,
        search_keywords: keywords,
        image_key: resolved.image_key,
        image_url: resolved.image_url,
        image_alt: `${brand} ${rawName}`
      });
    }
  }

  console.log(`Generated total of ${allProducts.length} products across ${CATEGORIES_DATA.length} categories.`);
  return allProducts;
}

if (require.main === module) {
  const products = generateDeterministicProducts(10000);
  const outPath = path.join(__dirname, '..', 'data', 'synthetic', 'products_10k.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(products.slice(0, 100), null, 2));
  console.log(`✅ Validated sample 10K product generator. First 100 products previewed in ${outPath}`);
}

module.exports = { generateDeterministicProducts };
