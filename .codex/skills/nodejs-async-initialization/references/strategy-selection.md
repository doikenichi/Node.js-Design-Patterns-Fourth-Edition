# Strategy Selection

Async initialization is a contract decision, not only an implementation detail. First identify who owns initialization and what callers should experience before the component is ready.

## Decision Questions

- Can the component be constructed only after dependencies are available? Prefer an async factory or delayed startup.
- Should request handlers, queue consumers, scheduled jobs, or CLIs start receiving work before initialization finishes? If no, gate startup and readiness.
- Is it acceptable for a caller to wait on first use? If yes, local checks can be simple and predictable.
- Is the operation safe to buffer and replay later? If yes, a bounded pre-init queue can work.
- Do different methods need different behavior in different lifecycle states? If yes, use explicit states or the State pattern.
- Can initialization fail transiently? If yes, define retry ownership and idempotency.
- Can shutdown race with initialization or queued work? If yes, model `CLOSING` and `CLOSED`.

## Caller Behavior Matrix

| Caller behavior | Use when | Avoid when | Required safeguards |
| --- | --- | --- | --- |
| Wait | The caller can tolerate startup latency and needs the result. | The caller is latency-sensitive or could pile up unbounded waiters. | Shared init promise, timeout/cancellation, error propagation. |
| Fail fast | The caller can retry through a higher layer or receive a clear service-unavailable error. | The caller has no retry path and failures would become data loss. | Typed/domain error, readiness false, no hidden side effects. |
| Queue | Early operations are valid after initialization and ordering matters. | Operations are not idempotent, payloads are large, or request volume can spike. | Queue length limit, per-item timeout, cancellation, overflow error, failure fanout. |
| Retry | Failures are transient and setup is idempotent. | Failures are likely configuration or credential bugs. | Max attempts, backoff, reset rules, observability, no retry storm. |
| Prevent traffic | Servers, workers, or consumers should not handle work until dependencies are usable. | The component is optional or can degrade safely. | Bootstrap gate, health/readiness checks, startup failure exit path. |

## Explicit/Local Initialization Checks

Use local checks when the component is small, ownership is local, and the API can naturally return promises.

Good shape:

- `init()` is idempotent.
- Concurrent callers receive the same in-flight initialization promise.
- Public methods call `await this.ready()` or check state and throw a clear error.
- Failure resets or records state according to an explicit retry policy.

Prefer local checks for SDK wrappers, model loaders, cache warmers, and single-resource clients used from a small number of call sites.

Watch for:

- Every method manually checking a boolean in a slightly different way.
- A boolean `connected` that flips too early.
- `init()` called without awaiting and no caller-visible error path.

## Delayed Application Startup

Use delayed startup when the application should not accept work until required dependencies are ready.

Good shape:

- Bootstrap awaits critical dependencies before `server.listen()`, queue subscription, cron registration, or worker start.
- Optional dependencies have explicit degraded behavior and readiness impact.
- Startup failure exits, retries under a supervisor, or exposes a controlled degraded mode.
- Readiness reports false until all required dependencies are usable.

Prefer this for HTTP APIs, background workers, message consumers, schedulers, and systems behind orchestration readiness checks.

Watch for:

- A server listening while required clients are still initializing.
- Health checks that report ready because the process is alive.
- Startup code that logs initialization errors and continues into normal traffic.

## Pre-Initialization Request Queues

Use queues when early operations are intentionally accepted before readiness, and replaying them later is correct.

Good shape:

- Queue is bounded by length, bytes, or both.
- Queued entries include resolve/reject, enqueue time, optional deadline, and optional abort handling.
- Initialization success flushes the queue in documented order.
- Initialization failure rejects every queued operation with the cause.
- Shutdown rejects new work and settles queued work deterministically.

Prefer this for short startup windows, in-process command buffers, and compatibility layers where callers cannot be changed immediately.

Watch for:

- Unbounded arrays of closures.
- Queued writes that are no longer valid by the time initialization finishes.
- Retrying queue flush without idempotency.
- Memory retained by closures that capture request bodies, credentials, or large objects.

## State-Pattern Lifecycle Control

Use the State pattern when behavior varies by lifecycle and centralized transition rules will make the component safer.

Good shape:

- The context object delegates operations to a current lifecycle state.
- State classes or state objects define valid behavior for operations in that state.
- Transitions are explicit events, not arbitrary property mutations.
- State exit hooks drain queues, fail waiters, release resources, or move ownership cleanly.

Prefer this when there are multiple public operations, mixed policies such as wait for reads but fail writes, retry states, or complex shutdown.

Watch for:

- State objects that can transition to any other state without validation.
- Hidden async transitions that callers cannot observe.
- Lifecycle state used only as a verbose replacement for a simple boolean.

## Recommended Defaults

- For required app dependencies: delayed startup plus readiness checks.
- For reusable libraries: explicit `init()`/`close()` with a shared in-flight promise and clear method behavior.
- For short migration windows: bounded queues with tests for overflow and failure.
- For complex lifecycles: explicit state machine or State pattern.
- For optional dependencies: fail fast or degrade intentionally; do not hide readiness failures.
