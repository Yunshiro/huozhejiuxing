import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const banned = ['测试模式', 'debug-jump', 'debug-npc', 'queue-npc', 'set-proficiency', 'jump-day', '测试模式未开启'];
const escaped = banned.map((word) => word.split('').map((char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`).join(''));

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, acc);
    else acc.push(path);
  }
  return acc;
}

const files = walk('dist').filter((file) => file.endsWith('.js'));
let failed = false;
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  for (const word of [...banned, ...escaped]) {
    if (text.includes(word)) {
      console.error(`production bundle still has a debug path (${word}) in ${file}`);
      failed = true;
    }
  }
}
if (failed) process.exit(1);
console.log('production bundle has no debug code path');
