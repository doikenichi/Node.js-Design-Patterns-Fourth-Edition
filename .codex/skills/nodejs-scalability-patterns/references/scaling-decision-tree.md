# Scaling Decision Tree

Use this procedure before implementing scalability changes. It is intentionally conservative: scaling is useful only when it addresses a measured or credible limit.

## 1. Establish The Target

Name the target before architecture:

- Throughput: requests, jobs, messages, bytes, or writes per second.
- Latency: p50, p95, p99, timeout rate, or tail behavior under load.
- Availability: uptime, recovery time, restart behavior, brownout tolerance, or dependency isolation.
- Cost: resource usage per unit of work.
- Operability: deploy frequency, ownership, debugging, observability, or blast radius.

If no target exists, propose instrumentation and a baseline instead of scaling work.

## 2. Identify The Limiting Resource

Classify the bottleneck:

- CPU: high CPU, event-loop delay, slow synchronous code, expensive serialization, crypto, compression, image/video/data processing, or regex/parsing hot paths.
- Memory: heap growth, GC pressure, leaks, large buffers, unbounded caches, fan-out response aggregation, or per-connection memory.
- I/O: filesystem, network bandwidth, slow streams, large uploads/downloads, or blocked pipelines.
- Connection count: socket/file descriptor limits, HTTP keep-alive pressure, websocket count, database pool exhaustion, or broker channel limits.
- Database: slow queries, lock contention, missing indexes, write bottlenecks, pool saturation, replication lag, or transaction contention.
- External dependency: provider latency, quotas, failures, rate limits, tail latency, or costly synchronous calls.
- Single process: one Node.js process cannot use available CPU cores, crashes take down all traffic, or one event loop handles incompatible workloads.
- Data volume: shardable growth, hot tenants, large working set, region locality, or cross-partition reporting needs.
- Organizational/service boundary: team ownership, release isolation, compliance boundary, or independent lifecycle.

If several resources are plausible, rank them by evidence and risk. Avoid solving the most interesting problem before proving it is the limiting one.

## 3. Choose The Smallest Effective Move

Match the bottleneck to an incremental change:

| Limiting resource | Prefer first | Scale pattern if still needed |
| --- | --- | --- |
| CPU | Profile, remove sync hot paths, use worker threads/process workers for CPU jobs | X-axis replicas or split CPU-heavy function/service |
| Memory | Fix leaks, bound caches, stream large payloads, reduce buffering | X-axis replicas with memory limits, or isolate memory-heavy workload |
| I/O | Preserve stream backpressure, batch, reuse connections, tune timeouts | X-axis replicas if upstream/downstream can absorb load |
| Connection count | Pooling, keep-alive policy, websocket strategy, OS/container limits | X-axis replicas, reverse proxy, sticky routing when needed |
| Database | Index/query/schema tuning, caching, read replicas, pool sizing | Z-axis partitioning, extracted data-owning service only if justified |
| External dependency | Caching, timeout, retry budget, circuit breaker, async workflow | Brokered integration, service isolation, or fallback path |
| Single process | Cluster/process manager, container replicas, graceful restart | Orchestrator-managed replicas and load balancing |
| Data volume | Archival, indexing, storage layout, query shape changes | Z-axis partitioning/sharding |
| Org boundary | Modular monolith and explicit interfaces | Y-axis service decomposition |

## 4. Validate State And Traffic

Before horizontal scaling, identify:

- Sessions, auth state, CSRF state, rate-limit counters, websocket rooms, subscription registries, caches, locks, schedulers, job queues, and file writes.
- Whether each state item is per-request, per-client, per-process, shared, durable, ephemeral, or derived.
- Whether state can be externalized, recomputed, partitioned, made idempotent, or temporarily handled with sticky routing.

Do not add replicas until duplicated or isolated state has a defined behavior.

## 5. Design For Failure And Backpressure

Every scaling change should answer:

- What happens when one process, container, replica, peer, broker, cache, database, or dependency fails?
- How does the system stop accepting work it cannot finish?
- Which queues are bounded, and what is the overload response?
- Are retries capped and jittered?
- Are messages idempotent or deduplicated?
- Can in-flight HTTP requests, streams, and jobs drain during shutdown?

Production code should include timeouts, cancellation, and clear error propagation around cross-boundary calls.

## 6. Deployment Topology Review

Document the runtime shape:

- Entrypoints: HTTP servers, workers, schedulers, consumers, CLIs.
- Processes per host/container and containers per service.
- Reverse proxies, load balancers, service discovery, DNS, ingress, and TLS termination.
- Critical dependencies and their connection pools.
- Health, readiness, and graceful shutdown behavior.
- Rollout strategy: restart, rolling update, blue/green, canary, or manual.

If the topology is not observable, add logs and metrics before making it more distributed.

## 7. Verification Plan

Use at least one evidence source for every claim:

- Tests for routing, shutdown, health checks, state externalization, idempotency, and failure paths.
- Load tests with before/after p95 or p99 latency, throughput, error rate, event-loop delay, CPU, memory, connection count, and dependency metrics.
- Health-check exercises for startup, shutdown, and dependency degradation.
- Resource observations under expected and peak concurrency.
- Failure scenarios such as killing a worker, restarting a pod, pausing a dependency, overloading a partition, or duplicating a message.

If verification cannot be completed, report the unverified assumption in plain language.

## Recommendation Rules

- If the bottleneck is unknown, recommend measurement.
- If a simpler fix meets the target, avoid scaling.
- If the service has process-local shared state, resolve state before X-axis scaling.
- If the database is the limit, do not add web replicas as the primary fix.
- If the boundary is mostly organizational, try modular monolith boundaries before microservices unless independent deployment is required.
- If a scaling change makes failure behavior worse, include the reliability work in the same recommendation.
