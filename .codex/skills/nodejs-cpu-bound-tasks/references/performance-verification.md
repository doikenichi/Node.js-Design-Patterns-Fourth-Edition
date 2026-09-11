# Performance Verification

Do not claim a CPU-bound optimization worked without evidence. Establish a baseline, change one major strategy at a time, and compare under representative load.

## What To Measure

Measure before and after:

- Event-loop responsiveness: event-loop delay, event-loop utilization, delayed timers, health check latency.
- Throughput: completed jobs or requests per second.
- Latency: mean, p50, p95, p99, and max for both requests and CPU jobs.
- CPU utilization: process and system CPU, per-core saturation, container quota behavior.
- Memory: RSS, heap used, external memory, GC pauses, worker/process memory.
- Worker/process count: configured, active, idle, restarting, terminating.
- Queue depth: current, high-water mark, enqueue wait time, rejected jobs.
- Failure behavior: thrown errors, timeouts, cancellations, crashes, restarts, shutdown outcome.

## Useful Node.js APIs

- `node:perf_hooks`: `monitorEventLoopDelay`, `performance.eventLoopUtilization`, marks and measures.
- `node:process`: `cpuUsage`, `memoryUsage`, `resourceUsage`, signal handling.
- `node:os`: `availableParallelism` for initial sizing.
- `node:worker_threads`: worker lifecycle events and message channels.
- `node:child_process`: child process exit, error, IPC, and signal handling.
- `node:test`: repeatable unit and integration checks around failure paths.

Use production telemetry where available. Local benchmarks are useful for relative comparisons, but load tests should reflect deployment CPU limits, payload sizes, and concurrency.

## Baseline Protocol

1. Write down the hypothesis, such as "event-loop stalls from this hash loop cause p99 request latency above 800 ms."
2. Capture the current implementation under representative input sizes and concurrency.
3. Record event-loop delay, throughput, p95/p99 latency, CPU, memory, and failure observations.
4. Apply one strategy: chunking, worker thread, pool, or external process.
5. Rerun the same workload with the same hardware and limits.
6. Sweep important parameters such as chunk size, worker count, queue limit, payload size, and timeout.
7. Keep the simpler approach if gains are small or operational risk increases.

## Load Test Shape

Include:

- Warmup period.
- Sustained steady-state period.
- Burst period that exceeds service capacity.
- Large payload cases that stress serialization and memory.
- Cancellation and timeout cases.
- Worker crash or child process exit simulation.
- Graceful shutdown with queued and active work.

A CPU strategy is production-ready only when overloaded behavior is explicit: reject, shed, enqueue within bounds, degrade, or apply backpressure.

## Interpreting Results

Chunking success looks like better event-loop delay and request responsiveness, possibly with similar or worse total job duration.

Worker-thread success looks like improved throughput or wall-clock CPU job latency without unacceptable event-loop delay, memory growth, queueing, or failure complexity.

External-process success looks like better isolation or runtime integration with acceptable startup, IPC, and supervision costs.

Pool success looks like stable throughput and latency under repeated jobs, bounded queue depth, controlled memory, and clean crash/shutdown behavior.

Be skeptical when:

- CPU utilization is low but latency is high.
- Event-loop delay is normal but throughput is poor.
- Worker count rises while throughput flattens or falls.
- Serialization time is comparable to compute time.
- Memory grows across benchmark iterations.
- Benchmarks omit p95/p99 latency or overload behavior.

## Minimum Evidence For A Claim

Before saying "optimized", provide:

- The baseline numbers.
- The new numbers.
- The workload used.
- Hardware or container CPU/memory limits.
- The worker/process count and queue settings.
- Any tradeoffs, including memory, startup, operational complexity, and failure behavior.
