// Прототип автомержа вверх по релизным линиям.
//
//   node scripts/merge-forward.mjs --from releases/v4.26.7.3            # прогон без изменений
//   node scripts/merge-forward.mjs --from releases/v4.26.7.3 --apply    # смерджить локально
//   node scripts/merge-forward.mjs --from releases/v4.26.7.3 --apply --push
//
// Идёт по цепочке из .release-lines.json от указанной линии к следующей и так до конца.
// Чистый merge — продолжаем цепочку. Конфликт — откатываем, останавливаемся,
// печатаем список файлов и выходим с кодом 2 (в CI это сигнал открыть PR).

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};

const APPLY = flag('--apply');
const PUSH = flag('--push');

function git(a, opts = {}) {
  return execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim();
}
function gitTry(a) {
  try {
    return { ok: true, out: git(a) };
  } catch (e) {
    return { ok: false, out: String(e.stdout || '') + String(e.stderr || '') };
  }
}

// В CI склонирована одна ветка, остальные линии есть только как origin/*.
// Заводим локальные ветки, иначе rev-list и merge не найдут ссылку по имени.
function ensureLocal(branch) {
  const has = gitTry(['rev-parse', '--verify', '--quiet', 'refs/heads/' + branch]);
  if (has.ok && has.out) return true;
  const remote = gitTry(['rev-parse', '--verify', '--quiet', 'refs/remotes/origin/' + branch]);
  if (!remote.ok || !remote.out) return false;
  return gitTry(['branch', branch, 'origin/' + branch]).ok;
}

const cfg = JSON.parse(fs.readFileSync('.release-lines.json', 'utf8'));
const chain = cfg.chain;

for (const b of chain) {
  if (!ensureLocal(b)) {
    console.log(`Линия ${b} не найдена ни локально, ни в origin — пропускаю цепочку.`);
    process.exit(1);
  }
}

const from = value('--from') || git(['rev-parse', '--abbrev-ref', 'HEAD']);
const startIndex = chain.indexOf(from);

if (startIndex < 0) {
  console.log(`Линия ${from} не входит в цепочку merge-forward.`);
  if ((cfg.manual || []).includes(from)) {
    console.log('Она помечена как ручная: расхождение слишком велико, порт делается cherry-pick.');
  }
  process.exit(0);
}
if (startIndex === chain.length - 1) {
  console.log(`${from} — последняя линия в цепочке, вливать некуда.`);
  process.exit(0);
}

console.log('цепочка: ' + chain.join(' -> '));
console.log('старт   : ' + from + (APPLY ? (PUSH ? '  [apply + push]' : '  [apply]') : '  [dry-run]'));
console.log('');

const merged = [];

for (let i = startIndex; i < chain.length - 1; i++) {
  const src = chain[i];
  const dst = chain[i + 1];

  const ahead = git(['rev-list', '--count', `${dst}..${src}`]);
  if (ahead === '0') {
    console.log(`${src} -> ${dst}: нечего вливать`);
    continue;
  }

  if (!APPLY) {
    const probe = gitTry(['merge-tree', '--write-tree', dst, src]);
    const conflicts = probe.ok
      ? []
      : [...new Set(probe.out.split('\n')
          .map((l) => /^CONFLICT.*Merge conflict in (.+)$/.exec(l))
          .filter(Boolean)
          .map((m) => m[1]))];
    if (probe.ok) {
      console.log(`${src} -> ${dst}: ЧИСТО (${ahead} коммит(ов))`);
    } else {
      console.log(`${src} -> ${dst}: КОНФЛИКТ в ${conflicts.length} файл(ах)`);
      conflicts.forEach((f) => console.log('    ' + f));
      console.log('    остальная цепочка не проверялась');
      process.exit(2);
    }
    continue;
  }

  git(['checkout', dst]);
  const res = gitTry(['merge', '--no-edit', '-m', `chore: merge-forward ${src} -> ${dst}`, src]);
  if (res.ok) {
    console.log(`${src} -> ${dst}: смерджено (${ahead} коммит(ов))`);
    merged.push(dst);
  } else {
    const conflicts = git(['diff', '--name-only', '--diff-filter=U']).split('\n').filter(Boolean);
    git(['merge', '--abort']);
    console.log(`${src} -> ${dst}: КОНФЛИКТ, откатано`);
    conflicts.forEach((f) => console.log('    ' + f));
    console.log('');
    console.log(`Нужен человек: открыть PR ${src} -> ${dst} и разобрать вручную.`);
    console.log(`##CONFLICT|${src}|${dst}|${conflicts.join(',')}`);
    process.exit(2);
  }
}

if (PUSH && merged.length) {
  console.log('');
  for (const b of merged) {
    const r = gitTry(['push', 'origin', b]);
    console.log(`push ${b}: ${r.ok ? 'ок' : 'ошибка\n' + r.out}`);
    if (!r.ok) process.exit(1);
  }
}

console.log('');
console.log('готово' + (merged.length ? ': обновлены ' + merged.join(', ') : ''));
