const { initDb, getDb } = require('../db/database');
const fs = require('fs');
const path = require('path');
const { resolveProductImage, manifest } = require('../services/image-resolver');

(async () => {
  await initDb();
  const db = getDb();

  const products = db.prepare('SELECT id, name, category, image_key, image_url FROM products').all();
  console.log(`Auditing ${products.length} total products...`);

  // Check physical files in public/images/products
  const imgDir = path.join(__dirname, '..', 'public', 'images', 'products');
  const physicalImages = new Set(fs.readdirSync(imgDir));
  console.log(`Found ${physicalImages.size} physical product SVG images in ${imgDir}`);

  let missingFiles = 0;
  let categoryBannerCount = 0;
  let genericFallbackCount = 0;
  const imageCounts = new Map();
  const mismatchExamples = [];

  for (const p of products) {
    const filename = path.basename(p.image_url);
    if (!p.image_url.startsWith('/images/products/')) {
      categoryBannerCount++;
    } else if (!physicalImages.has(filename)) {
      missingFiles++;
    }

    if (p.image_key === 'grocery-default' || filename === 'grocery-default.svg') {
      genericFallbackCount++;
    }

    imageCounts.set(filename, (imageCounts.get(filename) || 0) + 1);

    // Check specific known semantic conflicts:
    const n = p.name.toLowerCase();
    const f = filename.toLowerCase();

    // Croissant with butter image
    if (n.includes('croissant') && !f.includes('croissant')) {
      mismatchExamples.push({ id: p.id, name: p.name, img: p.image_url, reason: 'Croissant has non-croissant image' });
    }
    // Chips with potato raw vegetable image
    if ((n.includes('chips') || n.includes('wafers') || n.includes('nachos')) && f.includes('gold-potatoes')) {
      mismatchExamples.push({ id: p.id, name: p.name, img: p.image_url, reason: 'Chips has raw potato image' });
    }
    // Coffee with tea image
    if (n.includes('coffee') && f.includes('tea')) {
      mismatchExamples.push({ id: p.id, name: p.name, img: p.image_url, reason: 'Coffee has tea image' });
    }
    // Tea with coffee image
    if (n.includes('tea') && !n.includes('coffee') && f.includes('cold-brew')) {
      mismatchExamples.push({ id: p.id, name: p.name, img: p.image_url, reason: 'Tea has coffee image' });
    }
    // Soap with detergent image or shampoo
    if (n.includes('soap') && f.includes('detergent')) {
      mismatchExamples.push({ id: p.id, name: p.name, img: p.image_url, reason: 'Soap has detergent image' });
    }
    // Paneer with butter image
    if (n.includes('paneer') && !f.includes('paneer')) {
      mismatchExamples.push({ id: p.id, name: p.name, img: p.image_url, reason: 'Paneer has non-paneer image' });
    }
    // Ghee with butter image
    if (n.includes('ghee') && !f.includes('ghee')) {
      mismatchExamples.push({ id: p.id, name: p.name, img: p.image_url, reason: 'Ghee has non-ghee image' });
    }
    // Curd/Dahi with milk image
    if ((n.includes('curd') || n.includes('dahi') || n.includes('yogurt')) && f.includes('milk')) {
      mismatchExamples.push({ id: p.id, name: p.name, img: p.image_url, reason: 'Curd/Dahi has milk image' });
    }
    // Bread with cake image
    if (n.includes('bread') && f.includes('cake')) {
      mismatchExamples.push({ id: p.id, name: p.name, img: p.image_url, reason: 'Bread has cake image' });
    }
    // Cake with bread image
    if (n.includes('cake') && f.includes('bread')) {
      mismatchExamples.push({ id: p.id, name: p.name, img: p.image_url, reason: 'Cake has bread image' });
    }
    // Bell peppers with category banner
    if (n.includes('pepper') && f.includes('dept-')) {
      mismatchExamples.push({ id: p.id, name: p.name, img: p.image_url, reason: 'Bell peppers has dept banner image' });
    }
  }

  console.log(`\n--- Integrity Statistics ---`);
  console.log(`Category Banner / Non-product Image Count: ${categoryBannerCount}`);
  console.log(`Missing Physical Files: ${missingFiles}`);
  console.log(`Generic Fallback Count: ${genericFallbackCount}`);
  console.log(`Unique Image Filenames in Use: ${imageCounts.size}`);
  console.log(`Semantic Mismatch Examples Detected: ${mismatchExamples.length}`);

  if (mismatchExamples.length > 0) {
    console.log(`\nSample Mismatches (first 15):`);
    mismatchExamples.slice(0, 15).forEach(m => console.log(`  - [${m.id}] "${m.name}" -> ${m.img} (${m.reason})`));
  }

  // Inspect the 10 requested categories
  const targetCategories = [
    'dairy',
    'fruits',
    'vegetables',
    'beverages',
    'snacks',
    'personal care',
    'household',
    'packaged food',
    'frozen food',
    'bakery'
  ];

  console.log(`\n--- Representative Category Samples ---`);
  for (const cat of targetCategories) {
    const catProds = products.filter(p => p.category.toLowerCase().includes(cat.replace(' ', '_')) || p.category.toLowerCase().includes(cat.split(' ')[0]));
    console.log(`\nCategory "${cat}" (${catProds.length} products found):`);
    catProds.slice(0, 4).forEach(p => console.log(`  - [${p.id}] "${p.name}" (${p.category}) -> ${p.image_url}`));
  }
})();
