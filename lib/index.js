'use strict';

/**
 * oh-my-quyen — Qwen Code extension pack
 *
 * This package ships slash commands, sub-agents, and skills for Qwen Code.
 * There is no runtime API — the useful entry points are:
 *   - bin/omq.js        → `omq` CLI (init, help, version)
 *   - commands/         → 15 slash-command markdown files
 *   - agents/           → 14 sub-agent markdown files
 *   - skills/           → 15 skill directories with SKILL.md
 *   - templates/        → project-starter template seeded by `omq init`
 *
 * Consumers should use `qwen extensions install .` or `omq init` to wire
 * everything into their Qwen Code workspace.
 */

const path = require('path');

const ROOT = __dirname;

/** Resolve a path relative to the extension root. */
function resolve(rel) {
  return path.join(ROOT, rel);
}

module.exports = {
  name: 'oh-my-quyen',
  version: require(path.join(ROOT, 'package.json')).version,
  paths: {
    root: ROOT,
    commands: resolve('commands'),
    agents: resolve('agents'),
    skills: resolve('skills'),
    templates: resolve('templates'),
    projectStarter: resolve('templates/project-starter'),
    bin: resolve('bin'),
    lib: resolve('lib'),
    hooks: resolve('templates/project-starter/.qwen/hooks'),
  },
};
