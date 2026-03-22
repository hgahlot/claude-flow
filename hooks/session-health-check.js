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

// Paths
const CLAUDE_MEM_DIR = path.join(HOME, '.claude-mem');
const WORKER_PID_FILE = path.join(CLAUDE_MEM_DIR, 'worker.pid');
const CLAUDE_MEM_DB = path.join(CLAUDE_MEM_DIR, 'claude-mem.db');
const WORKER_SCRIPT = path.join(HOME, '.claude/plugins/marketplaces/thedotmack/plugin/scripts/worker-service.cjs');
const BUN_RUNNER = path.join(HOME, '.claude/plugins/marketplaces/thedotmack/plugin/scripts/bun-runner.js');
const BUN_BIN = path.join(HOME, '.bun/bin/bun');
const STATE_MD = path.join(PROJECT_DIR, 'STATE.md');

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
  } else {
    const match = content.match(/Ended:\s*(.+)/);
    const lastSession = match ? match[1].trim() : 'unknown';
    ok.push(`STATE.md present (last session: ${lastSession})`);
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

// ── Run all checks ────────────────────────────────────────────────────────────

checkClaudeMem();
checkState();
checkAutoMemory();

// ── Output ────────────────────────────────────────────────────────────────────

if (fixes.length === 0 && issues.length === 0) {
  const summary = ok.join(' · ');
  console.log(`[Health] ✓ ${summary}`);
} else {
  const lines = ['[Session Health Check]'];
  for (const f of fixes) lines.push(`⚡ FIXED: ${f}`);
  for (const i of issues) lines.push(`⚠  ISSUE: ${i}`);
  for (const o of ok) lines.push(`✓  ${o}`);
  if (issues.length > 0) {
    lines.push('');
    lines.push('Address the issues above before starting work, or they will affect session history.');
  }
  console.log(lines.join('\n'));
}
