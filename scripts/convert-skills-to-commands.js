#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
// Source is the shipped skills/ dir at pkg root — lets this run independently
// of the upstream-zip rebuild (which is optional and may not be present).
const SRC_SKILLS = path.join(ROOT, 'skills');
const OUT = path.join(ROOT, 'commands');

// Map skill directory → final command slug (what user types after `/`).
// Skill dir names come from the upstream source bundle; command names are
// the Qwen-facing slugs the user types.
const PICKS = [
  { skill: 'cook',         cmd: 'cook' },
  { skill: 'plan',         cmd: 'plan' },
  { skill: 'fix',          cmd: 'fix' },
  { skill: 'code-review',  cmd: 'review' },
  { skill: 'autoresearch', cmd: 'research' },
  { skill: 'debug',        cmd: 'debug' },
  { skill: 'brainstorm',   cmd: 'brainstorm' },
  { skill: 'docs',         cmd: 'docs' },
  { skill: 'git',          cmd: 'git' },
  { skill: 'journal',      cmd: 'journal' },
  { skill: 'kanban',       cmd: 'kanban' },
  { skill: 'deploy',       cmd: 'deploy' },
  { skill: 'design',       cmd: 'design' },
  { skill: 'test',         cmd: 'test' },
  { skill: 'security',     cmd: 'security' },
];

function parseFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { fm: {}, body: src };
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)$/);
    if (kv) {
      let v = kv[2].trim();
      if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
        v = v.slice(1, -1);
      }
      fm[kv[1]] = v;
    }
  }
  return { fm, body: m[2] };
}

function buildCommand(skill, cmd) {
  const skillDir = path.join(SRC_SKILLS, skill);
  const skillMd = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(skillMd)) {
    throw new Error(`Missing SKILL.md for ${skill}`);
  }
  const src = fs.readFileSync(skillMd, 'utf8');
  const { fm, body } = parseFrontmatter(src);
  const desc = fm.description || `Run the ${cmd} workflow`;

  const argHint = fm['argument-hint'] ? ` (e.g. ${fm['argument-hint']})` : '';
  const header =
`---
description: ${JSON.stringify(desc)}
---

The user invoked **/${cmd}** with arguments${argHint}: {{args}}

Execute the workflow described below. If \`{{args}}\` is empty, ask the user for the missing input before proceeding.

---

`;
  // List reference files shipped alongside the skill so the model knows they exist.
  const refDir = path.join(skillDir, 'references');
  let footer = '';
  if (fs.existsSync(refDir)) {
    const refs = fs.readdirSync(refDir).filter((f) => f.endsWith('.md'));
    if (refs.length) {
      footer = [
        '',
        '---',
        '',
        `## Additional reference material`,
        '',
        `Read these via the file tool when you need deeper detail (paths are relative to the oh-my-quyen extension root):`,
        '',
        ...refs.map((r) => `- \`skills/${skill}/references/${r}\``),
        '',
      ].join('\n');
    }
  }
  return header + body.trim() + '\n' + footer;
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const picked = [];
  const missing = [];
  for (const { skill, cmd } of PICKS) {
    try {
      const content = buildCommand(skill, cmd);
      fs.writeFileSync(path.join(OUT, `${cmd}.md`), content);
      picked.push(cmd);
    } catch (e) {
      missing.push({ skill, cmd, err: e.message });
    }
  }
  console.log(`Wrote ${picked.length} commands: ${picked.join(', ')}`);
  if (missing.length) {
    console.error(`Skipped: ${missing.map((m) => `${m.cmd} (${m.err})`).join(', ')}`);
  }
}

main();
