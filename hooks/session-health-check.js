#!/usr/bin/env node
// Session Health Check — runs on every SessionStart
// Verifies memory and state systems, auto-fixes where possible,
// reports status to Claude so it knows what's working.

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const HOME = os.homedir();
const PROJECT_DIR = process.cwd();

// ── Paths ────────────────────────────────────────────────────────────────────

// Claude-Mem
const CLAUDE_MEM_DIR = path.join(HOME, '.claude-mem');
const WORKER_PID_FILE = path.join(CLAUDE_MEM_DIR, 'worker.pid');
const CLAUDE_MEM_DB = path.join(CLAUDE_MEM_DIR, 'claude-mem.db');
const WORKER_SCRIPT = path.join(HOME, '.claude/plugins/marketplaces/thedotmack/plugin/scripts/worker-service.cjs');
const BUN_RUNNER = path.join(HOME, '.claude/plugins/marketplaces/thedotmack/plugin/scripts/bun-runner.js');

// Project state files
const STATE_MD = path.join(PROJECT_DIR, 'STATE.md');
const CLAUDE_MD = path.join(PROJECT_DIR, 'CLAUDE.md');
const PROJECT_MD = path.join(PROJECT_DIR, 'PROJECT.md');
const REQUIREMENTS_MD = path.join(PROJECT_DIR, 'REQUIREMENTS.md');
const ROADMAP_MD = path.join(PROJECT_DIR, 'ROADMAP.md');

// Tool directories
const SETTINGS_JSON = path.join(PROJECT_DIR, '.claude/settings.json');
const GSD_DIR = path.join(PROJECT_DIR, '.claude/commands/gsd');
const GSTACK_DIR = path.join(HOME, '.claude/skills/gstack');
const SUPERPOWERS_DIR = path.join(HOME, '.claude/plugins/obra/superpowers');
const CLAUDE_MEM_PLUGIN_DIR = path.join(HOME, '.claude/plugins/marketplaces/thedotmack');

// Auto-memory path: /home/user/my-project -> -home-user-my-project
const projectKey = PROJECT_DIR.replace(/\//g, '-');
const MEMORY_MD = path.join(HOME, `.claude/projects/${projectKey}/memory/MEMORY.md`);

const fixes = [];
const issues = [];
const ok = [];

// ── 1. Claude-Mem worker ──────────────────────────────────────────────────────

function isProcessRunning(pid) {
  try {
    process.kill(parseInt(pid), 0);
    return true;
  } catch (e) {
    return false;
  }
}

function checkClaudeMem() {
  if (!fs.existsSync(WORKER_SCRIPT)) {
    // Claude-Mem not installed — not an error, just skip
    ok.push('Claude-Mem not installed (optional)');
    return;
  }

  let running = false;
  if (fs.existsSync(WORKER_PID_FILE)) {
    const pid = fs.readFileSync(WORKER_PID_FILE, 'utf8').trim();
    running = isProcessRunning(pid);
  }

  if (!running) {
    // Start the worker using bun-runner (finds bun at ~/.bun/bin/bun even without PATH)
    const result = spawnSync('node', [BUN_RUNNER, WORKER_SCRIPT, 'start'], {
      encoding: 'utf8',
      timeout: 15000,
      env: { ...process.env, HOME }
    });

    if (result.status === 0) {
      const stdout = (result.stdout || '').trim();
      let workerReady = stdout.includes('"status":"ready"') || stdout.includes('"status": "ready"');

      if (!workerReady && fs.existsSync(WORKER_PID_FILE)) {
        const pid = fs.readFileSync(WORKER_PID_FILE, 'utf8').trim();
        workerReady = isProcessRunning(pid);
      }

      if (workerReady) {
        fixes.push('Claude-Mem worker was not running — started successfully');
      } else {
        fixes.push('Claude-Mem worker start attempted — could not verify (check: bun ~/.claude/plugins/marketplaces/thedotmack/plugin/scripts/worker-service.cjs status)');
      }
    } else {
      const err = (result.stderr || result.stdout || '').trim().split('\n')[0];
      issues.push(`Claude-Mem worker failed to start: ${err || 'unknown error'}`);
    }
  } else {
    const dbSize = fs.existsSync(CLAUDE_MEM_DB)
      ? `DB ${(fs.statSync(CLAUDE_MEM_DB).size / 1024).toFixed(0)}KB`
      : 'DB not yet created';
    ok.push(`Claude-Mem worker running (${dbSize})`);
  }
}

// ── 2. STATE.md ───────────────────────────────────────────────────────────────

function checkState() {
  if (!fs.existsSync(STATE_MD)) {
    issues.push('STATE.md missing — run /gsd:new-project or /gsd:checkpoint to create it');
    return;
  }

  const content = fs.readFileSync(STATE_MD, 'utf8');
  const isBlank = content.includes('(none yet)') && content.includes('(none)');

  if (isBlank) {
    issues.push('STATE.md is a blank template — run /gsd:checkpoint after completing work to capture session state');
    return;
  }

  const match = content.match(/Ended:\s*(.+)/);
  if (match) {
    const lastSession = match[1].trim();
    const parsed = new Date(lastSession);
    if (!isNaN(parsed.getTime())) {
      const daysSince = Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince > 7) {
        issues.push(`STATE.md is stale (last session ${daysSince} days ago) — review and update it, or run /checkpoint`);
        return;
      }
      ok.push(`STATE.md current (last session: ${lastSession})`);
    } else {
      ok.push(`STATE.md present (last session: ${lastSession})`);
    }
  } else {
    ok.push('STATE.md present');
  }
}

// ── 3. Auto-memory ────────────────────────────────────────────────────────────

function checkAutoMemory() {
  if (!fs.existsSync(MEMORY_MD)) {
    // Not an error on first run
    ok.push('Auto-memory not yet initialized (will be created as you work)');
    return;
  }

  const content = fs.readFileSync(MEMORY_MD, 'utf8');
  const entryCount = (content.match(/^\-\s+\[/gm) || []).length;
  ok.push(`Auto-memory: ${entryCount} entries in MEMORY.md`);
}

// ── 4. Project files ─────────────────────────────────────────────────────────

function checkProjectFiles() {
  if (!fs.existsSync(CLAUDE_MD)) {
    issues.push('CLAUDE.md missing — run setup.sh or create from template');
  }

  const recommended = [
    { path: PROJECT_MD, name: 'PROJECT.md' },
    { path: REQUIREMENTS_MD, name: 'REQUIREMENTS.md' },
    { path: ROADMAP_MD, name: 'ROADMAP.md' },
  ];

  const missing = recommended.filter(f => !fs.existsSync(f.path)).map(f => f.name);
  if (missing.length > 0 && missing.length < recommended.length) {
    issues.push(`Missing project files: ${missing.join(', ')} — run /gsd:new-project to generate`);
  } else if (missing.length === 0) {
    ok.push('Project files present (PROJECT.md, REQUIREMENTS.md, ROADMAP.md)');
  }
  // If all missing, it's likely --skip-templates was used — not worth flagging
}

// ── 5. Tool installation ─────────────────────────────────────────────────────

function checkTools() {
  const installed = [];
  const missing = [];

  // Local
  if (fs.existsSync(GSD_DIR)) {
    try {
      const count = fs.readdirSync(GSD_DIR).filter(f => f.endsWith('.md')).length;
      installed.push(`GSD (${count} commands)`);
    } catch { installed.push('GSD'); }
  } else {
    missing.push('GSD (.claude/commands/gsd/)');
  }

  // Global
  if (fs.existsSync(GSTACK_DIR)) installed.push('gstack');
  else missing.push('gstack');

  if (fs.existsSync(SUPERPOWERS_DIR)) installed.push('Superpowers');
  else missing.push('Superpowers');

  if (fs.existsSync(CLAUDE_MEM_PLUGIN_DIR)) installed.push('Claude-Mem');
  // Claude-Mem checked separately in checkClaudeMem

  if (missing.length > 0) {
    issues.push(`Missing tools: ${missing.join(', ')} — run setup.sh`);
  }
  if (installed.length > 0) {
    ok.push(`Tools: ${installed.join(', ')}`);
  }
}

// ── 6. Settings & hooks integrity ────────────────────────────────────────────

function checkSettings() {
  if (!fs.existsSync(SETTINGS_JSON)) {
    issues.push('settings.json missing — hooks are not active. Run setup.sh');
    return;
  }

  try {
    const settings = JSON.parse(fs.readFileSync(SETTINGS_JSON, 'utf8'));
    const sessionHooks = settings?.hooks?.SessionStart || [];
    const hasHealthCheck = sessionHooks.some(g =>
      g.hooks && g.hooks.some(h => h.command && h.command.includes('session-health-check'))
    );
    if (!hasHealthCheck) {
      issues.push('Health check hook not registered in settings.json SessionStart');
    } else {
      ok.push('settings.json valid, hooks wired');
    }
  } catch (e) {
    issues.push(`settings.json is invalid JSON — ${e.message}`);
  }
}

// ── 7. Git status ────────────────────────────────────────────────────────────

function checkGit() {
  if (!fs.existsSync(path.join(PROJECT_DIR, '.git'))) {
    issues.push('Not a git repository — run git init');
    return;
  }

  const result = spawnSync('git', ['status', '--porcelain'], {
    encoding: 'utf8',
    timeout: 5000,
    cwd: PROJECT_DIR
  });

  if (result.status === 0) {
    const lines = (result.stdout || '').trim().split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      ok.push(`Git: ${lines.length} uncommitted change${lines.length === 1 ? '' : 's'}`);
    } else {
      ok.push('Git: clean working tree');
    }
  }
}

// ── 8. Pending discoveries ───────────────────────────────────────────────────

function checkDiscoveries() {
  const reportFile = path.join(HOME, '.claude-flow/discoveries.json');
  if (!fs.existsSync(reportFile)) return;

  try {
    const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
    if (!report.discoveries || report.discoveries.length === 0) return;

    // Check if report is recent (within 14 days)
    const reportDate = new Date(report.timestamp);
    const daysSince = Math.floor((Date.now() - reportDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 14) return;

    // Filter out already-installed
    const historyFile = path.join(HOME, '.claude-flow/discovery-history.json');
    let installed = {};
    if (fs.existsSync(historyFile)) {
      try {
        installed = JSON.parse(fs.readFileSync(historyFile, 'utf8')).installed || {};
      } catch {}
    }

    const pending = report.discoveries.filter(d => !installed[d.repo.fullName]);
    if (pending.length > 0) {
      ok.push(`${pending.length} new tool(s) found in trending repos — run /discover to review`);
    }
  } catch {}
}

// ── Run all checks ────────────────────────────────────────────────────────────

checkClaudeMem();
checkState();
checkAutoMemory();
checkProjectFiles();
checkTools();
checkSettings();
checkGit();
checkDiscoveries();

// ── Output ────────────────────────────────────────────────────────────────────

if (fixes.length === 0 && issues.length === 0) {
  const summary = ok.join(' · ');
  console.log(`[Health] ✓ ${summary}`);
} else {
  const lines = ['[Session Health Check]'];
  for (const f of fixes) lines.push(`  ⚡ FIXED: ${f}`);
  for (const i of issues) lines.push(`  ⚠  ISSUE: ${i}`);
  for (const o of ok) lines.push(`  ✓  ${o}`);

  const total = fixes.length + issues.length + ok.length;
  const healthy = fixes.length + ok.length;
  lines.push('');
  lines.push(`  ${healthy}/${total} checks passed${issues.length > 0 ? ` · ${issues.length} need${issues.length === 1 ? 's' : ''} attention` : ''}`);

  console.log(lines.join('\n'));
}
