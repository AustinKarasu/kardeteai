const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const helmet = require('helmet');
const compression = require('compression');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const natural = require('natural');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const APP_VERSION = '1.1.0';

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Analysis-Mode'],
}));
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));

const rateLimiter = new RateLimiterMemory({
  keyPrefix: 'api_limit',
  points: 100,
  duration: 60,
});

app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch {
    res.status(429).json({ error: 'Too many requests' });
  }
});

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image files are allowed'));
  },
});

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const average = (values) => values.length
  ? values.reduce((sum, value) => sum + value, 0) / values.length
  : 0;
const safeDivide = (value, divisor) => (divisor === 0 ? 0 : value / divisor);

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function splitSentences(text) {
  return text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((item) => item.trim()).filter(Boolean) || [];
}

function countMatches(text, pattern) {
  return text.match(pattern)?.length || 0;
}

function uniqueRatio(items) {
  if (items.length === 0) {
    return 0;
  }
  return new Set(items).size / items.length;
}

function weightedScore(signals, maxWeight = null) {
  if (signals.length === 0) {
    return 0;
  }

  const totalWeight = maxWeight ?? signals.reduce((sum, signal) => sum + signal.weight, 0);
  const weightedTotal = signals.reduce((sum, signal) => sum + (signal.value * signal.weight), 0);
  return clamp(weightedTotal / totalWeight);
}

function pickHighlights(primarySignals, fallbackSignals) {
  const signals = [...primarySignals]
    .sort((left, right) => (right.value * right.weight) - (left.value * left.weight))
    .slice(0, 3)
    .map((signal) => signal.label);

  if (signals.length > 0) {
    return signals;
  }

  return [...fallbackSignals]
    .sort((left, right) => (right.value * right.weight) - (left.value * left.weight))
    .slice(0, 3)
    .map((signal) => signal.label);
}

function buildVerdict(scorePercent, mode, humanVerdict, aiVerdict) {
  const aiThreshold = mode === 'balanced' ? 70 : 78;
  const inconclusiveThreshold = mode === 'balanced' ? 42 : 48;

  if (scorePercent >= aiThreshold) {
    return aiVerdict;
  }
  if (scorePercent >= inconclusiveThreshold) {
    return 'Inconclusive';
  }
  return humanVerdict;
}

function buildConfidence(score, positiveScore, stabilizingScore) {
  const margin = Math.abs(score - 0.5);
  const evidence = average([positiveScore, stabilizingScore]);
  return Math.round(clamp(55 + margin * 70 + evidence * 12, 55, 95));
}

class AITextDetector {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.commonAIPatterns = [
      /\b(furthermore|moreover|additionally|consequently|therefore|thus|hence)\b/gi,
      /\b(it is important to note that|it should be noted that|it is worth noting)\b/gi,
      /\b(in conclusion|to summarize|in summary|overall)\b/gi,
      /\b(delve into|navigate the|in today's landscape|ever-evolving)\b/gi,
      /\b(robust|seamless|cutting-edge|state-of-the-art|leverage|harness)\b/gi,
    ];
  }

  analyze(text, mode = 'conservative') {
    const normalizedText = normalizeWhitespace(text);
    const sentences = splitSentences(normalizedText);
    const words = this.tokenizer.tokenize(normalizedText.toLowerCase());
    const metrics = this.buildMetrics(normalizedText, words, sentences);

    const suspiciousSignals = this.buildSuspiciousSignals(metrics);
    const humanSignals = this.buildHumanSignals(metrics);

    const suspiciousScore = weightedScore(suspiciousSignals, 3.8);
    const humanScore = weightedScore(humanSignals, 4.45);

    let rawScore = 0.42 + (suspiciousScore * 0.52) - (humanScore * 0.34);

    if (metrics.patternDensity > 0.28 && metrics.sentenceVariation < 0.28 && metrics.repetitionRisk > 0.15) {
      rawScore += 0.08;
    }
    if (metrics.patternDensity > 0.6 && metrics.sentenceVariation < 0.3 && metrics.humanSignal < 0.3) {
      rawScore += 0.08;
    }

    if (metrics.humanSignal > 0.72 && metrics.patternDensity < 0.08) {
      rawScore -= 0.08;
    }

    rawScore = clamp(rawScore, 0.05, 0.95);

    const aiProbability = Math.round(rawScore * 100);
    const verdict = buildVerdict(
      aiProbability,
      mode,
      'Likely Human-Written',
      'Likely AI-Generated'
    );
    const confidence = buildConfidence(rawScore, suspiciousScore, humanScore);

    return {
      aiProbability,
      confidence,
      verdict,
      summary: this.buildSummary(verdict, mode),
      highlights: verdict === 'Likely AI-Generated'
        ? pickHighlights(suspiciousSignals, humanSignals)
        : verdict === 'Likely Human-Written'
          ? pickHighlights(humanSignals, suspiciousSignals)
          : pickHighlights(
            [...suspiciousSignals.slice(0, 2), ...humanSignals.slice(0, 2)],
            [...suspiciousSignals, ...humanSignals]
          ),
      metrics,
    };
  }

  buildMetrics(text, words, sentences) {
    const paragraphs = text.split(/\n\s*\n/).filter(Boolean).length;
    const sentenceLengths = sentences.map((sentence) => sentence.split(/\s+/).filter(Boolean).length);
    const meanSentenceLength = average(sentenceLengths);
    const sentenceVariance = average(sentenceLengths.map((length) => Math.pow(length - meanSentenceLength, 2)));
    const sentenceVariationRaw = meanSentenceLength > 0 ? Math.sqrt(sentenceVariance) / meanSentenceLength : 0;

    const bigrams = [];
    const trigrams = [];
    for (let index = 0; index < words.length - 1; index += 1) {
      bigrams.push(`${words[index]} ${words[index + 1]}`);
    }
    for (let index = 0; index < words.length - 2; index += 1) {
      trigrams.push(`${words[index]} ${words[index + 1]} ${words[index + 2]}`);
    }

    const repeatedBigramRatio = 1 - uniqueRatio(bigrams);
    const repeatedTrigramRatio = 1 - uniqueRatio(trigrams);
    const repetitionRisk = clamp((repeatedBigramRatio * 0.65) + (repeatedTrigramRatio * 1.25), 0, 1);

    const lexicalDiversity = uniqueRatio(words);
    const vocabularyBalance = clamp(1 - Math.abs(lexicalDiversity - 0.45) / 0.28, 0, 1);

    const starterWords = sentences
      .map((sentence) => sentence.split(/\s+/)[0]?.replace(/[^a-zA-Z']/g, '').toLowerCase())
      .filter(Boolean);
    const starterDiversity = uniqueRatio(starterWords);

    const punctuationMarks = Array.from(text.match(/[,:;!?'"()-]/g) || []);
    const punctuationVariety = clamp(new Set(punctuationMarks).size / 8, 0, 1);

    const contractionMatches = countMatches(text.toLowerCase(), /\b\w+'(?:t|re|ve|ll|d|m|s)\b/g);
    const contractionSignal = clamp(safeDivide(contractionMatches, words.length) / 0.035, 0, 1);

    const patternHits = this.commonAIPatterns.reduce(
      (total, pattern) => total + countMatches(text, pattern),
      0
    );
    const patternDensity = clamp(safeDivide(patternHits, Math.max(sentences.length, 1) * 1.5), 0, 1);

    const sentenceVariation = clamp(
      sentences.length < 3
        ? Math.max(0.45, sentenceVariationRaw / 0.65)
        : sentenceVariationRaw / 0.65,
      0,
      1
    );
    const structureBalance = clamp(average([
      starterDiversity,
      punctuationVariety,
      paragraphs > 1 ? 0.7 : 0.45,
    ]), 0, 1);

    const humanSignal = clamp(average([
      sentenceVariation,
      vocabularyBalance,
      structureBalance,
      contractionSignal,
    ]), 0, 1);

    return {
      patternDensity,
      sentenceVariation,
      repetitionRisk,
      vocabularyBalance,
      structureBalance,
      humanSignal,
    };
  }

  buildSuspiciousSignals(metrics) {
    const signals = [];

    if (metrics.patternDensity > 0.12) {
      signals.push({
        label: 'Formulaic transition phrases appear more often than expected.',
        value: clamp((metrics.patternDensity - 0.12) / 0.42),
        weight: 1.15,
      });
    }
    if (metrics.repetitionRisk > 0.12) {
      signals.push({
        label: 'Repeated phrasing patterns make the writing look more templated.',
        value: clamp((metrics.repetitionRisk - 0.12) / 0.4),
        weight: 1.0,
      });
    }
    if (metrics.sentenceVariation < 0.35) {
      signals.push({
        label: 'Sentence lengths are unusually uniform.',
        value: clamp((0.35 - metrics.sentenceVariation) / 0.35),
        weight: 0.9,
      });
    }
    if (metrics.structureBalance < 0.45) {
      signals.push({
        label: 'The overall structure looks more regular than natural writing usually does.',
        value: clamp((0.45 - metrics.structureBalance) / 0.45),
        weight: 0.75,
      });
    }

    return signals;
  }

  buildHumanSignals(metrics) {
    const signals = [];

    if (metrics.sentenceVariation > 0.5) {
      signals.push({
        label: 'Sentence lengths vary naturally across the passage.',
        value: clamp((metrics.sentenceVariation - 0.5) / 0.5),
        weight: 1.0,
      });
    }
    if (metrics.vocabularyBalance > 0.62) {
      signals.push({
        label: 'Word choice looks balanced rather than overly polished or repetitive.',
        value: clamp((metrics.vocabularyBalance - 0.62) / 0.38),
        weight: 0.95,
      });
    }
    if (metrics.structureBalance > 0.58) {
      signals.push({
        label: 'The structure has enough variation to look human-composed.',
        value: clamp((metrics.structureBalance - 0.58) / 0.42),
        weight: 0.85,
      });
    }
    if (metrics.humanSignal > 0.64) {
      signals.push({
        label: 'Multiple human-like writing signals align in the sample.',
        value: clamp((metrics.humanSignal - 0.64) / 0.36),
        weight: 0.9,
      });
    }
    if (metrics.patternDensity < 0.06 && metrics.repetitionRisk < 0.08) {
      signals.push({
        label: 'There are few formulaic or repeated patterns in the writing.',
        value: 0.72,
        weight: 0.75,
      });
    }

    return signals;
  }

  buildSummary(verdict, mode) {
    if (verdict === 'Likely AI-Generated') {
      return mode === 'balanced'
        ? 'Several suspicious writing signals aligned strongly enough to treat this as likely AI-generated.'
        : 'Multiple suspicious writing signals aligned even under conservative scoring, so this sample is treated as likely AI-generated.';
    }
    if (verdict === 'Likely Human-Written') {
      return 'The writing shows enough natural variation and balance to lean human-written rather than machine-generated.';
    }
    return 'The sample contains mixed signals, so the result is best treated as inconclusive rather than a hard verdict.';
  }
}

class AIImageDetector {
  async analyze(imageBuffer, mode = 'conservative') {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      const stats = await sharp(imageBuffer).stats();
      const { data, info } = await sharp(imageBuffer)
        .raw()
        .ensureAlpha()
        .resize(256, 256, { fit: 'fill' })
        .toBuffer({ resolveWithObject: true });

      const metrics = this.buildMetrics(metadata, stats, data, info);
      const suspiciousSignals = this.buildSuspiciousSignals(metrics);
      const humanSignals = this.buildHumanSignals(metrics);

      const suspiciousScore = weightedScore(suspiciousSignals, 3.9);
      const humanScore = weightedScore(humanSignals, 2.8);

      let rawScore = 0.38 + (suspiciousScore * 0.58) - (humanScore * 0.32);

      if (metrics.metadataRisk > 0.95) {
        rawScore += 0.18;
      }
      if (metrics.photoSignal > 0.72 && metrics.metadataRisk < 0.1) {
        rawScore -= 0.12;
      }

      rawScore = clamp(rawScore, 0.05, 0.95);

      const aiProbability = Math.round(rawScore * 100);
      const verdict = buildVerdict(
        aiProbability,
        mode,
        'Likely Human-Captured',
        'Likely AI-Generated'
      );
      const confidence = buildConfidence(rawScore, suspiciousScore, humanScore);

      return {
        aiProbability,
        confidence,
        verdict,
        summary: this.buildSummary(verdict, mode),
        highlights: verdict === 'Likely AI-Generated'
          ? pickHighlights(suspiciousSignals, humanSignals)
          : verdict === 'Likely Human-Captured'
            ? pickHighlights(humanSignals, suspiciousSignals)
            : pickHighlights(
              [...suspiciousSignals.slice(0, 2), ...humanSignals.slice(0, 2)],
              [...suspiciousSignals, ...humanSignals]
            ),
        metrics,
        imageInfo: {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
        },
      };
    } catch (error) {
      throw new Error(`Image analysis failed: ${error.message}`);
    }
  }

  buildMetrics(metadata, stats, data, info) {
    const exifText = metadata.exif ? String(metadata.exif).toLowerCase() : '';
    const metadataRisk = this.getMetadataRisk(exifText);
    const generatorPatternRisk = this.getGeneratorPatternRisk(metadata.width || 0, metadata.height || 0);

    const noiseLevel = this.analyzeNoiseLevel(data, info);
    const noiseBalance = clamp(1 - Math.abs(noiseLevel - 0.38) / 0.38, 0, 1);
    const colorEntropy = this.analyzeColorEntropy(data, info);
    const textureLevel = this.analyzeTextureLevel(data, info);
    const edgeProfile = this.analyzeEdgeProfile(data, info);
    const detailBalance = clamp(average([
      noiseBalance,
      clamp(textureLevel / 0.55, 0, 1),
      clamp(colorEntropy / 0.65, 0, 1),
      edgeProfile.edgeNaturalness,
    ]), 0, 1);

    const smoothnessRisk = clamp(average([
      1 - noiseBalance,
      1 - detailBalance,
      1 - clamp(textureLevel / 0.5, 0, 1),
    ]), 0, 1);

    const artifactRisk = this.detectCompressionArtifacts(stats);
    const photoSignal = this.getPhotoSignal(metadata, detailBalance, noiseBalance);

    return {
      metadataRisk,
      generatorPatternRisk,
      smoothnessRisk,
      artifactRisk,
      photoSignal,
      detailBalance,
    };
  }

  getMetadataRisk(exifText) {
    if (!exifText) {
      return 0;
    }

    const aiMarkers = ['midjourney', 'stable diffusion', 'dall-e', 'firefly', 'generated', 'prompt'];
    if (aiMarkers.some((marker) => exifText.includes(marker))) {
      return 1;
    }
    return 0;
  }

  getGeneratorPatternRisk(width, height) {
    const knownGeneratorSizes = new Set([
      '512x512', '768x768', '1024x1024', '1152x896', '896x1152',
      '1216x832', '832x1216', '1344x768', '768x1344', '1536x1024', '1024x1536',
    ]);
    const key = `${width}x${height}`;

    if (knownGeneratorSizes.has(key)) {
      return 1;
    }

    const square = width === height;
    const divisibleBy64 = width % 64 === 0 && height % 64 === 0;

    if (square && divisibleBy64 && width >= 512 && width <= 2048) {
      return 0.62;
    }

    if (divisibleBy64 && width >= 768 && height >= 768) {
      return 0.35;
    }

    return 0.08;
  }

  analyzeNoiseLevel(data, info) {
    let noiseTotal = 0;
    const channels = info.channels;

    for (let y = 1; y < info.height - 1; y += 1) {
      for (let x = 1; x < info.width - 1; x += 1) {
        const index = (y * info.width + x) * channels;

        for (let channel = 0; channel < 3; channel += 1) {
          const pixel = data[index + channel];
          const neighbors = [
            data[((y - 1) * info.width + x) * channels + channel],
            data[((y + 1) * info.width + x) * channels + channel],
            data[(y * info.width + x - 1) * channels + channel],
            data[(y * info.width + x + 1) * channels + channel],
          ];
          const averageNeighbor = average(neighbors);
          noiseTotal += Math.abs(pixel - averageNeighbor);
        }
      }
    }

    const normalizedNoise = noiseTotal / (info.width * info.height * 3);
    return clamp(normalizedNoise / 45, 0, 1);
  }

  analyzeColorEntropy(data, info) {
    const colorBins = new Map();
    const channels = info.channels;

    for (let index = 0; index < data.length; index += channels) {
      const red = Math.floor(data[index] / 16);
      const green = Math.floor(data[index + 1] / 16);
      const blue = Math.floor(data[index + 2] / 16);
      const key = `${red},${green},${blue}`;
      colorBins.set(key, (colorBins.get(key) || 0) + 1);
    }

    const totalPixels = data.length / channels;
    const probabilities = Array.from(colorBins.values()).map((count) => count / totalPixels);
    const entropy = -probabilities.reduce((sum, probability) => sum + (probability * Math.log2(probability)), 0);
    return clamp(entropy / 12, 0, 1);
  }

  analyzeTextureLevel(data, info) {
    const channels = info.channels;
    const blockSize = 8;
    let textureTotal = 0;
    let blocks = 0;

    for (let y = 0; y < info.height - blockSize; y += blockSize) {
      for (let x = 0; x < info.width - blockSize; x += blockSize) {
        let blockVariance = 0;

        for (let innerY = 0; innerY < blockSize; innerY += 1) {
          for (let innerX = 0; innerX < blockSize; innerX += 1) {
            const index = ((y + innerY) * info.width + (x + innerX)) * channels;
            const value = (data[index] + data[index + 1] + data[index + 2]) / 3;
            blockVariance += Math.pow(value - 128, 2);
          }
        }

        textureTotal += Math.sqrt(blockVariance / (blockSize * blockSize));
        blocks += 1;
      }
    }

    return clamp(safeDivide(textureTotal, Math.max(blocks, 1)) / 100, 0, 1);
  }

  analyzeEdgeProfile(data, info) {
    const channels = info.channels;
    const magnitudes = [];
    const threshold = 30;

    for (let y = 1; y < info.height - 1; y += 1) {
      for (let x = 1; x < info.width - 1; x += 1) {
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

        const magnitude = Math.sqrt((gx * gx) + (gy * gy));
        if (magnitude > threshold) {
          magnitudes.push(magnitude);
        }
      }
    }

    if (magnitudes.length === 0) {
      return {
        edgeDensity: 0,
        edgeUniformity: 1,
        edgeNaturalness: 0,
      };
    }

    const mean = average(magnitudes);
    const variance = average(magnitudes.map((value) => Math.pow(value - mean, 2)));
    const edgeDensity = magnitudes.length / (info.width * info.height);
    const edgeUniformity = clamp(1000 / (variance + 1), 0, 1);
    const edgeNaturalness = clamp((edgeDensity / 0.18) * (1 - edgeUniformity * 0.6), 0, 1);

    return { edgeDensity, edgeUniformity, edgeNaturalness };
  }

  detectCompressionArtifacts(stats) {
    let artifactScore = 0;

    stats.channels.forEach((channel) => {
      const dynamicRange = channel.max - channel.min;
      if (dynamicRange > 250) {
        artifactScore += 0.08;
      }
      if (channel.std < 18 || channel.std > 88) {
        artifactScore += 0.12;
      }
    });

    return clamp(artifactScore, 0, 1);
  }

  getPhotoSignal(metadata, detailBalance, noiseBalance) {
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    const ratio = height === 0 ? 1 : width / height;
    const exifText = metadata.exif ? String(metadata.exif).toLowerCase() : '';
    const cameraMarkers = ['canon', 'nikon', 'sony', 'fujifilm', 'olympus', 'apple', 'iphone', 'pixel', 'google', 'samsung'];
    const hasCameraMarker = cameraMarkers.some((marker) => exifText.includes(marker));

    const cameraSignal = hasCameraMarker ? 1 : 0;
    const aspectSignal = clamp(1 - Math.abs(ratio - 1.33), 0.2, 0.95);
    const nonSquareBonus = width !== height ? 0.18 : 0;

    return clamp(average([
      detailBalance,
      noiseBalance,
      aspectSignal,
      cameraSignal,
    ]) + nonSquareBonus, 0, 1);
  }

  buildSuspiciousSignals(metrics) {
    const signals = [];

    if (metrics.metadataRisk > 0.9) {
      signals.push({
        label: 'Embedded metadata strongly suggests an AI generation tool.',
        value: metrics.metadataRisk,
        weight: 1.35,
      });
    }
    if (metrics.generatorPatternRisk > 0.35) {
      signals.push({
        label: 'The dimensions match common generator-friendly output sizes.',
        value: metrics.generatorPatternRisk,
        weight: 1.0,
      });
    }
    if (metrics.smoothnessRisk > 0.55) {
      signals.push({
        label: 'Surface detail looks smoother and more synthetic than a typical photo.',
        value: clamp((metrics.smoothnessRisk - 0.55) / 0.45),
        weight: 0.9,
      });
    }
    if (metrics.artifactRisk > 0.45) {
      signals.push({
        label: 'Histogram and compression patterns look less like a straightforward camera capture.',
        value: clamp((metrics.artifactRisk - 0.45) / 0.55),
        weight: 0.65,
      });
    }

    return signals;
  }

  buildHumanSignals(metrics) {
    const signals = [];

    if (metrics.photoSignal > 0.58) {
      signals.push({
        label: 'The image behaves more like a camera capture or edited real photo.',
        value: clamp((metrics.photoSignal - 0.58) / 0.42),
        weight: 1.05,
      });
    }
    if (metrics.detailBalance > 0.55) {
      signals.push({
        label: 'Detail levels and local variation look natural rather than overly smooth.',
        value: clamp((metrics.detailBalance - 0.55) / 0.45),
        weight: 0.95,
      });
    }
    if (metrics.metadataRisk === 0 && metrics.generatorPatternRisk < 0.25) {
      signals.push({
        label: 'No strong AI-only metadata or generator-size signals were found.',
        value: 0.72,
        weight: 0.8,
      });
    }

    return signals;
  }

  buildSummary(verdict, mode) {
    if (verdict === 'Likely AI-Generated') {
      return mode === 'balanced'
        ? 'Several visual signals lean synthetic, so this image is treated as likely AI-generated.'
        : 'Even under conservative scoring, the image still carries multiple generator-like signals.';
    }
    if (verdict === 'Likely Human-Captured') {
      return 'The image shows more photo-like characteristics than generator-only patterns, so it leans human-captured.';
    }
    return 'The visual signals are mixed, so the safest result is inconclusive rather than an overconfident label.';
  }
}

const textDetector = new AITextDetector();
const imageDetector = new AIImageDetector();

function resolveAnalysisMode(req) {
  return req.header('X-Analysis-Mode') === 'balanced' ? 'balanced' : 'conservative';
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
  });
});

app.post('/api/detect/text', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }
    if (text.length < 50) {
      return res.status(400).json({ error: 'Text must be at least 50 characters for analysis' });
    }
    if (text.length > 10000) {
      return res.status(400).json({ error: 'Text exceeds the maximum length of 10,000 characters' });
    }

    const result = textDetector.analyze(text, resolveAnalysisMode(req));

    res.json({
      success: true,
      type: 'text',
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Text detection error:', error);
    res.status(500).json({ error: 'Detection failed', message: error.message });
  }
});

app.post('/api/detect/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const result = await imageDetector.analyze(req.file.buffer, resolveAnalysisMode(req));

    res.json({
      success: true,
      type: 'image',
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Image detection error:', error);
    res.status(500).json({ error: 'Detection failed', message: error.message });
  }
});

app.post('/api/detect', upload.single('image'), async (req, res) => {
  try {
    const { text } = req.body;
    const mode = resolveAnalysisMode(req);
    const hasImage = !!req.file;
    const hasText = typeof text === 'string' && text.trim().length >= 50;

    if (!hasImage && !hasText) {
      return res.status(400).json({
        error: 'Please provide either an image or at least 50 characters of text',
      });
    }

    const results = {};

    if (hasText) {
      results.text = textDetector.analyze(text, mode);
    }
    if (hasImage) {
      results.image = await imageDetector.analyze(req.file.buffer, mode);
    }

    res.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Combined detection error:', error);
    res.status(500).json({ error: 'Detection failed', message: error.message });
  }
});

app.get('/api/stats', (req, res) => {
  res.json({
    endpoints: {
      health: '/api/health',
      text: '/api/detect/text',
      image: '/api/detect/image',
      combined: '/api/detect',
    },
    modes: ['conservative', 'balanced'],
    features: [
      'Conservative scoring to reduce false positives',
      'Explainable result summaries and highlights',
      'Text and image analysis',
      'Service health checks',
      'Rate limiting',
    ],
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`KardetecAI Backend running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
