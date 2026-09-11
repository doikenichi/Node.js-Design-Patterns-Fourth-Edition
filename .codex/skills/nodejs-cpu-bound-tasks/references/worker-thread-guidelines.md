# Worker Thread Guidelines

Use worker threads for measured CPU-bound work that benefits from parallelism inside a Node.js process. Do not use them merely because a function returns a `Promise` or uses callbacks.

## Worker Basics

- Use `Worker` from `node:worker_threads` with ESM worker entry points.
- Send only the data required for the job.
- Return structured results and structured errors.
- Include job IDs when multiple in-flight messages can share a worker.
- Remove message and error listeners when a job completes.
- Always handle `error`, `exit`, and cancellation paths.

In Node.js 24+ ESM TypeScript, prefer `new URL('./worker.js', import.meta.url)` or compiled `.js` URLs that match the build output. Keep worker entry points small and dependency-light to reduce startup and memory costs.

## Worker Pools

Create a bounded pool for repeated CPU jobs. A pool should:

- Cap worker count, usually at or below available CPU cores unless load tests prove otherwise.
- Cap queue length or expose backpressure to callers.
- Reuse warm workers across jobs.
- Track active jobs, idle workers, queue depth, and failures.
- Enforce per-job timeouts.
- Support cancellation with `AbortSignal` where practical.
- Replace crashed workers only within a supervised policy.
- Drain or reject queued jobs during shutdown.

Avoid one worker per request. It magnifies startup cost, memory use, and scheduler overhead, and it usually fails under load before it improves throughput.

## Message Passing And Data Transfer

Default message passing uses structured clone. It is convenient but can be expensive for large object graphs.

Prefer:

- Small plain data messages for configuration and scalar inputs.
- `ArrayBuffer` transfer lists for large binary buffers when the sender no longer needs ownership.
- Preloaded immutable data in each worker when sending it for every job would dominate cost.

Be careful with:

- Large JSON payloads or class instances.
- Repeated cloning of lookup tables.
- Hidden copies from `Buffer` slices or conversions.
- Returning huge result objects when a summary or output file would do.

Use `SharedArrayBuffer` only when shared memory is necessary and justified by measurement. If using it, document ownership, synchronization, and `Atomics` use. Treat it as a concurrency primitive, not a general performance shortcut.

## Timeouts And Cancellation

Use deadlines for CPU jobs. Cancellation is cooperative unless the worker is terminated:

- Pass an `AbortSignal` to the pool API.
- If a job can check progress, send cancellation messages or shared cancellation flags.
- If a worker ignores cancellation past a grace period, terminate it and replace it according to pool policy.
- Decide whether partial results are discarded or returned explicitly.

Never busy-wait on the main thread for a worker result. Await a promise, subscribe to events, or stream progress asynchronously.

## Failure Handling

Plan for:

- Worker startup failure.
- Runtime exception in worker code.
- Non-zero worker exit.
- Timeout.
- Caller cancellation.
- Serialization failure.
- Parent shutdown while work is queued or running.

When a worker crashes:

- Reject the active job with context.
- Decrement active worker count.
- Start a replacement only if the pool is still accepting work.
- Apply a restart limit or backoff if crashes repeat.
- Emit metrics and logs with job type, duration, worker ID, and reason.

## Graceful Shutdown

A production pool should expose `close()` or `shutdown()`:

- Stop accepting new jobs.
- Reject or drain queued work according to service policy.
- Wait for active jobs until a deadline.
- Terminate remaining workers after the deadline.
- Remove listeners and clear timers.

For HTTP services, hook shutdown into `SIGTERM`, server close, and dependency shutdown so workers do not leak after the main server stops accepting traffic.

## Sizing

Start conservatively:

- For CPU-only jobs, begin near `availableParallelism() - 1` so the main event loop has CPU headroom.
- For mixed CPU and I/O inside workers, benchmark multiple pool sizes.
- In containers, confirm the API reports the effective CPU quota and not just host CPUs.
- Validate on representative hardware with representative payloads.

More workers can reduce throughput by adding context switching, GC pressure, memory contention, and IPC overhead. Treat worker count as a measured parameter, not a constant copied from the machine.
