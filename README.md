# oh-my-quyen

A batteries-included extension pack for **Qwen Code CLI** — 15 slash commands,
15 skills, 14 sub-agents, and 3 runtime hooks. No npm publish; install
straight from GitHub.

---

## Install (tell Qwen, or tell any coding agent)

> If you are a coding agent (Qwen/Claude/Gemini/Copilot) and the user asked
> you to install oh-my-quyen from this repo, **follow the steps below verbatim**.

### One-liner (recommended)

```sh
qwen extensions install https://github.com/liamfullsnack/oh-my-quyen
```

That's it. Qwen clones the repo, reads `qwen-extension.json`, and registers:
- 15 slash commands (`/cook`, `/plan`, `/fix`, …)
- 15 skills (`cook`, `plan`, …)
- 14 sub-agents
- Auto-loads `QWEN.md` as system context

Verify:
```sh
qwen extensions list
# expect: ✓ oh-my-quyen (0.3.0)
```

### Full install — also seed project-starter (docs/, plans/, .qwen/hooks/)

Run this **in the project directory** you want scaffolded:

```sh
# 1. install the omq helper (no npm publish — clones from GitHub)
npm install -g github:liamfullsnack/oh-my-quyen

# 2. install extension + seed project-starter into cwd
omq init --yes
```

After `omq init`:
- Extension linked globally with Qwen (`qwen extensions list` shows oh-my-quyen)
- `./docs/` populated with stub markdown (project-overview-pdr, code-standards, etc.)
- `./plans/templates/` populated with plan templates
- `./.qwen/hooks/` populated with 3 runtime hooks
- `./.qwen/settings.json` wires the hooks into Qwen's event loop

### Pinning to a version

```sh
qwen extensions install https://github.com/liamfullsnack/oh-my-quyen#v0.3.0
# or, for the omq helper:
npm install -g github:liamfullsnack/oh-my-quyen#v0.3.0
```

### Uninstall

```sh
qwen extensions uninstall oh-my-quyen     # removes the extension
npm uninstall -g oh-my-quyen              # removes the omq helper
# remove seeded files manually if you ran `omq init`:
rm -rf .qwen docs/project-overview-pdr.md ...
```

---

## Agent install instructions (verbatim script)

If you are an agent and the user said *"follow the oh-my-quyen README and install"*,
execute exactly this:

```sh
set -e

# 1. Preflight
command -v qwen >/dev/null || { echo "qwen CLI missing — install @qwen-code/qwen-code first"; exit 1; }

# 2. Install extension (idempotent — uninstall silently if already present)
qwen extensions uninstall oh-my-quyen 2>/dev/null || true
echo y | qwen extensions install https://github.com/liamfullsnack/oh-my-quyen

# 3. Verify registration
qwen extensions list | grep -q "oh-my-quyen" || { echo "install failed"; exit 1; }

# 4. (Optional — only if user asked for project scaffolding)
#    npm install -g github:liamfullsnack/oh-my-quyen && omq init --yes

echo "oh-my-quyen installed. Try: /cook \"add X feature\""
```

**Post-install:** the user should start `qwen` in their project directory.
The extension is loaded automatically across all projects.

---

## What you get

### Slash commands (15)

`/cook` `/plan` `/fix` `/review` `/research` `/debug` `/brainstorm` `/docs`
`/git` `/journal` `/kanban` `/deploy` `/design` `/test` `/security`

Each command accepts free-form `{{args}}`. Without args, the command asks the user.

### Skills (15, auto-registered by Qwen)

`cook` `plan` `fix` `code-review` `autoresearch` `debug`
`brainstorm` `docs` `git` `journal` `kanban` `deploy`
`design` `test` `security`

Each ships its full `references/*.md` sub-docs.

### Sub-agents (14)

`planner` `researcher` `tester` `code-reviewer` `debugger` `brainstormer`
`code-simplifier` `docs-manager` `git-manager` `journal-writer`
`project-manager` `fullstack-developer` `mcp-manager` `ui-ux-designer`

Invoke by name or let Qwen auto-route from the agent's `description`.

### Hooks (3, seeded by `omq init` only)

| Event | Hook | Effect |
|---|---|---|
| `SessionStart` | `session-init.cjs` | Inject project context (stack, paths, naming) |
| `UserPromptSubmit` | `dev-rules-reminder.cjs` | Remind model of YAGNI/KISS/DRY + conventions |
| `PreToolUse` | `privacy-block.cjs` | Block reads of `.env`, keys, credentials |

### Context file

`QWEN.md` at extension root — auto-loaded as system context for **all** projects.

---

## Prerequisites

```sh
node --version   # >= 18
qwen --version   # any — install: npm i -g @qwen-code/qwen-code
```

---

## Development

```sh
git clone https://github.com/liamfullsnack/oh-my-quyen
cd oh-my-quyen
npm test                   # smoke test: manifest, agents, commands, skills, hooks
npm run build              # regenerate agents/commands/skills from upstream zip
```

Build from a different upstream source bundle:
```sh
UPSTREAM_ZIP=/path/to/upstream.zip npm run build
```

---

## Extending

- **Add skills:** drop a new directory under `skills/<name>/` with a `SKILL.md` (Qwen-standard YAML frontmatter: `name`, `description`).
- **Add sub-agents:** drop a `.md` under `agents/<name>.md` with `name`/`description` frontmatter.
- **Add hooks:** drop a `.cjs` under `templates/project-starter/.qwen/hooks/` and register it in `templates/project-starter/.qwen/settings.json` under the matching event key.
- **Scope hooks globally:** merge the `hooks` block from the seeded `.qwen/settings.json` into `~/.qwen/settings.json`.

## License

MIT — see [LICENSE](LICENSE).
