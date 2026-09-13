# Testing Framework Health Specification

This is the provider-neutral source of truth for measuring, recording, and analyzing the repository's testing framework health. Codex subagents, GitHub Copilot CLI, GitHub Agentic Workflows, or any other automation must follow this file instead of duplicating scoring rules elsewhere.

## Files

- `docs/testing-framework-health.csv` is the raw data ledger. Keep historical rows unless a human explicitly requests deletion.
- `docs/testing-framework-health.md` is the rolling human analysis. Regenerate it from CSV data and keep only measurements from the last three calendar months.

## Daily Measurement Rules

- Measure once per local date.
- If the CSV already has a row for the run date, update that row instead of adding a duplicate.
- Use the local run date in `YYYY-MM-DD` format.
- Use repository evidence before scoring. Inspect package scripts, test files, testing framework configuration, CI workflows, coverage configuration, examples under `10-testing/`, and documentation that describes testing expectations.
- Run only safe validation commands that are available in the checked-out repository. Record unavailable dependencies, network limits, or skipped commands instead of fabricating results.
- Do not modify source code, test code, package manifests, CI workflows, or this specification during a health run.

## CSV Schema

The CSV header must be exactly:

```csv
date,overall_score,test_organization,execution_ergonomics,standard_results,mocking_support,coverage,slow_test_visibility,advanced_features,trend,validation_command,validation_result,top_follow_up,notes
```

Field rules:

- `date`: local measurement date, `YYYY-MM-DD`.
- `overall_score`: integer from `0` to `100`.
- Category score fields: integer score for the category.
- `trend`: `baseline`, `+N since YYYY-MM-DD`, `-N since YYYY-MM-DD`, or `unchanged since YYYY-MM-DD`.
- `validation_command`: command run, or `not run`.
- `validation_result`: concise result such as `passed`, `failed`, or `skipped: reason`.
- `top_follow_up`: highest-impact next action.
- `notes`: short evidence summary. Escape CSV fields correctly when they contain commas, quotes, or newlines.

## Scoring Rubric

Total score: 100 points.

| Category | Points | What Good Looks Like |
| --- | ---: | --- |
| Test organization and isolation | 15 | Related tests are grouped predictably, generally near the code they verify or in a clear test tree, and tests avoid shared mutable state. |
| Execution ergonomics | 15 | Developers can run all tests, targeted tests, and watch mode with standard commands. |
| Clear, standard, machine-usable results | 15 | Results are readable locally and can be exported or consumed by reporting systems. |
| Mocking and dependency simulation support | 15 | Tests can replace databases, APIs, core modules, third-party modules, and other side effects cleanly. |
| Coverage measurement and thresholds | 15 | Coverage can be collected repeatably, reviewed by file or branch, and guarded by meaningful thresholds. |
| Slow-test detection and performance visibility | 10 | Slow tests can be identified through runner output, timing reports, or configured thresholds. |
| Advanced testing features | 15 | The framework supports useful extras such as snapshots, setup/teardown hooks, parameterized tests, fixtures, watch mode, and reusable test data. |

## Markdown Analysis Rules

`docs/testing-framework-health.md` must be regenerated as a rolling analysis view using only CSV rows whose `date` is within the last three calendar months from the run date. Analysis older than the cutoff date must be removed from the Markdown file.

Keep these sections:

- Current summary.
- Three-month trend table.
- Category observations.
- Top follow-up actions.
- Latest daily analysis.
- Assumptions and limitations.

Do not remove older rows from the CSV when removing old Markdown analysis.
