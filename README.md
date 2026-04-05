# KardetecAI

KardetecAI is an Android app and companion backend for reviewing whether a piece of text or an image shows signs that are commonly associated with AI generation.

The project is designed around one practical goal: reduce false positives. Instead of forcing a dramatic verdict from weak evidence, the app now uses a more conservative scoring model and returns `Inconclusive` when the signals do not line up clearly.

## What the app does

- Analyzes pasted text and uploaded images
- Returns an AI-likelihood score, confidence level, and short explanation
- Highlights the strongest signals behind each result
- Offers `Conservative` and `Balanced` detection modes in-app
- Connects to a Vercel-hosted backend for live analysis

## Product approach

KardetecAI is not presented as a magic detector. Real-world AI detection is probabilistic, and strong products should reflect that honestly.

This codebase leans into that idea by:

- preferring caution over overconfidence
- exposing supporting signals instead of only a number
- separating `Likely Human`, `Inconclusive`, and `Likely AI`
- keeping the Android client and backend logic easy to evolve

## Project structure

```text
NewAPP/
  kardetecai-android/    Android app built with Kotlin and Jetpack Compose
  kardetecai-backend/    Express API deployed on Vercel
```

## Android app

The Android client lives in [kardetecai-android](/d:/test/NewAPP/kardetecai-android).

Key parts:

- Compose UI for text analysis, image analysis, and settings
- Result cards with summaries, highlights, and metric breakdowns
- A settings screen built for end users rather than developers
- Persistent user preferences for analysis mode

Release builds are produced from:

- [app/build.gradle.kts](/d:/test/NewAPP/kardetecai-android/app/build.gradle.kts)
- [gradle.properties](/d:/test/NewAPP/kardetecai-android/gradle.properties)

## Backend API

The backend lives in [kardetecai-backend](/d:/test/NewAPP/kardetecai-backend) and is deployed to:

- `https://kardetecai-backend.vercel.app`

Available routes:

- `GET /api/health`
- `POST /api/detect/text`
- `POST /api/detect/image`
- `POST /api/detect`
- `GET /api/stats`

The backend accepts an `X-Analysis-Mode` header:

- `conservative`
- `balanced`

## Local development

### Backend

```bash
cd kardetecai-backend
npm install
npm start
```

### Android

```bash
cd kardetecai-android
./gradlew assembleDebug
```

On Windows:

```powershell
cd kardetecai-android
.\gradlew.bat assembleDebug
```

## Deployment

### Backend to Vercel

```bash
cd kardetecai-backend
vercel --prod
```

### Android release APK

```powershell
cd kardetecai-android
.\gradlew.bat assembleRelease
```

The release APK is generated at:

- [app-release.apk](/d:/test/NewAPP/kardetecai-android/app/build/outputs/apk/release/app-release.apk)

## Benchmarking

The backend now includes a repeatable benchmark runner so calibration can improve release by release instead of relying on one-off manual checks.

Run it with:

```bash
cd kardetecai-backend
npm run benchmark
```

The benchmark suite currently covers:

- human-written text samples
- AI-style text samples
- real-photo samples
- synthetic generator-style image samples

## Notes on accuracy

No detector can honestly promise 100% accuracy on every text, image, format, and editing workflow. The current version is tuned to be more reliable in practice by being less aggressive, more explainable, and more willing to say `Inconclusive` when the evidence is weak.

That tradeoff is intentional.

## Tech stack

Backend:

- Node.js
- Express
- Sharp
- Natural
- Vercel

Android:

- Kotlin
- Jetpack Compose
- Retrofit
- OkHttp
- Material 3

## License

MIT
