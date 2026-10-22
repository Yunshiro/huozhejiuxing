import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = join(root, '.font-cache');
const sourceName = 'fusion-pixel-12px-proportional-zh_hans.otf.woff2';
const sourcePath = join(cacheDir, sourceName);
const outputPath = join(root, 'src/assets/fonts/fusion-pixel-subset.woff2');
const zipUrl =
  'https://github.com/TakWolf/fusion-pixel-font/releases/download/2026.10.16/fusion-pixel-font-12px-proportional-otf.woff2-v2026.10.16.zip';
const zipSha256 = '0544ba28f8f177b036fcb326163145f1469206d4f9f5e7cd3a8ef814bbd152ed';
const sourceSha256 = '037fb51624ec39500a6be28f7eac4aa6a8c9366205b2344dd2b4f182879519ce';
const zipEntry = 'fusion-pixel-12px-proportional-zh_hans.otf.woff2';

const extra =
  '，。！？、；：""\'\'「」『』（）【】《》—…·￥×＋－～・';

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'assets' || name === 'dist') continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, acc);
    else if (/\.(ts|css|html|svg|md)$/.test(name)) acc.push(path);
  }
  return acc;
}

function collectText() {
  const files = [...walk(join(root, 'src')), join(root, 'index.html')];
  const chars = new Set();
  for (let code = 32; code <= 126; code++) chars.add(String.fromCharCode(code));
  for (const ch of extra) chars.add(ch);
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const ch of text) chars.add(ch);
  }
  return { files, text: [...chars].sort().join('') };
}

async function ensureSource() {
  mkdirSync(cacheDir, { recursive: true });
  if (existsSync(sourcePath)) {
    const hash = sha256(readFileSync(sourcePath));
    if (hash === sourceSha256) return;
    console.warn('[font] cached source hash mismatch, re-downloading');
  }
  console.log('[font] downloading Fusion Pixel zh_hans');
  const response = await fetch(zipUrl);
  if (!response.ok) throw new Error(`font download failed: ${response.status}`);
  const zip = Buffer.from(await response.arrayBuffer());
  const zipHash = sha256(zip);
  if (zipHash !== zipSha256) throw new Error(`font zip hash mismatch: ${zipHash}`);
  const zipPath = join(cacheDir, 'fusion.zip');
  writeFileSync(zipPath, zip);
  const extracted = execFileSync('unzip', ['-p', zipPath, zipEntry], { maxBuffer: 8 * 1024 * 1024 });
  if (sha256(extracted) !== sourceSha256) throw new Error('extracted font hash mismatch');
  writeFileSync(sourcePath, extracted);
}

function newest(paths) {
  return paths.reduce((max, path) => Math.max(max, statSync(path).mtimeMs), 0);
}

const { files, text } = collectText();
await ensureSource();
mkdirSync(dirname(outputPath), { recursive: true });
const force = process.argv.includes('--force');
if (!force && existsSync(outputPath) && statSync(outputPath).mtimeMs >= newest([...files, sourcePath])) {
  const size = statSync(outputPath).size;
  console.log(`[font] subset up to date, ${size} bytes, ${[...text].length} chars scanned`);
  process.exit(0);
}

const source = readFileSync(sourcePath);
const subset = await subsetFont(source, text, { targetFormat: 'woff2' });
writeFileSync(outputPath, subset);
console.log(
  `[font] subset ${source.length} -> ${subset.length} bytes (${[...text].length} chars, woff2)`,
);
