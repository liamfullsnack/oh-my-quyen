# Naming Patterns

> Auto-seeded by oh-my-quyen. Adjust per-project as needed.

## File Naming

| Language / Context | Convention | Examples |
|--------------------|------------|----------|
| JS / TS / Python / Shell | kebab-case | `user-auth.ts`, `data-parser.py` |
| C# / Java / Kotlin / Swift | PascalCase | `AuthService.java`, `UserModel.swift` |
| Go / Rust | snake_case | `user_auth.go`, `data_parser.rs` |

## Directory Naming

- kebab-case: `services/`, `lib/utils/`, `components/header/`
- No spaces, no uppercase

## Plan Directories

- Format: `plans/YYMMDD-HHMM-slug/`
- Example: `plans/260429-1430-add-auth/`

## Report Files

- Format: `reports/{type}-YYMMDD-HHMM-{slug}.md`
- Example: `reports/scout-260429-1430-add-auth.md`

## Commit Messages

- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Scope allowed: `feat(auth):`, `fix(api):`
- Subject line: imperative mood, ≤72 chars
- No AI co-author lines

## Code Structure

- Extract helpers after 200 lines per file
- Extract modules after 3 similar code patterns
- Never create `foo-v2.ts` alongside `foo.ts` — edit in place
