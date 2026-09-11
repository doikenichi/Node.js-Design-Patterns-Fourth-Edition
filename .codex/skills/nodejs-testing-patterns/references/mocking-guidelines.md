# Mocking Guidelines

Use this reference before adding, reviewing, or debugging test doubles in Node.js and TypeScript tests.

## Vocabulary

- Stub: returns a controlled value or throws a controlled error.
- Spy: records calls so the test can assert meaningful interaction.
- Mock: combines a substitute with expectations about interactions.
- Fake: a lightweight working implementation, such as an in-memory repository or test clock.
- Real dependency: the production implementation used in a test environment.

The same library API may implement several of these roles. Name the role by intent, not by package branding.

## Decision Workflow

1. Identify the direct dependency of the SUT.
2. Ask whether the dependency's real behavior is part of the confidence needed.
3. Use the real dependency when its semantics are the point and it can be deterministic.
4. Use a fake when realistic stateful behavior is helpful but production infrastructure is too costly.
5. Use a stub when the SUT only needs a canned response or error.
6. Use a spy when the observable behavior is a meaningful interaction.
7. Use a mock only when the order, arguments, or call count are part of the contract.

Mock only where isolation provides meaningful value. Do not mock implementation details merely to make tests easier.

## Prefer Dependency Injection

Strongly prefer passing dependencies through constructors, factories, function parameters, or app composition roots:

```ts
export interface PaymentsDb {
  query<T>(sql: string, params: readonly unknown[]): Promise<T[]>
}

export function createPaymentsService({ db, now }: {
  db: PaymentsDb
  now: () => Date
}) {
  return {
    async recordPayment(input: PaymentInput) {
      const paidAt = now()
      await db.query('insert ...', [input.id, paidAt])
      return { id: input.id, paidAt }
    }
  }
}
```

This keeps business modules free of loader tricks and makes unit tests explicit:

```ts
test('records payment timestamp', async () => {
  const calls: unknown[][] = []
  const db = { query: async (_sql: string, params: readonly unknown[]) => { calls.push([...params]); return [] } }
  const service = createPaymentsService({ db, now: () => new Date('2026-01-01T00:00:00.000Z') })

  const result = await service.recordPayment({ id: 'pay_123' })

  assert.equal(result.paidAt.toISOString(), '2026-01-01T00:00:00.000Z')
  assert.deepEqual(calls[0], ['pay_123', result.paidAt])
})
```

## Avoid Brittle Import Mocking

Import-level mocking is fragile in ESM because imports are statically linked and module instances are cached by URL. It can also couple tests to import order and internal module structure.

Before mocking an imported module, consider:

- Can the dependency be injected at a factory or composition root?
- Can the production module accept a narrow collaborator interface?
- Can a real local test dependency be used deterministically?
- Can the behavior be tested one level higher as integration?

If import mocking is unavoidable:

- Keep it local to the test file.
- Reset module state and mock state between tests.
- Avoid relying on test execution order.
- Document why dependency injection was not practical.
- Prefer mocking the direct dependency, not a dependency several layers below the SUT.

## Node.js Built-Ins

Do not broadly mock built-in modules such as `node:fs`, `node:http`, `node:crypto`, `node:timers`, or process globals across the module graph unless there is a strong reason.

Prefer:

- Injecting a tiny wrapper such as `{ readFile, writeFile }`.
- Using temporary directories for real filesystem integration tests.
- Injecting `fetch`, a request function, or an HTTP client interface.
- Injecting `randomUUID`, `randomBytes`, `now`, or a clock where deterministic values matter.
- Passing environment values as configuration instead of reading `process.env` deep in business logic.

## HTTP Dependencies

For unit tests:

- Inject `fetch` or a narrow client.
- Stub success, non-2xx responses, malformed bodies, network rejection, timeout, and cancellation.
- Assert the domain result, mapped error, request URL, method, headers, body, and signal only when those are part of the contract.

For integration tests:

- Run a local server, use framework injection, or use a protocol-level mock server when request/response semantics matter.
- Avoid reaching public internet services from normal CI.

## Spy And Mock Quality

Good interaction assertions describe externally meaningful collaboration:

- A notification is sent once after commit.
- A transaction callback is invoked and rollback happens on failure.
- A retry policy calls the operation until success or configured exhaustion.
- A logger records a security-relevant audit event.
- An abort signal is forwarded to a client.

Poor interaction assertions describe implementation trivia:

- A private helper was called.
- A function was called before a value that could be asserted directly.
- A repository method was called because the current implementation happens to use that repository.
- Every collaborator call is asserted even though the user-visible result already proves the behavior.

## Excessive Mocking Diagnostics

Suspect excessive mocking when:

- The mock setup is longer than the behavior under test.
- Test failures mostly involve renamed methods or changed call ordering, not broken behavior.
- Mocks duplicate production algorithms.
- The test still passes when the production dependency contract is broken.
- Refactors require changing many expectations even though behavior is unchanged.
- Integration bugs escape because every boundary has been substituted.

Repair by narrowing the SUT, injecting fewer and smaller dependencies, replacing mocks with fakes or real test infrastructure, or moving the check to an integration test.
