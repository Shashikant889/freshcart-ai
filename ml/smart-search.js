/**
 * NLP Smart Search & Semantic Product Matching Engine
 * Implements:
 * 1. TF-IDF (Term Frequency - Inverse Document Frequency) Vector Space Model
 * 2. Cosine Similarity Document Ranking
 * 3. Levenshtein Distance Typo Tolerance
 * 4. Indian Grocery Synonyms & Multilingual Mapping
 */

const { getDb } = require('../db/database');

// Standard stop words to ignore
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of', 'from', 'is', 'it', 'fresh', 'organic'
]);

// Multilingual synonym dictionary (Hindi/Hinglish -> English keywords)
const SYNONYM_MAP = {
  'seb': 'apple apples',
  'kela': 'banana bananas',
  'santra': 'orange oranges',
  'aam': 'mango mangoes',
  'angoor': 'grape grapes',
  'tamatar': 'tomato tomatoes',
  'gajar': 'carrot carrots',
  'palak': 'spinach',
  'shimla mirch': 'bell peppers',
  'bhutta': 'corn',
  'doodh': 'milk',
  'paneer': 'cheese',
  'dahi': 'yogurt',
  'anda': 'eggs egg',
  'makhan': 'butter',
  'roti': 'bread sourdough',
  'chai': 'tea',
  'pani': 'water sparkling',
  'coffee': 'cold brew',
  'makhana': 'nuts snacks',
  'aloo': 'potato chips',
  'mithai': 'cake chocolate'
};

/**
 * Tokenize and normalize text
 */
function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 1 && !STOP_WORDS.has(token));
}

/**
 * Levenshtein distance between two strings (for typo tolerance)
 */
function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Build TF-IDF Search Index from Product Catalog
 */
function buildTFIDFIndex() {
  const db = getDb();
  const products = db.prepare('SELECT * FROM products').all();
  const numDocs = products.length;

  // 1. Create document tokens for each product
  const docTokens = new Map();
  const allTerms = new Set();

  for (const p of products) {
    const rawText = `${p.name} ${p.category} ${p.description} ${p.unit} ${p.tags || ''}`;
    const tokens = tokenize(rawText);
    docTokens.set(p.id, tokens);
    tokens.forEach(t => allTerms.add(t));
  }

  const vocabulary = Array.from(allTerms);

  // 2. Compute IDF for each term: IDF(t) = log(N / (1 + docCount(t)))
  const idf = new Map();
  for (const term of vocabulary) {
    let docCount = 0;
    for (const tokens of docTokens.values()) {
      if (tokens.includes(term)) docCount++;
    }
    idf.set(term, Math.log((numDocs + 1) / (docCount + 1)) + 1);
  }

  // 3. Compute TF-IDF vectors for all documents
  const docVectors = new Map();
  for (const [productId, tokens] of docTokens.entries()) {
    const termCounts = new Map();
    tokens.forEach(t => termCounts.set(t, (termCounts.get(t) || 0) + 1));

    const vector = vocabulary.map(term => {
      const tf = (termCounts.get(term) || 0) / tokens.length;
      return tf * (idf.get(term) || 0);
    });

    docVectors.set(productId, vector);
  }

  return { products, vocabulary, idf, docVectors };
}

/**
 * Execute TF-IDF Semantic Smart Search with Synonym & Typo Correction
 */
function smartSearch(queryStr, limit = 10) {
  if (!queryStr || queryStr.trim().length === 0) return [];

  const { products, vocabulary, idf, docVectors } = buildTFIDFIndex();
  let normalizedQuery = queryStr.toLowerCase().trim();

  // 1. Apply Synonym Expansion (e.g. "dahi" -> "yogurt")
  for (const [hindiWord, englishEquivalent] of Object.entries(SYNONYM_MAP)) {
    if (normalizedQuery.includes(hindiWord)) {
      normalizedQuery += ' ' + englishEquivalent;
    }
  }

  let queryTokens = tokenize(normalizedQuery);

  // 2. Apply Fuzzy Spelling Correction against Vocabulary
  const correctedTokens = queryTokens.map(token => {
    if (vocabulary.includes(token)) return token;
    let closestTerm = token;
    let minDist = 3; // allow up to 2 typos

    for (const vocabTerm of vocabulary) {
      const dist = levenshteinDistance(token, vocabTerm);
      if (dist < minDist) {
        minDist = dist;
        closestTerm = vocabTerm;
      }
    }
    return closestTerm;
  });

  queryTokens = [...new Set([...queryTokens, ...correctedTokens])];

  // 3. Build Query TF-IDF Vector
  const queryTermCounts = new Map();
  queryTokens.forEach(t => queryTermCounts.set(t, (queryTermCounts.get(t) || 0) + 1));

  const queryVector = vocabulary.map(term => {
    const tf = (queryTermCounts.get(term) || 0) / queryTokens.length;
    return tf * (idf.get(term) || 0);
  });

  // 4. Compute Cosine Similarity between Query Vector and Document Vectors
  const results = [];
  for (const p of products) {
    const docVec = docVectors.get(p.id);
    let dot = 0;
    let normQ = 0;
    let normD = 0;

    for (let i = 0; i < vocabulary.length; i++) {
      dot += queryVector[i] * docVec[i];
      normQ += queryVector[i] * queryVector[i];
      normD += docVec[i] * docVec[i];
    }

    const similarity = (normQ > 0 && normD > 0) ? dot / (Math.sqrt(normQ) * Math.sqrt(normD)) : 0;

    // Direct name match bonus
    const nameMatchBonus = p.name.toLowerCase().includes(queryStr.toLowerCase()) ? 0.3 : 0;
    const finalScore = similarity + nameMatchBonus;

    if (finalScore > 0.05) {
      results.push({
        product: {
          ...p,
          tags: JSON.parse(p.tags || '[]')
        },
        relevanceScore: Math.round(finalScore * 100) / 100,
        matchConfidence: Math.min(99, Math.round(finalScore * 100)) + '%'
      });
    }
  }

  results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return results.slice(0, limit);
}

module.exports = {
  smartSearch,
  buildTFIDFIndex,
  levenshteinDistance,
  SYNONYM_MAP
};
