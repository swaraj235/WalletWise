# 🚀 WalletWise — Deployment & Infrastructure Guide

This guide covers the deployment pipelines, CI/CD automation, containerization, and secrets management for the **WalletWise** mobile application.

---

## 🏗️ Architecture Overview

WalletWise is an Expo / React Native mobile application built with **Continuous Native Generation (CNG)**. Because there are no tracked `android/` or `ios/` folders in version control, native binaries are compiled in the cloud via **EAS (Expo Application Services)**.

```
Developer / PR
   │
   ▼
GitHub Actions (CI Quality Gate)
   ├── ESLint (expo lint)
   ├── TypeScript (tsc --noEmit)
   └── Unit Tests (npm test)
   │
   ▼ Merge to main
GitHub Actions (CD Pipeline)
   │
   ▼ Calls EAS Cloud
EAS Cloud Build ──▶ Standalone Android APK (.apk)
```

---

## 🚦 1. Continuous Integration (CI)

Every commit pushed to any branch and every pull request targeting `main` automatically runs through our quality gate defined in `.github/workflows/ci.yml`.

### What CI Validates:
1. **Linting**: Runs `npx expo lint` against React 19 / Expo 57 standards.
2. **Type Checking**: Runs `npx tsc --noEmit` in strict mode across all `src/**/*.{ts,tsx}` files.
3. **Environment Isolation**: Uses placeholder credentials for `EXPO_PUBLIC_*` to ensure builds never leak secrets or fail due to missing keys.

### Running Quality Checks Locally:
Before pushing code, you can run the exact CI checks on your machine:
```bash
# Run ESLint
npx expo lint

# Run TypeScript type check
npx tsc --noEmit

# Run unit tests
npm test
```

---

## 📦 2. Continuous Delivery (CD) & EAS Build

Whenever changes are merged into `main`, GitHub Actions automatically triggers `.github/workflows/eas-build.yml` to compile a fresh preview APK.

### Build Profiles (`eas.json`):
* **`preview`**: Compiles an installable standalone Android `.apk` binary (`buildType: "apk"`). Anyone on the team can download and install this directly onto an Android device.
* **`development`**: Builds an internal debug client for development testing.
* **`production`**: Produces an optimized `.aab` (Android App Bundle) with automated version increments for Google Play Store submission.

### Manual Local Trigger (Optional):
If you have EAS CLI installed locally, you can trigger a build directly from your machine:
```bash
eas build --platform android --profile preview
```

---

## 🔐 3. Secrets Management

Secrets are managed across three distinct tiers to ensure zero credential leakage:

| Secret | Scope | Purpose |
|---|---|---|
| `EXPO_TOKEN` | GitHub Repository Secrets | Allows GitHub Actions to authenticate with your Expo account for EAS builds. |
| `EXPO_PUBLIC_GROQ_API_KEY` | EAS Secret Store & local `.env` | Access key for Groq LLM inference in the Aura assistant. |
| `EXPO_PUBLIC_MAPBOX_TOKEN` | EAS Secret Store & local `.env` | Access token for Mapbox tiles and geocoding. |

### Adding Secrets to EAS:
```bash
eas secret:create --scope project --name EXPO_PUBLIC_GROQ_API_KEY --value "your_groq_key"
eas secret:create --scope project --name EXPO_PUBLIC_MAPBOX_TOKEN --value "your_mapbox_token"
```

---

## 🐳 4. Docker Developer Environment

For developers who want an isolated, reproducible environment without installing Node or Expo locally:

### Run the App via Docker:
```bash
# Start the Metro bundler inside the container
docker compose up app
```
* **Port**: `8081` (Metro bundler)
* **Live Reloading**: Source code is mounted into the container in real-time.
* **Config files**: Defined in `Dockerfile`, `.dockerignore`, and `docker-compose.yml`.

---

## 🧠 5. Data Science / ML Service Integration (Future)

When the Data Science team delivers their Python/FastAPI inference service:
1. Place the service code in the `/ml/` directory.
2. Uncomment the `ml-service` block in `docker-compose.yml`:
   ```yaml
   ml-service:
     build: ./ml
     ports:
       - "8000:8000"
     volumes:
       - ./ml:/app
     command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
3. Run `docker compose up` to start both the mobile bundler and ML backend side-by-side.

---

## 🛡️ 6. Branch Protection Rules

To maintain high code quality on `main`, configure branch protection on GitHub:
1. Navigate to **Settings** → **Branches** in the GitHub repository.
2. Under **Branch protection rules**, click **Add rule** for `main`.
3. Check:
   - ✅ **Require a pull request before merging**
   - ✅ **Require status checks to pass before merging**
     - Select: `Lint + TypeScript`
   - ✅ **Require branches to be up to date before merging**
