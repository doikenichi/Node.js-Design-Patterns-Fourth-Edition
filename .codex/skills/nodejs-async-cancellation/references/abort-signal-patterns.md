# AbortSignal Patterns

Use this reference while implementing cancellation details in JavaScript or TypeScript.

## Basic Signal-Aware Function

```ts
import { setTimeout as delay } from 'node:timers/promises'

export async function waitForCacheWarmup(
  key: string,
  { signal }: { signal?: AbortSignal } = {}
): Promise<void> {
  signal?.throwIfAborted()

  while (!(await isCacheWarm(key, { signal }))) {
    await delay(100, undefined, { signal })
  }
}
```

Use signal-aware primitives so aborting also stops the awaited work.

## Manual Promise Wrapper

Use this shape only when there is no signal-aware primitive available:

```ts
export function waitForEvent<T>(
  target: EventTarget,
  eventName: string,
  { signal }: { signal?: AbortSignal } = {}
): Promise<T> {
  signal?.throwIfAborted()

  return new Promise<T>((resolve, reject) => {
    let settled = false

    const cleanup = () => {
      target.removeEventListener(eventName, onEvent as EventListener)
      signal?.removeEventListener('abort', onAbort)
    }

    const settle = (fn: () => void) => {
      if (settled) return
      settled = true
      cleanup()
      fn()
    }

    const onEvent = (event: Event) => {
      settle(() => resolve(event as T))
    }

    const onAbort = () => {
      settle(() => reject(signal?.reason))
    }

    target.addEventListener(eventName, onEvent as EventListener, { once: true })
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}
```

The important parts are the preflight abort check, one cleanup path, listener removal, and a settlement guard.

## Fetch

```ts
export async function fetchJson<T>(
  url: string | URL,
  { signal }: { signal?: AbortSignal } = {}
): Promise<T> {
  signal?.throwIfAborted()

  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  return response.json() as Promise<T>
}
```

Pass the signal directly. Do not race `fetch()` against a timeout promise when `AbortSignal.timeout()` or a caller-provided signal can cancel the request itself.

## Timers

Prefer `node:timers/promises`:

```ts
import { setTimeout as delay } from 'node:timers/promises'

await delay(1_000, undefined, { signal })
```

For callback timers, clear the timer in cleanup and reject on abort.

## Streams

Use signal-aware helpers when available:

```ts
import { pipeline } from 'node:stream/promises'

export async function copyStream(
  source: NodeJS.ReadableStream,
  destination: NodeJS.WritableStream,
  { signal }: { signal?: AbortSignal } = {}
): Promise<void> {
  signal?.throwIfAborted()
  await pipeline(source, destination, { signal })
}
```

When wiring streams manually, abort should destroy or close the stream resources according to their API. Also preserve backpressure and handle stream errors separately from abort.

## Composing Parent Cancellation With Timeout

```ts
export function withTimeoutSignal(
  timeoutMs: number,
  parentSignal?: AbortSignal
): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  return parentSignal
    ? AbortSignal.any([parentSignal, timeoutSignal])
    : timeoutSignal
}
```

Use the composed signal in every nested operation. This avoids the common bug where the outer promise times out while inner work keeps running.

## Concurrent Operations

Use one shared signal when a parent operation should cancel all children:

```ts
await Promise.all([
  loadProfile(id, { signal }),
  loadPermissions(id, { signal }),
  loadPreferences(id, { signal })
])
```

Use separate controllers when each operation has independent ownership. Never reuse one controller across unrelated user requests, jobs, tests, or tenants.

## Wrapping Callback Or Event APIs

When adapting callback APIs:

- Check `signal?.throwIfAborted()` before starting.
- Store handles returned by the API.
- On abort, unregister callbacks and call the API's cancel, close, destroy, or unsubscribe function if one exists.
- Ensure late callbacks after abort cannot resolve an already rejected promise.
- Preserve real callback errors as real errors.

If the underlying API cannot be stopped and the work is expensive or side-effecting, document that limitation and prefer replacing the API over pretending cancellation is complete.

## Async Iterators And Loops

Check cancellation between iterations and pass the signal to each awaited operation:

```ts
export async function* pollItems(
  { signal }: { signal?: AbortSignal } = {}
): AsyncGenerator<Item> {
  while (true) {
    signal?.throwIfAborted()
    yield await readNextItem({ signal })
  }
}
```

If the iterator owns resources, release them in `finally`.

## Cleanup Exactly Once

Use a small idempotent cleanup function for resources that can be released from multiple paths:

```ts
let cleaned = false

function cleanup() {
  if (cleaned) return
  cleaned = true
  // remove listeners, clear timers, close handles
}
```

Call cleanup from success, abort, and failure paths. If cleanup can fail, decide whether that failure should replace the primary error; most code should preserve the primary failure and log or aggregate cleanup failures only when the domain requires it.

## Error Identification

Prefer robust checks over string-only matching:

```ts
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
```

Some APIs reject with `signal.reason`, which may be a custom error. When the project supplies explicit cancellation reasons, check identity or a shared error type at the boundary that owns those reasons.
