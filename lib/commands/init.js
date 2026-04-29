'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync, spawnSync } = require('child_process');

const PKG_ROOT = path.join(__dirname, '..', '..');
const STARTER_DIR = path.join(PKG_ROOT, 'templates', 'project-starter');

async function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans.trim().toLowerCase());
    });
  });
}

function hasQwenCli() {
  // Windows spawnSync doesn't find .cmd files reliably.
  // Use shell:true, or fall back to where.exe to locate the binary.
  let r = spawnSync('qwen', ['--version'], { encoding: 'utf8', shell: true });
  if (r.status === 0) return true;

  // Fallback: ask the system where qwen lives
  try {
    const w = spawnSync('where.exe', ['qwen'], { encoding: 'utf8' });
    return w.status === 0;
  } catch {
    return false;
  }
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() || entry.isSymbolicLink()) out.push(full);
  }
  return out;
}

function copyStarter(target, { force, dryRun }) {
  if (!fs.existsSync(STARTER_DIR)) return { written: 0, skipped: 0 };
  const files = walk(STARTER_DIR);
  let written = 0, skipped = 0;
  for (const src of files) {
    const rel = path.relative(STARTER_DIR, src);
    const dest = path.join(target, rel);
    if (fs.existsSync(dest) && !force) { skipped++; continue; }
    if (dryRun) { console.log(`  ? ${rel}`); written++; continue; }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    console.log(`  + ${rel}`);
    written++;
  }
  return { written, skipped };
}

async function linkExtension() {
  // Resolve the oh-my-quyen package installation directory.
  // Works for: local dev (npm link), global install (npm i -g), npx.
  const extPath = PKG_ROOT;
  if (!fs.existsSync(path.join(extPath, 'qwen-extension.json'))) {
    throw new Error(`qwen-extension.json not found at ${extPath}`);
  }
  // Check if already installed
  const listR = spawnSync('qwen', ['extensions', 'list'], { encoding: 'utf8', shell: true });
  if (listR.status === 0 && listR.stdout.includes('oh-my-quyen')) {
    return null; // already installed, nothing to do
  }
  try {
    // First try to unlink an existing registration (harmless if not present)
    spawnSync('qwen', ['extensions', 'uninstall', 'oh-my-quyen'], { stdio: 'ignore', shell: true });
  } catch {}
  // Qwen's `extensions link` prompts "Do you want to continue? [Y/n]" and has
  // no --yes flag as of 0.14.x. We auto-accept by piping "y\n" on stdin.
  const r = spawnSync('qwen', ['extensions', 'link', extPath], {
    encoding: 'utf8',
    input: 'y\n',
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: true,
  });
  if (r.status !== 0) {
    throw new Error(`\`qwen extensions link\` failed (exit ${r.status})`);
  }
  return extPath;
}

async function runInit(opts) {
  const target = opts.target;

  console.log(`oh-my-quyen init`);
  console.log(`  target:    ${target}`);
  console.log(`  extension: ${PKG_ROOT}`);
  console.log(`  options:   force=${opts.force} dry-run=${opts.dryRun}`);
  console.log('');

  if (!hasQwenCli()) {
    console.error('`qwen` CLI not found on PATH.');
    console.error('Install it first: npm install -g @qwen-code/qwen-code');
    return 2;
  }

  if (!opts.yes && !opts.dryRun) {
    const ans = await prompt(`Link oh-my-quyen as Qwen extension and seed starter files into ${target}? [y/N] `);
    if (ans !== 'y' && ans !== 'yes') {
      console.log('Aborted.');
      return 1;
    }
  }

  if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });

  // Step 1: register as a global Qwen extension
  console.log('[1/2] Linking as Qwen extension ...');
  if (opts.dryRun) {
    console.log(`  would run: qwen extensions link ${PKG_ROOT}`);
  } else {
    try {
      const result = await linkExtension();
      if (result === null) {
        console.log('  extension already installed, skipped.');
      } else {
        console.log('  linked.');
      }
    } catch (e) {
      console.error(`  failed: ${e.message}`);
      return 3;
    }
  }
  console.log('');

  // Step 2: copy project-starter files into target
  console.log('[2/2] Seeding project-starter files ...');
  const { written, skipped } = copyStarter(target, opts);
  console.log('');

  if (opts.dryRun) {
    console.log(`Dry run: ${written} file(s) would be written, ${skipped} already present.`);
  } else {
    console.log(`Done: ${written} file(s) written, ${skipped} skipped${opts.force ? '' : ' (use --force to overwrite)'}.`);
    console.log('');
    console.log('Next steps:');
    console.log(`  1. cd ${target}`);
    console.log('  2. qwen                # start Qwen Code in the project');
    console.log('  3. /cook "add X"       # try a slash command');
    console.log('  4. Fill in ./docs/*.md with your project details');
    console.log('');
    console.log('Uninstall: qwen extensions uninstall oh-my-quyen');
  }
  return 0;
}

module.exports = { runInit };
