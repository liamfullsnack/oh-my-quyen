#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'templates', 'qwenkit', 'qwen-dot', 'agents');
const OUT = path.join(ROOT, 'agents');

function unquoteYaml(v) {
  let s = (v || '').trim();
  if (s.length >= 2 && ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"')))) {
    const q = s[0];
    s = s.slice(1, -1);
    // YAML escapes: '' → ' inside single-quoted
    if (q === "'") s = s.replaceAll("''", "'");
    if (q === '"') {
      s = s
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    }
  }
  return s;
}

function parseFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { fm: {}, body: src };
  const fmRaw = m[1];
  const body = m[2];
  const fm = {};
  let currentKey = null;
  for (const line of fmRaw.split('\n')) {
    const kv = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      fm[currentKey] = kv[2];
    } else if (currentKey && line.startsWith(' ')) {
      fm[currentKey] += '\n' + line;
    }
  }
  for (const k of Object.keys(fm)) fm[k] = unquoteYaml(fm[k]);
  return { fm, body };
}

function toYamlString(s) {
  if (s == null) return "''";
  const str = String(s).trim();
  if (str.includes('\n') || str.length > 120 || str.includes("'")) {
    const indented = str.split('\n').map((l) => '  ' + l).join('\n');
    return '|\n' + indented;
  }
  if (/^[a-zA-Z0-9_\-\. ]+$/.test(str) && !str.match(/^(true|false|null|yes|no)$/i)) {
    return str;
  }
  return "'" + str.replaceAll("'", "''") + "'";
}

function buildQwenFrontmatter(src) {
  const { fm, body } = parseFrontmatter(src);
  const name = (fm.name || '').trim() || 'unknown';
  let desc = (fm.description || '').trim() || `Qwen agent: ${name}`;
  // Source authors wrote literal \n in single-quoted YAML as a shorthand for newlines.
  // Normalize so Qwen's routing text is clean.
  desc = desc.replace(/\\n/g, '\n').replace(/\\t/g, '  ');
  const out = [
    '---',
    `name: ${name}`,
    `description: ${toYamlString(desc)}`,
    `model: inherit`,
    '---',
    '',
    body.trim(),
    '',
  ].join('\n');
  return out;
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`Source not found: ${SRC}`);
    console.error('Run `node scripts/build-templates.js` first.');
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });

  let count = 0;
  for (const f of fs.readdirSync(SRC)) {
    if (!f.endsWith('.md')) continue;
    const src = fs.readFileSync(path.join(SRC, f), 'utf8');
    const converted = buildQwenFrontmatter(src);
    fs.writeFileSync(path.join(OUT, f), converted);
    count++;
  }
  console.log(`Converted ${count} agents to ${OUT}`);
}

main();
