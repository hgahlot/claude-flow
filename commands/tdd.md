# /tdd — Red-Green-Refactor Cycle Enforcement

Enforce strict TDD discipline for the current implementation task.

## Instructions

Execute the full RED-GREEN-REFACTOR cycle:

### Phase 1: RED (Write Failing Test)
1. Identify the behavior to implement (from plan or description)
2. Write the test FIRST — do not write any implementation code yet
3. Run the test — confirm it FAILS with a meaningful error (not a syntax error)
4. Show the failing test output as evidence

### Phase 2: GREEN (Minimum Implementation)
1. Write the MINIMUM code required to make the test pass
2. Do not over-engineer — just make it green
3. Run the test — confirm it PASSES
4. Show the passing test output as evidence

### Phase 3: REFACTOR (Clean Up)
1. Improve code quality without changing behavior
2. Remove duplication, improve naming, simplify logic
3. Run the test again — confirm it STILL PASSES after refactoring
4. Show the passing test output as evidence

## Output Format

```
## RED Phase
[test code]
Running: <test command>
Result: FAIL — <error message>
✓ Test fails as expected

## GREEN Phase
[implementation code]
Running: <test command>
Result: PASS
✓ Test passes

## REFACTOR Phase
[refactored code — describe changes made]
Running: <test command>
Result: PASS
✓ Tests still pass after refactor
```

## Rules
- NEVER write implementation code before a failing test exists
- NEVER skip the REFACTOR phase
- NEVER claim GREEN without running the test and showing output
- If a test passes immediately without any implementation, the test is wrong — fix it
