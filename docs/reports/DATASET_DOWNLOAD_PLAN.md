# FreshCart AI — Dataset Download Plan & Bandwidth Budget

> **Document Type**: Download Strategy, Storage Estimation & Bandwidth Budget  
> **Directive Reference**: Section 16 & Section 17 ("Target Catalog Size & Storage Feasibility")  
> **Target Production Catalog**: 10,000 Structured Retail SKUs  

---

## 1. Storage & Bandwidth Feasibility Analysis

FreshCart AI runs locally on Node.js with `sql.js` (SQLite in WebAssembly). The database is loaded entirely into RAM. Downloading entire terabyte dumps (such as the 350 GB full Open Food Facts image archive or 147 GB ABO full 3D mesh package) would crash local resources and is academically unjustified.

Instead, we execute a **metadata-first, staged subset acquisition strategy**:

| Source Dataset | Component | Full Raw Size | Staged / Target Ingestion | Storage Consumption | Bandwidth Strategy |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Open Food Facts** | India Catalog & Global Staples Metadata | ~45 GB uncompressed | 7,000 JSON product records | **~18 MB** (JSON & DB records) | Scoped HTTPS REST API with pagination & rate limits |
| **Amazon Berkeley Objects** | Metadata Listings (`listings_0.json.gz`) | 1.8 GB (all shards) | 1 shard (`listings_0.json.gz`: 5.4 MB) | **~24 MB** uncompressed | Single gzip stream directly from AWS S3 |
| **Amazon Berkeley Objects** | Image Metadata (`images.csv.gz`) | 6.4 MB | Filtered image path index | **~4 MB** cached index | Extracted paths matching selected ASINs |
| **Pooja Essentials** | Curated Indian Spiritual Taxonomy | 500 KB | 500 validated SKUs | **~1.2 MB** | Local verified repository structure |
| **Optimized Image Cache** | Front & Back Thumbnails (`200x200` to `400x400`) | Multi-TB | Remote S3/OFF URL references + Local cached demo assets | **~35 MB** local cache | Lazy loading via remote CDNs with local fallback |
| **TOTAL ESTIMATED BUDGET** | **Combined Retail Catalog** | **> 500 GB** | **10,000 Target SKUs** | **~82.2 MB total footprint** | **100% stable in Node.js WebAssembly memory** |

---

## 2. Step-by-Step Acquisition Plan

### Phase 1: Metadata Inspection & Category Filtering
1. **Open Food Facts**:
   - Query Indian market products (`countries_tags_en=india`) and major grocery staple categories (`dairy`, `beverages`, `snacks`, `breakfast_cereals`, `fruits`, `vegetables`, `spices`, `condiments`).
   - Extract fields: `code`, `product_name`, `brands`, `categories`, `categories_tags`, `image_front_url`, `image_ingredients_url`, `image_nutrition_url`, `ingredients_text`, `nutriments`, `quantity`.
   - Filter out records missing both product name and barcode.
2. **Amazon Berkeley Objects**:
   - Stream `https://amazon-berkeley-objects.s3.amazonaws.com/listings/metadata/listings_0.json.gz`.
   - Filter for relevant quick-commerce consumer electronics and household merchandise:
     - `product_type`: `HEADPHONES`, `CELLULAR_PHONE_CASE`, `SHOES`, `HOME`, `KITCHEN`, `ACCESSORY`.
     - Filter for items with valid English descriptions (`language_tag: "en_US"` or `"en_GB"` or fallback).
   - Resolve image URLs via `https://amazon-berkeley-objects.s3.amazonaws.com/images/small/${path}`.
3. **Pooja Essentials**:
   - Ingest 500 curated, unverified SKUs across Incense & Fragrance, Lighting, Diya, Camphor, and Pooja Kits with realistic pricing (₹20 to ₹850) and detailed attributes (`burn_time_minutes`, `fragrance_profile`, `material`).

### Phase 3: Integrity Validation & Checksums
- Check that all barcodes comply with standard formats (EAN-8, EAN-13, UPC-12, ASIN-10).
- Probe image URLs via HTTP HEAD requests to confirm HTTP 200 reachability.
- Validate that all prices, units, and categories map cleanly into the 4-level taxonomy.
