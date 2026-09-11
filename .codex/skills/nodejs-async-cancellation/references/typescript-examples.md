# TypeScript Examples

These examples are intentionally small. Adapt them to the target codebase's style, test framework, lint rules, and public error contract.

## Cancelable Custom Operation

```ts
import { setTimeout as delay } from 'node:timers/promises'

export interface BuildIndexOptions {
  signal?: AbortSignal
}

export async function buildIndex(
  documents: readonly Document[],
  { signal }: BuildIndexOptions = {}
): Promise<Index> {
  signal?.throwIfAborted()

  const index = createEmptyIndex()

  for (const document of documents) {
    signal?.throwIfAborted()
    const tokens = await tokenize(document, { signal })
    index.add(document.id, tokens)
    await delay(0, undefined, { signal })
  }

  return index
}
```

## API Boundary Owns The Controller

```ts
export async function handleRefreshRequest(
  request: Request
): Promise<Response> {
  const timeoutSignal = AbortSignal.timeout(10_000)
  const signal = AbortSignal.any([request.signal, timeoutSignal])

  try {
    const result = await refreshDashboard({ signal })
    return Response.json(result)
  } catch (error) {
    if (isAbortLike(error)) {
      return new Response(null, { status: 499 })
    }
    throw error
  }
}
```

The boundary composes cancellation sources. Inner functions receive the signal.

## Nested Propagation

```ts
export async function refreshDashboard(
  { signal }: { signal?: AbortSignal } = {}
): Promise<Dashboard> {
  signal?.throwIfAborted()

  const [accounts, alerts] = await Promise.all([
    fetchAccounts({ signal }),
    fetchAlerts({ signal })
  ])

  return { accounts, alerts }
}
```

If one parent signal aborts, both child operations should observe it.

## Wrapping A Non-Signal-Aware API

```ts
export function readFromLegacyClient(
  client: LegacyClient,
  key: string,
  { signal }: { signal?: AbortSignal } = {}
): Promise<Buffer> {
  signal?.throwIfAborted()

  return new Promise((resolve, reject) => {
    let settled = false
    const request = client.read(key, onComplete)

    const cleanup = () => {
      signal?.removeEventListener('abort', onAbort)
    }

    const settle = (fn: () => void) => {
      if (settled) return
      settled = true
      cleanup()
      fn()
    }

    function onComplete(error: Error | null, value?: Buffer) {
      settle(() => {
        if (error) reject(error)
        else resolve(value ?? Buffer.alloc(0))
      })
    }

    function onAbort() {
      request.cancel?.()
      settle(() => reject(signal?.reason))
    }

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}
```

This wrapper prevents double settlement and removes its abort listener. It only claims real cancellation if `request.cancel()` stops or releases the underlying work.

## Timeout Triggered Abort

```ts
export async function loadWithTimeout<T>(
  operation: (options: { signal: AbortSignal }) => Promise<T>,
  timeoutMs: number,
  parentSignal?: AbortSignal
): Promise<T> {
  const timeoutSignal = AbortSignal.timeout(timeoutMs)
  const signal = parentSignal
    ? AbortSignal.any([parentSignal, timeoutSignal])
    : timeoutSignal

  return operation({ signal })
}
```

Pass the composed signal into the operation instead of racing from outside.

## node:test Lifecycle Cases

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'

test('aborts during operation and runs cleanup once', async () => {
  const controller = new AbortController()
  let cleanupCount = 0

  const operation = async ({ signal }: { signal: AbortSignal }) => {
    signal.throwIfAborted()
    try {
      await delay(1_000, undefined, { signal })
    } finally {
      cleanupCount += 1
    }
  }

  const promise = operation({ signal: controller.signal })
  controller.abort()

  await assert.rejects(promise)
  assert.equal(cleanupCount, 1)
})
```

Also add tests for success, abort before start, abort after completion, nested propagation, concurrent operations, and timeout-triggered abort when applicable.

## Testing Listener Cleanup

For custom wrappers, instrument the wrapper's event source or cancellation adapter so tests can assert listeners are removed after success, abort, and failure. Avoid depending on private Node internals.

```ts
class TrackedEventTarget extends EventTarget {
  activeListeners = 0

  override addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean
  ): void {
    this.activeListeners += 1
    super.addEventListener(type, listener, options)
  }

  override removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean
  ): void {
    this.activeListeners -= 1
    super.removeEventListener(type, listener, options)
  }
}
```

When instrumentation is too invasive, assert observable cleanup instead: no timer handles remain, streams are destroyed, temporary resources are removed, queue slots are released, and late callbacks cannot change the settled result.
