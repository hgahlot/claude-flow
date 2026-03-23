# claude-flow

One-command bootstrap for a maximally efficient Claude Code development environment.

Installs and configures 6 tools + a unified `/flow` command that routes every development scenario to the right tool — so you only need to remember one command.

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

### Existing project
```bash
cd /your/existing/project
curl -fsSL https://raw.githubusercontent.com/hgahlot/claude-flow/main/setup.sh | bash --skip-templates
```

### Clone and run
```bash
git clone https://github.com/hgahlot/claude-flow.git /tmp/claude-flow
cd /your/project
bash /tmp/claude-flow/setup.sh
```

### After setup
```bash
claude          # start Claude Code
/flow           # what should I do next?
```

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

**`/discover`** scans GitHub weekly trending for new tools and integrates them into the flow system with your approval.

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

## Tool Discovery

A weekly cron job scans [GitHub trending](https://github.com/trending?since=weekly) for new Claude Code tools (skills, plugins, commands, hooks, MCP servers). Run `/discover` to review findings and integrate approved tools into the flow system.

```bash
/discover                                    # review and integrate trending tools
node ~/.claude-flow/discover.js              # run discovery manually from CLI
node ~/.claude-flow/discover.js --check      # just check, don't save report
```

The cron runs every Monday at 9 AM. Discoveries show up in the session health check.

## Prerequisites

- **Claude Code** (latest version)
- **Node.js 20+** (auto-installed by setup.sh if missing)
- **Git** (auto-installed by setup.sh if missing)
- **Bun** (auto-installed by setup.sh if missing)
- **Python 3** (for UI/UX Pro Max search — optional)

## Updating Tools

Update everything at once (tools + flow integration layer):
```bash
# From within Claude Code
/update

# From the command line
bash /tmp/claude-flow/update.sh

# Check for updates without applying
bash /tmp/claude-flow/update.sh --check

# Update a specific tool only
bash /tmp/claude-flow/update.sh --tool gstack
```

Or update individual tools manually:
```bash
# GSD
npx get-shit-done-cc@latest --claude --local

# gstack
/gstack-upgrade

# UI/UX Pro Max
npx uipro-cli init --ai claude

# Superpowers
cd ~/.claude/plugins/obra/superpowers && git pull

# Claude-Mem
cd ~/.claude/plugins/marketplaces/thedotmack && git pull && bun install
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
