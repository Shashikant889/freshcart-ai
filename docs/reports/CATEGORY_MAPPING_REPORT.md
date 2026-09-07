# FreshCart AI — Category Mapping Pipeline & Normalization Report

> **Document Type**: Category Normalization & Taxonomy Alignment Report  
> **Directive Reference**: Section 9 & Section 10 ("Normalized Category Hierarchy & Mapping Pipeline")  
> **Taxonomy Standard**: 4-Tier Hierarchical Structure (Department $\rightarrow$ Subcategory $\rightarrow$ Product Family $\rightarrow$ SKU)  

---

## 1. The 4-Tier Normalized Hierarchy

```text
LEVEL 1: Department (Broadest operational grouping)
  └── LEVEL 2: Subcategory (Retail aisle / product group)
        └── LEVEL 3: Product Family (Specific category cluster / product type)
              └── LEVEL 4: SKU (Individual barcode-bearing retail item)
```

---

## 2. Category Normalization Rules & Pipeline

Every raw incoming record passes through the deterministic normalizer `normalizeCategory(sourceCategory, sourceDepartment, keywords)`:

| Department (Level 1) | Raw Source Category (OFF / ABO) | Normalized Subcategory (Level 2) | Normalized Product Family (Level 3) | Mapping Confidence |
| :--- | :--- | :--- | :--- | :---: |
| **Grocery & Food** | `en:milks`, `Dairies`, `Plant-based beverages` | **Dairy & Breakfast** | **Milk & Plant Milks** | **HIGH** (1.0) |
| **Grocery & Food** | `en:cheeses`, `dairy products`, `curd` | **Dairy & Breakfast** | **Cheese, Paneer & Curd** | **HIGH** (1.0) |
| **Grocery & Food** | `en:biscuits`, `Dry biscuits`, `Sandwich biscuits` | **Snacks & Munchies** | **Biscuits & Cookies** | **HIGH** (1.0) |
| **Grocery & Food** | `en:crisps`, `chips`, `namkeen` | **Snacks & Munchies** | **Chips, Crisps & Namkeen** | **HIGH** (1.0) |
| **Grocery & Food** | `en:energy-drinks`, `carbonated beverages`, `sodas` | **Beverages** | **Cold Drinks & Energy Drinks** | **HIGH** (1.0) |
| **Grocery & Food** | `en:teas`, `coffees`, `herbal teas` | **Beverages** | **Tea & Coffee Essentials** | **HIGH** (1.0) |
| **Grocery & Food** | `en:chocolates`, `sweet snacks`, `candies` | **Snacks & Munchies** | **Chocolates & Confectionery** | **HIGH** (1.0) |
| **Grocery & Food** | `en:flours`, `wheat atta`, `rice`, `cereals` | **Staples & Grains** | **Atta, Rice & Whole Grains** | **HIGH** (1.0) |
| **Grocery & Food** | `en:spices`, `condiments`, `masalas` | **Staples & Grains** | **Spices, Herbs & Seasonings** | **HIGH** (1.0) |
| **Electronics** | `HEADPHONES` (ABO), `earbuds`, `audio` | **Personal Electronics** | **Wireless Earbuds & In-Ear Audio** | **HIGH** (1.0) |
| **Electronics** | `HEADPHONES` (over-ear / on-ear) | **Personal Electronics** | **Over-Ear & Studio Headphones** | **HIGH** (1.0) |
| **Electronics** | `WATCHES` (ABO), `smartwatch`, `wearables` | **Personal Electronics** | **Smart Watches & Fitness Trackers**| **HIGH** (1.0) |
| **Electronics** | `CELLULAR_PHONE_CASE`, `cable`, `charger` | **Mobile Accessories** | **Cables, Chargers & Protective Cases**| **HIGH** (1.0) |
| **Pooja Essentials** | `incense`, `agarbatti`, `dhoop` | **Incense & Fragrance** | **Handcrafted Agarbatti & Dhoop** | **HIGH** (1.0) |
| **Pooja Essentials** | `diya`, `camphor`, `cotton wicks`, `brass` | **Lighting & Sacred Wicks** | **Diyas, Camphor & Cotton Wicks** | **HIGH** (1.0) |
| **Pooja Essentials** | `pooja kit`, `kumkum`, `haldi`, `pooja oil` | **Pooja Consumables & Kits**| **Pooja Kits, Oils & Sacred Powders**| **HIGH** (1.0) |
| **Home & Personal** | `soaps`, `bodywash`, `oral care`, `shampoo` | **Personal Care** | **Bath, Skin & Hair Essentials** | **HIGH** (1.0) |
| **Home & Personal** | `cleaning`, `detergents`, `paper tissues` | **Household Cleaning** | **Cleaners & Paper Products** | **HIGH** (1.0) |

---

## 3. Ambiguity & Low-Confidence Handling

If an ingested record does not match known deterministic taxonomy patterns:
1. It is mapped to the most general fallback:
   - `department = 'Grocery & Food'`
   - `subcategory = 'Packaged Groceries'`
   - `product_family = 'General Grocery Items'`
2. The flag `data_confidence` is explicitly set to `'medium'` or `'low'`.
3. Records are never silently assigned to arbitrary categories.
