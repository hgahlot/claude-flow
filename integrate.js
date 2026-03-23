#!/usr/bin/env node
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  claude-flow integrate                                                      ║
// ║  Analyzes a resource (repo, path, package, URL) and produces a structured  ║
// ║  integration report for the /integrate command.                            ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const HOME = os.homedir();
const PROJECT_DIR = process.cwd();
const TMP_DIR = path.join(os.tmpdir(), 'claude-flow-integrate');

// ── HTTP helper ──────────────────────────────────────────────────────────────

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, {
      headers: {
        'User-Agent': 'claude-flow-integrate/1.0',
        'Accept': options.accept || 'text/html',
        ...options.headers,
      },
      timeout: 15000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location, options).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
  });
}

// ── Source type detection ────────────────────────────────────────────────────

function detectSourceType(source) {
  // GitHub URL
  if (source.match(/^https?:\/\/(www\.)?github\.com\/[^/]+\/[^/]+/)) {
    const match = source.match(/github\.com\/([^/]+\/[^/]+)/);
    return { type: 'github', fullName: match[1].replace(/\.git$/, '').replace(/\/$/, '') };
  }

  // Generic git URL
  if (source.match(/\.git$/) || source.match(/^git@/)) {
    return { type: 'git', url: source };
  }

  // URL to a raw file (markdown, JS, etc.)
  if (source.match(/^https?:\/\//) && source.match(/\.(md|js|cjs|mjs|json|yaml|yml|txt)(\?|$)/)) {
    return { type: 'url-file', url: source };
  }

  // Generic URL (could be docs page, blog post, etc.)
  if (source.match(/^https?:\/\//)) {
    return { type: 'url', url: source };
  }

  // npm package name (scoped or unscoped)
  if (source.match(/^@?[a-z0-9][-a-z0-9._]*\/?[a-z0-9][-a-z0-9._]*$/i) && !source.includes('/')) {
    return { type: 'npm', package: source };
  }
  if (source.match(/^@[a-z0-9][-a-z0-9._]*\/[a-z0-9][-a-z0-9._]*$/i)) {
    return { type: 'npm', package: source };
  }

  // Local path
  if (fs.existsSync(source)) {
    const stat = fs.statSync(source);
    if (stat.isDirectory()) {
      return { type: 'local-dir', path: path.resolve(source) };
    } else {
      return { type: 'local-file', path: path.resolve(source) };
    }
  }

  // Could still be an npm package
  return { type: 'npm', package: source };
}

// ── Clone or prepare source ──────────────────────────────────────────────────

function prepareSource(sourceInfo) {
  fs.mkdirSync(TMP_DIR, { recursive: true });

  switch (sourceInfo.type) {
    case 'github': {
      const cloneDir = path.join(TMP_DIR, sourceInfo.fullName.replace('/', '__'));
      if (fs.existsSync(cloneDir)) {
        spawnSync('rm', ['-rf', cloneDir]);
      }
      const url = `https://github.com/${sourceInfo.fullName}.git`;
      const result = spawnSync('git', ['clone', '--depth', '1', url, cloneDir], {
        encoding: 'utf8', timeout: 30000,
      });
      if (result.status !== 0) {
        throw new Error(`Failed to clone ${url}: ${(result.stderr || '').trim()}`);
      }
      return { dir: cloneDir, cleanup: true };
    }

    case 'git': {
      const name = sourceInfo.url.split('/').pop().replace('.git', '') || 'repo';
      const cloneDir = path.join(TMP_DIR, name);
      if (fs.existsSync(cloneDir)) {
        spawnSync('rm', ['-rf', cloneDir]);
      }
      const result = spawnSync('git', ['clone', '--depth', '1', sourceInfo.url, cloneDir], {
        encoding: 'utf8', timeout: 30000,
      });
      if (result.status !== 0) {
        throw new Error(`Failed to clone: ${(result.stderr || '').trim()}`);
      }
      return { dir: cloneDir, cleanup: true };
    }

    case 'local-dir':
      return { dir: sourceInfo.path, cleanup: false };

    case 'local-file':
      return { file: sourceInfo.path, cleanup: false };

    case 'url-file':
    case 'url':
      return { url: sourceInfo.url, cleanup: false };

    case 'npm':
      return { package: sourceInfo.package, cleanup: false };

    default:
      throw new Error(`Unknown source type: ${sourceInfo.type}`);
  }
}

// ── Analyze directory structure ──────────────────────────────────────────────

function analyzeDirectory(dir) {
  const result = {
    types: [],
    commands: [],
    hooks: [],
    skills: [],
    agents: [],
    files: { total: 0, key: [] },
    hasSetupScript: false,
    hasPackageJson: false,
    hasClaude: false,
    description: '',
    name: path.basename(dir),
    installMethod: 'git-clone',
    scope: 'local',
  };

  // Recursively list files (max depth 4)
  function listFiles(d, prefix = '', depth = 0) {
    if (depth > 4) return [];
    const entries = [];
    try {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        if (entry.name.startsWith('.') && entry.name !== '.claude' && entry.name !== '.claude-plugin') continue;
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          entries.push(rel + '/');
          entries.push(...listFiles(path.join(d, entry.name), rel, depth + 1));
        } else {
          entries.push(rel);
        }
      }
    } catch {}
    return entries;
  }

  const allFiles = listFiles(dir);
  result.files.total = allFiles.length;

  // Key file detection
  const keyPatterns = [
    /^SKILL\.md$/i,
    /^package\.json$/,
    /^setup(\.sh|\.bash|\.js)?$/,
    /^\.claude-plugin\//,
    /^\.claude\//,
    /^\.mcp\.json$/,
    /^CLAUDE\.md$/i,
    /^README\.md$/i,
    /commands\/.*\.md$/,
    /hooks\/.*\.(js|cjs|mjs)$/,
    /skills\/.*\/SKILL\.md$/i,
    /agents\/.*\.md$/,
  ];

  result.files.key = allFiles.filter(f => keyPatterns.some(p => p.test(f))).slice(0, 30);

  // ── Detect types ───────────────────────────────────────────────────────

  // Skills
  const skillFiles = allFiles.filter(f => /SKILL\.md$/i.test(f));
  if (skillFiles.length > 0) {
    result.types.push('skill');
    for (const sf of skillFiles) {
      try {
        const content = fs.readFileSync(path.join(dir, sf), 'utf8');
        const nameMatch = content.match(/^name:\s*(.+)/m);
        const descMatch = content.match(/^description:\s*(.+)/m);
        result.skills.push({
          file: sf,
          name: nameMatch ? nameMatch[1].trim() : path.dirname(sf),
          description: descMatch ? descMatch[1].trim() : '',
        });
      } catch {
        result.skills.push({ file: sf, name: path.dirname(sf), description: '' });
      }
    }
  }

  // Plugin
  if (allFiles.some(f => f.startsWith('.claude-plugin/'))) {
    result.types.push('plugin');
    try {
      const pluginJson = JSON.parse(fs.readFileSync(path.join(dir, '.claude-plugin/plugin.json'), 'utf8'));
      if (pluginJson.name) result.name = pluginJson.name;
      if (pluginJson.description) result.description = pluginJson.description;
    } catch {}
  }

  // Commands
  const cmdFiles = allFiles.filter(f =>
    (f.match(/^\.claude\/commands\/.*\.md$/) || f.match(/^commands\/.*\.md$/))
    && !f.includes('node_modules')
  );
  if (cmdFiles.length > 0) {
    result.types.push('commands');
    for (const cf of cmdFiles) {
      const name = path.basename(cf, '.md');
      let description = '';
      try {
        const content = fs.readFileSync(path.join(dir, cf), 'utf8');
        const firstLine = content.split('\n').find(l => l.trim() && !l.startsWith('#') && !l.startsWith('---'));
        if (firstLine) description = firstLine.trim().slice(0, 120);
      } catch {}
      result.commands.push({ file: cf, name, description });
    }
  }

  // Hooks
  const hookFiles = allFiles.filter(f =>
    (f.match(/^\.claude\/hooks\/.*\.(js|cjs|mjs)$/) || f.match(/^hooks\/.*\.(js|cjs|mjs)$/))
    && !f.includes('node_modules')
  );
  if (hookFiles.length > 0) {
    result.types.push('hooks');
    for (const hf of hookFiles) {
      let hookType = 'unknown';
      try {
        const content = fs.readFileSync(path.join(dir, hf), 'utf8');
        if (/SessionStart/i.test(content)) hookType = 'SessionStart';
        else if (/PreToolUse/i.test(content)) hookType = 'PreToolUse';
        else if (/PostToolUse/i.test(content)) hookType = 'PostToolUse';
      } catch {}
      result.hooks.push({ file: hf, name: path.basename(hf), hookType });
    }
  }

  // Agents
  const agentFiles = allFiles.filter(f =>
    (f.match(/^\.claude\/agents\/.*\.md$/) || f.match(/^agents\/.*\.md$/))
    && !f.includes('node_modules')
  );
  if (agentFiles.length > 0) {
    result.types.push('agents');
    for (const af of agentFiles) {
      result.agents.push({ file: af, name: path.basename(af, '.md') });
    }
  }

  // MCP
  if (allFiles.some(f => f === '.mcp.json' || f === 'mcp.json' || f.match(/mcp-server/))) {
    result.types.push('mcp');
  }

  // ── Detect meta ────────────────────────────────────────────────────────

  result.hasSetupScript = allFiles.some(f => f.match(/^setup(\.sh|\.bash|\.js)?$/));
  result.hasPackageJson = allFiles.includes('package.json');
  result.hasClaude = allFiles.some(f => f.startsWith('.claude/'));

  if (result.hasPackageJson) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
      if (!result.description && pkg.description) result.description = pkg.description;
      if (pkg.name) result.name = pkg.name;
      if (pkg.bin) {
        result.installMethod = 'npm-global';
        result.types.push('cli');
      } else {
        result.installMethod = 'npm-install';
      }
    } catch {}
  }

  // Determine scope
  if (result.types.includes('plugin') || result.types.includes('mcp')) {
    result.scope = 'global';
  } else if (result.types.includes('skill') && !result.hasClaude) {
    result.scope = 'global';
  }

  // Read README for description if still empty
  if (!result.description) {
    try {
      const readme = fs.readFileSync(path.join(dir, 'README.md'), 'utf8');
      const descLine = readme.split('\n').find(l =>
        l.trim() && !l.startsWith('#') && !l.startsWith('!') && !l.startsWith('[') && l.length > 20
      );
      if (descLine) result.description = descLine.trim().slice(0, 200);
    } catch {}
  }

  return result;
}

// ── Analyze a single file ────────────────────────────────────────────────────

function analyzeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const name = path.basename(filePath, ext);
  const content = fs.readFileSync(filePath, 'utf8');

  const result = {
    types: [],
    name,
    description: '',
    content: content.slice(0, 500),
    fullPath: filePath,
    scope: 'local',
  };

  if (ext === '.md') {
    // Could be a command, skill, or best practices doc
    const hasYamlFrontmatter = content.startsWith('---');
    const isSkill = /^name:/m.test(content) && /^(description|allowed-tools):/m.test(content);
    const isCommand = content.includes('## How to respond') || content.includes('slash command');
    const isBestPractices = content.match(/(best practices|guidelines|conventions|standards|principles)/i);

    if (isSkill) {
      result.types.push('skill');
      const nameMatch = content.match(/^name:\s*(.+)/m);
      const descMatch = content.match(/^description:\s*(.+)/m);
      if (nameMatch) result.name = nameMatch[1].trim();
      if (descMatch) result.description = descMatch[1].trim();
    } else if (isCommand) {
      result.types.push('commands');
      const firstLine = content.split('\n').find(l => l.trim() && !l.startsWith('#') && !l.startsWith('---'));
      if (firstLine) result.description = firstLine.trim().slice(0, 120);
    } else if (isBestPractices) {
      result.types.push('best-practices');
      const titleMatch = content.match(/^#\s+(.+)/m);
      if (titleMatch) result.description = titleMatch[1].trim();
    } else {
      // Generic markdown — treat as best practices / reference doc
      result.types.push('best-practices');
      const titleMatch = content.match(/^#\s+(.+)/m);
      if (titleMatch) result.description = titleMatch[1].trim();
    }
  } else if (['.js', '.cjs', '.mjs'].includes(ext)) {
    result.types.push('hooks');
    let hookType = 'unknown';
    if (/SessionStart/i.test(content)) hookType = 'SessionStart';
    else if (/PreToolUse/i.test(content)) hookType = 'PreToolUse';
    else if (/PostToolUse/i.test(content)) hookType = 'PostToolUse';
    result.hookType = hookType;
  } else if (ext === '.json') {
    try {
      const data = JSON.parse(content);
      if (data.mcpServers) {
        result.types.push('mcp');
      } else if (data.hooks) {
        result.types.push('settings');
      }
    } catch {}
  }

  return result;
}

// ── Analyze a URL resource ───────────────────────────────────────────────────

async function analyzeUrl(url) {
  const content = await fetch(url);
  const result = {
    types: ['best-practices'],
    name: path.basename(new URL(url).pathname, path.extname(new URL(url).pathname)) || 'document',
    description: '',
    url,
    contentPreview: content.slice(0, 1000),
    scope: 'local',
  };

  // Check if it's a markdown file
  if (url.match(/\.md(\?|$)/)) {
    const titleMatch = content.match(/^#\s+(.+)/m);
    if (titleMatch) result.description = titleMatch[1].trim();

    // Detect if it's actually a skill or command definition
    if (/^name:/m.test(content) && /^(description|allowed-tools):/m.test(content)) {
      result.types = ['skill'];
    } else if (content.includes('## How to respond')) {
      result.types = ['commands'];
    }
  }

  return result;
}

// ── Build integration plan ───────────────────────────────────────────────────

function buildPlan(analysis, sourceInfo) {
  const plan = {
    steps: [],
    flowChanges: [],
    claudeMdChanges: [],
    settingsChanges: [],
    installLocations: [],
  };

  const types = analysis.types || [];
  const repoRef = sourceInfo.fullName || sourceInfo.url || sourceInfo.path || sourceInfo.package || 'source';

  // Skills
  if (types.includes('skill')) {
    if (analysis.scope === 'global') {
      const loc = `~/.claude/skills/${analysis.name}/`;
      plan.installLocations.push(loc);
      if (sourceInfo.type === 'github') {
        plan.steps.push(`git clone https://github.com/${sourceInfo.fullName}.git ${loc.replace('~', '$HOME')}`);
      } else if (sourceInfo.type === 'local-dir') {
        plan.steps.push(`cp -r ${sourceInfo.path} ${loc.replace('~', '$HOME')}`);
      }
    } else {
      const loc = `.claude/skills/${analysis.name}/`;
      plan.installLocations.push(loc);
      if (sourceInfo.type === 'github') {
        plan.steps.push(`git clone https://github.com/${sourceInfo.fullName}.git ${loc}`);
      } else if (sourceInfo.type === 'local-dir') {
        plan.steps.push(`cp -r ${sourceInfo.path} ${loc}`);
      }
    }
    if (analysis.hasSetupScript) plan.steps.push('Run setup script');
    plan.claudeMdChanges.push('Add skill to installed tools table');
    for (const skill of (analysis.skills || [])) {
      plan.flowChanges.push(`Route /${skill.name} to appropriate pipeline stage`);
    }
  }

  // Plugin
  if (types.includes('plugin')) {
    const owner = sourceInfo.fullName ? sourceInfo.fullName.split('/')[0] : analysis.name;
    const loc = `~/.claude/plugins/${owner}/${analysis.name}/`;
    plan.installLocations.push(loc);
    if (sourceInfo.type === 'github') {
      plan.steps.push(`git clone https://github.com/${sourceInfo.fullName}.git ${loc.replace('~', '$HOME')}`);
    }
    if (analysis.hasPackageJson) plan.steps.push(`cd ${loc} && npm install`);
    plan.claudeMdChanges.push('Add plugin to installed tools section');
  }

  // Commands
  if (types.includes('commands')) {
    for (const cmd of (analysis.commands || [])) {
      plan.steps.push(`Copy ${cmd.file} to .claude/commands/${cmd.name}.md`);
      plan.flowChanges.push(`Route /${cmd.name} to appropriate pipeline stage`);
      plan.claudeMdChanges.push(`Add /${cmd.name} to Built-in Slash Commands table`);
    }
    plan.installLocations.push('.claude/commands/');
  }

  // Hooks
  if (types.includes('hooks')) {
    for (const hook of (analysis.hooks || [])) {
      plan.steps.push(`Copy ${hook.file} to .claude/hooks/${hook.name}`);
      plan.settingsChanges.push(`Register ${hook.name} in settings.json ${hook.hookType} hooks`);
    }
    plan.installLocations.push('.claude/hooks/');
  }

  // Agents
  if (types.includes('agents')) {
    for (const agent of (analysis.agents || [])) {
      plan.steps.push(`Copy ${agent.file} to .claude/agents/${agent.name}.md`);
      plan.claudeMdChanges.push(`Add ${agent.name} agent to Agent Pipeline section`);
    }
    plan.installLocations.push('.claude/agents/');
  }

  // MCP
  if (types.includes('mcp')) {
    plan.settingsChanges.push('Register MCP server in .mcp.json');
    plan.claudeMdChanges.push('Add MCP server to installed tools section');
  }

  // CLI
  if (types.includes('cli')) {
    if (analysis.installMethod === 'npm-global') {
      plan.steps.push(`npm install -g ${analysis.name}`);
    }
    plan.claudeMdChanges.push('Add CLI tool to installed tools section');
  }

  // Best practices
  if (types.includes('best-practices')) {
    plan.steps.push('Analyze document for applicable guidelines');
    plan.claudeMdChanges.push('Merge relevant best practices into CLAUDE.md sections');
    plan.flowChanges.push('Update flow routing if document introduces new workflow stages');
  }

  return plan;
}

// ── Detect conflicts with existing tools ─────────────────────────────────────

function detectConflicts(analysis) {
  const conflicts = [];

  // Check if skill/plugin already exists
  for (const skill of (analysis.skills || [])) {
    const globalPath = path.join(HOME, '.claude/skills', skill.name);
    const localPath = path.join(PROJECT_DIR, '.claude/skills', skill.name);
    if (fs.existsSync(globalPath)) conflicts.push(`Skill "${skill.name}" already installed at ${globalPath}`);
    if (fs.existsSync(localPath)) conflicts.push(`Skill "${skill.name}" already installed at ${localPath}`);
  }

  // Check if commands already exist
  for (const cmd of (analysis.commands || [])) {
    const cmdPath = path.join(PROJECT_DIR, '.claude/commands', `${cmd.name}.md`);
    if (fs.existsSync(cmdPath)) conflicts.push(`Command /${cmd.name} already exists at ${cmdPath}`);
  }

  // Check if hooks already exist
  for (const hook of (analysis.hooks || [])) {
    const hookPath = path.join(PROJECT_DIR, '.claude/hooks', hook.name);
    if (fs.existsSync(hookPath)) conflicts.push(`Hook ${hook.name} already exists at ${hookPath}`);
  }

  return conflicts;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const source = process.argv[2];

  if (!source || source === '--help' || source === '-h') {
    console.log(`Usage: node integrate.js <source>

Sources:
  https://github.com/owner/repo     GitHub repository
  git@github.com:owner/repo.git     Git URL
  /path/to/local/directory           Local directory
  /path/to/file.md                   Single file (command, skill, or best practices)
  https://example.com/doc.md         URL to a document
  package-name                       npm package

Output: JSON analysis report to stdout`);
    process.exit(0);
  }

  // 1. Detect source type
  const sourceInfo = detectSourceType(source);

  // 2. Prepare source (clone if needed)
  let prepared;
  try {
    prepared = prepareSource(sourceInfo);
  } catch (e) {
    console.error(JSON.stringify({ error: `Failed to prepare source: ${e.message}` }));
    process.exit(1);
  }

  // 3. Analyze
  let analysis;
  try {
    if (prepared.dir) {
      analysis = analyzeDirectory(prepared.dir);
      analysis.sourceDir = prepared.dir;
    } else if (prepared.file) {
      analysis = analyzeFile(prepared.file);
    } else if (prepared.url) {
      analysis = await analyzeUrl(prepared.url);
    } else if (prepared.package) {
      // For npm packages, try to get info from registry
      try {
        const info = await fetch(`https://registry.npmjs.org/${prepared.package}/latest`, {
          accept: 'application/json',
        });
        const pkg = JSON.parse(info);
        analysis = {
          types: pkg.bin ? ['cli'] : ['npm'],
          name: pkg.name,
          description: pkg.description || '',
          scope: 'global',
          installMethod: pkg.bin ? 'npm-global' : 'npm-install',
          version: pkg.version,
          hasPackageJson: true,
        };
      } catch {
        analysis = {
          types: ['unknown'],
          name: prepared.package,
          description: '',
          scope: 'global',
          installMethod: 'npm-global',
        };
      }
    }
  } catch (e) {
    console.error(JSON.stringify({ error: `Analysis failed: ${e.message}` }));
    process.exit(1);
  }

  // 4. Build integration plan
  const plan = buildPlan(analysis, sourceInfo);

  // 5. Detect conflicts
  const conflicts = detectConflicts(analysis);

  // 6. Output report
  const report = {
    source: {
      input: source,
      type: sourceInfo.type,
      ...sourceInfo,
    },
    analysis: {
      name: analysis.name,
      description: analysis.description,
      types: analysis.types,
      scope: analysis.scope || 'local',
      installMethod: analysis.installMethod || 'manual',
      commands: analysis.commands || [],
      hooks: analysis.hooks || [],
      skills: analysis.skills || [],
      agents: analysis.agents || [],
      files: analysis.files || {},
      hasSetupScript: analysis.hasSetupScript || false,
      hasPackageJson: analysis.hasPackageJson || false,
    },
    plan,
    conflicts,
    sourceDir: analysis.sourceDir || null,
  };

  console.log(JSON.stringify(report, null, 2));

  // Cleanup tmp clone if needed
  if (prepared.cleanup && prepared.dir) {
    // Don't cleanup yet — the /integrate command may need to read files
    // It will be cleaned up on next run or by OS
  }
}

main().catch(e => {
  console.error(JSON.stringify({ error: e.message }));
  process.exit(1);
});
