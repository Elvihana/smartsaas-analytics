import pandas as pd
import numpy as np
import os, sys, joblib, json
import warnings
warnings.filterwarnings('ignore')

os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("CHURN PREDICTION PIPELINE")
print("=" * 60)

# ============================================================
# STEP 2: FEATURE ENGINEERING
# ============================================================
print("\n[1/2] Running Feature Engineering...")

# Load all datasets
customers = pd.read_csv('data/customers.csv')
subscriptions = pd.read_csv('data/subscriptions.csv')
sub_events = pd.read_csv('data/subscription_events.csv')
tickets = pd.read_csv('data/support_tickets.csv')
activity = pd.read_csv('data/activity_metrics.csv')

# Target
customers['is_churned'] = (customers['status'] == 'inactive').astype(int)

# Demographics features
from sklearn.preprocessing import LabelEncoder, StandardScaler
categorical_cols = ['industry', 'country']
label_encoders = {}
for col in categorical_cols:
    le = LabelEncoder()
    customers[col + '_encoded'] = le.fit_transform(customers[col].fillna('Unknown'))
    label_encoders[col] = le

customers['company_size_log'] = np.log1p(customers['company_size'].fillna(0))
customers['created_at'] = pd.to_datetime(customers['created_at'])
customers['tenure_days'] = (pd.Timestamp.now() - customers['created_at']).dt.days.astype(int)

# Subscription features
cust = customers.copy()
subscriptions['renewal_date'] = pd.to_datetime(subscriptions['renewal_date'])
subscriptions['start_date'] = pd.to_datetime(subscriptions['start_date'])
sub_latest = subscriptions.sort_values('renewal_date', ascending=False).drop_duplicates('customer_id')

# Merge subscription data - use id from customers with customer_id from subscriptions
cust = cust.merge(
    sub_latest[['customer_id', 'plan_name', 'monthly_price', 'start_date', 'renewal_date']],
    left_on='id', right_on='customer_id', how='left'
)
# Drop duplicate customer_id column from right side
cust = cust.drop(columns=['customer_id_y'], errors='ignore')
cust = cust.rename(columns={'customer_id_x': 'customer_id'})

le_plan = LabelEncoder()
cust['plan_name_encoded'] = le_plan.fit_transform(cust['plan_name'].fillna('Unknown').astype(str))
label_encoders['plan_name'] = le_plan

cust['monthly_price'] = cust['monthly_price'].fillna(cust['monthly_price'].median())
cust['days_to_renewal'] = (cust['renewal_date'] - pd.Timestamp.now()).dt.days.fillna(-1).astype(int)
cust['days_since_start'] = (pd.Timestamp.now() - cust['start_date']).dt.days.fillna(-1).astype(int)
cust['subscription_length_days'] = (cust['renewal_date'] - cust['start_date']).dt.days
median_length = cust['subscription_length_days'].median()
cust['subscription_length_days'] = cust['subscription_length_days'].fillna(median_length).astype(int)

# Subscription events
event_features = sub_events.groupby('customer_id').agg(
    total_events=('event_type', 'count'),
    n_upgrades=('event_type', lambda x: (x == 'upgrade').sum()),
    n_downgrades=('event_type', lambda x: (x == 'downgrade').sum()),
    n_cancellations=('event_type', lambda x: (x == 'cancellation').sum())
).reset_index()

cust = cust.merge(event_features, on='customer_id', how='left')
event_cols = ['total_events', 'n_upgrades', 'n_downgrades', 'n_cancellations']
for col in event_cols:
    cust[col] = cust[col].fillna(0).astype(int)

cust['upgrade_ratio'] = cust['n_upgrades'] / (cust['total_events'] + 1)
cust['downgrade_ratio'] = cust['n_downgrades'] / (cust['total_events'] + 1)
cust['has_downgraded'] = (cust['n_downgrades'] > 0).astype(int)

# Support tickets
tickets['created_at'] = pd.to_datetime(tickets['created_at'])
tickets['resolved_at'] = pd.to_datetime(tickets['resolved_at'])
tickets['resolution_hours'] = (tickets['resolved_at'] - tickets['created_at']).dt.total_seconds() / 3600

ticket_features = tickets.groupby('customer_id').agg(
    ticket_count=('id', 'count'),
    high_priority=('priority', lambda x: (x == 'High').sum()),
    urgent_priority=('priority', lambda x: (x == 'Urgent').sum()),
    open_tickets=('status', lambda x: (x != 'Closed').sum()),
    closed_tickets=('status', lambda x: (x == 'Closed').sum()),
    tech_issues=('category', lambda x: (x == 'Technical Issue').sum()),
    billing_issues=('category', lambda x: (x == 'Billing').sum()),
    avg_resolution_hours=('resolution_hours', 'mean'),
    max_resolution_hours=('resolution_hours', 'max')
).reset_index()

cust = cust.merge(ticket_features, on='customer_id', how='left')
ticket_cols = ['ticket_count', 'high_priority', 'urgent_priority', 'open_tickets', 
               'closed_tickets', 'tech_issues', 'billing_issues', 
               'avg_resolution_hours', 'max_resolution_hours']
for col in ticket_cols:
    cust[col] = cust[col].fillna(0)

cust['high_priority_ratio'] = cust['high_priority'] / (cust['ticket_count'] + 1)
cust['tech_issue_ratio'] = cust['tech_issues'] / (cust['ticket_count'] + 1)
cust['billing_issue_ratio'] = cust['billing_issues'] / (cust['ticket_count'] + 1)
cust['has_open_tickets'] = (cust['open_tickets'] > 0).astype(int)

# Activity metrics
activity['metric_date'] = pd.to_datetime(activity['metric_date'])
activity['last_active_date'] = activity.groupby('customer_id')['metric_date'].transform('max')
activity['days_since_last_active'] = (pd.Timestamp.now() - activity['last_active_date']).dt.days

activity_features = activity.groupby('customer_id').agg(
    avg_login_count=('login_count', 'mean'),
    total_login_count=('login_count', 'sum'),
    max_login_count=('login_count', 'max'),
    avg_session_duration=('session_duration', 'mean'),
    total_session_duration=('session_duration', 'sum'),
    max_session_duration=('session_duration', 'max'),
    avg_feature_usage=('feature_usage_score', 'mean'),
    max_feature_usage=('feature_usage_score', 'max'),
    min_feature_usage=('feature_usage_score', 'min'),
    avg_engagement=('engagement_score', 'mean'),
    max_engagement=('engagement_score', 'max'),
    min_engagement=('engagement_score', 'min'),
    avg_active_days=('active_days', 'mean'),
    total_active_days=('active_days', 'sum'),
    max_active_days=('active_days', 'max'),
    metric_count=('metric_date', 'count'),
    days_since_last_active=('days_since_last_active', 'min'),
    login_trend=('login_count', lambda x: x.iloc[-1] - x.iloc[0] if len(x) > 1 else 0),
    engagement_trend=('engagement_score', lambda x: x.iloc[-1] - x.iloc[0] if len(x) > 1 else 0),
    feature_trend=('feature_usage_score', lambda x: x.iloc[-1] - x.iloc[0] if len(x) > 1 else 0),
    session_trend=('session_duration', lambda x: x.iloc[-1] - x.iloc[0] if len(x) > 1 else 0)
).reset_index()

cust = cust.merge(activity_features, on='customer_id', how='left')
activity_cols_list = [c for c in activity_features.columns if c != 'customer_id']
for col in activity_cols_list:
    cust[col] = cust[col].fillna(0)

# Feature selection
feature_cols = [
    'industry_encoded', 'country_encoded', 'company_size_log', 'tenure_days',
    'plan_name_encoded', 'monthly_price', 'days_to_renewal', 'days_since_start',
    'subscription_length_days',
    'total_events', 'n_upgrades', 'n_downgrades', 'n_cancellations',
    'upgrade_ratio', 'downgrade_ratio', 'has_downgraded',
    'ticket_count', 'high_priority', 'urgent_priority', 'open_tickets', 'closed_tickets',
    'tech_issues', 'billing_issues', 'avg_resolution_hours', 'max_resolution_hours',
    'high_priority_ratio', 'tech_issue_ratio', 'billing_issue_ratio', 'has_open_tickets',
    'avg_login_count', 'total_login_count', 'max_login_count',
    'avg_session_duration', 'total_session_duration', 'max_session_duration',
    'avg_feature_usage', 'max_feature_usage', 'min_feature_usage',
    'avg_engagement', 'max_engagement', 'min_engagement',
    'avg_active_days', 'total_active_days', 'max_active_days',
    'metric_count', 'days_since_last_active',
    'login_trend', 'engagement_trend', 'feature_trend', 'session_trend'
]

# Prepare X and y
X = cust[feature_cols].copy()
y = cust['is_churned'].copy()

# Handle NaN
for col in X.columns:
    if X[col].isna().sum() > 0:
        X[col] = X[col].fillna(X[col].median())

# Scale
scaler = StandardScaler()
X_scaled = pd.DataFrame(scaler.fit_transform(X), columns=feature_cols)

# Save preprocessor
preprocess = {
    'label_encoders': label_encoders,
    'scaler': scaler,
    'feature_cols': feature_cols,
    'categorical_cols': categorical_cols
}
joblib.dump(preprocess, '../backend/trained_models/preprocess.pkl')

# Save processed data
X_scaled.to_pickle('data/X_features.pkl')
y.to_pickle('data/y_target.pkl')
cust[['id', 'customer_id', 'is_churned'] + feature_cols].to_csv('data/master_dataset.csv', index=False)

print(f"  Features: {X_scaled.shape}")
print(f"  Target: {y.value_counts().to_dict()}")
print("  ✅ preprocess.pkl saved")

# ============================================================
# STEP 3: MODEL TRAINING
# ============================================================
print("\n[2/2] Running Model Training with XGBoost...")

from sklearn.model_selection import train_test_split, StratifiedKFold, GridSearchCV
from sklearn.metrics import (accuracy_score, precision_score, recall_score, f1_score,
                             roc_auc_score, classification_report)
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
import xgboost as xgb

# Split
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y
)
print(f"  Train: {X_train.shape}, Test: {X_test.shape}")

# SMOTE
smote = SMOTE(random_state=42)
X_train_res, y_train_res = smote.fit_resample(X_train, y_train)
print(f"  After SMOTE: {X_train_res.shape}")

# Quick grid search (reduced)
pipeline = ImbPipeline([
    ('smote', SMOTE(random_state=42)),
    ('xgb', xgb.XGBClassifier(random_state=42, eval_metric='logloss'))
])

param_grid = {
    'xgb__n_estimators': [100, 200],
    'xgb__max_depth': [4, 6],
    'xgb__learning_rate': [0.05, 0.1],
    'xgb__subsample': [0.8, 1.0],
    'xgb__colsample_bytree': [0.8, 1.0]
}

cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
grid_search = GridSearchCV(pipeline, param_grid, cv=cv, scoring='f1', n_jobs=-1, verbose=0)
grid_search.fit(X_train, y_train)

best_model = grid_search.best_estimator_
y_pred = best_model.predict(X_test)
y_prob = best_model.predict_proba(X_test)[:, 1]

print(f"\n  Best params: {grid_search.best_params_}")
print(f"  Accuracy:  {accuracy_score(y_test, y_pred):.4f}")
print(f"  Precision: {precision_score(y_test, y_pred):.4f}")
print(f"  Recall:    {recall_score(y_test, y_pred):.4f}")
print(f"  F1-Score:  {f1_score(y_test, y_pred):.4f}")
print(f"  ROC-AUC:   {roc_auc_score(y_test, y_prob):.4f}")

# Save model
joblib.dump(best_model, '../backend/trained_models/churn_model.pkl')
print("  ✅ churn_model.pkl saved")

# Verify
loaded_model = joblib.load('../backend/trained_models/churn_model.pkl')
test_pred = loaded_model.predict(X_test[:5])
print(f"  ✅ Model verified: {len(test_pred)} predictions OK")

print("\n" + "=" * 60)
print("✅ PIPELINE COMPLETE!")
print("=" * 60)
print("\nOutput files:")
print("  - ../backend/trained_models/churn_model.pkl")
print("  - ../backend/trained_models/preprocess.pkl")
print("  - ml/data/X_features.pkl")
print("  - ml/data/y_target.pkl")
print("  - ml/data/master_dataset.csv")