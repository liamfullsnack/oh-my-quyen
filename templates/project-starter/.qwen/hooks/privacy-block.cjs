#!/usr/bin/env node
/**
 * PreToolUse hook — block reads of likely-sensitive files.
 *
 * Matches file-reading tools (Read, read_file, etc.) and inspects the path.
 * Denies if the path hits known-sensitive patterns (.env, credentials, keys).
 * Exit 0 with permissionDecision="deny" rather than exit 2 so Qwen shows a
 * clean "denied by hook" message rather than a generic error.
 *
 * Input:  JSON with { tool_name, tool_input, cwd, ... }
 * Output: JSON with hookSpecificOutput.permissionDecision = "allow" | "deny"
 */
'use strict';

const SENSITIVE = [
  /\.env(\.|$)/,
  /\bcredentials?\.(json|yaml|yml|txt|enc)$/i,
  /\bid_(rsa|ed25519|ecdsa|dsa)$/,
  /\.pem$/,
  /\.p12$/,
  /\.pfx$/,
  /\bsecrets?\.(json|yaml|yml|txt|enc)$/i,
  /\.aws\/credentials$/,
  /\.ssh\/.*key/i,
];

// Tool names across Claude/Qwen/MCP variants that read file content.
const READ_TOOLS = /^(read_file|Read|ReadFile|view_file|cat)$/i;

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data));
    if (process.stdin.isTTY) setImmediate(() => resolve(''));
  });
}

function allow() {
  const out = {
    continue: true,
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow' },
  };
  process.stdout.write(JSON.stringify(out));
  process.exit(0);
}

function deny(reason) {
  const out = {
    continue: true,
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  };
  process.stdout.write(JSON.stringify(out));
  process.exit(0);
}

async function main() {
  const raw = await readStdin();
  let input = {};
  try { input = raw ? JSON.parse(raw) : {}; } catch { return allow(); }

  const toolName = input.tool_name || '';
  if (!READ_TOOLS.test(toolName)) return allow();

  const ti = input.tool_input || {};
  // Different tools name the path field differently. Check the common ones.
  const candidatePath = ti.file_path || ti.path || ti.filePath || ti.filename || ti.target_file || '';
  if (!candidatePath) return allow();

  for (const re of SENSITIVE) {
    if (re.test(candidatePath)) {
      return deny(
        `Path ${candidatePath} matches a sensitive pattern. ` +
        `Ask the user before reading secrets. If approved, prefix your intent ` +
        `with "APPROVED:" in the conversation so the user sees what you are about to do.`
      );
    }
  }
  return allow();
}

main().catch((e) => {
  process.stderr.write(`privacy-block hook error: ${e.message}\n`);
  process.exit(1);
});
