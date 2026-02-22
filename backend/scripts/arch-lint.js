/**
 * Architecture Lint (modular monolith boundaries)
 *
 * Usage:
 *   node scripts/arch-lint.js
 *
 * What it enforces (minimal, pragmatic):
 * 1) No cross-module imports inside backend/src/modules/** (module A importing module B code).
 * 2) Clean Architecture direction:
 *    - files under modules/<module>/domain and modules/<module>/application must not import:
 *      - express / http adapters
 *      - DB layer (src/config/database)
 *      - legacy routes/services
 */

/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const BACKEND_SRC = path.join(REPO_ROOT, 'src');
const MODULES_ROOT = path.join(BACKEND_SRC, 'modules');

const SOURCE_EXTS = new Set(['.js', '.ts', '.tsx', '.mjs', '.cjs']);

function isSourceFile(filePath) {
  return SOURCE_EXTS.has(path.extname(filePath));
}

function listFilesRecursively(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') continue;
      out.push(...listFilesRecursively(p));
    } else if (entry.isFile()) {
      if (isSourceFile(p)) out.push(p);
    }
  }
  return out;
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function findImportSpecifiers(code) {
  const specs = [];

  // CommonJS: require('x')
  const requireRe = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let m;
  while ((m = requireRe.exec(code))) specs.push({ spec: m[1], kind: 'require', index: m.index });

  // ESM: import ... from 'x'
  const importFromRe = /import[\s\S]*?\sfrom\s*['"]([^'"]+)['"]/g;
  while ((m = importFromRe.exec(code))) specs.push({ spec: m[1], kind: 'import', index: m.index });

  // ESM: import 'x'
  const importBareRe = /import\s*['"]([^'"]+)['"]/g;
  while ((m = importBareRe.exec(code))) specs.push({ spec: m[1], kind: 'import', index: m.index });

  return specs;
}

function tryResolveRelative(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  const base = path.resolve(path.dirname(fromFile), spec);

  // Try exact
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;

  // Try with extensions
  for (const ext of SOURCE_EXTS) {
    const withExt = base + ext;
    if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) return withExt;
  }

  // Try index files if directory
  if (fs.existsSync(base) && fs.statSync(base).isDirectory()) {
    for (const ext of SOURCE_EXTS) {
      const idx = path.join(base, 'index' + ext);
      if (fs.existsSync(idx) && fs.statSync(idx).isFile()) return idx;
    }
  }

  // Not resolvable with our simple rules
  return base;
}

function normalize(p) {
  return path.normalize(p);
}

function relFromBackend(p) {
  return normalize(path.relative(REPO_ROOT, p));
}

function getModuleName(filePath) {
  const rel = path.relative(MODULES_ROOT, filePath);
  const parts = rel.split(path.sep);
  return parts[0] || null;
}

function isInLayer(filePath, layerName) {
  const rel = path.relative(MODULES_ROOT, filePath);
  return rel.split(path.sep).includes(layerName);
}

function fail(violations) {
  console.error('\n[arch-lint] FAIL\n');
  for (const v of violations) {
    console.error(`- ${v.file}`);
    console.error(`  import: ${v.spec}`);
    console.error(`  rule: ${v.rule}`);
    if (v.resolved) console.error(`  resolved: ${v.resolved}`);
  }
  console.error(`\nTotal violations: ${violations.length}\n`);
  process.exitCode = 1;
}

function main() {
  if (!fs.existsSync(MODULES_ROOT)) {
    console.log('[arch-lint] No modules folder found, skipping.');
    return;
  }

  const files = listFilesRecursively(MODULES_ROOT);
  const violations = [];

  const forbiddenInCore = [
    'express',
    'socket.io',
    'cors',
    'helmet',
    'compression',
    'express-rate-limit',
  ];

  for (const file of files) {
    const code = readText(file);
    const moduleName = getModuleName(file);
    if (!moduleName) continue;

    const imports = findImportSpecifiers(code);

    const inDomain = isInLayer(file, 'domain');
    const inApp = isInLayer(file, 'application');

    for (const { spec } of imports) {
      const resolved = tryResolveRelative(file, spec);
      const resolvedNorm = resolved ? normalize(resolved) : null;

      // Rule 1: no cross-module imports (relative only, resolvable into modules root)
      if (resolvedNorm && resolvedNorm.startsWith(MODULES_ROOT)) {
        const targetModule = getModuleName(resolvedNorm);
        if (targetModule && targetModule !== moduleName) {
          violations.push({
            file: relFromBackend(file),
            spec,
            resolved: relFromBackend(resolvedNorm),
            rule: `Cross-module import запрещён: "${moduleName}" -> "${targetModule}"`,
          });
        }
      }

      // Rule 2: domain/application must not depend on infrastructure/http
      if (inDomain || inApp) {
        if (forbiddenInCore.includes(spec)) {
          violations.push({
            file: relFromBackend(file),
            spec,
            rule: `Запрещено в ${(inDomain ? 'domain' : 'application')} слое: импорт "${spec}"`,
          });
        }

        if (resolvedNorm) {
          const rel = relFromBackend(resolvedNorm).replace(/\\/g, '/');

          const forbiddenTargets = [
            'src/config/database',
            'src/routes/',
            'src/services/',
            'server.js',
            'src/websocket/',
          ];

          if (forbiddenTargets.some((t) => rel.includes(t))) {
            violations.push({
              file: relFromBackend(file),
              spec,
              resolved: relFromBackend(resolvedNorm),
              rule: `Запрещено в ${(inDomain ? 'domain' : 'application')} слое: зависимость от инфраструктуры`,
            });
          }
        }
      }
    }
  }

  if (violations.length) {
    fail(violations);
    return;
  }

  console.log(`[arch-lint] OK (${files.length} files checked)`);
}

main();

