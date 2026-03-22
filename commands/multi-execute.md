# /multi-execute — Spawn Parallel Subagents for Independent Tasks

Coordinate parallel execution of independent tasks using subagents.

## Instructions

1. **Identify parallelizable tasks** — tasks with no shared state or file dependencies
2. **Scope each agent clearly** — one focused goal per agent, explicit file boundaries
3. **Define integration point** — what the orchestrator collects and how results merge
4. **Spawn agents** — use the Agent tool with isolated prompts
5. **Collect and integrate** — wait for all agents, then merge results

## When to Use
- Multiple independent features that don't share files
- Parallel research (e.g., "research option A" + "research option B")
- Parallel test writing for independent modules
- Large refactors across independent subsystems
- Parallel security/performance analysis of different components

## Prompt Template for Each Subagent

```
You are a focused subagent with ONE specific task.

Task: <exact task description>
Scope: Only work on these files: <file list>
Do NOT modify: <files to leave alone>

Success criteria:
- <specific verifiable outcome>
- Tests pass for your scope

When done, output a summary:
COMPLETED: <what was done>
FILES CHANGED: <list>
TESTS: <pass/fail count>
```

## Orchestrator Checklist

Before spawning:
- [ ] Confirm tasks are truly independent (no shared file writes)
- [ ] Each agent has a clear, bounded scope
- [ ] Integration plan is defined before agents start

After collecting results:
- [ ] All agents reported COMPLETED
- [ ] No file conflicts in FILES CHANGED lists
- [ ] Run integrated test suite across all changes
- [ ] Run `/review` on the combined diff

## Rules
- Never give two agents write access to the same file
- Orchestrator context must stay minimal — delegate all heavy work
- If any agent fails, do not proceed with integration — debug first
- Always run the full test suite after integration, not just per-agent tests
