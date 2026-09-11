---
name: nodejs-request-batching-caching
description: "Apply, refactor, or review request coalescing, batching, memoization, caching, and in-flight promise sharing in Node.js and TypeScript when duplicate asynchronous work or repeated downstream calls are part of the task. Keeps completed-result caches, in-flight request coalescing, and true multi-request batching distinct."
---

# Node.js Request Batching And Caching

Use this skill to reduce duplicate asynchronous work safely in modern Node.js and TypeScript systems. The guidance is based on the "Asynchronous request batching and caching" material from Chapter 11, "Advanced Recipes", in *Node.js Design Patterns, Fourth Edition*, plus the official companion example in `11-advanced-recipes/04-batching-and-caching`, expressed as original engineering rules.

Do not treat cache, request coalescing, and batching as interchangeable. Name the problem first, then choose the smallest mechanism that solves it.

## Core Distinctions

- **Cache:** reuse a completed result for a defined lifetime. A cache needs a correct key, freshness policy, invalidation policy, memory bound, and failure policy.
- **Request coalescing:** let multiple callers for the same key share one currently executing operation. Remove the in-flight entry when the operation settles.
- **Batching:** group multiple independent requests, often different keys, into fewer downstream operations. A batcher needs a flush trigger, batch size limit, batching window, fairness policy, and per-caller result/error mapping.
- **Memoization:** derive and store results by function inputs. In async code, decide whether it stores only completed values, in-flight promises, or both.
- **In-flight promise sharing:** implementation technique used mostly for request coalescing and sometimes as part of async memoization. It is not, by itself, a completed-result cache.

The companion Chapter 11 example shows an expensive total-sales query, an in-flight sharing wrapper for identical product requests, and a TTL cache wrapper. Use it as a conceptual prompt, not as code to copy.

## When To Use

Activate this skill when asked to:

- Reduce duplicate HTTP, database, filesystem, SDK, queue, model, or service calls.
- Add or review caching, memoization, in-flight maps, request coalescing, DataLoader-style batching, or debounced batch queues.
- Fix cache stampedes, repeated concurrent misses, overloaded downstream services, or N+1 request patterns.
- Improve latency or throughput by batching only when measurement can show the tradeoff.
- Review correctness risks in cache keys, TTLs, invalidation, cancellation, shared mutable results, failure handling, or batch error handling.

## When NOT To Use

Prefer direct calls or ordinary concurrency control when:

- Calls are rare, cheap, or already dominated by unavoidable latency.
- Freshness requirements forbid reuse and there is no duplicate in-flight pressure.
- Requests cannot be safely keyed or grouped.
- Batching would add latency without reducing downstream work.
- The downstream API already deduplicates, caches, batches, or rate-limits in the needed way.
- A library would add more policy surface than the problem needs.

## Context To Inspect

Before changing code, inspect:

- Call sites and expected semantics: same caller, per user, per tenant, per auth scope, per request, or process-wide.
- Downstream operation identity: method, URL, SQL, resource id, filters, auth, locale, feature flags, pagination, headers, body, and consistency options.
- Existing cache or memoization layers, especially hidden module-level state.
- Cache key construction, collision risk, canonicalization, and whether keys include security or tenant boundaries.
- Cache lifetime, stale data tolerance, invalidation triggers, write paths, and read-after-write expectations.
- Error handling: transient vs permanent failures, negative caching, retry behavior, and whether failures are ever cached.
- In-flight promises, duplicate concurrent requests, cleanup after success/failure, and cache stampede protection.
- Concurrency limits, batch size, batching window, fairness, latency added by waiting, starvation risk, and backpressure.
- Memory limits, eviction behavior, cardinality of keys, object mutation, and result cloning or freezing.
- Cancellation behavior: per-caller `AbortSignal`, shared downstream cancellation, timeout ownership, and late subscribers.
- Per-caller errors and partial failures in batched operations.
- Metrics, tracing, logs, benchmarks, and tests that can prove downstream call count, latency, batch size, and hit/miss behavior.

## Strategy Selection

Use [references/strategy-selection.md](references/strategy-selection.md) when choosing between completed-result caching, request coalescing, async memoization, and true batching. It includes selection criteria, tradeoffs, and signs that a proposed mechanism is solving the wrong problem.

## Correctness Rules

Use [references/cache-correctness.md](references/cache-correctness.md) before implementing or reviewing production behavior. It covers key correctness, lifetime, invalidation, error caching, mutable results, cache stampede protection, unbounded memory, batch starvation, cancellation, and partial failures.

## Implementation Guidance

- Prefer a small local wrapper when the policy is simple and visible.
- Use established cache libraries only when their behavior is needed: TTL precision, LRU/LFU eviction, stale-while-revalidate, distributed coordination, metrics, persistence, or cluster-wide invalidation.
- Do not add a dependency for a `Map` plus clear ownership when that is enough.
- Keep cache and in-flight stores private to the wrapper or injected dependency. Avoid exporting mutable global maps.
- Include explicit names in code such as `completedCache`, `inFlightByKey`, `pendingBatch`, `maxBatchSize`, and `batchWindowMs`.
- Normalize keys with structured data rather than fragile string concatenation when inputs are complex.
- Remove in-flight entries in `finally` or equivalent settlement handling.
- Do not permanently cache failures unless the domain requires negative caching with a short explicit lifetime.
- Protect callers from shared mutable cached objects by returning immutable values, copies, or domain objects that are safe to share.
- In batchers, map every requested key to exactly one result or error. A failed item must not corrupt unrelated callers.
- Make cancellation semantics explicit. One caller aborting should not usually cancel the shared downstream request for all other callers.

For original TypeScript sketches, read [references/typescript-examples.md](references/typescript-examples.md).

## Verification Requirements

Never claim a performance improvement without measurement. Verification should include the mechanism's intended effect and its failure modes:

- Downstream call count before and after for duplicate sequential and concurrent requests.
- Latency distribution, including any latency added by a batching window.
- Cache hit, miss, eviction, TTL expiry, and invalidation behavior.
- Concurrent request tests proving one in-flight downstream call for duplicate keys when coalescing is intended.
- Batch size and flush behavior tests for max size, timer flush, fairness, and starvation prevention.
- Failure tests for transient errors, rejected in-flight promises, failed batches, partial batch failures, and per-caller error delivery.
- Memory or cardinality tests for bounded caches when key space can grow.
- Cancellation tests for shared operations and independent callers when `AbortSignal` is supported.

## Common Pitfalls

- Calling in-flight sharing "cache" without completed-result reuse.
- Calling same-key coalescing "batching" when no independent requests are grouped.
- Omitting tenant, auth, locale, projection, or consistency options from the key.
- Building keys with ambiguous concatenation such as `${a}:${b}` when inputs can contain delimiters.
- Letting a rejected promise remain in a cache forever.
- Caching mutable objects that one caller can modify for later callers.
- Creating an unbounded `Map` on a hot path.
- Adding a batching delay that is larger than the downstream work it saves.
- Allowing a steady stream of requests to keep postponing flush forever.
- Treating a whole-batch failure as a successful cache fill for each item.
- Losing per-caller cancellation, timeout, auth, or error semantics when requests are combined.
