# TypeScript Examples

These examples are original sketches for modern ESM Node.js and TypeScript projects. Adapt names, error types, logging, and test style to the target codebase.

## Strategy With Functions And Configuration

```ts
export type Encoder<T> = {
  parse(text: string): T
  format(value: T): string
}

export type ConfigFormat = "json" | "yaml"

export function createConfigStore<T>(
  encoder: Encoder<T>,
  files: {
    readText(path: string): Promise<string>
    writeText(path: string, text: string): Promise<void>
  },
) {
  return {
    async load(path: string): Promise<T> {
      return encoder.parse(await files.readText(path))
    },
    async save(path: string, value: T): Promise<void> {
      await files.writeText(path, encoder.format(value))
    },
  }
}

export const jsonEncoder = <T>(): Encoder<T> => ({
  parse: text => JSON.parse(text) as T,
  format: value => JSON.stringify(value, null, 2),
})
```

Use dependency injection for the strategy and I/O. Add a typed registry only when runtime selection is needed:

```ts
const encoders = {
  json: jsonEncoder<unknown>(),
  yaml: yamlEncoder<unknown>(),
} satisfies Record<ConfigFormat, Encoder<unknown>>
```

## State With Explicit Transitions

```ts
type ConnectionState = "offline" | "connecting" | "online" | "closed"
type Event = "connect" | "connected" | "disconnect" | "close"

const transitions = {
  offline: { connect: "connecting", close: "closed" },
  connecting: { connected: "online", disconnect: "offline", close: "closed" },
  online: { disconnect: "offline", close: "closed" },
  closed: {},
} satisfies Record<ConnectionState, Partial<Record<Event, ConnectionState>>>

export class ConnectionLifecycle {
  #state: ConnectionState = "offline"

  get state(): ConnectionState {
    return this.#state
  }

  transition(event: Event): ConnectionState {
    const next = transitions[this.#state][event]
    if (!next) {
      throw new Error(`Cannot ${event} while ${this.#state}`)
    }
    this.#state = next
    return this.#state
  }

  send(message: Uint8Array): "queued" | "sent" {
    switch (this.#state) {
      case "offline":
      case "connecting":
        return "queued"
      case "online":
        return "sent"
      case "closed":
        throw new Error("Cannot send while closed")
    }
  }
}
```

This table-driven form is often enough. Move to state objects or a state-machine library when enter/exit actions, guards, nested states, or many events make the table hard to maintain.

## Template As A Function With Hooks

```ts
export type ImportHooks<Input, Output> = {
  beforeRead?: () => void | Promise<void>
  read(): Promise<Input>
  transform(input: Input): Promise<Output> | Output
  validate?(output: Output): void | Promise<void>
  write(output: Output): Promise<void>
  afterWrite?: (output: Output) => void | Promise<void>
}

export async function runImport<Input, Output>(
  hooks: ImportHooks<Input, Output>,
): Promise<Output> {
  await hooks.beforeRead?.()
  const input = await hooks.read()
  const output = await hooks.transform(input)
  await hooks.validate?.(output)
  await hooks.write(output)
  await hooks.afterWrite?.(output)
  return output
}
```

This captures a stable algorithm skeleton without inheritance. Use an abstract class only when the codebase already uses inheritance or subclasses share meaningful protected helpers.

## Iterator With A Generator

```ts
export class Matrix<T> implements Iterable<T> {
  constructor(private readonly rows: readonly (readonly T[])[]) {}

  *[Symbol.iterator](): Iterator<T> {
    for (const row of this.rows) {
      yield* row
    }
  }
}
```

Generators avoid the off-by-one and `{ done }` mistakes common in manual iterators.

## Async Iterator With Cleanup

```ts
export async function* pages<T>(
  firstCursor: string | undefined,
  fetchPage: (cursor: string | undefined) => Promise<{
    items: readonly T[]
    nextCursor?: string
  }>,
): AsyncGenerator<T> {
  let cursor = firstCursor

  while (true) {
    const page = await fetchPage(cursor)
    for (const item of page.items) {
      yield item
    }
    if (!page.nextCursor) {
      return
    }
    cursor = page.nextCursor
  }
}
```

For resources that must close after early break, wrap the loop in `try/finally` and call the cleanup function in `finally`.

## Middleware Transform Chain

```ts
export type Message = Readonly<{ body: unknown; headers: Record<string, string> }>
export type MessageMiddleware = (message: Message) => Message | Promise<Message>

export const parseJson: MessageMiddleware = message => ({
  ...message,
  body: JSON.parse(String(message.body)),
})

export const requireType =
  (type: string): MessageMiddleware =>
  message => {
    if (message.headers.type !== type) {
      throw new Error(`Unsupported message type: ${message.headers.type}`)
    }
    return message
  }

export function composeMessagePipeline(
  stages: readonly MessageMiddleware[],
): MessageMiddleware {
  return async message => {
    let current = message
    for (const stage of stages) {
      current = await stage(current)
    }
    return current
  }
}
```

Keep stage order close to registration and test it with observable stage markers.

## Command As A Task Object

```ts
export type Audit = {
  record(event: string, fields: Record<string, unknown>): Promise<void>
}

export type Command<Result = unknown> = {
  readonly type: string
  run(): Promise<Result>
  serialize(): Record<string, unknown>
}

export function createSendReceiptCommand(
  dependencies: {
    sendReceipt(orderId: string): Promise<void>
    audit: Audit
  },
  orderId: string,
): Command<void> {
  return {
    type: "send-receipt",
    async run() {
      await dependencies.sendReceipt(orderId)
      await dependencies.audit.record("receipt.sent", { orderId })
    },
    serialize() {
      return { type: "send-receipt", orderId }
    },
  }
}
```

Only add `undo()` when there is a real reverse or compensation operation:

```ts
export type UndoableCommand<Result = unknown> = Command<Result> & {
  undo(): Promise<void>
}
```

For external side effects, prefer idempotency keys, retries with bounded backoff, and audit records over pretending every command can be undone.
