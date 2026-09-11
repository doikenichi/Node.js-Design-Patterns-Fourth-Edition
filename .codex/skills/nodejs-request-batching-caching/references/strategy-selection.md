# Strategy Selection

Use this reference when deciding which duplicate-work reduction strategy belongs in a Node.js or TypeScript implementation.

## Quick Selection

- Choose **request coalescing** when many callers ask for the same key at the same time, but completed results should not be reused after the operation settles.
- Choose **cache** when a completed result can be reused for a known lifetime or until invalidated.
- Choose **cache plus coalescing** when repeated completed reads are acceptable and concurrent misses would otherwise stampede the downstream service.
- Choose **batching** when many independent requests can be combined into fewer downstream calls, such as `getUsers([id1, id2, id3])`.
- Choose **memoization** when the function is referentially stable enough that input-derived storage is correct. For async functions, state whether it memoizes in-flight promises, settled results, or both.
- Choose **neither** when the key cannot be made correct, freshness is strict, the operation is cheap, or the added policy cannot be verified.

## Decision Questions

1. Are duplicate requests for the exact same logical work happening concurrently?
2. Can a result be reused after the first operation completes?
3. How stale can the result be: never, milliseconds, seconds, minutes, or until an explicit invalidation event?
4. Are requests independent but combinable into one downstream operation?
5. Does batching save enough work to justify the added wait?
6. Does the caller need per-request cancellation, deadlines, auth, tracing, or error handling?
7. Is the key space bounded, or does storage need eviction and memory limits?
8. Can tests or instrumentation show downstream call count, latency, hit/miss behavior, and batch size?

## Cache

A cache stores completed outcomes. Use it when correctness allows reuse after completion.

Required policy:

- Key construction and canonicalization.
- Lifetime: TTL, explicit invalidation, versioning, event-driven invalidation, or request-scoped lifetime.
- Stale data tolerance and read-after-write expectations.
- Memory bound and eviction behavior.
- Error policy, including whether negative results or failures are cached.
- Mutation policy for returned values.

Cache examples include expensive read models, metadata, config, id-to-record lookups, and stable remote responses. Do not cache a user-specific response under a key that omits user or permission scope.

## Request Coalescing

Request coalescing stores currently executing work by key. It reduces duplicate concurrent work without promising reuse after completion.

Use it for expensive idempotent reads where overlapping calls are common and freshness must remain close to real time. Remove the entry when the promise settles so later calls can issue fresh work.

Coalescing is often enough for cache stampede protection when paired with a completed-result cache: the first miss creates one in-flight operation, and concurrent misses await it.

Avoid coalescing when each caller has a meaningfully different context that affects the downstream operation, such as different credentials, projections, isolation levels, or deadlines that must control the shared operation.

## Batching

Batching groups different requests into fewer downstream operations. It is useful when the downstream interface supports bulk access or can be adapted to it efficiently.

Required policy:

- Batch size limit.
- Batching window or scheduling trigger.
- Flush conditions: timer, max size, explicit drain, or event loop turn.
- Fairness so older requests are not delayed indefinitely by new arrivals.
- Per-caller resolution so each request receives only its own result or error.
- Partial failure handling.
- Duplicate key handling inside a batch.
- Backpressure when too many pending requests accumulate.

Batching usually trades a small wait for fewer downstream operations. Measure both sides: saved calls and added latency.

## Memoization

Memoization is function-level caching by input. It is safe only when the function is deterministic for the chosen key and side effects are absent or intentionally hidden.

For async work, clarify the state being memoized:

- In-flight promises only: request coalescing.
- Settled values only: completed-result cache.
- In-flight promises that become cached values: cache plus stampede protection.
- Rejections: usually evict immediately, or cache only with a short negative TTL for known stable failures.

Avoid broad memoization decorators around functions whose behavior depends on time, auth, environment, hidden mutable state, database isolation, or external side effects unless those inputs are part of the key and lifetime policy.

## Combined Patterns

Common safe combinations:

- **Cache plus coalescing:** check completed cache, then in-flight map, then downstream. On success, fill cache and clear in-flight. On failure, clear in-flight and avoid long failure caching.
- **Batching plus per-key cache:** satisfy cached keys immediately; enqueue misses; populate completed cache only for successful returned items.
- **Request-scoped DataLoader-style batching:** use a short-lived batcher per incoming request to avoid cross-user leaks and N+1 calls.
- **Stale-while-revalidate:** serve stale values only when the domain tolerates it, and coalesce refreshes so one refresh runs per key.

## Red Flags

- The proposed key omits tenant, auth, locale, projection, feature flags, or consistency options.
- A `Map` grows forever in a server process.
- A rejected promise is left in storage for all future callers.
- The implementation returns cached mutable arrays or objects directly.
- Batching waits on a timer but has no max size or max age.
- A failed batch rejects every caller even when item-level results were available.
- Performance claims rely on intuition instead of call counts, latency, and hit/miss metrics.
