# Claude Code Configuration

## Project Overview
<!-- FILL THIS IN: Describe your project in 2-3 sentences, tech stack, key constraints -->

State files:
- `PROJECT.md` — project overview, goals, tech stack, constraints
- `REQUIREMENTS.md` — functional and non-functional requirements
- `ROADMAP.md` — milestone breakdown with status
- `STATE.md` — current session state, last completed task, next task queue

---

## Installed Tools & Commands

### GSD (Get Shit Done)
Spec-driven development lifecycle manager.

| Command | Purpose |
|---|---|
| `/gsd:new-project` | Initialize a new project with deep context gathering |
| `/gsd:discuss-phase` | Gather phase context through adaptive questioning |
| `/gsd:plan-phase` | Create detailed PLAN.md with verification loop |
| `/gsd:execute-phase` | Execute all plans with wave-based parallelization |
| `/gsd:verify-work` | Validate built features through conversational UAT |
| `/gsd:ship` | Create PR, run review, and prepare for merge |
| `/gsd:pause-work` | Create context handoff when pausing mid-phase |
| `/gsd:resume-work` | Resume work from previous session with full context |
| `/gsd:quick` | Execute a quick task with GSD guarantees |
| `/gsd:fast` | Execute a trivial task inline (no planning overhead) |
| `/gsd:autonomous` | Run all remaining phases autonomously |
| `/gsd:health` | Diagnose planning directory health |
| `/gsd:checkpoint` | Save current state to STATE.md |
| `/gsd:ui-phase` | Generate UI design contract (UI-SPEC.md) |
| `/gsd:ui-review` | 6-pillar visual audit of implemented frontend code |
| `/gsd:debug` | Systematic debugging with persistent state |
| `/gsd:session-report` | Generate session report with token usage |
| `/gsd:stats` | Display project statistics |

### gstack (by Garry Tan, YC CEO) — GLOBAL
Located at `~/.claude/skills/gstack/`. 25 skills covering the full deployment pipeline.

Key commands:
| Command | Purpose |
|---|---|
| `/office-hours` | YC-style product brainstorming — 6 forcing questions + competitor research + design doc |
| `/autoplan` | Runs CEO + eng + design reviews of a plan sequentially without prompts |
| `/plan-ceo-review` | Founder scope review (EXPANSION/HOLD/REDUCE), 10-star product exercise |
| `/plan-eng-review` | Eng manager review with ASCII test coverage diagrams + blast radius analysis |
| `/plan-design-review` | Designer's eye plan review — interactive, 0-10 scoring |
| `/review` | Superior PR review: CRITICAL+INFORMATIONAL, Greptile integration, adversarial |
| `/qa` | Full QA with headless browser, 10-phase process, fix loop (up to 50 fixes) |
| `/ship` | Full release pipeline: tests + coverage + review + CHANGELOG + bisectable commits + PR |
| `/land-and-deploy` | Merge + CI wait + deploy |
| `/canary` | Post-deploy monitoring loop |
| `/benchmark` | Performance regression: TTFB, FCP, LCP, bundle sizes |
| `/investigate` | Systematic root-cause debugging (Iron Law: no fixes without root cause) |
| `/retro` | Weekly retrospective with real git metrics |
| `/careful` | PreToolUse hook blocking dangerous commands |
| `/design-consultation` | Build complete DESIGN.md + HTML preview from scratch |
| `/design-review` | Live site visual audit via screenshots |

### Built-in Slash Commands
| Command | Purpose |
|---|---|
| `/flow` | Unified dev flow guide — tells you the right command for your current stage |
| `/plan` | Lightweight XML task planner for ad-hoc tasks (not a GSD phase) |
| `/tdd` | Manual TDD trigger |
| `/checkpoint` | Save current state to STATE.md |
| `/build-fix` | Systematic root cause debugging |
| `/multi-execute` | Spawn parallel subagents for independent tasks |
| `/update` | Update all tools to latest and re-apply flow integration layer |
| `/discover` | Scan GitHub trending for new Claude Code tools and integrate with approval |
| `/integrate` | Bring any repo, file, package, or best practices doc into the flow system |

---

## Development Flow

Run `/flow` at any time to get guided to the exact right command for your current stage.
Full pipeline reference: `docs/development-flow.md`

```
THINK → DESIGN → INIT → [ PLAN → BUILD → TEST → REVIEW → ACCEPT ] → SHIP → DEPLOY → MONITOR
```

---

## Tool Routing — Which Tool Wins When They Overlap

| Situation | Use This | Ignore This |
|---|---|---|
| Pre-code product/business decisions | `/office-hours` (gstack) | Superpowers `brainstorming` |
| Technical design brainstorming | Superpowers `brainstorming` | `/office-hours` |
| Starting a new feature or phase | `/gsd:discuss-phase` | Superpowers `brainstorming` (auto-triggers — override it) |
| Creating an implementation plan | `/gsd:plan-phase` | `/plan` command, Superpowers `writing-plans` |
| Reviewing a plan after `/gsd:plan-phase` | `/autoplan` (gstack) | — |
| Executing a plan | `/gsd:execute-phase` | Superpowers `subagent-driven-development` |
| Enforcing TDD | Superpowers `test-driven-development` (auto) | `/tdd` command (manual fallback) |
| Automated QA with browser | `/qa` (gstack) | — |
| Code review before merge | `/review` (gstack) | — |
| Live visual design audit | `/design-review` (gstack) | `/gsd:ui-review` (fallback if no browser) |
| Acceptance testing | `/gsd:verify-work` | — |
| Full release | `/ship` (gstack) | `/gsd:ship` (lightweight phase PRs only) |
| Deployment + canary | `/land-and-deploy` → `/canary` (gstack) | — |
| Performance regression | `/benchmark` (gstack) | — |
| Production debugging | `/investigate` (gstack) | `/gsd:debug` (dev-time) |
| Weekly retrospective | `/retro` (gstack) | — |
| Quick one-off task | `/gsd:quick` or `/plan` | Don't start full GSD lifecycle |
| UI implementation | `/gsd:ui-phase` → ui-ux-pro-max → `/gsd:ui-review` | — |
| Safety during risky operations | `/careful` + `/guard` (gstack) | — |

**The rule:** GSD owns the feature lifecycle. gstack owns the release pipeline. Superpowers enforces TDD and debugging in-task. Claude-Mem and UI/UX Pro Max are purely additive.

---

## TDD Mandate

Always RED-GREEN-REFACTOR. No exceptions.
- Write the failing test FIRST
- Watch it fail (never skip this step)
- Write minimum code to pass
- 80%+ test coverage required
- Never commit without passing tests

---

## Agent Pipeline (for every feature)

```
gsd-planner → gsd-phase-researcher → gsd-executor → gsd-verifier → gsd-nyquist-auditor
```

For code quality: `gsd-plan-checker → gsd-integration-checker`
For UI: add `gsd-ui-researcher → gsd-ui-auditor → gsd-ui-checker`

---

## Context Management

- Main session orchestrates ONLY — no heavy implementation in main context
- Keep main context at 30-40% utilization
- Spawn subagents for: tasks touching >10 files, parallelizable work, deep research
- At context limit: `/gsd:pause-work` → start fresh session → `/gsd:resume-work`

---

## Model Selection

| Model | When |
|---|---|
| `haiku` | Simple lookups, boilerplate, log parsing |
| `sonnet` | Default for all implementation (90% of time) |
| `opus` | Architecture decisions, security reviews, complex reasoning |

Switch profiles: `/gsd:set-profile quality` (opus) | `balanced` (default) | `budget` (haiku)

---

## Token Efficiency

- `MAX_THINKING_TOKENS=10000`
- Manual compaction before context fills: `/gsd:session-report` → start fresh
- Use `/gsd:map-codebase` to produce codebase docs instead of reading all files inline

---

## Security

- OWASP Top 10 compliance required
- No hardcoded secrets — always use environment variables
- Run `gsd-nyquist-auditor` on any commit touching auth, APIs, data handling
- Security findings require a fix, never a waiver

---

## UI/UX Work

1. `/gsd:ui-phase` — generates UI-SPEC.md design contract
2. Activate ui-ux-pro-max skill (auto-triggers on UI prompts)
3. Implement against the design contract with TDD
4. `/gsd:ui-review` — 6-pillar audit (hierarchy, typography, color, spacing, interaction, a11y)
5. Fix all findings before commit

---

## Commit Discipline

Format: `<type>(<scope>): <description>`
Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

- One logical task = one commit
- No `--no-verify` ever
- Reference plan task in commit body for non-trivial changes
- Use `/gsd:pr-branch` for clean PR branches (filters `.planning/` commits)

---

## Evidence-Over-Claims Rule

Never declare done based on reasoning alone. Required evidence:
- Tests: run suite, show passing output
- Features: demonstrate working behavior
- Fixes: show error is gone with reproduction steps
- Builds: show build succeeds
