# End-to-End Development Flow

Complete reference for the full development workflow using all installed tools: GSD, gstack, UI/UX Pro Max, Superpowers, and Claude-Mem.

---

## Quick Start — The only command you need

```
/flow
```

`/flow` is your unified entry point. You never need to remember whether something is a GSD, gstack, or Superpowers command — just describe what you want to do and `/flow` routes you to the right command and offers to run it.

**Examples:**
```
/flow                        ← what should I do next? (reads STATE.md)
/flow plan                   ← start planning a phase
/flow build                  ← ready to implement
/flow ship                   ← time to release
/flow debug                  ← something broke
/flow backlog                ← capture an idea
/flow session                ← save state or resume
/flow config                 ← switch model or update tools
```

**Also accepts natural language:**
> "I want to start a new feature" → shows PLAN steps
> "Something broke in prod" → shows /investigate
> "Capture this idea for later" → shows /gsd:note
> "I'm done for the day" → shows /gsd:pause-work

This document is the reference behind `/flow`. You don't need to read it — but it's here when you want to understand why a command was recommended.

---

## The Full Pipeline

```
THINK     → /office-hours
DESIGN    → /design-consultation + UI/UX Pro Max skill
INIT      → /gsd:new-project
──── For each phase: ─────────────────────────────────────────────────────────
PLAN      → /gsd:discuss-phase
           → /gsd:plan-phase
           → /autoplan  (CEO + eng + design review of the plan)
BUILD     → /gsd:execute-phase
             (Superpowers TDD skill auto-enforces RED-GREEN-REFACTOR)
             (UI only: /gsd:ui-phase → UI/UX Pro Max → implement → /gsd:ui-review)
TEST      → /qa  (browser automation + full test suite + fix loop)
REVIEW    → /review  (CRITICAL+INFORMATIONAL + Greptile + adversarial)
ACCEPT    → /gsd:verify-work  (user-story acceptance testing)
SHIP      → /ship  (version bump + CHANGELOG + bisectable commits + PR)
DEPLOY    → /land-and-deploy  (merge + CI wait + deploy)
MONITOR   → /canary + /benchmark
──── Weekly: ─────────────────────────────────────────────────────────────────
REFLECT   → /retro  (engineering retrospective with real git metrics)
──── Always on: ──────────────────────────────────────────────────────────────
SAFETY    → /careful + /guard
MEMORY    → Claude-Mem  (auto, no action needed)
DEBUG     → /investigate (production) · /gsd:debug (dev-time) · /build-fix (quick)
SESSION   → /gsd:pause-work · /gsd:resume-work · /flow
AUTONOMOUS → /gsd:autonomous  (run all remaining phases unattended)
```

---

## Phase-by-Phase Breakdown

### THINK — Validate the idea before writing code

**Tool:** `/office-hours` (gstack)

```
/office-hours
```

- Asks 6 forcing questions about your product idea
- Researches competitors
- Surfaces the riskiest assumptions
- Produces a design doc with clear problem/solution/differentiation

Skip when: the feature is a pure implementation task with no product ambiguity.

---

### DESIGN — Create the design contract

**Tools:** `/design-consultation` (gstack) + UI/UX Pro Max skill

```
/design-consultation
```

- Builds a complete `DESIGN.md` + HTML preview
- UI/UX Pro Max skill auto-activates to provide pattern matching: 67 styles, 96 palettes, 57 font pairings, stack-specific patterns (Next.js, React, Vue, Tailwind, shadcn, etc.)

Output: `DESIGN.md` + HTML preview file.

For mid-phase UI design (not a full product design), use `/gsd:ui-phase` instead — it generates a scoped `UI-SPEC.md` for a specific phase.

---

### INIT — Project initialization

**Tool:** `/gsd:new-project` (GSD)

```
/gsd:new-project
```

Generates:
- `PROJECT.md` — vision, goals, tech stack, constraints
- `REQUIREMENTS.md` — functional + non-functional requirements (v1/v2 scoped)
- `ROADMAP.md` — phased milestone breakdown
- `STATE.md` — current session state

For existing codebases, run `/gsd:map-codebase` first to analyze the codebase before initializing.

---

### PLAN — Phase planning (repeat per phase)

Three steps, always in this order:

**Step 1 — Clarify scope:**
```
/gsd:discuss-phase [N]
```
- Adaptive questioning surfaces assumptions and edge cases
- `--auto` flag skips interactive questions (Claude picks sensible defaults)
- Outputs `CONTEXT.md`

**Step 2 — Create the atomic task breakdown:**
```
/gsd:plan-phase [N]
```
- Spawns: `gsd-phase-researcher` → `gsd-planner` → `gsd-plan-checker`
- Research phase → atomic task breakdown (2–5 min tasks) → verification loop
- Outputs `PLAN.md`

**Step 3 — Multi-perspective plan review:**
```
/autoplan
```
Runs three sequential reviews without user prompts:
- `/plan-ceo-review` — founder lens: scope creep, EXPANSION/HOLD/REDUCE, 10-star product exercise
- `/plan-eng-review` — eng manager lens: test coverage, blast radius, technical debt, ASCII coverage diagrams
- `/plan-design-review` — design lens: 7 audit passes, 0–10 scoring

Fix any issues before BUILD. Do not skip this step.

---

### BUILD — Implementation (repeat per phase)

**Tools:** `/gsd:execute-phase` (GSD) + Superpowers TDD (auto-enforced)

```
/gsd:execute-phase [N]
```

- Wave-based parallel execution: independent tasks run simultaneously
- Each task spawns a fresh `gsd-executor` subagent with isolated context
- Atomic commits per task: `feat(scope): what and why`
- Superpowers `test-driven-development` skill auto-enforces RED → GREEN → REFACTOR throughout — no manual TDD trigger needed

**For UI phases**, add these around execute:
```
/gsd:ui-phase [N]       ← BEFORE execute: generates UI-SPEC.md design contract
/gsd:execute-phase [N]
/gsd:ui-review [N]      ← AFTER execute: 6-pillar audit (hierarchy, typography, color, spacing, interaction, a11y)
```

---

### TEST — Automated QA with real browser

**Tool:** `/qa` (gstack)

```
/qa
```

- Launches headless Chromium via the `/browse` daemon (Playwright)
- Runs the full test suite
- 10-phase QA process: functional, visual, accessibility, performance, edge cases, and more
- Auto-fix loop: up to 50 fixes per run
- Outputs a health score and prioritized issue list

Report only (no auto-fixes):
```
/qa-only
```

---

### REVIEW — Code review

**Tool:** `/review` (gstack)

```
/review
```

Two passes:
1. **CRITICAL** — bugs, security issues, correctness problems that must be fixed before merge
2. **INFORMATIONAL** — suggestions, style improvements that are optional

Additional capabilities:
- Greptile integration for codebase-aware review comments (not just the diff in isolation)
- Adversarial review pass (assumes the worst about every decision)
- Diff-scope-aware (only reviews what changed, never the whole codebase)

For cross-model review (Claude + OpenAI adversarial on the same diff):
```
/codex
```

---

### ACCEPT — User story acceptance

**Tool:** `/gsd:verify-work` (GSD)

```
/gsd:verify-work [N]
```

- Tests each acceptance criterion from `REQUIREMENTS.md`
- Requires evidence: runs it, shows output — reasoning alone is not accepted
- Auto-generates a fix plan if any criterion fails

Only declare a phase complete after this passes.

---

### SHIP — Release

**Tool:** `/ship` (gstack)

For full releases (version bumps, CHANGELOG, production PRs):
```
/ship
```

Pipeline:
1. Runs test suite
2. Runs eval suites (if configured)
3. Checks coverage thresholds
4. Runs `/review` again
5. Greptile codebase analysis
6. Bumps version
7. Generates CHANGELOG entry
8. Creates bisectable commits
9. Final verification pass
10. Pushes + creates PR
11. Runs `/document-release` (updates README, ARCHITECTURE, CLAUDE.md automatically)

For lightweight phase PRs (iterative work, not a full release):
```
/gsd:ship [N]
```

To create a clean PR branch that strips `.planning/` commits:
```
/gsd:pr-branch
```

---

### DEPLOY — Deployment

**Tool:** `/land-and-deploy` (gstack)

After PR is approved:
```
/land-and-deploy
```

- Merges the PR
- Waits for CI to pass
- Triggers deploy
- Waits for deploy to complete
- Kicks off canary verification automatically

---

### MONITOR — Post-deploy health check

**Tools:** `/canary` + `/benchmark` (gstack)

```
/canary      # monitors for errors, regressions, anomalies post-deploy
/benchmark   # compares TTFB, FCP, LCP, bundle sizes against stored baseline
```

Run both after every deploy. `/canary` auto-alerts on anomalies. `/benchmark` catches performance regressions before users notice.

---

## Weekly Rhythm

```
/retro
```

Generates a retrospective using real git data — no manual input needed:
- Commit frequency and PR cycle times
- Hotspot files (most frequently changed)
- Contributor breakdown
- Engineering velocity trends

---

## Always-On Systems

### The /flow command

Your personal unified guide. Run it any time you're unsure what to do next:

```
/flow           # reads STATE.md, tells you the next command
/flow plan      # jump to PLAN stage
/flow build     # jump to BUILD stage
/flow ship      # jump to SHIP stage
```

Accepts any stage name or natural language: "I want to start a new feature", "I'm ready to ship", "something broke".

### Safety hooks

```
/careful     # PreToolUse hook: blocks rm -rf, DROP TABLE, force push, and other destructive commands
/guard       # locks a directory from any edits
/unfreeze    # removes the lock
```

Activate `/careful` at the start of any session involving migrations, infra changes, or destructive operations.

### Memory

Claude-Mem captures every session automatically — no action required:
- SQLite at `~/.claude-mem/claude-mem.db`
- Chroma vector DB for semantic search
- Query past sessions: invoke the `mem-search` skill
- Web viewer at `http://localhost:37777`

### Session management

When context fills up mid-task:
```
/gsd:pause-work    # creates a handoff file with full context
# start a new Claude Code session
/gsd:resume-work   # restores full context from the handoff file
```

Manual checkpoint at any time:
```
/gsd:checkpoint    # or /checkpoint
```

Track session progress and token usage:
```
/gsd:session-report
```

### Debugging

| Situation | Command |
|---|---|
| Production bug, unknown root cause | `/investigate` — Iron Law: no fix without root cause |
| Dev-time bug, need systematic approach | `/gsd:debug` |
| Build broken, quick inline fix | `/build-fix` |

### Running phases autonomously

To run all remaining phases without user prompts:
```
/gsd:autonomous
```

Runs discuss → plan → execute for every incomplete phase in ROADMAP.md sequentially. Add `--from N` to start from a specific phase.

This is the integrated way to run unattended. ralph-wiggum (the external CLI) is not wired into any commands and requires manually written prompts — use `/gsd:autonomous` instead.

---

## Complete Command Reference

### /flow — Unified dev flow guide

| Command | What it does |
|---|---|
| `/flow` | Reads STATE.md, shows next command for your current stage |
| `/flow [stage]` | Jumps directly to a named stage (plan, build, test, review, ship, etc.) |

---

### GSD commands — Feature lifecycle

**Lifecycle (in order):**

| Command | What it does |
|---|---|
| `/gsd:new-project` | Full project initialization: guided questions → PROJECT.md + REQUIREMENTS.md + ROADMAP.md |
| `/gsd:new-milestone` | Start a new milestone cycle, update PROJECT.md and route to requirements |
| `/gsd:discuss-phase [N]` | Clarify phase scope through adaptive questioning → CONTEXT.md |
| `/gsd:plan-phase [N]` | Research + atomic task breakdown + verification loop → PLAN.md |
| `/gsd:execute-phase [N]` | Wave-based parallel execution, fresh subagent per task, atomic commits |
| `/gsd:verify-work [N]` | UAT against requirements with evidence; auto-generates fix plans |
| `/gsd:ship [N]` | Create lightweight PR from verified work |

**Planning helpers:**

| Command | What it does |
|---|---|
| `/gsd:research-phase [N]` | Research how to implement a phase (standalone — usually use plan-phase instead) |
| `/gsd:list-phase-assumptions [N]` | Surface Claude's assumptions about a phase approach before planning |
| `/gsd:validate-phase [N]` | Retroactively audit and fill Nyquist validation gaps for a completed phase |
| `/gsd:add-phase` | Add a phase to the end of the current milestone in the roadmap |
| `/gsd:insert-phase` | Insert urgent work as a decimal phase (e.g., 7.1) between existing phases |
| `/gsd:remove-phase` | Remove a future phase from the roadmap and renumber |
| `/gsd:add-tests [N]` | Generate tests for a completed phase based on UAT criteria and implementation |

**UI work:**

| Command | What it does |
|---|---|
| `/gsd:ui-phase [N]` | Generate UI design contract (UI-SPEC.md) for a frontend phase |
| `/gsd:ui-review [N]` | 6-pillar visual audit: hierarchy, typography, color, spacing, interaction, a11y |

**Quick tasks (no full lifecycle):**

| Command | What it does |
|---|---|
| `/gsd:quick` | Execute a quick task with GSD guarantees (atomic commits, state tracking) but skip optional agents |
| `/gsd:fast` | Execute a trivial task inline — no subagents, no planning overhead |
| `/gsd:do` | Route freeform text to the right GSD command automatically |
| `/gsd:next` | Auto-detect and advance to the next logical step in the GSD workflow |

**Session and context:**

| Command | What it does |
|---|---|
| `/gsd:pause-work` | Create context handoff file when pausing work mid-phase |
| `/gsd:resume-work` | Restore full context from handoff file at session start |
| `/gsd:checkpoint` | Save current state to STATE.md |
| `/gsd:session-report` | Generate session report with token usage estimates and work summary |
| `/gsd:thread` | Manage persistent context threads for cross-session work |

**Milestones and backlog:**

| Command | What it does |
|---|---|
| `/gsd:complete-milestone` | Archive completed milestone and prepare for next version |
| `/gsd:audit-milestone` | Audit milestone completion against original intent before archiving |
| `/gsd:plan-milestone-gaps` | Create phases to close gaps identified by milestone audit |
| `/gsd:cleanup` | Archive accumulated phase directories from completed milestones |
| `/gsd:add-backlog` | Add an idea to the backlog parking lot (999.x numbering) |
| `/gsd:review-backlog` | Review and promote backlog items to active milestone |
| `/gsd:add-todo` | Capture an idea or task as a todo from the current conversation |
| `/gsd:check-todos` | List pending todos and select one to work on |
| `/gsd:note` | Zero-friction idea capture: append, list, or promote notes to todos |
| `/gsd:plant-seed` | Capture a forward-looking idea with trigger conditions — surfaces at the right milestone |

**Debugging and diagnostics:**

| Command | What it does |
|---|---|
| `/gsd:debug` | Systematic debugging with persistent state across context resets |
| `/gsd:health` | Diagnose planning directory health and optionally repair issues |
| `/gsd:progress` | Check project progress, show context, and route to next action |
| `/gsd:stats` | Display project statistics: phases, plans, requirements, git metrics, timeline |
| `/gsd:audit-uat` | Cross-phase audit of all outstanding UAT and verification items |

**Configuration and meta:**

| Command | What it does |
|---|---|
| `/gsd:set-profile` | Switch model profile: `quality` (opus) · `balanced` (sonnet) · `budget` (haiku) |
| `/gsd:settings` | Configure GSD workflow toggles and model profile |
| `/gsd:map-codebase` | Analyze codebase with parallel mapper agents → `.planning/codebase/` docs |
| `/gsd:profile-user` | Generate developer behavioral profile and create Claude-discoverable artifacts |
| `/gsd:pr-branch` | Create clean PR branch by filtering out `.planning/` commits |
| `/gsd:autonomous` | Run all remaining phases autonomously: discuss → plan → execute per phase |
| `/gsd:update` | Update GSD to latest version with changelog display |
| `/gsd:reapply-patches` | Reapply local modifications after a GSD update |
| `/gsd:help` | Show available GSD commands and usage guide |
| `/gsd:review` | Request cross-AI peer review of phase plans from external AI CLIs |

---

### gstack commands — Release pipeline

**Product and planning:**

| Command | What it does |
|---|---|
| `/office-hours` | YC-style product brainstorming: 6 forcing questions → competitor research → design doc |
| `/autoplan` | Sequential CEO + eng + design review of a plan, no user prompts |
| `/plan-ceo-review` | Founder scope review: EXPANSION/HOLD/REDUCE decision, 10-star product exercise |
| `/plan-eng-review` | Eng manager review: ASCII test coverage diagrams, blast radius analysis, tech debt |
| `/plan-design-review` | Design audit of plans: 7 passes, 0–10 scoring |

**Design:**

| Command | What it does |
|---|---|
| `/design-consultation` | Build complete DESIGN.md + HTML preview from scratch |
| `/design-review` | Live site visual audit via screenshots: 10 categories, AI slop detection |

**QA and testing:**

| Command | What it does |
|---|---|
| `/qa` | Full QA with headless Chromium: 10-phase process, auto-fix loop (up to 50 fixes), health score |
| `/qa-only` | QA report only, no auto-fixes |
| `/browse` | Persistent headless Chromium daemon (Playwright) — powers qa/design-review/canary/benchmark |

**Code review:**

| Command | What it does |
|---|---|
| `/review` | Two-pass review: CRITICAL + INFORMATIONAL, Greptile integration, adversarial pass |
| `/codex` | Cross-model review: Claude + OpenAI adversarial on the same diff |

**Shipping:**

| Command | What it does |
|---|---|
| `/ship` | Full release pipeline: tests → coverage → review → CHANGELOG → bisectable commits → PR |
| `/document-release` | Auto-updates README, ARCHITECTURE, CLAUDE.md, TODOS post-ship |

**Deployment and monitoring:**

| Command | What it does |
|---|---|
| `/land-and-deploy` | Merge + CI wait + deploy |
| `/canary` | Post-deploy monitoring loop: errors, regressions, anomalies |
| `/benchmark` | Performance regression: TTFB, FCP, LCP, bundle sizes vs baseline |
| `/setup-deploy` | Configure deployment integration |

**Safety:**

| Command | What it does |
|---|---|
| `/careful` | PreToolUse hook: blocks rm -rf, DROP TABLE, force push, and other destructive commands |
| `/guard` | Lock a directory from any edits |
| `/freeze` | Alias for /guard |
| `/unfreeze` | Remove directory lock |

**Retrospective:**

| Command | What it does |
|---|---|
| `/retro` | Weekly engineering retrospective with real git metrics, contributor breakdown, velocity |

**Setup and maintenance:**

| Command | What it does |
|---|---|
| `/gstack-upgrade` | Self-updater: pull latest gstack and rebuild |
| `/setup-browser-cookies` | Configure browser session cookies for authenticated QA |
| `/cso` | Chief Security Officer review mode |

---

### Built-in slash commands

| Command | What it does |
|---|---|
| `/flow` | Unified dev flow guide — tells you the right command for your current stage |
| `/plan` | Lightweight XML task planner for ad-hoc tasks (not a GSD phase) |
| `/tdd` | Manual TDD trigger (Superpowers `test-driven-development` auto-enforces this — use as fallback) |
| `/checkpoint` | Save current state to STATE.md |
| `/build-fix` | Systematic root cause debugging for broken builds |
| `/multi-execute` | Spawn parallel subagents for independent task waves |

---

### Superpowers skills (auto-triggering)

These activate automatically based on context — you don't invoke them directly. Listed here so you know what's running:

| Skill | Triggers when | What it does |
|---|---|---|
| `using-superpowers` | Every session start | Injects system context explaining the full skill set |
| `brainstorming` | Feature design discussions | Socratic refinement with a hard gate blocking code until spec is approved |
| `writing-plans` | Creating task plans | Bite-sized plans with exact file paths, 2–5 min tasks |
| `test-driven-development` | Writing any new code | Strict RED-GREEN-REFACTOR; deletes pre-test code |
| `subagent-driven-development` | Executing task plans | Fresh subagent per task, two-stage review |
| `executing-plans` | Batch task execution | Human checkpoints between waves |
| `systematic-debugging` | Debugging sessions | 4-phase root cause process |
| `verification-before-completion` | Claiming tasks done | Requires evidence before marking complete |
| `using-git-worktrees` | Branch creation | Branch isolation after design approval |
| `requesting-code-review` | Pre-review checklist | Structured checklist before submitting for review |
| `receiving-code-review` | Post-review checklist | Structured checklist after receiving review |
| `dispatching-parallel-agents` | Parallel work | Concurrent subagent coordination |
| `finishing-a-development-branch` | Branch completion | Merge/PR/keep/discard decision flow |
| `writing-skills` | Creating new skills | Best-practice skill creation guidance |

> **Override rule:** When Superpowers' `brainstorming` skill auto-triggers but you want GSD's `/gsd:discuss-phase` instead, say "Skip brainstorming skill, use /gsd:discuss-phase." GSD is project-state-aware; Superpowers is generic.

---

## GSD Agents Reference

These agents are spawned automatically by GSD commands — you don't invoke them directly. Listed here for transparency:

| Agent | Spawned by | What it does |
|---|---|---|
| `gsd-planner` | `/gsd:plan-phase` | Creates the atomic task breakdown in PLAN.md |
| `gsd-phase-researcher` | `/gsd:plan-phase` | Researches implementation approach before planning |
| `gsd-advisor-researcher` | Various | Provides research and advisory analysis |
| `gsd-project-researcher` | `/gsd:new-project` | Researches project context and requirements |
| `gsd-research-synthesizer` | Research phases | Synthesizes multiple research outputs into coherent findings |
| `gsd-executor` | `/gsd:execute-phase` | Implements individual tasks (one fresh instance per task) |
| `gsd-verifier` | `/gsd:verify-work` | Validates completion against acceptance criteria |
| `gsd-plan-checker` | `/gsd:plan-phase` | Validates plan quality before execution |
| `gsd-integration-checker` | Code quality passes | Checks integration points between components |
| `gsd-nyquist-auditor` | Post-commit audits | Retroactive validation — ensures nothing was missed |
| `gsd-debugger` | `/gsd:debug` | Systematic debugging with persistent state |
| `gsd-codebase-mapper` | `/gsd:map-codebase` | Analyzes entire codebase structure in parallel |
| `gsd-roadmapper` | Milestone planning | Plans and structures milestone breakdowns |
| `gsd-ui-researcher` | `/gsd:ui-phase` | Researches UI patterns and requirements |
| `gsd-ui-auditor` | `/gsd:ui-review` | Runs the 6-pillar visual audit |
| `gsd-ui-checker` | UI quality passes | Checks UI implementation against the design contract |
| `gsd-user-profiler` | `/gsd:profile-user` | Generates developer behavioral profile |

---

## Tool Routing Quick Reference

| Situation | Use | Not |
|---|---|---|
| Unsure what to do next | `/flow` | — |
| Pre-code product/business decisions | `/office-hours` | Superpowers `brainstorming` |
| Technical design brainstorming | Superpowers `brainstorming` (auto) | `/office-hours` |
| Phase planning | `/gsd:discuss-phase` → `/gsd:plan-phase` | `/plan` command |
| Plan review | `/autoplan` | — |
| Execution | `/gsd:execute-phase` | Superpowers `subagent-driven-development` |
| TDD enforcement | Superpowers `test-driven-development` (auto) | `/tdd` (manual fallback only) |
| Automated QA | `/qa` | — |
| Live visual design audit | `/design-review` (real screenshots) | `/gsd:ui-review` (fallback if no browser) |
| Code review | `/review` (gstack) | — |
| Cross-model review | `/codex` | — |
| Acceptance testing | `/gsd:verify-work` | — |
| Full release | `/ship` (gstack) | `/gsd:ship` (lightweight phase PRs only) |
| Deployment + canary | `/land-and-deploy` → `/canary` | — |
| Performance regression | `/benchmark` | — |
| Production debugging | `/investigate` (Iron Law) | `/gsd:debug` (dev-time) |
| Build broken | `/build-fix` | — |
| Run all phases unattended | `/gsd:autonomous` | ralph-wiggum (not integrated) |
| Weekly retrospective | `/retro` | — |

---

## Tool Stack Summary

| Tool | Type | Scope | Primary Role |
|---|---|---|---|
| `/flow` | Slash command | Local (project) | Unified entry point — guides you to the right command at every stage |
| GSD v1.27.0 | 50 slash commands + 17 agents | Local (project) | Feature lifecycle: init → plan → execute → verify → ship |
| gstack | 25+ skills | Global (`~/.claude/skills/gstack/`) | Release pipeline: qa → review → ship → deploy → monitor + safety + retro |
| UI/UX Pro Max | Skill | Local (project) | Design pattern database: 67 styles, 96 palettes, 57 font pairings, stack patterns |
| Superpowers | 14 auto-triggering skills | Global (`~/.claude/plugins/obra/superpowers/`) | In-task enforcement: TDD, debugging methodology, code review checklists |
| Claude-Mem | Plugin with 6 hooks | Global (`~/.claude/plugins/marketplaces/thedotmack/`) | Persistent cross-session memory via SQLite + vector search |
| ralph-wiggum | External CLI | Global (`~/.bun/bin/ralph`) | Shell-level retry loop for Claude Code — not integrated into any commands; use `/gsd:autonomous` instead |
