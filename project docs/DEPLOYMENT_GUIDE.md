# Deployment Guide - Canx International
**Date:** February 9, 2026  
**Frontend:** Vercel  
**Backend:** Render

---

## 📋 Pre-Deployment Checklist

### ✅ Completed Setup
- [x] MongoDB migrated to ClusterCanx
- [x] Firebase updated to canx-international project
- [x] Environment variables configured locally
- [x] Backend tested locally
- [x] Frontend tested locally

### 🔍 Files to Verify Before Deployment
- [ ] `Backend/.env` - All production values set
- [ ] `Frontend/.env` - All production values set
- [ ] `Backend/config/firebase-service-account.json` - Correct project
- [ ] `.gitignore` files - Sensitive data excluded

---

## 🚀 PART 1: Backend Deployment (Render)

### Step 1: Prepare Backend for Render

#### 1.1 Verify render.yaml
Location: `Backend/render.yaml`
- ✅ Already configured
- ✅ Handles FarmCommerce/Backend directory structure

#### 1.2 Environment Variables Needed

**Critical - Must Set in Render Dashboard:**

```env
# Database
MONGO_URI=mongodb+srv://sujal99ds_db_user:DvEHC8z9ApZteyDI@clustercanx.bcazxvt.mongodb.net/?retryWrites=true&w=majority&appName=ClusterCanx

# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# JWT
JWT_SECRET=satpura_bio_jwt_secret_key_change_in_production_2024
JWT_EXPIRES_IN=30d

# SMS Service
SMSINDIAHUB_API_KEY=lSAjmE2EpE2BX4O5b1sC1Q
SMSINDIAHUB_SENDER_ID=SMSHUB

# Razorpay
RAZORPAY_KEY_ID=rzp_test_8sYbzHWidwe5Zw
RAZORPAY_KEY_SECRET=GkxKRQ2B0U63BKBoayuugS3D
RAZORPAY_TEST_MODE=true
RAZORPAY_SIMULATE_FAILURE=false

# Google Maps (Optional)
GOOGLE_MAPS_API_KEY=

# Business Rules
MIN_ORDER_VALUE=2000
MIN_VENDOR_PURCHASE=50000
DELIVERY_CHARGE=50
VENDOR_COVERAGE_RADIUS_KM=0.5
DELIVERY_TIMELINE_HOURS=24

# IRA Partner Commission
IRA_PARTNER_COMMISSION_RATE_LOW=2
IRA_PARTNER_COMMISSION_RATE_HIGH=3
IRA_PARTNER_COMMISSION_THRESHOLD=50000

# OTP
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=5

# Admin
ADMIN_PASSWORD=admin123

# Cloudinary
CLOUDINARY_CLOUD_NAME=dhmtagkyz
CLOUDINARY_API_KEY=883114994776468
CLOUDINARY_API_SECRET=VOc-g-Ag-dGh7Jj4YbilWJpzaUA
CLOUDINARY_URL=cloudinary://883114994776468:VOc-g-Ag-dGh7Jj4YbilWJpzaUA@dhmtagkyz
```

#### 1.3 Firebase Service Account (IMPORTANT!)

**Option A: Environment Variable (Recommended)**
1. Copy content of `Backend/config/firebase-service-account.json`
2. In Render Dashboard, add as environment variable:
   - Key: `FIREBASE_SERVICE_ACCOUNT`
   - Value: Paste the entire JSON content (minified, single line)

**Option B: Secret File (Alternative)**
1. In Render Dashboard, go to "Secret Files"
2. Add file: `config/firebase-service-account.json`
3. Paste the JSON content

### Step 2: Deploy to Render

#### 2.1 Create New Web Service
1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the repository: `Canx International` or your repo name

#### 2.2 Configure Service
```
Name: canx-international-backend
Region: Singapore (or closest to your users)
Branch: main (or your production branch)
Root Directory: FarmCommerce/Backend
Environment: Node
Build Command: npm install
Start Command: npm start
```

#### 2.3 Add Environment Variables
1. Go to **"Environment"** tab
2. Add ALL environment variables from Step 1.2 above
3. Click **"Save Changes"**

#### 2.4 Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. **Copy the deployed URL** (e.g., `https://canx-international-backend.onrender.com`)

### Step 3: Verify Backend Deployment

Test these endpoints:
```bash
# Health check
curl https://your-backend-url.onrender.com/api/health

# Check if server is running
curl https://your-backend-url.onrender.com/
```

Expected response: Server info or API documentation

---

## 🎨 PART 2: Frontend Deployment (Vercel)

### Step 1: Update Frontend Environment for Production

#### 1.1 Create Production Environment File

**DO NOT COMMIT THIS FILE!**

Create `Frontend/.env.production` (for reference only):

```env
# API Configuration
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api

# Google Services
VITE_GOOGLE_MAPS_API_KEY=AIzaSyCywksfSWSsLQ9MROgYZK5K-YMUf7lpS5U
VITE_GOOGLE_TRANSLATE_API_KEY=AIzaSyCywksfSWSsLQ9MROgYZK5K-YMUf7lpS5U

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=dhmtagkyz
VITE_CLOUDINARY_API_KEY=883114994776468
VITE_CLOUDINARY_UPLOAD_PRESET=satpura-bio-products

# Firebase (canx-international project)
VITE_FIREBASE_API_KEY=AIzaSyDK-GUlVRQiGLF563kpbwbWik1unpqbhcM
VITE_FIREBASE_AUTH_DOMAIN=canx-international.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=canx-international
VITE_FIREBASE_STORAGE_BUCKET=canx-international.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=356457561495
VITE_FIREBASE_APP_ID=1:356457561495:web:1d5941185f915ff54ad8d2
VITE_FIREBASE_VAPID_KEY=BAn0h9roshS5y4wVmFume2XfLsOD6Xhvno0N0T9APPeWHe8aPHqPUH4PVWldenJba0LP-6eHIBd6m36N5_meoZE
```

### Step 2: Deploy to Vercel

#### 2.1 Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

#### 2.2 Deploy via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
4. Configure project:
   ```
   Framework Preset: Vite
   Root Directory: FarmCommerce/Frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

#### 2.3 Add Environment Variables in Vercel

1. Go to **"Settings"** → **"Environment Variables"**
2. Add ALL variables from Step 1.1 above
3. **IMPORTANT:** Update `VITE_API_BASE_URL` with your actual Render backend URL
4. Click **"Save"**

#### 2.4 Deploy
1. Click **"Deploy"**
2. Wait for build (3-5 minutes)
3. **Copy the deployed URL** (e.g., `https://canx-international.vercel.app`)

### Step 3: Update Backend CORS

**CRITICAL:** After frontend is deployed, update backend CORS settings.

#### 3.1 Add CORS_ORIGIN to Render

1. Go to Render Dashboard → Your backend service
2. Go to **"Environment"** tab
3. Add new environment variable:
   ```
   Key: CORS_ORIGINS
   Value: https://canx-international.vercel.app,https://your-custom-domain.com
   ```
4. Click **"Save Changes"**
5. Backend will auto-redeploy

### Step 4: Verify Frontend Deployment

1. Visit your Vercel URL
2. Test login functionality
3. Check browser console for errors
4. Verify API calls are reaching backend

---

## 🔧 Post-Deployment Configuration

### 1. Update Firebase Authorized Domains

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select **canx-international** project
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Add your Vercel domain:
   - `canx-international.vercel.app`
   - Your custom domain (if any)
5. Click **"Add domain"**

### 2. Test Push Notifications

1. Login to admin panel on production
2. Go to Push Notifications
3. Send a test notification
4. Verify it's received in browser

### 3. Update MongoDB Atlas Network Access (if needed)

1. Go to MongoDB Atlas
2. Network Access → Add IP Address
3. Add: `0.0.0.0/0` (Allow from anywhere)
   - **Note:** For production, restrict to Render's IP ranges

---

## 🐛 Troubleshooting

### Backend Issues

**Issue:** "Cannot connect to MongoDB"
- **Fix:** Verify `MONGO_URI` in Render environment variables
- **Fix:** Check MongoDB Atlas network access allows Render IPs

**Issue:** "Firebase initialization failed"
- **Fix:** Verify `FIREBASE_SERVICE_ACCOUNT` environment variable is set
- **Fix:** Check JSON is valid (no line breaks, proper escaping)

**Issue:** "CORS errors"
- **Fix:** Add frontend URL to `CORS_ORIGINS` in Render
- **Fix:** Format: `https://domain1.com,https://domain2.com` (no spaces)

### Frontend Issues

**Issue:** "API calls failing"
- **Fix:** Verify `VITE_API_BASE_URL` points to correct Render URL
- **Fix:** Check backend CORS settings include frontend domain

**Issue:** "Firebase not working"
- **Fix:** Verify all `VITE_FIREBASE_*` variables are set in Vercel
- **Fix:** Check Firebase authorized domains include Vercel domain

**Issue:** "Build failing"
- **Fix:** Check build logs in Vercel dashboard
- **Fix:** Verify all dependencies are in `package.json`

---

## 📊 Monitoring

### Backend (Render)
- Dashboard: https://dashboard.render.com/
- Logs: Service → Logs tab
- Metrics: Service → Metrics tab

### Frontend (Vercel)
- Dashboard: https://vercel.com/dashboard
- Deployments: Project → Deployments
- Analytics: Project → Analytics

### Database (MongoDB Atlas)
- Dashboard: https://cloud.mongodb.com/
- Metrics: Cluster → Metrics
- Logs: Cluster → Logs

---

## 🔒 Security Checklist

- [ ] All `.env` files in `.gitignore`
- [ ] Firebase service account not committed to Git
- [ ] Production JWT_SECRET is strong and unique
- [ ] MongoDB user has minimum required permissions
- [ ] CORS restricted to known domains only
- [ ] HTTPS enforced on all endpoints
- [ ] API rate limiting configured (if applicable)

---

## 📝 Deployment Summary

### URLs to Update After Deployment

1. **Backend URL** → Update in:
   - Frontend `.env` → `VITE_API_BASE_URL`
   - Vercel environment variables

2. **Frontend URL** → Update in:
   - Backend CORS → `CORS_ORIGINS`
   - Firebase authorized domains
   - Razorpay dashboard (if using webhooks)

### Environment Variables Count
- **Backend (Render):** 25+ variables
- **Frontend (Vercel):** 11 variables

---

## 🎯 Quick Deployment Commands

### Test Build Locally First

**Backend:**
```bash
cd FarmCommerce/Backend
npm install
npm start
# Should start without errors
```

**Frontend:**
```bash
cd FarmCommerce/Frontend
npm install
npm run build
# Should build successfully
```

### Deploy via CLI (Alternative)

**Vercel:**
```bash
cd FarmCommerce/Frontend
vercel --prod
```

---

**Deployment Date:** _To be filled after deployment_  
**Backend URL:** _To be filled after Render deployment_  
**Frontend URL:** _To be filled after Vercel deployment_

---

## 📞 Support

If deployment fails:
1. Check deployment logs (Render/Vercel dashboard)
2. Verify all environment variables are set
3. Test locally first with production environment variables
4. Check this guide's troubleshooting section

**Last Updated:** February 9, 2026
