# TypeScript Examples

These are original sketches for modern ESM Node.js and TypeScript projects. Adapt names, logging, tracing, schema validation, and broker clients to the target codebase. The interfaces intentionally hide Redis, Redis Streams, RabbitMQ/AMQP, ZeroMQ, or other SDK types from domain handlers.

## Message Envelope

```ts
// src/messaging/envelope.ts
export type MessageKind = "command" | "event" | "document" | "request" | "reply"

export type MessageEnvelope<TPayload> = Readonly<{
  id: string
  kind: MessageKind
  type: string
  schemaVersion: number
  createdAt: string
  correlationId: string
  causationId?: string
  traceparent?: string
  idempotencyKey?: string
  payload: TPayload
}>

export function createEnvelope<TPayload>(input: {
  kind: MessageKind
  type: string
  schemaVersion: number
  payload: TPayload
  correlationId: string
  causationId?: string
  traceparent?: string
  idempotencyKey?: string
  createId: () => string
  now?: () => Date
}): MessageEnvelope<TPayload> {
  return {
    id: input.createId(),
    kind: input.kind,
    type: input.type,
    schemaVersion: input.schemaVersion,
    createdAt: (input.now ?? (() => new Date()))().toISOString(),
    correlationId: input.correlationId,
    causationId: input.causationId,
    traceparent: input.traceparent,
    idempotencyKey: input.idempotencyKey,
    payload: input.payload,
  }
}
```

Keep the envelope boring and consistent. Message-specific payload types should carry business data, while metadata carries delivery and observability data.

## Transport-Neutral Publisher

```ts
// src/messaging/publisher.ts
import type { MessageEnvelope } from "./envelope.js"

export interface MessagePublisher {
  publish<TPayload>(
    destination: string,
    message: MessageEnvelope<TPayload>,
    options?: { signal?: AbortSignal },
  ): Promise<void>
}

export class OrderService {
  constructor(private readonly publisher: MessagePublisher) {}

  async markPaid(input: {
    orderId: string
    paymentId: string
    correlationId: string
  }): Promise<void> {
    await this.publisher.publish("billing.events", {
      id: `evt_${input.paymentId}`,
      kind: "event",
      type: "PaymentCaptured",
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      correlationId: input.correlationId,
      idempotencyKey: input.paymentId,
      payload: {
        orderId: input.orderId,
        paymentId: input.paymentId,
      },
    })
  }
}
```

Production adapters can map `destination` to an AMQP exchange/routing key, Redis Stream name, topic, or peer socket. Domain code should not need to know which one.

## Idempotent Queue Consumer

```ts
// src/messaging/queueConsumer.ts
import type { MessageEnvelope } from "./envelope.js"

export interface DedupStore {
  hasProcessed(key: string): Promise<boolean>
  markProcessed(key: string): Promise<void>
}

export interface AckableMessage<TPayload> {
  envelope: MessageEnvelope<TPayload>
  ack(): Promise<void>
  retry(error: unknown): Promise<void>
  deadLetter(error: unknown): Promise<void>
}

export async function handleAckableMessage<TPayload>(
  message: AckableMessage<TPayload>,
  dedup: DedupStore,
  handler: (envelope: MessageEnvelope<TPayload>) => Promise<void>,
): Promise<void> {
  const key = message.envelope.idempotencyKey ?? message.envelope.id

  if (await dedup.hasProcessed(key)) {
    await message.ack()
    return
  }

  try {
    await handler(message.envelope)
    await dedup.markProcessed(key)
    await message.ack()
  } catch (error) {
    if (isPermanentMessageError(error)) {
      await message.deadLetter(error)
      return
    }

    await message.retry(error)
  }
}

function isPermanentMessageError(error: unknown): boolean {
  return error instanceof Error && error.name === "PermanentMessageError"
}
```

This shape makes the ack decision explicit. In real code, `markProcessed()` and business side effects often need a shared transaction or a unique constraint that protects the side effect itself.

## Bounded Request/Reply Client

```ts
// src/messaging/requestReply.ts
import type { MessageEnvelope } from "./envelope.js"

export interface RequestReplyTransport {
  sendRequest<TRequest>(input: {
    address: string
    replyTo: string
    message: MessageEnvelope<TRequest>
  }): Promise<void>
  onReply<TReply>(
    replyTo: string,
    handler: (message: MessageEnvelope<TReply>) => void,
  ): () => void
}

export class RequestReplyClient {
  constructor(
    private readonly transport: RequestReplyTransport,
    private readonly replyTo: string,
  ) {}

  async request<TRequest, TReply>(input: {
    address: string
    message: MessageEnvelope<TRequest>
    timeoutMs: number
    signal?: AbortSignal
  }): Promise<MessageEnvelope<TReply>> {
    const pending = new Map<string, (reply: MessageEnvelope<TReply>) => void>()
    const unsubscribe = this.transport.onReply<TReply>(this.replyTo, reply => {
      pending.get(reply.correlationId)?.(reply)
    })

    try {
      return await new Promise<MessageEnvelope<TReply>>((resolve, reject) => {
        const timeout = AbortSignal.timeout(input.timeoutMs)
        const abort = () => {
          pending.delete(input.message.id)
          reject(new Error(`request timed out: ${input.message.id}`))
        }

        timeout.addEventListener("abort", abort, { once: true })
        input.signal?.addEventListener("abort", abort, { once: true })

        pending.set(input.message.id, reply => {
          timeout.removeEventListener("abort", abort)
          input.signal?.removeEventListener("abort", abort)
          pending.delete(input.message.id)
          resolve(reply)
        })

        this.transport
          .sendRequest({
            address: input.address,
            replyTo: this.replyTo,
            message: input.message,
          })
          .catch(error => {
            timeout.removeEventListener("abort", abort)
            input.signal?.removeEventListener("abort", abort)
            pending.delete(input.message.id)
            reject(error)
          })
      })
    } finally {
      unsubscribe()
    }
  }
}
```

In this sketch, the reply envelope uses the original request message ID as its `correlationId`, mirroring the correlation property commonly carried by broker request/reply protocols.

For high-throughput clients, keep one long-lived reply subscription and one shared pending map. The important invariants stay the same: correlation, timeout, cleanup, and late-reply behavior.

## Stream Consumer With Position

```ts
// src/messaging/streamConsumer.ts
import type { MessageEnvelope } from "./envelope.js"

export interface StreamReader {
  readAfter<TPayload>(input: {
    stream: string
    position: string
    count: number
    signal?: AbortSignal
  }): Promise<readonly { position: string; envelope: MessageEnvelope<TPayload> }[]>
}

export interface PositionStore {
  load(consumerName: string): Promise<string>
  save(consumerName: string, position: string): Promise<void>
}

export async function consumeStream<TPayload>(input: {
  stream: string
  consumerName: string
  reader: StreamReader
  positions: PositionStore
  handle: (message: MessageEnvelope<TPayload>) => Promise<void>
  signal: AbortSignal
}): Promise<void> {
  let position = await input.positions.load(input.consumerName)

  while (!input.signal.aborted) {
    const records = await input.reader.readAfter<TPayload>({
      stream: input.stream,
      position,
      count: 100,
      signal: input.signal,
    })

    for (const record of records) {
      await input.handle(record.envelope)
      await input.positions.save(input.consumerName, record.position)
      position = record.position
    }
  }
}
```

This models append-oriented consumption. A Redis Streams adapter might use record IDs and consumer groups; another broker might use offsets. The handler still needs replay-safe side effects.

## Graceful Queue Worker

```ts
// src/messaging/worker.ts
export interface WorkerSubscription {
  stopReceiving(): Promise<void>
  close(): Promise<void>
}

export class GracefulWorker {
  private readonly inFlight = new Set<Promise<void>>()

  constructor(private readonly subscription: WorkerSubscription) {}

  track(work: Promise<void>): void {
    this.inFlight.add(work)
    work.finally(() => this.inFlight.delete(work)).catch(() => undefined)
  }

  async shutdown(timeoutMs: number): Promise<void> {
    await this.subscription.stopReceiving()

    const drained = Promise.allSettled([...this.inFlight])
    const timeout = new Promise<"timeout">(resolve => {
      setTimeout(() => resolve("timeout"), timeoutMs).unref()
    })

    const result = await Promise.race([drained, timeout])
    if (result === "timeout") {
      throw new Error("worker shutdown timed out with messages in flight")
    }

    await this.subscription.close()
  }
}
```

Transport adapters decide whether unfinished messages are nacked, left unacked for redelivery, or explicitly requeued. Tests should prove that completed messages are acked and incomplete messages remain recoverable.

## Integration Test Shape

```ts
// test/messageBoundary.int.test.ts
import assert from "node:assert/strict"
import { test } from "node:test"
import { handleAckableMessage, type AckableMessage } from "../src/messaging/queueConsumer.js"
import type { MessageEnvelope } from "../src/messaging/envelope.js"

test("redelivery does not duplicate the business effect", async () => {
  const processed = new Set<string>()
  const effects: string[] = []
  const envelope: MessageEnvelope<{ orderId: string }> = {
    id: "msg-1",
    kind: "command",
    type: "CaptureOrderPayment",
    schemaVersion: 1,
    createdAt: new Date(0).toISOString(),
    correlationId: "corr-1",
    idempotencyKey: "payment-order-123",
    payload: { orderId: "order-123" },
  }

  const acknowledgements: string[] = []
  const message: AckableMessage<{ orderId: string }> = {
    envelope,
    async ack() {
      acknowledgements.push("ack")
    },
    async retry() {
      acknowledgements.push("retry")
    },
    async deadLetter() {
      acknowledgements.push("dead-letter")
    },
  }

  const dedup = {
    async hasProcessed(key: string) {
      return processed.has(key)
    },
    async markProcessed(key: string) {
      processed.add(key)
    },
  }

  const handler = async (received: MessageEnvelope<{ orderId: string }>) => {
    effects.push(received.payload.orderId)
  }

  await handleAckableMessage(message, dedup, handler)
  await handleAckableMessage(message, dedup, handler)

  assert.deepEqual(effects, ["order-123"])
  assert.deepEqual(acknowledgements, ["ack", "ack"])
})
```

This is a unit-level sketch of an integration invariant. Real boundary tests should also exercise the broker or a faithful fake: publish, consume, fail, redeliver, dead-letter, timeout, reconnect, and shutdown.

