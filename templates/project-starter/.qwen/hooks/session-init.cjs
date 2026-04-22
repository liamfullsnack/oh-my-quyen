#!/usr/bin/env node
/**
 * SessionStart hook — prints project context for the session.
 *
 * Fires: SessionStart (startup|resume|clear|compact)
 * Input:  JSON on stdin with { session_id, session_source, cwd, ... }
 * Output: JSON with additionalContext injected into the model
 */
'use strict';

const fs = require('fs');
const path = require('path');

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
    // If stdin is a TTY (manual test), resolve empty after a tick
    if (process.stdin.isTTY) setImmediate(() => resolve(''));
  });
}

function hasFile(p) {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}

function detectProject(cwd) {
  const markers = [];
  if (hasFile(path.join(cwd, 'package.json'))) markers.push('node');
  if (hasFile(path.join(cwd, 'pyproject.toml')) || hasFile(path.join(cwd, 'requirements.txt'))) markers.push('python');
  if (hasFile(path.join(cwd, 'Cargo.toml'))) markers.push('rust');
  if (hasFile(path.join(cwd, 'go.mod'))) markers.push('go');
  if (hasFile(path.join(cwd, 'pom.xml')) || hasFile(path.join(cwd, 'build.gradle'))) markers.push('java');
  if (fs.existsSync(path.join(cwd, '.git'))) markers.push('git');
  return markers;
}

async function main() {
  const raw = await readStdin();
  let input = {};
  try { input = raw ? JSON.parse(raw) : {}; } catch {}

  const cwd = input.cwd || process.cwd();
  const source = input.session_source || 'startup';
  const markers = detectProject(cwd);
  const hasDocs = fs.existsSync(path.join(cwd, 'docs'));
  const hasPlans = fs.existsSync(path.join(cwd, 'plans'));

  const lines = [
    `## Session`,
    `- source: ${source}`,
    `- cwd: ${cwd}`,
    `- detected: ${markers.join(', ') || 'unknown'}`,
    `- docs/: ${hasDocs ? 'present' : 'missing — fill stubs'}`,
    `- plans/: ${hasPlans ? 'present' : 'missing'}`,
    ``,
    `## Paths`,
    `- Reports: ${cwd}/plans/reports/`,
    `- Plans:   ${cwd}/plans/`,
    `- Docs:    ${cwd}/docs/`,
    ``,
    `Naming: plans/YYMMDD-HHMM-slug/, reports/{type}-YYMMDD-HHMM-{slug}.md`,
  ];

  const out = {
    continue: true,
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: lines.join('\n'),
    },
  };
  process.stdout.write(JSON.stringify(out));
  process.exit(0);
}

main().catch((e) => {
  process.stderr.write(`session-init hook error: ${e.message}\n`);
  process.exit(1);
});
