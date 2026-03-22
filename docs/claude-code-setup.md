# Claude Code Power Setup Guide

Complete, reproducible setup for a maximally efficient Claude Code environment using the best community tools. Sourced from: https://x.com/hasantoxr/status/2035312729427480840

---

## What This Installs

| Tool | Type | Where | What It Does |
|---|---|---|---|
| GSD (Get Shit Done) | Local slash commands + agents | `.claude/commands/gsd/` + `.claude/agents/` | 50 slash commands + 17 agents for full spec-driven dev lifecycle |
| gstack | Global skills | `~/.claude/skills/gstack/` | 25 skills: QA, review, ship, deploy, canary, benchmark, retro, safety hooks |
| UI/UX Pro Max | Local skill | `.claude/skills/ui-ux-pro-max/` | Design system intelligence: 67 styles, 161 palettes, 57 font pairings |
| Superpowers | Global plugin | `~/.claude/plugins/obra/superpowers/` | 14 auto-triggering skills: TDD, debugging, subagent execution, code review |
| Claude-Mem | Global plugin | `~/.claude/plugins/marketplaces/thedotmack/` | Persistent cross-session memory via SQLite + vector search |
| ralph-wiggum | Global CLI | `~/.bun/bin/ralph` | Autonomous iterative agent loops until task completion |
| `/flow` wrapper | Local slash command | `.claude/commands/flow.md` | Personal unified flow guide — tells you exactly what to run at each stage, no tool trivia |

**Skipped** (not Claude Code specific): LightRAG (Python RAG framework), n8n-MCP (workflow automation), Obsidian Skills (Obsidian-specific).

---

## Prerequisites

### Required
- **Claude Code** — latest version (`claude --version` to verify)
- **Node.js 20+** — required by GSD and uipro-cli
- **Python 3.x** — required by UI/UX Pro Max search engine (no pip dependencies)
- **git** — required by gstack (`sudo dnf install -y git` on Amazon Linux, `brew install git` on macOS, `sudo apt install -y git` on Ubuntu)

### Install Node.js (if missing)
```bash
# Amazon Linux / RHEL / CentOS
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum install -y nodejs

# macOS
brew install node

# Ubuntu / Debian
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt-get install -y nodejs

# Verify
node --version   # should be v20+
npm --version
```

### Install Bun (required for ralph-wiggum and Claude-Mem)
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bash_profile   # or ~/.zshrc on macOS
bun --version
```

---

## Step 1 — Install ralph-wiggum (optional but useful)

ralph-wiggum runs Claude Code in a loop until a task is complete. Useful for long autonomous tasks.

```bash
bun add -g @th0rgal/ralph-wiggum

# Verify
bun run ralph --help
```

**Usage:**
```bash
# Create a PROMPT.md with your task, then:
bun run ralph --prompt-file PROMPT.md --agent claude-code \
  --completion-promise "COMPLETE" --max-iterations 5

# Note: Claude Code outputs <promise>COMPLETE</promise> (XML-wrapped)
# Use this to match it:
bun run ralph --prompt-file PROMPT.md --agent claude-code \
  --completion-promise "promise>COMPLETE" --max-iterations 5
```

---

## Step 2 — Install GSD (Get Shit Done) — LOCAL to project

Run from inside your project directory:

```bash
cd /your/project
npx get-shit-done-cc@latest --claude --local
```

This installs to `.claude/commands/gsd/` (50 commands) and `.claude/agents/` (17 agents). Requires Node.js 20+.

**What you get:**
- `/gsd:new-project` — full project initialization with requirements gathering
- `/gsd:discuss-phase [N]` — clarify scope before planning
- `/gsd:plan-phase [N]` — research + plan + verify (spawns researcher + planner + checker agents)
- `/gsd:execute-phase [N]` — wave-based parallel execution (spawns fresh subagent per task)
- `/gsd:verify-work [N]` — user acceptance testing with auto-generated fix plans
- `/gsd:ship [N]` — create PR from verified work
- `/gsd:next` — auto-detect and run next step
- `/gsd:quick` — ad-hoc task with GSD guarantees (no full lifecycle)
- `/gsd:map-codebase` — analyze existing codebase before starting on it
- `/gsd:pause-work` / `/gsd:resume-work` — session handoffs
- `/gsd:debug` — systematic debugging with persistent state
- `/gsd:ui-phase` / `/gsd:ui-review` — UI design contract + 6-pillar visual audit
- 36 more commands for backlog, threads, milestones, stats, etc.

**To update GSD later:**
```bash
npx get-shit-done-cc@latest --claude --local
```

**Recommended permissions** — add to `.claude/settings.json`:
```json
{
  "permissions": {
    "allow": [
      "Bash(date:*)", "Bash(echo:*)", "Bash(cat:*)", "Bash(ls:*)",
      "Bash(mkdir:*)", "Bash(wc:*)", "Bash(head:*)", "Bash(tail:*)",
      "Bash(sort:*)", "Bash(grep:*)", "Bash(tr:*)",
      "Bash(git add:*)", "Bash(git commit:*)", "Bash(git status:*)",
      "Bash(git log:*)", "Bash(git diff:*)", "Bash(git tag:*)"
    ]
  }
}
```

Or for frictionless automation (recommended for autonomous work):
```bash
claude --dangerously-skip-permissions
```

---

## Step 3 — Install UI/UX Pro Max — LOCAL to project

```bash
cd /your/project
npx uipro-cli init --ai claude
```

This installs the skill to `.claude/skills/ui-ux-pro-max/` with:
- `SKILL.md` — the skill definition (auto-activates on UI/UX prompts)
- `data/` — 15 CSV databases (styles, colors, typography, UX guidelines, stack-specific patterns)
- `scripts/` — Python BM25 search engine (no pip installs needed)

**Supported stacks in the data:** html-tailwind, react, nextjs, astro, vue, nuxtjs, svelte, shadcn, swiftui, react-native, flutter, nuxt-ui, jetpack-compose

**If `npx uipro-cli` fails**, clone manually:
```bash
cd /tmp
git clone https://github.com/nextlevelbuilder/ui-ux-pro-max-skill uipro-skill
mkdir -p /your/project/.claude/skills
cp -r /tmp/uipro-skill/.claude/skills/ui-ux-pro-max /your/project/.claude/skills/
cp -r /tmp/uipro-skill/src/ui-ux-pro-max/data /your/project/.claude/skills/ui-ux-pro-max/
cp -r /tmp/uipro-skill/src/ui-ux-pro-max/scripts /your/project/.claude/skills/ui-ux-pro-max/
```

**Manual search usage:**
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "dashboard SaaS" --domain style
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "dark theme" --stack nextjs
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "my app" --design-system --persist
```

---

## Step 4 — Install Superpowers — GLOBAL

Superpowers installs globally so it's available in all your Claude Code sessions.

**Option A: Claude Code plugin marketplace (preferred)**
```
/plugin install superpowers@claude-plugins-official
```

**Option B: Manual clone (if plugin marketplace unavailable)**
```bash
mkdir -p ~/.claude/plugins/obra
git clone https://github.com/obra/superpowers ~/.claude/plugins/obra/superpowers
```

**What you get** (14 skills that auto-trigger by context):
- `brainstorming` — Socratic design refinement; has a HARD GATE blocking code until spec is approved
- `writing-plans` — bite-sized task plans with exact file paths, 2-5 min each
- `subagent-driven-development` — fresh subagent per task, two-stage review
- `executing-plans` — batch execution with human checkpoints
- `test-driven-development` — strict RED-GREEN-REFACTOR; deletes pre-test code
- `systematic-debugging` — 4-phase root cause process
- `verification-before-completion` — evidence required before done
- `using-git-worktrees` — branch isolation after design approval
- `requesting-code-review` / `receiving-code-review` — pre/post review checklists
- `dispatching-parallel-agents` — concurrent subagent coordination
- `finishing-a-development-branch` — merge/PR/keep/discard decision flow
- `writing-skills` — create new skills following best practices
- `using-superpowers` — injected at session start explaining the system

**Session hook:** At session start, Superpowers injects the `using-superpowers` skill into context automatically.

> **Conflict note:** Superpowers' `brainstorming` skill auto-triggers before any feature work. If you're using GSD's `discuss-phase`, tell Claude explicitly: "Skip brainstorming skill, use /gsd:discuss-phase instead."

---

## Step 5 — Install gstack — GLOBAL

gstack (by Garry Tan, YC CEO) is a suite of 25 skills covering the full deployment pipeline: automated QA with real browser automation, superior code review, release pipeline, deployment, canary monitoring, performance benchmarking, and safety hooks.

**Prerequisites:** Bun (already installed), git

```bash
source ~/.bash_profile   # or ~/.zshrc on macOS
git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup
```

The setup script:
- Builds the `browse` binary (persistent headless Chromium daemon via Playwright)
- Installs Playwright Chromium (~150MB)
- Creates symlinks for all 25 skills

**Key commands:**

| Command | Purpose |
|---|---|
| `/office-hours` | YC-style product brainstorming (6 forcing questions → design doc) |
| `/autoplan` | Sequential CEO + eng + design review of a plan |
| `/review` | Superior PR review: CRITICAL+INFORMATIONAL, Greptile integration, adversarial |
| `/qa` | Full QA with headless browser, 10-phase process, fix loop (up to 50 fixes) |
| `/ship` | Full release pipeline: tests → coverage → CHANGELOG → bisectable commits → PR |
| `/land-and-deploy` | Merge + CI wait + deploy |
| `/canary` | Post-deploy monitoring loop |
| `/benchmark` | Performance regression: TTFB, FCP, LCP, bundle sizes |
| `/investigate` | Systematic root-cause debugging (Iron Law: no fix without root cause) |
| `/retro` | Weekly retrospective with real git metrics |
| `/careful` | PreToolUse hook blocking dangerous commands (rm -rf, DROP TABLE, force push) |
| `/guard` / `/freeze` / `/unfreeze` | Directory-scoped edit protection |
| `/codex` | Cross-model review (Claude + OpenAI adversarial on same diff) |
| `/design-consultation` | Build complete DESIGN.md + HTML preview from scratch |
| `/design-review` | Live site visual audit via screenshots (10 categories) |

**Conflict resolved:** gstack's `/review` supersedes the project's old `review.md` command (which was removed). gstack's version is strictly superior — it includes Greptile codebase analysis, adversarial review pass, and diff-scope-awareness.

**To update gstack:**
```bash
/gstack-upgrade
# or manually:
cd ~/.claude/skills/gstack && git pull && ./setup
```

---

## Step 6 — Install Claude-Mem — GLOBAL

Claude-Mem captures every session to SQLite + Chroma vector DB and injects relevant past context at session start.

**Option A: Claude Code plugin marketplace (preferred)**
```
/plugin marketplace add thedotmack/claude-mem
/plugin install claude-mem
```
Then restart Claude Code.

**Option B: Manual clone**
```bash
mkdir -p ~/.claude/plugins/marketplaces/thedotmack
git clone https://github.com/thedotmack/claude-mem \
  ~/.claude/plugins/marketplaces/thedotmack
cd ~/.claude/plugins/marketplaces/thedotmack
bun install
```

**What you get:**
- 6 lifecycle hooks (Setup, SessionStart, UserPromptSubmit, PostToolUse, Stop, SessionEnd)
- SQLite at `~/.claude-mem/claude-mem.db`
- Chroma vector DB at `~/.claude-mem/chroma/`
- Web viewer UI at `http://localhost:37777`
- `mem-search` skill — query past sessions ("how did we solve X last time?")
- `<private>content</private>` tags to exclude sensitive content from storage

**Dependencies** (auto-installed on first session start): Bun ≥ 1.1.14, uv (Python package manager for Chroma).

---

## Step 7 — Configure Local Project Settings

Create or update `.claude/settings.json` in your project root:

```json
{
  "permissions": {
    "allow": [
      "Bash(*)",
      "Write(*)",
      "Edit(*)",
      "Read(*)",
      "WebFetch(*)",
      "WebSearch"
    ],
    "deny": [
      "Read(.env)",
      "Read(.env.*)",
      "Read(**/secrets/*)",
      "Read(**/*.pem)",
      "Read(**/*.key)"
    ]
  }
}
```

> The broad `Bash(*)` allow is needed for GSD's autonomous execution to work without interruption. Tighten to specific commands once you know what your workflow needs.

---

## Step 8 — Create CLAUDE.md

Create a `CLAUDE.md` at your project root. This is the most important file — Claude reads it at every session start. Copy this template exactly, then fill in the Project Overview section.

```markdown
# Claude Code Configuration

## Project Overview
[Describe your project: what it is, tech stack, key constraints]

State files:
- `PROJECT.md` — vision, goals, tech stack
- `REQUIREMENTS.md` — functional/non-functional requirements
- `ROADMAP.md` — milestone breakdown
- `STATE.md` — current session state, last task, next task
- `SYNTHESIS.md` — synthesis of installed tools and unified workflow

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
```

---

## Step 9 — Create the /flow wrapper command

`/flow` is the only command you need to remember. It routes every situation — pipeline stages, debugging, backlog, milestones, session management, config, audits — to the exact right underlying command (GSD, gstack, Superpowers) without you needing to know which tool handles what.

**Usage:**
```
/flow              ← what should I do next? (reads STATE.md)
/flow plan         ← jump to planning stage
/flow build        ← jump to build stage
/flow debug        ← something broke
/flow backlog      ← capture an idea
/flow session      ← save/resume/checkpoint
/flow config       ← switch model, update tools
```

Also accepts natural language: "I want to start a new feature", "something broke in prod", "I'm done for the day".

Copy `.claude/commands/flow.md` from the reference project, or create it fresh. The file is too long to embed here — the full content is in this project at `.claude/commands/flow.md`.

**What the file contains:**
- Instructions for Claude to act as a unified router
- Every pipeline stage (THINK → DESIGN → INIT → PLAN → BUILD → TEST → REVIEW → ACCEPT → SHIP → DEPLOY → MONITOR)
- Off-pipeline sections: QUICK, DEBUG, SAFETY, BACKLOG, MILESTONE, SESSION, EXPLORE, AUDIT, CONFIG, DESIGN AUDIT
- Natural language routing table (maps "something broke" → `/investigate`, "capture idea" → `/gsd:note`, etc.)

**To copy from this reference project:**
```bash
cp /path/to/this-project/.claude/commands/flow.md /your/new/project/.claude/commands/flow.md
```

The current version covers all pipeline stages plus: QUICK, DEBUG, SAFETY, BACKLOG, MILESTONE, SESSION, EXPLORE, AUDIT, CONFIG — every scenario routed to the right command with no tool trivia.

**Usage:**
- `/flow` — reads STATE.md, shows next step
- `/flow plan`, `/flow build`, `/flow ship`, `/flow debug`, `/flow backlog`, `/flow session`, `/flow config` — jump to any scenario directly
- Natural language: "something broke", "capture this idea", "I'm done for the day"

---

## Step 10 — Bootstrap a New Project

Run these commands to install all local tools and copy the shared config files into a new project directory. The global tools (gstack, Superpowers, Claude-Mem) are already installed and need no action.

**Claude can run all of this for you** — paste this section into a new Claude Code session and say "bootstrap this project".

### Part A — Install local tools

```bash
# From inside your new project directory:
cd /your/new/project

# GSD — 50 slash commands + 17 agents (local)
npx get-shit-done-cc@latest --claude --local

# UI/UX Pro Max — design pattern skill (local)
npx uipro-cli init --ai claude
```

### Part B — Copy shared config from the reference project

```bash
REFERENCE=/home/ec2-user/future-saas-prototype
TARGET=$(pwd)

# /flow wrapper — the unified command router
cp "$REFERENCE/.claude/commands/flow.md" "$TARGET/.claude/commands/flow.md"

# Session health check hook — verifies Claude-Mem, STATE.md, auto-memory on every start
cp "$REFERENCE/.claude/hooks/session-health-check.js" "$TARGET/.claude/hooks/session-health-check.js"

# settings.json — permissions + hooks (health check, context monitor, prompt guard, statusline)
# NOTE: GSD installs its own settings.json — merge manually if it already exists
cp "$REFERENCE/.claude/settings.json" "$TARGET/.claude/settings.json"
```

### Part C — Create CLAUDE.md

Copy the template from Step 8 above into `CLAUDE.md` at your project root. Fill in the Project Overview section with your project's description, tech stack, and constraints. Leave everything else as-is.

### Part D — Start Claude and initialize the project

```bash
claude   # start Claude Code in your new project directory
```

Then run:
```
/flow
```

`/flow` will see no STATE.md, recognize you're starting fresh, and guide you to `/gsd:new-project`. GSD will ask questions and generate:
- `PROJECT.md` — vision, goals, tech stack, constraints
- `REQUIREMENTS.md` — scoped v1/v2 requirements
- `ROADMAP.md` — phased milestone breakdown
- `STATE.md` — current session state

For an existing codebase, run `/gsd:map-codebase` first, then `/gsd:new-project`.

### What you do NOT need to reinstall

These are global and already available in every project:

| Tool | Location | Status |
|---|---|---|
| gstack (25 skills) | `~/.claude/skills/gstack/` | Global — already works |
| Superpowers (14 skills) | `~/.claude/plugins/obra/superpowers/` | Global — already works |
| Claude-Mem | `~/.claude/plugins/marketplaces/thedotmack/` | Global — already works |
| ralph-wiggum | `~/.bun/bin/ralph` | Global — already works |

---

## Full Directory Structure After Setup

```
your-project/
├── .claude/
│   ├── agents/                        # 17 GSD specialized agents
│   │   ├── gsd-planner.md
│   │   ├── gsd-executor.md
│   │   ├── gsd-verifier.md
│   │   ├── gsd-debugger.md
│   │   ├── gsd-phase-researcher.md
│   │   ├── gsd-plan-checker.md
│   │   ├── gsd-integration-checker.md
│   │   ├── gsd-nyquist-auditor.md
│   │   ├── gsd-ui-auditor.md
│   │   ├── gsd-ui-checker.md
│   │   ├── gsd-ui-researcher.md
│   │   ├── gsd-codebase-mapper.md
│   │   ├── gsd-roadmapper.md
│   │   └── ...
│   ├── commands/
│   │   ├── gsd/                       # 50 GSD slash commands
│   │   │   ├── new-project.md
│   │   │   ├── discuss-phase.md
│   │   │   ├── plan-phase.md
│   │   │   ├── execute-phase.md
│   │   │   ├── verify-work.md
│   │   │   ├── ship.md
│   │   │   └── ...
│   │   ├── flow.md                    # /flow — unified dev flow guide (your personal wrapper)
│   │   ├── plan.md                    # Lightweight ad-hoc planner
│   │   ├── tdd.md                     # Manual TDD trigger
│   │   ├── build-fix.md               # Systematic debugging
│   │   ├── checkpoint.md              # Save state to STATE.md
│   │   └── multi-execute.md           # Parallel subagent spawning
│   │   # note: review.md was intentionally removed — gstack's /review is strictly superior
│   ├── get-shit-done/                 # GSD internal workflows + templates
│   │   ├── workflows/                 # One workflow file per GSD command
│   │   ├── templates/                 # PROJECT.md, ROADMAP.md, etc. templates
│   │   ├── references/                # GSD reference docs (TDD, model profiles, etc.)
│   │   └── bin/                       # GSD runtime (gsd-tools.cjs)
│   ├── hooks/                         # GSD lifecycle hooks
│   │   ├── gsd-context-monitor.js     # Context window usage warnings
│   │   ├── gsd-prompt-guard.js        # Prompt injection scanner
│   │   ├── gsd-workflow-guard.js      # Workflow state guard
│   │   ├── gsd-statusline.js          # Status line display
│   │   └── gsd-check-update.js        # Update checker
│   ├── skills/
│   │   └── ui-ux-pro-max/             # UI/UX Pro Max skill
│   │       ├── SKILL.md
│   │       ├── data/                  # 15 CSV databases
│   │       │   ├── styles.csv
│   │       │   ├── colors.csv
│   │       │   ├── typography.csv
│   │       │   ├── ux-guidelines.csv
│   │       │   ├── products.csv
│   │       │   ├── charts.csv
│   │       │   ├── landing.csv
│   │       │   ├── icons.csv
│   │       │   └── stacks/            # Per-stack guidelines (nextjs, react, vue, etc.)
│   │       └── scripts/               # Python BM25 search engine
│   │           ├── search.py
│   │           ├── core.py
│   │           └── design_system.py
│   ├── settings.json                  # Permissions config
│   └── settings.local.json            # Local overrides (gitignored)
│
├── .ralph/                            # ralph-wiggum loop history
│   └── ralph-history.json
│
├── CLAUDE.md                          # Primary Claude Code instructions (this file)
├── PROJECT.md                         # Project vision + tech stack
├── REQUIREMENTS.md                    # v1/v2 requirements
├── ROADMAP.md                         # Milestone breakdown
├── STATE.md                           # Current session state
│
└── .planning/                         # Created by GSD when you run /gsd:new-project
    ├── config.json
    ├── research/
    ├── 01-CONTEXT.md
    ├── 01-RESEARCH.md
    ├── 01-01-PLAN.md
    └── ...

~/.claude/                             # Global Claude Code config
├── skills/
│   └── gstack/                        # gstack global skills (25 commands)
│       ├── skills/                    # Individual skill files
│       ├── bin/                       # browse daemon binary (Playwright/Chromium)
│       └── setup                     # Install script
├── plugins/
│   ├── obra/
│   │   └── superpowers/               # Superpowers global plugin
│   │       ├── skills/                # 14 auto-triggering skills
│   │       │   ├── brainstorming/
│   │       │   ├── test-driven-development/
│   │       │   ├── writing-plans/
│   │       │   ├── subagent-driven-development/
│   │       │   ├── systematic-debugging/
│   │       │   ├── using-git-worktrees/
│   │       │   └── ...
│   │       └── hooks/
│   │           └── hooks.json         # SessionStart hook (injects using-superpowers)
│   └── marketplaces/
│       └── thedotmack/                # Claude-Mem global plugin
│           └── plugin/
│               ├── skills/
│               │   └── mem-search/    # Query past sessions
│               ├── scripts/           # Hooks + worker service
│               └── hooks/
│                   └── hooks.json     # 6 lifecycle hooks

~/.claude-mem/                         # Claude-Mem data (created on first session)
├── claude-mem.db                      # SQLite session database
└── chroma/                            # Vector embeddings
```

---

## Conflict Resolution

These tools have overlapping concerns. When they conflict, follow this priority:

| Conflict | Winner | Why |
|---|---|---|
| Superpowers `brainstorming` vs `/gsd:discuss-phase` | **GSD wins** | GSD is project-state-aware; Superpowers is generic |
| Superpowers `writing-plans` vs `/gsd:plan-phase` | **GSD wins** | GSD creates persistent PLAN.md with verification loop |
| Superpowers `subagent-driven-development` vs `/gsd:execute-phase` | **GSD wins** | GSD has wave orchestration and state tracking |
| `/plan` (generic) vs `/gsd:plan-phase` | **GSD for phases**, `/plan` for ad-hoc | Different scopes |
| `/tdd` (command) vs Superpowers TDD skill | **Superpowers** (auto) | Superpowers enforces strictly at the skill level |
| gstack `/review` vs (removed) `review.md` | **gstack wins** | Greptile + adversarial + diff-scope-aware; old review.md removed |
| gstack `/ship` vs `/gsd:ship` | **gstack for releases**, `/gsd:ship` for phase PRs | gstack does version bumps + CHANGELOG; GSD is lighter |
| gstack `/qa` vs `/gsd:verify-work` | **Both, different layers** | `/qa` = browser automation + test suite; `/gsd:verify-work` = user-story acceptance. Run `/qa` first. |
| gstack `/investigate` vs `/gsd:debug` | **gstack for production**, GSD for dev-time | Iron Law: no fix without root cause (gstack); state-persistent debugging (GSD) |
| gstack `/design-review` vs `/gsd:ui-review` | **gstack (with browser)**, GSD (fallback) | gstack uses real screenshots; GSD is prompt-based |
| gstack `/office-hours` vs Superpowers `brainstorming` | **gstack for product**, Superpowers for technical | Different scopes: product/business decisions vs. technical design |

**The mental model:**
- **GSD** owns the feature lifecycle (discuss → plan → execute → verify)
- **gstack** owns the release pipeline (qa → review → ship → deploy → monitor + safety + retro)
- **Superpowers** provides in-task skill enforcement (TDD, debugging methodology, worktrees)
- **UI/UX Pro Max** is additive — no overlap with anything
- **Claude-Mem** is additive — captures everything automatically, no overlap

See `docs/development-flow.md` for the complete end-to-end flow with all tools integrated.

---

## Keeping Everything Updated

```bash
# GSD
npx get-shit-done-cc@latest --claude --local

# gstack (via built-in self-updater)
/gstack-upgrade
# or manually:
cd ~/.claude/skills/gstack && git pull && ./setup

# UI/UX Pro Max
npx uipro-cli init --ai claude   # re-run to update

# Superpowers (if installed via plugin marketplace)
/plugin update superpowers

# Superpowers (if cloned manually)
cd ~/.claude/plugins/obra/superpowers && git pull

# Claude-Mem (if cloned manually)
cd ~/.claude/plugins/marketplaces/thedotmack && git pull && bun install

# ralph-wiggum
bun add -g @th0rgal/ralph-wiggum
```

---

## Troubleshooting

**GSD commands not found after install**
- Restart Claude Code to reload commands
- Verify: `ls .claude/commands/gsd/` should show 50 .md files

**`npx get-shit-done-cc@latest` fails**
- Ensure Node.js >= 20: `node --version`
- Try: `node --version && npx --yes get-shit-done-cc@latest --claude --local`

**`npx uipro-cli` fails**
- Fall back to manual git clone (see Step 3 fallback above)
- Python 3 must be available: `python3 --version`

**Superpowers `brainstorming` keeps interrupting GSD workflow**
- Add to your CLAUDE.md: "When running /gsd:discuss-phase, skip the Superpowers brainstorming skill."
- Or tell Claude at session start: "We're using GSD for project planning. Skip Superpowers brainstorming."

**Claude-Mem worker not starting**
- Bun is required: `bun --version`
- Check logs: `tail -f ~/.claude-mem/logs/worker-$(date +%Y-%m-%d).log`
- Manual restart: `cd ~/.claude/plugins/marketplaces/thedotmack && bun plugin/scripts/worker-service.cjs restart`

**ralph loop never detects COMPLETE**
- Claude Code wraps completion in XML: `<promise>COMPLETE</promise>`
- Fix: use `--completion-promise "promise>COMPLETE"` instead of `--completion-promise "COMPLETE"`

**Context fills up mid-task**
- Run `/gsd:pause-work` to create a handoff file
- Start a new Claude Code session
- Run `/gsd:resume-work` to restore full context

**gstack setup fails: "Playwright Chromium could not be launched"**
- Missing system libraries — common on Amazon Linux, RHEL, minimal Ubuntu installs
- Check what's missing: `ldd ~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome | grep "not found"`
- Fix on Amazon Linux 2023:
  ```bash
  sudo dnf install -y atk at-spi2-atk cups-libs libxcb libxkbcommon at-spi2-core \
    libX11 libXcomposite libXdamage libXext libXfixes libXrandr mesa-libgbm cairo \
    pango alsa-lib
  ```
- Fix on Ubuntu/Debian:
  ```bash
  sudo apt-get install -y libatk1.0-0 libatk-bridge2.0-0 libcups2 libxcb1 \
    libxkbcommon0 libatspi2.0-0 libx11-6 libxcomposite1 libxdamage1 libxext6 \
    libxfixes3 libxrandr2 libgbm1 libcairo2 libpango-1.0-0 libasound2
  ```
- Then re-run: `cd ~/.claude/skills/gstack && ./setup`

**gstack `/browse` daemon fails to start**
- Verify Chromium launches: `~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome --version`
- Check browse binary exists: `ls ~/.claude/skills/gstack/browse/dist/browse`
- Re-run setup to rebuild: `cd ~/.claude/skills/gstack && ./setup`

**gstack skills not appearing as slash commands**
- Restart Claude Code to reload skills from `~/.claude/skills/`
- Verify symlinks: `ls ~/.claude/skills/gstack/` should show skill directories
- Re-run setup: `cd ~/.claude/skills/gstack && ./setup`

---

## Sources

| Tool | Repository | Install |
|---|---|---|
| GSD | https://github.com/gsd-build/get-shit-done | `npx get-shit-done-cc@latest --claude --local` |
| gstack | https://github.com/garrytan/gstack | `git clone ... && ./setup` |
| UI/UX Pro Max | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | `npx uipro-cli init --ai claude` |
| Superpowers | https://github.com/obra/superpowers | `/plugin install superpowers@claude-plugins-official` |
| Claude-Mem | https://github.com/thedotmack/claude-mem | `/plugin marketplace add thedotmack/claude-mem` |
| ralph-wiggum | https://github.com/Th0rgal/open-ralph-wiggum | `bun add -g @th0rgal/ralph-wiggum` |
| Everything Claude Code | https://github.com/affaan-m/everything-claude-code | `ecc-universal` (not yet on npm) |
| Awesome Claude Code | https://github.com/hesreallyhim/awesome-claude-code | — |
