# ⚡ Vercel Deployment Guide for Quick Finder

This monorepo is **100% configured for one-click deployment on Vercel**!

The setup uses:
- **Vite React Frontend**: Compiled static single page application.
- **Express Node.js API**: Deployed automatically as a Vercel Serverless Function via [`/api/index.js`](file:///c:/Users/kisho/Downloads/docker-compose.dev/api/index.js).
- **Single URL Architecture**: `/api/*` requests route directly to the backend function without CORS hassle or separate domains.

---

## 🚀 Deployment Steps (2 Minutes)

### Step 1: Push to GitHub / GitLab / Bitbucket
Push this folder (`docker-compose.dev` / `QuickFinder`) to a repository.

### Step 2: Import into Vercel
1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Click **Import Repository** and choose your repository.
3. Keep default settings:
   - **Framework Preset**: Vite (or Other)
   - **Root Directory**: `./` (Leave default)
   - **Build Command**: `npm run build` (Automatically detected from [`vercel.json`](file:///c:/Users/kisho/Downloads/docker-compose.dev/vercel.json))
   - **Output Directory**: `apps/web/dist` (Automatically detected)

### Step 3: Add Environment Variables in Vercel
In the Vercel project deployment screen under **Environment Variables**, add the following:

#### 1. Backend Secrets
| Variable Key | Description / Example Value |
|---|---|
| `JWT_SECRET` | `quick_finder_super_secret_jwt_key_2026_campus_lost_and_found` |
| `CORS_ORIGIN` | `*` |
| `TWO_FACTOR_API_KEY` | `233155...` (Your 2Factor.in API Key for OTP SMS/Call) |
| `FIREBASE_SERVICE_ACCOUNT` | **Paste the full JSON content** of your `firebase-service-account.json` file as a raw JSON string |

#### 2. Frontend Firebase Configuration
| Variable Key | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `quick--finder.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `quick--finder` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `quick--finder.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `1016601449830` |
| `VITE_FIREBASE_APP_ID` | `1:1016601449830:web:...` |

---

## 🛠️ How it Works under the Hood

- **[`vercel.json`](file:///c:/Users/kisho/Downloads/docker-compose.dev/vercel.json)** rewrites all `/api/*` endpoints to [`api/index.js`](file:///c:/Users/kisho/Downloads/docker-compose.dev/api/index.js).
- **[`api/index.js`](file:///c:/Users/kisho/Downloads/docker-compose.dev/api/index.js)** loads [`apps/api/src/server.js`](file:///c:/Users/kisho/Downloads/docker-compose.dev/apps/api/src/server.js) directly without spawning background ports.
- **Firebase Admin SDK** detects `process.env.FIREBASE_SERVICE_ACCOUNT` dynamically, so you never need to commit secret credential files to Git!
