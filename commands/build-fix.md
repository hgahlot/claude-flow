# /build-fix — Systematic Root Cause Debugging

Apply systematic root cause analysis to fix build failures, test failures, and runtime errors.

## Instructions

### Step 1: Reproduce
1. Run the failing command exactly as-is
2. Capture the full error output (not just the last line)
3. Confirm the failure is reproducible

### Step 2: Isolate
1. Identify the error type: compile error | test failure | runtime error | config error
2. Find the first error in the stack (not the cascading consequences)
3. Identify the exact file and line number where the failure originates

### Step 3: Hypothesize
Generate 2–3 specific hypotheses for the root cause:
- What changed recently? (`git diff HEAD~1` or `git log --oneline -5`)
- What does the error message literally say?
- What are the dependencies of the failing component?

### Step 4: Test Hypothesis (Smallest Change)
1. Pick the most likely hypothesis
2. Make the SMALLEST possible change to test it
3. Re-run — did it change the error? (Better, worse, or same)
4. If no improvement, revert and try next hypothesis

### Step 5: Fix
1. Apply the confirmed fix
2. Run the full test suite (not just the failing test)
3. Confirm no regressions introduced

## Output Format

```
## Reproduce
Command: <exact command>
Output: <full error — first occurrence>
Status: ✓ Reproducible

## Isolate
Error type: <compile|test|runtime|config>
Root file: <file>:<line>
First error: <exact error message>

## Hypotheses
1. <hypothesis> — likelihood: high/medium/low
2. <hypothesis> — likelihood: high/medium/low
3. <hypothesis> — likelihood: high/medium/low

## Testing Hypothesis 1
Change: <minimal change made>
Result: <new error or resolution>

## Fix Applied
<description of fix>
Full test run: <pass/fail count>
Regressions: none / <list>

## Root Cause
<one sentence explaining what caused the failure and why the fix resolves it>
```

## Rules
- NEVER guess-and-check with multiple changes at once — isolate one variable at a time
- NEVER skip the full test suite after fixing — look for regressions
- If 3 hypotheses fail, escalate: read the dependency source, check changelogs, search error message
- "I don't know" is a valid intermediate state — document what you've ruled out
