# /checkpoint — Save Current State to STATE.md

Capture a snapshot of the current session state for continuity across sessions.

## Instructions

1. **Identify completed work** — list tasks finished since last checkpoint
2. **Identify current position** — what task is in progress right now
3. **Identify next tasks** — what comes next in the plan
4. **Note any blockers** — unresolved issues, open questions, external dependencies
5. **Write to STATE.md** — overwrite with updated content

## STATE.md Format

```markdown
# Session State

## Last Session
Ended: <ISO timestamp>

## Last Completed Task
<Task ID and description from the plan>
Evidence: <brief description of verification performed>

## Current Task (In Progress)
<Task ID and description, or "none">

## Next Tasks Queue
1. <Task ID>: <description>
2. <Task ID>: <description>
3. <Task ID>: <description>

## Blockers
- <blocker description> — waiting on: <what/who>

## Recent Decisions
- <decision made and why — only non-obvious decisions>

## Activity Log
- [timestamp] <significant action taken>
```

## Rules
- Keep STATE.md under 200 lines
- When it approaches 200 lines, summarize completed milestones into ROADMAP.md
- Always include evidence for the last completed task
- Blockers must name what is blocking, not just "blocked"
- After writing STATE.md, confirm: "Checkpoint saved."
