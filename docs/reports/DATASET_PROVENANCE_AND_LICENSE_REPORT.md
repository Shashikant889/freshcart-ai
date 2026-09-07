# FreshCart AI — Dataset Provenance & Data Governance Report

> **Document Type**: Academic Data Provenance, Governance & Traceability Record  
> **Directive Reference**: Section 12 & Section 40 ("Academic Traceability & Data Governance")  
> **Repository Grounding**: Certified for Final-Year Academic Evaluation  

---

## 1. Governance Principles
FreshCart AI adheres strictly to the **Zero Fabrication Directives** (Golden Rule 9 and Golden Rule 10). Every imported product record permanently preserves:
- `source_dataset`: The originating repository or institution.
- `source_record_id`: The immutable source identifier (EAN-13 barcode, UPC, or ASIN).
- `source_url`: Verifiable web link back to the source entry.
- `license`: Applicable license string.
- `license_url`: Official license deed.
- `retrieved_at`: ISO timestamp of ingestion.
- `dataset_status`: `verified_real`, `curated_unverified`, or `synthetic_demo`.

---

## 2. Dataset Ingestion Profiles

### Dataset 1: Open Food Facts (India & Global Staples)
- **Source Institution**: Open Food Facts Non-Profit Association (Paris, France).
- **Dataset Home**: `https://world.openfoodfacts.org/`
- **License**: Open Database License (ODbL) v1.0 / Database Contents License (DbCL) 1.0.
- **License URL**: `https://opendatacommons.org/licenses/odbl/1-0/`
- **Permitted Use**: Open access, research, academic, and non-commercial application.
- **Attribution Statement**: *"Contains data from Open Food Facts, made available under the Open Database License (ODbL)."*
- **Restrictions**: Must preserve database attribution and distribute derivative database under same ODbL terms.
- **Downloaded Date**: 2026-09-06
- **Local Staging Path**: `data/external/openfoodfacts/`
- **Transformations Performed**:
  1. Extracted Indian retail products via REST API filtering (`countries_tags_en=india`).
  2. Mapped unstructured category strings (e.g. `Plant-based foods and beverages > Beverages > Plant milks`) to FreshCart's 4-level taxonomy (`Grocery & Food` $\rightarrow$ `Dairy & Breakfast` $\rightarrow$ `Milk & Plant Milks`).
  3. Sanitized nutriments JSON and extracted standard Nutri-Score grades (A to E).
  4. Preserved authentic high-resolution front, ingredients, and nutrition image URLs.

---

### Dataset 2: Amazon Berkeley Objects (ABO)
- **Source Institution**: Amazon Science & University of California, Berkeley.
- **Dataset Home**: `https://amazon-berkeley-objects.s3.amazonaws.com/`
- **License**: Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0).
- **License URL**: `https://creativecommons.org/licenses/by-nc/4.0/`
- **Permitted Use**: Non-commercial academic research and university projects.
- **Attribution Statement**: *"Collins, J., et al. (2022). ABO: Dataset and Benchmarks for Real-World 3D Object Understanding. CVPR 2022."*
- **Restrictions**: Strictly non-commercial. No direct monetization.
- **Downloaded Date**: 2026-09-06
- **Local Staging Path**: `data/external/amazon_berkeley_objects/`
- **Transformations Performed**:
  1. Filtered metadata shard `listings_0.json.gz` for consumer electronics (`HEADPHONES`, `CELLULAR_PHONE_CASE`), watches, and home goods.
  2. Mapped ASINs (`B0...`) to FreshCart's SKU layer.
  3. Joined image index `images.csv.gz` to construct verified public AWS S3 image URLs (`https://amazon-berkeley-objects.s3.amazonaws.com/images/small/...`).
  4. Extracted technical specifications (dimensions, colors, models, materials) into structured `attributes_json`.

---

### Dataset 3: Curated Pooja Essentials
- **Source Institution**: FreshCart AI Engineering Team.
- **Dataset Home**: Local Workspace (`data/external/pooja/`).
- **License**: Creative Commons Attribution 4.0 (CC BY 4.0).
- **License URL**: `https://creativecommons.org/licenses/by/4.0/`
- **Permitted Use**: Open academic research and quick-commerce testing.
- **Attribution Statement**: *"FreshCart AI Academic Curated Spiritual Retail Taxonomy."*
- **Restrictions**: None. Transparently flagged as unverified retail curation.
- **Downloaded Date**: 2026-09-06
- **Local Staging Path**: `data/external/pooja/`
- **Transformations Performed**:
  1. Formulated authentic Indian spiritual taxonomy: Incense & Fragrance, Sacred Lighting, Diyas, Camphor, Cotton Wicks, and Festive Kits.
  2. Applied category-specific attributes (`fragrance_profile`, `burn_time_minutes`, `material`, `stick_count`, `smoke_profile`).
  3. Set `dataset_status = 'curated_unverified'` and `price_status = 'demo_calibrated'`.
