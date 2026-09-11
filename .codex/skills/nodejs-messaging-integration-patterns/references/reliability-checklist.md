# Reliability Checklist

Use this checklist for implementation, refactoring, and review of Node.js messaging boundaries.

## Contract

- The message kind is named: command, event, document, request, or reply.
- The message envelope includes stable metadata: `id`, `type`, `schemaVersion`, timestamp, `correlationId`, `causationId`, and trace context when available.
- Payload schemas are validated at the edge.
- Schema evolution policy is clear: additive fields, versioning, tolerant readers, deprecation plan.
- Message names are domain-oriented and do not expose SDK, database, or framework internals.

## Producer

- Producer can tolerate the selected consumer availability model.
- Publish failure handling is explicit: retry, fail caller, buffer, outbox, or drop by policy.
- Publisher confirms or equivalent durable-write acknowledgement are used when producer must know the broker accepted the message.
- Idempotency key or natural business key is included for commands that may be retried.
- Producer preserves correlation ID, causation ID, and trace context from the incoming request or message.
- Large payload ownership is explicit: inline payload, object-store pointer, database ID, or document snapshot.

## Consumer

- Consumer is idempotent before redelivery or retry is enabled.
- Ack happens only after required durable side effects complete.
- Handler errors are classified into retryable, permanent, malformed, unauthorized, and unknown.
- Duplicate delivery cannot duplicate payments, emails, external API calls, inventory changes, or irreversible business actions.
- Consumer concurrency is bounded.
- Ordering constraints are named and enforced per key when required.
- Consumer shutdown drains in-flight work or leaves it recoverable.

## Deduplication And Idempotency

- Dedup storage is durable enough for the expected retry/redelivery window.
- Dedup key is stable across retries and producer restarts.
- Unique constraints or conditional writes protect critical side effects.
- Reprocessing a replayed stream does not emit live side effects unless explicitly intended.
- Dedup records have retention or compaction appropriate to business risk.

## Queue Reliability

- Queue, exchange, topic, and bindings are declared consistently by the application or deployment.
- Durability settings match loss tolerance.
- Prefetch or visibility timeout fits handler latency.
- Redelivery does not reorder messages in a way that violates requirements, or ordering is scoped.
- Dead-letter routing is configured and monitored.
- Retry delay and maximum attempts are bounded.

## Stream Reliability

- Retention policy supports replay and catch-up requirements.
- Consumer position is persisted or broker-managed deliberately.
- Consumer group ownership, pending-message recovery, and stale consumer handling are defined.
- Replay mode is safe and observable.
- Stream lag is measured.
- Compaction or trimming cannot delete messages required by slow consumers.

## Request/Reply

- Requester owns timeout and cancellation.
- Every request has a correlation identifier.
- Every reply has the matching correlation identifier.
- Return address cannot route replies to the wrong tenant, user, or process.
- Pending correlation map is cleaned on success, timeout, cancellation, and shutdown.
- Late replies are ignored, logged, or dead-lettered by policy.
- Business errors, validation errors, transport errors, and timeouts are distinguishable to the caller.

## Backpressure

- Producers cannot enqueue unbounded in-memory work.
- Consumers limit pending promises and batch sizes.
- Pull loops can be aborted during shutdown.
- Push consumers expose and react to overload.
- Fan-out/fan-in collectors have bounded result storage and a completion policy.
- Pipeline stages expose lag and avoid hiding slow downstream stages.

## Observability

- Logs include message ID, type, correlation ID, attempt count, and consumer identity.
- Metrics include publish count/failures, consume count/failures, handler latency, ack latency, lag, retries, dead letters, and timeouts.
- Traces connect incoming HTTP/message work to outgoing messages and downstream handlers.
- Alerts exist for dead-letter growth, retry storms, consumer lag, broker disconnects, and timeout spikes.
- Payload logging is redacted and sampled.

## Security

- Consumers authenticate or trust only authorized producers according to the deployment model.
- Message payloads do not leak secrets into broker logs or dead-letter queues.
- Return addresses and routing keys are not accepted blindly from untrusted callers.
- Multi-tenant messages carry tenant context and enforce authorization at the consumer.
- Deserialization avoids executable payloads and unsafe dynamic imports.

## Testing

- Unit tests cover pure handler behavior with validated payloads and fake dependencies.
- Integration tests exercise the real or faithful messaging boundary.
- Failure tests cover publish failure, handler throw, nack/redelivery, malformed message, duplicate delivery, poison message, broker reconnect, timeout, and shutdown with in-flight work where relevant.
- Contract tests verify schema compatibility across producer and consumer versions.
- Tests assert durable side effects and acknowledgements indirectly through observable broker or fake state, not private implementation details.

