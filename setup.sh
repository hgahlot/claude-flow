#!/usr/bin/env bash
set -euo pipefail

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  claude-flow setup                                                          ║
# ║  One-command bootstrap for the full Claude Code power dev environment       ║
# ║                                                                             ║
# ║  Installs: GSD + gstack + UI/UX Pro Max + Superpowers + Claude-Mem +        ║
# ║            ralph-wiggum + /flow wrapper + session health check              ║
# ║                                                                             ║
# ║  Usage:                                                                     ║
# ║    cd /your/project                                                         ║
# ║    curl -fsSL https://raw.githubusercontent.com/hgahlot/claude-flow/main/setup.sh | bash  ║
# ║    # or:                                                                    ║
# ║    git clone https://github.com/hgahlot/claude-flow.git /tmp/claude-flow    ║
# ║    bash /tmp/claude-flow/setup.sh                                           ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

# ── Colors ────────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

info()  { echo -e "${BLUE}[info]${NC}  $*"; }
ok()    { echo -e "${GREEN}[ok]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC}  $*"; }
err()   { echo -e "${RED}[error]${NC} $*"; }
step()  { echo -e "\n${BOLD}${CYAN}── $* ──${NC}\n"; }

# ── Detect script location (for file copies) ─────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$(pwd)"

# If running via curl pipe, clone the repo to /tmp first
if [ ! -f "$SCRIPT_DIR/commands/flow.md" ]; then
  info "Running from pipe — cloning claude-flow to /tmp..."
  rm -rf /tmp/claude-flow
  git clone --depth 1 https://github.com/hgahlot/claude-flow.git /tmp/claude-flow 2>/dev/null || {
    err "Failed to clone claude-flow repo. Check your internet connection."
    exit 1
  }
  SCRIPT_DIR="/tmp/claude-flow"
fi

# ── Flags ─────────────────────────────────────────────────────────────────────

SKIP_GLOBAL=false
SKIP_LOCAL=false
SKIP_TEMPLATES=false
FORCE=false

for arg in "$@"; do
  case $arg in
    --skip-global)   SKIP_GLOBAL=true ;;
    --skip-local)    SKIP_LOCAL=true ;;
    --skip-templates) SKIP_TEMPLATES=true ;;
    --force)         FORCE=true ;;
    --help|-h)
      echo "Usage: setup.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --skip-global     Skip global tool installation (gstack, Superpowers, Claude-Mem, ralph-wiggum)"
      echo "  --skip-local      Skip local tool installation (GSD, UI/UX Pro Max)"
      echo "  --skip-templates  Skip copying template files (CLAUDE.md, STATE.md, etc.)"
      echo "  --force           Overwrite existing files without prompting"
      echo "  --help, -h        Show this help"
      exit 0
      ;;
  esac
done

# ── OS Detection ──────────────────────────────────────────────────────────────

detect_os() {
  if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "macos"
  elif [[ -f /etc/os-release ]]; then
    . /etc/os-release
    case "$ID" in
      amzn|rhel|centos|fedora|rocky|alma) echo "rhel" ;;
      ubuntu|debian|pop|mint|elementary)  echo "debian" ;;
      *) echo "linux" ;;
    esac
  else
    echo "linux"
  fi
}

OS=$(detect_os)
info "Detected OS: $OS"

# ── Helper: safe copy (don't overwrite unless --force) ────────────────────────

safe_copy() {
  local src="$1" dst="$2"
  if [ -f "$dst" ] && [ "$FORCE" != "true" ]; then
    warn "Skipping $dst (already exists; use --force to overwrite)"
    return 0
  fi
  mkdir -p "$(dirname "$dst")"
  cp "$src" "$dst"
  ok "Copied $(basename "$dst")"
}

# ── Helper: check command exists ──────────────────────────────────────────────

has() { command -v "$1" &>/dev/null; }

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 1: Prerequisites
# ══════════════════════════════════════════════════════════════════════════════

step "Phase 1: Prerequisites"

# ── Node.js ───────────────────────────────────────────────────────────────────

if has node; then
  NODE_VER=$(node --version | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VER" -ge 20 ]; then
    ok "Node.js $(node --version)"
  else
    warn "Node.js $(node --version) found but v20+ required"
    info "Installing Node.js 22..."
    case $OS in
      macos)  brew install node ;;
      rhel)   curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash - && sudo yum install -y nodejs ;;
      debian) curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash - && sudo apt-get install -y nodejs ;;
      *)      err "Please install Node.js 20+ manually"; exit 1 ;;
    esac
  fi
else
  info "Node.js not found — installing v22..."
  case $OS in
    macos)  brew install node ;;
    rhel)   curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash - && sudo yum install -y nodejs ;;
    debian) curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash - && sudo apt-get install -y nodejs ;;
    *)      err "Please install Node.js 20+ manually"; exit 1 ;;
  esac
  ok "Node.js $(node --version) installed"
fi

# ── Python 3 ──────────────────────────────────────────────────────────────────

if has python3; then
  ok "Python 3 $(python3 --version 2>&1 | awk '{print $2}')"
else
  warn "Python 3 not found — UI/UX Pro Max search won't work. Install python3 manually."
fi

# ── Git ───────────────────────────────────────────────────────────────────────

if has git; then
  ok "git $(git --version | awk '{print $3}')"
else
  info "git not found — installing..."
  case $OS in
    macos)  brew install git ;;
    rhel)   sudo dnf install -y git || sudo yum install -y git ;;
    debian) sudo apt-get install -y git ;;
  esac
  ok "git installed"
fi

# ── Bun ───────────────────────────────────────────────────────────────────────

if has bun; then
  ok "Bun $(bun --version)"
else
  info "Bun not found — installing..."
  curl -fsSL https://bun.sh/install | bash
  # Source the updated profile to get bun in PATH
  [ -f "$HOME/.bash_profile" ] && source "$HOME/.bash_profile" 2>/dev/null || true
  [ -f "$HOME/.bashrc" ] && source "$HOME/.bashrc" 2>/dev/null || true
  [ -f "$HOME/.zshrc" ] && source "$HOME/.zshrc" 2>/dev/null || true
  export PATH="$HOME/.bun/bin:$PATH"
  if has bun; then
    ok "Bun $(bun --version) installed"
  else
    warn "Bun installed but not in PATH — add ~/.bun/bin to your PATH"
  fi
fi

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 2: Global Tools (one-time install, available in all projects)
# ══════════════════════════════════════════════════════════════════════════════

if [ "$SKIP_GLOBAL" != "true" ]; then
  step "Phase 2: Global Tools"

  # ── gstack ────────────────────────────────────────────────────────────────

  if [ -d "$HOME/.claude/skills/gstack" ]; then
    ok "gstack already installed"
  else
    info "Installing gstack (25 skills by Garry Tan)..."
    git clone https://github.com/garrytan/gstack.git "$HOME/.claude/skills/gstack"
    cd "$HOME/.claude/skills/gstack" && ./setup
    cd "$TARGET_DIR"
    ok "gstack installed"

    # Install system deps for Playwright Chromium if needed
    if [ "$OS" = "rhel" ]; then
      info "Installing Playwright Chromium system dependencies..."
      sudo dnf install -y atk at-spi2-atk cups-libs libxcb libxkbcommon at-spi2-core \
        libX11 libXcomposite libXdamage libXext libXfixes libXrandr mesa-libgbm cairo \
        pango alsa-lib 2>/dev/null || warn "Some Playwright deps may be missing — run ldd on chromium to check"
    elif [ "$OS" = "debian" ]; then
      info "Installing Playwright Chromium system dependencies..."
      sudo apt-get install -y libatk1.0-0 libatk-bridge2.0-0 libcups2 libxcb1 \
        libxkbcommon0 libatspi2.0-0 libx11-6 libxcomposite1 libxdamage1 libxext6 \
        libxfixes3 libxrandr2 libgbm1 libcairo2 libpango-1.0-0 libasound2 2>/dev/null || warn "Some Playwright deps may be missing"
    fi
  fi

  # ── Superpowers ───────────────────────────────────────────────────────────

  if [ -d "$HOME/.claude/plugins/obra/superpowers" ]; then
    ok "Superpowers already installed"
  else
    info "Installing Superpowers (14 auto-triggering skills)..."
    mkdir -p "$HOME/.claude/plugins/obra"
    git clone https://github.com/obra/superpowers "$HOME/.claude/plugins/obra/superpowers"
    ok "Superpowers installed"
  fi

  # ── Claude-Mem ────────────────────────────────────────────────────────────

  if [ -d "$HOME/.claude/plugins/marketplaces/thedotmack" ]; then
    ok "Claude-Mem already installed"
  else
    info "Installing Claude-Mem (session memory persistence)..."
    mkdir -p "$HOME/.claude/plugins/marketplaces"
    git clone https://github.com/thedotmack/claude-mem \
      "$HOME/.claude/plugins/marketplaces/thedotmack"
    cd "$HOME/.claude/plugins/marketplaces/thedotmack"
    bun install 2>/dev/null || warn "bun install for Claude-Mem failed — will retry on first session"
    cd "$TARGET_DIR"
    ok "Claude-Mem installed"
  fi

  # ── ralph-wiggum ──────────────────────────────────────────────────────────

  if has ralph || [ -f "$HOME/.bun/bin/ralph" ]; then
    ok "ralph-wiggum already installed"
  else
    info "Installing ralph-wiggum (autonomous loop runner)..."
    bun add -g @th0rgal/ralph-wiggum 2>/dev/null || warn "ralph-wiggum install failed — optional tool, continuing"
    ok "ralph-wiggum installed"
  fi

else
  step "Phase 2: Global Tools (SKIPPED)"
  info "Use --skip-global to skip, or run without to install"
fi

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 3: Local Tools (per-project)
# ══════════════════════════════════════════════════════════════════════════════

if [ "$SKIP_LOCAL" != "true" ]; then
  step "Phase 3: Local Tools (project: $TARGET_DIR)"

  # ── GSD ───────────────────────────────────────────────────────────────────

  if [ -d ".claude/commands/gsd" ]; then
    ok "GSD already installed"
  else
    info "Installing GSD (50 slash commands + 17 agents)..."
    npx --yes get-shit-done-cc@latest --claude --local
    ok "GSD installed"
  fi

  # ── UI/UX Pro Max ─────────────────────────────────────────────────────────

  if [ -d ".claude/skills/ui-ux-pro-max" ]; then
    ok "UI/UX Pro Max already installed"
  else
    info "Installing UI/UX Pro Max (design system intelligence)..."
    npx --yes uipro-cli init --ai claude 2>/dev/null || {
      warn "npx uipro-cli failed — falling back to git clone..."
      rm -rf /tmp/uipro-skill
      git clone https://github.com/nextlevelbuilder/ui-ux-pro-max-skill /tmp/uipro-skill 2>/dev/null || {
        warn "UI/UX Pro Max install failed — continuing without it"
        true
      }
      if [ -d /tmp/uipro-skill ]; then
        mkdir -p .claude/skills
        cp -r /tmp/uipro-skill/.claude/skills/ui-ux-pro-max .claude/skills/ 2>/dev/null || true
        cp -r /tmp/uipro-skill/src/ui-ux-pro-max/data .claude/skills/ui-ux-pro-max/ 2>/dev/null || true
        cp -r /tmp/uipro-skill/src/ui-ux-pro-max/scripts .claude/skills/ui-ux-pro-max/ 2>/dev/null || true
        rm -rf /tmp/uipro-skill
      fi
    }
    ok "UI/UX Pro Max installed"
  fi

else
  step "Phase 3: Local Tools (SKIPPED)"
fi

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 4: Custom Commands, Hooks, and Config
# ══════════════════════════════════════════════════════════════════════════════

step "Phase 4: Custom Commands & Hooks"

# ── /flow wrapper ───────────────────────────────────────────────────────────

mkdir -p .claude/commands
safe_copy "$SCRIPT_DIR/commands/flow.md"          ".claude/commands/flow.md"
safe_copy "$SCRIPT_DIR/commands/plan.md"           ".claude/commands/plan.md"
safe_copy "$SCRIPT_DIR/commands/tdd.md"            ".claude/commands/tdd.md"
safe_copy "$SCRIPT_DIR/commands/checkpoint.md"     ".claude/commands/checkpoint.md"
safe_copy "$SCRIPT_DIR/commands/build-fix.md"      ".claude/commands/build-fix.md"
safe_copy "$SCRIPT_DIR/commands/multi-execute.md"  ".claude/commands/multi-execute.md"
safe_copy "$SCRIPT_DIR/commands/update.md"         ".claude/commands/update.md"
safe_copy "$SCRIPT_DIR/commands/discover.md"      ".claude/commands/discover.md"
safe_copy "$SCRIPT_DIR/commands/integrate.md"     ".claude/commands/integrate.md"

# ── Session health check hook ───────────────────────────────────────────────

mkdir -p .claude/hooks
safe_copy "$SCRIPT_DIR/hooks/session-health-check.js" ".claude/hooks/session-health-check.js"

# ── Settings (merge with existing if GSD already created one) ───────────────

if [ -f ".claude/settings.json" ] && [ "$FORCE" != "true" ]; then
  # GSD likely already created settings.json — check if our hooks are already there
  if grep -q "session-health-check" ".claude/settings.json" 2>/dev/null; then
    ok "settings.json already has health check hook"
  else
    warn "settings.json exists but missing health check hook"
    info "Merging session-health-check into existing settings.json..."

    # Use node to merge the hook into existing settings
    node -e "
      const fs = require('fs');
      const existing = JSON.parse(fs.readFileSync('.claude/settings.json', 'utf8'));
      if (!existing.hooks) existing.hooks = {};
      if (!existing.hooks.SessionStart) existing.hooks.SessionStart = [];

      // Check if health check already exists
      const hasHealthCheck = existing.hooks.SessionStart.some(g =>
        g.hooks && g.hooks.some(h => h.command && h.command.includes('session-health-check'))
      );

      if (!hasHealthCheck) {
        existing.hooks.SessionStart.push({
          hooks: [{
            type: 'command',
            command: 'node .claude/hooks/session-health-check.js',
            timeout: 20
          }]
        });
        fs.writeFileSync('.claude/settings.json', JSON.stringify(existing, null, 2) + '\n');
        console.log('Merged health check hook into settings.json');
      }
    " 2>/dev/null || warn "Could not auto-merge settings.json — add health check hook manually"
    ok "settings.json updated"
  fi
else
  safe_copy "$SCRIPT_DIR/templates/settings.json" ".claude/settings.json"
fi

# ── settings.local.json (permissions — always project-local, gitignored) ────

if [ ! -f ".claude/settings.local.json" ]; then
  safe_copy "$SCRIPT_DIR/templates/settings.local.json" ".claude/settings.local.json"
fi

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 5: Template Files
# ══════════════════════════════════════════════════════════════════════════════

if [ "$SKIP_TEMPLATES" != "true" ]; then
  step "Phase 5: Project Templates"

  safe_copy "$SCRIPT_DIR/templates/CLAUDE.md"        "CLAUDE.md"
  safe_copy "$SCRIPT_DIR/templates/PROJECT.md"       "PROJECT.md"
  safe_copy "$SCRIPT_DIR/templates/REQUIREMENTS.md"  "REQUIREMENTS.md"
  safe_copy "$SCRIPT_DIR/templates/ROADMAP.md"       "ROADMAP.md"
  safe_copy "$SCRIPT_DIR/templates/STATE.md"         "STATE.md"

  # ── docs ──────────────────────────────────────────────────────────────────

  mkdir -p docs
  safe_copy "$SCRIPT_DIR/docs/claude-code-setup.md"   "docs/claude-code-setup.md"
  safe_copy "$SCRIPT_DIR/docs/development-flow.md"     "docs/development-flow.md"

else
  step "Phase 5: Project Templates (SKIPPED)"
fi

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 6: .gitignore additions
# ══════════════════════════════════════════════════════════════════════════════

step "Phase 6: Gitignore"

GITIGNORE_ENTRIES=(
  ".claude/settings.local.json"
  ".planning/"
  ".ralph/"
)

touch .gitignore
for entry in "${GITIGNORE_ENTRIES[@]}"; do
  if ! grep -qF "$entry" .gitignore 2>/dev/null; then
    echo "$entry" >> .gitignore
    ok "Added $entry to .gitignore"
  fi
done

# ══════════════════════════════════════════════════════════════════════════════
# PHASE 7: Weekly discovery cron job
# ══════════════════════════════════════════════════════════════════════════════

step "Phase 7: Weekly Discovery Cron"

# Copy discover.js to a stable location
mkdir -p "$HOME/.claude-flow"
cp "$SCRIPT_DIR/discover.js" "$HOME/.claude-flow/discover.js"
cp "$SCRIPT_DIR/integrate.js" "$HOME/.claude-flow/integrate.js"
ok "Installed discover.js and integrate.js to ~/.claude-flow/"

# Set up weekly cron job (Monday 9 AM) if not already present
CRON_CMD="node $HOME/.claude-flow/discover.js --cron --quiet"
if crontab -l 2>/dev/null | grep -qF "claude-flow/discover.js"; then
  ok "Weekly discovery cron already installed"
else
  # Add to existing crontab (preserve existing entries)
  (crontab -l 2>/dev/null; echo "0 9 * * 1 $CRON_CMD >> $HOME/.claude-flow/discover.log 2>&1") | crontab -
  if [ $? -eq 0 ]; then
    ok "Weekly discovery cron installed (Mondays at 9 AM)"
  else
    warn "Could not install cron job — run manually: node ~/.claude-flow/discover.js"
  fi
fi

# Run initial discovery in background
info "Running initial tool discovery in background..."
node "$HOME/.claude-flow/discover.js" --quiet &>/dev/null &
disown 2>/dev/null || true

# ══════════════════════════════════════════════════════════════════════════════
# Done
# ══════════════════════════════════════════════════════════════════════════════

step "Setup Complete"

echo -e "${BOLD}What was installed:${NC}"
echo ""
echo -e "  ${GREEN}Global (all projects):${NC}"
echo "    gstack          ~/.claude/skills/gstack/"
echo "    Superpowers      ~/.claude/plugins/obra/superpowers/"
echo "    Claude-Mem       ~/.claude/plugins/marketplaces/thedotmack/"
echo "    ralph-wiggum     ~/.bun/bin/ralph"
echo ""
echo -e "  ${GREEN}Local (this project):${NC}"
echo "    GSD              .claude/commands/gsd/ + .claude/agents/"
echo "    UI/UX Pro Max    .claude/skills/ui-ux-pro-max/"
echo "    /flow wrapper    .claude/commands/flow.md"
echo "    Custom commands  .claude/commands/{plan,tdd,checkpoint,build-fix,multi-execute,update,discover,integrate}.md"
echo "    Health check     .claude/hooks/session-health-check.js"
echo "    CLAUDE.md        Project root"
echo ""
echo -e "  ${GREEN}Automation:${NC}"
echo "    Discovery cron   Mondays 9 AM — scans GitHub trending for new Claude Code tools"
echo "    Discovery engine ~/.claude-flow/discover.js"
echo "    Integration engine ~/.claude-flow/integrate.js"
echo ""
echo -e "${BOLD}Next steps:${NC}"
echo ""
echo "  1. Edit CLAUDE.md — fill in the Project Overview section"
echo "  2. Start Claude Code:  claude"
echo "  3. Run:  /flow"
echo "  4. Run:  /discover   (see what Claude Code tools are trending this week)"
echo ""
echo "  /flow will detect you're starting fresh and guide you through project initialization."
echo ""
