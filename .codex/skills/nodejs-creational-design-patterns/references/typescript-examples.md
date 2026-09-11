# TypeScript Examples

These examples are original sketches for modern ESM Node.js 24+ projects. Adapt naming, error types, logging, and test style to the target codebase. Do not add third-party dependencies for these patterns unless the project already uses them.

## Factory With Runtime Selection And Injection

Use a factory when callers need a capability and should not know which implementation provides it.

```ts
// src/storage/createObjectStore.ts
export interface ObjectStore {
  put(key: string, body: Uint8Array): Promise<void>
  get(key: string): Promise<Uint8Array | undefined>
}

type Logger = {
  info(message: string, fields?: Record<string, unknown>): void
}

class MemoryObjectStore implements ObjectStore {
  readonly #objects = new Map<string, Uint8Array>()

  async put(key: string, body: Uint8Array): Promise<void> {
    this.#objects.set(key, structuredClone(body))
  }

  async get(key: string): Promise<Uint8Array | undefined> {
    const value = this.#objects.get(key)
    return value ? structuredClone(value) : undefined
  }
}

class FileObjectStore implements ObjectStore {
  constructor(
    private readonly rootDir: string,
    private readonly logger: Logger,
  ) {}

  async put(key: string, body: Uint8Array): Promise<void> {
    this.logger.info("writing object", { key, rootDir: this.rootDir })
    // Use node:fs/promises in real code; omitted here to keep the example focused.
  }

  async get(key: string): Promise<Uint8Array | undefined> {
    this.logger.info("reading object", { key, rootDir: this.rootDir })
    return undefined
  }
}

export type ObjectStoreConfig =
  | { kind: "memory" }
  | { kind: "file"; rootDir: string }

export function createObjectStore(
  config: ObjectStoreConfig,
  dependencies: { logger: Logger },
): ObjectStore {
  switch (config.kind) {
    case "memory":
      return new MemoryObjectStore()
    case "file":
      return new FileObjectStore(config.rootDir, dependencies.logger)
  }
}
```

The consumer receives `ObjectStore`; the composition root owns `createObjectStore()` and the logger wiring.

## Factory Function With Closure Encapsulation

Use closure state when the state should be inaccessible except through the returned API.

```ts
// src/rateLimit/createTokenBucket.ts
export type TokenBucket = {
  take(count?: number): boolean
  snapshot(): { available: number; capacity: number }
}

export function createTokenBucket(options: {
  capacity: number
  refillPerTick: number
}): TokenBucket {
  if (options.capacity <= 0) {
    throw new RangeError("capacity must be positive")
  }

  let available = options.capacity

  return Object.freeze({
    take(count = 1) {
      if (count <= 0) {
        throw new RangeError("count must be positive")
      }
      if (available < count) {
        return false
      }
      available -= count
      return true
    },
    snapshot() {
      return { available, capacity: options.capacity }
    },
  })
}
```

This is often lighter than a class when inheritance and identity checks are unnecessary.

## Builder With Validation And Immutable Product

Use a builder when construction has enough optional choices or staged readability to justify a fluent API.

```ts
// src/reports/reportSpec.ts
export type ReportSpec = Readonly<{
  title: string
  timezone: string
  sections: readonly Readonly<{ heading: string; query: string }>[]
  includeDrafts: boolean
}>

export class ReportSpecBuilder {
  #title?: string
  #timezone = "UTC"
  #sections: Array<{ heading: string; query: string }> = []
  #includeDrafts = false

  titled(title: string): this {
    this.#title = title.trim()
    return this
  }

  inTimezone(timezone: string): this {
    this.#timezone = timezone
    return this
  }

  withSection(heading: string, query: string): this {
    this.#sections.push({ heading: heading.trim(), query })
    return this
  }

  includingDrafts(): this {
    this.#includeDrafts = true
    return this
  }

  build(): ReportSpec {
    if (!this.#title) {
      throw new Error("report title is required")
    }
    if (this.#sections.length === 0) {
      throw new Error("at least one report section is required")
    }

    return Object.freeze({
      title: this.#title,
      timezone: this.#timezone,
      sections: Object.freeze(
        this.#sections.map(section => Object.freeze({ ...section })),
      ),
      includeDrafts: this.#includeDrafts,
    })
  }
}
```

Do not introduce this if a typed options object is already readable:

```ts
createReport({
  title: "Weekly operations",
  timezone: "America/Edmonton",
  sections: [{ heading: "Incidents", query: "severity >= 2" }],
})
```

## Revealing Constructor For Controlled Initialization

Expose only the mutation needed by the initializer, then publish a read-only object.

```ts
// src/security/accessList.ts
export type AccessListReader = {
  has(subject: string): boolean
  entries(): readonly string[]
}

type AccessListWriter = {
  allow(subject: string): void
}

export class AccessList implements AccessListReader {
  readonly #subjects = new Set<string>()

  constructor(initialize: (writer: AccessListWriter) => void) {
    const writer: AccessListWriter = Object.freeze({
      allow: subject => {
        const normalized = subject.trim().toLowerCase()
        if (!normalized) {
          throw new Error("subject is required")
        }
        this.#subjects.add(normalized)
      },
    })

    initialize(writer)
  }

  has(subject: string): boolean {
    return this.#subjects.has(subject.trim().toLowerCase())
  }

  entries(): readonly string[] {
    return Object.freeze([...this.#subjects].sort())
  }
}

const list = new AccessList(({ allow }) => {
  allow("Billing")
  allow("Support")
})
```

Keep the executor synchronous unless there is a strong reason to model async initialization explicitly with an async factory.

## Singleton As A Module Export

Use module-level singletons sparingly and document the scope.

```ts
// src/config/runtimeConfig.ts
export type RuntimeConfig = Readonly<{
  serviceName: string
  logLevel: "debug" | "info" | "warn" | "error"
}>

function readRuntimeConfig(env: NodeJS.ProcessEnv): RuntimeConfig {
  return Object.freeze({
    serviceName: env.SERVICE_NAME ?? "orders-api",
    logLevel: env.LOG_LEVEL === "debug" ? "debug" : "info",
  })
}

// One instance per resolved ESM module URL in this process.
export const runtimeConfig = readRuntimeConfig(process.env)
```

This is reasonable for immutable process configuration. It is risky for mutable business state or dependencies that tests need to replace independently.

## Prefer DI For Stateful Dependencies

Move resource creation to the composition root and pass narrow capabilities into services.

```ts
// src/orders/orderService.ts
export type OrderRepository = {
  findOpenByCustomer(customerId: string): Promise<readonly { id: string }[]>
}

export type Clock = {
  now(): Date
}

export class OrderService {
  constructor(
    private readonly orders: OrderRepository,
    private readonly clock: Clock,
  ) {}

  async listOpenOrders(customerId: string) {
    const rows = await this.orders.findOpenByCustomer(customerId)
    return {
      generatedAt: this.clock.now().toISOString(),
      orders: rows,
    }
  }
}
```

```ts
// src/main.ts
import { OrderService } from "./orders/orderService.js"
import { createPostgresOrderRepository } from "./orders/postgresOrderRepository.js"

const orders = await createPostgresOrderRepository({
  connectionString: process.env.DATABASE_URL ?? "",
})

export const orderService = new OrderService(orders, {
  now: () => new Date(),
})
```

The service is unit-testable without mocking ESM modules:

```ts
import { strict as assert } from "node:assert"
import { test } from "node:test"
import { OrderService } from "./orderService.js"

test("adds generation time to open orders", async () => {
  const service = new OrderService(
    { async findOpenByCustomer() { return [{ id: "ord_123" }] } },
    { now: () => new Date("2026-01-02T03:04:05.000Z") },
  )

  assert.deepEqual(await service.listOpenOrders("cus_1"), {
    generatedAt: "2026-01-02T03:04:05.000Z",
    orders: [{ id: "ord_123" }],
  })
})
```

## Wiring Module Shape

Keep wiring explicit and boring.

```ts
// src/createApp.ts
import { createObjectStore } from "./storage/createObjectStore.js"
import { OrderService } from "./orders/orderService.js"
import { createRouter } from "./routes.js"

export async function createApp(env: NodeJS.ProcessEnv) {
  const logger = console
  const store = createObjectStore(
    env.STORE_ROOT ? { kind: "file", rootDir: env.STORE_ROOT } : { kind: "memory" },
    { logger },
  )
  const orderService = new OrderService({ findOpenByCustomer: async () => [] }, { now: () => new Date() })

  return createRouter({ orderService, store, logger })
}
```

Business modules should not call `container.get()`, read environment variables, or import concrete database clients when those choices belong to application startup.
