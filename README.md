# claude-flow

One-command bootstrap for a maximally efficient Claude Code development environment.

Installs and configures 6 tools + a unified `/flow` command that routes every development scenario to the right tool — so you only need to remember one command. The system continuously evolves: it discovers new Claude Code tools from GitHub trending, lets you integrate any repo/skill/plugin/document on demand, and keeps everything up to date automatically.

## What You Get

| Tool | What It Does |
|---|---|
| **GSD** (Get Shit Done) | 50 slash commands + 17 agents for spec-driven development lifecycle |
| **gstack** (Garry Tan / YC) | 25 skills: QA, code review, ship, deploy, canary, benchmark, retro, safety |
| **UI/UX Pro Max** | Design system intelligence: 67 styles, 96 palettes, 57 font pairings |
| **Superpowers** | 14 auto-triggering skills: TDD enforcement, debugging, subagent execution |
| **Claude-Mem** | Persistent cross-session memory via SQLite + vector search |
| **ralph-wiggum** | Autonomous iterative agent loops until task completion |
| **/flow** | Unified command router — tells you exactly what to run at every stage |
| **/discover** | Weekly scan of GitHub trending for new Claude Code tools — auto-integrates with approval |
| **/integrate** | Bring any repo, file, package, or best practices doc into the flow system |

## The Pipeline

```
THINK → DESIGN → INIT → [ PLAN → BUILD → TEST → REVIEW → ACCEPT ] → SHIP → DEPLOY → MONITOR
                          └────────────── repeat per feature ───────────────┘
```

Every stage maps to a specific command. `/flow` tells you which one.

## Quick Start

### New project
```bash
mkdir my-project && cd my-project && git init
curl -fsSL https://raw.githubusercontent.com/hgahlot/claude-flow/main/setup.sh | bash
```

Then start Claude Code and run `/flow` — it will detect you're starting fresh and guide you through project initialization.

### Existing project

```bash
cd /your/existing/project
git clone https://github.com/hgahlot/claude-flow.git /tmp/claude-flow
bash /tmp/claude-flow/setup.sh --skip-templates
```

This installs all the tools and commands without overwriting your existing project files. Here's what happens:

**Installed (always):**
- All 6 tools (GSD, gstack, Superpowers, Claude-Mem, UI/UX Pro Max, ralph-wiggum)
- All slash commands (`/flow`, `/plan`, `/tdd`, `/checkpoint`, `/build-fix`, `/multi-execute`, `/update`, `/discover`, `/integrate`)
- Session health check hook
- `settings.json` with hook configuration (merges with existing if GSD already created one)
- Weekly discovery cron job

**Skipped with `--skip-templates`:**
- `CLAUDE.md`, `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md` — your existing files are untouched

**After setup:**

```bash
claude                       # start Claude Code
/flow                        # see the full pipeline and what to do next
/integrate best-practices.md # bring in your team's existing practices
/discover                    # see what Claude Code tools are trending
```

If you don't have a `CLAUDE.md` yet, run setup **without** `--skip-templates` — it will create one with the full tool routing table, or you can create it later:

```bash
bash /tmp/claude-flow/setup.sh              # includes CLAUDE.md and all templates
bash /tmp/claude-flow/setup.sh --force      # overwrite existing files (use carefully)
```

> **Note:** The project must be a git repository. If it isn't, run `git init` first.

### Already using some of these tools?

If you already have gstack, Superpowers, or other tools installed globally, skip the global phase:

```bash
bash /tmp/claude-flow/setup.sh --skip-global --skip-templates
```

This only installs the local tools (GSD, UI/UX Pro Max) and the flow integration layer (commands, hooks, settings). The setup script is idempotent — it won't overwrite existing files unless you pass `--force`.

## Setup Options

```bash
setup.sh [OPTIONS]

Options:
  --skip-global      Skip global tools (gstack, Superpowers, Claude-Mem, ralph-wiggum)
  --skip-local       Skip local tools (GSD, UI/UX Pro Max)
  --skip-templates   Skip template files (CLAUDE.md, STATE.md, etc.) — use for existing projects
  --force            Overwrite existing files without prompting
```

## What Gets Installed Where

### Global (once per machine, shared across all projects)
```
~/.claude/skills/gstack/                    # gstack (25 skills)
~/.claude/plugins/obra/superpowers/         # Superpowers (14 auto-triggering skills)
~/.claude/plugins/marketplaces/thedotmack/  # Claude-Mem (session memory)
~/.bun/bin/ralph                            # ralph-wiggum (autonomous loops)
~/.claude-flow/discover.js                  # Tool discovery engine (weekly cron)
~/.claude-flow/integrate.js                 # Tool integration analysis engine
~/.claude-flow/discoveries.json             # Latest discovery report
~/.claude-flow/discovery-history.json       # Seen/installed tool history
```

### Local (per project)
```
.claude/commands/gsd/           # GSD slash commands (50)
.claude/agents/                 # GSD specialized agents (17)
.claude/commands/flow.md        # /flow — unified command router
.claude/commands/plan.md        # /plan — lightweight task planner
.claude/commands/tdd.md         # /tdd — TDD cycle enforcement
.claude/commands/checkpoint.md  # /checkpoint — state persistence
.claude/commands/build-fix.md   # /build-fix — root cause debugging
.claude/commands/multi-execute.md # /multi-execute — parallel subagents
.claude/commands/update.md       # /update — update all tools to latest
.claude/commands/discover.md     # /discover — find and integrate trending Claude Code tools
.claude/commands/integrate.md    # /integrate — bring any resource into the flow system
.claude/hooks/session-health-check.js  # Verifies memory/state on every session start
.claude/skills/ui-ux-pro-max/   # UI/UX Pro Max design skill
.claude/settings.json           # Hooks configuration
CLAUDE.md                       # Claude Code instructions (edit the Project Overview section)
PROJECT.md / REQUIREMENTS.md / ROADMAP.md / STATE.md  # Project state templates
docs/claude-code-setup.md       # Full setup reference
docs/development-flow.md        # Complete command reference
```

## How Tools Work Together

**GSD** owns the feature lifecycle (discuss → plan → execute → verify).
**gstack** owns the release pipeline (qa → review → ship → deploy → monitor).
**Superpowers** provides in-task enforcement (TDD, debugging methodology).
**Claude-Mem** and **UI/UX Pro Max** are purely additive.

When tools overlap, `/flow` and `CLAUDE.md` contain the routing table that resolves conflicts.

## Usage Examples

```
/flow                    # what should I do next? (reads STATE.md)
/flow plan               # start planning a phase
/flow build              # ready to implement
/flow ship               # time to release
/flow debug              # something broke
/flow backlog            # capture an idea
/flow session            # save state or resume
```

Also accepts natural language:
```
"I want to start a new feature"  → routes to PLAN
"Something broke in prod"        → routes to /investigate
"I'm done for the day"           → routes to /gsd:pause-work
```

## Keeping the System Alive

claude-flow is designed to evolve alongside the rapidly growing Claude Code ecosystem. Three commands handle this:

### `/update` — Keep existing tools current

Pulls the latest version of every installed tool and re-applies the flow integration layer in one shot.

```bash
/update                                      # update everything from within Claude Code

# Or from the command line:
bash /tmp/claude-flow/update.sh              # update all tools + flow layer
bash /tmp/claude-flow/update.sh --check      # check for updates without applying
bash /tmp/claude-flow/update.sh --tool gstack # update a specific tool only
bash /tmp/claude-flow/update.sh --skip-flow  # update tools but not flow integration
```

What it does for each tool type:
- **Git-cloned tools** (gstack, Superpowers, Claude-Mem): fetches from upstream, shows commits behind, pulls with `--ff-only`, re-runs setup/install
- **npm tools** (GSD, UI/UX Pro Max): re-runs `npx ...@latest` to get the latest published version
- **Bun packages** (ralph-wiggum): `bun add -g` to update
- **Flow layer**: diffs each command/hook against upstream and only copies if changed; warns if `CLAUDE.md` template has new routing rules (never overwrites your customized copy)

### `/discover` — Find new tools automatically

A weekly cron job scans [GitHub trending](https://github.com/trending?since=weekly) for new Claude Code tools. It finds skills, plugins, commands, hooks, and MCP servers — then waits for your approval before installing anything.

```bash
/discover                                    # review findings and integrate approved tools
node ~/.claude-flow/discover.js              # run discovery manually from CLI
node ~/.claude-flow/discover.js --check      # just check, don't save report
```

**How discovery works:**
1. Fetches the weekly trending page and parses all repo entries
2. Filters by keywords (`claude`, `anthropic`, `mcp-server`, etc.) in repo names and descriptions
3. Deep-analyzes each match: fetches the README, checks the repo file tree via GitHub API for Claude Code markers (`.claude-plugin/`, `SKILL.md`, `.claude/commands/`, hooks, `.mcp.json`)
4. Also samples non-keyword repos for structural matches (catches tools that don't mention "claude" in their name but have `.claude/` directories)
5. Scores and ranks discoveries, generates integration plans with install steps and flow routing changes
6. Saves a report to `~/.claude-flow/discoveries.json`

The cron runs every **Monday at 9 AM**. When new discoveries are available, the session health check shows:
```
✓ 5 new tool(s) found in trending repos — run /discover to review
```

History tracking ensures already-seen and already-installed tools aren't re-suggested.

### `/integrate` — Bring in anything manually

Point `/integrate` at any resource and it will analyze it, explain what it provides, detect conflicts with existing tools, and wire it into the flow system with your permission.

```
/integrate https://github.com/owner/repo          # GitHub repo
/integrate ./path/to/local/skill                   # local directory
/integrate ./my-hook.js                            # single file (command, hook, skill, agent)
/integrate some-npm-package                        # npm/bun CLI tool
/integrate https://example.com/best-practices.md   # best practices document
/integrate                                         # then describe or paste content inline
```

**What it detects:**

| Resource type | How it's identified | Where it gets installed |
|---|---|---|
| **Skill** | Has `SKILL.md` with YAML frontmatter | `~/.claude/skills/<name>/` or `.claude/skills/<name>/` |
| **Plugin** | Has `.claude-plugin/` directory with `plugin.json` | `~/.claude/plugins/<owner>/<name>/` |
| **Commands** | `.md` files in `.claude/commands/` or `commands/` | `.claude/commands/` |
| **Hooks** | `.js` files in `.claude/hooks/` or `hooks/` | `.claude/hooks/` + registered in `settings.json` |
| **Agents** | `.md` files in `.claude/agents/` or `agents/` | `.claude/agents/` |
| **MCP server** | Has `.mcp.json` with server config | `~/.claude/plugins/<owner>/<name>/` + `.mcp.json` |
| **CLI tool** | `package.json` with `bin` field | Global npm/bun install |
| **Best practices** | Markdown doc with guidelines/conventions | Merged into existing `CLAUDE.md` sections |

**After installation, it automatically:**
- Updates `CLAUDE.md` with the new tool's commands and routing rules
- Updates `/flow` routing so the new commands appear in the right pipeline stage
- Registers any hooks in `settings.json` (SessionStart, PreToolUse, PostToolUse)
- Detects conflicts with existing tools and explains overlaps
- Runs the health check to verify everything is wired correctly

**Best practices documents** are handled specially — instead of creating new files, the practices are merged into the matching sections of `CLAUDE.md` (testing practices → TDD Mandate, security → Security section, etc.).

## Session Health Check

A comprehensive health check runs automatically on every session start (via `settings.json` SessionStart hook). It validates 8 systems:

| # | Check | What it does |
|---|---|---|
| 1 | **Claude-Mem worker** | Verifies background process is running; auto-restarts if crashed |
| 2 | **STATE.md** | Exists, not a blank template, not stale (warns if >7 days old) |
| 3 | **Auto-memory** | MEMORY.md exists and counts entries |
| 4 | **Project files** | CLAUDE.md required; PROJECT.md, REQUIREMENTS.md, ROADMAP.md recommended |
| 5 | **Tool installation** | GSD, gstack, Superpowers, Claude-Mem presence verified |
| 6 | **Settings integrity** | settings.json exists, valid JSON, health check hook registered |
| 7 | **Git status** | Repository exists, uncommitted changes count |
| 8 | **Pending discoveries** | Shows count of new tools found by weekly trending scan |

When everything is healthy:
```
[Health] ✓ Claude-Mem worker running (DB 42KB) · STATE.md current · Tools: GSD (50 commands), gstack, Superpowers · ...
```

When there are issues:
```
[Session Health Check]
  ⚡ FIXED: Claude-Mem worker was stopped — restarted successfully
  ⚠  ISSUE: STATE.md is stale (12 days ago) — review and update it
  ✓  Tools: GSD (50 commands), gstack, Superpowers, Claude-Mem
  ✓  3 new tool(s) found in trending repos — run /discover to review
  7/8 checks passed · 1 needs attention
```

## Prerequisites

- **Claude Code** (latest version)
- **Node.js 20+** (auto-installed by setup.sh if missing)
- **Git** (auto-installed by setup.sh if missing)
- **Bun** (auto-installed by setup.sh if missing)
- **Python 3** (for UI/UX Pro Max search — optional)

## Updating Individual Tools

If you prefer to update tools one at a time instead of using `/update`:

```bash
npx get-shit-done-cc@latest --claude --local                              # GSD
cd ~/.claude/skills/gstack && git pull && ./setup                          # gstack (or /gstack-upgrade)
npx uipro-cli init --ai claude                                            # UI/UX Pro Max
cd ~/.claude/plugins/obra/superpowers && git pull                          # Superpowers
cd ~/.claude/plugins/marketplaces/thedotmack && git pull && bun install    # Claude-Mem
bun add -g @th0rgal/ralph-wiggum                                          # ralph-wiggum
```

## Troubleshooting

See [docs/claude-code-setup.md](docs/claude-code-setup.md#troubleshooting) for detailed troubleshooting of each tool.

Common issues:
- **gstack Playwright fails**: Missing system libraries — setup.sh installs them automatically on Amazon Linux and Ubuntu/Debian
- **Claude-Mem worker not starting**: Run `source ~/.bash_profile && bun --version` to verify Bun is in PATH
- **Superpowers brainstorming interrupts GSD**: Tell Claude "Skip brainstorming skill, use /gsd:discuss-phase"
- **Context fills up mid-task**: Run `/gsd:pause-work`, start new session, run `/gsd:resume-work`

## Credits

| Tool | Author |
|---|---|
| [GSD](https://github.com/gsd-build/get-shit-done) | GSD Build |
| [gstack](https://github.com/garrytan/gstack) | Garry Tan (YC CEO) |
| [UI/UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Next Level Builder |
| [Superpowers](https://github.com/obra/superpowers) | Jesse Vincent (obra) |
| [Claude-Mem](https://github.com/thedotmack/claude-mem) | The Dot Mack |
| [ralph-wiggum](https://github.com/Th0rgal/open-ralph-wiggum) | Th0rgal |
| /flow + integration | This repo |

## License

MIT
