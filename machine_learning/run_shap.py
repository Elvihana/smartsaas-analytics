# ============================================================
# SHAP ANALYSIS FOR CHURN PREDICTION MODEL
# ============================================================
# Membuat Explainable AI menggunakan SHAP:
# - Summary Plot (Beeswarm)
# - Waterfall Plot
# - Feature Importance Bar Plot
# - Output: shap_explainer.pkl
# ============================================================

import pandas as pd
import numpy as np
import joblib
import shap
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for saving plots
import matplotlib.pyplot as plt
import os
import warnings
warnings.filterwarnings('ignore')

os.chdir(os.path.dirname(os.path.abspath(__file__)))
print(f"SHAP version: {shap.__version__}")

# ============================================================
# LOAD MODEL, PREPROCESSOR, AND DATA
# ============================================================
print("\n" + "=" * 60)
print("LOADING MODEL & DATA")
print("=" * 60)

# Load model
model_pipeline = joblib.load('../backend/trained_models/churn_model.pkl')
print(f"Model type: {type(model_pipeline)}")

# Extract XGBoost classifier from pipeline (skip SMOTE for SHAP)
xgb_model = model_pipeline.named_steps['xgb']
print(f"XGBoost model: {xgb_model}")

# Load preprocessor
preprocess = joblib.load('../backend/trained_models/preprocess.pkl')
feature_cols = preprocess['feature_cols']
print(f"Number of features: {len(feature_cols)}")

# Load processed (scaled) data
X_scaled = pd.read_pickle('data/X_features.pkl')
y = pd.read_pickle('data/y_target.pkl')
print(f"X shape: {X_scaled.shape}")
print(f"y distribution: {y.value_counts().to_dict()}")

# Ensure column names match
X_scaled.columns = feature_cols

# ============================================================
# CREATE SHAP EXPLAINER
# ============================================================
print("\n" + "=" * 60)
print("CREATING SHAP EXPLAINER")
print("=" * 60)

# Use TreeExplainer for XGBoost
print("Initializing TreeExplainer...")
explainer = shap.TreeExplainer(xgb_model)
print(f"Explainer type: {type(explainer)}")
print(f"Expected value: {explainer.expected_value}")

# Calculate SHAP values for a subset of the dataset
N = min(500, len(X_scaled))
X_sample = X_scaled.sample(n=N, random_state=42) if N < len(X_scaled) else X_scaled
y_sample = y.loc[X_sample.index]

print(f"Computing SHAP values for {len(X_sample)} samples...")
shap_values = explainer.shap_values(X_sample)
print(f"SHAP values shape: {shap_values.shape}")

# Save explainer
shap_explainer = {
    'explainer': explainer,
    'shap_values': shap_values,
    'X_sample': X_sample,
    'feature_cols': feature_cols
}
joblib.dump(shap_explainer, '../backend/trained_models/shap_explainer.pkl')
print("✅ shap_explainer.pkl saved!")

# ============================================================
# SUMMARY PLOT (Beeswarm)
# ============================================================
print("\n" + "=" * 60)
print("SUMMARY PLOT")
print("=" * 60)

plt.figure(figsize=(14, 10))
shap.summary_plot(
    shap_values, X_sample,
    feature_names=feature_cols,
    show=False,
    plot_type='dot'
)
plt.title('SHAP Summary Plot - Feature Impact on Churn Prediction', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('output/shap_summary_plot.png', dpi=150, bbox_inches='tight')
plt.close()
print("✅ shap_summary_plot.png saved")

# ============================================================
# FEATURE IMPORTANCE BAR PLOT (Mean |SHAP Value|)
# ============================================================
print("\n" + "=" * 60)
print("FEATURE IMPORTANCE BAR PLOT")
print("=" * 60)

plt.figure(figsize=(14, 12))
shap.summary_plot(
    shap_values, X_sample,
    feature_names=feature_cols,
    plot_type='bar',
    show=False
)
plt.title('SHAP Feature Importance (Mean |SHAP Value|)', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('output/shap_feature_importance.png', dpi=150, bbox_inches='tight')
plt.close()
print("✅ shap_feature_importance.png saved")

# ============================================================
# WATERFALL PLOT (for individual predictions)
# ============================================================
print("\n" + "=" * 60)
print("WATERFALL PLOTS")
print("=" * 60)

# Get churn probabilities for all customers
y_prob = model_pipeline.predict_proba(X_scaled)[:, 1]
high_churn_idx = np.argsort(y_prob)[::-1][:5]  # Top 5 highest churn probability
low_churn_idx = np.argsort(y_prob)[:5]  # Top 5 lowest churn probability

print(f"\nTop 5 highest churn probability indices: {high_churn_idx}")
print(f"Top 5 lowest churn probability indices: {low_churn_idx}")

sample_indices = X_sample.index.tolist()

# Waterfall for a high churn customer (if in sample)
for idx_name, label in [(high_churn_idx[0], 'High Churn Risk'), (low_churn_idx[0], 'Low Churn Risk')]:
    if idx_name in sample_indices:
        sample_pos = sample_indices.index(idx_name)
        print(f"\n--- Waterfall Plot: {label} (index={idx_name}) ---")
        
        plt.figure(figsize=(14, 8))
        shap.waterfall_plot(
            shap.Explanation(
                values=shap_values[sample_pos],
                base_values=explainer.expected_value,
                data=X_sample.iloc[sample_pos].values,
                feature_names=feature_cols
            ),
            show=False,
            max_display=15
        )
        plt.title(f'SHAP Waterfall Plot - {label}', fontsize=14, fontweight='bold')
        plt.tight_layout()
        fname = f'output/shap_waterfall_{label.lower().replace(" ", "_")}.png'
        plt.savefig(fname, dpi=150, bbox_inches='tight')
        plt.close()
        print(f"✅ {fname} saved")
    else:
        print(f"Index {idx_name} not in sample, computing SHAP for this specific sample...")
        single_shap = explainer.shap_values(X_scaled.iloc[[idx_name]])
        plt.figure(figsize=(14, 8))
        shap.waterfall_plot(
            shap.Explanation(
                values=single_shap[0],
                base_values=explainer.expected_value,
                data=X_scaled.iloc[idx_name].values,
                feature_names=feature_cols
            ),
            show=False,
            max_display=15
        )
        plt.title(f'SHAP Waterfall Plot - {label} (Customer #{idx_name})', fontsize=14, fontweight='bold')
        plt.tight_layout()
        fname = f'output/shap_waterfall_{label.lower().replace(" ", "_")}.png'
        plt.savefig(fname, dpi=150, bbox_inches='tight')
        plt.close()
        print(f"✅ {fname} saved")

# ============================================================
# VERIFICATION
# ============================================================
print("\n" + "=" * 60)
print("VERIFICATION")
print("=" * 60)

# Verify saved explainer
loaded = joblib.load('../backend/trained_models/shap_explainer.pkl')
print(f"Loaded explainer keys: {list(loaded.keys())}")
print(f"SHAP values shape: {loaded['shap_values'].shape}")
print(f"Sample size: {len(loaded['X_sample'])}")

# Verify images exist
output_files = os.listdir('output')
print(f"\nOutput files in output/:")
for f in sorted(output_files):
    if f.startswith('shap_'):
        fsize = os.path.getsize(f'output/{f}')
        print(f"  - {f} ({fsize/1024:.1f} KB)")

print("\n" + "=" * 60)
print("✅ SHAP ANALYSIS COMPLETE!")
print("=" * 60)