# Proxy Versus Decorator

Proxy and Decorator can look identical in code because both hold or wrap another object. Use the semantic intent to choose names, tests, and implementation shape.

## Proxy

Choose Proxy when the wrapper stands between the caller and the subject.

Typical intent:

- Control whether access is allowed.
- Validate arguments or state before forwarding.
- Log, meter, trace, observe, or audit access.
- Delay creation until the subject is actually used.
- Forward most operations but intercept a few.
- Represent virtual or remote access to something expensive, protected, or dynamic.
- Intercept object changes with JavaScript `Proxy` traps.

Design rule:

- The caller wants the subject's capability, but access to that capability needs mediation.

Example naming:

- `createAuthorizedDocumentStore(store, policy)`
- `createLazySearchClient(factory)`
- `createObservableSettings(settings, observer)`
- `withAccessLog(repository, logger)` can be acceptable, but if the dominant point is access mediation, prefer proxy-oriented names in tests and docs.

## Decorator

Choose Decorator when the wrapper adds behavior or capabilities while the object keeps the same role.

Typical intent:

- Add caching around a repository.
- Add metrics around a service.
- Add retries around an HTTP client.
- Add compression/encryption around a storage writer.
- Add convenience methods to an object without subclassing.
- Compose optional behavior at startup.

Design rule:

- The caller wants a richer version of the same role, not primarily a gatekeeper.

Example naming:

- `withCache(repository, cache)`
- `withMetrics(service, meter)`
- `withRetry(client, retryPolicy)`
- `createPublishingTaskQueue(queue, events)`

## Ambiguous Cases

Some wrappers both mediate and extend. Pick the simplest dominant model:

- Authorization plus logging around a repository is usually a Proxy because access control is the core behavior.
- Caching can be a Decorator when it enriches performance while preserving semantics, but it becomes a Proxy when it controls expensive remote access or lazy loading.
- Validation can be a Proxy when it protects the subject from invalid operations, but it is ordinary domain logic when validation is a core invariant.
- Metrics is usually a Decorator, but access audit logging may be a Proxy when it records who touched protected data.
- JavaScript `Proxy` used for object change observation is usually an observability proxy, even if it does not restrict access.

## Review Heuristics

- If removing the wrapper exposes unsafe, unauthorized, premature, or unobserved access, call it a Proxy.
- If removing the wrapper leaves correct behavior but loses optional capabilities, call it a Decorator.
- If callers see a different interface from the underlying object, consider Adapter first.
- If a name such as `EnhancedThing`, `SafeThing`, or `WrappedThing` hides the intent, rename toward the actual behavior.
- If the wrapper changes semantics, make that change explicit in the contract and tests. Transparent wrappers should not surprise callers.

## Ordering

Ordering matters when composing wrappers. Decide it deliberately:

```ts
const repository = withMetrics(
  createAuthorizedRepository(
    withCache(postgresRepository, cache),
    policy,
  ),
  meter,
)
```

This order measures authorization failures and cache hits differently than:

```ts
const repository = createAuthorizedRepository(
  withMetrics(withCache(postgresRepository, cache), meter),
  policy,
)
```

There is no universal right order. Tests should show whether validation, authorization, caching, retry, logging, and metrics run before or after each other.
