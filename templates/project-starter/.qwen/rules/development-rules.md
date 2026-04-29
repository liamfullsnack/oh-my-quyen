# Development Rules

> Auto-seeded by oh-my-quyen. Edit this file to project-specific conventions.

## Principles

- **YAGNI** — no features, abstractions, error handling, or validation the task doesn't need
- **KISS** — simplest correct solution wins; three similar lines beat a premature abstraction
- **DRY** — eliminate duplication, but only after the third similar occurrence
- **Token efficiency** — terse outputs; sacrifice grammar for concision in reports

## Workflow

1. **Plan** first (unless the user says "just code it" or the fix is trivially obvious)
2. **Research** in parallel with `researcher` sub-agents if needed
3. **Implement** — edit existing files; never create `foo-v2.ts` siblings
4. **Compile / type-check** after every code edit
5. **Test** — 100% pass required; never disable failing tests
6. **Review** — run `/review` before finalizing
7. **Docs** — update `./docs/` for user-visible changes
8. **Commit** — conventional commits; no AI co-author lines

## When NOT to plan

- Trivially small one-line edits the user explicitly described
- User said "just code it" or "skip planning"
- Bug fix where the user already pointed at the line and the fix is obvious

Otherwise, plan first.

## Rules

- **File naming** — kebab-case for JS/TS/Python/shell; PascalCase for C#/Java/Kotlin/Swift; snake_case for Go/Rust
- **File size** — keep each file under ~200 lines; extract helpers, split concerns
- **No new enhanced files** — edit the existing file; never create `-v2` / `-enhanced` siblings
- **No mocking around problems** — implement the real thing; if blocked, report the blocker instead of faking data
- **Pre-commit** — run lint + tests; fix them, don't bypass with `--no-verify`
- **No secrets committed** — `.env`, credentials, API keys never enter git
- **Reports concision** — sacrifice grammar; list unresolved questions at the end
- **Docs location** — markdown stays in `./docs/` or `./plans/`; never scatter `.md` files at the repo root unless asked
