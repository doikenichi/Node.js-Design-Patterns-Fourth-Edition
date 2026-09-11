# Async Iteration

Use this reference when behavior depends on lazy traversal, async data sources, generators, or Node.js stream integration.

## Protocols

- Iterator protocol: an object has `next()` returning `{ value, done }`.
- Iterable protocol: an object has `[Symbol.iterator]()` returning an iterator, which enables `for...of`, spread, and many iterator helpers in runtimes that support them.
- Async iterator protocol: `next()` may return a promise for `{ value, done }`.
- Async iterable protocol: an object has `[Symbol.asyncIterator]()` returning an async iterator, which enables `for await...of`.

Prefer generator functions (`function*`) and async generator functions (`async function*`) for custom iteration. Manual `next()` objects are useful only when you need fine-grained protocol control.

## Design Rules

- Keep iteration lazy. Do not materialize all values unless the consumer explicitly asks for an array or summary.
- Make each yielded value a stable contract. Avoid yielding mixed shapes unless using a discriminated union.
- Decide how per-item failures behave: yield an error result, skip the item, retry, or throw to stop the sequence.
- Preserve cancellation. Accept an `AbortSignal` for long-running async iteration and check it between awaits.
- Clean up resources in `finally`, especially files, cursors, sockets, locks, and temporary subscriptions.
- Bound concurrency deliberately. Sequential `for await` is simple but may be slow; concurrent mapping needs limits and ordering decisions.
- Avoid putting unbounded queues behind an async iterator unless there is backpressure or a clear drop policy.

## Async Generator Skeleton

```ts
export type UrlStatus =
  | { ok: true; url: string; status: number }
  | { ok: false; url: string; reason: string }

export async function* checkUrls(
  urls: Iterable<string>,
  options: {
    fetchHead: (url: string, init: { signal: AbortSignal }) => Promise<Response>
    timeoutMs: number
    signal?: AbortSignal
  },
): AsyncGenerator<UrlStatus> {
  for (const url of urls) {
    if (options.signal?.aborted) {
      throw options.signal.reason ?? new Error("url check aborted")
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs)

    try {
      const response = await options.fetchHead(url, { signal: controller.signal })
      yield response.ok
        ? { ok: true, url, status: response.status }
        : { ok: false, url, reason: `${response.status} ${response.statusText}` }
    } catch (error) {
      yield {
        ok: false,
        url,
        reason: error instanceof Error ? error.message : String(error),
      }
    } finally {
      clearTimeout(timeout)
    }
  }
}
```

This keeps failures explicit as yielded values. If a failed item should stop the entire sequence, throw instead and test that behavior.

## Node.js Streams

Node.js readable streams are async iterable, so `for await (const chunk of readable)` is often the simplest consumer. Use `Readable.from(iterable)` when an iterator should participate in stream APIs.

```ts
import { Readable } from "node:stream"

const source = Readable.from(checkUrls(urls, { fetchHead, timeoutMs: 5000 }))

const summary = await source.reduce(
  (acc, status) => {
    status.ok ? acc.up++ : acc.down++
    return acc
  },
  { up: 0, down: 0 },
)
```

When converting between async iterators and streams:

- Streams add backpressure, piping, object mode, transform utilities, and ecosystem integration.
- Async iterators add direct syntax, simple dependency injection, and straightforward tests.
- Use `stream/promises.pipeline()` for multi-stream pipelines where errors and cleanup must be coordinated.
- Verify object mode and encoding. Buffer chunks, strings, and objects have different expectations.

## Boundary Tests

Async iterator tests should cover:

- Empty input completes without fetching.
- One item yields exactly one result.
- Multiple items preserve or intentionally relax order.
- Source throws or rejects.
- Consumer breaks early and cleanup runs.
- Timeout or cancellation aborts pending work.
- Per-item failure either yields a failure value or stops the iterator, according to the contract.
- Large or unbounded input is processed lazily rather than buffered.

Use fake `fetch`, fake cursors, and controllable promises so tests do not depend on network timing.
