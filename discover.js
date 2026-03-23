#!/usr/bin/env node
// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║  claude-flow discover                                                       ║
// ║  Scans GitHub weekly trending repos for Claude Code tools, analyzes them,  ║
// ║  and generates a report for user review.                                   ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ── Config ───────────────────────────────────────────────────────────────────

const HOME = os.homedir();
const REPORT_DIR = path.join(HOME, '.claude-flow');
const REPORT_FILE = path.join(REPORT_DIR, 'discoveries.json');
const HISTORY_FILE = path.join(REPORT_DIR, 'discovery-history.json');

const TRENDING_URL = 'https://github.com/trending?since=weekly';

// Keywords that indicate Claude Code relevance (in repo name or description)
const NAME_KEYWORDS = [
  'claude', 'anthropic', 'mcp-server', 'mcp-tool',
];

const DESC_KEYWORDS = [
  'claude code', 'claude-code', 'claude plugin', 'claude skill',
  'claude hook', 'claude command', 'anthropic claude',
  'claude dev', 'claude agent', 'claude mcp',
  'model context protocol', 'slash command',
  '.claude/', 'claude code cli',
];

// Keywords in README that indicate Claude Code integration
const README_KEYWORDS = [
  '.claude/commands', '.claude/skills', '.claude/hooks', '.claude/plugins',
  '.claude-plugin', 'SKILL.md', 'claude code', 'claude-code',
  'slash command', 'SessionStart', 'PreToolUse', 'PostToolUse',
  'npx.*--claude', 'claude code cli', 'anthropic/claude',
  'settings.json.*hooks', 'mcp.*claude',
];

// Tool type detection markers (checked against repo file listing)
const TYPE_MARKERS = {
  skill: {
    files: ['SKILL.md'],
    dirs: ['skills/'],
    weight: 10,
  },
  plugin: {
    files: ['plugin.json', 'marketplace.json'],
    dirs: ['.claude-plugin/'],
    weight: 10,
  },
  commands: {
    dirs: ['.claude/commands/', 'commands/'],
    filePattern: /\.md$/,
    weight: 5,
  },
  hooks: {
    dirs: ['.claude/hooks/', 'hooks/'],
    filePattern: /\.(js|cjs|mjs)$/,
    weight: 5,
  },
  mcp: {
    files: ['.mcp.json', 'mcp.json'],
    weight: 8,
  },
  cli: {
    files: ['package.json'],
    hasBin: true,
    weight: 3,
  },
};

// ── HTTP helpers ─────────────────────────────────────────────────────────────

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, {
      headers: {
        'User-Agent': 'claude-flow-discover/1.0',
        'Accept': options.accept || 'text/html',
        ...options.headers,
      },
      timeout: 15000,
    }, (res) => {
      // Follow redirects
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
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout fetching ${url}`)); });
  });
}

// ── Parse trending page ──────────────────────────────────────────────────────

function parseTrendingPage(html) {
  const repos = [];

  // Split by article tags
  const articles = html.split(/<article\s+class="Box-row">/g).slice(1);

  for (const article of articles) {
    try {
      // Extract repo path from the h2 heading link
      // The h2 contains: <a ... href="/owner/repo" ...class="Link">
      const linkMatch = article.match(/<h2\s+class="h3[^"]*">[\s\S]*?href="\/([^"\/]+\/[^"\/]+)"\s/);
      if (!linkMatch) continue;
      const fullName = linkMatch[1].trim();
      const [owner, name] = fullName.split('/');
      if (!owner || !name) continue;

      // Extract description
      const descMatch = article.match(/<p\s+class="col-9[^"]*"[^>]*>([\s\S]*?)<\/p>/);
      const description = descMatch
        ? descMatch[1].replace(/<[^>]*>/g, '').trim()
        : '';

      // Extract language
      const langMatch = article.match(/itemprop="programmingLanguage">([^<]+)/);
      const language = langMatch ? langMatch[1].trim() : '';

      // Extract stars (total)
      const starsMatch = article.match(/href="\/[^"]*\/stargazers"[^>]*>[\s\S]*?([0-9,]+)\s*<\/a>/);
      const stars = starsMatch ? parseInt(starsMatch[1].replace(/,/g, ''), 10) : 0;

      // Extract weekly stars
      const weeklyMatch = article.match(/([0-9,]+)\s+stars?\s+this\s+week/i);
      const weeklyStars = weeklyMatch ? parseInt(weeklyMatch[1].replace(/,/g, ''), 10) : 0;

      repos.push({
        fullName,
        owner,
        name,
        description,
        language,
        stars,
        weeklyStars,
        url: `https://github.com/${fullName}`,
      });
    } catch (e) {
      // Skip malformed entries
      continue;
    }
  }

  return repos;
}

// ── Check relevance ──────────────────────────────────────────────────────────

function isRelevant(repo) {
  const nameLower = repo.name.toLowerCase();
  const descLower = repo.description.toLowerCase();
  const fullLower = `${nameLower} ${descLower}`;

  // Check name keywords
  for (const kw of NAME_KEYWORDS) {
    if (nameLower.includes(kw)) return { relevant: true, matchedOn: `name contains "${kw}"` };
  }

  // Check description keywords
  for (const kw of DESC_KEYWORDS) {
    if (descLower.includes(kw)) return { relevant: true, matchedOn: `description contains "${kw}"` };
  }

  return { relevant: false };
}

// ── Analyze a repo's README for deeper relevance ─────────────────────────────

async function fetchReadme(repo) {
  const branches = ['main', 'master'];
  for (const branch of branches) {
    try {
      const url = `https://raw.githubusercontent.com/${repo.fullName}/${branch}/README.md`;
      return await fetch(url);
    } catch {
      continue;
    }
  }
  return null;
}

function analyzeReadme(readme) {
  if (!readme) return { relevant: false, keywords: [] };

  const lower = readme.toLowerCase();
  const matched = [];

  for (const kw of README_KEYWORDS) {
    const regex = new RegExp(kw, 'i');
    if (regex.test(readme)) {
      matched.push(kw);
    }
  }

  return {
    relevant: matched.length >= 2,
    keywords: matched,
  };
}

// ── Detect tool type from repo contents ──────────────────────────────────────

async function detectToolType(repo) {
  // Use GitHub API to get repo tree
  try {
    const url = `https://api.github.com/repos/${repo.fullName}/git/trees/HEAD?recursive=1`;
    const raw = await fetch(url, {
      accept: 'application/json',
      headers: { 'Accept': 'application/vnd.github.v3+json' },
    });
    const data = JSON.parse(raw);

    if (!data.tree) return { types: [], installMethod: 'unknown', files: [] };

    const paths = data.tree.map(t => t.path);
    const detectedTypes = [];

    // Check for skill markers
    if (paths.some(p => p === 'SKILL.md' || p.match(/^[^/]+\/SKILL\.md$/))) {
      detectedTypes.push('skill');
    }

    // Check for plugin markers
    if (paths.some(p => p.startsWith('.claude-plugin/'))) {
      detectedTypes.push('plugin');
    }

    // Check for slash commands
    if (paths.some(p => p.match(/^\.claude\/commands\/.*\.md$/) || p.match(/^commands\/.*\.md$/))) {
      detectedTypes.push('commands');
    }

    // Check for hooks
    if (paths.some(p => p.match(/^\.claude\/hooks\//) || p.match(/^hooks\/.*\.(js|cjs|mjs)$/))) {
      detectedTypes.push('hooks');
    }

    // Check for MCP server
    if (paths.some(p => p === '.mcp.json' || p === 'mcp.json' || p.match(/mcp-server/))) {
      detectedTypes.push('mcp');
    }

    // Determine install method
    let installMethod = 'git-clone';
    const hasPackageJson = paths.includes('package.json');
    const hasSetupScript = paths.some(p => p.match(/^setup(\.(sh|bash|js))?$/));
    const hasBinField = hasPackageJson; // Will check more closely if needed

    if (hasPackageJson && paths.some(p => p === 'bin' || p.startsWith('bin/'))) {
      installMethod = 'npm-global';
    } else if (hasSetupScript) {
      installMethod = 'setup-script';
    } else if (hasPackageJson) {
      installMethod = 'npm-install';
    }

    // Determine install scope
    let scope = 'local';
    if (detectedTypes.includes('plugin') || detectedTypes.includes('mcp')) {
      scope = 'global';
    } else if (detectedTypes.includes('skill') && !paths.some(p => p.startsWith('.claude/'))) {
      scope = 'global';
    }

    // Collect key files for analysis
    const keyFiles = paths.filter(p =>
      p === 'SKILL.md' ||
      p === 'package.json' ||
      p === 'setup.sh' ||
      p === 'setup' ||
      p.match(/^\.claude-plugin\//) ||
      p.match(/^\.claude\//) ||
      p.match(/\.mcp\.json$/)
    ).slice(0, 20);

    return {
      types: detectedTypes,
      installMethod,
      scope,
      hasSetupScript,
      hasPackageJson,
      keyFiles,
      totalFiles: paths.length,
    };
  } catch (e) {
    return { types: [], installMethod: 'unknown', files: [], error: e.message };
  }
}

// ── Determine integration plan ───────────────────────────────────────────────

function buildIntegrationPlan(repo, toolInfo) {
  const plan = {
    steps: [],
    installLocation: '',
    flowChanges: [],
    settingsChanges: [],
  };

  const types = toolInfo.types;

  if (types.includes('skill')) {
    if (toolInfo.scope === 'global') {
      plan.installLocation = `~/.claude/skills/${repo.name}/`;
      plan.steps.push(`git clone https://github.com/${repo.fullName}.git ~/.claude/skills/${repo.name}`);
    } else {
      plan.installLocation = `.claude/skills/${repo.name}/`;
      plan.steps.push(`git clone https://github.com/${repo.fullName}.git .claude/skills/${repo.name}`);
    }
    if (toolInfo.hasSetupScript) {
      plan.steps.push(`cd ${plan.installLocation} && ./setup`);
    }
    plan.flowChanges.push('Add skill commands to /flow routing table');
    plan.flowChanges.push('Add skill to CLAUDE.md tool listing');
  }

  if (types.includes('plugin')) {
    plan.installLocation = `~/.claude/plugins/${repo.owner}/${repo.name}/`;
    plan.steps.push(`mkdir -p ~/.claude/plugins/${repo.owner}`);
    plan.steps.push(`git clone https://github.com/${repo.fullName}.git ~/.claude/plugins/${repo.owner}/${repo.name}`);
    if (toolInfo.hasPackageJson) {
      plan.steps.push(`cd ~/.claude/plugins/${repo.owner}/${repo.name} && npm install`);
    }
    plan.flowChanges.push('Add plugin to CLAUDE.md tool listing');
  }

  if (types.includes('commands')) {
    plan.installLocation = `.claude/commands/${repo.name}/`;
    plan.steps.push(`git clone --depth 1 https://github.com/${repo.fullName}.git /tmp/${repo.name}`);
    plan.steps.push(`cp -r /tmp/${repo.name}/.claude/commands/* .claude/commands/ 2>/dev/null || cp -r /tmp/${repo.name}/commands/*.md .claude/commands/ 2>/dev/null`);
    plan.steps.push(`rm -rf /tmp/${repo.name}`);
    plan.flowChanges.push('Add new slash commands to /flow routing table');
    plan.flowChanges.push('Add commands to CLAUDE.md listing');
  }

  if (types.includes('hooks')) {
    plan.steps.push(`git clone --depth 1 https://github.com/${repo.fullName}.git /tmp/${repo.name}`);
    plan.steps.push(`cp -r /tmp/${repo.name}/.claude/hooks/* .claude/hooks/ 2>/dev/null || cp -r /tmp/${repo.name}/hooks/* .claude/hooks/ 2>/dev/null`);
    plan.steps.push(`rm -rf /tmp/${repo.name}`);
    plan.settingsChanges.push('Register new hooks in settings.json');
  }

  if (types.includes('mcp')) {
    plan.installLocation = `~/.claude/plugins/${repo.owner}/${repo.name}/`;
    plan.steps.push(`git clone https://github.com/${repo.fullName}.git ~/.claude/plugins/${repo.owner}/${repo.name}`);
    if (toolInfo.hasPackageJson) {
      plan.steps.push(`cd ~/.claude/plugins/${repo.owner}/${repo.name} && npm install`);
    }
    plan.settingsChanges.push('Register MCP server in .mcp.json');
    plan.flowChanges.push('Add MCP tool to CLAUDE.md listing');
  }

  if (types.length === 0 && toolInfo.installMethod === 'npm-global') {
    plan.steps.push(`npm install -g ${repo.name}`);
    plan.flowChanges.push('Add CLI tool to CLAUDE.md listing');
  }

  return plan;
}

// ── Load history (already-seen repos) ────────────────────────────────────────

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    }
  } catch {}
  return { seen: {}, installed: {} };
}

function saveHistory(history) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2) + '\n');
}

// ── Main discovery flow ──────────────────────────────────────────────────────

async function discover() {
  const isCron = process.argv.includes('--cron');
  const isQuiet = process.argv.includes('--quiet');

  if (!isQuiet) console.log('[Discover] Fetching GitHub weekly trending repos...');

  // 1. Fetch trending page
  let html;
  try {
    html = await fetch(TRENDING_URL);
  } catch (e) {
    console.error(`[Discover] Failed to fetch trending page: ${e.message}`);
    process.exit(1);
  }

  // 2. Parse repos
  const allRepos = parseTrendingPage(html);
  if (!isQuiet) console.log(`[Discover] Found ${allRepos.length} trending repos`);

  // 3. Filter for relevance (name/description match)
  const candidates = [];
  for (const repo of allRepos) {
    const { relevant, matchedOn } = isRelevant(repo);
    if (relevant) {
      candidates.push({ ...repo, matchedOn });
    }
  }

  if (!isQuiet) console.log(`[Discover] ${candidates.length} repos matched initial keyword filter`);

  // 4. Deep analysis: fetch README and repo structure for candidates
  const history = loadHistory();
  const discoveries = [];

  for (const repo of candidates) {
    // Skip already-installed repos
    if (history.installed[repo.fullName]) {
      if (!isQuiet) console.log(`[Discover] Skipping ${repo.fullName} (already installed)`);
      continue;
    }

    try {
      if (!isQuiet) console.log(`[Discover] Analyzing ${repo.fullName}...`);

      // Fetch and analyze README
      const readme = await fetchReadme(repo);
      const readmeAnalysis = analyzeReadme(readme);

      // Detect tool type from repo structure
      const toolInfo = await detectToolType(repo);

      // Determine overall relevance score
      let score = 0;
      if (repo.matchedOn) score += 3;
      if (readmeAnalysis.relevant) score += 3;
      if (toolInfo.types.length > 0) score += 5;
      if (repo.stars > 100) score += 1;
      if (repo.stars > 1000) score += 1;
      if (repo.weeklyStars > 50) score += 1;

      // Must have at least keyword match + one deeper signal
      if (score < 4) continue;

      // Build integration plan
      const plan = buildIntegrationPlan(repo, toolInfo);

      // Extract install command hint from README
      let installHint = '';
      if (readme) {
        const npmMatch = readme.match(/npm\s+install\s+(?:-g\s+)?(\S+)/);
        const npxMatch = readme.match(/npx\s+(\S+)/);
        const bunMatch = readme.match(/bun\s+(?:add|install)\s+(?:-g\s+)?(\S+)/);
        if (npxMatch) installHint = `npx ${npxMatch[1]}`;
        else if (npmMatch) installHint = `npm install ${npmMatch[0].includes('-g') ? '-g ' : ''}${npmMatch[1]}`;
        else if (bunMatch) installHint = `bun add ${bunMatch[0].includes('-g') ? '-g ' : ''}${bunMatch[1]}`;
      }

      discoveries.push({
        repo: {
          fullName: repo.fullName,
          owner: repo.owner,
          name: repo.name,
          description: repo.description,
          language: repo.language,
          stars: repo.stars,
          weeklyStars: repo.weeklyStars,
          url: repo.url,
        },
        matchedOn: repo.matchedOn,
        readmeKeywords: readmeAnalysis.keywords,
        toolInfo: {
          types: toolInfo.types,
          installMethod: toolInfo.installMethod,
          scope: toolInfo.scope || 'local',
          hasSetupScript: toolInfo.hasSetupScript || false,
          hasPackageJson: toolInfo.hasPackageJson || false,
          keyFiles: toolInfo.keyFiles || [],
        },
        installHint,
        plan,
        score,
      });

      // Mark as seen
      history.seen[repo.fullName] = new Date().toISOString();
    } catch (e) {
      if (!isQuiet) console.log(`[Discover] Error analyzing ${repo.fullName}: ${e.message}`);
      continue;
    }
  }

  // 5. Also scan trending repos that didn't match keywords but have Claude Code structure
  // (some repos might not mention "claude" in name/description but have .claude/ dirs)
  const uncheckedRepos = allRepos.filter(r =>
    !candidates.find(c => c.fullName === r.fullName) &&
    !history.installed[r.fullName]
  );

  // Sample up to 10 unchecked repos for structural analysis (avoid rate limits)
  const structuralSample = uncheckedRepos.slice(0, 10);
  for (const repo of structuralSample) {
    try {
      const toolInfo = await detectToolType(repo);
      if (toolInfo.types.length > 0) {
        if (!isQuiet) console.log(`[Discover] Found Claude Code structure in ${repo.fullName} (no keyword match)`);

        const readme = await fetchReadme(repo);
        const plan = buildIntegrationPlan(repo, toolInfo);

        discoveries.push({
          repo: {
            fullName: repo.fullName,
            owner: repo.owner,
            name: repo.name,
            description: repo.description,
            language: repo.language,
            stars: repo.stars,
            weeklyStars: repo.weeklyStars,
            url: repo.url,
          },
          matchedOn: 'repo structure (has Claude Code files)',
          readmeKeywords: [],
          toolInfo: {
            types: toolInfo.types,
            installMethod: toolInfo.installMethod,
            scope: toolInfo.scope || 'local',
            hasSetupScript: toolInfo.hasSetupScript || false,
            hasPackageJson: toolInfo.hasPackageJson || false,
            keyFiles: toolInfo.keyFiles || [],
          },
          installHint: '',
          plan,
          score: 5,
        });

        history.seen[repo.fullName] = new Date().toISOString();
      }
    } catch {
      continue;
    }
  }

  // 6. Sort by score (highest first)
  discoveries.sort((a, b) => b.score - a.score);

  // 7. Save report
  const report = {
    timestamp: new Date().toISOString(),
    trendingCount: allRepos.length,
    candidateCount: candidates.length,
    discoveryCount: discoveries.length,
    discoveries,
  };

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2) + '\n');
  saveHistory(history);

  // 8. Output summary
  if (discoveries.length === 0) {
    console.log('[Discover] No new Claude Code tools found in this week\'s trending repos.');
  } else {
    console.log(`[Discover] Found ${discoveries.length} relevant tool(s):`);
    for (const d of discoveries) {
      const types = d.toolInfo.types.length > 0 ? d.toolInfo.types.join(', ') : 'general';
      const stars = d.repo.stars > 0 ? ` (${d.repo.stars.toLocaleString()} stars)` : '';
      console.log(`  ${d.repo.fullName}${stars} — ${types} — ${d.repo.description.slice(0, 80)}`);
    }
    console.log(`\nReport saved to ${REPORT_FILE}`);
    if (isCron) {
      console.log('Run /discover in Claude Code to review and integrate.');
    }
  }
}

// ── Entry point ──────────────────────────────────────────────────────────────

discover().catch(e => {
  console.error(`[Discover] Fatal error: ${e.message}`);
  process.exit(1);
});
