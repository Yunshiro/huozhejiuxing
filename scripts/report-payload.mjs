import { gzipSync } from 'node:zlib';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const dist = join(process.cwd(), 'dist');

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, acc);
    else acc.push(path);
  }
  return acc;
}

const files = walk(dist).map((path) => {
  const raw = readFileSync(path);
  return {
    path: relative(dist, path),
    raw: raw.length,
    gzip: gzipSync(raw).length,
  };
});
files.sort((a, b) => b.raw - a.raw);
let rawSum = 0;
let gzipSum = 0;
let initialRaw = 0;
let initialGzip = 0;
for (const file of files) {
  rawSum += file.raw;
  gzipSum += file.gzip;
  const initial = /\.(html|js|css|woff2)$/.test(file.path);
  if (initial) {
    initialRaw += file.raw;
    initialGzip += file.gzip;
  }
  console.log(`${file.path}\t${file.raw}\t${file.gzip}`);
}
const font = files.find((file) => file.path.endsWith('.woff2'));
console.log('---');
console.log(`font woff2 raw ${font ? font.raw : 0} gzip ${font ? font.gzip : 0}`);
console.log(`initial html+js+css+woff2 raw ${initialRaw} gzip ${initialGzip}`);
console.log(`dist total raw ${rawSum} gzip ${gzipSum}`);
const slow4gBytesPerSec = (1.6 * 1024 * 1024) / 8;
console.log(
  `slow 4G (1.6 Mbps) estimate for gzip initial payload: ${(initialGzip / slow4gBytesPerSec).toFixed(2)}s plus latency`,
);
