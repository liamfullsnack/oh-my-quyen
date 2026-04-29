#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

function assert(cond, msg) {
  if (!cond) throw new Error('ASSERT: ' + msg);
}

function checkExtensionManifest() {
  const p = path.join(ROOT, 'qwen-extension.json');
  assert(fs.existsSync(p), 'qwen-extension.json missing at package root');
  const m = JSON.parse(fs.readFileSync(p, 'utf8'));
  assert(m.name === 'oh-my-quyen', 'manifest name mismatch');
  assert(m.commands === 'commands', 'manifest.commands should be "commands"');
  assert(m.agents === 'agents', 'manifest.agents should be "agents"');
  assert(m.contextFileName === 'QWEN.md', 'manifest.contextFileName should be QWEN.md');
  assert(m.skills === 'skills', 'manifest.skills should be "skills"');
  console.log(`  ✓ manifest ok (v${m.version})`);
}

function checkAgents() {
  const dir = path.join(ROOT, 'agents');
  assert(fs.existsSync(dir), 'agents/ dir missing');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  assert(files.length >= 14, `expected >=14 agents, got ${files.length}`);
  for (const f of files) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    // Use \r?\n to handle Windows (CRLF) and Unix (LF) line endings
    assert(/^---\r?\nname:\s*\S+/m.test(src), `agent ${f} missing "name:" frontmatter`);
    assert(/^description:/m.test(src), `agent ${f} missing "description:"`);
  }
  console.log(`  ✓ ${files.length} agents with valid frontmatter`);
}

function checkCommands() {
  const dir = path.join(ROOT, 'commands');
  assert(fs.existsSync(dir), 'commands/ dir missing');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  assert(files.length >= 15, `expected >=15 commands, got ${files.length}`);
  for (const f of files) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    assert(/^description:/m.test(src), `command ${f} missing description frontmatter`);
    assert(src.includes('{{args}}'), `command ${f} missing {{args}} placeholder`);
  }
  console.log(`  ✓ ${files.length} commands with {{args}}`);
}

function checkQwenMd() {
  const p = path.join(ROOT, 'QWEN.md');
  assert(fs.existsSync(p), 'QWEN.md missing');
  const src = fs.readFileSync(p, 'utf8');
  assert(src.includes('Qwen Code'), 'QWEN.md should mention Qwen Code');
  assert(!/\.claude\b/.test(src), 'QWEN.md still contains .claude references');
  console.log('  ✓ QWEN.md present, no Claude residue');
}

function checkStarter() {
  const dir = path.join(ROOT, 'templates', 'project-starter');
  assert(fs.existsSync(dir), 'project-starter missing');
  assert(fs.existsSync(path.join(dir, 'docs')), 'starter/docs missing');
  assert(fs.existsSync(path.join(dir, 'plans')), 'starter/plans missing');
  assert(fs.existsSync(path.join(dir, '.qwen', 'settings.json')), 'starter/.qwen/settings.json missing');
  const hooks = fs.readdirSync(path.join(dir, '.qwen', 'hooks'));
  assert(hooks.length >= 3, `expected >=3 hooks, got ${hooks.length}`);
  console.log(`  ✓ project-starter ok (${hooks.length} hooks)`);
}

function checkHooksRunnable() {
  const dir = path.join(ROOT, 'templates', 'project-starter', '.qwen', 'hooks');
  const cases = [
    { script: 'session-init.cjs', stdin: { session_source: 'startup', cwd: '/tmp' }, expect: 'SessionStart' },
    { script: 'dev-rules-reminder.cjs', stdin: { user_prompt: 'x', cwd: '/tmp' }, expect: 'UserPromptSubmit' },
    {
      script: 'privacy-block.cjs',
      stdin: { tool_name: 'read_file', tool_input: { file_path: '/tmp/.env' } },
      expect: 'deny',
    },
  ];
  for (const c of cases) {
    const r = spawnSync('node', [path.join(dir, c.script)], {
      input: JSON.stringify(c.stdin),
      encoding: 'utf8',
    });
    assert(r.status === 0, `${c.script} exited ${r.status}: ${r.stderr}`);
    let body;
    try { body = JSON.parse(r.stdout); } catch {
      throw new Error(`${c.script} produced non-JSON output: ${r.stdout.slice(0, 100)}`);
    }
    const s = JSON.stringify(body);
    assert(s.includes(c.expect), `${c.script} output missing ${c.expect}: ${s.slice(0, 200)}`);
  }
  console.log(`  ✓ ${cases.length} hooks produce valid JSON`);
}

function checkSkills() {
  const dir = path.join(ROOT, 'skills');
  assert(fs.existsSync(dir), 'skills/ dir missing');
  const skills = fs.readdirSync(dir).filter((f) => fs.statSync(path.join(dir, f)).isDirectory());
  assert(skills.length >= 15, `expected >=15 skills, got ${skills.length}`);
  for (const s of skills) {
    const skillMd = path.join(dir, s, 'SKILL.md');
    assert(fs.existsSync(skillMd), `skill ${s} missing SKILL.md`);
    const src = fs.readFileSync(skillMd, 'utf8');
    const m = src.match(/^name:\s*(\S+)/m);
    assert(m, `skill ${s} missing "name:" in frontmatter`);
    assert(!/^ck/i.test(m[1]), `skill ${s} still has ck-prefix in name: ${m[1]}`);
  }
  console.log(`  ✓ ${skills.length} skill dirs with un-prefixed names`);
}

function runInitDry() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'omq-smoke-'));
  try {
    const bin = path.join(ROOT, 'bin', 'omq.js');
    const r = spawnSync('node', [bin, 'init', '--dry-run', '--yes', '--target', tmp], {
      encoding: 'utf8',
    });
    if (r.status !== 0) {
      console.log(r.stdout);
      console.log(r.stderr);
      // exit 2 means qwen CLI missing — allowed in CI
      if (r.status === 2) {
        console.log('  ⚠ qwen CLI not on PATH — init dry-run skipped (non-fatal)');
        return;
      }
      throw new Error(`omq init --dry-run exited ${r.status}`);
    }
    assert(r.stdout.includes('would run: qwen extensions link'), 'dry-run should print the link command');
    console.log('  ✓ omq init dry-run works');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

try {
  console.log('Running smoke test ...');
  checkExtensionManifest();
  checkAgents();
  checkCommands();
  checkQwenMd();
  checkSkills();
  checkStarter();
  checkHooksRunnable();
  runInitDry();
  console.log('\nOK — all checks passed.');
} catch (err) {
  console.error(`\nFAIL: ${err.message}`);
  process.exit(1);
}
