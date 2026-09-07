const { initDb, getDb, closeDb } = require('../db/database');

async function test() {
  await initDb();
  const db = getDb();
  
  console.log('--- CHECKING ORPHAN ROWS ---');
  const orphans = db.prepare('SELECT COUNT(*) as c FROM order_items WHERE product_id NOT IN (SELECT id FROM products)').get().c;
  console.log('Orphan order items:', orphans);

  const interactionOrphans = db.prepare('SELECT COUNT(*) as c FROM user_interactions WHERE product_id NOT IN (SELECT id FROM products)').get().c;
  console.log('Orphan user interactions:', interactionOrphans);

  console.log('\n--- DEPARTMENT BREAKDOWN ---');
  const depts = db.prepare('SELECT department, subcategory, product_family, COUNT(*) as count FROM products GROUP BY department, subcategory, product_family ORDER BY count DESC').all();
  console.table(depts.slice(0, 15));

  console.log('\n--- SAMPLE EARBUDS / ELECTRONICS ---');
  const earbuds = db.prepare("SELECT id, name, brand, model, barcode, department, subcategory, product_family, attributes_json, image_url FROM products WHERE category = 'earbuds' LIMIT 2").all();
  console.log(JSON.stringify(earbuds, null, 2));

  console.log('\n--- SAMPLE POOJA ESSENTIALS ---');
  const pooja = db.prepare("SELECT id, name, brand, barcode, department, subcategory, product_family, dataset_status, attributes_json FROM products WHERE department = 'Pooja Essentials' LIMIT 2").all();
  console.log(JSON.stringify(pooja, null, 2));

  console.log('\n--- SAMPLE BASELINE f1 (Organic Apples) ---');
  const f1 = db.prepare("SELECT id, name, brand, barcode, nutrition_grade, department, subcategory, product_family, attributes_json, image_url FROM products WHERE id = 'f1'").get();
  console.log(JSON.stringify(f1, null, 2));

  closeDb({ save: false });
}

test().catch(console.error);
