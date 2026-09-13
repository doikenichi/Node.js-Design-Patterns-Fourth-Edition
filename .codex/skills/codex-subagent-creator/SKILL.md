---
name: codex-subagent-creator
description: Create, update, review, and install project-scoped Codex custom subagents under .codex/agents, while verifying current official Codex subagent documentation before changing agent files.
metadata:
  short-description: Create project Codex subagents
---

# Codex Subagent Creator

Use this skill when the user asks to create, install, update, review, or document a Codex custom subagent for the current project.

The normal output is a project-scoped custom agent TOML file under `.codex/agents/`, plus any needed `[agents]` settings in `.codex/config.toml`. Personal agents under `~/.codex/agents/` are only in scope when the user explicitly asks for a global/personal install.

## First Action

Before changing subagent files, verify current guidance from official OpenAI documentation. Search for the latest Codex subagent/custom-agent docs and config reference, then open the relevant official pages. Prefer:

- `https://learn.chatgpt.com/docs/agent-configuration/subagents`
- `https://learn.chatgpt.com/docs/config-file/config-reference`
- `https://developers.openai.com/codex/agent-configuration/subagents` if it redirects to the current docs

If the user gives a third-party reference, fetch it too, but treat official OpenAI documentation as authoritative when the sources disagree. If browsing is unavailable, say that the docs could not be verified and make only conservative changes based on the repository's existing conventions.

## Self-Update Rule

This skill intentionally depends on documentation that can change. After verifying official docs, compare the current guidance with this skill and [references/custom-agent-files.md](references/custom-agent-files.md). If field names, required keys, install paths, model names, or invocation behavior have changed, update this skill first, then continue with the user's requested subagent work.

Keep self-updates narrow: revise only the stale guidance, preserve the user's requested subagent, and cite the official page that justified the change in the final response.

## Workflow

1. Clarify or infer the subagent's job, write permissions, expected outputs, and whether it should be project-scoped or personal.
2. Inspect existing `.codex/config.toml`, `.codex/agents/`, `AGENTS.md`, and relevant repo skills so the new agent fits local conventions.
3. Read [references/custom-agent-files.md](references/custom-agent-files.md) before creating or substantially updating agent TOML.
4. Create `.codex/agents/` when missing.
5. Add or update one standalone TOML file per custom agent. Match the filename to the `name` field when practical.
6. Add or update `.codex/config.toml` only when needed for global agent settings such as concurrency or default subagent model/reasoning.
7. Keep custom agents narrow and opinionated. Prefer read-only agents for exploration, review, audit, research, and triage. Use `workspace-write` only for agents intended to edit files.
8. Avoid multiple write-capable agents owning overlapping files. If a workflow needs parallel implementation, assign disjoint write scopes in the invocation prompt or agent instructions.
9. Validate TOML syntax and inspect the final files for stale placeholders, broad permissions, and unclear descriptions.
10. Show the user the invocation prompt, for example: `Spawn code_reviewer to review this branch for correctness, regressions, and missing tests. Report findings only.`

## Design Criteria

- `name` should be stable, lowercase, and easy to type, usually `snake_case`.
- `description` should say when to use the agent, not merely what role it plays.
- `developer_instructions` should define the role, boundaries, priorities, reporting format, and whether the agent may edit files.
- Omit `model` and `model_reasoning_effort` when inheritance from the parent session is better. Set them only when the user's goal benefits from a different speed/depth/cost tradeoff.
- Use `sandbox_mode = "read-only"` for review, security, research, mapping, and documentation-only agents.
- Use `sandbox_mode = "workspace-write"` only when the agent is supposed to implement changes.

## Verification

- Official docs were checked during the turn, or the inability to check them was disclosed.
- `.codex/agents/<agent-name>.toml` parses as TOML.
- Required fields are present: `name`, `description`, and `developer_instructions`.
- Optional fields match the current official docs.
- `.codex/config.toml`, if changed, parses as TOML.
- The agent's write permissions fit its responsibility.
- The final response includes changed file paths and at least one concrete spawn prompt.
