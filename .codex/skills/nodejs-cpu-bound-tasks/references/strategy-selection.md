# Strategy Selection

The Chapter 11 companion code in `11-advanced-recipes/09-cpu-bound` demonstrates the same CPU task implemented on the main thread, interleaved with deferred execution, delegated to child processes, and delegated to worker threads with pools. Use that shape as architectural context only; produce original code and explanations.

## First Classify The Bottleneck

Collect enough evidence to classify the workload before changing architecture:

- I/O-bound: high elapsed time with low CPU, requests blocked on database/network/file/queue timings, event-loop delay usually normal.
- CPU-bound: one or more cores are saturated, synchronous JavaScript stacks dominate profiles, event-loop delay rises during work, timers and requests are delayed.
- Memory-bound: high RSS/heap, GC pauses, large copies or JSON serialization, frequent promotion or allocation churn.
- External-system-bound: upstream latency, rate limits, locks, queue lag, or service saturation explain the delay.

Use profiling, timers, `perf_hooks`, load tests, and production telemetry where available. Avoid treating a slow `Promise` as CPU-bound unless profiling shows CPU work inside it.

## Option Matrix

| Situation | Prefer | Why | Watch |
| --- | --- | --- | --- |
| Small bounded computation | Main thread | Lowest complexity and no IPC overhead | Event-loop delay and p95/p99 latency |
| Long loop where the app must remain responsive | Chunking plus yielding | Lets timers, sockets, and callbacks run between chunks | Total runtime can increase; no CPU parallelism |
| Need CPU parallelism in one Node.js service | Worker threads | Separate JS execution threads with message passing | Serialization, worker lifecycle, memory, crash handling |
| Need strong isolation, separate runtime, CLI, or crash containment | Child process | OS process boundary and flexible executable choice | Startup cost, IPC cost, process supervision |
| Many recurring CPU jobs | Bounded pool | Reuses workers and controls concurrency | Queue depth, backpressure, worker leaks |

## Event-Loop Interleaving

Chunking divides a long computation into smaller units and yields control after each unit, commonly with `setImmediate` in Node.js. It helps when the problem is responsiveness: timers fire, HTTP callbacks run, and other queued work gets chances to proceed.

Chunking does not create CPU parallelism. The same thread still performs the same CPU work, just spread across turns of the event loop. Use it when:

- Users need progress updates or cancellation checks.
- The service must avoid long event-loop stalls.
- The workload is occasional enough that parallel execution is not justified.
- State is cheap to pause and resume between chunks.

Avoid chunking when:

- The goal is to reduce wall-clock time through parallel CPU execution.
- The chunks require expensive state reconstruction.
- The work is repeated and would build an unbounded in-process backlog.

## External Processes

Use `node:child_process` or a process manager when process isolation matters. A child process can crash without taking the parent with it, can run with different privileges or flags, and can wrap non-JavaScript tools.

Design explicit IPC:

- Define request and response message schemas.
- Include request IDs for correlation.
- Propagate errors in structured form.
- Enforce timeouts and kill policies.
- Treat process exit, signal, and IPC disconnect as failure paths.

Costs to include in the decision:

- Process startup and warmup.
- Serialization across IPC.
- Memory duplication between processes.
- Extra deployment and observability surface.

## Worker Threads

Use `Worker` when CPU parallelism inside a Node.js process is the right fit. Each worker has its own JS execution context and communicates by message passing. Repeated jobs should use a bounded pool rather than creating a worker per request.

Prefer worker threads when:

- Work is CPU-bound and parallelizable.
- Data transfer is modest or can use transfer lists.
- Isolation requirements do not require an OS process.
- The service can manage worker lifecycle and failure handling.

Avoid or revisit worker threads when:

- The operation is ordinary async I/O.
- Serialization is more expensive than the computation.
- The algorithm needs heavy shared mutable state.
- Memory pressure increases enough to erase throughput gains.

Use `SharedArrayBuffer` only when the design genuinely requires shared memory and the team is prepared to handle synchronization with `Atomics`. Prefer message passing and transferable `ArrayBuffer` values for most workloads.

## Production Selection Checklist

- What evidence proves the bottleneck class?
- What user-facing metric should improve?
- What does the change do to p95/p99 latency, throughput, event-loop delay, CPU, memory, queue depth, and failures?
- What happens when jobs arrive faster than they finish?
- How are timeouts, cancellation, shutdown, and crashes handled?
- How many workers/processes are used, and why is that number justified?
- What benchmark or load test supports the chosen strategy?
