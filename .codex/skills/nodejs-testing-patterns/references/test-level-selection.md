# Test Level Selection

Use this reference when deciding whether to write unit, integration, or end-to-end tests for Node.js and TypeScript code.

## Selection Rule

Choose the lowest test level that can observe the behavior with enough confidence:

- Unit test when the behavior belongs to one function, class, module, command handler, route handler, parser, mapper, policy, or domain service and dependencies can be substituted without losing the point of the test.
- Integration test when confidence depends on real collaboration between modules or infrastructure boundaries such as a database, HTTP server, filesystem, queue, cache, framework middleware, serialization, auth adapter, or transaction behavior.
- E2E test when confidence depends on the user's journey through the deployed-style system, especially browser UI, routing, authentication, real rendering, and full-stack coordination.

## Unit Tests

Use unit tests for fast feedback and design pressure.

Good unit SUTs:

- Pure functions and synchronous business rules.
- Async services with injected clients, clocks, or schedulers.
- Event emitters and streams where the behavior can be observed without a real network or database.
- Error mapping, validation, data transformation, retry policy, and branch-heavy logic.

Use substituted dependencies when the dependency is slow, nondeterministic, hard to trigger into failure, already covered elsewhere, or outside the unit's responsibility.

Do not use a unit test when most of the test recreates infrastructure behavior. That is a signal to either narrow the SUT or write an integration test.

## Integration Tests

Use integration tests for boundaries where fake behavior is likely to lie.

Good integration SUTs:

- Repository or data-access code against a real test database.
- HTTP app setup with real routes, middleware, serialization, and error handling.
- Message queue publishers/consumers where acknowledgement and retry semantics matter.
- Filesystem, stream, compression, crypto, or process behavior that depends on Node runtime semantics.
- Adapters around third-party SDKs, tested against a sandbox, local emulator, contract fixture, or recorded boundary where appropriate.

Prefer deterministic infrastructure:

- Ephemeral ports instead of fixed ports.
- Test schemas, unique database names, transactions, or containers instead of shared local state.
- Per-test records with unique IDs or worker-specific namespaces.
- Explicit startup and teardown through `before`, `beforeEach`, `afterEach`, and `after`.

## E2E Tests

Use E2E tests sparingly for high-value user confidence.

Good E2E SUTs:

- Critical user flows that cross UI, API, persistence, auth, and routing.
- Accessibility-sensitive flows where roles, labels, focus, and visible states matter.
- Regression paths where unit or integration tests previously missed a real user breakage.
- Browser-specific behavior such as upload/download, navigation, storage, popups, permissions, or responsive layout.

Keep E2E tests fewer, clearer, and more realistic than lower-level tests. Do not assert every intermediate implementation step.

## Equivalence Partitions And Boundaries

Before writing cases, partition inputs and states into meaningful classes:

- Valid ordinary cases.
- Invalid inputs by type, shape, range, permission, ownership, or missing dependency.
- Empty, single, many, maximum, minimum, duplicate, and unknown values.
- Time boundaries such as before, at, and after expiration.
- Async boundaries such as success, rejection, cancellation, timeout, retry exhaustion, and partial failure.
- Serialization boundaries such as missing fields, extra fields, malformed JSON, encoding, and content type.
- Persistence boundaries such as not found, uniqueness conflict, stale version, transaction rollback, and constraint violation.

Add representative cases for each important partition. Avoid exhaustively testing equivalent values unless they have different business meaning.

## CI/CD Placement

- Put fast unit tests in every pull request check.
- Put focused integration tests in pull request checks when infrastructure can be reliable and reasonably fast.
- Put slow or costly integration suites behind labels, scheduled runs, merge queues, or pre-release gates when needed.
- Put E2E tests on critical paths, staging deployments, smoke checks, or release gates with artifacts such as traces, videos, screenshots, server logs, and coverage reports.
- Keep local targeted commands documented in package scripts so failures can be reproduced outside CI.

## Red Flags

- A unit test starts real servers, databases, queues, browsers, or sleeps.
- An integration test mocks the exact infrastructure behavior it claims to verify.
- An E2E test checks implementation internals instead of user-visible outcomes.
- A test fails only in CI because it depends on local time, local state, execution order, fixed ports, or external services.
- Coverage is high but important failure modes, boundaries, or async paths are untested.
