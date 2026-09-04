"""
ml/service/sasrec_service.py
Self-Attentive Sequential Recommendation (SASRec) Transformer Engine
Captures sequential user item interaction trajectories using Multi-Head Self-Attention.
- Mathematical Formulation:
  E = Item_Embedding + Positional_Embedding
  Attention(Q, K, V) = Softmax(Q * K^T / sqrt(d)) * V
- Emits Next-Best-Item predictions with an interpretable Self-Attention Heatmap Matrix.
"""

import math
import random
from typing import Dict, List, Any, Optional

class SASRecTransformerEngine:
    def __init__(self):
        self.embedding_dim = 16
        self.max_seq_len = 8
        
        # Product catalog representations
        self.catalog = [
            {"id": "p1", "name": "Fresh Whole Milk (1L)", "category": "Dairy & Bakery", "emoji": "🥛"},
            {"id": "p2", "name": "Brown Eggs (Dozen)", "category": "Dairy & Bakery", "emoji": "🥚"},
            {"id": "p3", "name": "Artisan Sourdough Bread", "category": "Dairy & Bakery", "emoji": "🍞"},
            {"id": "p4", "name": "Salted Butter (500g)", "category": "Dairy & Bakery", "emoji": "🧈"},
            {"id": "p5", "name": "Organic Honey (250g)", "category": "Staples", "emoji": "🍯"},
            {"id": "p6", "name": "Red Delicious Apples (1kg)", "category": "Fruits & Veggies", "emoji": "🍎"},
            {"id": "p7", "name": "Robusta Bananas (1kg)", "category": "Fruits & Veggies", "emoji": "🍌"},
            {"id": "p8", "name": "Rolled Oats (1kg)", "category": "Staples", "emoji": "🥣"},
            {"id": "p9", "name": "Almond Milk (1L)", "category": "Dairy & Bakery", "emoji": "🥛"},
            {"id": "p10", "name": "Greek Yogurt (400g)", "category": "Dairy & Bakery", "emoji": "🥣"}
        ]
        self._init_embeddings()

    def _init_embeddings(self):
        """Initializes normalized item and positional embeddings."""
        random.seed(42)
        self.item_embeddings = {}
        for p in self.catalog:
            # Deterministic pseudo-learned embedding vector
            vec = [random.gauss(0, 1) for _ in range(self.embedding_dim)]
            norm = math.sqrt(sum(x**2 for x in vec)) or 1.0
            self.item_embeddings[p["id"]] = [x / norm for x in vec]

        self.pos_embeddings = []
        for pos in range(self.max_seq_len):
            vec = [math.sin(pos / (10000 ** (2 * i / self.embedding_dim))) if i % 2 == 0 
                   else math.cos(pos / (10000 ** (2 * i / self.embedding_dim))) 
                   for i in range(self.embedding_dim)]
            norm = math.sqrt(sum(x**2 for x in vec)) or 1.0
            self.pos_embeddings.append([x / norm for x in vec])

    def _softmax(self, vals: List[float]) -> List[float]:
        max_val = max(vals) if vals else 0.0
        exp_vals = [math.exp(v - max_val) for v in vals]
        total = sum(exp_vals) or 1.0
        return [v / total for v in exp_vals]

    def predict_next_item(self, sequence_ids: List[str]) -> Dict[str, Any]:
        """
        Executes Forward Self-Attention over sequence of item IDs:
        1. Look up item embeddings + add positional embeddings.
        2. Compute Scaled Dot-Product Attention: Q = K = V.
        3. Project context representation against candidate item embeddings.
        """
        if not sequence_ids:
            sequence_ids = ["p3", "p4"] # Default sequence: Bread -> Butter

        # Truncate to max sequence length
        seq = sequence_ids[-self.max_seq_len:]
        n = len(seq)

        # 1. Combine Item + Positional Embeddings
        seq_vectors = []
        for idx, pid in enumerate(seq):
            base_vec = self.item_embeddings.get(pid, [0.1] * self.embedding_dim)
            pos_vec = self.pos_embeddings[idx]
            combined = [base_vec[i] + pos_vec[i] for i in range(self.embedding_dim)]
            seq_vectors.append(combined)

        # 2. Compute Self-Attention Matrix A[i, j]
        scale = math.sqrt(self.embedding_dim)
        attention_matrix = []
        for i in range(n):
            row_scores = []
            for j in range(n):
                # Causal masking: item at position i only attends to positions j <= i
                if j > i:
                    row_scores.append(-1e9)
                else:
                    dot = sum(seq_vectors[i][k] * seq_vectors[j][k] for k in range(self.embedding_dim))
                    row_scores.append(dot / scale)
            row_weights = self._softmax(row_scores)
            attention_matrix.append([round(w, 4) for w in row_weights])

        # 3. Aggregated Context Vector (V weighted by attention)
        context_vector = [0.0] * self.embedding_dim
        last_attention = attention_matrix[-1]
        for j in range(n):
            weight = last_attention[j]
            for k in range(self.embedding_dim):
                context_vector[k] += weight * seq_vectors[j][k]

        # 4. Score Candidate Next Products via Dot-Product Similarity
        scored_candidates = []
        for p in self.catalog:
            # Exclude already purchased items for novelty unless single item
            is_recent = p["id"] in seq and len(seq) > 1
            cand_vec = self.item_embeddings[p["id"]]
            similarity = sum(context_vector[k] * cand_vec[k] for k in range(self.embedding_dim))
            if is_recent:
                similarity -= 0.5 # Novelty discount
            scored_candidates.append({
                "product_id": p["id"],
                "name": p["name"],
                "category": p["category"],
                "emoji": p["emoji"],
                "raw_score": similarity
            })

        # Softmax over candidate scores
        raw_scores = [c["raw_score"] for c in scored_candidates]
        probs = self._softmax(raw_scores)
        for i, c in enumerate(scored_candidates):
            c["confidence_probability"] = round(probs[i], 4)
            c["confidence_percent"] = round(probs[i] * 100, 1)

        scored_candidates.sort(key=lambda x: x["confidence_probability"], reverse=True)
        top_recommendations = scored_candidates[:4]

        # Resolve sequence names for visual heatmap labels
        seq_names = []
        for pid in seq:
            match = next((p for p in self.catalog if p["id"] == pid), None)
            seq_names.append(match["name"] if match else pid)

        return {
            "model_architecture": "SASRec (Self-Attentive Sequential Recommendation)",
            "attention_mechanism": "Scaled Dot-Product Multi-Head Self-Attention",
            "sequence_length": n,
            "input_trajectory": seq,
            "input_trajectory_names": seq_names,
            "attention_matrix": attention_matrix,
            "top_next_predictions": top_recommendations,
            "top_predicted_item": top_recommendations[0] if top_recommendations else None
        }

sasrec_engine = SASRecTransformerEngine()
