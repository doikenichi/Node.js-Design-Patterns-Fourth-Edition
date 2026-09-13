# Testing Framework Health

Rolling analysis for the repository testing framework.

Raw daily measurements live in `docs/testing-framework-health.csv`. This Markdown file is regenerated from the CSV and keeps only analysis for measurements within the last three calendar months, as defined in `docs/testing-framework-health-spec.md`.

## Current Summary

The repo demonstrates a solid Node.js testing story for educational examples, but it does not yet provide a single unified repo-wide test entry point. The dominant framework evidence is the built-in Node test runner (`node:test`) with mocks, subtests, and coverage examples under `10-testing/`, while the root package config only runs Biome linting through `npm test`.

- Overall score: 73/100 on 2026-09-13
- Validation: `node --test 10-testing/02-first-test-with-runner/calculateBasketTotal.test.js` → passed

## Three-Month Trend

| Date | Overall score | Trend | Notes |
| --- | ---: | --- | --- |
| 2026-09-13 | 73 | baseline | Built-in Node.js test runner, mock support, and coverage commands are demonstrated across `10-testing/`; no repo-level test command exists. |

## Category Observations

- Test organization and isolation (11/15): Examples are grouped cleanly by chapter under `10-testing/` and use `suite()`/`test()` patterns with concurrency and timeouts; however, there is no repo-wide shared test layout or central fixtures.
- Execution ergonomics (8/15): Individual examples document direct `node --test` and Playwright commands, but the root `package.json` defines only linting (`npm test` -> `biome check`), so local execution is fragmented.
- Clear, standard, machine-usable results (10/15): Node's built-in runner emits TAP-style output that is machine-readable; no central reporter or CI export is configured at the repo root.
- Mocking and dependency simulation support (14/15): `node:test` supports `t.mock`, `MockAgent`, and module mocking in examples such as `11-unit-test-mock-http` and `12-unit-test-mock-core-modules`.
- Coverage measurement and thresholds (12/15): Coverage examples use `--experimental-test-coverage` and `c8`, but there is no repo-wide coverage threshold or enforcement.
- Slow-test detection and performance visibility (6/10): Timeout and concurrency guardrails are shown in examples, but there is no repository-wide slow-test threshold or reporting pipeline.
- Advanced testing features (12/15): The examples include subtests, suites, setup/teardown, async tests, concurrency, dependency injection, integration tests, and Playwright e2e tests.

## Top Follow-Up Actions

1. Add a root-level testing strategy and single `npm test` / `npm run test:unit` entry point for the examples that are meant to run in CI.
2. Enforce a coverage target and slow-test threshold in a central workflow or sample runner.
3. Decide whether the repository is a book-sample playground or a real app and align the test harness accordingly.

## Latest Daily Analysis

- Date: 2026-09-13
- Overall score: 73/100
- Validation command: `node --test 10-testing/02-first-test-with-runner/calculateBasketTotal.test.js`
- Validation result: passed
- Evidence:
  - `package.json` root script is `npm test` -> `biome check --no-errors-on-unmatched`, not a test runner.
  - `.github/workflows/node.yml` runs `npm install --frozen-lockfile` and `npm test`, which is lint-only.
  - `10-testing/02-first-test-with-runner/calculateBasketTotal.test.js` uses `node:test`.
  - `10-testing/08-test-coverage/README.md` documents `node --test --experimental-test-coverage` and `c8`.
  - `10-testing/17-e2e-test/README.md` documents Playwright end-to-end testing.

## Assumptions and Limitations

- This assessment treats the repository as a pattern library rather than a single application.
- The score is based on chapter examples and repo configuration rather than a full app test suite.
- No dedicated repo-wide test workflow beyond root linting is present.
- Validation used one representative passing chapter example rather than all example folders.
