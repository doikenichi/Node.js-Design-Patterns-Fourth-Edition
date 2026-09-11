# Pattern Selection

Choose the smallest messaging pattern that satisfies the real communication and failure requirements. Patterns can compose, but every added transport boundary increases operational cost.

## Message Kinds

| Kind | Meaning | Typical destination | Coupling | Common transport shapes | Watch for |
| --- | --- | --- | --- | --- | --- |
| Command | "Do this." The sender wants work performed. | One logical owner or worker group. | Sender knows the capability being requested. | Queue, request/reply, push/pull. | Idempotency, retries, ownership, authorization, duplicate commands. |
| Event | "This happened." The producer records a fact. | Zero or many subscribers. | Producer should not know subscribers. | Pub/sub, stream, topic exchange. | Schema evolution, subscriber lag, fan-out failures, accidental command semantics. |
| Document | "Here is a data snapshot." The sender transfers state. | Indexer, cache builder, analytics, partner, search, archive. | Consumer depends on document schema. | Stream, queue, topic, object store pointer plus message. | Large payloads, privacy, partial updates, version compatibility. |
| Request | "Answer this." The caller is blocked on a reply. | One replier or service instance. | Caller and replier are temporally coupled by timeout. | Request/reply over broker, direct RPC, HTTP. | Correlation, return address, timeout, late replies, error mapping. |

Prefer event messages for domain facts, command messages for owned work, document messages for state transfer, and request/reply only when a bounded response is actually needed.

## Delivery Topology

| Topology | Use when | Strengths | Costs | Examples from Chapter 13 family |
| --- | --- | --- | --- | --- |
| Broker-based pub/sub | Multiple subscribers should receive the same event or document. | Simple producer, centralized routing, optional durable subscriptions depending on broker. | Broker dependency, topology management, subscriber lifecycle. | RabbitMQ fanout exchange, Redis Pub/Sub, Redis Streams as replayable pub/sub. |
| Peer-to-peer pub/sub | Small mesh, low latency, or brokerless demos/tools are acceptable. | Fewer central moving parts, direct routing. | Discovery, reconnection, durability, and topology live in app code. | ZeroMQ publisher/subscriber sockets. |
| Queue | One consumer instance should process each command or task. | Competing consumers, retry/redelivery, smoothing load. | Duplicate handling, poison handling, ack semantics, visibility into backlog. | RabbitMQ queue, Redis list-like work queues. |
| Stream | Consumers need an append-only history and independent progress. | Replay, audit, catch-up, consumer groups, late subscribers. | Retention, position tracking, lag, compaction policy. | Redis Streams with IDs and consumer groups. |
| Push/pull task distribution | A producer distributes many independent tasks to workers. | Simple fan-out of work, worker scaling. | Result collection, cancellation, backpressure, lost work depending on transport. | ZeroMQ Push/Pull, AMQP workers, Redis Streams groups. |
| Request/reply | Message transport is required and the caller needs a result. | Keeps asynchronous transport while preserving response semantics. | Timeout and correlation complexity, temporal coupling, late replies. | Correlation ID and return-address examples over channel or AMQP. |

## Pattern Notes

### Publish/Subscribe

Use publish/subscribe when the producer emits a message without selecting consumers.

- Broker-based pub/sub is the default for production when durability, routing policy, or operations visibility matter.
- Peer-to-peer pub/sub is reasonable for controlled topologies, local clusters, edge processes, or cases where the application already owns discovery and reconnection.
- Subscriber lifecycle determines correctness. Decide what happens when a subscriber starts late, disconnects, redeploys, or falls behind.
- Transient delivery is acceptable for presence, live chat typing indicators, telemetry samples, cache invalidation that can self-heal, or UI-only updates.
- Durable delivery is needed when missing a message loses business state, auditability, or required downstream processing.

Do not call a message an event if the publisher expects a specific subscriber to perform mandatory work. That is usually a command or workflow step.

### Reliable Messaging With Queues

Use a reliable queue when each message should be processed by one logical consumer, and failure should result in retry or recovery.

- The consumer should ack after successful durable side effects.
- Failed attempts should be nacked, released by visibility timeout, or moved through broker-supported retry routing.
- Durable subscribers and durable queues matter only if the broker persists messages and consumer position across restart.
- Failure recovery depends on both infrastructure and handler design. If the handler is not idempotent, redelivery can corrupt data.

Queues are not automatically ordered under scale. Multiple consumers, retries, priority queues, and dead-letter routing can change observed order.

### Reliable Messaging With Streams

Use streams when the log of messages is itself valuable.

- Append-oriented streams preserve a sequence of records for a retention window.
- Replay lets a new or repaired consumer rebuild state from an earlier position.
- Consumer position is part of application correctness. Store or use broker-managed offsets deliberately.
- Streams can distribute work through consumer groups, but each group has its own position and retry behavior.

Choose a stream over a queue when independent consumers, catch-up, audit, or reprocessing are first-class requirements.

### Task Distribution

Use task distribution when work can be partitioned into independent units or stages.

- Fan-out/fan-in splits many tasks across workers and collects results. Plan completion detection, partial failure, cancellation, and result ordering if needed.
- Pipelines pass messages through stages. Each stage should own its input/output contract and failure policy.
- Competing consumers share a queue so one worker handles each task. Use prefetch/concurrency limits.
- Consumer groups share a stream so one member in the group handles each record while other groups can process independently.

Prefer idempotent, small, bounded tasks. Large tasks should include checkpointing or compensation.

### Request/Reply

Use request/reply sparingly. It keeps temporal coupling, so it should be justified by a real need for a response.

Every request/reply implementation needs:

- A correlation identifier that maps replies to pending requests.
- A return address such as a reply queue, topic, inbox, or connection identity.
- A timeout owned by the requester.
- Error propagation that distinguishes business errors, validation errors, transport errors, and timeouts.
- Cleanup for correlation state on success, timeout, cancellation, and shutdown.

Late replies are normal in distributed systems. Decide whether to ignore them, log them, or route them to diagnostics.

## Selection Shortcuts

- Need one worker to do each task: queue or stream consumer group.
- Need every interested consumer to see the same fact: pub/sub or stream.
- Need late consumers to catch up: stream or durable subscription.
- Need to inspect or rebuild history: stream.
- Need low-latency live notifications where loss is fine: transient pub/sub.
- Need a caller result: request/reply with timeout, or HTTP if a message broker adds no value.
- Need brokerless mesh communication: peer-to-peer, but document discovery and recovery tradeoffs.

