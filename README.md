# FocusFight

Full-stack MERN + Capacitor prototype for a digital wellbeing challenge platform.

## Structure

- `backend/` - Express API, MongoDB models, JWT auth.
- `frontend/` - React + Vite UI with Tailwind and Capacitor support.

## Setup

1. Install backend dependencies:
   ```powershell
   cd backend
   npm install
   copy .env.example .env
   # update .env values if needed
   npm run dev
   ```

2. Install frontend dependencies:
   ```powershell
   cd ..\frontend
   npm install
   npm run dev
   ```

3. To prepare Capacitor Android support:
   ```powershell
   cd frontend
   npm install
   npm install @capacitor/android @capacitor/cli@8.3.4 --save-dev
   npm run build
   npx cap add android
   npx cap sync android
   npx cap open android
   ```

## Environment Setup

### Backend

Copy the backend example env file:

```powershell
cd backend
copy .env.example .env
```

Then update `backend/.env` for your environment. For local development you can use:

```text
PORT=5000
MONGODB_URI=mongodb://localhost:27017/focusfight
JWT_SECRET=focusfight_secret_key
CLIENT_URL=http://localhost:5173
```

For production, use a remote MongoDB URI and a strong JWT secret:

```text
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/focusfight?retryWrites=true&w=majority
JWT_SECRET=some-long-random-secret
CLIENT_URL=https://your-production-url.com
```

### Frontend

Copy the frontend example env file and update the API base URL if needed:

```powershell
cd frontend
copy .env.example .env
```

Example front-end values:

```text
VITE_API_BASE=http://localhost:5000/api
```

## Android Native Integration

- `frontend/android/` now contains the generated Capacitor Android project.
- Added a native `UsageStats` plugin in `android/app/src/main/java/com/focusfight/app/UsageStatsPlugin.java`.
- Added `PACKAGE_USAGE_STATS` permission to `android/app/src/main/AndroidManifest.xml`.
- Added `requestUsagePermission()` and `hasUsagePermission()` plugin methods.
- The React app now calls the native plugin through `frontend/src/utils/usageTracker.js`.

### Android SDK setup

The Gradle build failed because the Android SDK location is not configured on your machine.

You need either:

1. Create `frontend/android/local.properties` with:

```text
sdk.dir=C:\Users\<your-user>\AppData\Local\Android\Sdk
```

2. Or set the environment variable in PowerShell:

```powershell
setx ANDROID_HOME "C:\Users\<your-user>\AppData\Local\Android\Sdk"
setx ANDROID_SDK_ROOT "C:\Users\<your-user>\AppData\Local\Android\Sdk"
```

Then re-run from `frontend/android`:

```powershell
./gradlew :app:assembleDebug
```

If you use Android Studio, opening `frontend/android` there will also prompt you to configure the SDK.

## Notes

- The Android app uses `UsageStatsManager` to check and query app usage data.
- The plugin opens the Android usage access settings screen so users can grant the permission.
- `frontend/src/utils/usageTracker.js` now uses the custom Capacitor plugin interface.
- If you deploy production, make sure `backend/.env` uses a secure `JWT_SECRET` and your production MongoDB URI.

## Remaining work

- Add complete usage syncing logic from Android into the backend using `usage/sync`.
- Build real dashboard analytics and ranking logic in the backend.
- Add challenge invite email/share flow and deep link handling.
- Add Android-specific app usage tracking UI and permission flow in the app.
- Add production build and deployment scripts for backend and frontend.
