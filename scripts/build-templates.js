#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const ROOT = path.join(__dirname, '..');
// Path to the upstream source zip that seeds templates. Override via UPSTREAM_ZIP.
const ZIP_PATH = process.env.UPSTREAM_ZIP || path.join(os.homedir(), 'Downloads', 'upstream.zip');
const OUT = path.join(ROOT, 'templates', 'qwenkit');
const TMP = path.join(os.tmpdir(), `oh-my-quyen-build-${Date.now()}`);

const TEXT_EXT = new Set([
  '.md', '.txt', '.json', '.yaml', '.yml', '.js', '.cjs', '.mjs', '.ts',
  '.py', '.sh', '.bash', '.zsh', '.toml', '.ini', '.html', '.css', '.example',
  '.ps1', '.bat', '.cmd', '.env', '.rules', '.xml', '.lock', '.mdx',
]);

function isTextFile(p) {
  const ext = path.extname(p).toLowerCase();
  if (TEXT_EXT.has(ext)) return true;
  const base = path.basename(p);
  if (base.startsWith('.') && !path.extname(base)) return true;
  return false;
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

// Upstream brand scrub map. The left column is strings that appear in the
// upstream source bundle; the right column is the replacement used in
// shipped output. This runs at build time against ingested content only.
const BRAND_SCRUB = [
  [/\.claude\b/g, '.qwen'],
  [/\bclaude\/(rules|skills|agents|hooks|scripts|schemas)\b/g, 'qwen/$1'],
  ['CLAUDE.md', 'QWEN.md'],
  ['claude.ai/code', 'qwen.ai/code'],
  ['code.claude.com', 'qwenlm.github.io/qwen-code-docs'],
  ['docs.claude.com', 'qwenlm.github.io/qwen-code-docs'],
  ['Claude Code CLI', 'Qwen Code CLI'],
  ['Claude Code', 'Qwen Code'],
  ['claude-code', 'qwen-code'],
  ['claudekit-engineer', 'oh-my-quyen'],
  ['ClaudeKit', 'Ohmyquyen'],
  ['claudekit', 'oh-my-quyen'],
  // Strip ck:/ck-/ckm: prefix from skill/command references (word-boundary guarded
  // so "check:", "feedback:", "stack:", "quick-", "rollback-" etc. are unaffected).
  [/(^|[^a-zA-Z])ck[a-z]*:([a-zA-Z])/g, '$1$2'],
  [/(^|[^a-zA-Z])ck-([a-z])/g, '$1$2'],
];

function transformText(s) {
  let out = s;
  for (const [from, to] of BRAND_SCRUB) {
    if (from instanceof RegExp) out = out.replace(from, to);
    else out = out.replaceAll(from, to);
  }
  return out;
}

function transformPath(p) {
  return p
    .split(path.sep)
    .map((seg) => {
      if (seg === 'claude') return 'qwen';
      if (seg === '.claude') return '.qwen';
      if (seg === 'CLAUDE.md') return 'QWEN.md';
      return seg;
    })
    .join(path.sep);
}

function copyTransform(srcRoot, destRoot) {
  const files = walk(srcRoot);
  for (const src of files) {
    const rel = path.relative(srcRoot, src);
    const destRel = transformPath(rel);
    const dest = path.join(destRoot, destRel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (isTextFile(src)) {
      const buf = fs.readFileSync(src, 'utf8');
      fs.writeFileSync(dest, transformText(buf));
    } else {
      fs.copyFileSync(src, dest);
    }
    const stat = fs.statSync(src);
    fs.chmodSync(dest, stat.mode);
  }
}

function main() {
  if (!fs.existsSync(ZIP_PATH)) {
    console.error(`Zip not found: ${ZIP_PATH}`);
    console.error('Set UPSTREAM_ZIP env var or place the zip at the default path.');
    process.exit(1);
  }

  console.log(`Extracting ${ZIP_PATH} ...`);
  fs.mkdirSync(TMP, { recursive: true });
  execSync(`unzip -q "${ZIP_PATH}" -d "${TMP}"`, { stdio: 'inherit' });

  const extracted = fs.readdirSync(TMP).filter((n) => !n.startsWith('.') && !n.startsWith('__MACOSX'));
  if (extracted.length !== 1) {
    console.error(`Expected single top-level dir in zip, got: ${extracted.join(', ')}`);
    process.exit(1);
  }
  const srcRoot = path.join(TMP, extracted[0]);

  if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const stageDir = path.join(OUT, 'qwen-dot');
  console.log(`Transforming claude/ → qwen-dot/ (renamed to .qwen/ at install time) ...`);
  copyTransform(path.join(srcRoot, 'claude'), stageDir);

  const passthroughFiles = ['AGENTS.md', 'README.md', 'LICENSE', '.gitignore', '.env.example'];
  for (const f of passthroughFiles) {
    const src = path.join(srcRoot, f);
    if (!fs.existsSync(src)) continue;
    const dest = path.join(OUT, f);
    const buf = fs.readFileSync(src, 'utf8');
    fs.writeFileSync(dest, transformText(buf));
  }

  const claudeMd = path.join(srcRoot, 'CLAUDE.md');
  if (fs.existsSync(claudeMd)) {
    const buf = fs.readFileSync(claudeMd, 'utf8');
    fs.writeFileSync(path.join(OUT, 'QWEN.md'), transformText(buf));
  }

  if (fs.existsSync(path.join(srcRoot, 'docs'))) {
    copyTransform(path.join(srcRoot, 'docs'), path.join(OUT, 'docs'));
    const assetsDir = path.join(OUT, 'docs', 'assets');
    if (fs.existsSync(assetsDir)) {
      fs.rmSync(assetsDir, { recursive: true, force: true });
      console.log('  (stripped docs/assets/ — demo media not needed in pack)');
    }
  }
  if (fs.existsSync(path.join(srcRoot, 'plans'))) {
    copyTransform(path.join(srcRoot, 'plans'), path.join(OUT, 'plans'));
  }

  fs.rmSync(TMP, { recursive: true, force: true });

  const count = walk(OUT).length;
  console.log(`Built templates/qwenkit/ with ${count} file(s).`);
}

main();
