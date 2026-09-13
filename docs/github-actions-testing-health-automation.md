# GitHub Actions Testing Health Automation

This guide explains how to run the daily testing framework health update on GitHub Free without an OpenAI API key.

The automation uses:

- GitHub Actions for the daily schedule.
- GitHub Copilot CLI for the health assessment.
- `GITHUB_TOKEN` for Copilot requests where your account and repository support it.
- A pull request for reviewable updates to `docs/testing-framework-health.csv` and `docs/testing-framework-health.md`.

The workflow does not literally spawn the local Codex subagent in GitHub Actions. The local Codex subagent and the GitHub automation both read `docs/testing-framework-health-spec.md`, so they use the same scoring rules.

## Path A: No OpenAI Key and Minimal Secrets

Use this path first.

1. Open the repository on GitHub.
2. Go to Settings > Actions > General.
3. Confirm Actions are enabled.
4. In Workflow permissions, choose Read and write permissions.
5. If available, enable Allow GitHub Actions to create and approve pull requests.
6. Go to your GitHub profile settings and confirm GitHub Copilot Free is enabled for your account.
7. Commit and push these files to `main`:
   - `.github/workflows/testing-framework-health.yml`
   - `.github/copilot/prompts/testing-framework-health.md`
   - `.codex/agents/testing_framework_health.toml`
   - `docs/testing-framework-health-spec.md`
   - `docs/testing-framework-health.csv`
   - `docs/testing-framework-health.md`
8. Open the repository Actions tab.
9. Select the Testing Framework Health workflow.
10. Click Run workflow.
11. Review the pull request created by the workflow.
12. Merge it manually if auto-merge is blocked by repository settings.

Notes:

- GitHub schedules use UTC. The workflow is set to `30 14 * * *`, which is 07:30 in Edmonton during standard time and 08:30 during daylight time.
- Public repositories can use standard GitHub-hosted runners without Actions-minute billing.
- Private repositories on GitHub Free have a monthly included Actions-minute quota.
- Copilot usage may consume your Copilot allowance.
- The workflow requires `copilot-requests: write` permission for `GITHUB_TOKEN`.
- If `GITHUB_TOKEN` authentication for Copilot CLI fails, create a fine-grained personal access token with Copilot Requests permission and store it as `COPILOT_GITHUB_TOKEN`, then update the workflow to use that secret for the Copilot step.

## Path B: Full Auto-Approval and Auto-Merge

Use this path only if you require fully automated approval and merging. It needs GitHub App private keys stored as repository secrets.

### Create the Writer App

1. On GitHub, click your profile picture.
2. Click Settings.
3. Click Developer settings.
4. Click GitHub Apps.
5. Click New GitHub App.
6. Set GitHub App name to `testing-health-writer`.
7. Set Homepage URL to your repository URL or your GitHub profile URL.
8. Leave Callback URL empty.
9. Disable Request user authorization during installation.
10. Disable webhooks by clearing Active.
11. Under Repository permissions, set:
    - Contents: Read and write.
    - Pull requests: Read and write.
12. Under Where can this GitHub App be installed?, choose Only on this account.
13. Click Create GitHub App.
14. On the app settings page, copy the Client ID.
   Client ID: Iv23liTzMuneQVVScqgf
15. Scroll to Private keys and click Generate a private key.
16. Save the downloaded `.pem` file securely.
17. Click Install App.
18. Install the app only on this repository.

### Create the Reviewer App

1. Repeat the same flow with GitHub App name `testing-health-reviewer`.
2. Disable webhooks.
3. Under Repository permissions, set:
   - Contents: Read-only.
   - Pull requests: Read and write.
4. Install the app only on this repository.
5. Copy the Client ID and generate a private key.
Client ID: Iv23liQygrm4VhJ9cItT


### Add Variables and Secrets

1. Open the repository on GitHub.
2. Go to Settings > Secrets and variables > Actions.
3. Open the Variables tab.
4. Add `HEALTH_WRITER_APP_CLIENT_ID` with the writer app Client ID.
5. Add `HEALTH_REVIEWER_APP_CLIENT_ID` with the reviewer app Client ID.
6. Open the Secrets tab.
7. Add `HEALTH_WRITER_PRIVATE_KEY` with the full contents of the writer `.pem` private key.
8. Add `HEALTH_REVIEWER_PRIVATE_KEY` with the full contents of the reviewer `.pem` private key.

### Enable Auto-Merge

1. Open the repository on GitHub.
2. Go to Settings > General.
3. Find Pull Requests.
4. Enable Allow auto-merge.
5. Save the setting.

The current workflow uses the minimal-secrets Path A. To use Path B, update the PR job to create GitHub App installation tokens with `actions/create-github-app-token`, use the writer token to push/create the PR, and use the reviewer token to approve and enable auto-merge.

## Troubleshooting

- If the workflow fails at the Copilot step, confirm Copilot Free is enabled and the workflow has `copilot-requests: write`.
- If the workflow creates a PR but does not auto-merge, enable repository auto-merge or merge the PR manually.
- If branch protection requires an approving review, use Path B with separate writer and reviewer GitHub Apps.
- If unexpected files are changed, the workflow fails intentionally. The health run may only modify the CSV and Markdown report files.
