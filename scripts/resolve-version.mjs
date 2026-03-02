// Единственный источник версии сборки.
// Приоритет: APP_VERSION -> имя ветки -> git describe -> dev-заглушка.
// package.json остаётся одинаковым во всех линиях, поэтому не конфликтует при merge.

import { execFileSync } from 'node:child_process';

function sh(args) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

export function versionFromBranch(branch) {
  let m = /^releases\/v(\d+\.\d+\.\d+\.\d+)$/.exec(branch);
  if (m) return m[1];
  m = /^lts\/v(\d+\.\d+\.\d+)$/.exec(branch);
  if (m) return m[1];
  return null;
}

export function resolveVersion() {
  if (process.env.APP_VERSION) return { version: process.env.APP_VERSION, source: 'APP_VERSION' };

  const branch = process.env.BUILD_BRANCH || sh(['rev-parse', '--abbrev-ref', 'HEAD']);
  const fromBranch = versionFromBranch(branch);
  if (fromBranch) return { version: fromBranch, source: 'имя ветки ' + branch };

  const described = sh(['describe', '--tags', '--match', 'v*', '--abbrev=7']);
  if (described) return { version: described.replace(/^v/, ''), source: 'git describe' };

  const sha = sh(['rev-parse', '--short', 'HEAD']) || 'unknown';
  return { version: '0.0.0-dev+' + sha, source: 'заглушка + sha' };
}

import { pathToFileURL } from 'node:url';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = resolveVersion();
  console.log(r.version + '   (источник: ' + r.source + ')');
}
