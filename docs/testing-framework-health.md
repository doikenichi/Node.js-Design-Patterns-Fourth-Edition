# Testing Framework Health

Rolling analysis for the repository testing framework.

Raw daily measurements live in `docs/testing-framework-health.csv`. This Markdown file is regenerated from the CSV and keeps only analysis for measurements within the last three calendar months, as defined in `docs/testing-framework-health-spec.md`.

## Current Summary

The repository demonstrates a solid educational Node.js testing story through chapter examples, but it still does not provide a single unified repo-wide test entry point or CI gate. The dominant evidence is the built-in Node test runner (`node:test`) with suites, subtests, mocks, coverage examples, and Playwright end-to-end checks under `10-testing/`; the root package configuration still runs Biome linting through `npm test`.

- Overall score: 73/100 on 2026-09-15
- Validation: `node --test 10-testing/02-first-test-with-runner/calculateBasketTotal.test.js` → passed

## Three-Month Trend

| Date | Overall score | Trend | Notes |
| --- | ---: | --- | --- |
| 2026-09-13 | 73 | baseline | Built-in Node.js test runner, mock support, and coverage commands are demonstrated across `10-testing/`; no repo-level test command exists. |
| 2026-09-15 | 73 | unchanged since 2026-09-13 | The repo still demonstrates a chapter-based Node.js test story with no repo-wide test suite or enforcement gate. |

## Category Observations

- Test organization and isolation (11/15): Examples are grouped cleanly by chapter under `10-testing/` and use `suite()`/`test()` patterns with concurrency and timeouts; however, there is no repo-wide shared test layout or central fixtures.
- Execution ergonomics (8/15): Individual examples document direct `node --test` and Playwright commands, but the root `package.json` defines only linting (`npm test` -> `biome check`), so local execution remains fragmented.
- Clear, standard, machine-usable results (10/15): Node's built-in runner emits TAP-style output that is machine-readable; no central reporter or CI export is configured at the repo root.
- Mocking and dependency simulation support (14/15): `node:test` supports `t.mock`, `MockAgent`, and module mocking in examples such as `11-unit-test-mock-http`, `12-unit-test-mock-core-modules`, and `13-unit-test-mock-other-modules-concurrent`.
- Coverage measurement and thresholds (12/15): Coverage examples use `--experimental-test-coverage` and `c8`, but there is no repo-wide coverage threshold or enforcement.
- Slow-test detection and performance visibility (6/10): Timeout and concurrency guardrails are shown in examples, but there is no repository-wide slow-test threshold or reporting pipeline.
- Advanced testing features (12/15): The examples include subtests, suites, setup/teardown, async tests, concurrency, dependency injection, integration tests, and Playwright end-to-end tests.

## Top Follow-Up Actions

1. Add a root-level testing strategy and single `npm test` / `npm run test:unit` entry point for the examples intended to run in CI.
2. Enforce a coverage target and slow-test threshold in a central workflow or sample runner.
3. Decide whether the repository is a book-sample playground or a real app and align the test harness accordingly.

## Latest Daily Analysis

- Date: 2026-09-15
- Overall score: 73/100
- Validation command: `node --test 10-testing/02-first-test-with-runner/calculateBasketTotal.test.js`
- Validation result: passed
- Evidence:
  - `package.json` root script is `npm test` -> `biome check --no-errors-on-unmatched`, not a test runner.
  - `.github/workflows/node.yml` runs `npm install --frozen-lockfile` and `npm test`, which is lint-only.
  - `10-testing/02-first-test-with-runner/calculateBasketTotal.test.js` uses `node:test` and validates a basket-total calculation.
  - `10-testing/08-test-coverage/README.md` documents `node --test --experimental-test-coverage` and `c8`-based HTML coverage output.
  - `10-testing/17-e2e-test/README.md` documents Playwright end-to-end testing commands.

## Assumptions and Limitations

- This assessment treats the repository as a pattern library rather than a single application.
- The score is based on chapter examples and repo configuration rather than a full app test suite.
- No dedicated repo-wide test workflow beyond root linting is present.
- Validation used one representative passing chapter example rather than all example folders.
