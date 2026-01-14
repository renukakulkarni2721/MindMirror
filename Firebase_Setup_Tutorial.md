# Firebase Setup Tutorial for MindMirror (Simplified)

A step-by-step guide to configure Firebase - **NO Storage required!**

---

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Enter project name: `mindmirror`
4. Disable Google Analytics (optional)
5. Click **Create project** → Wait → Click **Continue**

---

## Step 2: Enable Authentication

1. Left sidebar → **Build** → **Authentication**
2. Click **Get started**
3. Enable **Email/Password**:
   - Click on Email/Password → Toggle ON → **Save**
4. (Optional) Enable **Google**:
   - Click on Google → Toggle ON → Enter support email → **Save**

---

## Step 3: Create Firestore Database

1. Left sidebar → **Build** → **Firestore Database**
2. Click **Create database**
3. Select **Start in test mode**
4. Choose your region → Click **Enable**

### Set Security Rules:
Go to **Rules** tab, paste this, then click **Publish**:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Step 4: Get Web App Config (Frontend)

1. Click ⚙️ **Settings** icon → **Project settings**
2. Scroll to **Your apps** → Click web icon `</>`
3. Nickname: `mindmirror-web` → **Register app**
4. Copy the config values

### Create `client/.env`:
```env
VITE_FIREBASE_API_KEY=AIzaSy...your-key
VITE_FIREBASE_AUTH_DOMAIN=mindmirror-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mindmirror-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=mindmirror-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_API_URL=http://localhost:5000/api
```

---

## Step 5: Get Service Account (Backend)

1. **Project settings** → **Service accounts** tab
2. Click **Generate new private key** → **Generate key**
3. Rename downloaded file to `serviceAccountKey.json`
4. Move to `d:\MIT WPU\mindmirror\server\serviceAccountKey.json`

---

## Step 6: Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click **Create API key**
3. Copy the key

---

## Step 7: Create Backend `.env`

Create `server/.env`:
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
GEMINI_API_KEY=your-gemini-api-key-here
PORT=5000
FRONTEND_URL=http://localhost:5173
```

---

## Step 8: Restart & Test

```bash
# Terminal 1 - Backend
cd d:\MIT WPU\mindmirror\server
npm run dev

# Terminal 2 - Frontend
cd d:\MIT WPU\mindmirror\client
npm run dev
```

Open http://localhost:5173 → Register → Start reflecting!

---

## Quick Checklist

- [ ] Firebase project created
- [ ] Authentication enabled
- [ ] Firestore database created
- [ ] Web app config copied to `client/.env`
- [ ] Service account key saved as `server/serviceAccountKey.json`
- [ ] Gemini API key added to `server/.env`
- [ ] Both servers restarted

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| Firebase Admin not initialized | Check `serviceAccountKey.json` path |
| Invalid API key | Verify `VITE_FIREBASE_API_KEY` |
| Permission denied (Firestore) | Check security rules are published |
| Gemini API error | Verify `GEMINI_API_KEY` is correct |
