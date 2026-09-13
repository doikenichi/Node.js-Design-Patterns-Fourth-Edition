# GitHub Free-Compatible Health Automation

## Summary

Revise the solution to avoid `OPENAI_API_KEY` entirely. Use GitHub Actions plus GitHub Copilot CLI/Agentic Workflow style automation, with the testing health logic stored in provider-neutral docs.

This will not literally spawn the Codex subagent in GitHub Actions. Instead:
- Codex local subagent reads the shared spec locally.
- GitHub automation reads the same shared spec and updates the same CSV/Markdown reports.

## Key Changes

Use these report files:
- `docs/testing-framework-health-spec.md`: provider-neutral instructions and scoring rubric.
- `docs/testing-framework-health.csv`: raw daily score rows.
- `docs/testing-framework-health.md`: rolling analysis for the last 3 months only.

Use GitHub Actions with Copilot, not Codex:
- Daily `schedule`.
- Manual `workflow_dispatch`.
- Install Copilot CLI.
- Authenticate Copilot with `GITHUB_TOKEN` where supported for personally owned repositories, or fall back to `COPILOT_GITHUB_TOKEN` if GitHub requires it.
- Run Copilot with a prompt that reads `docs/testing-framework-health-spec.md`.
- Fail if files outside the CSV/MD reports change.

Delivery:
- Recommended for no extra secrets: create or update a PR branch using `GITHUB_TOKEN`, with the repository-level Allow GitHub Actions to create and approve pull requests setting enabled.
- If that setting is disabled or unavailable, use `HEALTH_PR_TOKEN` for checkout, push, and `gh pr` operations while still avoiding `OPENAI_API_KEY`.
- If branch protection does not require approval, enable auto-merge or merge with `GITHUB_TOKEN`.
- If branch protection requires approval, automatic approval needs a second identity, preferably a GitHub App. That requires storing app private keys as repository secrets.

## Step-By-Step GitHub App Document

Create `docs/github-actions-testing-health-automation.md` with two paths:

Path A, no OpenAI key and minimal secrets:
1. Enable GitHub Actions in the repository.
2. Confirm Copilot Free is enabled for your account.
3. Add the workflow using Copilot CLI.
4. Let the workflow create/update a PR.
5. Merge manually, or auto-merge only if no required approval blocks it.

Path B, full auto-approve and auto-merge:
1. Go to GitHub profile picture > Settings > Developer settings > GitHub Apps.
2. Create `testing-health-writer`.
3. Disable webhooks.
4. Grant `Contents: Read and write`, `Pull requests: Read and write`.
5. Install only on this repository.
6. Generate a private key.
7. Add repository variable `HEALTH_WRITER_APP_CLIENT_ID`.
8. Add repository secret `HEALTH_WRITER_PRIVATE_KEY`.
9. Repeat for `testing-health-reviewer` with `Contents: Read-only`, `Pull requests: Read and write`.
10. Add `HEALTH_REVIEWER_APP_CLIENT_ID` and `HEALTH_REVIEWER_PRIVATE_KEY`.
11. Enable repository auto-merge.
12. Run the workflow manually once.

## Test Plan

- Trigger workflow manually.
- Confirm it updates only:
  - `docs/testing-framework-health.csv`
  - `docs/testing-framework-health.md`
- Confirm Markdown removes analysis older than 3 months.
- Confirm CSV keeps older raw history.
- Confirm PR creation works on GitHub Free.
- Confirm auto-merge behavior:
  - Works without approval if branch rules allow it.
  - Requires GitHub App/PAT identity if approval is mandatory.

## Assumptions

- You want zero OpenAI API dependency.
- GitHub App private keys are acceptable if full auto-approval is still required.
- If you mean “no secrets of any kind,” then full auto-approval is not realistic; the best free-tier solution is PR creation plus manual merge.
- Sources: OpenAI `codex-action` requires a provider API key; GitHub Docs say Copilot CLI is available with all Copilot plans and can run in Actions; GitHub Free includes Actions minutes; GitHub App registration is available under personal accounts.
