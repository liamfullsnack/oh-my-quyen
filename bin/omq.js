#!/usr/bin/env node
'use strict';

const path = require('path');
const { runInit } = require('../lib/commands/init.js');

const VERSION = require('../package.json').version;

function printHelp() {
  console.log(`oh-my-quyen (omq) v${VERSION}

Usage:
  omq <command> [options]

Commands:
  init            Install Qwen skills/agents/hooks/workflow into the current project
  help            Show this help
  version         Show version

Init options:
  --force         Overwrite existing files
  --dry-run       Print actions without writing
  --yes, -y       Skip interactive prompts (assume yes)
  --target <dir>  Target directory (default: current working directory)

Examples:
  omq init
  omq init --force
  omq init --target ./my-app --yes
`);
}

async function main(argv) {
  const args = argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
    printHelp();
    return 0;
  }
  if (cmd === 'version' || cmd === '--version' || cmd === '-v') {
    console.log(VERSION);
    return 0;
  }
  if (cmd === 'init') {
    const opts = parseInitFlags(args.slice(1));
    return await runInit(opts);
  }

  console.error(`Unknown command: ${cmd}`);
  printHelp();
  return 1;
}

function parseInitFlags(args) {
  const opts = {
    force: false,
    dryRun: false,
    yes: false,
    target: process.cwd(),
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--force') opts.force = true;
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--yes' || a === '-y') opts.yes = true;
    else if (a === '--target') opts.target = path.resolve(args[++i]);
    else {
      console.error(`Unknown flag: ${a}`);
      process.exit(1);
    }
  }
  return opts;
}

main(process.argv)
  .then((code) => process.exit(code || 0))
  .catch((err) => {
    console.error(err.stack || err.message);
    process.exit(1);
  });
