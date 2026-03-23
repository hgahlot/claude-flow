#!/usr/bin/env bash
set -uo pipefail

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  claude-flow update                                                         ║
# ║  Fetches latest versions of all underlying tools, updates them,            ║
# ║  pulls flow repo changes, and re-applies the integration layer.            ║
# ║                                                                             ║
# ║  Usage:                                                                     ║
# ║    bash update.sh                    # update everything                    ║
# ║    bash update.sh --check            # check for updates without applying   ║
# ║    bash update.sh --tool gsd         # update a specific tool only          ║
# ║    bash update.sh --skip-flow        # update tools but not flow itself     ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

# ── Colors ────────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

info()  { echo -e "${BLUE}[info]${NC}  $*"; }
ok()    { echo -e "${GREEN}[ok]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC}  $*"; }
err()   { echo -e "${RED}[error]${NC} $*"; }
step()  { echo -e "\n${BOLD}${CYAN}── $* ──${NC}\n"; }

# ── Flags ─────────────────────────────────────────────────────────────────────

CHECK_ONLY=false
SKIP_FLOW=false
TOOL_FILTER=""

for arg in "$@"; do
  case $arg in
    --check)      CHECK_ONLY=true ;;
    --skip-flow)  SKIP_FLOW=true ;;
    --tool)       TOOL_FILTER="__next__" ;;
    --help|-h)
      echo "Usage: update.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --check        Check for updates without applying them"
      echo "  --tool <name>  Update a specific tool only (gsd, gstack, superpowers, claude-mem, uipro, ralph, flow)"
      echo "  --skip-flow    Update tools but don't update flow's integration layer"
      echo "  --help, -h     Show this help"
      exit 0
      ;;
    *)
      if [ "$TOOL_FILTER" = "__next__" ]; then
        TOOL_FILTER="$arg"
      fi
      ;;
  esac
done

# ── Helpers ───────────────────────────────────────────────────────────────────

has() { command -v "$1" &>/dev/null; }

HOME_DIR="$HOME"
PROJECT_DIR="$(pwd)"

# Get short git hash for a repo, or "none" if not a git repo
git_hash() {
  local dir="$1"
  if [ -d "$dir/.git" ]; then
    git -C "$dir" rev-parse --short HEAD 2>/dev/null || echo "none"
  else
    echo "none"
  fi
}

# Check if a git repo has upstream changes
git_has_updates() {
  local dir="$1"
  if [ ! -d "$dir/.git" ]; then
    return 1
  fi
  git -C "$dir" fetch origin --quiet 2>/dev/null || return 1
  local local_hash=$(git -C "$dir" rev-parse HEAD 2>/dev/null)
  local remote_hash=$(git -C "$dir" rev-parse origin/main 2>/dev/null || git -C "$dir" rev-parse origin/master 2>/dev/null)
  [ "$local_hash" != "$remote_hash" ]
}

# Count commits behind
git_commits_behind() {
  local dir="$1"
  local count=$(git -C "$dir" rev-list HEAD..origin/main --count 2>/dev/null || git -C "$dir" rev-list HEAD..origin/master --count 2>/dev/null || echo "0")
  echo "$count"
}

# Should we update this tool?
should_update() {
  local tool="$1"
  [ -z "$TOOL_FILTER" ] || [ "$TOOL_FILTER" = "$tool" ]
}

# Track results
declare -a UPDATED=()
declare -a SKIPPED=()
declare -a FAILED=()
declare -a AVAILABLE=()

# ══════════════════════════════════════════════════════════════════════════════
# Tool updates
# ══════════════════════════════════════════════════════════════════════════════

# ── GSD ───────────────────────────────────────────────────────────────────────

update_gsd() {
  local gsd_dir="$PROJECT_DIR/.claude/commands/gsd"

  if [ ! -d "$gsd_dir" ]; then
    warn "GSD not installed — run setup.sh first"
    SKIPPED+=("GSD (not installed)")
    return
  fi

  local before_count=$(ls "$gsd_dir"/*.md 2>/dev/null | wc -l | tr -d ' ')

  if [ "$CHECK_ONLY" = "true" ]; then
    info "GSD: currently ${before_count} commands installed (npm package — run update to fetch latest)"
    AVAILABLE+=("GSD")
    return
  fi

  info "Updating GSD..."
  if npx --yes get-shit-done-cc@latest --claude --local 2>/dev/null; then
    local after_count=$(ls "$gsd_dir"/*.md 2>/dev/null | wc -l | tr -d ' ')
    if [ "$before_count" != "$after_count" ]; then
      ok "GSD updated (${before_count} → ${after_count} commands)"
    else
      ok "GSD updated (${after_count} commands)"
    fi
    UPDATED+=("GSD")
  else
    err "GSD update failed"
    FAILED+=("GSD")
  fi
}

# ── gstack ────────────────────────────────────────────────────────────────────

update_gstack() {
  local gstack_dir="$HOME_DIR/.claude/skills/gstack"

  if [ ! -d "$gstack_dir" ]; then
    warn "gstack not installed — run setup.sh first"
    SKIPPED+=("gstack (not installed)")
    return
  fi

  local before=$(git_hash "$gstack_dir")

  if git_has_updates "$gstack_dir"; then
    local behind=$(git_commits_behind "$gstack_dir")

    if [ "$CHECK_ONLY" = "true" ]; then
      info "gstack: ${behind} new commit(s) available (${before})"
      AVAILABLE+=("gstack (${behind} commits)")
      return
    fi

    info "Updating gstack (${behind} new commits)..."
    if git -C "$gstack_dir" pull --ff-only origin main 2>/dev/null || git -C "$gstack_dir" pull --ff-only origin master 2>/dev/null; then
      # Re-run setup if it exists
      if [ -f "$gstack_dir/setup" ]; then
        (cd "$gstack_dir" && ./setup 2>/dev/null) || warn "gstack setup script had issues — may need manual intervention"
      fi
      local after=$(git_hash "$gstack_dir")
      ok "gstack updated (${before} → ${after})"
      UPDATED+=("gstack")
    else
      err "gstack update failed — may have local modifications"
      FAILED+=("gstack")
    fi
  else
    if [ "$CHECK_ONLY" = "true" ]; then
      info "gstack: up to date (${before})"
    else
      ok "gstack already up to date (${before})"
    fi
    SKIPPED+=("gstack (up to date)")
  fi
}

# ── Superpowers ───────────────────────────────────────────────────────────────

update_superpowers() {
  local sp_dir="$HOME_DIR/.claude/plugins/obra/superpowers"

  if [ ! -d "$sp_dir" ]; then
    warn "Superpowers not installed — run setup.sh first"
    SKIPPED+=("Superpowers (not installed)")
    return
  fi

  local before=$(git_hash "$sp_dir")

  if git_has_updates "$sp_dir"; then
    local behind=$(git_commits_behind "$sp_dir")

    if [ "$CHECK_ONLY" = "true" ]; then
      info "Superpowers: ${behind} new commit(s) available (${before})"
      AVAILABLE+=("Superpowers (${behind} commits)")
      return
    fi

    info "Updating Superpowers (${behind} new commits)..."
    if git -C "$sp_dir" pull --ff-only origin main 2>/dev/null || git -C "$sp_dir" pull --ff-only origin master 2>/dev/null; then
      local after=$(git_hash "$sp_dir")
      ok "Superpowers updated (${before} → ${after})"
      UPDATED+=("Superpowers")
    else
      err "Superpowers update failed — may have local modifications"
      FAILED+=("Superpowers")
    fi
  else
    if [ "$CHECK_ONLY" = "true" ]; then
      info "Superpowers: up to date (${before})"
    else
      ok "Superpowers already up to date (${before})"
    fi
    SKIPPED+=("Superpowers (up to date)")
  fi
}

# ── Claude-Mem ────────────────────────────────────────────────────────────────

update_claude_mem() {
  local cm_dir="$HOME_DIR/.claude/plugins/marketplaces/thedotmack"

  if [ ! -d "$cm_dir" ]; then
    warn "Claude-Mem not installed — run setup.sh first"
    SKIPPED+=("Claude-Mem (not installed)")
    return
  fi

  local before=$(git_hash "$cm_dir")

  if git_has_updates "$cm_dir"; then
    local behind=$(git_commits_behind "$cm_dir")

    if [ "$CHECK_ONLY" = "true" ]; then
      info "Claude-Mem: ${behind} new commit(s) available (${before})"
      AVAILABLE+=("Claude-Mem (${behind} commits)")
      return
    fi

    info "Updating Claude-Mem (${behind} new commits)..."
    if git -C "$cm_dir" pull --ff-only origin main 2>/dev/null || git -C "$cm_dir" pull --ff-only origin master 2>/dev/null; then
      # Reinstall dependencies
      (cd "$cm_dir" && bun install 2>/dev/null) || warn "bun install for Claude-Mem had issues"
      local after=$(git_hash "$cm_dir")
      ok "Claude-Mem updated (${before} → ${after})"
      UPDATED+=("Claude-Mem")
    else
      err "Claude-Mem update failed — may have local modifications"
      FAILED+=("Claude-Mem")
    fi
  else
    if [ "$CHECK_ONLY" = "true" ]; then
      info "Claude-Mem: up to date (${before})"
    else
      ok "Claude-Mem already up to date (${before})"
    fi
    SKIPPED+=("Claude-Mem (up to date)")
  fi
}

# ── UI/UX Pro Max ─────────────────────────────────────────────────────────────

update_uipro() {
  local uipro_dir="$PROJECT_DIR/.claude/skills/ui-ux-pro-max"

  if [ ! -d "$uipro_dir" ]; then
    warn "UI/UX Pro Max not installed — run setup.sh first"
    SKIPPED+=("UI/UX Pro Max (not installed)")
    return
  fi

  if [ "$CHECK_ONLY" = "true" ]; then
    info "UI/UX Pro Max: installed (npm package — run update to fetch latest)"
    AVAILABLE+=("UI/UX Pro Max")
    return
  fi

  info "Updating UI/UX Pro Max..."
  if npx --yes uipro-cli init --ai claude 2>/dev/null; then
    ok "UI/UX Pro Max updated"
    UPDATED+=("UI/UX Pro Max")
  else
    # Fallback to git clone method
    warn "npx uipro-cli failed — trying git clone fallback..."
    rm -rf /tmp/uipro-skill
    if git clone --depth 1 https://github.com/nextlevelbuilder/ui-ux-pro-max-skill /tmp/uipro-skill 2>/dev/null; then
      cp -r /tmp/uipro-skill/.claude/skills/ui-ux-pro-max/* "$uipro_dir/" 2>/dev/null || true
      cp -r /tmp/uipro-skill/src/ui-ux-pro-max/data "$uipro_dir/" 2>/dev/null || true
      cp -r /tmp/uipro-skill/src/ui-ux-pro-max/scripts "$uipro_dir/" 2>/dev/null || true
      rm -rf /tmp/uipro-skill
      ok "UI/UX Pro Max updated (via git fallback)"
      UPDATED+=("UI/UX Pro Max")
    else
      err "UI/UX Pro Max update failed"
      FAILED+=("UI/UX Pro Max")
    fi
  fi
}

# ── ralph-wiggum ──────────────────────────────────────────────────────────────

update_ralph() {
  if ! has bun; then
    warn "Bun not installed — cannot update ralph-wiggum"
    SKIPPED+=("ralph-wiggum (bun not installed)")
    return
  fi

  if ! has ralph && [ ! -f "$HOME_DIR/.bun/bin/ralph" ]; then
    warn "ralph-wiggum not installed — run setup.sh first"
    SKIPPED+=("ralph-wiggum (not installed)")
    return
  fi

  if [ "$CHECK_ONLY" = "true" ]; then
    info "ralph-wiggum: installed (bun package — run update to fetch latest)"
    AVAILABLE+=("ralph-wiggum")
    return
  fi

  info "Updating ralph-wiggum..."
  if bun add -g @th0rgal/ralph-wiggum 2>/dev/null; then
    ok "ralph-wiggum updated"
    UPDATED+=("ralph-wiggum")
  else
    err "ralph-wiggum update failed"
    FAILED+=("ralph-wiggum")
  fi
}

# ══════════════════════════════════════════════════════════════════════════════
# Flow integration layer update
# ══════════════════════════════════════════════════════════════════════════════

update_flow() {
  step "Updating flow integration layer"

  # Determine where the flow repo is
  local flow_dir=""

  # Check if we're running from the flow repo itself
  if [ -f "$0" ] && [ -f "$(dirname "$0")/commands/flow.md" ]; then
    flow_dir="$(cd "$(dirname "$0")" && pwd)"
  fi

  # If not found, try /tmp/claude-flow or clone fresh
  if [ -z "$flow_dir" ] || [ ! -f "$flow_dir/commands/flow.md" ]; then
    if [ -d "/tmp/claude-flow/.git" ]; then
      flow_dir="/tmp/claude-flow"
      info "Pulling latest flow from /tmp/claude-flow..."
      git -C "$flow_dir" pull --ff-only origin main 2>/dev/null || {
        warn "Could not pull flow updates — re-cloning..."
        rm -rf /tmp/claude-flow
        git clone --depth 1 https://github.com/hgahlot/claude-flow.git /tmp/claude-flow 2>/dev/null || {
          err "Failed to clone flow repo"
          FAILED+=("flow")
          return
        }
        flow_dir="/tmp/claude-flow"
      }
    else
      info "Cloning latest flow to /tmp/claude-flow..."
      rm -rf /tmp/claude-flow
      git clone --depth 1 https://github.com/hgahlot/claude-flow.git /tmp/claude-flow 2>/dev/null || {
        err "Failed to clone flow repo — check your internet connection"
        FAILED+=("flow")
        return
      }
      flow_dir="/tmp/claude-flow"
    fi
  else
    # Update the flow repo itself if it's a git repo
    if [ -d "$flow_dir/.git" ]; then
      local before=$(git_hash "$flow_dir")
      info "Pulling latest flow changes..."
      git -C "$flow_dir" pull --ff-only origin main 2>/dev/null || warn "Could not pull flow repo (may have local changes)"
      local after=$(git_hash "$flow_dir")
      if [ "$before" != "$after" ]; then
        ok "Flow repo updated (${before} → ${after})"
      fi
    fi
  fi

  # Re-apply integration layer: commands, hooks
  local applied=0

  # Commands
  for cmd in flow.md plan.md tdd.md checkpoint.md build-fix.md multi-execute.md update.md; do
    if [ -f "$flow_dir/commands/$cmd" ]; then
      local src="$flow_dir/commands/$cmd"
      local dst="$PROJECT_DIR/.claude/commands/$cmd"
      mkdir -p "$PROJECT_DIR/.claude/commands"

      if [ -f "$dst" ]; then
        # Only copy if content differs
        if ! diff -q "$src" "$dst" &>/dev/null; then
          cp "$src" "$dst"
          ok "Updated command: /$( echo "$cmd" | sed 's/\.md$//' )"
          applied=$((applied + 1))
        fi
      else
        cp "$src" "$dst"
        ok "Added command: /$( echo "$cmd" | sed 's/\.md$//' )"
        applied=$((applied + 1))
      fi
    fi
  done

  # Hooks
  if [ -f "$flow_dir/hooks/session-health-check.js" ]; then
    local src="$flow_dir/hooks/session-health-check.js"
    local dst="$PROJECT_DIR/.claude/hooks/session-health-check.js"
    mkdir -p "$PROJECT_DIR/.claude/hooks"

    if [ -f "$dst" ]; then
      if ! diff -q "$src" "$dst" &>/dev/null; then
        cp "$src" "$dst"
        ok "Updated hook: session-health-check.js"
        applied=$((applied + 1))
      fi
    else
      cp "$src" "$dst"
      ok "Added hook: session-health-check.js"
      applied=$((applied + 1))
    fi
  fi

  # Check if CLAUDE.md template has changed (warn but don't overwrite)
  if [ -f "$flow_dir/templates/CLAUDE.md" ] && [ -f "$PROJECT_DIR/CLAUDE.md" ]; then
    if ! diff -q "$flow_dir/templates/CLAUDE.md" "$PROJECT_DIR/CLAUDE.md" &>/dev/null; then
      warn "CLAUDE.md template has changed upstream — review $flow_dir/templates/CLAUDE.md for new routing rules"
    fi
  fi

  # Ensure settings.json has the health check hook
  if [ -f "$PROJECT_DIR/.claude/settings.json" ]; then
    if ! grep -q "session-health-check" "$PROJECT_DIR/.claude/settings.json" 2>/dev/null; then
      info "Adding health check hook to settings.json..."
      node -e "
        const fs = require('fs');
        const existing = JSON.parse(fs.readFileSync('.claude/settings.json', 'utf8'));
        if (!existing.hooks) existing.hooks = {};
        if (!existing.hooks.SessionStart) existing.hooks.SessionStart = [];
        existing.hooks.SessionStart.push({
          hooks: [{ type: 'command', command: 'node .claude/hooks/session-health-check.js', timeout: 20 }]
        });
        fs.writeFileSync('.claude/settings.json', JSON.stringify(existing, null, 2) + '\n');
      " 2>/dev/null && ok "Health check hook added to settings.json" || warn "Could not update settings.json"
      applied=$((applied + 1))
    fi
  fi

  if [ $applied -eq 0 ]; then
    ok "Flow integration layer already up to date"
    SKIPPED+=("flow (up to date)")
  else
    ok "Flow integration layer: ${applied} file(s) updated"
    UPDATED+=("flow (${applied} files)")
  fi
}

# ══════════════════════════════════════════════════════════════════════════════
# Main
# ══════════════════════════════════════════════════════════════════════════════

if [ "$CHECK_ONLY" = "true" ]; then
  step "Checking for updates"
else
  step "Updating claude-flow tools"
fi

# Run tool updates
should_update "gsd"         && update_gsd
should_update "gstack"      && update_gstack
should_update "superpowers"  && update_superpowers
should_update "claude-mem"   && update_claude_mem
should_update "uipro"       && update_uipro
should_update "ralph"       && update_ralph

# Run flow integration update
if [ "$SKIP_FLOW" != "true" ] && should_update "flow"; then
  update_flow
fi

# ══════════════════════════════════════════════════════════════════════════════
# Summary
# ══════════════════════════════════════════════════════════════════════════════

step "Summary"

if [ "$CHECK_ONLY" = "true" ]; then
  if [ ${#AVAILABLE[@]} -gt 0 ]; then
    echo -e "${BOLD}Updates available:${NC}"
    for item in "${AVAILABLE[@]}"; do
      echo -e "  ${GREEN}↑${NC} $item"
    done
    echo ""
    echo -e "Run ${BOLD}bash update.sh${NC} to apply all updates."
  else
    echo -e "${GREEN}All tools are up to date.${NC}"
  fi
else
  if [ ${#UPDATED[@]} -gt 0 ]; then
    echo -e "${BOLD}Updated:${NC}"
    for item in "${UPDATED[@]}"; do
      echo -e "  ${GREEN}✓${NC} $item"
    done
  fi

  if [ ${#FAILED[@]} -gt 0 ]; then
    echo ""
    echo -e "${BOLD}Failed:${NC}"
    for item in "${FAILED[@]}"; do
      echo -e "  ${RED}✗${NC} $item"
    done
  fi

  if [ ${#UPDATED[@]} -eq 0 ] && [ ${#FAILED[@]} -eq 0 ]; then
    echo -e "${GREEN}Everything is already up to date.${NC}"
  fi

  if [ ${#UPDATED[@]} -gt 0 ]; then
    echo ""
    echo -e "${DIM}Tip: Run the session health check to verify everything is working:${NC}"
    echo -e "${DIM}  node .claude/hooks/session-health-check.js${NC}"
  fi
fi

echo ""
