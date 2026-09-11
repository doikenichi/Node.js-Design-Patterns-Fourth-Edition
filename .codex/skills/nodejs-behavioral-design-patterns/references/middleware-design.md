# Middleware Design

Use this reference when implementing or reviewing request, event, or message pipelines.

## Pipeline Shape

Choose one middleware convention and make it explicit:

- Transform chain: each middleware receives a value and returns the next value.
- Context chain: each middleware receives a mutable or immutable context and returns or mutates it.
- `next()` chain: each middleware decides whether and when to call the next stage.
- Split inbound/outbound chain: inbound stages run in registration order, outbound stages often run in reverse order to unwind encoding, compression, encryption, or response processing.

Avoid mixing conventions in one pipeline unless a framework already requires it.

## Ordering

Ordering is part of behavior. Make it visible in setup code and test it.

Common order examples:

- Inbound network message: decrypt or decompress, parse, validate, authorize, handle.
- Outbound network message: serialize, compress or encrypt, send.
- HTTP request: correlation id, logging context, parse body, authenticate, authorize, validate, route handler, error handler.

For paired transformations, the outbound order often needs to reverse the inbound order. For example, if inbound is decompress then parse, outbound is serialize then compress.

## Error Behavior

Define how errors move through the chain:

- Transform chains usually reject or throw and stop immediately.
- `next()` chains need a single error path such as `next(error)` or a rejected promise.
- Message consumers may log, nack, dead-letter, retry, or drop. Pick one intentionally.
- Do not catch and only log inside reusable middleware unless the middleware owns recovery. Let the pipeline host decide final error handling.

Preserve original errors where useful. Wrap with cause when adding context:

```ts
throw new Error("failed to decode inbound message", { cause: error })
```

## Async-Safe Composition

```ts
export type Middleware<T> = (value: T) => T | Promise<T>

export function composeMiddleware<T>(
  middlewares: readonly Middleware<T>[],
): Middleware<T> {
  return async value => {
    let current = value
    for (const middleware of middlewares) {
      current = await middleware(current)
    }
    return current
  }
}
```

This transform style is enough for many message pipelines. Use a `next()` style only when middleware must run code before and after downstream stages, short-circuit, or delegate conditionally.

## `next()` Control Flow

If using `next()`, prevent double calls and missed awaits:

```ts
export type Context = { body?: unknown; status?: number }
export type NextMiddleware = (ctx: Context, next: () => Promise<void>) => Promise<void>

export function composeNext(middlewares: readonly NextMiddleware[]) {
  return async (ctx: Context): Promise<void> => {
    async function dispatch(index: number): Promise<void> {
      const middleware = middlewares[index]
      if (!middleware) {
        return
      }

      let called = false
      await middleware(ctx, async () => {
        if (called) {
          throw new Error("next() called multiple times")
        }
        called = true
        await dispatch(index + 1)
      })
    }

    await dispatch(0)
  }
}
```

## Testing Middleware

Middleware tests should assert:

- Registration order and execution order.
- Reverse order when inbound/outbound symmetry requires it.
- Context or message transformations at each important stage.
- Short-circuit behavior, if supported.
- Error propagation from sync throw and async rejection.
- Cleanup or after-hooks still run when downstream fails, if the contract promises that.
- Shared context remains intentionally scoped and does not become an untyped global bag.

Use small test middleware that records events into an array. That catches most ordering bugs cheaply.

## Anti-Patterns

- Hidden global middleware registration that changes behavior across tests.
- Swallowing errors inside each stage and continuing with corrupted context.
- Allowing both mutation and returned replacement values without a clear precedence rule.
- Middleware that knows too much about unrelated stages.
- Pipelines that require a stage to be placed "somewhere before auth" without tests pinning the exact order.
- Compression, encryption, or serialization stages arranged in an order that cannot be reversed on inbound.
