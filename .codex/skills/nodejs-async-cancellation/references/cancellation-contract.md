# Cancellation Contract

Use this reference when designing or changing an async API that supports cancellation.

## API Shape

Prefer an options object with an optional `AbortSignal`:

```ts
export interface LoadUserOptions {
  signal?: AbortSignal
}

export async function loadUser(
  userId: string,
  options: LoadUserOptions = {}
): Promise<User> {
  const { signal } = options
  signal?.throwIfAborted()
  // Work continues here.
}
```

This keeps cancellation extensible without positional parameters and matches many Node.js and web platform APIs.

## Ownership

The operation owner creates the controller. Lower-level code receives a signal.

- Request handlers, CLI commands, UI actions, scheduled jobs, orchestration functions, and tests often own `AbortController`.
- Library functions, repositories, service clients, stream helpers, and inner operations usually accept `signal?: AbortSignal`.
- A lower-level function may create its own controller only when it owns an independent child operation and still composes it with the parent signal.

## Propagation

Cancellation should travel downward through the call graph:

```ts
export async function refreshAccount(
  accountId: string,
  { signal }: { signal?: AbortSignal } = {}
): Promise<AccountSummary> {
  signal?.throwIfAborted()

  const profile = await loadProfile(accountId, { signal })
  const invoices = await listInvoices(accountId, { signal })

  return summarize(profile, invoices)
}
```

If a nested API supports cancellation, pass the signal. If it does not, wrap it only when the wrapper can also stop or release the underlying resource. Racing a promise against an abort can make the caller return early, but it does not cancel the underlying work by itself.

## Already-Aborted Signals

Check before side effects:

```ts
export async function writeReport(
  destination: URL,
  { signal }: { signal?: AbortSignal } = {}
): Promise<void> {
  signal?.throwIfAborted()
  // Open files, network connections, or locks after the preflight check.
}
```

For multi-step workflows, check again between steps that cannot themselves observe the signal.

## Running Abort

When an operation can be aborted while awaiting a non-signal-aware primitive, attach a listener that settles the operation and performs cleanup. Use a single cleanup path and make it idempotent.

Important rules:

- Use `{ once: true }` for abort listeners.
- Remove the listener when the operation completes first.
- Clear timers and close resources in cleanup.
- Avoid calling both `resolve()` and `reject()` from competing paths.
- Reject with `signal.reason` when available.

## Completion And Late Abort

After an operation has completed, later aborts should not change the completed result, run cleanup twice, or emit unhandled errors. Tests should prove late abort is harmless.

If a function returns a long-lived resource, define whether cancellation only affects startup or also closes the returned resource. For example, a canceled stream pipeline should destroy the stream graph, while a successfully returned client may require a separate `close()` or `dispose()`.

## Timeout Is A Cancellation Source

Treat timeout as one possible source of cancellation, not as a replacement for cancellation propagation.

Prefer composing signals:

```ts
const timeoutSignal = AbortSignal.timeout(5_000)
const signal = parentSignal
  ? AbortSignal.any([parentSignal, timeoutSignal])
  : timeoutSignal
```

Pass the composed signal to the underlying operation so timeout stops the work, not merely the caller's wait.

## Cancellation Versus Failure

Cancellation means the caller no longer wants the result. Ordinary failure means the operation tried to finish and could not.

Keep this distinction when callers need different behavior:

- Abort: usually no retry, expected cleanup path, often lower log level.
- Timeout: often represented as cancellation with a timeout reason, sometimes eligible for retry depending on the domain.
- Operational failure: preserve the original error and stack; do not relabel it as cancellation.

At external boundaries, translate aborts into the protocol's expected shape, such as a client-disconnect result, canceled job state, or HTTP timeout response. Keep internal code signal-oriented.

## Legacy Patterns

The Chapter 11 companion examples include simple cancellation flags, wrapper functions, and generator-driven cancellation to explain the mechanics. In new Node.js 24+ code, prefer `AbortSignal` because it is interoperable with platform APIs and composes across nested operations.

Use legacy-style wrappers only when adapting older code that cannot accept a signal directly. Even then, expose `signal` at the modern boundary and keep the adapter small.
