---
name: nodejs-async-cancellation
description: "Implement, refactor, and review structured cancellation for asynchronous Node.js and TypeScript operations using AbortController and AbortSignal, including nested propagation, cleanup, timeouts, streams, fetch, timers, wrappers, and tests."
---

# Node.js Async Cancellation

Use this skill when implementing, refactoring, or reviewing cancellation in modern Node.js 24+ and TypeScript codebases. The guidance is based on the "Canceling asynchronous operations" material from Chapter 11, "Advanced Recipes", in *Node.js Design Patterns, Fourth Edition* and the official companion examples, expressed as original engineering rules rather than book prose.

Prefer `AbortController` and `AbortSignal` whenever the underlying API supports them. Older flag, wrapper, or generator-based cancellation patterns are useful mainly for understanding legacy code and for adapting APIs that cannot receive a signal directly.

## When To Use

Activate this skill when asked to:

- Add cancellation to an async API, background task, queue job, long-running computation, polling loop, or multi-step workflow.
- Accept, create, propagate, compose, or test `AbortSignal`.
- Integrate cancellation with `fetch`, `node:timers/promises`, streams, custom promises, async iterators, workers, child processes, or third-party libraries.
- Distinguish caller cancellation from ordinary operational failure.
- Fix work that continues after a request, CLI command, UI action, or parent operation no longer needs it.
- Review cancellation behavior for cleanup, listener leaks, resource leaks, unresolved promises, or swallowed abort errors.
- Replace ad hoc cancellation objects with structured cancellation.

## When NOT To Use

Do not introduce cancellation plumbing where the operation is synchronous, cheap, and cannot observe cancellation before completion. Do not create an `AbortController` in every helper by habit; most lower-level helpers should receive a signal from their caller.

Avoid custom cancellation classes unless the project must adapt legacy APIs or preserve an established public contract. When possible, use the platform's abort reason and errors instead of inventing incompatible error shapes.

## Core Design Rules

- The caller that owns the operation generally owns cancellation.
- Lower-level functions receive a `signal` rather than inventing independent cancellation controls.
- Cancellation must propagate downward through every nested async operation that can accept it.
- Cleanup must occur exactly once on success, abort, and failure.
- Cancellation must not leave unresolved promises or leaked listeners, timers, handles, streams, workers, sockets, child processes, or file descriptors.
- Cancellation should be distinguishable from unexpected operational failure when useful.
- Use modern Node.js 24+ APIs, including native `AbortController`, `AbortSignal.timeout()`, `AbortSignal.any()`, `signal.throwIfAborted()`, `node:timers/promises`, `fetch`, and signal-aware stream helpers where supported.

## Context To Inspect

Before changing code, inspect:

- Public API shape and ownership: who starts the operation, who no longer needs it, and who should be allowed to abort it.
- Existing options objects, call sites, nested async calls, retries, queues, streams, timers, workers, and third-party clients.
- Whether current code already accepts `signal`, `timeout`, `cancel`, `destroy`, `close`, `dispose`, `unsubscribe`, or similar lifecycle controls.
- Error handling: how aborts, timeouts, network failures, validation errors, and cleanup failures are currently represented.
- Tests around success, failure, timing, cleanup, concurrency, and public error contracts.
- TypeScript targets and Node version assumptions.

## Implementation Workflow

1. Define the cancellation contract at the public boundary. Read [references/cancellation-contract.md](references/cancellation-contract.md) when designing or changing an API.
2. Pass `{ signal }` down through nested operations that support it. Read [references/abort-signal-patterns.md](references/abort-signal-patterns.md) for implementation patterns.
3. Check `signal.throwIfAborted()` before starting expensive work and at cooperative checkpoints.
4. Register abort listeners only when needed, use `{ once: true }`, and remove listeners during cleanup when the operation may finish normally.
5. Settle each promise exactly once. Guard manual async wrappers with a settled/cleanup path.
6. Convert cancellation into the project's public error shape only at boundaries that already translate errors.
7. Preserve ordinary failures. Do not catch an abort and continue unless the caller explicitly requested best-effort partial work.
8. Add focused tests for the lifecycle matrix below.

For TypeScript-friendly examples, read [references/typescript-examples.md](references/typescript-examples.md).

## Required Tests

When implementing or materially changing cancellation, include tests for:

- Successful completion.
- Abort before start.
- Abort during operation.
- Abort after completion.
- Cleanup on success, abort, and failure.
- Nested cancellation propagation.
- Multiple concurrent operations sharing or using separate signals as appropriate.
- Timeout-triggered abort where applicable.

Use deterministic fake operations, fake clocks, short timers from `node:timers/promises`, explicit cleanup spies, and listener-count instrumentation where practical. Avoid sleeps that make cancellation tests flaky.

## Review And Repair Checklist

Detect and fix:

- Forgotten `AbortSignal` propagation into `fetch`, timers, streams, database/SDK calls, retries, nested services, or custom operations.
- Event-listener leaks caused by listeners that survive success or failure.
- Double resolve/reject paths in hand-written promise wrappers.
- Resource leaks from timers, streams, handles, subprocesses, workers, locks, temp files, or queue slots.
- Swallowed abort errors that make callers think work succeeded.
- Operations continuing after callers no longer need them.
- Timeout code that rejects locally but leaves underlying work running.
- Shared controllers that accidentally cancel unrelated concurrent work.

## Verification Checklist

- Public APIs accept `signal?: AbortSignal` in an options object unless an existing signature requires another shape.
- Controller ownership is explicit and lives at the operation owner, orchestration layer, CLI/request boundary, or test.
- Already-aborted signals fail before side effects whenever possible.
- Running operations stop promptly at signal-aware awaits or cooperative checkpoints.
- Nested work receives the same parent signal or a composed signal that includes it.
- Cleanup is idempotent and exercised by tests.
- Abort, timeout, and operational failures can be told apart where callers need different behavior.
- Node 24+ native APIs are used instead of ad hoc cancellation mechanisms when available.
