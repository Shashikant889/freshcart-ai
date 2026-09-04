# Nutritional Scoring, Allergen Warnings & Dietary Standards

## 1. Nutri-Score Mathematical Formulation
The platform evaluates shopping carts dynamically using the European Nutri-Score computational framework adapted for Indian grocery retail:

$$\text{Final Nutri-Score} = \sum (\text{Negative Unfavorable Points } N) - \sum (\text{Positive Favorable Points } P)$$

* **Negative Points ($N$ up to 40 points):**
  - Energy density (kJ per 100g): Caloric load from refined sugars and carbohydrates.
  - Saturated fatty acids (g per 100g): Hydrogenated fats and palm oil derivatives.
  - Simple sugars (g per 100g): Added syrups and sucrose.
  - Sodium (mg per 100g): Salt concentration.
* **Positive Points ($P$ up to 15 points):**
  - Dietary fiber (g per 100g): Whole grains, pulses, legumes.
  - Protein content (g per 100g): Dairy paneer, pulses, eggs, nuts.
  - Percentage of fresh fruits, vegetables, and legumes ($\ge 40\%$ threshold).

### Health Grade Classification Scale:
* **Grade A+ / A (Nutri-Score $\le -1$):** High micronutrient density, unpolished legumes, green leafy vegetables, unsweetened Greek yogurt.
* **Grade B (Nutri-Score 0 to 2):** Whole milk, whole-wheat atta, rolled oats, fresh poultry.
* **Grade C (Nutri-Score 3 to 10):** White bread, flavored yogurts, lightly salted snacks.
* **Grade D / E (Nutri-Score $\ge 11$):** Carbonated sodas, instant noodles, confectionery, deep-fried snacks.

## 2. Allergen Screening & Cross-Contamination Protocols
* **Tracked Allergens:**
  1. `Lactose / Dairy`: Milk, butter, paneer, curd, ghee, whey powder.
  2. `Gluten`: Wheat, barley, rye, maida, sooji.
  3. `Tree Nuts & Peanuts`: Almonds, cashews, walnuts, pistachios, groundnut oils.
  4. `Soy`: Tofu, soy sauce, edamame, lecithin additives.
* **Automated Warning Trigger:** When an item containing a customer's configured profile allergen enters the active cart, the UI displays a high-visibility amber warning banner and calculates the allergen load percentage.
