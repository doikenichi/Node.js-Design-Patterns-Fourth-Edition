---
name: nodejs-async-initialization
description: "Design, refactor, and review Node.js and TypeScript components that require asynchronous initialization before use, including readiness gates, bounded pre-init queues, retries, and lifecycle state machines."
---

# Node.js Async Initialization

Use this skill when a Node.js component cannot be safely used until asynchronous setup completes. Typical examples include database clients, remote configuration, credential loading, service discovery, browser/process initialization, network connections, model loading, and cache warming.

This guidance is derived from Chapter 11, "Advanced Recipes", of *Node.js Design Patterns, Fourth Edition* and its companion async-initialization examples, but it generalizes the techniques for production code. Do not reproduce book prose or copy examples verbatim.

## Required Analysis

Before designing or changing code, inspect these lifecycle concerns:

- Initialization ownership: which module, factory, service container, app bootstrap, or caller is responsible for calling `init()` or `connect()`.
- Concurrent initialization calls: whether repeated calls share one in-flight promise and cannot duplicate side effects.
- Failure behavior: whether failures are propagated, cached, retried, or reset for an explicit retry.
- Retry policy: who retries, how many times, with what backoff, and whether operations are idempotent.
- Readiness: what makes the component truly usable, and whether traffic should be blocked until that is true.
- Shutdown: how `CLOSING` and `CLOSED` reject, drain, cancel, or complete pending work.
- Queue limits: max length, per-item timeout, global timeout, cancellation, and overload error behavior.
- Memory growth: whether waiting callers, pending operations, timers, and listeners are bounded and cleaned up.
- Error propagation: whether every caller waiting on initialization or queued work receives the same meaningful failure.

## Strategy Choice

Select the simplest lifecycle strategy that protects callers:

- Explicit/local initialization checks: operations check readiness and either wait on initialization or fail fast. Use for narrow components where local ownership is clear.
- Delayed application startup: bootstrap awaits required dependencies before starting servers, workers, consumers, schedulers, or route registration. Use when callers should never see an unready component.
- Pre-initialization request queues: operations before readiness are queued and replayed after initialization. Use only when early requests are acceptable to delay and can be bounded.
- State-pattern based lifecycle control: lifecycle states own behavior and transitions. Use when operations differ across `CREATED`, `INITIALIZING`, `READY`, `FAILED`, `CLOSING`, and `CLOSED`, or when branching is spreading across methods.

For detailed tradeoffs and caller behavior choices, read [references/strategy-selection.md](references/strategy-selection.md).

## Lifecycle Semantics

Where applicable, model lifecycle explicitly with states such as:

- `CREATED`: constructed but not started.
- `INITIALIZING`: initialization is in progress; callers may wait, queue, or fail depending on the chosen strategy.
- `READY`: dependencies are usable and readiness may be reported as true.
- `FAILED`: initialization or a critical dependency failed; callers must receive an error or a documented retry path.
- `CLOSING`: shutdown is in progress; new work is rejected and pending work is drained, failed, or canceled intentionally.
- `CLOSED`: no new work is accepted and resources are released.

For transition rules and shutdown handling, read [references/lifecycle-state-machine.md](references/lifecycle-state-machine.md).

## Implementation Rules

- Use Node.js 24+, ESM, modern promises, and TypeScript where applicable.
- Prefer explicit lifecycle semantics over arbitrary sleeps, interval polling, or time-based readiness guesses.
- Deduplicate initialization with one shared in-flight promise or a state transition guard.
- Mark `READY` only after all required dependencies are actually usable.
- Preserve cancellation with `AbortSignal` when initialization, waiting, queueing, or shutdown can take time.
- Keep public APIs honest: either return promises that wait, throw clear errors, enqueue bounded work, or expose a factory that only returns ready instances.
- Make retry behavior explicit. Do not retry indefinitely by default.
- During shutdown, reject new operations immediately and settle all queued or waiting operations.

## Explicitly Prevent

- Partially initialized objects escaping into normal traffic.
- Duplicate initialization side effects from concurrent `init()` or `connect()` calls.
- Unbounded pre-initialization queues or unbounded arrays of waiting resolvers.
- Swallowed initialization failures, rejected promises without observers, or logs without caller-visible errors.
- Readiness checks returning true before dependent clients, credentials, caches, listeners, or connections are usable.
- Tests that rely on sleeps instead of controlled promises, fake timers, injected delays, or explicit synchronization points.

## Testing Requirements

Require concurrency-focused tests for async initialization work. Cover:

- Many callers invoking `init()` concurrently and only one underlying setup running.
- Operations before readiness choosing the intended behavior: wait, fail fast, queue, retry, or receive no traffic because startup is delayed.
- Initialization failure propagating to all waiters and queued callers.
- Retry after failure when supported, including limits and reset behavior.
- Queue overflow, timeout, cancellation, and cleanup to prevent memory growth.
- Invalid lifecycle transitions, shutdown during initialization, shutdown while queued, and post-close operation rejection.
- Readiness staying false until dependencies are usable and becoming false during `CLOSING` or `FAILED`.

For original TypeScript examples and test sketches, read [references/typescript-examples.md](references/typescript-examples.md).
