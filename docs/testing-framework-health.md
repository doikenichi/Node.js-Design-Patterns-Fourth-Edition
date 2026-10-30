# Testing Framework Health

Rolling analysis for the repository testing framework.

Raw daily measurements live in `docs/testing-framework-health.csv`. This Markdown file is regenerated from the CSV and keeps only analysis for measurements within the last three calendar months, as defined in `docs/testing-framework-health-spec.md`.

## Current Summary

The repository demonstrates a broad educational Node.js testing story through chapter examples, but it still lacks a single repo-wide test entry point and CI gate. The examples under `10-testing/` cover the built-in runner, mocking, coverage, concurrency, integration tests, and Playwright; root `npm test` continues to run Biome linting only.

- Overall score: 73/100 on 2026-10-30 (unchanged from 2026-10-29)
- Validation: `node --test 10-testing/02-first-test-with-runner/calculateBasketTotal.test.js` -> passed (2 tests)

## Three-Month Trend

| Date | Overall score | Trend | Notes |
| --- | ---: | --- | --- |
| 2026-09-13 | 73 | baseline | Node.js test runner, mock support, and coverage commands are demonstrated; no repo-level test command or enforcement gate. |
| 2026-09-15 | 73 | unchanged since 2026-09-13 | Chapter-based Node.js test story; no repo-wide test suite or enforcement gate. |
| 2026-09-20 | 73 | unchanged since 2026-09-15 | Chapter-based Node.js test story; no repo-wide test suite or enforcement gate. |
| 2026-09-27 | 73 | unchanged since 2026-09-20 | No repo-wide test suite, CI enforcement gate, or coverage threshold. |
| 2026-09-28 | 73 | unchanged since 2026-09-27 | No repo-wide test suite, CI enforcement gate, or coverage threshold. |
| 2026-09-29 | 73 | unchanged since 2026-09-28 | Node.js testing examples include integration and Playwright E2E; root scripts and CI remain lint-only. |
| 2026-09-30 | 73 | unchanged since 2026-09-29 | No repo-wide test command, coverage threshold, or CI test gate. |
| 2026-10-01 | 73 | unchanged since 2026-09-30 | No repo-wide test command, coverage threshold, or CI test gate. |
| 2026-10-05 | 73 | unchanged since 2026-10-01 | Built-in runner examples; package scripts and CI provide no repo-wide testing or coverage gate. |
| 2026-10-06 | 73 | unchanged since 2026-10-05 | Root package scripts lint only; no repo-wide test suite or coverage gate. |
| 2026-10-18 | 73 | unchanged since 2026-10-06 | The root `npm test` remains Biome linting; CI does not enforce test execution or coverage. |
| 2026-10-22 | 73 | unchanged since 2026-10-18 | `node:test`, mocks, and coverage examples remain; scripts and CI lack a repo-wide suite or coverage gate. |
| 2026-10-23 | 73 | unchanged since 2026-10-22 | `node:test`, mocks, and coverage examples remain; scripts and CI lack a repo-wide suite or coverage gate. |
| 2026-10-24 | 73 | unchanged since 2026-10-23 | `node:test`, mocks, and coverage examples remain; scripts and CI lack a repo-wide suite or coverage gate. |
| 2026-10-26 | 73 | unchanged since 2026-10-24 | Examples demonstrate suites, mocks, coverage, concurrency, and Playwright E2E; root `npm test` and CI remain lint-only. |
| 2026-10-27 | 73 | unchanged since 2026-10-26 | Examples demonstrate `node:test`, mocks, coverage, concurrency, setup/teardown, and Playwright; no repo-wide test or coverage gate. |
| 2026-10-28 | 73 | unchanged since 2026-10-27 | Root `npm test` maps to lint and CI runs it only; examples show `node:test`, mocks, coverage, concurrency, integration, and Playwright E2E. |
| 2026-10-29 | 73 | unchanged since 2026-10-28 | Root `npm test` maps to lint and CI runs it only; examples show `node:test`, mocks, coverage, concurrency, integration, and Playwright E2E. |
| 2026-10-30 | 73 | unchanged since 2026-10-29 | Root `npm test` maps to lint and CI runs it only; examples show `node:test`, mocks, coverage, concurrency, integration, and Playwright E2E. |

## Category Observations

- Test organization and isolation (11/15): Examples are grouped by chapter under `10-testing/` and use suite/test patterns, concurrency, and timeouts; there is no shared repo-wide test layout or central fixtures.
- Execution ergonomics (8/15): Individual examples document direct `node --test` and Playwright commands, but root `package.json` defines `npm test` as Biome linting, so local test execution remains fragmented.
- Clear, standard, machine-usable results (10/15): Node's built-in runner emits TAP-style output; no central reporter or CI export is configured at the repository root.
- Mocking and dependency simulation support (14/15): Examples cover `t.mock.method`, HTTP `MockAgent`, and module mocking for core and third-party modules.
- Coverage measurement and thresholds (12/15): Examples document `--experimental-test-coverage` and `c8` HTML output, but no repo-wide threshold or enforcement exists.
- Slow-test detection and performance visibility (6/10): Timeout and concurrency guardrails appear in examples, but there is no repository-wide slow-test threshold or reporting pipeline.
- Advanced testing features (12/15): Examples include subtests, suites, setup/teardown, async tests, concurrency, dependency injection, integration tests, and Playwright end-to-end tests.

## Top Follow-Up Actions

1. Define a root-level testing strategy and a single test entry point for examples intended to run in CI.
2. Enforce a coverage target and slow-test threshold in a central workflow or sample runner.
3. Decide whether the repository is a book-sample playground or a real app and align the test harness accordingly.

## Latest Daily Analysis

- Date: 2026-10-30
- Overall score: 73/100
- Validation command: `node --test 10-testing/02-first-test-with-runner/calculateBasketTotal.test.js`
- Validation result: passed (2 tests)
- Evidence:
  - Root `package.json` maps `npm test` to `npm run test:lint` (`biome check --no-errors-on-unmatched`), not to a test runner; there is no root test script for `10-testing/`.
  - `.github/workflows/node.yml` installs dependencies and runs `npm test`, so CI runs linting but does not enforce test execution or coverage.
  - `10-testing/02-first-test-with-runner/README.md` documents `node --test`; the representative test file passed both tests in this run.
  - Examples demonstrate `node:test` suites, core-module and HTTP mocking, concurrency and timeout settings, and integration test patterns.
  - `10-testing/08-test-coverage/README.md` documents `--experimental-test-coverage`, LCOV, and `c8` HTML output, without a repository-wide threshold.
  - `10-testing/17-e2e-test/README.md` documents Playwright execution with browser setup and a separately running application, outside the root CI gate.

## Assumptions and Limitations

- This assessment treats the repository as a pattern library rather than a single application.
- The score is based on chapter examples and repository configuration rather than a full application test suite.
- `.github/workflows/node.yml` runs only root `npm test`, which is lint-only; the separate health workflow generates this report and is not a test gate.
- Validation used one representative passing chapter example rather than all example folders; Playwright has separate application and browser prerequisites and was not used for this narrow validation.
- Analysis includes CSV dates on or after 2026-07-30, the rolling three-calendar-month cutoff for this 2026-10-30 run; older raw CSV rows are retained.
