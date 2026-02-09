# 🚀 Quick Deployment Checklist

## Before You Deploy

### 1. Backend Preparation ✅
- [ ] Run verification script: `cd Backend && node scripts/verifyDeploymentReadiness.js`
- [ ] Test local build: `npm install && npm start`
- [ ] Verify MongoDB connection (ClusterCanx)
- [ ] Verify Firebase service account file is correct
- [ ] Review `.env` file - all values set correctly
- [ ] Ensure `.env` and `firebase-service-account.json` are in `.gitignore`

### 2. Frontend Preparation ✅
- [ ] Test local build: `npm install && npm run build`
- [ ] Verify `dist` folder is created successfully
- [ ] Check `.env` has all Firebase variables
- [ ] Review `vercel.json` configuration
- [ ] Ensure `.env` is in `.gitignore`

### 3. Git Repository ✅
- [ ] All changes committed
- [ ] Sensitive files NOT committed (.env, firebase-service-account.json)
- [ ] Push to main/production branch
- [ ] Repository is accessible to Render and Vercel

---

## Deployment Steps

### Step 1: Deploy Backend to Render

1. **Go to Render Dashboard**
   - URL: https://dashboard.render.com/
   - Click "New +" → "Web Service"

2. **Connect Repository**
   - Select your GitHub repository
   - Choose branch: `main`

3. **Configure Service**
   ```
   Name: canx-international-backend
   Region: Singapore (or closest)
   Root Directory: FarmCommerce/Backend
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

4. **Add Environment Variables**
   - Copy from `Backend/.env.template`
   - Add all 25+ variables
   - **CRITICAL:** Set `MONGO_URI` to ClusterCanx URL
   - **CRITICAL:** Add Firebase service account as `FIREBASE_SERVICE_ACCOUNT` or secret file

5. **Deploy**
   - Click "Create Web Service"
   - Wait 5-10 minutes
   - **COPY THE URL:** `https://your-app.onrender.com`

6. **Verify**
   ```bash
   curl https://your-app.onrender.com/api/health
   ```

---

### Step 2: Deploy Frontend to Vercel

1. **Go to Vercel Dashboard**
   - URL: https://vercel.com/
   - Click "Add New..." → "Project"

2. **Import Repository**
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project**
   ```
   Framework: Vite
   Root Directory: FarmCommerce/Frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Add Environment Variables**
   - Go to Settings → Environment Variables
   - Add all 11 variables from `Frontend/.env.template`
   - **CRITICAL:** Set `VITE_API_BASE_URL` to your Render backend URL
   - Example: `https://canx-international-backend.onrender.com/api`

5. **Deploy**
   - Click "Deploy"
   - Wait 3-5 minutes
   - **COPY THE URL:** `https://your-app.vercel.app`

6. **Verify**
   - Visit the URL in browser
   - Check console for errors
   - Test login functionality

---

### Step 3: Post-Deployment Configuration

#### A. Update Backend CORS
1. Go to Render → Your backend service → Environment
2. Add variable:
   ```
   CORS_ORIGINS=https://your-app.vercel.app
   ```
3. Save (auto-redeploys)

#### B. Update Firebase Authorized Domains
1. Firebase Console → Authentication → Settings
2. Add domain: `your-app.vercel.app`
3. Save

#### C. Test End-to-End
- [ ] Frontend loads correctly
- [ ] Can login (admin/vendor/user)
- [ ] API calls work
- [ ] Push notifications work
- [ ] Image uploads work (Cloudinary)
- [ ] Payment flow works (Razorpay)

---

## Environment Variables Quick Reference

### Backend (Render) - 25+ Variables
```
MONGO_URI
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
JWT_SECRET
JWT_EXPIRES_IN=30d
SMSINDIAHUB_API_KEY
SMSINDIAHUB_SENDER_ID
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_TEST_MODE=true
GOOGLE_MAPS_API_KEY
MIN_ORDER_VALUE=2000
MIN_VENDOR_PURCHASE=50000
DELIVERY_CHARGE=50
VENDOR_COVERAGE_RADIUS_KM=0.5
DELIVERY_TIMELINE_HOURS=24
IRA_PARTNER_COMMISSION_RATE_LOW=2
IRA_PARTNER_COMMISSION_RATE_HIGH=3
IRA_PARTNER_COMMISSION_THRESHOLD=50000
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=5
ADMIN_PASSWORD
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CLOUDINARY_URL
CORS_ORIGINS
```

### Frontend (Vercel) - 11 Variables
```
VITE_API_BASE_URL
VITE_GOOGLE_MAPS_API_KEY
VITE_GOOGLE_TRANSLATE_API_KEY
VITE_CLOUDINARY_CLOUD_NAME
VITE_CLOUDINARY_API_KEY
VITE_CLOUDINARY_UPLOAD_PRESET
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_VAPID_KEY
```

---

## Troubleshooting Quick Fixes

| Issue | Fix |
|-------|-----|
| Backend won't start | Check Render logs, verify MONGO_URI |
| CORS errors | Add frontend URL to CORS_ORIGINS |
| Firebase errors | Verify service account JSON is valid |
| API calls fail | Check VITE_API_BASE_URL in Vercel |
| Build fails | Check build logs, verify dependencies |
| Push notifications fail | Add domain to Firebase authorized domains |

---

## Deployment URLs

**Fill these in after deployment:**

- **Backend:** `https://________________________.onrender.com`
- **Frontend:** `https://________________________.vercel.app`
- **MongoDB:** `mongodb+srv://...clustercanx.bcazxvt.mongodb.net/...`
- **Firebase:** `canx-international`

---

## Final Checks ✅

After deployment:
- [ ] Backend health check responds
- [ ] Frontend loads without errors
- [ ] Login works for all user types
- [ ] Database operations work
- [ ] Push notifications work
- [ ] File uploads work
- [ ] All environment variables set correctly
- [ ] CORS configured properly
- [ ] Firebase authorized domains updated
- [ ] No sensitive data in Git repository

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Status:** ⬜ Success ⬜ Partial ⬜ Failed

---

## Next Steps After Deployment

1. **Monitor for 24 hours**
   - Check Render logs for errors
   - Monitor Vercel analytics
   - Watch MongoDB Atlas metrics

2. **Set up custom domain** (optional)
   - Add domain to Vercel
   - Update CORS_ORIGINS
   - Update Firebase authorized domains

3. **Enable monitoring**
   - Set up error tracking (Sentry, etc.)
   - Configure uptime monitoring
   - Set up alerts

4. **Security hardening**
   - Restrict MongoDB network access
   - Review API rate limits
   - Enable 2FA on all services

---

**For detailed instructions, see:** `DEPLOYMENT_GUIDE.md`
