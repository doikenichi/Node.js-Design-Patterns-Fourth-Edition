---
name: nodejs-scalability-patterns
description: "Analyze, implement, refactor, and review Node.js scalability architecture using Scale Cube, cloning/load balancing, state management, containers, and decomposition patterns. Requires evidence before recommending scaling and avoids microservices by default."
---

# Node.js Scalability Patterns

Use this skill for production-oriented Node.js 24+ ESM systems when asked to analyze, improve, implement, refactor, or review scalability architecture. The guidance is based on Chapter 12, "Scalability and Architectural Patterns", from *Node.js Design Patterns, Fourth Edition* and the official companion examples, rewritten as engineering decision procedures and original implementation guidance.

Do not claim a scalability improvement without evidence. Do not recommend microservices by default. First identify the limiting resource, then decide whether scaling is actually required.

## Required First Pass

Before proposing architecture or changing code, identify the primary limiting resource and the evidence for it:

- `CPU`
- `memory`
- `I/O`
- `connection count`
- `database`
- `external dependency`
- `single process`
- `data volume`
- `organizational/service boundary`

Then answer:

1. What target is currently missed or at risk: latency, throughput, availability, recovery time, deployment independence, cost, or team autonomy?
2. Is the limit proven by measurements, incidents, profiling, resource saturation, queue growth, or only assumed?
3. Can the target be met by simpler fixes before scaling: algorithm changes, indexes, caching, connection pooling, streaming, backpressure, worker threads, process replication, or configuration?
4. What new operational complexity would the scaling change introduce?

If evidence is missing, recommend instrumentation, profiling, load testing, or production metric review before architecture expansion.

For a compact workflow, read [references/scaling-decision-tree.md](references/scaling-decision-tree.md).

## Context To Inspect

Inspect the codebase and runtime topology for:

- Bottleneck evidence: profiles, metrics, logs, traces, slow queries, queue depth, event-loop delay, memory growth, connection limits, dependency latency, and resource saturation.
- State management: in-memory sessions, caches, websockets, long-lived subscriptions, background jobs, locks, idempotency records, file writes, and process-local coordination.
- Failure domains: process, container, host, zone, cluster, database, broker, cache, reverse proxy, external API, and deployment unit.
- Backpressure: stream handling, queues, request limits, broker prefetch, retries, rate limits, timeouts, abort signals, and overload behavior.
- Deployment topology: single process, clustered processes, containers, reverse proxies, service discovery, Kubernetes objects, replicas, sidecars, and data stores.
- Observability: structured logs, request IDs, metrics, tracing, health/readiness probes, dashboards, alerts, and load-test baselines.
- Capacity assumptions: request mix, payload sizes, concurrency, fan-out, data volume, hot keys, CPU cores, memory limits, network limits, database limits, and dependency quotas.
- Operational complexity: ownership, on-call burden, deployment cadence, schema evolution, local development, debugging, security, and failure recovery.

## Decision Priority

Favor incremental scaling changes before architectural decomposition:

1. Fix waste in the current process: profiling, async I/O, streaming, batching, caching, query tuning, connection reuse, and backpressure.
2. Use X-axis cloning when the service can be replicated behind a load balancer and state is externalized or compatible with sticky routing.
3. Use vertical isolation inside the runtime when CPU-bound work is the limit: worker threads or separate worker processes before service extraction.
4. Use Z-axis partitioning when data volume, hot tenants, or shardable workloads are the main limit and routing keys are stable.
5. Use Y-axis decomposition only when a clear service/function boundary has independent scaling, ownership, data, release, or reliability needs.
6. Combine dimensions only when each dimension solves a named bottleneck and the added operations are acceptable.

For Scale Cube tradeoffs, read [references/scale-cube.md](references/scale-cube.md). For decomposition choices, read [references/microservices-tradeoffs.md](references/microservices-tradeoffs.md).

## Implementation Guidance

- Use modern ESM syntax and Node.js 24+ APIs. Prefer native `cluster`, `node:http`, `node:net`, `node:worker_threads`, `AbortController`, `process.availableMemory()`, `server.closeAllConnections()`, and `server.closeIdleConnections()` where appropriate and supported by the project.
- Keep services stateless unless state has an explicit owner and scaling strategy.
- Externalize shared state to durable or coordinated stores when multiple replicas must observe the same data.
- Treat sticky sessions as a compatibility tool, not a substitute for state design.
- Prefer process managers, containers, orchestrators, or platform primitives for process replication when available; avoid hand-rolled supervisors unless the project is an example or has a clear reason.
- Add health checks that distinguish liveness from readiness. Readiness should fail during startup, shutdown drain, lost critical dependencies, or overload states that should stop new traffic.
- Add graceful shutdown for HTTP servers, workers, queues, schedulers, database pools, brokers, and telemetry exporters.
- Preserve backpressure through streams, queues, and broker consumers. Do not add unbounded in-memory buffers to "scale" throughput.
- Include timeouts, cancellation, retry budgets, idempotency, and circuit-breaking decisions where cross-process or cross-service calls are introduced.
- Make failure domains visible in code and configuration. A clone, pod, worker, broker partition, or shard should have an observable identity.
- Avoid decomposition that creates distributed transactions, shared database ownership, hidden synchronous fan-out, or deployment coupling without solving a real bottleneck.

For container and Kubernetes implementation details, read [references/container-guidelines.md](references/container-guidelines.md).

## Pattern Areas

Use these choices as starting points, not prescriptions:

- Scale Cube: X-axis clones for identical replicas, Y-axis decomposition for service/function separation, Z-axis partitioning for data or tenant slices, and combined dimensions only after the independent reason for each axis is clear.
- Cloning and load balancing: replicate Node.js processes when one event loop or one process cannot use available cores or tolerate process failure. Account for cluster scheduling, sticky connections, restart behavior, shared ports, and per-process memory.
- Stateful communication: identify process-local state before horizontal scaling. Move shared sessions, pub/sub, locks, caches, and job state to explicit stores or route clients consistently when externalization is not immediately possible.
- Reverse proxies and dynamic balancing: use reverse proxies for routing, TLS termination, buffering policy, connection management, and health-aware upstream selection. Use service discovery or peer-to-peer balancing only when static upstream lists cannot reflect reality.
- Containers: keep one main process per container unless a supervisor is deliberately part of the image. Separate build-time and runtime concerns, expose health/readiness, handle signals, and size replicas from measurements.
- Application decomposition: prefer monolith or modular monolith when one deployable with strong module boundaries satisfies the target. Move to microservices only for clear independent scaling, ownership, data, reliability, or release reasons.
- Microservice integration: choose API proxy for edge unification, API orchestration for aggregating workflows with bounded fan-out, and message brokers for asynchronous work, event distribution, buffering, or decoupled availability.

## Verification Requirements

Choose verification proportional to the change and risk:

- Tests: unit, integration, contract, routing, graceful shutdown, health endpoint, shard routing, retry/idempotency, and broker consumer tests.
- Load tests: baseline before/after throughput, latency percentiles, saturation point, error rate, queue depth, and dependency pressure.
- Health checks: readiness during startup/shutdown, dependency failure, overload, and successful recovery.
- Metrics: event-loop delay, CPU, memory, GC, active handles, connections, request duration, error rate, queue depth, retry count, dependency latency, database pool usage, and per-replica traffic distribution.
- Resource observations: CPU core utilization, memory per process/container, file descriptors, sockets, network bandwidth, database connections, cache hit ratio, and external quota usage.
- Failure scenarios: process crash, rolling restart, slow dependency, database outage, broker outage, overloaded replica, killed container, lost peer, hot partition, duplicate message, and partial deployment.

When verification cannot be run locally, state the gap and provide concrete commands, metrics, or scenarios for the user to run.

## Pitfalls To Avoid

- Recommending microservices because the codebase is large rather than because a boundary solves a measured problem.
- Scaling application replicas while the database, broker, or external API is already the bottleneck.
- Using Node.js cluster without addressing process-local sessions, websocket affinity, job duplication, or graceful shutdown.
- Treating Kubernetes replica count as capacity planning.
- Adding a reverse proxy without health-aware behavior, timeout policy, request-size policy, and observability.
- Moving state to a cache without durability, eviction, consistency, or failure-mode decisions.
- Introducing asynchronous messaging without idempotent consumers, retry limits, dead-letter handling, and observability.
- Partitioning data without a stable routing key, migration plan, hot-key strategy, and cross-partition query policy.
- Using load-test averages instead of percentiles and saturation curves.
- Calling a change "scalable" because it is distributed.
