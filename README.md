# SmartSaaS Analytics

AI-Powered Customer Churn Prediction & Retention Intelligence Platform

SmartSaaS Analytics is a full-stack SaaS analytics application designed to help businesses monitor customer health, predict churn risk, understand churn drivers, and improve retention strategies through data-driven insights.

The platform combines Business Intelligence dashboards, Machine Learning, Explainable AI (SHAP), and customer retention recommendations into a single analytics solution.

---

## Features

### Dashboard Analytics
- Customer overview
- Revenue monitoring
- Subscription metrics
- Customer growth tracking
- Churn monitoring
- Interactive charts and KPI cards

### Customer Management
- Customer directory
- Customer profile page
- Customer activity history
- Subscription information
- Support ticket overview

### AI Churn Prediction
- Customer churn prediction
- Churn probability score
- Risk classification
- Machine Learning powered insights

### Explainable AI
- SHAP feature importance
- Prediction explanation
- Churn driver analysis
- Customer-level interpretation

### Retention Recommendations
- Customer retention strategies
- Risk-based recommendations
- Campaign targeting suggestions

### Reports
- Customer reports
- Churn reports
- Revenue reports
- Export-ready analytics

---

## Tech Stack

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript
- Chart.js

### Backend
- FastAPI
- Python

### Database
- Supabase
- PostgreSQL

### Machine Learning
- Scikit-Learn
- XGBoost
- SHAP

### Data Analysis
- Pandas
- NumPy

---

## System Architecture

```text
Frontend
   │
   ▼
FastAPI Backend
   │
   ├── Dashboard API
   ├── Customer API
   ├── Prediction API
   ├── Reports API
   └── Campaign API
   │
   ▼
Supabase PostgreSQL
   │
   ▼
Machine Learning Models
   ├── Churn Model
   ├── Preprocessing Pipeline
   └── SHAP Explainer
```

---

## Project Structure

```text
SmartSaaS
│
├── backend
│   ├── app
│   │   ├── routes
│   │   ├── services
│   │   ├── models
│   │   ├── schemas
│   │   ├── database.py
│   │   └── main.py
│   │
│   ├── trained_models
│   │   ├── churn_model.pkl
│   │   ├── preprocess.pkl
│   │   └── shap_explainer.pkl
│   │
│   ├── requirements.txt
│   └── .env
│
├── notebooks
│   ├── 01_EDA.ipynb
│   ├── 02_Data_Cleaning.ipynb
│   ├── 03_Feature_Engineering.ipynb
│   ├── 04_Model_Training.ipynb
│   ├── 05_Model_Evaluation.ipynb
│   └── 06_SHAP_Analysis.ipynb
│
├── frontend
│   ├── dashboard.html
│   ├── customers.html
│   ├── predictor.html
│   ├── reports.html
│   └── ...
│
├── database
│   ├── schema.sql
│   ├── seed.sql
│   └── queries.sql
│
└── docs
```

---

## Machine Learning Workflow

### 1. Data Preparation
- Data cleaning
- Missing value handling
- Feature engineering
- Feature selection

### 2. Model Training
- Train/Test Split
- XGBoost Training
- Hyperparameter Optimization

### 3. Model Evaluation
- Accuracy
- Precision
- Recall
- F1 Score
- ROC-AUC

### 4. Explainability
- SHAP Analysis
- Global Feature Importance
- Local Prediction Explanation

---

## Installation

### Clone Repository

```bash
git clone https://github.com/yourusername/smartsaas-analytics.git

cd smartsaas-analytics
```

### Backend Setup

```bash
cd backend

pip install -r requirements.txt
```

### Create Environment File

Create `.env`

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### Run Backend

```bash
python -m uvicorn app.main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

Swagger Documentation:

```text
http://127.0.0.1:8000/docs
```

---

## Database

Database powered by:

- Supabase
- PostgreSQL

Main entities:

- Customers
- Subscriptions
- Activities
- Support Tickets
- Predictions
- Campaigns

---

## API Modules

### Dashboard API

```text
/api/dashboard
```

### Customers API

```text
/api/customers
```

### Prediction API

```text
/api/prediction
```

### Reports API

```text
/api/reports
```

### Campaign API

```text
/api/campaigns
```

---

## Future Improvements

- Authentication & Authorization
- Real-time Analytics
- Automated Retention Campaigns
- Email Integration
- Multi-Tenant SaaS Support
- Role-Based Access Control
- Advanced Forecasting Models
- LLM-powered Business Insights

---


Built with:
- FastAPI
- Supabase
- XGBoost
- SHAP
- JavaScript
- PostgreSQL

---

