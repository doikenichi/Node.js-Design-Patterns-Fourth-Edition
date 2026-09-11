---
name: nodejs-messaging-integration-patterns
description: "Design, implement, refactor, and review distributed messaging in production Node.js and TypeScript systems, including pub/sub, queues, streams, task distribution, request/reply, delivery semantics, idempotency, retries, and messaging-boundary tests. Avoids vendor-first recommendations when ordinary HTTP, direct calls, or simpler in-process events are enough."
---

# Node.js Messaging Integration Patterns

Use this skill when work involves distributed communication between Node.js services, workers, processes, browsers, CLIs, or infrastructure through messages. The guidance is based on Chapter 13, "Messaging and Integration Patterns", from *Node.js Design Patterns, Fourth Edition* and the official Packt companion examples, expressed as original operational guidance for modern ESM Node.js and TypeScript.

Design around the message contract and delivery semantics first. Treat Redis, Redis Streams, RabbitMQ/AMQP, and ZeroMQ as implementation examples, not as the architecture.

## When To Use

Activate this skill when asked to:

- Design or review asynchronous service communication, event-driven workflows, background jobs, worker pools, or distributed task execution.
- Introduce or refactor publish/subscribe, broker-based messaging, peer-to-peer messaging, queues, streams, consumer groups, or request/reply over a message bus.
- Add reliability behavior such as acknowledgements, redelivery, durable subscribers, retry policy, dead-letter handling, replay, deduplication, or graceful shutdown.
- Decide between command messages, event messages, document messages, request/reply, push delivery, pull delivery, queues, streams, peer-to-peer, or broker-based messaging.
- Add message schema evolution, correlation IDs, tracing propagation, backpressure, observability, or integration tests at messaging boundaries.

## When Not To Use

Do not introduce messaging only to decouple code that is already in the same process and latency path.

Prefer a direct function call, in-process `EventEmitter`, HTTP endpoint, database transaction, or ordinary stream when:

- The producer and consumer have the same lifecycle and failure domain.
- The caller genuinely needs an immediate answer and normal request/response is simpler.
- There is no independent scaling, retry, replay, audit, integration, or buffering requirement.
- Losing process memory would lose all meaningful state anyway.
- Ordering, idempotency, poison handling, and observability would cost more than the workflow deserves.

## Mandatory Pre-Implementation Questions

Before implementing or refactoring a messaging boundary, answer these explicitly in notes, code review comments, or design text as appropriate:

1. Is this a command, event, or document?
2. Is synchronous response actually required?
3. Can the producer tolerate unavailable consumers?
4. Is message loss acceptable?
5. Is duplication acceptable?
6. Is ordering required?
7. Is replay required?
8. Who owns retry?
9. Who owns timeout?
10. How are poison messages handled?
11. What is the idempotency strategy?
12. How is correlation/tracing preserved?
13. What delivery guarantee can the infrastructure realistically provide?

If the answers are unknown, choose the design that makes ambiguity visible: narrow contracts, explicit metadata, bounded timeouts, safe retries, and tests that demonstrate the assumed semantics.

## Message Fundamentals

- One-way communication sends a message without waiting for a business response. Use it for notifications, commands with external completion tracking, events, and task submission.
- Request/reply sends a request and expects one reply. It needs a correlation identifier, a return address, a timeout, and a plan for late replies.
- Command messages ask one or more consumers to do something. Commands should have a clear owner and an idempotency key when retried.
- Event messages describe something that already happened. Producers should not know which consumers react to the event.
- Document messages transfer a data snapshot for another system to store, index, or process. Version the schema and make large payload ownership explicit.
- Push delivery lets infrastructure or a peer deliver messages to the consumer. It needs flow control, concurrency limits, and shutdown handling.
- Pull delivery lets consumers request messages when ready. It can make backpressure clearer, but requires polling/blocking-read behavior and position management.
- Queues distribute each message to one consumer instance, commonly for commands and jobs.
- Streams append messages to an ordered log, commonly for replay, audit, catch-up, and multiple independent consumers.
- Peer-to-peer messaging removes broker dependency but shifts topology, discovery, durability, backpressure, and recovery to application code.
- Broker-based messaging centralizes routing and durability options but introduces broker operations, topology management, and broker failure modes.

## Pattern Selection

Start with the shape of communication, not the vendor:

- Publish/Subscribe when producers announce events or documents to multiple independent subscribers.
- Reliable queues when one logical consumer should perform each command or job and retry/redelivery matters.
- Reliable streams when consumers need replay, catch-up, independent positions, or an append-oriented history.
- Task distribution when work should be spread across workers or stages using fan-out/fan-in, pipelines, competing consumers, or consumer groups.
- Request/Reply when asynchronous transport is required but the caller still needs a bounded response.

For deeper selection rules, read [references/pattern-selection.md](references/pattern-selection.md). For semantics and guarantees, read [references/delivery-semantics.md](references/delivery-semantics.md). For production readiness and review, read [references/reliability-checklist.md](references/reliability-checklist.md). For original TypeScript sketches, read [references/typescript-examples.md](references/typescript-examples.md).

## Implementation Guidance

- Use modern ESM and TypeScript. Keep transport-specific SDK types behind small adapters so domain code depends on message contracts.
- Define a message envelope with `id`, `type`, `schemaVersion`, `occurredAt` or `createdAt`, `correlationId`, `causationId`, `traceparent` when available, and payload.
- Validate payloads at the boundary. Reject or dead-letter malformed messages with enough context to diagnose them without leaking secrets.
- Make consumers idempotent before adding retries. Record processed message IDs, use natural business keys, conditional writes, unique constraints, or state transitions that can be safely repeated.
- Acknowledge only after durable side effects needed for the message are complete. If side effects include publishing another message, consider an outbox or transactional boundary.
- Bound all waits. Request/reply, blocking reads, reconnects, graceful shutdown, and retry loops need timeouts or abort signals.
- Treat retries as policy, not hope. Use bounded attempts, exponential backoff with jitter, retry classification, and dead-letter handling for permanent or exhausted failures.
- Apply backpressure. Limit prefetch, batch size, pending promises, WebSocket sends, stream reads, and worker concurrency.
- Preserve correlation and tracing. Copy incoming correlation IDs into logs, outgoing messages, reply metadata, and error paths.
- Handle graceful shutdown. Stop accepting new work, drain or cancel in-flight work, ack only completed messages, nack/requeue or leave unacked work according to the broker semantics, flush publishers, then close connections.
- Keep schemas evolvable. Prefer additive changes, optional fields, versioned message types, tolerant readers, and compatibility tests.
- Never describe distributed delivery as "exactly once" unless the complete architecture genuinely provides that semantic across broker, consumer, storage, retries, and side effects. Most practical Node.js messaging designs should be described as at-most-once, at-least-once, effectively-once through idempotency, or replayable.

## Refactoring Workflow

1. Characterize the current boundary: message type, transport, producers, consumers, topology, lifecycle, and tests.
2. Name the required semantics: loss tolerance, duplication tolerance, ordering, replay, latency, and retry ownership.
3. Introduce a typed message envelope and narrow producer/consumer interfaces.
4. Move transport details into adapters and keep business handlers focused on validated payloads and idempotent side effects.
5. Add acknowledgements, retries, dead-letter routing, consumer position, and shutdown behavior in the transport layer where possible.
6. Migrate one message flow at a time. Preserve old routing or message types while consumers are still deployed.
7. Add integration tests for the real messaging boundary and failure scenarios before removing compatibility code.

## Review Heuristics

- Look for producers that assume a consumer is online when the chosen transport cannot guarantee delivery.
- Look for consumers that ack before completing side effects, perform non-idempotent writes, or retry forever.
- Look for request/reply code without timeouts, correlation cleanup, return-address validation, or late-reply handling.
- Look for stream consumers that do not persist position or cannot replay safely.
- Look for queue workers with unbounded concurrency or no poison-message path.
- Look for message schemas that leak internal database rows or third-party SDK shapes.
- Look for logs and metrics that omit message ID, message type, consumer group, correlation ID, attempt count, and latency.

## Testing Requirements

Messaging changes require integration tests at the messaging boundary. Unit tests are useful for handlers, but they are not enough for routing, acknowledgements, retries, ordering, timeout, or broker behavior.

Cover the success path and at least the relevant failure scenarios:

- Producer sends the expected envelope and metadata.
- Consumer handles valid messages idempotently.
- Malformed or unsupported messages are rejected or dead-lettered.
- Handler failure does not ack successful completion.
- Redelivery or retry does not duplicate business side effects.
- Poison messages stop retrying after the configured policy.
- Request/reply resolves matching replies, times out missing replies, cleans correlation state, and ignores late or unrelated replies.
- Stream consumers resume from the expected position and can replay when required.
- Shutdown drains completed work and leaves incomplete work recoverable.

Prefer real broker integration tests using disposable infrastructure when the project already supports it. Otherwise use a faithful in-memory fake that models ack, nack, redelivery, ordering, and timeouts instead of a simplistic event emitter.

