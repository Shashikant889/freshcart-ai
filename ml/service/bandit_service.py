"""
ml/service/bandit_service.py
Multi-Armed Bandit (MAB) with Bayesian Beta-Bernoulli Thompson Sampling
Dynamically optimizes flash promotion banners and deal placement:
- Balances Exploration (learning unproven promotions) vs Exploitation (serving high-CTR winners)
- Formulation:
  theta_k ~ Beta(alpha_k, beta_k)
  Selected Arm = argmax_k(sample(theta_k))
  Bayesian Update: alpha_k += reward, beta_k += (1 - reward)
"""

import math
import random
from typing import Dict, List, Any, Optional

class ThompsonSamplingBanditEngine:
    def __init__(self):
        # Promotional campaign arms
        self.arms = [
            {
                "id": "arm_flash_50",
                "title": "⚡ 50% Off Instant Grocery Deal",
                "tagline": "Save ₹50 on orders above ₹299 with code INSTA50",
                "badge": "Flash Sale",
                "alpha": 42.0,  # Prior successes (clicks/conversions)
                "beta": 158.0   # Prior failures (impressions without conversion)
            },
            {
                "id": "arm_free_delivery",
                "title": "🎁 10-Minute Free Express Delivery",
                "tagline": "Zero delivery charges on all organic fresh produce",
                "badge": "Free Delivery",
                "alpha": 65.0,
                "beta": 135.0
            },
            {
                "id": "arm_combo_saver",
                "title": "🥗 Super Combo Breakfast Basket",
                "tagline": "Milk + Eggs + Sourdough bread bundle at ₹185 (Save 20%)",
                "badge": "AI Bundle",
                "alpha": 28.0,
                "beta": 172.0
            },
            {
                "id": "arm_cashback_100",
                "title": "🪙 100 FreshCoins Wallet Cashback",
                "tagline": "Top up ₹500 in FreshWallet and get ₹100 instant bonus",
                "badge": "Fintech Bonus",
                "alpha": 38.0,
                "beta": 162.0
            }
        ]

    def _sample_beta(self, a: float, b: float) -> float:
        """Draws a random sample from Beta(a, b) distribution."""
        try:
            return random.betavariate(a, b)
        except Exception:
            return a / (a + b)

    def select_best_arm(self) -> Dict[str, Any]:
        """
        Samples theta_k ~ Beta(alpha_k, beta_k) for all arms and returns the winning arm.
        Also computes empirical CTR and 95% Bayesian credible intervals.
        """
        sampled_results = []
        for arm in self.arms:
            theta_sample = self._sample_beta(arm["alpha"], arm["beta"])
            total_trials = arm["alpha"] + arm["beta"]
            empirical_ctr = arm["alpha"] / total_trials
            
            # Normal approximation for 95% Bayesian credible interval
            std_err = math.sqrt((empirical_ctr * (1 - empirical_ctr)) / total_trials)
            ci_lower = max(0.0, empirical_ctr - 1.96 * std_err)
            ci_upper = min(1.0, empirical_ctr + 1.96 * std_err)

            sampled_results.append({
                "arm_id": arm["id"],
                "title": arm["title"],
                "tagline": arm["tagline"],
                "badge": arm["badge"],
                "alpha": arm["alpha"],
                "beta": arm["beta"],
                "total_impressions": int(total_trials),
                "total_conversions": int(arm["alpha"]),
                "empirical_ctr_percent": round(empirical_ctr * 100, 2),
                "credible_interval_95": [round(ci_lower * 100, 2), round(ci_upper * 100, 2)],
                "thompson_sample": round(theta_sample, 4)
            })

        # Arm with highest Thompson sample is served to the user
        winner = max(sampled_results, key=lambda x: x["thompson_sample"])

        return {
            "algorithm": "Bayesian Beta-Bernoulli Thompson Sampling Multi-Armed Bandit",
            "selected_arm": winner,
            "all_arms": sampled_results,
            "exploration_entropy": round(self._calculate_entropy([a["empirical_ctr_percent"] for a in sampled_results]), 3)
        }

    def _calculate_entropy(self, ctrs: List[float]) -> float:
        total = sum(ctrs) or 1.0
        probs = [c / total for c in ctrs]
        return -sum(p * math.log2(p + 1e-9) for p in probs)

    def record_feedback(self, arm_id: str, converted: bool) -> Dict[str, Any]:
        """Performs instantaneous Bayesian posterior update: alpha += 1 or beta += 1."""
        target_arm = next((a for a in self.arms if a["id"] == arm_id), None)
        if not target_arm:
            return {"success": False, "message": f"Arm {arm_id} not found."}

        if converted:
            target_arm["alpha"] += 1.0
        else:
            target_arm["beta"] += 1.0

        new_total = target_arm["alpha"] + target_arm["beta"]
        new_ctr = target_arm["alpha"] / new_total

        return {
            "success": True,
            "arm_id": arm_id,
            "feedback": "CONVERSION" if converted else "IMPRESSION_NO_CLICK",
            "updated_posterior": {
                "alpha": target_arm["alpha"],
                "beta": target_arm["beta"],
                "new_empirical_ctr_percent": round(new_ctr * 100, 2)
            }
        }

bandit_engine = ThompsonSamplingBanditEngine()
