#!/usr/bin/env python3
"""
FreshCart AI — Phase 4 Checkpoint 3: Controlled Catalog Activation Script
=========================================================================
Applies atomic, in-place catalog enrichment and safe expansion:
1. Verifies pre-condition backup existence, SHA256 checksum, and foreign-key integrity.
2. Performs in-place enrichment for 51,512 matched SKUs (zero PK change).
3. Inserts 3,488 collision-free new SKUs.
4. Preserves 48,488 legacy products with full transactional integrity.
5. Deactivates and de-indexes 6,442 synthetic Pooja records (zero deletions).
6. Validates all primary key and referential invariants before committing.
7. Rebuilds covering indexes and measures empirical query latencies.
"""

import sqlite3
import os
import sys
import hashlib
import time
import json
import statistics

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'db', 'freshcart.db')
BACKUP_PATH = os.path.join(os.path.dirname(__file__), '..', 'db', 'freshcart.db.pre_phase4_backup.bak')
EXPECTED_BACKUP_SHA256 = "f00d584bd063b089c6dafbc96dbb0254fc474a9e153b47de71a83d4bfad253d1"

def log(msg):
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}")

def check_file_sha256(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest().lower()

def run_activation():
    log("================================================================================")
    log("FreshCart AI — Phase 4 Checkpoint 3: Controlled Catalog Activation")
    log("================================================================================")

    # --------------------------------------------------------------------------
    # STEP 1: STRICT SAFETY PRE-CONDITIONS
    # --------------------------------------------------------------------------
    log("\n--- STEP 1: STRICT SAFETY PRE-CONDITIONS ---")
    if not os.path.exists(BACKUP_PATH):
        raise RuntimeError(f"FATAL: Backup file does not exist at {BACKUP_PATH}")
    log(f"✅ Verified backup exists: {BACKUP_PATH}")

    actual_sha = check_file_sha256(BACKUP_PATH)
    log(f"Backup SHA256: {actual_sha}")
    if actual_sha != EXPECTED_BACKUP_SHA256:
        raise RuntimeError(f"FATAL: Backup SHA256 mismatch! Expected {EXPECTED_BACKUP_SHA256}, got {actual_sha}")
    log("✅ Backup SHA256 checksum verified match.")

    conn = sqlite3.connect(DB_PATH, timeout=60.0)
    conn.isolation_level = None
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA foreign_keys = ON;")
    c = conn.cursor()

    c.execute("SELECT COUNT(*) FROM products")
    initial_prod_count = c.fetchone()[0]
    log(f"Initial products count: {initial_prod_count:,}")
    if initial_prod_count != 100000:
        raise RuntimeError(f"FATAL: Expected exactly 100,000 products before activation, found {initial_prod_count}")
    log("✅ Verified exact 100,000 baseline product count.")

    c.execute("SELECT COUNT(*) FROM staging_products")
    staging_count = c.fetchone()[0]
    log(f"Staged products count: {staging_count:,}")
    if staging_count != 55000:
        raise RuntimeError(f"FATAL: Expected exactly 55,000 staged products, found {staging_count}")
    log("✅ Verified exact 55,000 staged product count.")

    # Foreign key checks
    for tbl in ['order_items', 'user_interactions', 'sales_history']:
        c.execute(f"SELECT COUNT(*) FROM {tbl} WHERE product_id NOT IN (SELECT id FROM products)")
        orphans = c.fetchone()[0]
        if orphans != 0:
            raise RuntimeError(f"FATAL: Pre-existing orphans in {tbl}: {orphans}")
        log(f"✅ Pre-condition FK integrity: {tbl} has 0 orphans.")

    # Record all initial 100,000 IDs in a temporary table to guarantee BEFORE.id === AFTER.id
    c.execute("CREATE TEMP TABLE original_product_ids (id TEXT PRIMARY KEY);")
    c.execute("INSERT INTO original_product_ids SELECT id FROM products;")
    log("✅ Snapshot of 100,000 original product IDs recorded.")

    # --------------------------------------------------------------------------
    # STEP 2: SCHEMA ALIGNMENT (ALTER TABLE products ADD COLUMN ...)
    # --------------------------------------------------------------------------
    log("\n--- STEP 2: SCHEMA ALIGNMENT ---")
    c.execute("PRAGMA table_info(products);")
    existing_cols = {row[1]: row[2] for row in c.fetchall()}

    columns_to_add = [
        ("is_active", "INTEGER DEFAULT 1"),
        ("category_confidence", "TEXT DEFAULT 'HIGH'"),
        ("category_status", "TEXT DEFAULT 'MAPPED'"),
        ("source_brand", "TEXT DEFAULT NULL"),
        ("brand_display", "TEXT DEFAULT NULL"),
        ("brand_status", "TEXT DEFAULT 'SOURCE_PROVIDED'"),
        ("technical_specs_json", "TEXT DEFAULT NULL"),
        ("bullet_points_json", "TEXT DEFAULT NULL"),
        ("dimensions_json", "TEXT DEFAULT NULL"),
        ("weight_json", "TEXT DEFAULT NULL")
    ]

    for col_name, col_def in columns_to_add:
        if col_name not in existing_cols:
            log(f"Adding column '{col_name}' ({col_def}) to products...")
            c.execute(f"ALTER TABLE products ADD COLUMN {col_name} {col_def};")
        else:
            log(f"Column '{col_name}' already present.")
    log("✅ Schema alignment completed.")

    # --------------------------------------------------------------------------
    # STEP 3: MATCHING AND PREPARATION OF ENRICHMENT SETS
    # --------------------------------------------------------------------------
    log("\n--- STEP 3: DETERMINISTIC MATCHING ---")
    c.execute("""
        CREATE TEMP TABLE matched_pairs AS
        SELECT p.id as active_id, s.staging_id
        FROM products p
        JOIN staging_products s ON p.barcode = s.barcode
        WHERE p.barcode IS NOT NULL AND p.barcode != ''
        UNION
        SELECT p.id as active_id, s.staging_id
        FROM products p
        JOIN staging_products s ON p.source_record_id = s.source_record_id
        WHERE p.source_record_id IS NOT NULL AND p.source_record_id != '';
    """)
    c.execute("CREATE UNIQUE INDEX idx_tmp_matched_active ON matched_pairs(active_id);")
    c.execute("CREATE UNIQUE INDEX idx_tmp_matched_staging ON matched_pairs(staging_id);")

    c.execute("SELECT COUNT(*) FROM matched_pairs;")
    matched_count = c.fetchone()[0]
    log(f"Matched pairs count: {matched_count:,}")
    if matched_count != 51512:
        raise RuntimeError(f"FATAL: Expected exactly 51,512 matched pairs, found {matched_count}")
    log("✅ Verified exact 51,512 matching products.")

    c.execute("""
        SELECT COUNT(*) FROM staging_products
        WHERE staging_id NOT IN (SELECT staging_id FROM matched_pairs);
    """)
    unmatched_staging = c.fetchone()[0]
    log(f"Unmatched staging records (New SKUs to insert): {unmatched_staging:,}")
    if unmatched_staging != 3488:
        raise RuntimeError(f"FATAL: Expected exactly 3,488 new SKUs, found {unmatched_staging}")
    log("✅ Verified exact 3,488 new SKU candidate count.")

    # --------------------------------------------------------------------------
    # STEP 4: ATOMIC ACTIVATION TRANSACTION
    # --------------------------------------------------------------------------
    log("\n--- STEP 4: EXECUTING ATOMIC ACTIVATION TRANSACTION ---")
    t_tx_start = time.time()
    conn.execute("BEGIN TRANSACTION;")

    try:
        # A. In-place Enrichment of 51,512 Matched Products
        log("Applying in-place enrichment for 51,512 matched products...")
        c.execute("""
            UPDATE products
            SET
                name = s.name,
                brand = s.brand,
                source_brand = s.source_brand,
                brand_display = s.brand_display,
                brand_status = s.brand_status,
                department = s.department,
                category = s.category,
                subcategory = s.subcategory,
                product_family = s.product_family,
                category_confidence = s.category_confidence,
                category_status = s.category_status,
                emoji = s.emoji,
                unit = s.unit,
                package_size = s.package_size,
                description = s.description,
                model = s.model,
                dimensions_json = s.dimensions_json,
                weight_json = s.weight_json,
                technical_specs_json = s.technical_specs_json,
                bullet_points_json = s.bullet_points_json,
                ingredients_text = s.ingredients_text,
                allergens = s.allergens,
                nutrition_grade = s.nutrition_grade,
                nutriments_json = s.nutriments_json,
                primary_image_url = s.primary_image_url,
                front_image_url = s.front_image_url,
                back_image_url = s.back_image_url,
                packaging_image_url = s.packaging_image_url,
                ingredients_image_url = s.ingredients_image_url,
                nutrition_image_url = s.nutrition_image_url,
                gallery_images = s.gallery_images,
                image_source = s.image_source,
                image_verified = s.image_verified,
                image_status = s.image_status,
                image_url = COALESCE(s.primary_image_url, s.front_image_url, products.image_url),
                source_dataset = s.source_dataset,
                source_record_id = s.source_record_id,
                source_url = s.source_url,
                license = s.license,
                license_url = s.license_url,
                retrieved_at = s.retrieved_at,
                expiry_status = s.expiry_status,
                shelf_life_claim = s.shelf_life_claim,
                storage_information = s.storage_information,
                best_before_text = s.best_before_text,
                attributes_json = s.attributes_json,
                is_active = 1
            FROM staging_products s
            JOIN matched_pairs m ON m.staging_id = s.staging_id
            WHERE products.id = m.active_id;
        """)
        log("✅ In-place enrichment executed.")

        # B. Insert 3,488 New Collision-Free SKUs
        log("Inserting 3,488 collision-free new SKUs...")
        c.execute("""
            SELECT
                s.staging_id,
                s.source_dataset,
                s.barcode,
                s.source_record_id,
                s.name,
                s.brand,
                s.source_brand,
                s.brand_display,
                s.brand_status,
                s.department,
                s.category,
                s.subcategory,
                s.product_family,
                s.category_confidence,
                s.category_status,
                s.emoji,
                s.unit,
                s.package_size,
                s.description,
                s.model,
                s.dimensions_json,
                s.weight_json,
                s.technical_specs_json,
                s.bullet_points_json,
                s.ingredients_text,
                s.allergens,
                s.nutrition_grade,
                s.nutriments_json,
                s.current_price,
                s.mrp,
                s.discount,
                s.price_status,
                s.stock,
                s.stock_status,
                s.rating,
                s.tags,
                s.primary_image_url,
                s.front_image_url,
                s.back_image_url,
                s.packaging_image_url,
                s.ingredients_image_url,
                s.nutrition_image_url,
                s.gallery_images,
                s.image_source,
                s.image_verified,
                s.image_status,
                s.source_url,
                s.license,
                s.license_url,
                s.retrieved_at,
                s.expiry_status,
                s.shelf_life_claim,
                s.storage_information,
                s.best_before_text,
                s.attributes_json
            FROM staging_products s
            WHERE s.staging_id NOT IN (SELECT staging_id FROM matched_pairs);
        """)
        new_records = c.fetchall()

        new_insert_rows = []
        for r in new_records:
            (stg_id, s_dataset, barcode, src_rec, name, brand, src_brand, brand_disp, brand_stat,
             dept, cat, subcat, fam, cat_conf, cat_stat, emoji, unit, pkg_size, desc, model,
             dims, weights, specs, bullets, ing_text, allergens, nut_grade, nutriments,
             price, mrp, discount, price_stat, stock, stock_stat, rating, tags,
             prim_img, front_img, back_img, pkg_img, ing_img, nut_img, gallery,
             img_src, img_ver, img_stat, src_url, license_name, license_url, retrieved_at,
             exp_stat, shelf_life, storage_info, best_before, attrs_json) = r

            clean_code = (barcode or src_rec).strip().replace(' ', '_')
            if 'food' in s_dataset:
                new_id = f"off_{clean_code}"
            else:
                new_id = f"abo_{clean_code}"

            img_url = prim_img or front_img or '/images/products/groceries.svg'

            new_insert_rows.append((
                new_id, name, emoji, cat, price, unit, desc, stock, rating, tags,
                None, img_url, name, brand, mrp, discount, s_dataset, src_rec, src_url,
                'real_verified', 'high', barcode, model, dept, subcat, fam, pkg_size,
                price_stat, stock_stat, 'verified', exp_stat, shelf_life, storage_info,
                best_before, ing_text, allergens, nut_grade, nutriments,
                prim_img, front_img, back_img, pkg_img, ing_img, nut_img, gallery,
                img_src, img_ver, img_stat, attrs_json, license_name, license_url, retrieved_at,
                1, cat_conf, cat_stat, src_brand, brand_disp, brand_stat,
                specs, bullets, dims, weights
            ))

        c.executemany("""
            INSERT INTO products (
                id, name, emoji, category, price, unit, description, stock, rating, tags,
                image_key, image_url, image_alt, brand, mrp, discount, source_dataset, source_record_id, source_url,
                dataset_status, data_confidence, barcode, model, department, subcategory, product_family, package_size,
                price_status, stock_status, review_status, expiry_status, shelf_life_claim, storage_information,
                best_before_text, ingredients_text, allergens, nutrition_grade, nutriments_json,
                primary_image_url, front_image_url, back_image_url, packaging_image_url, ingredients_image_url, nutrition_image_url, gallery_images,
                image_source, image_verified, image_status, attributes_json, license, license_url, retrieved_at,
                is_active, category_confidence, category_status, source_brand, brand_display, brand_status,
                technical_specs_json, bullet_points_json, dimensions_json, weight_json
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?
            );
        """, new_insert_rows)
        log(f"✅ Successfully inserted {len(new_insert_rows):,} new authentic SKUs.")

        # C. Preserve 48,488 Legacy Products with Default Provenance
        log("Preserving and standardizing brand provenance for legacy products...")
        c.execute("""
            UPDATE products
            SET
                source_brand = brand,
                brand_display = COALESCE(brand, 'FreshCart Basics'),
                brand_status = CASE WHEN brand IS NOT NULL AND brand != '' THEN 'SOURCE_PROVIDED' ELSE 'FRESHCART_DEFAULT' END
            WHERE id NOT IN (SELECT active_id FROM matched_pairs)
              AND id NOT LIKE 'off_%'
              AND id NOT LIKE 'abo_%';
        """)
        log("✅ Legacy products brand standardization complete.")

        # D. Deactivate / De-Index Legacy Synthetic Pooja Records (Zero Deletions)
        log("Deactivating and de-indexing 6,442 legacy synthetic Pooja items...")
        c.execute("""
            UPDATE products
            SET is_active = 0,
                category_status = 'DEACTIVATED_SYNTHETIC'
            WHERE source_dataset = 'curated_spiritual_catalog';
        """)
        deactivated_pooja = c.rowcount
        log(f"✅ Deactivated {deactivated_pooja:,} legacy synthetic Pooja records (is_active = 0).")

        # ----------------------------------------------------------------------
        # STEP 5: IN-TRANSACTION RIGOROUS VALIDATION
        # ----------------------------------------------------------------------
        log("\n--- STEP 5: IN-TRANSACTION RIGOROUS VALIDATION ---")

        # Check Total Products
        c.execute("SELECT COUNT(*) FROM products;")
        total_products = c.fetchone()[0]
        expected_total = 103488
        log(f"Total products post-activation: {total_products:,} (Expected: {expected_total:,})")
        if total_products != expected_total:
            raise RuntimeError(f"VALIDATION FAILED: Total products {total_products} != {expected_total}")

        # Primary Key Invariant: For every existing product: BEFORE.id === AFTER.id
        c.execute("""
            SELECT COUNT(*) FROM original_product_ids
            WHERE id NOT IN (SELECT id FROM products);
        """)
        missing_ids = c.fetchone()[0]
        log(f"Original IDs missing post-activation: {missing_ids}")
        if missing_ids != 0:
            raise RuntimeError(f"VALIDATION FAILED: {missing_ids} original product IDs were modified or dropped!")
        log("✅ PRIMARY KEY INVARIANT PROVEN: BEFORE.id === AFTER.id for 100% of 100,000 original products.")

        # Historical Referential Integrity
        for tbl in ['order_items', 'user_interactions', 'sales_history']:
            c.execute(f"SELECT COUNT(*) FROM {tbl} WHERE product_id NOT IN (SELECT id FROM products);")
            orphans = c.fetchone()[0]
            log(f"Orphans in {tbl}: {orphans}")
            if orphans != 0:
                raise RuntimeError(f"VALIDATION FAILED: Historical table {tbl} has {orphans} broken foreign keys!")
        log("✅ HISTORICAL INTEGRITY VERIFIED: 0 orphans across orders, interactions, and sales history.")

        # Pooja Deactivation Check
        c.execute("SELECT COUNT(*) FROM products WHERE source_dataset = 'curated_spiritual_catalog' AND is_active = 1;")
        active_pooja = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM products WHERE source_dataset = 'curated_spiritual_catalog' AND is_active = 0;")
        inactive_pooja = c.fetchone()[0]
        log(f"Active Pooja items: {active_pooja} (must be 0), Deactivated Pooja items: {inactive_pooja} (must be 6,442)")
        if active_pooja != 0 or inactive_pooja != 6442:
            raise RuntimeError(f"VALIDATION FAILED: Pooja deactivation invariant failed (active: {active_pooja}, inactive: {inactive_pooja})")
        log("✅ POOJA INVARIANT VERIFIED: 100% of synthetic Pooja records deactivated from active browse.")

        # Taxonomy Confidence & Status Checks
        c.execute("SELECT COUNT(*) FROM products WHERE category_confidence = 'HIGH' AND category_status = 'MAPPED' AND is_active = 1;")
        high_conf_mapped = c.fetchone()[0]
        c.execute("SELECT COUNT(*) FROM products WHERE category_status = 'REVIEW_REQUIRED';")
        review_required = c.fetchone()[0]
        log(f"High-confidence active mapped products: {high_conf_mapped:,}")
        log(f"Review-required quarantined products: {review_required:,}")

        # Commit Transaction
        conn.execute("COMMIT;")
        log(f"🎉 TRANSACTION COMMITTED SUCCESSFULLY in {time.time() - t_tx_start:.2f}s!")

    except Exception as e:
        conn.execute("ROLLBACK;")
        log(f"❌ ERROR ENCOUNTERED! TRANSACTION ROLLED BACK: {str(e)}")
        raise e

    # --------------------------------------------------------------------------
    # STEP 6: INDEX REBUILD & OPTIMIZATION
    # --------------------------------------------------------------------------
    log("\n--- STEP 6: REBUILDING INDEXES & OPTIMIZING ---")
    t_idx_start = time.time()
    indexes = [
        ("idx_products_is_active", "ON products(is_active)"),
        ("idx_products_cat_conf_active", "ON products(category, category_confidence, category_status, is_active)"),
        ("idx_products_dept_active", "ON products(department, is_active)"),
        ("idx_products_subcat_active", "ON products(subcategory, is_active)"),
        ("idx_products_brand_active", "ON products(brand, is_active)"),
        ("idx_products_barcode", "ON products(barcode)"),
        ("idx_products_price_active", "ON products(price, is_active)"),
        ("idx_products_rating_active", "ON products(rating, is_active)")
    ]

    for idx_name, idx_def in indexes:
        log(f"Creating/updating index {idx_name}...")
        c.execute(f"CREATE INDEX IF NOT EXISTS {idx_name} {idx_def};")

    log("Running SQLite ANALYZE for query planner statistics...")
    c.execute("ANALYZE;")
    log(f"✅ Indexes created and analyzed in {time.time() - t_idx_start:.2f}s.")

    # --------------------------------------------------------------------------
    # STEP 7: CATALOG VALIDATION STATISTICS REPORT
    # --------------------------------------------------------------------------
    log("\n--- STEP 7: POST-ACTIVATION CATALOG METRICS ---")
    metrics = {}

    c.execute("SELECT COUNT(*) FROM products;")
    metrics["total_products"] = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM products WHERE is_active = 1;")
    metrics["active_products"] = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM products WHERE category_confidence = 'HIGH';")
    metrics["high_confidence_products"] = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM products WHERE category_status = 'REVIEW_REQUIRED';")
    metrics["review_required_products"] = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM products WHERE id NOT IN (SELECT active_id FROM matched_pairs) AND id NOT LIKE 'off_%' AND id NOT LIKE 'abo_%';")
    metrics["legacy_preserved_products"] = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM products WHERE id LIKE 'off_%' OR id LIKE 'abo_%';")
    metrics["new_products"] = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM products WHERE id IN (SELECT active_id FROM matched_pairs);")
    metrics["enriched_products"] = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM products WHERE source_dataset = 'curated_spiritual_catalog' AND is_active = 0;")
    metrics["deactivated_synthetic_products"] = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM products WHERE primary_image_url IS NOT NULL AND primary_image_url != '';")
    metrics["products_with_primary_image"] = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM products WHERE gallery_images IS NOT NULL AND gallery_images != '[]' AND gallery_images != '';")
    metrics["products_with_gallery"] = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM products WHERE (primary_image_url IS NULL OR primary_image_url = '') AND (image_url IS NULL OR image_url = '' OR image_url LIKE '%groceries.svg%');")
    metrics["products_with_missing_image"] = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM products WHERE source_dataset IS NOT NULL AND license IS NOT NULL;")
    metrics["products_with_provenance"] = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM products WHERE brand_status = 'SOURCE_PROVIDED';")
    metrics["products_with_source_brand"] = c.fetchone()[0]

    c.execute("SELECT COUNT(*) FROM products WHERE brand_status = 'FRESHCART_DEFAULT';")
    metrics["products_with_freshcart_default_brand"] = c.fetchone()[0]

    for k, v in metrics.items():
        log(f"  • {k.replace('_', ' ').title()}: {v:,}")

    # --------------------------------------------------------------------------
    # STEP 8: EMPIRICAL LATENCY BENCHMARKS (P50 / P95)
    # --------------------------------------------------------------------------
    log("\n--- STEP 8: EMPIRICAL QUERY LATENCY MEASUREMENTS (50 iterations each) ---")
    latency_results = {}

    benchmark_queries = [
        ("Barcode Lookup", "SELECT * FROM products WHERE barcode = '7035453500022' LIMIT 1;"),
        ("Category Query (Storefront Mapped)", "SELECT * FROM products WHERE category = 'staples_grains' AND category_confidence = 'HIGH' AND category_status = 'MAPPED' AND is_active = 1 LIMIT 24;"),
        ("Subcategory Query", "SELECT * FROM products WHERE subcategory = 'Flours & Atta' AND is_active = 1 LIMIT 24;"),
        ("Filtered Catalog Query", "SELECT * FROM products WHERE category = 'staples_grains' AND price <= 150 AND is_active = 1 ORDER BY price ASC LIMIT 24;"),
        ("Search Query", "SELECT * FROM products WHERE (name LIKE '%chocolate%' OR description LIKE '%chocolate%') AND is_active = 1 ORDER BY rating DESC LIMIT 24;"),
        ("Product Detail Lookup (Primary Key)", "SELECT * FROM products WHERE id = 'f1' LIMIT 1;")
    ]

    for label, sql in benchmark_queries:
        times = []
        for _ in range(50):
            t0 = time.perf_counter()
            c.execute(sql)
            _ = c.fetchall()
            times.append((time.perf_counter() - t0) * 1000.0) # convert to ms

        p50 = statistics.median(times)
        p95 = statistics.quantiles(times, n=20)[18] if len(times) >= 20 else max(times)
        avg = statistics.mean(times)
        latency_results[label] = {"p50": round(p50, 3), "p95": round(p95, 3), "avg": round(avg, 3)}
        log(f"  • {label:<36}: P50 = {p50:.3f} ms | P95 = {p95:.3f} ms (avg {avg:.3f} ms)")

    # Save metrics JSON for reporting
    metrics_path = os.path.join(os.path.dirname(__file__), '..', '.antigravity', 'catalog_activation_metrics.json')
    with open(metrics_path, 'w', encoding='utf-8') as f:
        json.dump({"catalog_metrics": metrics, "latency_benchmarks": latency_results}, f, indent=2)
    log(f"Saved activation metrics to {metrics_path}")

    log("\n================================================================================")
    log("CONTROLLED CATALOG ACTIVATION COMPLETED SUCCESSFULLY")
    log("================================================================================")

    conn.close()

if __name__ == '__main__':
    run_activation()
