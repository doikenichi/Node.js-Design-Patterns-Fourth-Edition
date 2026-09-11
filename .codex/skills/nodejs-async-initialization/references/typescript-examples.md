# TypeScript Examples

These are original sketches for Node.js 24+, ESM, and TypeScript. Adapt them to the project style instead of copying them blindly.

## Shared Types

```ts
export type LifecycleState =
  | 'CREATED'
  | 'INITIALIZING'
  | 'READY'
  | 'FAILED'
  | 'CLOSING'
  | 'CLOSED'

export class ComponentNotReadyError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ComponentNotReadyError'
  }
}

export class ComponentClosedError extends Error {
  constructor(message = 'Component is closed') {
    super(message)
    this.name = 'ComponentClosedError'
  }
}
```

## Idempotent Initialization With Local Checks

```ts
type Setup<T> = (signal?: AbortSignal) => Promise<T>

export class AsyncResource<T> {
  #state: LifecycleState = 'CREATED'
  #resource: T | undefined
  #initPromise: Promise<T> | undefined
  #failure: unknown

  constructor(private readonly setup: Setup<T>) {}

  get state(): LifecycleState {
    return this.#state
  }

  get ready(): boolean {
    return this.#state === 'READY'
  }

  async init(options: { signal?: AbortSignal; retry?: boolean } = {}): Promise<T> {
    if (this.#state === 'READY') {
      return this.#resource as T
    }

    if (this.#state === 'INITIALIZING') {
      return this.#initPromise as Promise<T>
    }

    if (this.#state === 'FAILED' && !options.retry) {
      throw new ComponentNotReadyError('Initialization previously failed', {
        cause: this.#failure
      })
    }

    if (this.#state === 'CLOSING' || this.#state === 'CLOSED') {
      throw new ComponentClosedError()
    }

    this.#state = 'INITIALIZING'
    this.#failure = undefined
    this.#initPromise = this.setup(options.signal)
      .then((resource) => {
        this.#resource = resource
        this.#state = 'READY'
        return resource
      })
      .catch((error: unknown) => {
        this.#failure = error
        this.#state = 'FAILED'
        throw error
      })
      .finally(() => {
        this.#initPromise = undefined
      })

    return this.#initPromise
  }

  async use<R>(operation: (resource: T) => Promise<R>): Promise<R> {
    if (this.#state === 'CLOSING' || this.#state === 'CLOSED') {
      throw new ComponentClosedError()
    }

    const resource = await this.init()
    return operation(resource)
  }
}
```

Use this shape when methods may wait for readiness. For fail-fast methods, replace `await this.init()` with a state check that throws unless `READY`.

## Delayed Startup

```ts
import { createServer } from 'node:http'

export async function startApp(deps: {
  config: { init(): Promise<void>; ready: boolean }
  db: { init(): Promise<void>; ready: boolean }
  createHandler(): Parameters<typeof createServer>[0]
}) {
  await deps.config.init()
  await deps.db.init()

  if (!deps.config.ready || !deps.db.ready) {
    throw new ComponentNotReadyError('Startup dependency reported unready after init')
  }

  const server = createServer(deps.createHandler())
  await new Promise<void>((resolve) => server.listen(0, resolve))
  return server
}
```

Servers, workers, queue consumers, browser automation sessions, and schedulers should use this model when they must not receive work before readiness.

## Bounded Pre-Initialization Queue

```ts
type QueueEntry<T> = {
  run: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: unknown) => void
  timeout: NodeJS.Timeout
}

export class QueuedAsyncClient {
  #state: LifecycleState = 'CREATED'
  #initPromise: Promise<void> | undefined
  #queue: QueueEntry<unknown>[] = []
  #failure: unknown

  constructor(
    private readonly connectClient: () => Promise<void>,
    private readonly executeReadyCommand: (command: string) => Promise<unknown>,
    private readonly options = { maxQueue: 100, queueTimeoutMs: 10_000 }
  ) {}

  get ready(): boolean {
    return this.#state === 'READY'
  }

  async init(): Promise<void> {
    if (this.#state === 'READY') return
    if (this.#state === 'INITIALIZING') return this.#initPromise
    if (this.#state === 'FAILED') {
      throw new ComponentNotReadyError('Initialization failed', { cause: this.#failure })
    }
    if (this.#state === 'CLOSING' || this.#state === 'CLOSED') {
      throw new ComponentClosedError()
    }

    this.#state = 'INITIALIZING'
    this.#initPromise = this.connectClient()
      .then(async () => {
        this.#state = 'READY'
        await this.#flushQueue()
      })
      .catch((error: unknown) => {
        this.#failure = error
        this.#state = 'FAILED'
        this.#rejectQueue(error)
        throw error
      })
      .finally(() => {
        this.#initPromise = undefined
      })

    return this.#initPromise
  }

  async command(command: string): Promise<unknown> {
    if (this.#state === 'READY') {
      return this.executeReadyCommand(command)
    }

    if (this.#state === 'CLOSING' || this.#state === 'CLOSED') {
      throw new ComponentClosedError()
    }

    if (this.#state === 'FAILED') {
      throw new ComponentNotReadyError('Initialization failed', { cause: this.#failure })
    }

    if (this.#queue.length >= this.options.maxQueue) {
      throw new ComponentNotReadyError('Initialization queue is full')
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.#queue = this.#queue.filter((entry) => entry !== queueEntry)
        reject(new ComponentNotReadyError('Queued command timed out'))
      }, this.options.queueTimeoutMs)

      const queueEntry: QueueEntry<unknown> = {
        run: () => this.executeReadyCommand(command),
        resolve,
        reject,
        timeout
      }

      this.#queue.push(queueEntry)
    })
  }

  async #flushQueue(): Promise<void> {
    const entries = this.#queue.splice(0)
    for (const entry of entries) {
      clearTimeout(entry.timeout)
      entry.run().then(entry.resolve, entry.reject)
    }
  }

  #rejectQueue(error: unknown): void {
    const entries = this.#queue.splice(0)
    for (const entry of entries) {
      clearTimeout(entry.timeout)
      entry.reject(error)
    }
  }
}
```

Queues should be reserved for operations that remain valid after initialization finishes. Prefer startup gating or fail-fast errors when queued work could become stale or unsafe.

## State Pattern Sketch

```ts
interface ClientState {
  readonly name: LifecycleState
  init(context: StatefulClient): Promise<void>
  command(context: StatefulClient, command: string): Promise<unknown>
  close(context: StatefulClient): Promise<void>
}

export class StatefulClient {
  state: ClientState

  constructor(
    readonly connectClient: () => Promise<void>,
    readonly executeReadyCommand: (command: string) => Promise<unknown>,
    readonly closeClient: () => Promise<void>
  ) {
    this.state = new CreatedState()
  }

  get status(): LifecycleState {
    return this.state.name
  }

  init(): Promise<void> {
    return this.state.init(this)
  }

  command(command: string): Promise<unknown> {
    return this.state.command(this, command)
  }

  close(): Promise<void> {
    return this.state.close(this)
  }

  transitionTo(next: ClientState): void {
    this.state = next
  }
}

class CreatedState implements ClientState {
  readonly name = 'CREATED' as const

  init(context: StatefulClient): Promise<void> {
    const initializing = new InitializingState()
    context.transitionTo(initializing)
    return initializing.init(context)
  }

  async command(): Promise<unknown> {
    throw new ComponentNotReadyError('Client has not been initialized')
  }

  async close(context: StatefulClient): Promise<void> {
    context.transitionTo(new ClosedState())
  }
}

class InitializingState implements ClientState {
  readonly name = 'INITIALIZING' as const
  #promise: Promise<void> | undefined
  #closing = false

  init(context: StatefulClient): Promise<void> {
    this.#promise ??= context.connectClient()
      .then(() => {
        if (this.#closing) {
          throw new ComponentClosedError('Client closed before initialization finished')
        }
        context.transitionTo(new ReadyState())
      })
      .catch((error: unknown) => {
        if (!this.#closing) {
          context.transitionTo(new FailedState(error))
        }
        throw error
      })

    return this.#promise
  }

  async command(): Promise<unknown> {
    throw new ComponentNotReadyError('Client is initializing')
  }

  async close(context: StatefulClient): Promise<void> {
    this.#closing = true
    context.transitionTo(new ClosingState())
    await this.#promise?.catch(() => undefined)
    await context.closeClient()
    context.transitionTo(new ClosedState())
  }
}

class ReadyState implements ClientState {
  readonly name = 'READY' as const

  async init(): Promise<void> {}

  command(context: StatefulClient, command: string): Promise<unknown> {
    return context.executeReadyCommand(command)
  }

  async close(context: StatefulClient): Promise<void> {
    context.transitionTo(new ClosingState())
    await context.closeClient()
    context.transitionTo(new ClosedState())
  }
}

class FailedState implements ClientState {
  readonly name = 'FAILED' as const

  constructor(private readonly cause: unknown) {}

  async init(): Promise<void> {
    throw new ComponentNotReadyError('Client initialization failed', {
      cause: this.cause
    })
  }

  async command(): Promise<unknown> {
    throw new ComponentNotReadyError('Client initialization failed', {
      cause: this.cause
    })
  }

  async close(context: StatefulClient): Promise<void> {
    context.transitionTo(new ClosedState())
  }
}

class ClosingState implements ClientState {
  readonly name = 'CLOSING' as const

  async init(): Promise<void> {
    throw new ComponentClosedError('Client is closing')
  }

  async command(): Promise<unknown> {
    throw new ComponentClosedError('Client is closing')
  }

  async close(): Promise<void> {}
}

class ClosedState implements ClientState {
  readonly name = 'CLOSED' as const

  async init(): Promise<void> {
    throw new ComponentClosedError()
  }

  async command(): Promise<unknown> {
    throw new ComponentClosedError()
  }

  async close(): Promise<void> {}
}
```

This sketch uses fail-fast behavior during `INITIALIZING`. A waiting or queuing state can be swapped in when that is the selected policy.

## Concurrency-Focused Test Sketches

Use `node:test`, `assert/strict`, controlled promises, and fake implementations. Avoid sleeps.

```ts
import test from 'node:test'
import assert from 'node:assert/strict'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

test('concurrent init calls share one setup attempt', async () => {
  const setup = deferred<{ query(): Promise<string> }>()
  let setupCalls = 0
  const resource = new AsyncResource(async () => {
    setupCalls += 1
    return setup.promise
  })

  const first = resource.init()
  const second = resource.init()
  assert.equal(setupCalls, 1)

  setup.resolve({ query: async () => 'ok' })
  assert.equal(await first, await second)
  assert.equal(resource.ready, true)
})

test('initialization failure reaches all waiters', async () => {
  const setup = deferred<unknown>()
  const resource = new AsyncResource(() => setup.promise)

  const first = resource.init()
  const second = resource.init()
  const failure = new Error('credentials unavailable')
  setup.reject(failure)

  await assert.rejects(first, /credentials unavailable/)
  await assert.rejects(second, /credentials unavailable/)
  assert.equal(resource.state, 'FAILED')
})

test('queue rejects overflow before readiness', async () => {
  const connect = deferred<void>()
  const client = new QueuedAsyncClient(
    () => connect.promise,
    async (command) => command,
    { maxQueue: 1, queueTimeoutMs: 1_000 }
  )

  void client.init()
  const queued = client.command('first')
  await assert.rejects(client.command('second'), /queue is full/)

  connect.resolve()
  assert.equal(await queued, 'first')
})
```

Add more tests for retry reset behavior, queue timeout cleanup, cancellation with `AbortSignal`, invalid transitions, closing during initialization, closing with queued work, and readiness false until dependencies are actually usable.
