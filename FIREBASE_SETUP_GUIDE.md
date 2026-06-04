# Firebase Setup Guide for DLNZ_STORE

## Step 1: Create/Update Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project called "DLNZ_STORE" or use an existing one
3. Once created, click on your project

## Step 2: Get Your Firebase Credentials

1. Click **Project Settings** (gear icon, top-left)
2. Go to the **"Your apps"** section
3. Click **"Add app"** → **Web** icon
4. Register app with nickname "DLNZ_STORE"
5. **Copy all the config values** that appear (you'll need these)

## Step 3: Update firebase-applet-config.json

Replace the contents with your actual Firebase config:

```json
{
  "projectId": "your-project-id",
  "appId": "1:your-sender-id:web:your-app-id",
  "apiKey": "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "authDomain": "your-project-id.firebaseapp.com",
  "firestoreDatabaseId": "your-database-id",
  "storageBucket": "your-project-id.firebasestorage.app",
  "messagingSenderId": "your-sender-id",
  "measurementId": ""
}
```

## Step 4: Enable Authentication Methods

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable these providers:
   - ✅ **Email/Password** (Manual & Anonymous sign-up disabled)
   - ✅ **Google** (Set up OAuth consent screen if needed)

## Step 5: Create Firestore Database

1. Go to **Firestore Database**
2. Click **Create Database**
3. Choose **Start in test mode** (or production with proper rules)
4. Select a region (e.g., `us-east1`)
5. Create

## Step 6: Set Firestore Security Rules

Go to **Firestore** → **Rules** and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Allow public reads for products
    match /products/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Step 7: Setup Cloud Storage (Optional but Recommended)

1. Go to **Storage** → **Get Started**
2. Start in test mode
3. Choose a region

### Storage Security Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Step 8: For Vercel Deployment

Add these environment variables to your Vercel project:

**Settings** → **Environment Variables**

```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_FIRESTORE_DATABASE_ID=your_db_id
```

## Troubleshooting

### Error: "auth/operation-not-allowed"
→ Enable Email/Password in Firebase Authentication

### Error: "auth/web-storage-unsupported"
→ Your browser is blocking cross-origin storage. This is normal in iframes. Test in a new tab.

### Error: "Missing or insufficient permissions"
→ Update your Firestore security rules (see Step 6)

### Products not loading
→ Check that Firestore database was created in Step 5

---

**Need help?** Check the Firebase documentation: https://firebase.google.com/docs
