# Firebase Setup Guide for Push Notifications
**Project:** Canx International  
**Date:** February 6, 2026

---

## 🔥 Step-by-Step Firebase Setup

### **STEP 1: Create New Firebase Project**

1. Go to **Firebase Console**: https://console.firebase.google.com/
2. Click **"Add project"** or **"Create a project"**
3. Enter project name: `canx-international` (or your preferred name)
4. Click **Continue**
5. **Google Analytics**: Choose whether to enable (recommended: Yes)
6. Select or create Analytics account
7. Click **Create project**
8. Wait for project creation (takes ~30 seconds)
9. Click **Continue**

---

### **STEP 2: Register Web App**

1. In Firebase Console, click the **Web icon** (`</>`) to add a web app
2. Enter app nickname: `Canx International Web`
3. ✅ Check **"Also set up Firebase Hosting"** (optional)
4. Click **Register app**
5. **Copy the Firebase config** - you'll need this later:
   ```javascript
   const firebaseConfig = {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "...",
     measurementId: "..."
   };
   ```
6. Click **Continue to console**

---

### **STEP 3: Enable Cloud Messaging**

1. In Firebase Console sidebar, click **Build** → **Cloud Messaging**
2. Click **Get started** (if prompted)
3. You should see "Cloud Messaging API (Legacy) - Enabled"
4. Click on **"Cloud Messaging API (V1)"** tab
5. Click **"Enable"** if not already enabled

---

### **STEP 4: Generate VAPID Key (for Web Push)**

1. Still in **Cloud Messaging** section
2. Scroll down to **"Web configuration"**
3. Click **"Generate key pair"** under "Web Push certificates"
4. **Copy the VAPID key** - you'll need this for frontend
5. Save it somewhere safe

---

### **STEP 5: Generate Service Account Key (for Backend)**

1. In Firebase Console, click the **⚙️ (Settings)** icon → **Project settings**
2. Go to **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Click **"Generate key"** in the confirmation dialog
5. A JSON file will download - **SAVE THIS FILE SECURELY**
6. Rename it to: `firebase-service-account.json`

---

### **STEP 6: Update Backend Configuration**

1. **Replace the service account file:**
   ```
   Backend/config/firebase-service-account.json
   ```
   Replace with the new JSON file you just downloaded

2. **Verify the file structure** (should look like this):
   ```json
   {
     "type": "service_account",
     "project_id": "your-project-id",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...",
     "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
     "client_id": "...",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
     "client_x509_cert_url": "...",
     "universe_domain": "googleapis.com"
   }
   ```

---

### **STEP 7: Update Frontend Environment Variables**

1. Open `Frontend/.env`
2. Update the Firebase configuration:
   ```env
   # Firebase Configuration (from Step 2)
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   
   # VAPID Key (from Step 4)
   VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
   ```

---

### **STEP 8: Test the Setup**

1. **Restart your backend:**
   ```bash
   cd Backend
   npm start
   ```

2. **Check for Firebase initialization:**
   - Look for successful Firebase connection in console
   - No errors related to Firebase Admin SDK

3. **Restart your frontend:**
   ```bash
   cd Frontend
   npm run dev
   ```

4. **Test push notification:**
   - Login to admin panel
   - Go to Push Notifications section
   - Send a test notification
   - Check browser console for FCM token registration

---

## 📋 Quick Checklist

- [ ] Created new Firebase project
- [ ] Registered web app
- [ ] Enabled Cloud Messaging
- [ ] Generated VAPID key
- [ ] Downloaded service account JSON
- [ ] Updated `Backend/config/firebase-service-account.json`
- [ ] Updated `Frontend/.env` with new Firebase config
- [ ] Updated `Frontend/.env` with VAPID key
- [ ] Tested backend startup (no Firebase errors)
- [ ] Tested frontend startup (no Firebase errors)
- [ ] Tested sending push notification

---

## 🔧 Files to Update

### Backend:
```
Backend/config/firebase-service-account.json
```

### Frontend:
```
Frontend/.env
```

---

## 🚨 Important Notes

1. **Keep service account JSON secure** - Never commit to Git
2. **VAPID key is public** - Safe to include in frontend code
3. **Test in browser** - Push notifications require HTTPS (or localhost)
4. **Browser permissions** - Users must grant notification permission
5. **Service worker** - Required for background notifications

---

## 🐛 Troubleshooting

### "Firebase Admin SDK initialization failed"
- Check `firebase-service-account.json` is in correct location
- Verify JSON file is valid (no syntax errors)
- Ensure file has correct permissions

### "FCM token registration failed"
- Check VAPID key is correct in `.env`
- Verify Firebase config is correct
- Check browser console for detailed errors
- Ensure service worker is registered

### "Notification permission denied"
- User must manually grant permission in browser
- Check browser notification settings
- Try in incognito/private mode

---

## 📞 Need Help?

If you encounter issues:
1. Check Firebase Console → Project Overview → Usage
2. Check Firebase Console → Cloud Messaging → Send test message
3. Review browser console for errors
4. Check backend logs for Firebase-related errors

---

**Setup Date:** February 6, 2026  
**Last Updated:** February 6, 2026
