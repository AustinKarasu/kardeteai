const fs = require('fs');
const path = require('path');
const http = require('http');
const sharp = require('sharp');

process.env.VERCEL = '1';

const app = require('../index');
const fixtures = require('../benchmarks/fixtures.json');

const cacheDir = path.join(__dirname, '..', 'benchmarks', 'cache');
fs.mkdirSync(cacheDir, { recursive: true });

function createServer() {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

async function loadImageAsset(testCase) {
  if (testCase.url.startsWith('synthetic://')) {
    const preset = testCase.url.replace('synthetic://', '');
    const filePath = path.join(cacheDir, `${testCase.id}.png`);

    if (!fs.existsSync(filePath)) {
      const svg = buildSyntheticSvg(preset);
      const buffer = await sharp(Buffer.from(svg))
        .png()
        .toBuffer();
      fs.writeFileSync(filePath, buffer);
    }

    return {
      filePath,
      buffer: fs.readFileSync(filePath),
      contentType: 'image/png',
    };
  }

  const metaPath = path.join(cacheDir, `${testCase.id}.json`);
  let filePath;
  let contentType;

  if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    filePath = path.join(cacheDir, meta.fileName);
    contentType = meta.contentType;
  } else {
    const response = await fetch(testCase.url);
    if (!response.ok) {
      throw new Error(`Failed to download ${testCase.id}: ${response.status}`);
    }

    contentType = response.headers.get('content-type') || 'application/octet-stream';
    const extensionMap = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    const extension = extensionMap[contentType.split(';')[0].trim()] || '.img';
    filePath = path.join(cacheDir, `${testCase.id}${extension}`);

    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
    fs.writeFileSync(metaPath, JSON.stringify({
      fileName: path.basename(filePath),
      contentType,
    }, null, 2));
  }

  return {
    filePath,
    buffer: fs.readFileSync(filePath),
    contentType,
  };
}

function buildSyntheticSvg(preset) {
  const presets = {
    'dreamy-portrait': `
      <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#20103d"/>
            <stop offset="50%" stop-color="#6f3bf0"/>
            <stop offset="100%" stop-color="#f38bc7"/>
          </linearGradient>
          <radialGradient id="face" cx="50%" cy="44%" r="38%">
            <stop offset="0%" stop-color="#ffd8c2"/>
            <stop offset="100%" stop-color="#f2a28e"/>
          </radialGradient>
        </defs>
        <rect width="1024" height="1024" fill="url(#bg)"/>
        <ellipse cx="512" cy="520" rx="250" ry="320" fill="#1d1233"/>
        <circle cx="512" cy="420" r="208" fill="url(#face)"/>
        <ellipse cx="438" cy="410" rx="30" ry="16" fill="#3b2335"/>
        <ellipse cx="586" cy="410" rx="30" ry="16" fill="#3b2335"/>
        <path d="M430 532 C492 580 532 580 594 532" stroke="#9b4158" stroke-width="18" fill="none" stroke-linecap="round"/>
        <path d="M350 250 C490 100 690 120 760 320" stroke="#180b2f" stroke-width="54" fill="none" stroke-linecap="round"/>
      </svg>
    `,
    'surreal-landscape': `
      <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1a1849"/>
            <stop offset="55%" stop-color="#8844ff"/>
            <stop offset="100%" stop-color="#ff9a62"/>
          </linearGradient>
        </defs>
        <rect width="1024" height="1024" fill="url(#sky)"/>
        <circle cx="742" cy="226" r="110" fill="#fff1c2" opacity="0.95"/>
        <path d="M0 730 C180 610 330 650 512 760 C700 870 845 820 1024 690 L1024 1024 L0 1024 Z" fill="#2a1144"/>
        <path d="M0 802 C180 742 330 770 512 834 C700 900 845 872 1024 784 L1024 1024 L0 1024 Z" fill="#5d1f72"/>
        <rect x="472" y="520" width="80" height="250" rx="12" fill="#d8d0ff"/>
        <ellipse cx="512" cy="490" rx="190" ry="54" fill="#8bf6ff" opacity="0.7"/>
      </svg>
    `,
    'glossy-product': `
      <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="stage" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#f6f3ff"/>
            <stop offset="100%" stop-color="#c7d0ff"/>
          </radialGradient>
          <linearGradient id="bottle" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#78f1ff"/>
            <stop offset="100%" stop-color="#2b72ff"/>
          </linearGradient>
        </defs>
        <rect width="1024" height="1024" fill="url(#stage)"/>
        <ellipse cx="512" cy="860" rx="240" ry="70" fill="#90a3d7" opacity="0.35"/>
        <rect x="394" y="232" width="236" height="520" rx="72" fill="url(#bottle)"/>
        <rect x="456" y="164" width="112" height="106" rx="24" fill="#1a2f6c"/>
        <rect x="434" y="332" width="156" height="170" rx="28" fill="#eef7ff" opacity="0.85"/>
        <circle cx="708" cy="300" r="42" fill="#ffffff" opacity="0.45"/>
      </svg>
    `,
    'neon-geometry': `
      <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <rect width="1024" height="1024" fill="#09131e"/>
        <circle cx="512" cy="512" r="300" stroke="#29f0ff" stroke-width="22" fill="none"/>
        <circle cx="512" cy="512" r="212" stroke="#ff45d4" stroke-width="18" fill="none"/>
        <rect x="284" y="284" width="456" height="456" rx="36" stroke="#86ff7a" stroke-width="20" fill="none"/>
        <polygon points="512,182 782,652 242,652" fill="none" stroke="#ffc857" stroke-width="18"/>
        <circle cx="512" cy="512" r="70" fill="#ffffff"/>
      </svg>
    `,
  };

  return presets[preset] || presets['neon-geometry'];
}

async function runTextCase(baseUrl, testCase) {
  const response = await fetch(`${baseUrl}/api/detect/text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Analysis-Mode': testCase.mode,
    },
    body: JSON.stringify({ text: testCase.content }),
  });

  const payload = await response.json();
  return {
    ok: response.ok,
    verdict: payload.result?.verdict,
    probability: payload.result?.aiProbability,
    summary: payload.result?.summary,
  };
}

async function runImageCase(baseUrl, testCase) {
  const { filePath, buffer, contentType } = await loadImageAsset(testCase);
  const form = new FormData();
  form.set('image', new Blob([buffer], { type: contentType }), path.basename(filePath));

  const response = await fetch(`${baseUrl}/api/detect/image`, {
    method: 'POST',
    headers: {
      'X-Analysis-Mode': testCase.mode,
    },
    body: form,
  });

  const payload = await response.json();
  return {
    ok: response.ok,
    verdict: payload.result?.verdict,
    probability: payload.result?.aiProbability,
    summary: payload.result?.summary,
  };
}

function printCaseResult(testCase, result) {
  const status = result.ok && result.verdict === testCase.expectedVerdict ? 'PASS' : 'FAIL';
  console.log(
    `[${status}] ${testCase.id} | mode=${testCase.mode} | expected="${testCase.expectedVerdict}" | got="${result.verdict}" | score=${result.probability}`
  );

  if (status === 'FAIL') {
    console.log(`  summary: ${result.summary || 'No summary returned'}`);
  }

  return status === 'PASS';
}

async function main() {
  const { server, baseUrl } = await createServer();

  try {
    let passed = 0;
    let total = 0;

    console.log('Running text benchmarks...');
    for (const testCase of fixtures.text) {
      total += 1;
      const result = await runTextCase(baseUrl, testCase);
      if (printCaseResult(testCase, result)) {
        passed += 1;
      }
    }

    console.log('');
    console.log('Running image benchmarks...');
    for (const testCase of fixtures.image) {
      total += 1;
      const result = await runImageCase(baseUrl, testCase);
      if (printCaseResult(testCase, result)) {
        passed += 1;
      }
    }

    console.log('');
    console.log(`Benchmark summary: ${passed}/${total} passed (${Math.round((passed / total) * 100)}%)`);

    if (passed !== total) {
      process.exitCode = 1;
    }
  } finally {
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
