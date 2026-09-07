"""
FreshCart AI — Module 1: Personalized Recommendation Experiment (Leak-Free Audit)
Evaluates candidate recommender algorithms under a strict TEMPORAL train/test split:
1. Popularity Baseline
2. Content-Based Filtering (TF-IDF on Item Metadata)
3. User-User Collaborative Filtering (Cosine Neighborhood)
4. Matrix Factorization (Truncated SVD)
5. Hybrid Recommender (Collaborative + Content-Based Ensemble)
Metrics: Precision@K, Recall@K, F1@K, NDCG@K, HitRate@K (K=5, 10)
"""

import sys
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from ml.python.config import (
    RECOMMENDATION_CONFIG,
    MODELS_DIR,
    METRICS_DIR,
    PLOTS_DIR,
    RANDOM_SEED,
    PLOT_STYLE,
)
from ml.python.data_loader import load_recommendation_dataset

plt.rcParams.update(PLOT_STYLE)

class PopularityRecommender:
    """Baseline recommender ranking items by historical aggregate interaction weight."""
    def __init__(self):
        self.popular_items = []
        self.product_ids = []
        
    def fit(self, train_matrix, product_ids):
        self.product_ids = list(product_ids)
        if hasattr(train_matrix, "sum"):
            col_sums = np.asarray(train_matrix.sum(axis=0)).ravel()
        else:
            col_sums = np.sum(train_matrix, axis=0)
        sorted_indices = np.argsort(-col_sums)
        self.popular_items = [self.product_ids[i] for i in sorted_indices]
        return self
        
    def recommend(self, user_idx, top_k=10, train_row=None):
        return self.popular_items[:top_k]

class ContentBasedRecommender:
    """Content-Based recommender using TF-IDF on product tags & category descriptions."""
    def __init__(self):
        self.tfidf = TfidfVectorizer()
        self.tfidf_matrix = None
        self.product_ids = []
        
    def fit(self, products_df, product_ids):
        self.product_ids = list(product_ids)
        corpus = products_df.set_index("id").reindex(self.product_ids)["tags_str"].fillna("")
        self.tfidf_matrix = self.tfidf.fit_transform(corpus)  # Sparse (P x V)
        return self
        
    def recommend(self, user_idx, top_k=10, train_row=None):
        if train_row is None:
            return self.product_ids[:top_k]
        # User profile in tag space: 1 x V
        user_tag_profile = train_row.dot(self.tfidf_matrix)
        if hasattr(user_tag_profile, "toarray"):
            user_tag_profile = user_tag_profile.toarray().ravel()
        if np.all(user_tag_profile == 0):
            return self.product_ids[:top_k]
        # Score items: (P x V) dot (V x 1) -> (P x 1)
        scores = self.tfidf_matrix.dot(user_tag_profile)
        if hasattr(scores, "toarray"):
            scores = scores.toarray().ravel()
        top_indices = np.argsort(-scores)[:top_k]
        return [self.product_ids[i] for i in top_indices]

class UserUserCollaborativeFiltering:
    """Sparse User-User Collaborative Filtering with on-the-fly cosine neighborhood search."""
    def __init__(self, k_neighbors=10):
        self.k_neighbors = k_neighbors
        self.train_matrix = None
        self.user_norms = None
        self.product_ids = []
        
    def fit(self, train_matrix, product_ids):
        import scipy.sparse as sp
        self.train_matrix = sp.csr_matrix(train_matrix, dtype=np.float32)
        self.product_ids = list(product_ids)
        # Precompute L2 norms for each user
        self.user_norms = np.sqrt(self.train_matrix.multiply(self.train_matrix).sum(axis=1).A1) + 1e-9
        return self
        
    def recommend(self, user_idx, top_k=10, train_row=None):
        user_vec = self.train_matrix[user_idx]
        norm_u = self.user_norms[user_idx]
        if norm_u < 1e-8:
            return self.product_ids[:top_k]
            
        # Cosine similarity dot product: (N x P) dot (P x 1) -> (N x 1)
        sim_scores = self.train_matrix.dot(user_vec.T).toarray().ravel()
        sim_scores = sim_scores / (self.user_norms * norm_u)
        sim_scores[user_idx] = 0.0
        
        top_neighbors = np.argsort(-sim_scores)[:self.k_neighbors]
        neighbor_sims = sim_scores[top_neighbors]
        
        if np.sum(neighbor_sims) <= 0:
            return self.product_ids[:top_k]
            
        neighbor_matrix = self.train_matrix[top_neighbors]
        pred_scores = neighbor_matrix.T.dot(neighbor_sims)
        if hasattr(pred_scores, "toarray"):
            pred_scores = pred_scores.toarray().ravel()
        else:
            pred_scores = np.asarray(pred_scores).ravel()
            
        top_indices = np.argsort(-pred_scores)[:top_k]
        return [self.product_ids[i] for i in top_indices]

class SVDMatrixFactorizationRecommender:
    """Latent Matrix Factorization using Truncated SVD on sparse interaction matrix."""
    def __init__(self, n_components=6):
        self.n_components = n_components
        self.svd = TruncatedSVD(n_components=n_components, random_state=RANDOM_SEED)
        self.user_factors = None
        self.components_ = None
        self.product_ids = []
        
    def fit(self, train_matrix, product_ids):
        self.product_ids = list(product_ids)
        self.user_factors = self.svd.fit_transform(train_matrix)
        self.components_ = self.svd.components_
        return self
        
    def recommend(self, user_idx, top_k=10, train_row=None):
        scores = np.dot(self.user_factors[user_idx], self.components_)
        top_indices = np.argsort(-scores)[:top_k]
        return [self.product_ids[i] for i in top_indices]

class HybridRecommender:
    """Ensemble recommender combining Content-Based and Collaborative Filtering."""
    def __init__(self, cb_weight=0.5, cf_weight=0.5):
        self.cb_weight = cb_weight
        self.cf_weight = cf_weight
        self.cb_model = ContentBasedRecommender()
        self.cf_model = UserUserCollaborativeFiltering()
        self.product_ids = []
        
    def fit(self, train_matrix, products_df, product_ids):
        self.product_ids = list(product_ids)
        self.cb_model.fit(products_df, product_ids)
        self.cf_model.fit(train_matrix, product_ids)
        return self
        
    def recommend(self, user_idx, top_k=10, train_row=None):
        if train_row is None:
            return self.product_ids[:top_k]
            
        # 1. Normalized CB scores
        user_tag_profile = train_row.dot(self.cb_model.tfidf_matrix)
        if hasattr(user_tag_profile, "toarray"):
            user_tag_profile = user_tag_profile.toarray().ravel()
        cb_scores = self.cb_model.tfidf_matrix.dot(user_tag_profile)
        if hasattr(cb_scores, "toarray"):
            cb_scores = cb_scores.toarray().ravel()
        if cb_scores.max() > cb_scores.min():
            cb_scores = (cb_scores - cb_scores.min()) / (cb_scores.max() - cb_scores.min() + 1e-9)
            
        # 2. Normalized CF scores
        user_vec = self.cf_model.train_matrix[user_idx]
        norm_u = self.cf_model.user_norms[user_idx]
        if norm_u > 1e-8:
            sim_scores = self.cf_model.train_matrix.dot(user_vec.T).toarray().ravel()
            sim_scores = sim_scores / (self.cf_model.user_norms * norm_u)
            sim_scores[user_idx] = 0.0
            top_neighbors = np.argsort(-sim_scores)[:self.cf_model.k_neighbors]
            neighbor_sims = sim_scores[top_neighbors]
            neighbor_matrix = self.cf_model.train_matrix[top_neighbors]
            cf_scores = neighbor_matrix.T.dot(neighbor_sims)
            if hasattr(cf_scores, "toarray"):
                cf_scores = cf_scores.toarray().ravel()
            else:
                cf_scores = np.asarray(cf_scores).ravel()
            if cf_scores.max() > cf_scores.min():
                cf_scores = (cf_scores - cf_scores.min()) / (cf_scores.max() - cf_scores.min() + 1e-9)
        else:
            cf_scores = np.zeros(len(self.product_ids))
            
        hybrid_scores = self.cb_weight * cb_scores + self.cf_weight * cf_scores
        top_indices = np.argsort(-hybrid_scores)[:top_k]
        return [self.product_ids[i] for i in top_indices]

def compute_ndcg_at_k(recommended, ground_truth, k):
    """Compute Normalized Discounted Cumulative Gain at rank K."""
    dcg = 0.0
    for rank, item in enumerate(recommended[:k]):
        if item in ground_truth:
            dcg += 1.0 / np.log2(rank + 2)
    idcg = sum([1.0 / np.log2(r + 2) for r in range(min(k, len(ground_truth)))])
    return dcg / (idcg + 1e-9)

def evaluate_recommender(model, train_matrix, test_ground_truth, user_ids, product_ids, k_values=[5, 10], max_eval_users=100):
    """
    Evaluate ranking metrics across users with future holdout purchases.
    Uses a deterministic stratified cohort of evaluation users for reproducibility.
    """
    metrics = {f"P@{k}": [] for k in k_values}
    metrics.update({f"R@{k}": [] for k in k_values})
    metrics.update({f"F1@{k}": [] for k in k_values})
    metrics.update({f"NDCG@{k}": [] for k in k_values})
    metrics.update({f"HitRate@{k}": [] for k in k_values})
    
    # Filter users who have holdout ground truth items
    valid_users = [u_idx for u_idx, uid in enumerate(user_ids) if len(test_ground_truth.get(uid, set())) > 0]
    
    # Stratified cohort of evaluation users
    np.random.seed(RANDOM_SEED)
    if len(valid_users) > max_eval_users:
        eval_indices = np.random.choice(valid_users, size=max_eval_users, replace=False)
    else:
        eval_indices = valid_users
        
    for u_idx in eval_indices:
        uid = user_ids[u_idx]
        gt_items = test_ground_truth.get(uid, set())
        train_row = train_matrix[u_idx]
        
        for k in k_values:
            recs = model.recommend(u_idx, top_k=k, train_row=train_row)
            rec_set = set(recs)
            hits = len(rec_set.intersection(gt_items))
            
            p_k = hits / k
            r_k = hits / len(gt_items)
            f1_k = (2 * p_k * r_k) / (p_k + r_k) if (p_k + r_k) > 0 else 0.0
            hit_k = 1.0 if hits > 0 else 0.0
            ndcg_k = compute_ndcg_at_k(recs, gt_items, k)
            
            metrics[f"P@{k}"].append(p_k)
            metrics[f"R@{k}"].append(r_k)
            metrics[f"F1@{k}"].append(f1_k)
            metrics[f"NDCG@{k}"].append(ndcg_k)
            metrics[f"HitRate@{k}"].append(hit_k)
            
    summary = {}
    for key, values in metrics.items():
        summary[key] = float(np.mean(values)) if len(values) > 0 else 0.0
    summary["num_eval_users"] = len(eval_indices)
    return summary

def run_recommendation_experiment():
    print("=" * 60)
    print("  >> RUNNING MODULE 1: PERSONALIZED RECOMMENDATION EXPERIMENT")
    print("=" * 60)
    
    train_matrix, test_ground_truth, user_ids, product_ids, interactions_df, products_df = load_recommendation_dataset()
    print(f"Loaded Interaction Matrix: {len(user_ids)} users x {len(product_ids)} products")
    print(f"Strict Temporal Split: 80% train interactions | 20% test interactions")
    
    # Instantiate models
    models = {
        "Popularity Baseline": PopularityRecommender().fit(train_matrix, product_ids),
        "Content-Based (TF-IDF)": ContentBasedRecommender().fit(products_df, product_ids),
        "Collaborative Filtering (User-User)": UserUserCollaborativeFiltering().fit(train_matrix, product_ids),
        "Matrix Factorization (SVD)": SVDMatrixFactorizationRecommender().fit(train_matrix, product_ids),
        "Hybrid Ensemble (CF + CB)": HybridRecommender().fit(train_matrix, products_df, product_ids),
    }
    
    results = {}
    print("\nEvaluating Candidate Recommendation Models (K = 5, 10):")
    print("-" * 75)
    print(f"{'Model Name':<35} | {'P@5':<6} {'R@5':<6} {'F1@5':<6} | {'P@10':<6} {'R@10':<6} {'F1@10':<6}")
    print("-" * 75)
    
    for name, model in models.items():
        metrics = evaluate_recommender(model, train_matrix, test_ground_truth, user_ids, product_ids, k_values=[5, 10])
        results[name] = metrics
        print(f"{name:<35} | {metrics['P@5']:.4f} {metrics['R@5']:.4f} {metrics['F1@5']:.4f} | {metrics['P@10']:.4f} {metrics['R@10']:.4f} {metrics['F1@10']:.4f}")
    print("-" * 75)
    
    # Save Metrics JSON
    metrics_path = METRICS_DIR / "recommendation_metrics.json"
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\nSaved evaluation metrics to: {metrics_path}")
    
    # Determine best model by F1@10
    best_name = max(results.keys(), key=lambda k: results[k]["F1@10"])
    best_f1 = results[best_name]["F1@10"]
    best_model = models[best_name]
    print(f"[BEST] Top Recommendation Model: '{best_name}' (F1@10 = {best_f1:.4f})")
    
    # Save best model artifact
    model_save_path = MODELS_DIR / "best_recommendation_model.joblib"
    joblib.dump(best_model, model_save_path)
    
    metadata = {
        "model_name": best_name,
        "f1_at_10": best_f1,
        "metrics": results[best_name],
        "algorithm_family": "Ensemble / Content / Collaborative",
        "parameters": RECOMMENDATION_CONFIG,
    }
    with open(MODELS_DIR / "best_recommendation_model.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved model artifact and metadata to: {model_save_path}")
    
    # Generate Comparison Plot
    plot_path = PLOTS_DIR / "recommendation_model_comparison.png"
    fig, ax = plt.subplots(figsize=(10, 6))
    
    model_names = list(results.keys())
    x = np.arange(len(model_names))
    width = 0.25
    
    p10_vals = [results[m]["P@10"] for m in model_names]
    r10_vals = [results[m]["R@10"] for m in model_names]
    f1_vals = [results[m]["F1@10"] for m in model_names]
    
    ax.bar(x - width, p10_vals, width, label="Precision@10", color="#3b82f6", alpha=0.9)
    ax.bar(x, r10_vals, width, label="Recall@10", color="#10b981", alpha=0.9)
    ax.bar(x + width, f1_vals, width, label="F1-Score@10", color="#f59e0b", alpha=0.9)
    
    ax.set_title("Personalized Recommendation: Top-10 Model Benchmarks (Temporal Split)")
    ax.set_ylabel("Score (0.0 to 1.0)")
    ax.set_xticks(x)
    ax.set_xticklabels(model_names, rotation=20, ha="right")
    ax.legend()
    ax.grid(True, linestyle="--", alpha=0.5, axis="y")
    
    plt.tight_layout()
    plt.savefig(plot_path, dpi=300)
    plt.close()
    print(f"Saved recommendation comparison plot to: {plot_path}")
    
    return results

if __name__ == "__main__":
    run_recommendation_experiment()
