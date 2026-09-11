---
name: nodejs-testing-patterns
description: "Create, review, debug, and improve production-quality automated tests for Node.js and TypeScript projects using Node.js 24+ conventions, modern ESM, dependency injection, test doubles, coverage diagnostics, integration boundaries, and Playwright E2E guidance."
---

# Node.js Testing Patterns

Use this skill when creating, reviewing, debugging, or improving automated tests for Node.js and TypeScript projects. The guidance is synthesized from Chapter 10, "Testing: Patterns and Best Practices", of *Node.js Design Patterns, Fourth Edition* and the official companion code, expressed as an actionable workflow rather than book prose.

Testing is a design activity. Start from observable behavior, choose the least expensive test level that gives useful confidence, and make dependencies explicit enough that tests are deterministic without becoming detached from reality.

## When To Use

Activate this skill when asked to:

- Add or improve unit, integration, or end-to-end tests for Node.js or TypeScript code.
- Review test quality, coverage, flakiness, async assertions, test isolation, mocks, spies, stubs, fixtures, or CI behavior.
- Debug failing or flaky tests involving promises, timers, open handles, HTTP servers, databases, external services, Playwright, or shared state.
- Choose between real dependencies and substituted dependencies.
- Configure or use the Node.js built-in test runner, including suites, subtests, concurrency, filtering, reporters, coverage, and TypeScript.
- Improve testability through dependency injection without distorting production design.

## Testing Foundations

- System Under Test (SUT): name the behavior under test and keep the assertion at that boundary. Avoid asserting incidental calls, private helpers, or internal representation unless they are the public contract.
- Arrange, Act, Assert: set up deterministic inputs and dependencies, perform one meaningful action, then assert the observable result or effect.
- Coverage: use line, branch, and function coverage to find blind spots. Do not treat coverage percentage as proof that tests verify important behavior.
- Test doubles: use stubs for canned answers, spies for observing calls, mocks for behavior with expectations, fakes for lightweight working implementations, and real dependencies when the boundary matters.
- TDD: when helpful, write a failing test for the next behavior, implement the smallest production change, then refactor with tests green.
- BDD: express externally meaningful behavior in language a maintainer or product peer can understand; do not bury intent in setup noise.
- Testing pyramid: prefer many fast unit tests, fewer integration tests around infrastructure boundaries, and a small number of high-value E2E flows.
- CI/CD: tests are release feedback. Keep fast checks targeted and deterministic for pull requests, move slower infrastructure/E2E checks to the right pipeline stage, and make failures diagnosable from logs/artifacts.

## Required Workflow

Follow this sequence before and during test work:

1. Determine the observable behavior.
2. Select the lowest test level that gives sufficient confidence.
3. Identify direct dependencies.
4. Decide which dependencies should be real versus substituted.
5. Define equivalence partitions and important boundaries.
6. Cover success, failure, edge, and async behavior as appropriate.
7. Implement deterministic tests.
8. Run targeted tests.
9. Run the relevant suite.
10. Inspect coverage as a diagnostic, not as proof of quality.

Read [references/test-level-selection.md](references/test-level-selection.md) when choosing unit, integration, or E2E coverage. Read [references/mocking-guidelines.md](references/mocking-guidelines.md) before adding or reviewing doubles. Read [references/node-test-runner.md](references/node-test-runner.md) when using `node:test`. Read [references/playwright-guidelines.md](references/playwright-guidelines.md) for browser E2E work.

## Default Test Design

- Prefer modern ESM and TypeScript conventions for Node.js 24+: `node:test`, `node:assert/strict`, explicit `.js` specifiers where required by the project's TS module settings, `AbortSignal`, `URL`, `fetch`, and native timers where appropriate.
- Match the existing project runner and assertion style unless the task is explicitly to migrate or introduce a runner.
- Keep tests behavior-oriented. Test public exports, routes, commands, worker entrypoints, or component user behavior before testing private functions.
- Strongly prefer dependency injection over fragile module-import mocking when reasonable. Inject narrow capabilities such as `{ query() }`, `{ fetch() }`, `{ now() }`, `{ writeFile() }`, or `{ send() }`.
- Mock only where isolation provides meaningful value: nondeterministic clocks, costly infrastructure, rare failure modes, external networks, process state, and direct collaborators whose behavior is already covered elsewhere.
- Do not mock implementation details merely to make tests easier.
- Use realistic sample data with minimal fields needed by the behavior. Avoid giant fixtures that hide the important case.
- Keep assertions specific enough to diagnose failure but not so specific that harmless refactors break tests.

## Unit Testing

- Synchronous code: assert return values, thrown errors, state transitions, emitted events, or calls to injected collaborators.
- Asynchronous code: `await` the action under test. Return promises from tests or declare tests `async`; never leave floating promises.
- Promises: use `await assert.rejects(...)` for rejected promises and `await assert.doesNotReject(...)` only when the lack of rejection is the behavior.
- Rejected promises: pass a function returning the promise to `assert.rejects`; do not `await` the promise before the assertion.
- Timers: avoid real waiting. Inject a clock or scheduler when feasible; otherwise use the runner's mock timers or a narrowly scoped fake timer setup and restore it.
- Dependency injection: make direct dependencies explicit at construction, factory, or function boundaries. Keep injected types narrow.
- Spies: use them to observe meaningful interactions, such as an event being emitted, a notification being sent, or a transaction callback being invoked.
- Mocking: prefer small fakes/stubs over broad module mocks. If module mocking is unavoidable, isolate it, reset it, and avoid depending on import order surprises.
- Node.js built-ins: prefer injecting a small wrapper over mocking `node:fs`, `node:http`, `node:crypto`, or process globals across the module graph.
- HTTP dependencies: prefer injecting `fetch` or an HTTP client interface for unit tests; reserve real server/client tests for integration.
- Avoid brittle import mocking: if a module imports its own database/client/logger at top level, consider refactoring toward a factory or composition root before mocking loader internals.

## Integration Testing

- Use integration tests when confidence depends on real module wiring, SQL/schema behavior, migrations, serialization, HTTP routing, middleware, transactions, filesystem semantics, queue behavior, or provider adapters.
- Databases: create deterministic test data, isolate by transaction/schema/container/database name where possible, and clean up reliably in `afterEach` or `after`.
- HTTP servers: start the real app on an ephemeral port or use the framework's injectable server API. Always close servers, clients, pools, and background workers.
- Real infrastructure boundaries are appropriate when the behavior under test is the boundary: SQL constraints, message acknowledgement, object storage metadata, HTTP headers, auth middleware, TLS/proxy behavior, or serialization.
- Keep setup and cleanup deterministic. Avoid depending on test order, existing local state, or shared mutable fixtures.
- Do not turn integration tests into full E2E tests unless the user journey across systems is the point.

## E2E Testing

- Use Playwright for browser E2E unless the project already standardizes on another tool.
- Cover realistic user flows: login/session setup, critical creation/update/deletion paths, navigation, error recovery, and high-value regression paths.
- Prefer user-facing locators: `getByRole`, `getByLabel`, `getByText`, `getByPlaceholder`, and stable `data-testid` only when accessible locators are not enough.
- Use web-first assertions and event-aware waits. Avoid arbitrary sleeps.
- Keep timeouts intentional and local to the operation that truly needs more time.
- Seed deterministic test data through APIs, fixtures, database helpers, or worker-scoped setup. Clean up or namespace data to support parallel runs.

## Failure Diagnostics

When tests fail or flake, diagnose by symptom:

- Flaky asynchronous tests: look for missing `await`, floating promises, events emitted before listeners are registered, nondeterministic ordering, unhandled rejections, and real-time delays.
- Open handles: inspect unclosed servers, database pools, sockets, file watchers, timers, workers, child processes, subscriptions, and message consumers.
- Race conditions: check shared ports, shared records, global state, parallel tests using the same resource, and assertions that run before eventual work completes.
- Incorrect async assertions: verify `assert.rejects` receives a promise-returning function, callback APIs are wrapped once, and tests fail when the expected assertion is skipped.
- Shared state: reset in-memory caches, singleton instances, environment variables, process cwd, fake timers, and global fetch/logger hooks.
- Test pollution: run the suspected test alone, then before/after neighboring tests, then with randomized or changed order when available.
- Unreliable timeouts: replace sleeps with observable readiness checks, injected clocks, web-first assertions, or explicit lifecycle events.
- Brittle selectors: replace CSS/XPath chains and text coupled to layout with roles, labels, names, or stable test IDs.
- Excessive mocking: remove mocks that duplicate implementation knowledge, hide real integration failures, or require large expectation scripts for simple behavior.

## Verification Checklist

- The SUT and observable behavior are named.
- The test level is the lowest level that provides sufficient confidence.
- Direct dependencies are listed, with real versus substituted decisions justified.
- Success, failure, edge, boundary, and relevant async paths are covered.
- Equivalence partitions and important boundary values are represented without redundant cases.
- Tests are deterministic under repeated, isolated, and parallel execution where the runner allows it.
- Test doubles are narrow and behavior-focused; implementation details are not mocked just for convenience.
- Dependency injection is preferred over import-level mocking where reasonable.
- Servers, clients, pools, timers, workers, and temporary resources are closed or restored.
- Targeted tests pass.
- The relevant suite passes.
- Coverage was inspected for blind spots and did not replace behavioral review.
- CI commands, artifacts, or reports are updated when the test surface or runner configuration changes.
