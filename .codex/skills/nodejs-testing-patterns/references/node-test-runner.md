# Node.js Built-In Test Runner

Use this reference when creating, reviewing, or debugging tests with `node:test` in Node.js 24+ projects.

## Imports

Prefer explicit built-in imports:

```ts
import { after, afterEach, before, beforeEach, describe, it, mock, test } from 'node:test'
import assert from 'node:assert/strict'
```

Use the project's existing style: some codebases prefer `test()` only, while others use `describe()` and `it()` for BDD-style grouping.

## Organization

- Put tests near the SUT or in a parallel test directory according to project convention.
- Use names such as `*.test.ts`, `*.spec.ts`, `*.int.test.ts`, and `*.e2e.ts` consistently.
- Keep unit, integration, and E2E commands separable so targeted runs stay fast.
- Group by behavior, not by private method.
- Keep shared setup small. Prefer local setup in each test when it improves readability and isolation.

## Suites And Subtests

Use suites to group behavior:

```ts
describe('calculateBasketTotal', () => {
  it('applies percentage discounts before tax', () => {
    const total = calculateBasketTotal([{ price: 100, quantity: 2 }], { discountRate: 0.1, taxRate: 0.05 })

    assert.equal(total, 189)
  })
})
```

Use subtests when cases share expensive setup or the parent test naturally owns a scenario:

```ts
test('normalizes customer names', async (t) => {
  const cases = [
    { input: ' Ada ', expected: 'Ada' },
    { input: 'GRACE', expected: 'Grace' }
  ]

  for (const { input, expected } of cases) {
    await t.test(input, () => {
      assert.equal(normalizeName(input), expected)
    })
  }
})
```

Do not hide unrelated behaviors under one parent test merely to reduce file count.

## Parameterized Tests

Use table-driven tests for equivalence partitions and boundaries:

```ts
const cases = [
  { name: 'minimum quantity', quantity: 1, valid: true },
  { name: 'zero quantity', quantity: 0, valid: false },
  { name: 'negative quantity', quantity: -1, valid: false }
]

for (const { name, quantity, valid } of cases) {
  test(name, () => {
    assert.equal(isValidQuantity(quantity), valid)
  })
}
```

Keep each row readable. If a case needs long setup or unique assertions, give it a separate test.

## Async Tests

- Mark tests `async` and `await` the SUT.
- Return the promise when not using `async`.
- Use `await assert.rejects(() => sut(), /message/)` or `await assert.rejects(sutPromiseReturningFunction)`.
- Register event listeners before triggering the event.
- Avoid `done`-style callbacks unless the codebase still requires them.
- Fail on unexpected paths with `assert.fail()` when testing callbacks or events.

Example:

```ts
test('rejects expired tokens', async () => {
  await assert.rejects(
    () => verifyToken({ expiresAt: new Date('2026-01-01T00:00:00.000Z') }, { now: () => new Date('2026-01-02T00:00:00.000Z') }),
    /expired/
  )
})
```

## Concurrency

Node's test runner can execute test files and subtests concurrently depending on options and test structure. Design tests so they can tolerate concurrency unless intentionally marked otherwise.

- Avoid shared mutable module state.
- Avoid fixed ports; use port `0` and read the assigned address.
- Namespace database records by test or worker.
- Restore environment variables, cwd, fake timers, mocks, globals, and process listeners.
- Disable concurrency only for tests that truly share unavoidable external state, and document why.

## Filtering And Targeted Execution

Prefer targeted runs while developing:

- Run a specific test file.
- Use the runner's name filtering option for a suite or test name.
- Use package scripts when the project defines them, such as `npm test -- path/to/file.test.ts` or `pnpm test -- --test-name-pattern "creates booking"`.

When a failure involves pollution, run:

- The failing test alone.
- The containing file.
- The file with adjacent tests.
- The relevant suite.
- The suite with concurrency enabled if CI uses concurrency.

## Reporters

Use reporters that fit the job:

- Human-readable default/spec output for local development.
- TAP, JUnit, or another CI-compatible reporter when the pipeline collects structured results.
- Coverage reports in text for quick diagnosis and HTML/LCOV when CI or review needs navigation.

Keep failing output actionable. Include enough assertion context that CI logs identify the behavior and important values.

## Coverage

Use Node's native coverage support when available in the project, or the existing project tool if already configured.

- Inspect uncovered branches, not just uncovered lines.
- Check error paths, boundary values, and async rejection paths.
- Treat uncovered code as a question: "Should this behavior be tested, removed, or intentionally left untested?"
- Do not add low-value tests solely to increase a percentage.

## TypeScript

For TypeScript with Node.js 24+:

- Follow the project's execution model: precompiled tests, `tsx`, `ts-node`, loader-based execution, or Node's native TypeScript support if already adopted.
- Keep ESM import specifiers compatible with the project's `tsconfig`, especially `node16`, `nodenext`, or bundler resolution.
- Use narrow interfaces for injected dependencies.
- Let TypeScript catch impossible test setup, but still assert runtime behavior.
- Avoid weakening production types just to simplify tests.

## Open Handles

If the runner hangs after tests complete, inspect:

- HTTP servers and clients.
- Database pools and transactions.
- File watchers.
- Timers and intervals.
- Workers and child processes.
- Message queue consumers.
- Event subscriptions and process listeners.
- Browser instances or Playwright contexts.

Every setup path should have a matching cleanup path, even when the test fails.
