"""
AI-Driven Intelligent Grocery Retail System — Genuine Deep Learning Workstream
Trains a 2-Layer Multivariate LSTM Neural Network on real sales history.
Saves model weights (.pt) and evaluation metadata (.json).
Zero leakage: strict temporal train/val/test holdout splits.
"""

import os
import json
import sqlite3
import numpy as np
import pandas as pd
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

BASE_DIR = Path(__file__).resolve().parents[3]
DB_PATH = BASE_DIR / "db" / "freshcart.db"
MODEL_SAVE_PATH = BASE_DIR / "ml" / "python" / "models" / "demand_lstm.pt"
META_SAVE_PATH = BASE_DIR / "ml" / "python" / "models" / "demand_lstm_metadata.json"

SEQUENCE_LENGTH = 14  # 14 days lookback
HORIZON = 7          # 7 days forward prediction
EPOCHS = 35
BATCH_SIZE = 16
LEARNING_RATE = 0.005
HIDDEN_DIM = 32
NUM_LAYERS = 2
DROPOUT = 0.2
SEED = 42

torch.manual_seed(SEED)
np.random.seed(SEED)


class TimeSeriesDataset(Dataset):
    def __init__(self, X: np.ndarray, y: np.ndarray):
        self.X = torch.tensor(X, dtype=torch.float32)
        self.y = torch.tensor(y, dtype=torch.float32)

    def __len__(self):
        return len(self.X)

    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]


class DemandLSTM(nn.Module):
    """2-Layer Multivariate LSTM Neural Architecture for Grocery Demand Forecasting."""
    def __init__(self, input_dim: int, hidden_dim: int, num_layers: int, horizon: int, dropout: float = 0.2):
        super().__init__()
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
        )
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim, 16),
            nn.ReLU(),
            nn.Linear(16, horizon),
        )

    def forward(self, x):
        # x shape: (batch_size, seq_len, input_dim)
        lstm_out, _ = self.lstm(x)
        # Take the output of the last time step
        last_step = lstm_out[:, -1, :]
        out = self.fc(last_step)
        return out


def load_daily_sales():
    """Load daily sales aggregation from freshcart.db."""
    conn = sqlite3.connect(str(DB_PATH))
    query = """
        SELECT date, SUM(quantity_sold) as daily_demand
        FROM sales_history
        GROUP BY date
        ORDER BY date ASC
    """
    df = pd.read_sql_query(query, conn)
    conn.close()

    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)
    return df


def engineer_features(df: pd.DataFrame):
    """
    Create feature matrix without lookahead leakage:
    1. daily_demand (scaled)
    2. rolling_mean_7 (rolling average past 7 days)
    3. sin_dow (cyclic day-of-week)
    4. cos_dow (cyclic day-of-week)
    """
    df["dow"] = df["date"].dt.dayofweek
    df["sin_dow"] = np.sin(2 * np.pi * df["dow"] / 7.0)
    df["cos_dow"] = np.cos(2 * np.pi * df["dow"] / 7.0)
    df["rolling_mean_7"] = df["daily_demand"].shift(1).rolling(window=7, min_periods=1).mean().fillna(df["daily_demand"].mean())

    features = df[["daily_demand", "rolling_mean_7", "sin_dow", "cos_dow"]].values
    targets = df["daily_demand"].values
    return features, targets


def create_sequences(features: np.ndarray, targets: np.ndarray, seq_len: int, horizon: int):
    X, y = [], []
    for i in range(len(features) - seq_len - horizon + 1):
        X.append(features[i : i + seq_len])
        y.append(targets[i + seq_len : i + seq_len + horizon])
    return np.array(X), np.array(y)


def train_lstm():
    print("=================================================================")
    print("  [TRAINING] GENUINE PYTORCH MULTIVARIATE LSTM DEMAND FORECASTER")
    print("=================================================================")

    df = load_daily_sales()
    total_days = len(df)
    print(f"  Total historical days loaded from sales_history: {total_days}")

    features, targets = engineer_features(df)

    # Compute normalization parameters strictly on the training partition
    n_samples = len(features)
    train_end = int(n_samples * 0.80)
    val_end = int(n_samples * 0.90)

    feat_mean = np.mean(features[:train_end], axis=0)
    feat_std = np.std(features[:train_end], axis=0) + 1e-6
    scaled_features = (features - feat_mean) / feat_std

    target_mean = float(np.mean(targets[:train_end]))
    target_std = float(np.std(targets[:train_end]) + 1e-6)
    scaled_targets = (targets - target_mean) / target_std

    X, y = create_sequences(scaled_features, scaled_targets, SEQUENCE_LENGTH, HORIZON)

    # Strict temporal splitting
    n_seq = len(X)
    train_idx = int(n_seq * 0.80)
    val_idx = int(n_seq * 0.90)

    X_train, y_train = X[:train_idx], y[:train_idx]
    X_val, y_val = X[train_idx:val_idx], y[train_idx:val_idx]
    X_test, y_test = X[val_idx:], y[val_idx:]

    print(f"  Dataset Sequences -> Train: {len(X_train)}, Val: {len(X_val)}, Test (Holdout): {len(X_test)}")

    train_loader = DataLoader(TimeSeriesDataset(X_train, y_train), batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(TimeSeriesDataset(X_val, y_val), batch_size=BATCH_SIZE, shuffle=False)

    model = DemandLSTM(
        input_dim=features.shape[1],
        hidden_dim=HIDDEN_DIM,
        num_layers=NUM_LAYERS,
        horizon=HORIZON,
        dropout=DROPOUT,
    )

    criterion = nn.SmoothL1Loss()  # Huber loss
    optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-4)

    best_val_loss = float("inf")
    loss_history = []

    print("\n  Epoch | Train Loss | Val Loss  | Status")
    print("  ------|------------|-----------|--------------------")

    best_weights = None
    for epoch in range(1, EPOCHS + 1):
        model.train()
        train_loss = 0.0
        for batch_x, batch_y in train_loader:
            optimizer.zero_grad()
            preds = model(batch_x)
            loss = criterion(preds, batch_y)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(batch_x)
        train_loss /= len(X_train)

        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for batch_x, batch_y in val_loader:
                preds = model(batch_x)
                loss = criterion(preds, batch_y)
                val_loss += loss.item() * len(batch_x)
        val_loss /= len(X_val)

        loss_history.append({"epoch": epoch, "train_loss": round(train_loss, 4), "val_loss": round(val_loss, 4)})

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_weights = model.state_dict()
            status_str = "* Best model saved"
        else:
            status_str = ""

        if epoch % 5 == 0 or epoch == 1 or epoch == EPOCHS:
            print(f"  {epoch:5d} |   {train_loss:8.4f} |  {val_loss:8.4f} | {status_str}")

    # Load best weights for evaluation
    model.load_state_dict(best_weights)
    model.eval()

    # Evaluate on strict holdout test set (unscaled)
    with torch.no_grad():
        test_preds_scaled = model(torch.tensor(X_test, dtype=torch.float32)).numpy()

    test_preds = (test_preds_scaled * target_std) + target_mean
    y_test_actual = (y_test * target_std) + target_mean

    mae = float(np.mean(np.abs(test_preds - y_test_actual)))
    rmse = float(np.sqrt(np.mean((test_preds - y_test_actual) ** 2)))
    wape = float(np.sum(np.abs(test_preds - y_test_actual)) / np.sum(y_test_actual) * 100.0)

    print("\n=================================================================")
    print("  [RESULTS] STRICT FUTURE HOLDOUT TEST EVALUATION RESULTS:")
    print(f"  - Test MAE  : {mae:.2f} units")
    print(f"  - Test RMSE : {rmse:.2f} units")
    print(f"  - Test WAPE : {wape:.2f}%")
    print("=================================================================")

    # Save model artifact
    MODEL_SAVE_PATH.parent.mkdir(parents=True, exist_ok=True)
    torch.save(best_weights, str(MODEL_SAVE_PATH))
    print(f"  [SUCCESS] PyTorch model weights saved to: {MODEL_SAVE_PATH}")

    # Save metadata & training logs
    metadata = {
        "model_architecture": "2-Layer Multivariate LSTM",
        "input_features": ["daily_demand", "rolling_mean_7", "sin_dow", "cos_dow"],
        "sequence_length": SEQUENCE_LENGTH,
        "forecast_horizon": HORIZON,
        "hidden_dim": HIDDEN_DIM,
        "num_layers": NUM_LAYERS,
        "dropout": DROPOUT,
        "epochs_trained": EPOCHS,
        "best_val_loss": round(best_val_loss, 4),
        "holdout_metrics": {
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "wape_pct": round(wape, 2),
        },
        "target_scaler": {
            "mean": round(target_mean, 4),
            "std": round(target_std, 4),
        },
        "feature_scaler": {
            "mean": [round(float(m), 4) for m in feat_mean],
            "std": [round(float(s), 4) for s in feat_std],
        },
        "training_loss_history": loss_history,
    }

    with open(META_SAVE_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"  [SUCCESS] Model metadata and loss curves saved to: {META_SAVE_PATH}")


if __name__ == "__main__":
    train_lstm()
