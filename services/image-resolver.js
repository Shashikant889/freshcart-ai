/**
 * FreshCart AI — Canonical Product Image Resolver (services/image-resolver.js)
 * 
 * Implements a deterministic 5-tier resolution pipeline:
 * Tier 1: Exact Product image_key (if explicitly provided and valid)
 * Tier 2: Product-Family match via semantic keyword dictionary
 * Tier 3: Subcategory / Category keyword match
 * Tier 4: Department-level category default fallback
 * Tier 5: Generic grocery fallback asset
 * 
 * NEVER randomly assigns images. Guarantees deterministic, reproducible output.
 */

const manifest = require('../data/product-image-manifest.json');

// Cache category lookup metadata if categories.json exists
let categoryMap = new Map();
try {
  const catList = require('../data/categories.json');
  for (const c of catList) {
    categoryMap.set(c.id, c);
  }
} catch (e) {}

// Essential core product noun priority mapping:
// These specific grocery nouns MUST trigger their respective product families with top priority.
// Order of rules is critical: specific composite/prepared nouns appear before general ingredient nouns.
const CORE_NOUN_TO_FAMILY = [
  // 1. Specific Bakery Items (Must precede butter/milk/sugar)
  { regex: /\b(croissants?|danish|flaky pastry)\b/i, family: 'croissant' },
  { regex: /\b(muffins?|cupcakes?)\b/i, family: 'muffin' },
  { regex: /\b(cakes?|pastr(?:y|ies)|brownies?)\b/i, family: 'cake' },
  { regex: /\b(biscuits?|cookies?|crackers?|rusks?|toast)\b/i, family: 'biscuits' },
  { regex: /\b(bagels?|burger buns?|pav|buns?)\b/i, family: 'bagel' },
  { regex: /\b(breads?|sourdough|loaf|sandwich bread|multigrain bread)\b/i, family: 'bread' },

  // 2. Frozen Foods & Ice Creams
  { regex: /\b(french fries|crinkle fries|potato fries|potato wedges)\b/i, family: 'frozen_fries' },
  { regex: /\b(ice ?creams?|kulfi|gelato|frozen dessert|cassata|sundae|cornetto)\b/i, family: 'ice_cream' },
  { regex: /\b(frozen (?:snacks?|peas?|matar|nuggets?|patties|burger patty|samosas?|spring rolls?)|veggie nuggets?)\b/i, family: 'frozen_food' },

  // 3. Packaged & Instant Foods (Must precede potato/corn)
  { regex: /\b(potato chips|chips|wafers|crisps|nachos)\b/i, family: 'chips' },
  { regex: /\b(aloo bhujia|bhujia|namkeen|sev|chivda|mixture)\b/i, family: 'namkeen' },
  { regex: /\b(makhana|foxnuts?)\b/i, family: 'makhana' },
  { regex: /\b(instant noodles?|maggi|ramen|yippee|chowmein)\b/i, family: 'noodles_pasta' },
  { regex: /\b(pasta|penne|fusilli|macaroni|spaghetti|durum wheat pasta)\b/i, family: 'durum_pasta' },
  { regex: /\b(ketchup|sauces?|mayonnaise|mayo|jams?|spreads?|dips?)\b/i, family: 'sauces_spreads' },
  { regex: /\b(granola|muesli|corn flakes|cereals?|oats)\b/i, family: 'granola' },
  { regex: /\b(chocolates?|cadbury|dark chocolate|choco bar)\b/i, family: 'chocolate' },
  { regex: /\b(mithai|sweets?|kaju katli|gulab jamun|rasgulla|laddu|barfi)\b/i, family: 'sweets' },

  // 4. Personal Care & Hygiene
  { regex: /\b(shampoos?|hair cleanser|conditioner)\b/i, family: 'shampoo' },
  { regex: /\b(soaps?|bath soap|bathing bar|body wash|handwash)\b/i, family: 'soap' },
  { regex: /\b(toothpastes?|toothbrush(?:es)?|mouthwash|oral care)\b/i, family: 'oral_care' },
  { regex: /\b(skin cream|moisturizer|body lotion|cold cream)\b/i, family: 'skin_care' },
  { regex: /\b(deodorants?|body spray|perfume|cologne)\b/i, family: 'deodorant' },
  { regex: /\b(baby care|diapers?|pampers|baby wipes?|cerelac)\b/i, family: 'baby_care' },

  // 5. Household Cleaning & Repellents
  { regex: /\b(detergents?|washing powder|fabric conditioner|laundry)\b/i, family: 'detergent' },
  { regex: /\b(dishwash|vim|pril|dishwash liquid|dishwash bar|scrub pad)\b/i, family: 'dishwash_cleaning' },
  { regex: /\b(floor cleaner|disinfectant|surface cleaner|lizol|colin|harpic)\b/i, family: 'dishwash_cleaning' },
  { regex: /\b(air freshener|room freshener|mosquito repellent|repellent|hit|all out|good knight|odonil)\b/i, family: 'home_repellents' },

  // 6. Beverages (Must precede generic water)
  { regex: /\b(coffee|cold brew|nescafe|bru|cappuccino|latte)\b/i, family: 'coffee' },
  { regex: /\b(green tea|tea|chai|ctc tea|tea bags?)\b/i, family: 'tea' },
  { regex: /\b(juices?|real fruit|tropicana|fruit juice)\b/i, family: 'juice' },
  { regex: /\b(sparkling water|soda|soft drinks?|cola|tonic water|carbonated)\b/i, family: 'water_softdrinks' },

  // 7. Dairy & Eggs (Must precede generic produce/staples)
  { regex: /\b(malai paneer|paneer|tofu|cottage cheese)\b/i, family: 'paneer' },
  { regex: /\b(curd|dahi|yogurt|yoghurt)\b/i, family: 'curd' },
  { regex: /\b(table butter|butter|makhan)\b/i, family: 'butter' },
  { regex: /\b(cheddar cheese|cheese slices?|cheese cubes?|mozzarella|cheese)\b/i, family: 'cheese' },
  { regex: /\b(desi ghee|pure ghee|cow ghee|ghee)\b/i, family: 'ghee' },
  { regex: /\b(eggs?|free-range eggs|anda)\b/i, family: 'eggs' },
  { regex: /\b(full cream milk|gold milk|buffalo milk|amul gold)\b/i, family: 'milk_full_cream' },
  { regex: /\b(toned milk|cow milk|milk|doodh)\b/i, family: 'milk' },

  // 8. Meat & Poultry
  { regex: /\b(chicken|meat|poultry|boneless chicken|chicken breast)\b/i, family: 'chicken_meat' },

  // 9. Fresh Fruits
  { regex: /\b(apples?|seb|royal gala|fuji|kinnaur)\b/i, family: 'apple' },
  { regex: /\b(bananas?|kela|robusta|yelakki)\b/i, family: 'banana' },
  { regex: /\b(oranges?|santra|mosambi|kinnow|citrus)\b/i, family: 'orange' },
  { regex: /\b(mango(?:es)?|aam|alphonso|hapus|kesar|dasheri)\b/i, family: 'mango' },
  { regex: /\b(strawberr(?:y|ies))\b/i, family: 'strawberry' },
  { regex: /\b(blueberr(?:y|ies)|raspberr(?:y|ies)|blackberr(?:y|ies)|berr(?:y|ies))\b/i, family: 'strawberry' },
  { regex: /\b(grapes?|angoor|thompson)\b/i, family: 'grape' },
  { regex: /\b(papayas?|papita)\b/i, family: 'papaya' },
  { regex: /\b(watermelons?|tarbooz)\b/i, family: 'watermelon' },
  { regex: /\b(pomegranates?|anar)\b/i, family: 'pomegranate' },
  { regex: /\b(guavas?|amrood|peru)\b/i, family: 'guava' },
  { regex: /\b(pineapples?|ananas)\b/i, family: 'pineapple' },
  { regex: /\b(avocados?)\b/i, family: 'avocado' },
  { regex: /\b(kiwis?)\b/i, family: 'kiwi' },

  // 10. Fresh Vegetables
  { regex: /\b(capsicums?|bell peppers?|shimla mirch)\b/i, family: 'bell_pepper' },
  { regex: /\b(tomatoes?|tamatar|roma)\b/i, family: 'tomato' },
  { regex: /\b(potatoes?|aloo|pahari potato)\b/i, family: 'potato' },
  { regex: /\b(onions?|pyaz|kanda)\b/i, family: 'onion' },
  { regex: /\b(cauliflowers?|gobhi|phool gobhi)\b/i, family: 'cauliflower' },
  { regex: /\b(cabbages?|patta gobhi)\b/i, family: 'cabbage' },
  { regex: /\b(broccolis?)\b/i, family: 'broccoli' },
  { regex: /\b(carrots?|gajar)\b/i, family: 'carrot' },
  { regex: /\b(spinach|palak|methi|leafy greens?)\b/i, family: 'spinach' },
  { regex: /\b(sweet corns?|bhutta|corn on the cob)\b/i, family: 'corn' },
  { regex: /\b(green beans?|french beans?|beans|sem)\b/i, family: 'green_beans' },
  { regex: /\b(green peas?|matar|muttar|fresh peas?)\b/i, family: 'peas' },
  { regex: /\b(bhindis?|ladyfingers?|okra)\b/i, family: 'ladyfinger' },
  { regex: /\b(laukis?|bottle gourds?|doodhi)\b/i, family: 'bottle_gourd' },
  { regex: /\b(ginger|garlic|adrak|lahsun)\b/i, family: 'ginger_garlic' },

  // 11. Staples, Grains & Spices
  { regex: /\b(basmati|rice|chawal)\b/i, family: 'rice' },
  { regex: /\b(wheat atta|atta|flour|gehu|maida|besan)\b/i, family: 'wheat_atta' },
  { regex: /\b(toor dal|arhar dal|moong dal|urad dal|dal|pulses?|lentils?)\b/i, family: 'dal_pulses' },
  { regex: /\b(chickpeas?|kabuli chana|rajma|kala chana|chana)\b/i, family: 'chickpeas' },
  { regex: /\b(mustard oil|sunflower oil|cooking oils?|refined oil|edible oil)\b/i, family: 'cooking_oil' },
  { regex: /\b(table salts?|iodized salt|rock salt|salts?|turmeric|haldi|spices?|garam masala)\b/i, family: 'salt_spices' },
  { regex: /\b(sugars?|cheeni|shakkar|jaggery|gud)\b/i, family: 'sugar' },
  { regex: /\b(dry fruits?|almonds?|badam|cashews?|kaju|walnuts?|mixed nuts?)\b/i, family: 'nuts' },

  // 12. Pets & Pooja
  { regex: /\b(pet food|dog food|cat food|pedigree|whiskas)\b/i, family: 'pet_care' },
  { regex: /\b(agarbatti|incense|dhoop|camphor|kapur|pooja)\b/i, family: 'pooja' }
];

function normalizeText(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolves canonical image metadata for any product record.
 * 
 * @param {Object} product - { id, name, category, description, tags, brand, image_key }
 * @returns {Object} { image_key, image_url, image_alt, resolution_tier }
 */
function resolveProductImage(product = {}) {
  if (!product || typeof product !== 'object') {
    return {
      image_key: manifest.genericFallback.imageKey,
      image_url: manifest.genericFallback.imageUrl,
      image_alt: manifest.genericFallback.imageAlt,
      resolution_tier: 5
    };
  }

  const nameNorm = normalizeText(product.name);
  const catNorm = normalizeText(product.category);
  const brandNorm = normalizeText(product.brand);
  const descNorm = normalizeText(product.description);
  const combined = `${nameNorm} ${catNorm} ${brandNorm} ${descNorm}`;

  // Priority Check 1: Match specific core grocery noun in product name
  for (const item of CORE_NOUN_TO_FAMILY) {
    if (item.regex.test(nameNorm)) {
      const famData = manifest.productFamilies[item.family];
      if (famData) {
        return {
          image_key: famData.imageKey,
          image_url: famData.imageUrl,
          image_alt: product.name || famData.imageAlt,
          resolution_tier: 1
        };
      }
    }
  }

  // Tier 2: Exact product image_key match if provided and present in manifest
  if (product.image_key) {
    for (const [famKey, famData] of Object.entries(manifest.productFamilies)) {
      if (famData.imageKey === product.image_key) {
        return {
          image_key: famData.imageKey,
          image_url: famData.imageUrl,
          image_alt: product.name || famData.imageAlt,
          resolution_tier: 2
        };
      }
    }
  }

  // Tier 2: Check in category or description if name didn't have exact noun
  for (const item of CORE_NOUN_TO_FAMILY) {
    if (item.regex.test(catNorm) || item.regex.test(combined)) {
      const famData = manifest.productFamilies[item.family];
      if (famData) {
        return {
          image_key: famData.imageKey,
          image_url: famData.imageUrl,
          image_alt: product.name || famData.imageAlt,
          resolution_tier: 3
        };
      }
    }
  }

  // Tier 4: Department / Category Fallback
  const catMeta = categoryMap.get(product.category);
  const deptName = catMeta ? catMeta.department : null;

  if (deptName && manifest.departmentDefaults[deptName]) {
    const deptDefault = manifest.departmentDefaults[deptName];
    return {
      image_key: deptDefault.imageKey,
      image_url: deptDefault.imageUrl,
      image_alt: product.name || deptDefault.imageAlt,
      resolution_tier: 4
    };
  }

  // Check if category name matches any department key
  for (const [dName, dData] of Object.entries(manifest.departmentDefaults)) {
    if (combined.includes(normalizeText(dName))) {
      return {
        image_key: dData.imageKey,
        image_url: dData.imageUrl,
        image_alt: product.name || dData.imageAlt,
        resolution_tier: 4
      };
    }
  }

  // Tier 5: Generic Grocery Fallback
  return {
    image_key: manifest.genericFallback.imageKey,
    image_url: manifest.genericFallback.imageUrl,
    image_alt: product.name || manifest.genericFallback.imageAlt,
    resolution_tier: 5
  };
}

module.exports = {
  resolveProductImage,
  manifest
};
