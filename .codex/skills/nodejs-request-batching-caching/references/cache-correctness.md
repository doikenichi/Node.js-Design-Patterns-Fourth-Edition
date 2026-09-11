# Cache Correctness

Use this reference before implementing or reviewing caching, coalescing, memoization, in-flight promise sharing, or request batching.

## Cache Key Correctness

A key must describe every input that can change the result.

Include, when relevant:

- Operation name or resource type.
- Resource id, query filters, sort order, projection, pagination, and version.
- Tenant, account, user, role, auth scope, entitlement, locale, timezone, currency, feature flags, and experiment bucket.
- Consistency/read preference, isolation level, region, API version, and serialization format.
- Negative-result scope, such as "missing for tenant A" rather than "missing globally".

Prefer structured canonical keys:

- Normalize case only when the domain is case-insensitive.
- Sort unordered filters before serialization.
- Use stable JSON only when property order is controlled, or construct tuple-like arrays and serialize them deterministically.
- Avoid delimiter-based string concatenation for arbitrary user inputs.
- Hash large keys only after preserving a collision-resistant canonical payload.

## Lifetime And Freshness

Every completed-result cache needs a lifetime policy:

- TTL for approximate freshness.
- Explicit invalidation from writes, events, or domain commands.
- Versioned keys when upstream data has revisions.
- Request-scoped caches for per-request duplicate reads.
- Stale-while-revalidate only when stale data is acceptable.

Name the stale-data tolerance in code or tests. For writes, define whether readers must see their own writes immediately and whether invalidation happens before or after the write commits.

## Error Caching

Failures are not all alike:

- Transient failures should usually evict in-flight and completed entries immediately.
- Permanent negative results, such as a stable 404, may be cached with an explicit short TTL and a key scoped to the caller's permissions.
- Authorization failures should rarely be shared across users or cached broadly.
- Rate-limit responses may need a separate backoff policy rather than ordinary result caching.

Never leave a rejected promise in a completed cache by accident. If failures are cached deliberately, test expiry and recovery.

## In-Flight Promises

For request coalescing:

- Insert the in-flight promise before awaiting it.
- Return the same promise or a per-caller wrapper to concurrent equivalent callers.
- Delete the in-flight entry when the promise settles.
- Keep completed-result caching separate from the in-flight map unless the policy explicitly combines them.
- Ensure late callers after settlement follow the intended path: cache hit, fresh downstream call, or explicit miss.

Use `try`/`finally`, `.finally()`, or settlement handlers carefully so cleanup runs after both success and failure. Avoid cleanup handlers that throw and mask the original error.

## Cache Stampede Protection

A stampede happens when many callers miss and all trigger the same expensive work.

Mitigations:

- Coalesce concurrent misses by key.
- Refresh ahead of expiry only with a single refresh owner per key.
- Add jitter to TTLs when many keys expire together.
- Use distributed locks or a shared cache only when multiple processes can stampede the same downstream service.
- Serve stale values during refresh only when the domain allows it.

Measure downstream call count under concurrent miss load.

## Memory Bounds

Do not use an unbounded process-wide `Map` for high-cardinality keys.

Pick a bound:

- Max entries.
- Max total estimated bytes.
- TTL with active or lazy eviction.
- LRU/LFU library when eviction quality matters.
- Request-scoped lifetime when reuse is only useful during one request.

Add observability for size, evictions, and high-cardinality key patterns when the cache is long-lived.

## Shared Mutable Results

If a cached value is an object, array, `Buffer`, `Map`, `Set`, typed array, stream, or class instance, decide whether it is safe to share.

Options:

- Return immutable DTOs.
- Freeze recursively when the shape is small and plain.
- Return defensive copies or `structuredClone()` for plain cloneable data.
- Keep mutable resources out of cache entries.
- Document when callers own the returned object and must not mutate it.

Test that one caller cannot corrupt a later caller's result when mutation is plausible.

## Batching Correctness

A batcher must make progress predictably.

Required protections:

- Flush at max batch size.
- Flush after a bounded window or next event loop turn.
- Do not reset the oldest request's deadline every time a new request arrives.
- Keep a max queue length or backpressure policy.
- Preserve per-caller ordering only if the API promises ordering.
- Map item-level results by key, not by array index, unless the downstream API guarantees index alignment.
- Resolve duplicate keys consistently: share one downstream item or return distinct mapped responses as required.
- Split oversized input into multiple batches.

Batch starvation occurs when pending work keeps waiting for "just a few more" requests. Use a deadline based on the first queued item.

## Batch Failure Isolation

A failed batch must not corrupt unrelated requests.

Rules:

- If the whole downstream call fails, reject each pending caller with the same operation failure and do not populate the completed cache.
- If the downstream call returns item-level failures, resolve successful items and reject only failed items.
- If a requested key is missing from a partial response, reject or resolve that caller according to the domain contract; do not silently return another key's result.
- Clear pending state after settlement even when mapping code throws.
- Do not cache successful-looking placeholders for failed items.

Add tests for complete batch failure, partial failure, missing item, and duplicate key behavior.

## Cancellation Behavior

Cancellation needs explicit ownership:

- A single caller aborting a coalesced request should usually detach that caller, not abort the shared downstream work for everyone.
- The shared downstream operation may be aborted when all interested callers have aborted.
- Per-caller timeouts can reject that caller while the shared work continues for others.
- A batch item can be removed before flush if its caller aborts and no other caller needs the same key.
- Once a batch has been sent, per-caller abort may only affect local delivery unless the downstream API supports item-level cancellation.

Document and test the chosen behavior.

## Verification Checklist

- Cache keys distinguish every input that changes the result.
- TTL, invalidation, stale tolerance, and read-after-write semantics are explicit.
- Rejections are evicted or cached only under a deliberate negative-cache policy.
- In-flight entries are inserted before await and removed after settlement.
- Concurrent duplicate misses make one downstream call when coalescing is intended.
- Cache memory is bounded or scoped.
- Returned cached values cannot be mutated across callers.
- Batch size, window, queue length, fairness, and latency impact are measured or tested.
- Batch failures are isolated per caller.
- Cancellation semantics are tested for one aborted caller, all aborted callers, and post-flush behavior when relevant.
