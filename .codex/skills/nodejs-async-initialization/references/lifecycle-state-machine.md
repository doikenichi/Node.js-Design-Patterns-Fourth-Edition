# Lifecycle State Machine

Use lifecycle states to make async initialization observable and testable. A plain enum plus transition function is often enough. Use State-pattern objects when operation behavior varies enough that repeated conditionals would spread through the component.

## Canonical States

| State | Meaning | Typical behavior |
| --- | --- | --- |
| `CREATED` | Instance exists; initialization has not started. | `init()` may transition to `INITIALIZING`; operations wait, fail fast, or enqueue by policy. |
| `INITIALIZING` | Setup is running. | Repeated `init()` returns the same promise; operations wait or queue only if bounded. |
| `READY` | All required dependencies are usable. | Normal operations are allowed; readiness may report true. |
| `FAILED` | Initialization failed or a required dependency became unusable. | Operations fail fast unless a documented retry path starts a new initialization attempt. |
| `CLOSING` | Shutdown has started. | New operations are rejected; queued or in-flight work is drained, rejected, or canceled intentionally. |
| `CLOSED` | Resources are released. | Operations and `init()` usually reject unless the type explicitly supports reopening. |

Do not expose `READY` until the component can perform its promised work, not merely because a promise resolved. For example, a database client is ready only after authentication, connection establishment, schema/session setup, and required listeners are complete.

## Typical Transitions

| Event | From | To | Notes |
| --- | --- | --- | --- |
| `init()` | `CREATED` | `INITIALIZING` | Store the in-flight promise before awaiting setup. |
| `init()` again | `INITIALIZING` | `INITIALIZING` | Return the existing promise; do not start duplicate work. |
| `initSucceeded` | `INITIALIZING` | `READY` | Flush queues after all dependencies are usable. |
| `initFailed` | `INITIALIZING` | `FAILED` | Reject waiters and queued entries with the cause. |
| `retry()` | `FAILED` | `INITIALIZING` | Only if retry is supported and setup is idempotent. |
| `close()` | `CREATED`, `FAILED`, `READY` | `CLOSING` | Make shutdown idempotent and observable. |
| `close()` during init | `INITIALIZING` | `CLOSING` | Abort or wait for setup, then release partial resources. |
| `closed` | `CLOSING` | `CLOSED` | Clear queues, listeners, timers, and large references. |

Invalid transitions should fail predictably. Examples: `READY -> INITIALIZING` without an explicit reconnect design, `CLOSED -> READY` by accident, or `FAILED -> READY` without a successful retry.

## Operation Policies By State

Define behavior per public operation, not only per component. A read might wait during initialization while a write fails fast; a cache lookup might degrade while credential loading must block startup.

| State | Wait policy | Fail-fast policy | Queue policy |
| --- | --- | --- | --- |
| `CREATED` | Start init or require caller-owned init, then wait. | Throw not-started error. | Enqueue only if initialization will be started by a known owner. |
| `INITIALIZING` | Await shared init promise. | Throw initializing/unavailable error. | Enqueue with limit and timeout. |
| `READY` | Run operation. | Run operation. | Run operation immediately. |
| `FAILED` | Usually throw stored cause; optional retry gate. | Throw stored cause. | Reject queue; do not keep accepting work unless retry policy owns it. |
| `CLOSING` | Reject or wait only for explicit drain APIs. | Throw closing error. | Reject new entries. |
| `CLOSED` | Throw closed error. | Throw closed error. | Throw closed error. |

## State Pattern Shape

Use a context object to hold shared resources and delegate lifecycle-dependent operations to state objects:

- Context owns private resources, state, in-flight promises, metrics/logging, and transition validation.
- State objects implement operation behavior for their lifecycle phase.
- State exit hooks settle queues and waiters.
- Transition methods are the only place state changes occur.

State objects should not secretly mutate readiness flags. Keep transitions observable through `status`, `ready`, events, metrics, or logs that the project already uses.

## Failure And Retry

When initialization fails:

- Move to `FAILED` before rejecting public promises.
- Preserve the original cause or wrap it with `cause`.
- Reject all waiters and queued operations.
- Clear in-flight promise state according to retry policy.
- Keep readiness false.

When retrying:

- Require an explicit `retry()` or `init({ retry: true })` contract unless the surrounding startup loop owns retries.
- Bound attempts and backoff.
- Ensure setup is idempotent or compensates for partial resources.
- Test concurrent retry calls so only one retry attempt runs.

## Shutdown

Shutdown should be idempotent and race-safe:

- `close()` called multiple times returns the same close promise or a resolved promise after `CLOSED`.
- New operations are rejected once `CLOSING` begins.
- Initialization is aborted when possible, or awaited and immediately cleaned up when abort is not supported.
- Queued work is either flushed before close or rejected; choose one and test it.
- Timers, listeners, sockets, child processes, browser instances, and retained queued payloads are released.

Readiness should be false during `FAILED`, `CLOSING`, and `CLOSED`.
