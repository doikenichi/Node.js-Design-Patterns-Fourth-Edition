---
name: nodejs-cpu-bound-tasks
description: Diagnose and handle CPU-heavy Node.js and TypeScript work that may block the event loop; choose chunking, worker threads, worker pools, or external processes only after evidence shows the workload needs it.
---

# Node.js CPU-Bound Tasks

Use this skill when Node.js code may be slow because JavaScript, native add-ons, or synchronous APIs are monopolizing the event loop or CPU. It is grounded in the Chapter 11 CPU-bound companion code under `11-advanced-recipes/09-cpu-bound`, but do not copy the book prose or examples.

Before optimizing, establish evidence. Determine whether the workload is:

- `I/O-bound`: waiting mostly on disk, network, database, queue, or another asynchronous dependency.
- `CPU-bound`: JavaScript or native computation consumes cores and delays timers, requests, or callbacks.
- `memory-bound`: allocation, GC, copying, or data structure size dominates.
- `external-system-bound`: a third-party API, service, lock, queue, or runtime is the bottleneck.

Do not introduce worker threads merely because an operation is asynchronous. Worker threads help when CPU work must run in parallel inside the Node.js process; they do not improve ordinary async I/O.

## Decision Sequence

1. Small CPU task: keep it simple on the main thread if measured event-loop delay and user-facing latency are acceptable.
2. Long task where responsiveness alone matters: consider dividing work into chunks and yielding between chunks with mechanisms such as `setImmediate`.
3. CPU parallelism inside the Node.js process: use `Worker` from `node:worker_threads`; prefer a bounded pool for repeated jobs.
4. Strong isolation, crash containment, a separate executable, or another runtime: use external processes with explicit IPC and lifecycle handling.
5. Repeated CPU jobs: use a bounded worker pool, queueing, backpressure, deadlines, cancellation, and observability.

## Operating Rules

- Measure event-loop responsiveness, throughput, latency, CPU utilization, memory, worker count, queue depth, and failure behavior before and after changes.
- Require benchmarks or load tests before claiming an optimization.
- Bound concurrency. Avoid one worker per request, unbounded queues, and running significantly more workers than available CPU without evidence.
- Account for startup cost, data serialization, memory copying, transfer lists, shutdown, and crash recovery.
- Do not block the main thread while waiting for workers or processes.
- Clean up timers, listeners, workers, child processes, temporary files, and queues.
- Prefer Node.js 24+, ESM, and modern TypeScript in new examples.

## References

Read the relevant reference for the current task:

- [references/strategy-selection.md](references/strategy-selection.md): choose between chunking, child processes, worker threads, pools, and keeping the code simple.
- [references/worker-thread-guidelines.md](references/worker-thread-guidelines.md): implement worker threads, pools, transfer lists, lifecycle, cancellation, and failure handling.
- [references/performance-verification.md](references/performance-verification.md): design measurements, benchmarks, and load tests for CPU-bound changes.
- [references/typescript-examples.md](references/typescript-examples.md): original Node.js 24+ ESM TypeScript snippets for chunking, worker pools, child processes, and instrumentation.
