# SmartSaaS Analytics - Deployment Guide

## Arsitektur Deployment

```
┌──────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                  │     │                  │     │                 │
│   Frontend       │────▶│   Backend        │────▶│   Database      │
│   (Vercel)       │     │   (Render)       │     │   (Supabase)    │
│                  │     │                  │     │                 │
│   dashboard.html  │     │   FastAPI        │     │   PostgreSQL    │
│   customers.html  │     │   ML Model       │     │                 │
│   predictor.html  │     │   SHAP Analysis  │     │                 │
│                  │     │                  │     │                 │
└──────────────────┘     └──────────────────┘     └─────────────────┘
```

## Prerequisites

- **Git** - Version control
- **Vercel Account** - Free tier (vercel.com)
- **Render Account** - Free tier (render.com)
- **Supabase Account** - Free tier (supabase.com)

---

## 1. Database - Supabase Setup

### 1.1 Create Supabase Project
1. Go to https://supabase.com
2. Click **"Start your project"**
3. Create a new organization and project
4. Note your **Project URL** and **anon public key** from Settings → API

### 1.2 Run Database Schema
1. Go to Supabase Dashboard → **SQL Editor**
2. Copy content from `database/schema.sql` and paste
3. Click **"Run"** to create all tables
4. (Optional) Run `database/seed.sql` for sample data

### 1.3 Configure Environment
Update `backend/.env`:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=eyJ...your-anon-key...
```

---

## 2. Backend - Render Deployment

### 2.1 Prepare Repository
```bash
# The backend directory should contain:
backend/
├── Procfile              # Already configured
├── requirements.txt      # Dependencies
├── .env.example          # Environment template
└── app/
    ├── main.py           # FastAPI app
    ├── config.py         # Centralized config
    ├── database.py       # Supabase connection
    └── ...
```

### 2.2 Deploy to Render

1. Go to https://render.com → **Dashboard**
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub/GitLab repository
4. Configure:
   - **Name**: `smartsaas-analytics-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free

### 2.3 Environment Variables (Render)
Add these in Render Dashboard → Environment:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJ...your-anon-key...
CORS_ORIGINS=http://localhost:5500,https://your-vercel-app.vercel.app
```

### 2.4 Upload ML Models
Render free tier does NOT support persistent storage.
You need to host the trained models on **cloud storage**:

**Option A: GitHub Releases (Recommended)**
```bash
# 1. Upload models to GitHub Releases
# 2. Add download step in Render Build Command:
pip install -r requirements.txt && \
curl -L https://github.com/your-repo/releases/download/v1.0/churn_model.pkl -o trained_models/churn_model.pkl && \
curl -L https://github.com/your-repo/releases/download/v1.0/preprocess.pkl -o trained_models/preprocess.pkl && \
curl -L https://github.com/your-repo/releases/download/v1.0/shap_explainer.pkl -o trained_models/shap_explainer.pkl
```

**Option B: Cloud Storage (S3/Cloudinary)**
```bash
# Download models during startup
wget https://your-storage-url/churn_model.pkl -O trained_models/churn_model.pkl
```

### 2.5 Verify Backend
After deployment, visit:
- `https://smartsaas-analytics-api.onrender.com/health` → `{"status": "healthy"}`
- `https://smartsaas-analytics-api.onrender.com/docs` → Swagger UI

---

## 3. Frontend - Vercel Deployment

### 3.1 Prepare Frontend
The frontend files are at root level:
```
/ (root)
├── frontend/
│   ├── dashboard.html
│   ├── customers.html
│   ├── predictor.html
│   ├── explainable-ai.html
│   ├── campaigns.html
│   ├── reports.html
│   ├── settings.html
│   ├── login.html
│   ├── customer-detail.html
│   └── recommendations.html
├── js/
│   ├── api.js          # Centralized API (auto-detects environment)
│   ├── dashboard.js
│   ├── customers.js
│   └── predictor.js
├── css/
├── assets/
└── vercel.json
```

### 3.2 Deploy to Vercel

1. Go to https://vercel.com → **Dashboard**
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: `Other`
   - **Root Directory**: `./` (leave default)
   - **Build Command**: (leave empty)
   - **Output Directory**: `.` (leave default)

### 3.3 Environment Variables (Vercel)
Add in Vercel Dashboard → Project Settings → Environment Variables:
```
API_URL=https://smartsaas-analytics-api.onrender.com/api
```

### 3.4 Automatic API URL Detection
The `js/api.js` file automatically detects the environment:
- **Production** (Vercel): Uses `https://smartsaas-analytics-api.onrender.com/api`
- **Development** (localhost): Uses `http://localhost:8000/api`
- Custom: Set `window.__ENV.API_URL` via Vercel env vars

---

## 4. Final Integration Checklist

### 4.1 Environment Variables Summary

**Supabase** (required):
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Your Supabase anon/public key |

**Backend - Render** (required):
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase anon key |
| `CORS_ORIGINS` | Allowed origins (comma-separated) |
| `MODELS_DIR` | (Optional) Custom path to ML models |

**Frontend - Vercel** (optional):
| Variable | Description |
|----------|-------------|
| `API_URL` | Backend API URL (auto-detected if not set) |

### 4.2 Testing Checklist

- [ ] **Supabase**: Tables created, seed data loaded
- [ ] **Backend**: `GET /health` returns `{"status": "healthy"}`
- [ ] **Backend**: `GET /api/dashboard` returns dashboard stats
- [ ] **Backend**: `GET /api/customers` returns paginated customers
- [ ] **Backend**: `POST /api/predict-churn` returns prediction with SHAP
- [ ] **Frontend**: Dashboard shows live data from API
- [ ] **Frontend**: Predictor form works with ML model
- [ ] **Frontend**: Customers list renders with pagination
- [ ] **CORS**: Frontend can call backend API without errors
- [ ] **API Auth**: Add authentication if needed (see roadmap)

### 4.3 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| CORS error in browser | Wrong CORS_ORIGINS | Add Vercel domain to CORS_ORIGINS |
| Model not found on Render | No persistent storage | Download models during build |
| 404 on page refresh | SPA routing | vercel.json rewrites already configured |
| Supabase 401 | Wrong API key | Use anon/public key, not service_role key |
| Slow prediction | Cold start | Render free tier spins down after inactivity |

### 4.4 Monitoring

- **Render**: Dashboard shows logs, metrics, and alerts
- **Vercel**: Analytics and function monitoring
- **Supabase**: Database logs and query performance

---

## 5. Project Structure (After Deployment)

```
SmartSaaS-Analytics/
├── backend/               # Deployed to Render
│   ├── Procfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── database.py
│       ├── routes/        # API endpoints
│       ├── services/      # Business logic
│       ├── schemas/       # Pydantic models
│       └── models/        # SQLAlchemy models
├── frontend/              # Deployed to Vercel
│   ├── dashboard.html
│   ├── customers.html
│   ├── predictor.html
│   └── ... (other pages)
├── js/                    # Frontend scripts
├── css/                   # Styles
├── docs/                  # Documentation
└── database/              # SQL scripts
```

## Quick Deploy Commands

```bash
# 1. Clone repository
git clone https://github.com/your-org/SmartSaaS-Analytics.git
cd SmartSaaS-Analytics

# 2. Remove .env from git tracking (if committed)
git rm --cached backend/.env
echo "backend/.env" >> .gitignore

# 3. Push to GitHub
git add .
git commit -m "Initial commit with full integration"
git push origin main

# 4. Deploy backend to Render
#    (Follow steps in section 2.2)

# 5. Deploy frontend to Vercel
#    (Follow steps in section 3.2)

# 6. Update vercel.json with actual Render URL
#    Edit: js/api.js → production URL