# FreshCart AI — Dataset Legal License & Compliance Audit

> **Document Version**: 1.0.0  
> **Target Project**: FreshCart AI (B.Tech Final Year Academic Project — CSE/AIML)  
> **Research Phase**: Phase 3 — Catalog Dataset Enrichment & Real Image Provenance  
> **Compliance References**: Master Development Directive (Sections 2, 3, 4, 7, 25)

---

## 1. Executive Legal Scope

This audit evaluates the legal rights, intellectual property boundaries, commercial vs. non-commercial constraints, attribution mandates, and share-alike implications for all datasets considered for FreshCart AI.

Because FreshCart AI is an **undergraduate academic final-year project (B.Tech / B.E.)** defended under university viva examination criteria:
1. **Academic Fair Use & Educational Exemption**: The system operates strictly in an educational, non-commercial, demonstrative capacity.
2. **Permissive Ingestion Standard**: Only datasets with transparent open-data licenses (ODbL, CC-BY, CC0, CC BY-NC) are approved for integration.
3. **Attribution Guarantee**: Every imported record retains explicit dataset attribution, source URL, license code, and retrieval timestamp in compliance with Section 25.

---

## 2. Granular License Breakdown per Candidate

### 1. Open Food Facts (OFF)
- **Data License**: **Open Database License (ODbL) v1.0** (Open Data Commons)
- **Image License**: **Creative Commons Attribution-ShareAlike 3.0 Unported (CC-BY-SA 3.0)** / **Database Contents License (DbCL)**
- **Permitted Rights**:
  - You are free to copy, distribute, transmit, adapt, and build upon the database.
  - Commercial and non-commercial uses are both expressly permitted.
- **Key Conditions**:
  - **Attribution (ODbL § 4.3)**: Any public display of the database or derived works must cite: *"Contains data from Open Food Facts, made available under the Open Database License (ODbL)."*
  - **Share-Alike (ODbL § 4.4)**: If a publicly accessible derivative database is distributed, it must be licensed under ODbL. Internal/academic usage within FreshCart's local SQLite engine does not constitute external redistribution.
  - **Image Rights**: Images contributed by users are subject to CC-BY-SA 3.0, requiring attribution to Open Food Facts and the original contributors.
- **Compliance Verdict**: **APPROVED FOR PRODUCTION INGESTION**. Satisfies all academic and open-source criteria.

---

### 2. Amazon Berkeley Objects (ABO) Dataset
- **License**: **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**
- **Governing Body**: Amazon Science & The Regents of the University of California
- **Permitted Rights**:
  - You are free to share (copy, distribute) and adapt (remix, transform, build upon) the material for any **non-commercial purpose**.
- **Key Conditions**:
  - **Non-Commercial Restriction (§ 2.a.1)**: You may not use the material for commercial purposes (e.g., selling access, paid monetization). FreshCart AI is 100% academic/educational and strictly non-commercial, fully complying with CC BY-NC 4.0.
  - **Attribution (§ 3.a)**: You must give appropriate credit to Amazon Science and UC Berkeley, provide a link to the license, and indicate if changes were made.
- **Compliance Verdict**: **APPROVED FOR ACADEMIC USE**. Ideal for electronics, kitchenware, and household consumer goods.

---

### 3. USDA FoodData Central (FDC)
- **License**: **Public Domain (U.S. Government Work / CC0 1.0 Universal)**
- **Governing Body**: United States Department of Agriculture (USDA) / National Agricultural Library
- **Permitted Rights**:
  - Free from copyright restrictions under Title 17, Section 105 of the United States Code.
  - Unrestricted worldwide commercial, educational, and derivative usage without mandatory license clauses.
- **Attribution Recommendation**: Standard academic citation to the USDA FoodData Central database.
- **Compliance Verdict**: **APPROVED FOR REFERENCE & NUTRITION SANITY AUDITING**. Lacks packaging images, but completely unencumbered legally.

---

### 4. BigBasket Dataset (Kaggle Community)
- **License**: **CC0: Public Domain** / **Community Open Data**
- **Provenance Risk**: The dataset was originally compiled via web extraction of public product listings on BigBasket India and published under CC0 on Kaggle.
- **Legal Risk Assessment**:
  - Raw factual product data (names, weights, MRP, ingredients) does not qualify for copyright protection under Indian copyright jurisprudence (factual compilation doctrine; *Eastern Book Company v. D.B. Modak*).
  - However, direct hotlinking to third-party proprietary CDN image servers can cause Broken Image Rots or hotlinking blocking (HTTP 403 Forbidden).
- **Compliance Verdict**: **APPROVED AS METADATA ENRICHMENT ONLY** (use product names, brands, and Indian category classifications; do not hotlink fragile scraped images).

---

### 5. Instacart Market Basket Analysis Dataset
- **License**: **Instacart Terms of Service / Research Use Only**
- **Permitted Rights**:
  - Provided strictly for non-commercial research and machine learning evaluation under Kaggle competition terms.
- **Limitations**:
  - Commercial exploitation is prohibited.
  - Contains no product descriptions, imagery, or physical attributes.
- **Compliance Verdict**: **APPROVED FOR OFFLINE ASSOCIATION RULE VALIDATION ONLY**; rejected for live catalog presentation.

---

### 6. Stanford Online Products (SOP)
- **License**: **Educational & Research Use Only** (Stanford Vision Lab)
- **Limitations**: Restricted to academic research. Lacks pricing, specifications, barcode, and inventory fields.
- **Compliance Verdict**: **REJECTED**. Incompatible with e-commerce retail requirements.

---

### 7. Google Scanned Objects (GSO)
- **License**: **Creative Commons Attribution 4.0 International (CC BY 4.0)**
- **Permitted Rights**: Free sharing, adaptation, and commercial use with attribution.
- **Limitations**: Small catalogue (only 1,030 items); exclusively 3D assets.
- **Compliance Verdict**: **REJECTED DUE TO SCOPE MISMATCH**.

---

### 8. Flipkart Products Dataset (Kaggle)
- **License**: **Open Community / CC0 1.0**
- **Provenance Risk**: Scraped data with legacy external CDN image links.
- **Compliance Verdict**: **APPROVED AS SECONDARY METADATA REFERENCE** for electronic specifications.

---

### 9. Amazon UCSD Multi-Category Review Dataset
- **License**: **Academic Research License** (Prof. Julian McAuley, UCSD)
- **Limitations**: Massive storage burden (35+ GB); outdated image links.
- **Compliance Verdict**: **REJECTED DUE TO STORAGE & LATENCY BUDGET**.

---

### 10. Curated Indian Spiritual Samagri Dataset
- **License**: **Public Domain Dedication (CC0 1.0) / Local Project Creation**
- **Provenance**: Hand-curated local repository of Indian puja and festive grocery supplies with authentic localized descriptions.
- **Compliance Verdict**: **APPROVED FOR CONTINUED PRODUCTION USE**.

---

## 3. Mandatory Compliance & Attribution Checklist

To maintain 100% legal compliance across FreshCart AI, the ingestion pipeline must enforce:

- [x] **Zero Proprietary Enterprise Code**: No separately licensed enterprise libraries (e.g., Medusa Enterprise, closed-source MLOps SDKs).
- [x] **Database Attribution Columns**: Every product table schema retains:
  - `source_dataset` (`open_food_facts`, `amazon_berkeley_objects`, `curated_spiritual_catalog`)
  - `source_url` (direct URL to source record on OFF or Amazon S3)
  - `source_record_id` (original barcode or ASIN)
  - `license` (`ODbL-1.0`, `CC BY-NC 4.0`, `CC0-1.0`)
  - `license_url` (direct URL to open-source license legal text)
  - `retrieved_at` (ISO 8601 timestamp)
- [x] **Frontend UI Notice**: Administrative dashboard and customer product details modal must display an attribution badge linking to Open Food Facts and Amazon Berkeley Objects.
- [x] **Open Attribution Documentation**: Maintain [`OPEN_SOURCE_ATTRIBUTION.md`](file:///c:/Users/shash/demo1/OPEN_SOURCE_ATTRIBUTION.md) with updated versions, commits, and source repositories.

---

## 4. Legal Risk Assessment & Mitigation

| Potential Legal Risk | Likelihood | Impact | FreshCart Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Share-Alike Contamination (ODbL §4.4)** | Low | Low | FreshCart SQLite DB is an internal relational store; we do not sell or distribute standalone database dump copies. Attribution is rendered on web pages. |
| **Commercial Use Claim on ABO (CC BY-NC)** | Very Low | High | FreshCart AI is explicitly labeled an academic final-year project at an accredited engineering institution. Commercial monetization is disallowed. |
| **Image Hotlink Blocking / 403 Forbidden** | Medium | Medium | Ingestion pipeline tests image headers before inserting URLs. Local SVG/WebP vector fallbacks handle any missing remote assets seamlessly. |
| **Trademark Infringement on Brand Names** | Low | Low | Product names and brands are displayed purely for descriptive nominative fair use within a mock retail simulation environment. |

