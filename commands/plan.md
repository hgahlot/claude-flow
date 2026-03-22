# /plan — Spec-Driven Task Planning

Generate a structured task plan for the current work item using XML format optimized for Claude comprehension.

## Instructions

1. **Clarify the goal** — restate what needs to be built/fixed/changed in one sentence
2. **Identify constraints** — review REQUIREMENTS.md for relevant constraints
3. **Break into tasks** — 2–5 minute atomic tasks, each with explicit file paths
4. **Sequence by dependency** — mark which tasks can run in parallel (wave-based)
5. **Add verification steps** — each task ends with a verifiable check

## Output Format

```xml
<plan>
  <goal>One-sentence description of what this plan achieves</goal>

  <context>
    <files>List of files that will be created or modified</files>
    <requirements>Relevant requirements from REQUIREMENTS.md</requirements>
    <constraints>Key constraints to respect</constraints>
  </context>

  <wave id="1" description="Foundation — must complete before wave 2">
    <task id="1.1">
      <description>What to do</description>
      <file>path/to/file.ext</file>
      <action>create|edit|delete</action>
      <verify>How to confirm this task is done correctly</verify>
    </task>
  </wave>

  <wave id="2" description="Implementation — depends on wave 1">
    <task id="2.1">
      <description>What to do</description>
      <file>path/to/file.ext</file>
      <action>create|edit|delete</action>
      <verify>Run: <command> — expected output: <output></verify>
    </task>
  </wave>

  <wave id="3" description="Verification">
    <task id="3.1">
      <description>Run full test suite</description>
      <verify>All tests pass. Zero failures.</verify>
    </task>
  </wave>
</plan>
```

## Rules
- Each task must reference a specific file path
- Verification steps must be runnable (commands with expected output)
- No task should take more than 5 minutes
- Wave 1 tasks must be completable without any other task in the plan
- After outputting the plan, ask: "Shall I proceed with Wave 1?"
