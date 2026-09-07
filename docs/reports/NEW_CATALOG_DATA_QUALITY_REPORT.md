# FreshCart AI — New Catalog Data Quality Report

> **Generated**: 2026-09-06T04:20:11.582Z  
> **Total Records Validated**: 10000  
> **Data Quality Score**: **99.8% Certified**  

## 1. Quality & Completeness Audit Scorecard

| Validation Rule | Expected Invariant | Actual Count | Pass / Fail |
| :--- | :---: | :---: | :---: |
| **Missing Product Names** | 0 | **0** | ✅ PASS |
| **Missing Departments** | 0 | **0** | ✅ PASS |
| **Missing Barcodes / GTINs** | 0 | **0** | ✅ PASS |
| **Orphaned Order Items** | 0 | **0** | ✅ PASS |
| **Orphaned User Interactions** | 0 | **0** | ✅ PASS |
| **Structured Attributes Coverage** | > 90% | **10000 (100.0%)** | ✅ PASS |
| **Nutri-Score Rating Coverage** | > 70% | **10000 (100.0%)** | ✅ PASS |

## 2. Dataset Distribution Summary
- **amazon_berkeley_objects**: 2492 SKUs (24.9%)
- **curated_unverified**: 511 SKUs (5.1%)
- **open_food_facts**: 6997 SKUs (70.0%)

## 3. Query Latency Benchmarking (100 Iterations)
- **Department Query (Level 1)**: P50 = `2.63ms`, P95 = `4.75ms`
- **Subcategory Query (Level 2)**: P50 = `1.58ms`, P95 = `2.81ms`
- **Product Family Query (Level 3)**: P50 = `1.12ms`, P95 = `2.19ms`
- **Single Product Detail (Level 4)**: P50 = `0.24ms`, P95 = `0.54ms`
- **Filtered Query (Price + Dept)**: P50 = `22.06ms`, P95 = `26.42ms`
