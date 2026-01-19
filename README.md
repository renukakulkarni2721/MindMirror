# MindMirror 🪞

A mental health reflection web application that helps users notice emotional patterns using AI-powered analysis.

## Features

- 🎙️ **Audio Reflections** - Record 30-60 second daily reflections
- 🧠 **AI Analysis** - Gemini-powered transcription and emotional analysis
- 📊 **Weekly Patterns** - Visualize emotional trends over time
- 🔐 **Secure Auth** - Firebase authentication (Email/Google)
- 🎨 **Calm UI** - Minimal, soothing design

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **AI**: Google Gemini API

## Setup

### 1. Clone the repository
```bash
git clone https://github.com/renukakulkarni2721/MindMirror.git
cd MindMirror
```

### 2. Install dependencies
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 3. Configure environment variables

**Client** (`client/.env`):
```env
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_URL=http://localhost:5000/api
```

**Server** (`server/.env`):
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
GEMINI_API_KEY=your-gemini-api-key
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### 4. Run the application
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

Open http://localhost:5173

## Disclaimer

MindMirror is a reflection tool and does not provide medical or therapeutic advice.

## License

MIT
