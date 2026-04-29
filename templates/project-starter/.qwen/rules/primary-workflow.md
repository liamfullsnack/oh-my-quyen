# Primary Workflow

> Auto-seeded by oh-my-quyen. This is the standard workflow for non-trivial tasks.

## Flow

```
[Intent Detection] → [Research?] → [Review] → [Plan] → [Review] → [Implement] → [Review] → [Test?] → [Review] → [Finalize]
```

## Decision Tree

| Input Pattern | Mode | Behavior |
|---------------|------|----------|
| Path to `plan.md` or `phase-*.md` | code | Execute existing plan |
| Contains "fast", "quick" | fast | Skip research, scout→plan→code |
| Contains "trust me", "auto" | auto | Auto-approve all steps |
| Lists 3+ features OR "parallel" | parallel | Multi-agent execution |
| Contains "no test", "skip test" | no-test | Skip testing step |
| Default | interactive | Full workflow with user input |

## Blocking Gates (non-auto)

- **Post-Research:** Review findings before planning
- **Post-Plan:** Approve plan before implementation
- **Post-Implementation:** Approve code before testing
- **Post-Testing:** 100% pass + approve before finalize

## Finalize (mandatory)

1. Sync plan back — all completed tasks/steps across phases
2. Update `plan.md` status/progress
3. Update `./docs/` if changes are user/API-visible
4. Ask user if they want to commit
5. Write a concise technical journal entry
