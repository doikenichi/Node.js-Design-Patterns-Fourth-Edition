# TypeScript Examples

These examples are original sketches for modern ESM Node.js 24+ projects. Adapt naming, error types, logging, tracing, and tests to the target codebase. Do not add third-party dependencies for these patterns unless the project already uses them.

## Explicit Proxy For Authorization And Forwarding

Use an explicit wrapper when only a few methods need mediation and TypeScript precision matters.

```ts
// src/documents/authorizedDocumentStore.ts
export type Document = Readonly<{
  id: string
  ownerId: string
  body: string
}>

export interface DocumentStore {
  get(id: string): Promise<Document | undefined>
  save(document: Document): Promise<void>
  delete(id: string): Promise<void>
}

export type AccessPolicy = {
  canRead(userId: string, document: Document): boolean
  canWrite(userId: string, document: Document): boolean
  canDelete(userId: string, documentId: string): Promise<boolean>
}

export function createAuthorizedDocumentStore(
  subject: DocumentStore,
  policy: AccessPolicy,
  userId: string,
): DocumentStore {
  return {
    async get(id) {
      const document = await subject.get(id)
      if (!document) {
        return undefined
      }
      if (!policy.canRead(userId, document)) {
        throw new Error("document access denied")
      }
      return document
    },

    async save(document) {
      if (!policy.canWrite(userId, document)) {
        throw new Error("document write denied")
      }
      await subject.save(document)
    },

    async delete(id) {
      if (!(await policy.canDelete(userId, id))) {
        throw new Error("document delete denied")
      }
      await subject.delete(id)
    },
  }
}
```

The proxy exposes the same `DocumentStore` role but controls access before forwarding.

## Lazy Proxy

Use lazy behavior when construction is expensive and not always needed. Keep lifecycle and failures visible.

```ts
// src/search/lazySearchClient.ts
export interface SearchClient {
  query(input: { text: string; limit: number }): Promise<readonly string[]>
  close(): Promise<void>
}

export function createLazySearchClient(
  createClient: () => Promise<SearchClient>,
): SearchClient {
  let clientPromise: Promise<SearchClient> | undefined

  const subject = () => {
    clientPromise ??= createClient()
    return clientPromise
  }

  return {
    async query(input) {
      return (await subject()).query(input)
    },

    async close() {
      if (clientPromise) {
        await (await clientPromise).close()
      }
    },
  }
}
```

Test that the factory is not called until first use, is called once for concurrent calls, and that failures do not disappear silently.

## JavaScript Proxy For Change Observation

Use `Proxy` when property-level interception is the actual requirement.

```ts
// src/settings/observableSettings.ts
export type Change<T extends object> = Readonly<{
  property: keyof T
  previous: unknown
  next: unknown
}>

export function createObservableObject<T extends object>(
  target: T,
  onChange: (change: Change<T>) => void,
): T {
  return new Proxy(target, {
    set(object, property: keyof T, value, receiver) {
      const previous = Reflect.get(object, property, receiver)
      if (Object.is(previous, value)) {
        return true
      }

      const updated = Reflect.set(object, property, value, receiver)
      if (updated) {
        onChange({ property, previous, next: value })
      }
      return updated
    },
  })
}
```

Avoid reading or writing through the proxy inside the trap; use the target and `Reflect` to avoid accidental recursion.

## Proxy-Based Method Interception With `this` Preservation

When using a `get` trap for methods, preserve `this` deliberately.

```ts
// src/metrics/instrumentedMethods.ts
type Meter = {
  observe(name: string, milliseconds: number): void
}

export function createInstrumentedObject<T extends object>(
  target: T,
  meter: Meter,
): T {
  const methodCache = new Map<PropertyKey, unknown>()

  return new Proxy(target, {
    get(object, property, receiver) {
      const value = Reflect.get(object, property, receiver)
      if (typeof value !== "function") {
        return value
      }

      if (!methodCache.has(property)) {
        methodCache.set(property, async (...args: unknown[]) => {
          const started = performance.now()
          try {
            return await Reflect.apply(value, object, args)
          } finally {
            meter.observe(String(property), performance.now() - started)
          }
        })
      }

      return methodCache.get(property)
    },
  })
}
```

This is convenient for broad interception, but explicit decorators are clearer when only one or two methods need metrics.

## Composition-Based Decorator

Use a decorator when the wrapped object keeps its role but gains optional behavior.

```ts
// src/orders/cachedOrderRepository.ts
export type Order = Readonly<{
  id: string
  customerId: string
  status: "open" | "closed"
}>

export interface OrderRepository {
  findById(id: string): Promise<Order | undefined>
  save(order: Order): Promise<void>
}

export type Cache = {
  get<T>(key: string): Promise<T | undefined>
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>
  delete(key: string): Promise<void>
}

export function withOrderCache(
  repository: OrderRepository,
  cache: Cache,
): OrderRepository {
  return {
    async findById(id) {
      const key = `order:${id}`
      const cached = await cache.get<Order>(key)
      if (cached) {
        return cached
      }

      const order = await repository.findById(id)
      if (order) {
        await cache.set(key, order, 60)
      }
      return order
    },

    async save(order) {
      await repository.save(order)
      await cache.delete(`order:${order.id}`)
    },
  }
}
```

The decorator preserves `OrderRepository` and adds caching. Tests should prove cache invalidation and error propagation.

## Composable Decorators And Ordering

Keep wrapper order explicit at the composition root.

```ts
// src/orders/createOrderRepository.ts
import { withOrderCache } from "./cachedOrderRepository.js"
import { withOrderMetrics } from "./meteredOrderRepository.js"
import { createPostgresOrderRepository } from "./postgresOrderRepository.js"

export async function createOrderRepository(env: NodeJS.ProcessEnv) {
  const baseRepository = await createPostgresOrderRepository({
    connectionString: env.DATABASE_URL ?? "",
  })

  const cached = withOrderCache(baseRepository, createRedisCache(env))
  return withOrderMetrics(cached, createMeter(env))
}
```

Put ordering decisions where dependencies are wired, then test order-sensitive behavior with fakes.

## Object Decoration By Augmentation

Use object augmentation only when mutating the object is intentional and safe for every holder of that instance.

```ts
// src/workers/addPauseCapability.ts
export interface WorkerControl {
  start(): Promise<void>
  stop(): Promise<void>
}

export interface PausableWorkerControl extends WorkerControl {
  pause(): void
  resume(): void
  isPaused(): boolean
}

export function addPauseCapability<T extends WorkerControl>(
  worker: T,
): T & PausableWorkerControl {
  let paused = false

  return Object.assign(worker, {
    pause() {
      paused = true
    },
    resume() {
      paused = false
    },
    isPaused() {
      return paused
    },
  })
}
```

Prefer returning a new wrapper when existing references should keep the original behavior.

## Adapter For A Third-Party Client

Use an adapter to protect domain code from infrastructure-specific names, options, and errors.

```ts
// src/billing/invoiceGateway.ts
export type Invoice = Readonly<{
  id: string
  customerId: string
  amountCents: number
  dueAt: Date
}>

export interface InvoiceGateway {
  fetchOpenInvoices(customerId: string): Promise<readonly Invoice[]>
  markPaid(invoiceId: string): Promise<void>
}
```

```ts
// src/billing/acmeBillingAdapter.ts
import type { Invoice, InvoiceGateway } from "./invoiceGateway.js"

type AcmeBillingSdk = {
  listBills(params: {
    account: string
    state: "unsettled" | "settled"
  }): Promise<{ items: Array<{ billId: string; account: string; cents: number; dueIso: string }> }>
  settleBill(billId: string): Promise<void>
}

export function createAcmeBillingAdapter(sdk: AcmeBillingSdk): InvoiceGateway {
  return {
    async fetchOpenInvoices(customerId) {
      const response = await sdk.listBills({
        account: customerId,
        state: "unsettled",
      })

      return response.items.map(item => ({
        id: item.billId,
        customerId: item.account,
        amountCents: item.cents,
        dueAt: new Date(item.dueIso),
      }))
    },

    async markPaid(invoiceId) {
      try {
        await sdk.settleBill(invoiceId)
      } catch (error) {
        throw translateBillingError(error, invoiceId)
      }
    },
  }
}

function translateBillingError(error: unknown, invoiceId: string): Error {
  if (isAcmeNotFound(error)) {
    return new Error(`invoice not found: ${invoiceId}`)
  }
  return error instanceof Error ? error : new Error("billing provider failed")
}

function isAcmeNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "status" in error && error.status === 404
}
```

The domain imports `InvoiceGateway`, not the SDK. Integration tests can exercise the real adapter, while unit tests use a fake `InvoiceGateway`.

## Higher-Order Function For Tiny Wrappers

Sometimes the right structural pattern is no named pattern at all.

```ts
export function measured<TArgs extends readonly unknown[], TResult>(
  name: string,
  operation: (...args: TArgs) => Promise<TResult>,
  observe: (name: string, milliseconds: number) => void,
) {
  return async (...args: TArgs): Promise<TResult> => {
    const started = performance.now()
    try {
      return await operation(...args)
    } finally {
      observe(name, performance.now() - started)
    }
  }
}
```

Use this instead of a full decorator when only one function needs instrumentation.
