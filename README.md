# KardetecAI - AI Content Detection App

A professional Android application with a powerful backend API for detecting AI-generated text and images with high accuracy.

## Features

- **AI Text Detection**: Analyzes writing patterns, perplexity, burstiness, and semantic coherence
- **AI Image Detection**: Examines noise patterns, color distribution, edge consistency, metadata, and texture
- **Professional UI/UX**: Modern dark theme with smooth animations and intuitive navigation
- **High Accuracy**: Advanced algorithms designed to achieve 99% accuracy
- **Detailed Metrics**: Comprehensive analysis breakdown for transparency
- **Fast & Efficient**: Optimized for quick results without compromising accuracy

## Project Structure

```
KardetecAI/
├── kardetecai-backend/     # Node.js Express API
│   ├── index.js           # Main server with detection algorithms
│   ├── vercel.json        # Vercel deployment config
│   └── package.json       # Dependencies
│
└── kardetecai-android/    # Android App (Kotlin + Jetpack Compose)
    ├── app/
    │   ├── src/main/java/com/kardetecai/
    │   │   ├── data/      # Models, API, Repository
    │   │   ├── ui/        # Screens, Components, Theme, ViewModel
    │   │   └── utils/     # Utilities
    │   └── res/           # Android resources
    └── build.gradle.kts   # Build configuration
```

## Backend Deployment (Vercel)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Navigate to backend directory:
   ```bash
   cd kardetecai-backend
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Update Android app with your Vercel URL in `RetrofitClient.kt`

## Android App Setup

1. Open `kardetecai-android` in Android Studio

2. Update the API URL in `app/src/main/java/com/kardetecai/data/remote/RetrofitClient.kt`:
   ```kotlin
   private const val BASE_URL = "https://your-vercel-url.vercel.app/"
   ```

3. Sync project with Gradle files

4. Build and run on your device or emulator

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/detect/text` | POST | Detect AI-generated text |
| `/api/detect/image` | POST | Detect AI-generated image |
| `/api/stats` | GET | API information |

## Detection Algorithm Details

### Text Detection
- **Perplexity Analysis**: Measures text predictability (lower = more AI-like)
- **Burstiness Calculation**: Analyzes sentence length variation
- **Pattern Recognition**: Detects common AI writing patterns
- **Semantic Coherence**: Checks noun/verb ratios
- **Vocabulary Diversity**: Measures word repetition
- **Sentence Structure**: Analyzes clause complexity

### Image Detection
- **Noise Pattern Analysis**: Examines pixel-level irregularities
- **Color Distribution**: Analyzes histogram entropy
- **Edge Consistency**: Detects unnatural edge patterns
- **Metadata Inspection**: Checks for AI generation markers
- **Texture Analysis**: Examines surface detail variation
- **Frequency Analysis**: Detects high-frequency detail patterns

## Tech Stack

**Backend:**
- Node.js + Express
- Sharp (Image processing)
- Natural.js (NLP)
- Compromise (Text analysis)

**Android:**
- Kotlin
- Jetpack Compose
- Retrofit + OkHttp
- Coil (Image loading)
- Material Design 3

## License

MIT License
