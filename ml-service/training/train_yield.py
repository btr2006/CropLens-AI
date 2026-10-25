import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def main():
    print("=" * 60)
    print("CropGuard AI - Yield Prediction Model Training")
    print("AI-Based Multi-Crop Disease Severity & Yield-Risk Prediction")
    print("=" * 60)

    # 1. Resolve dataset and output paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, "..", ".."))

    dataset_path = os.path.join(
        project_root, "datasets", "yield", "data", "Crop Yiled with Soil and Weather.csv"
    )
    models_dir = os.path.join(project_root, "ml-service", "models")
    os.makedirs(models_dir, exist_ok=True)

    model_save_path = os.path.join(models_dir, "yield_model.pkl")
    features_save_path = os.path.join(models_dir, "yield_features.json")

    print(f"\n[1] Loading dataset from:\n    {dataset_path}")
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset not found at: {dataset_path}")

    df = pd.read_csv(dataset_path)
    print(f"    Initial dataset shape: {df.shape[0]} rows, {df.shape[1]} columns")

    # 2. Define Features and Target
    feature_cols = ["Fertilizer", "temp", "N", "P", "K"]
    target_col = "yeild"

    print(f"\n[2] Features: {feature_cols}")
    print(f"    Target: '{target_col}'")

    # Ensure required columns exist
    missing_cols = [col for col in feature_cols + [target_col] if col not in df.columns]
    if missing_cols:
        raise KeyError(f"Columns not found in dataset: {missing_cols}")

    # 3. Convert to numeric and check missing values
    for col in feature_cols + [target_col]:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    print("\n[3] Checking missing values:")
    missing_counts = df[feature_cols + [target_col]].isnull().sum()
    for col, count in missing_counts.items():
        print(f"    - {col}: {count} missing")

    initial_rows = len(df)
    df = df.dropna(subset=feature_cols + [target_col])
    dropped_rows = initial_rows - len(df)
    if dropped_rows > 0:
        print(f"    Dropped {dropped_rows} rows containing missing values.")
    print(f"    Clean dataset shape: {df.shape[0]} rows")

    X = df[feature_cols]
    y = df[target_col]

    # 4. Train-Test Split
    print("\n[4] Splitting dataset into train and test sets (80/20 split, random_state=42)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"    Train size: {len(X_train)} samples")
    print(f"    Test size:  {len(X_test)} samples")

    # 5. Train Random Forest Regressor
    print("\n[5] Training RandomForestRegressor (random_state=42)...")
    model = RandomForestRegressor(random_state=42)
    model.fit(X_train, y_train)
    print("    Model training completed successfully.")

    # 6. Evaluate Model Performance
    print("\n[6] Evaluating model on test set...")
    y_pred = model.predict(X_test)

    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    print("\n" + "-" * 40)
    print("        TEST SET EVALUATION METRICS")
    print("-" * 40)
    print(f"  Mean Absolute Error (MAE) : {mae:.4f}")
    print(f"  Root Mean Squared Error   : {rmse:.4f}")
    print(f"  R^2 Score (Variance Exp.) : {r2:.4f} ({r2 * 100:.2f}%)")
    print("-" * 40)

    # 7. Save Model & Features
    print(f"\n[7] Saving trained model to:\n    {model_save_path}")
    joblib.dump(model, model_save_path)

    print(f"\n[8] Saving feature order to:\n    {features_save_path}")
    with open(features_save_path, "w", encoding="utf-8") as f:
        json.dump(feature_cols, f, indent=2)

    print("\n[SUCCESS] Training and export process completed successfully.")
    print("=" * 60)

if __name__ == "__main__":
    main()
