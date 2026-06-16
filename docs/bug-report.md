# SmartSaaS Analytics - Bug Report & Integration Issues

## Daftar Bug & Issues yang Ditemukan

### 1. Backend - CORS Configuration (HIGH)
- **File**: `backend/app/main.py`
- **Issue**: Hanya mengizinkan `localhost:5500`, `127.0.0.1:5500`, `localhost:8000`, `127.0.0.1:8000`. Setelah deploy ke Vercel & Render, origin frontend (Vercel) akan ditolak.
- **Fix**: Gunakan environment variable `CORS_ORIGINS` atau izinkan secara dinamis.

### 2. Backend - Router Tidak Lengkap (HIGH)
- **File**: `backend/app/main.py`
- **Issue**: Hanya 3 router terdaftar. Routes `campaigns.py`, `report.py` tidak di-import (file kosong). Tidak ada router untuk recommendations/SHAP.
- **Fix**: Import dan register semua router yang dibutuhkan.

### 3. Backend - File Kosong (CRITICAL)
- **Files (0 bytes)**:
  - `backend/app/config.py`
  - `backend/app/routes/campaigns.py`
  - `backend/app/routes/report.py`
  - `backend/app/services/recomendation_service.py`
  - `backend/app/services/shap_service.py`
  - `backend/app/models/activity.py`, `customer.py`, `subscription.py`, `ticket.py`, `prediction.py`
- **Fix**: Isi semua file dengan implementasi yang sesuai.

### 4. Frontend - Hardcoded API URL (HIGH)
- **Files**: `js/customers.js` (line 77), `js/predictor.js` (line 35)
- **Issue**: `http://localhost:8000` hardcoded. Setelah deploy, URL backend berbeda.
- **Fix**: Gunakan variabel lingkungan atau deteksi otomatis.

### 5. Frontend - Dashboard Menggunakan Mock Data (HIGH)
- **File**: `js/dashboard.js`
- **Issue**: Semua data statis (2847 customers, $189420 revenue, dll). Tidak ada fetch ke backend API.
- **Fix**: Tambahkan fetch ke `/api/dashboard` endpoint.

### 6. Frontend - API Layer Tidak Ada (MEDIUM)
- **File**: `js/api.js` (0 bytes)
- **Issue**: Tidak ada centralized API configuration.
- **Fix**: Isi dengan base URL, helper functions, dan error handler.

### 7. Backend - Supabase Key Tidak Valid (MEDIUM)
- **File**: `backend/.env`
- **Issue**: Key menggunakan format `sb_publishable_...` bukan format anon key `eyJ...`. Ini bisa menyebabkan RLS policy issues.
- **Fix**: Gunakan anon/public key yang benar dari Supabase dashboard.

### 8. Deployment - Tidak Ada Vercel Config (HIGH)
- **Issue**: Tidak ada `vercel.json` untuk frontend deployment.
- **Fix**: Buat `vercel.json` dengan rewrite rules untuk SPA routing.

### 9. Deployment - Tidak Ada Render Config (HIGH)
- **Issue**: Tidak ada `Procfile`, `start.sh`, atau `runtime.txt`.
- **Fix**: Buat file konfigurasi untuk Render.

### 10. Deployment - Tidak Ada .env.example (MEDIUM)
- **Issue**: `.env` berisi credentials asli, tidak ada template.
- **Fix**: Buat `.env.example` dengan placeholder.

### 11. ML Model - Path Issues di Production (HIGH)
- **File**: `backend/app/services/prediction_service.py`
- **Issue**: Path ke model menggunakan `os.path.dirname` yang mungkin tidak bekerja di Render.
- **Fix**: Gunakan `BASE_DIR` yang sudah dikonfigurasi dengan benar.

### 12. Frontend - Predictor Tidak Handle Loading State (LOW)
- **File**: `js/predictor.js`
- **Issue**: Tidak ada timeout/abort untuk fetch request.
- **Fix**: Tambahkan AbortController.

### 13. Security - Credentials di Repository (CRITICAL)
- **File**: `backend/.env`
- **Issue**: SUPABASE_URL dan SUPABASE_KEY ter-commit ke repository.
- **Fix**: Hapus dari tracking, tambahkan ke .gitignore.