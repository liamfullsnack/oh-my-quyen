---
description: "Write journal entries analyzing recent changes and session reflections."
---

The user invoked **/journal** with arguments (e.g. [topic or reflection]): {{args}}

Execute the workflow described below. If `{{args}}` is empty, ask the user for the missing input before proceeding.

---

# Journal

Use the `journal-writer` subagent to explore the memories and recent code changes, and write some journal entries.
Journal entries should be concise and focused on the most important events, key changes, impacts, and decisions.
Keep journal entries in the `./docs/journals/` directory.

**IMPORTANT:** Invoke "/project-organization" skill to organize the outputs.
