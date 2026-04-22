#!/usr/bin/env node
/**
 * UserPromptSubmit hook — injects concise rules + plan/docs paths on every prompt.
 *
 * Keeps the model aligned with YAGNI/KISS/DRY and the naming convention even
 * when conversation history has been compacted.
 *
 * Input:  JSON with { user_prompt, cwd, session_id }
 * Output: JSON with additionalContext (non-blocking)
 */
'use strict';

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
    if (process.stdin.isTTY) setImmediate(() => resolve(''));
  });
}

function now() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

async function main() {
  const raw = await readStdin();
  let input = {};
  try { input = raw ? JSON.parse(raw) : {}; } catch {}
  const cwd = input.cwd || process.cwd();

  const stamp = now();
  const reminder = [
    `## Rules (auto-injected)`,
    `- YAGNI / KISS / DRY — no features, abstractions, or error handling the task doesn't need`,
    `- Edit existing files; never create foo-v2.ts siblings`,
    `- Plans → ${cwd}/plans/${stamp}-{slug}/`,
    `- Reports → ${cwd}/plans/reports/{type}-${stamp}-{slug}.md`,
    `- Docs → ${cwd}/docs/ (no markdown scattered at repo root unless asked)`,
    `- Sacrifice grammar for concision in reports; list unresolved questions at end`,
  ].join('\n');

  const out = {
    continue: true,
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: reminder,
    },
  };
  process.stdout.write(JSON.stringify(out));
  process.exit(0);
}

main().catch((e) => {
  process.stderr.write(`dev-rules-reminder hook error: ${e.message}\n`);
  process.exit(1);
});
