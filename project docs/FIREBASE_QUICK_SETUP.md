# 🔥 Firebase Setup - Quick Steps

## 1️⃣ Create Project
- Go to: https://console.firebase.google.com/
- Click "Add project"
- Name: `canx-international`
- Enable Analytics (optional)
- Click "Create project"

## 2️⃣ Add Web App
- Click Web icon (`</>`)
- Nickname: `Canx International Web`
- Click "Register app"
- **COPY the config object** ⬇️

## 3️⃣ Enable Cloud Messaging
- Sidebar: Build → Cloud Messaging
- Enable Cloud Messaging API (V1)

## 4️⃣ Get VAPID Key
- Cloud Messaging → Web configuration
- Click "Generate key pair"
- **COPY the VAPID key** ⬇️

## 5️⃣ Download Service Account
- Settings ⚙️ → Project settings
- Service accounts tab
- Click "Generate new private key"
- **SAVE the JSON file** ⬇️
- Rename to: `firebase-service-account.json`

## 6️⃣ Update Files

### Backend:
Replace: `Backend/config/firebase-service-account.json`

### Frontend `.env`:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
```

## 7️⃣ Test
```bash
# Backend
cd Backend
npm start

# Frontend
cd Frontend
npm run dev
```

---

**That's it!** 🎉

See `FIREBASE_SETUP_GUIDE.md` for detailed instructions.
