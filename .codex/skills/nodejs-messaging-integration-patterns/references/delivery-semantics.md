# Delivery Semantics

Delivery semantics describe the combined behavior of producer, broker, consumer, storage, retries, and side effects. Do not promise more than the full path can enforce.

## Practical Guarantees

| Term | Meaning | Requirements | Risk |
| --- | --- | --- | --- |
| At-most-once | A message is handled zero or one time. Loss is possible. | Fire-and-forget send, auto-ack, or ack before processing. | Consumer or broker failure can drop work. |
| At-least-once | A message should be handled one or more times until success. Duplicates are possible. | Durable message storage, ack after processing, redelivery, retry policy. | Non-idempotent consumers can duplicate side effects. |
| Effectively-once | Duplicates may arrive, but business effects happen once. | At-least-once delivery plus idempotent consumer, dedup store, unique constraints, or conditional state transitions. | Dedup window, storage failures, and external side effects must be designed. |
| Replayable | Consumers can reprocess from a known position. | Retained stream/log, position management, version-compatible handlers. | Reprocessing can repeat side effects unless handlers are replay-safe. |

Avoid saying "exactly once" for distributed Node.js messaging unless the entire architecture provides that semantic end to end. A broker feature alone is not enough if the consumer writes to a database, calls a payment API, sends email, or publishes another message.

## Loss, Duplication, Ordering, Replay

Loss tolerance answers whether a message may disappear without business harm. If loss is unacceptable, avoid auto-ack and transient-only transports for the critical path.

Duplication tolerance answers whether processing the same logical message twice is safe. If duplicates are unacceptable, add idempotency before retries.

Ordering requirements must name the ordering key. Global ordering rarely survives partitioning, concurrency, failover, or retry. Per-account, per-order, per-device, or per-stream-key ordering is often achievable with partitioning and single-threaded processing for that key.

Replay requirements imply retained history, compatible schemas, and handlers that can distinguish rebuild from live side effects.

## Ack Timing

Ack after the durable side effects required by the message are complete.

Common choices:

- Ack before processing: lowest latency, but at-most-once.
- Ack after in-memory work: unsafe if process crash loses the result.
- Ack after database commit: common at-least-once pattern.
- Ack after publish: useful when the consumed message primarily transforms into another message, but publisher confirms or an outbox may be needed.
- No explicit ack: acceptable only when the transport semantics and loss tolerance are understood.

If a handler does multiple side effects, define which side effect makes the message complete. For database plus outbound message, consider a transactional outbox so recovery can publish missed messages without redoing the whole handler.

## Retries

Retries need an owner and a stopping rule.

- Broker-owned retry is usually better for process crashes, worker restarts, and queue backlogs.
- Consumer-owned retry can classify errors and add local context, but must avoid blocking the consumer indefinitely.
- Producer-owned retry helps with publish failures, but does not solve consumer failure after delivery.

Use bounded attempts, exponential backoff with jitter, error classification, and dead-letter routing. Log retry attempt count and next retry time. Do not retry validation errors, unknown message types, or permanent business rule failures as if they were transient infrastructure errors.

## Poison Messages

A poison message repeatedly fails because the payload, schema, or business state cannot be processed by the current consumer.

Poison handling should define:

- Maximum attempts or maximum age.
- Dead-letter destination and retention.
- Captured metadata: message ID, type, schema version, correlation ID, consumer, error class, attempt count, first failure time, last failure time.
- Redrive process after code or data repair.
- Alert threshold and ownership.

Never let one poison message block a partition, queue, or consumer group forever without visibility.

## Backpressure

Backpressure keeps the system from accepting more work than it can finish.

- For queues, tune prefetch and consumer concurrency.
- For streams, tune batch size, blocking-read timeout, group size, and pending-message recovery.
- For publishers, respect send return values, confirms, client buffers, and broker memory limits.
- For WebSockets or peer-to-peer sockets, track pending sends and disconnect or slow producers that exceed limits.
- For pipelines, each stage should apply bounded queues and expose lag metrics.

Do not spawn unbounded promises per message. Use a concurrency limiter or process batches sequentially when ordering matters.

## Schema Evolution

Use message names and versions deliberately.

- Prefer additive changes and optional fields.
- Keep consumers tolerant of unknown fields.
- Do not remove or rename fields until all deployed consumers are compatible.
- Validate required fields at the boundary and include schema version in errors.
- For events, publish domain facts rather than internal ORM rows.
- For documents, decide whether the payload is full replacement, partial update, or pointer to external storage.

Compatibility tests should run old messages through new consumers and new messages through tolerant old consumers when rolling deployments matter.

## Observability

Every messaging boundary should provide enough telemetry to reconstruct what happened.

Log or emit metrics for:

- Message type and schema version.
- Message ID, correlation ID, causation ID, and trace context.
- Producer, consumer, queue/topic/stream, consumer group, and partition/key when applicable.
- Publish latency, broker confirm latency, handler latency, ack latency, end-to-end age, and queue/stream lag.
- Attempt count, retry decision, dead-letter count, timeout count, and failure class.

Do not log full payloads by default. Redact secrets and personally sensitive fields.

## Graceful Shutdown

On shutdown:

1. Stop accepting new HTTP/WebSocket/request messages that enqueue work.
2. Stop pulling or receiving new broker messages if the client supports it.
3. Let in-flight handlers finish within a bounded deadline.
4. Ack only completed messages.
5. For incomplete work, nack/requeue, leave unacked for broker redelivery, or record compensating recovery state according to the transport.
6. Flush publisher confirms and telemetry.
7. Close channels, sockets, and connections.

Test shutdown with work in flight. It is one of the easiest places to accidentally lose or duplicate messages.

