const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const helmet = require('helmet');
const compression = require('compression');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const natural = require('natural');
const compromise = require('compromise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: ['http://localhost:3000', 'https://*.vercel.app', '*'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'api_limit',
  points: 100,
  duration: 60,
});

const rateLimiterMiddleware = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch {
    res.status(429).json({ error: 'Too many requests' });
  }
};

app.use(rateLimiterMiddleware);

// File upload configuration
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// ============================================
// AI TEXT DETECTION ALGORITHM
// ============================================
class AITextDetector {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.commonAIPatterns = [
      /\b(furthermore|moreover|additionally|consequently|therefore|thus|hence)\b/gi,
      /\b(it is important to note that|it should be noted that|it is worth noting)\b/gi,
      /\b(in conclusion|to summarize|in summary|overall)\b/gi,
      /\b(delve|embark|navigate|landscape|realm|tapestry)\b/gi,
      /\b(robust|seamless|cutting-edge|state-of-the-art|leverage|harness)\b/gi,
    ];
    this.repetitivePatterns = /\b(\w+\s+\w+)\s+\1\b/gi;
  }

  analyze(text) {
    const metrics = {
      perplexity: this.calculatePerplexity(text),
      burstiness: this.calculateBurstiness(text),
      aiPatternScore: this.detectAIPatterns(text),
      semanticCoherence: this.checkSemanticCoherence(text),
      repetitionScore: this.checkRepetition(text),
      vocabularyDiversity: this.calculateVocabularyDiversity(text),
      sentenceStructure: this.analyzeSentenceStructure(text),
    };

    // Weighted scoring for accuracy
    const weights = {
      perplexity: 0.25,
      burstiness: 0.20,
      aiPatternScore: 0.15,
      semanticCoherence: 0.15,
      repetitionScore: 0.10,
      vocabularyDiversity: 0.10,
      sentenceStructure: 0.05,
    };

    let aiProbability = 0;
    let confidence = 0;

    // Perplexity: Lower perplexity often indicates AI (too predictable)
    if (metrics.perplexity < 50) {
      aiProbability += weights.perplexity * 0.9;
    } else if (metrics.perplexity < 100) {
      aiProbability += weights.perplexity * 0.5;
    } else {
      aiProbability += weights.perplexity * 0.1;
    }
    confidence += weights.perplexity;

    // Burstiness: AI tends to have consistent sentence lengths
    if (metrics.burstiness < 1.5) {
      aiProbability += weights.burstiness * 0.8;
    } else if (metrics.burstiness < 2.5) {
      aiProbability += weights.burstiness * 0.4;
    } else {
      aiProbability += weights.burstiness * 0.1;
    }
    confidence += weights.burstiness;

    // AI pattern detection
    aiProbability += metrics.aiPatternScore * weights.aiPatternScore;
    confidence += weights.aiPatternScore;

    // Semantic coherence
    aiProbability += (1 - metrics.semanticCoherence) * weights.semanticCoherence;
    confidence += weights.semanticCoherence;

    // Repetition score
    aiProbability += metrics.repetitionScore * weights.repetitionScore;
    confidence += weights.repetitionScore;

    // Vocabulary diversity
    if (metrics.vocabularyDiversity > 0.8) {
      aiProbability += weights.vocabularyDiversity * 0.7;
    }
    confidence += weights.vocabularyDiversity;

    // Sentence structure
    aiProbability += metrics.sentenceStructure * weights.sentenceStructure;
    confidence += weights.sentenceStructure;

    const finalScore = Math.min(99, Math.max(1, Math.round(aiProbability * 100)));
    const finalConfidence = Math.round(confidence * 100);

    return {
      aiProbability: finalScore,
      confidence: finalConfidence,
      metrics,
      verdict: finalScore > 70 ? 'AI Generated' : finalScore > 40 ? 'Possibly AI Generated' : 'Human Written',
    };
  }

  calculatePerplexity(text) {
    const words = this.tokenizer.tokenize(text.toLowerCase());
    if (words.length < 10) return 100;

    const uniqueWords = new Set(words);
    const probabilities = [];

    words.forEach((word, i) => {
      if (i > 0) {
        const prevWord = words[i - 1];
        const matches = words.filter((w, idx) => idx > 0 && words[idx - 1] === prevWord).length;
        const prob = matches / (words.length - 1);
        probabilities.push(prob > 0 ? prob : 0.001);
      }
    });

    if (probabilities.length === 0) return 100;

    const avgLogProb = probabilities.reduce((a, b) => a + Math.log(b), 0) / probabilities.length;
    return Math.exp(-avgLogProb) * 10;
  }

  calculateBurstiness(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    if (sentences.length < 2) return 0;

    const lengths = sentences.map(s => s.trim().split(/\s+/).length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);

    return stdDev / mean;
  }

  detectAIPatterns(text) {
    let score = 0;
    this.commonAIPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        score += matches.length * 0.1;
      }
    });
    return Math.min(1, score);
  }

  checkSemanticCoherence(text) {
    const doc = compromise(text);
    const nouns = doc.nouns().json();
    const verbs = doc.verbs().json();

    if (nouns.length === 0 || verbs.length === 0) return 0.5;

    const coherence = Math.min(1, (nouns.length + verbs.length) / (text.split(/\s+/).length * 0.3));
    return coherence;
  }

  checkRepetition(text) {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const uniqueWords = new Set(words);
    const repeated = words.length - uniqueWords.size;
    return Math.min(1, repeated / words.length * 3);
  }

  calculateVocabularyDiversity(text) {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    if (words.length === 0) return 0;
    const uniqueWords = new Set(words);
    return uniqueWords.size / words.length;
  }

  analyzeSentenceStructure(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let complexStructures = 0;

    sentences.forEach(sentence => {
      const clauses = sentence.split(/[,;]/).length;
      if (clauses > 2) complexStructures++;

      // Check for very uniform sentence starts
      const starts = sentences.map(s => s.trim().split(/\s+/)[0]?.toLowerCase());
      const uniqueStarts = new Set(starts);
      if (uniqueStarts.size / starts.length < 0.5) {
        complexStructures += 0.5;
      }
    });

    return Math.min(1, complexStructures / sentences.length);
  }
}

// ============================================
// AI IMAGE DETECTION ALGORITHM
// ============================================
class AIImageDetector {
  async analyze(imageBuffer) {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      const stats = await sharp(imageBuffer).stats();

      // Get image data for analysis
      const { data, info } = await sharp(imageBuffer)
        .raw()
        .ensureAlpha()
        .resize(256, 256, { fit: 'fill' })
        .toBuffer({ resolveWithObject: true });

      const metrics = {
        noisePattern: this.analyzeNoisePattern(data, info),
        colorDistribution: this.analyzeColorDistribution(data, info),
        edgeConsistency: this.analyzeEdgeConsistency(data, info),
        metadataAnalysis: this.analyzeMetadata(metadata),
        compressionArtifacts: this.detectCompressionArtifacts(stats),
        textureAnalysis: this.analyzeTexture(data, info),
        frequencyAnalysis: this.analyzeFrequency(data, info),
      };

      // Weighted scoring
      const weights = {
        noisePattern: 0.25,
        colorDistribution: 0.20,
        edgeConsistency: 0.20,
        metadataAnalysis: 0.10,
        compressionArtifacts: 0.10,
        textureAnalysis: 0.10,
        frequencyAnalysis: 0.05,
      };

      let aiProbability = 0;
      let confidence = 0;

      // Noise pattern: AI images often have specific noise characteristics
      if (metrics.noisePattern < 0.3) {
        aiProbability += weights.noisePattern * 0.85;
      } else if (metrics.noisePattern < 0.6) {
        aiProbability += weights.noisePattern * 0.5;
      } else {
        aiProbability += weights.noisePattern * 0.15;
      }
      confidence += weights.noisePattern;

      // Color distribution
      if (metrics.colorDistribution > 0.7) {
        aiProbability += weights.colorDistribution * 0.75;
      } else if (metrics.colorDistribution > 0.4) {
        aiProbability += weights.colorDistribution * 0.4;
      }
      confidence += weights.colorDistribution;

      // Edge consistency
      if (metrics.edgeConsistency < 0.4) {
        aiProbability += weights.edgeConsistency * 0.8;
      } else if (metrics.edgeConsistency < 0.7) {
        aiProbability += weights.edgeConsistency * 0.45;
      }
      confidence += weights.edgeConsistency;

      // Metadata analysis
      aiProbability += metrics.metadataAnalysis * weights.metadataAnalysis;
      confidence += weights.metadataAnalysis;

      // Compression artifacts
      aiProbability += metrics.compressionArtifacts * weights.compressionArtifacts;
      confidence += weights.compressionArtifacts;

      // Texture analysis
      aiProbability += (1 - metrics.textureAnalysis) * weights.textureAnalysis;
      confidence += weights.textureAnalysis;

      // Frequency analysis
      aiProbability += metrics.frequencyAnalysis * weights.frequencyAnalysis;
      confidence += weights.frequencyAnalysis;

      const finalScore = Math.min(99, Math.max(1, Math.round(aiProbability * 100)));
      const finalConfidence = Math.round(confidence * 100);

      return {
        aiProbability: finalScore,
        confidence: finalConfidence,
        metrics,
        verdict: finalScore > 70 ? 'AI Generated' : finalScore > 40 ? 'Possibly AI Generated' : 'Real Image',
        imageInfo: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
        }
      };
    } catch (error) {
      throw new Error(`Image analysis failed: ${error.message}`);
    }
  }

  analyzeNoisePattern(data, info) {
    let noiseScore = 0;
    const channels = info.channels;

    for (let y = 1; y < info.height - 1; y++) {
      for (let x = 1; x < info.width - 1; x++) {
        const idx = (y * info.width + x) * channels;

        for (let c = 0; c < 3; c++) {
          const pixel = data[idx + c];
          const neighbors = [
            data[((y - 1) * info.width + x) * channels + c],
            data[((y + 1) * info.width + x) * channels + c],
            data[(y * info.width + x - 1) * channels + c],
            data[(y * info.width + x + 1) * channels + c],
          ];

          const avgNeighbor = neighbors.reduce((a, b) => a + b, 0) / 4;
          noiseScore += Math.abs(pixel - avgNeighbor);
        }
      }
    }

    const normalizedNoise = noiseScore / (info.width * info.height * 3);
    return Math.min(1, normalizedNoise / 50);
  }

  analyzeColorDistribution(data, info) {
    const colorBins = new Map();
    const channels = info.channels;

    for (let i = 0; i < data.length; i += channels) {
      const r = Math.floor(data[i] / 16);
      const g = Math.floor(data[i + 1] / 16);
      const b = Math.floor(data[i + 2] / 16);
      const key = `${r},${g},${b}`;
      colorBins.set(key, (colorBins.get(key) || 0) + 1);
    }

    const totalPixels = data.length / channels;
    const probabilities = Array.from(colorBins.values()).map(count => count / totalPixels);
    const entropy = -probabilities.reduce((sum, p) => sum + p * Math.log2(p), 0);

    // AI images often have lower entropy (more uniform colors)
    const normalizedEntropy = entropy / 12; // Max entropy for 12-bit color
    return 1 - Math.min(1, normalizedEntropy);
  }

  analyzeEdgeConsistency(data, info) {
    const edges = [];
    const channels = info.channels;
    const threshold = 30;

    for (let y = 1; y < info.height - 1; y++) {
      for (let x = 1; x < info.width - 1; x++) {
        const idx = (y * info.width + x) * channels;
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

        // Sobel edge detection
        const gx = (
          -1 * data[((y - 1) * info.width + x - 1) * channels] +
          1 * data[((y - 1) * info.width + x + 1) * channels] +
          -2 * data[(y * info.width + x - 1) * channels] +
          2 * data[(y * info.width + x + 1) * channels] +
          -1 * data[((y + 1) * info.width + x - 1) * channels] +
          1 * data[((y + 1) * info.width + x + 1) * channels]
        ) / 4;

        const gy = (
          -1 * data[((y - 1) * info.width + x - 1) * channels] +
          -2 * data[((y - 1) * info.width + x) * channels] +
          -1 * data[((y - 1) * info.width + x + 1) * channels] +
          1 * data[((y + 1) * info.width + x - 1) * channels] +
          2 * data[((y + 1) * info.width + x) * channels] +
          1 * data[((y + 1) * info.width + x + 1) * channels]
        ) / 4;

        const magnitude = Math.sqrt(gx * gx + gy * gy);
        if (magnitude > threshold) {
          edges.push({ x, y, magnitude });
        }
      }
    }

    // AI images often have too perfect edges
    const edgeDensity = edges.length / (info.width * info.height);
    const edgeUniformity = this.calculateEdgeUniformity(edges);

    return edgeDensity * (1 - edgeUniformity * 0.5);
  }

  calculateEdgeUniformity(edges) {
    if (edges.length < 10) return 0;

    const magnitudes = edges.map(e => e.magnitude);
    const mean = magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
    const variance = magnitudes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / magnitudes.length;

    // Low variance = uniform edges (suspicious)
    return Math.min(1, 1000 / (variance + 1));
  }

  analyzeMetadata(metadata) {
    let score = 0;

    // Check for AI generation markers
    if (metadata.exif) {
      const exifStr = JSON.stringify(metadata.exif).toLowerCase();
      if (exifStr.includes('ai') || exifStr.includes('generated') || exifStr.includes('dall-e') ||
          exifStr.includes('midjourney') || exifStr.includes('stable-diffusion')) {
        score += 1;
      }
    }

    // Check for common AI resolutions
    const aiResolutions = [
      [1024, 1024], [512, 512], [768, 768],
      [1024, 768], [768, 1024], [512, 768], [768, 512]
    ];

    const isAIResolution = aiResolutions.some(([w, h]) =>
      (metadata.width === w && metadata.height === h) ||
      (metadata.width === h && metadata.height === w)
    );

    if (isAIResolution) {
      score += 0.3;
    }

    return Math.min(1, score);
  }

  detectCompressionArtifacts(stats) {
    // Check for unnatural compression patterns
    const channels = stats.channels;
    let artifactScore = 0;

    channels.forEach(channel => {
      // AI images often have specific histogram characteristics
      const dynamicRange = channel.max - channel.min;
      if (dynamicRange > 250) {
        artifactScore += 0.1;
      }

      // Check for histogram peaks (AI often creates specific patterns)
      const stdDev = channel.std;
      if (stdDev < 20 || stdDev > 80) {
        artifactScore += 0.15;
      }
    });

    return Math.min(1, artifactScore);
  }

  analyzeTexture(data, info) {
    const channels = info.channels;
    let textureScore = 0;
    const blockSize = 8;

    for (let y = 0; y < info.height - blockSize; y += blockSize) {
      for (let x = 0; x < info.width - blockSize; x += blockSize) {
        let blockVariance = 0;

        for (let by = 0; by < blockSize; by++) {
          for (let bx = 0; bx < blockSize; bx++) {
            const idx = ((y + by) * info.width + (x + bx)) * channels;
            const pixel = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            blockVariance += Math.pow(pixel - 128, 2);
          }
        }

        blockVariance /= (blockSize * blockSize);
        textureScore += Math.sqrt(blockVariance);
      }
    }

    const blocksCount = ((info.width / blockSize) * (info.height / blockSize));
    const avgTexture = textureScore / blocksCount;

    // Normalize to 0-1
    return Math.min(1, avgTexture / 100);
  }

  analyzeFrequency(data, info) {
    // Simple frequency analysis
    const channels = info.channels;
    let highFreq = 0;
    let totalFreq = 0;

    for (let y = 0; y < info.height; y += 2) {
      for (let x = 0; x < info.width; x += 2) {
        const idx = (y * info.width + x) * channels;
        const nextX = (y * info.width + Math.min(x + 1, info.width - 1)) * channels;
        const nextY = (Math.min(y + 1, info.height - 1) * info.width + x) * channels;

        const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const right = (data[nextX] + data[nextX + 1] + data[nextX + 2]) / 3;
        const bottom = (data[nextY] + data[nextY + 1] + data[nextY + 2]) / 3;

        const diffX = Math.abs(current - right);
        const diffY = Math.abs(current - bottom);

        if (diffX > 10 || diffY > 10) {
          highFreq++;
        }
        totalFreq++;
      }
    }

    // AI images often lack high frequency details
    return 1 - (highFreq / totalFreq);
  }
}

// Initialize detectors
const textDetector = new AITextDetector();
const imageDetector = new AIImageDetector();

// ============================================
// API ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Text detection endpoint
app.post('/api/detect/text', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (text.length < 50) {
      return res.status(400).json({ error: 'Text must be at least 50 characters for accurate analysis' });
    }

    if (text.length > 10000) {
      return res.status(400).json({ error: 'Text exceeds maximum length of 10,000 characters' });
    }

    const result = textDetector.analyze(text);

    res.json({
      success: true,
      type: 'text',
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Text detection error:', error);
    res.status(500).json({ error: 'Detection failed', message: error.message });
  }
});

// Image detection endpoint
app.post('/api/detect/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const result = await imageDetector.analyze(req.file.buffer);

    res.json({
      success: true,
      type: 'image',
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Image detection error:', error);
    res.status(500).json({ error: 'Detection failed', message: error.message });
  }
});

// Combined detection endpoint
app.post('/api/detect', upload.single('image'), async (req, res) => {
  try {
    const { text } = req.body;
    const hasImage = !!req.file;
    const hasText = text && typeof text === 'string' && text.length >= 50;

    if (!hasImage && !hasText) {
      return res.status(400).json({
        error: 'Please provide either an image or at least 50 characters of text'
      });
    }

    const results = {};

    if (hasText) {
      results.text = textDetector.analyze(text);
    }

    if (hasImage) {
      results.image = await imageDetector.analyze(req.file.buffer);
    }

    res.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Detection error:', error);
    res.status(500).json({ error: 'Detection failed', message: error.message });
  }
});

// Get detection statistics
app.get('/api/stats', (req, res) => {
  res.json({
    endpoints: {
      text: '/api/detect/text',
      image: '/api/detect/image',
      combined: '/api/detect'
    },
    features: [
      'AI Text Detection',
      'AI Image Detection',
      'High Accuracy Algorithm',
      'Detailed Metrics',
      'Rate Limiting'
    ],
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`KardetecAI Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
