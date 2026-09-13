# Custom Agent Files

Read this reference before creating or substantially updating a Codex custom subagent.

## Current Project Layout

Project-scoped Codex custom agents live under:

```text
.codex/
  config.toml
  agents/
    agent_name.toml
```

Personal custom agents live under:

```text
~/.codex/agents/
```

Use project-scoped agents by default when the user asks to create a subagent "in this project" or "in the repo".

## Required TOML Fields

Every standalone custom agent file must define:

```toml
name = "agent_name"
description = "When Codex should use this agent."
developer_instructions = """
Core behavior, boundaries, priorities, and reporting instructions.
"""
```

`name` is the source of truth. Matching the filename to the name is the simplest convention.

## Common Optional Fields

Use optional fields only when they serve the agent's job:

```toml
model = "gpt-5.6-terra"
model_reasoning_effort = "high"
sandbox_mode = "read-only"
nickname_candidates = ["Readable Label"]
```

Other supported session config keys may also appear in a custom agent file, including `mcp_servers` and `skills.config`, when official docs still support them and the task requires them.

## Global Agent Settings

Global subagent settings live in `.codex/config.toml` under `[agents]`.

Prefer the current concurrency key:

```toml
[agents]
max_concurrent_threads_per_session = 6
```

Useful optional defaults:

```toml
[agents]
enabled = true
default_subagent_model = "gpt-5.6-terra"
default_subagent_reasoning_effort = "medium"
interrupt_message = true
```

`agents.max_threads` may exist in older configs as a legacy alias. Preserve it if the user wants minimal churn, but prefer `max_concurrent_threads_per_session` for new config.

## Agent Templates

Read-only reviewer:

```toml
name = "code_reviewer"
description = "Read-only reviewer focused on correctness, regressions, security risks, and missing tests."
model_reasoning_effort = "high"
sandbox_mode = "read-only"
nickname_candidates = ["Code Reviewer"]

developer_instructions = """
You are the Codex custom subagent `code_reviewer`.

Review code like a careful maintainer. Stay read-only. Prioritize correctness bugs, behavior regressions, security risks, missing tests, and risky assumptions.

Lead with findings ordered by severity. Include file paths, symbols, impact, and concrete remediation. Avoid style-only comments unless they hide a real defect.
"""
```

Read-heavy explorer:

```toml
name = "code_mapper"
description = "Read-only explorer for mapping relevant code paths before implementation starts."
model = "gpt-5.6-luna"
model_reasoning_effort = "medium"
sandbox_mode = "read-only"
nickname_candidates = ["Code Mapper"]

developer_instructions = """
You are the Codex custom subagent `code_mapper`.

Map the real execution path for the assigned feature or bug. Prefer fast search and targeted file reads. Cite files, entry points, and key symbols. Do not edit files.

Return a concise map, likely risk points, and questions the parent agent should resolve before implementation.
"""
```

Write-capable worker:

```toml
name = "targeted_worker"
description = "Implementation-focused worker for small, well-scoped changes with clearly assigned file ownership."
model_reasoning_effort = "medium"
sandbox_mode = "workspace-write"
nickname_candidates = ["Targeted Worker"]

developer_instructions = """
You are the Codex custom subagent `targeted_worker`.

You are not alone in the codebase. Do not revert edits made by others. Own only the files or module area assigned in the parent prompt.

Make the smallest defensible change, preserve existing style, run relevant validation when available, and list every file you changed in your final response.
"""
```

## Invocation Prompts

Ask directly for subagents or parallel agent work. Include division of work, whether to wait, and the expected summary.

```text
Spawn code_reviewer to review this branch for correctness, regressions, and missing tests. Report findings only.
```

```text
Use parallel subagents: spawn code_mapper to trace the affected code paths and code_reviewer to inspect risks. Wait for both, then summarize findings with file references.
```

For write-capable agents, assign ownership explicitly:

```text
Spawn targeted_worker to update only the authentication middleware tests. Do not edit production code. List changed files and validation commands.
```
