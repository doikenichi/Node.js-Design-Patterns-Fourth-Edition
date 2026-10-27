# Testing Framework Health

Rolling analysis for the repository testing framework.

Raw daily measurements live in `docs/testing-framework-health.csv`. This Markdown file is regenerated from the CSV and keeps only analysis for measurements within the last three calendar months, as defined in `docs/testing-framework-health-spec.md`.

## Current Summary

The repository demonstrates a strong educational Node.js testing story through chapter examples, but it still lacks a single repo-wide test entry point and CI gate. The dominant evidence is the built-in Node test runner (`node:test`) with suites, module mocks, coverage examples, async tests, and Playwright end-to-end checks under `10-testing/`; the root package configuration still runs Biome linting through `npm test`.

- Overall score: 73/100 on 2026-10-27 (unchanged from 2026-10-26)
- Validation: `node --test 10-testing/02-first-test-with-runner/calculateBasketTotal.test.js` → passed

## Three-Month Trend

| Date | Overall score | Trend | Notes |
| --- | ---: | --- | --- |
| 2026-09-13 | 73 | baseline | Built-in Node.js test runner, mock support, and coverage commands are demonstrated across `10-testing/`; there is no repo-level test command or enforcement gate. |
| 2026-09-15 | 73 | unchanged since 2026-09-13 | The repo still demonstrates a chapter-based Node.js test story with no repo-wide test suite or enforcement gate. |
| 2026-09-20 | 73 | unchanged since 2026-09-15 | The repo still demonstrates a chapter-based Node.js test story with no repo-wide test suite or enforcement gate. |
| 2026-09-27 | 73 | unchanged since 2026-09-20 | The repo still demonstrates a chapter-based Node.js test story with no repo-wide test suite, CI enforcement gate, or coverage threshold. |
| 2026-09-28 | 73 | unchanged since 2026-09-27 | The repo still demonstrates a chapter-based Node.js test story with no repo-wide test suite, CI enforcement gate, or coverage threshold. |
| 2026-09-29 | 73 | unchanged since 2026-09-28 | The repo still demonstrates a chapter-based Node.js test story with no repo-wide test suite, CI enforcement gate, or coverage threshold. |
| 2026-09-30 | 73 | unchanged since 2026-09-29 | The repo still demonstrates a chapter-based Node.js test story with no repo-wide test suite, CI enforcement gate, or coverage threshold. |
| 2026-10-01 | 73 | unchanged since 2026-09-30 | The repo still demonstrates a chapter-based Node.js test story with no repo-wide test suite, CI enforcement gate, or coverage threshold. |
| 2026-10-05 | 73 | unchanged since 2026-10-01 | The repo still demonstrates a chapter-based Node.js test story with no repo-wide test suite, CI enforcement gate, or coverage threshold. |
| 2026-10-06 | 73 | unchanged since 2026-10-05 | The repo still demonstrates a chapter-based Node.js test story with no repo-wide test suite, CI enforcement gate, or coverage threshold. |
| 2026-10-18 | 73 | unchanged since 2026-10-06 | Built-in Node.js test runner, chapter-based examples, and coverage patterns remain the dominant evidence; package.json still routes `npm test` through Biome linting without a repo-wide test gate. |
| 2026-10-22 | 73 | unchanged since 2026-10-18 | Built-in Node.js test runner remains the dominant pattern (node:test, suites, mocks, coverage via --experimental-test-coverage); package scripts and CI still run only linting and do not provide a repo-wide test suite or coverage gate. |
| 2026-10-23 | 73 | unchanged since 2026-10-22 | Built-in Node.js test runner remains the dominant pattern (node:test, suites, mocks, coverage via --experimental-test-coverage); package scripts and CI still run only linting and do not provide a repo-wide test suite or coverage gate. |
| 2026-10-24 | 73 | unchanged since 2026-10-23 | Built-in Node.js test runner remains the dominant pattern (node:test, suites, mocks, coverage via --experimental-test-coverage); package scripts and CI still run only linting and do not provide a repo-wide test suite or coverage gate. |
| 2026-10-26 | 73 | unchanged since 2026-10-24 | Built-in Node.js test runner examples demonstrate suites, mocks, coverage, concurrency, and Playwright E2E; root npm test runs Biome lint and CI invokes only npm test, with no repo-wide test or coverage gate. |
| 2026-10-27 | 73 | unchanged since 2026-10-26 | `10-testing/` examples demonstrate `node:test`, mocks, coverage, concurrency, setup/teardown, and Playwright; root `npm test` and CI remain lint-only, with no repo-wide test or coverage gate. |

## Category Observations

- Test organization and isolation (11/15): Examples are grouped cleanly by chapter under `10-testing/` and use `suite()`/`test()` patterns with concurrency and timeouts; however, there is no repo-wide shared test layout or central fixtures.
- Execution ergonomics (8/15): Individual examples document direct `node --test` and Playwright commands, but the root `package.json` defines only linting (`npm test` -> `biome check --no-errors-on-unmatched`), so local execution remains fragmented.
- Clear, standard, machine-usable results (10/15): Node's built-in runner emits TAP-style output that is machine-readable; no central reporter or CI export is configured at the repo root.
- Mocking and dependency simulation support (14/15): `node:test` examples demonstrate `t.mock.method`, `MockAgent`, and module mocking for HTTP, core modules, and other modules.
- Coverage measurement and thresholds (12/15): Coverage examples use `--experimental-test-coverage` and `c8`, but there is no repo-wide coverage threshold or enforcement.
- Slow-test detection and performance visibility (6/10): Timeout and concurrency guardrails are shown in examples, but there is no repository-wide slow-test threshold or reporting pipeline.
- Advanced testing features (12/15): The examples include subtests, suites, setup/teardown, async tests, concurrency, dependency injection, integration tests, and Playwright end-to-end tests.

## Top Follow-Up Actions

1. Add a root-level testing strategy and single `npm test` / `npm run test:unit` entry point for the examples intended to run in CI.
2. Enforce a coverage target and slow-test threshold in a central workflow or sample runner.
3. Decide whether the repository is a book-sample playground or a real app and align the test harness accordingly.

## Latest Daily Analysis

- Date: 2026-10-27
- Overall score: 73/100
- Validation command: `node --test 10-testing/02-first-test-with-runner/calculateBasketTotal.test.js`
- Validation result: passed (2 tests)
- Evidence:
  - Root `package.json` maps `npm test` to `npm run test:lint` (`biome check --no-errors-on-unmatched`), not to a test runner; there is no root test script for `10-testing/`.
  - `.github/workflows/node.yml` installs dependencies and runs `npm test`, so its CI check is lint-only and does not enforce test execution or coverage.
  - `10-testing/02-first-test-with-runner/README.md` and `calculateBasketTotal.test.js` document a direct `node --test` workflow; both tests passed in this run.
  - Mock examples demonstrate `t.mock.method`, `MockAgent`, `mock.module`, and setup/teardown in `10-testing/11-unit-test-mock-http/` and `12-unit-test-mock-core-modules/`.
  - `10-testing/08-test-coverage/README.md` documents `--experimental-test-coverage` and `c8` HTML coverage output, but without a repository-wide threshold or enforcement.
  - Examples under `10-testing/` demonstrate suites, concurrency, and timeout options; no repository-wide slow-test reporting is configured.
  - `10-testing/17-e2e-test/README.md` documents Playwright tests requiring a separately running application and browser setup, isolated from the root CI gate.

## Assumptions and Limitations

- This assessment treats the repository as a pattern library rather than a single application.
- The score is based on chapter examples and repo configuration rather than a full app test suite.
- `.github/workflows/node.yml` runs only the root `npm test` command, which is lint-only; the separate health workflow generates this report and is not a test gate.
- Validation used one representative passing chapter example rather than all example folders; Playwright E2E execution has a separate application and browser prerequisite and was not used for this narrow validation.
- Analysis includes CSV dates on or after 2026-07-27, the rolling three-calendar-month cutoff for this 2026-10-27 run; older raw CSV rows are retained.
