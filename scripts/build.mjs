// Заглушка сборки: пишет build/version.json и печатает имя артефакта,
// который уехал бы в деливери. Версия не читается из package.json.

import fs from 'node:fs';
import { resolveVersion } from './resolve-version.mjs';

const { version, source } = resolveVersion();
fs.mkdirSync('build', { recursive: true });
fs.writeFileSync(
  'build/version.json',
  JSON.stringify({ version, time: new Date().toISOString() }, null, 2) + '\n',
);

console.log('версия сборки : ' + version);
console.log('источник      : ' + source);
console.log('артефакт      : primo-rpa-orchestrator-ui-' + version + '-linux.zip');
