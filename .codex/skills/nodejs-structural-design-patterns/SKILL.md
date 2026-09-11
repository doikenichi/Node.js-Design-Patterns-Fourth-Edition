---
name: nodejs-structural-design-patterns
description: "Recognize, select, implement, refactor, and review structural design patterns in production Node.js and TypeScript when wrapping APIs, translating interfaces, adding behavior, access control, logging, metrics, compatibility layers, migrations, legacy integrations, Proxy, Decorator, or Adapter work is part of the request. Avoids pattern recommendations when a plain function or ordinary composition is simpler."
---

# Node.js Structural Design Patterns

Use this skill to make object relationships, wrappers, and interface boundaries clearer in modern ESM Node.js 24+ and TypeScript codebases. The guidance is based on Chapter 8, "Structural Design Patterns", from *Node.js Design Patterns, Fourth Edition* and the official Packt example repository, expressed as original engineering rules for real code changes and reviews.

Do not treat patterns as goals. First inspect the code and identify the structural pressure: access control, behavior extension, interface translation, or dependency isolation.

## When To Use

Activate this skill when asked to:

- Wrap a third-party API, SDK, database, filesystem-like library, stream, queue, cache, logger, metrics client, payment provider, auth service, or legacy module.
- Translate one interface into another for compatibility, migration, or infrastructure isolation.
- Add behavior without modifying an existing component, such as logging, metrics, tracing, validation, caching, retry policy, authorization, lazy initialization, change observation, or feature flags.
- Introduce or review Proxy, Decorator, Adapter, wrapper, compatibility layer, anti-corruption boundary, facade-like boundary, or migration adapter code.
- Refactor inheritance, monkey-patching, object augmentation, duplicated forwarding methods, or fragile integration code into composition.
- Intercept access, method calls, property reads/writes, or mutations with JavaScript `Proxy`.
- Review whether a wrapper preserves the observable behavior of the wrapped component.

## When NOT To Use

Do not recommend or introduce a structural pattern merely because code calls another object.

Prefer a simple function, direct call, object literal, or ordinary composition when:

- The transformation is local, one-off, and obvious at the call site.
- The wrapper would only rename methods without protecting a boundary or simplifying consumers.
- The component is already easy to test and has no meaningful external dependency leakage.
- A logger, validator, or mapper can be passed as a normal callback or helper.
- Runtime interception is unnecessary and explicit methods would be clearer.
- The added behavior is better owned inside the component because it is part of its core invariant.
- The codebase does not need a compatibility layer, migration path, or domain-facing contract.

## Context To Gather

Before changing code, inspect:

- Consumers and call sites: what interface do they actually need?
- Current wrapper, adapter, inheritance, mixin, monkey-patch, or `Proxy` usage.
- External contracts: exported types, public method names, thrown errors, return values, event names, stream behavior, serialization, timing, and side effects.
- Ownership boundaries: domain code, application services, infrastructure clients, composition roots, framework adapters, and test seams.
- Cross-cutting behavior: logging, metrics, tracing, authorization, validation, caching, retry, lazy creation, and observation.
- `this` usage and method extraction risks in the target object.
- TypeScript surface area: interfaces, overloads, generics, structural typing, `this` parameters, readonly fields, async return types, and narrowed domain types.
- Existing tests and fixtures for behavior that the wrapper must preserve.

## Pattern Selection

Answer these questions before applying a pattern:

1. Would a plain function or direct composition solve the problem with less ceremony?
2. Is the goal to control access to an existing subject? Choose Proxy.
3. Is the goal to add capabilities or cross-cutting behavior while keeping the same role? Choose Decorator.
4. Is the goal to make an incompatible dependency look like a domain-facing contract? Choose Adapter.
5. Is the case ambiguous? Name the dominant semantic model and keep the implementation simple.
6. Does JavaScript `Proxy` provide needed dynamic interception, or would explicit forwarding be easier to read, type, debug, and optimize?

For a compact comparison, read [references/pattern-selection.md](references/pattern-selection.md). For ambiguous Proxy/Decorator choices, read [references/proxy-vs-decorator.md](references/proxy-vs-decorator.md).

## Implementation Procedure

- Define the smallest consumer-facing interface first. The wrapper should expose capabilities the caller needs, not the entire underlying object by habit.
- Preserve existing external behavior unless the user explicitly requests a behavior change. Keep method names, async timing, errors, `this` expectations, return values, events, and side effects compatible.
- Prefer explicit wrappers when the affected surface is small or TypeScript typing matters. Use `Proxy` when dynamic property access, mutation observation, lazy resolution, or broad forwarding is the real need.
- Forward methods deliberately. If methods rely on `this`, bind them or call with `Reflect.apply()` so extraction through the wrapper does not break behavior.
- Keep validation and authorization wrappers narrow. Do not turn them into hidden service locators or policy engines.
- Keep decorators composable and document order-sensitive behavior in code structure or tests. Prefer small wrapper factories such as `withMetrics(withAuthorization(client))` only when order is intentional and covered.
- Keep adapters at infrastructure boundaries. Domain code should depend on a stable contract, while adapter code translates SDK names, options, pagination, errors, and data shapes.
- Isolate adaptee-specific concepts. Do not leak provider option bags, error classes, cursors, resource names, or transport semantics through a domain adapter unless the domain contract explicitly owns them.
- Use modern ESM imports/exports. For TypeScript emitted to Node ESM, use `.js` import specifiers where the project requires them.

For original Node.js/TypeScript examples, read [references/typescript-examples.md](references/typescript-examples.md).

## Incremental Refactoring Procedure

1. Characterize current behavior with tests or focused assertions before moving code.
2. Introduce a narrow interface at the consumer boundary.
3. Build the wrapper, decorator, or adapter around the existing implementation.
4. Migrate one call site or feature path at a time, keeping the old API available while needed.
5. Preserve error compatibility or add an explicit translation layer with tests.
6. Remove duplicated forwarding, monkey-patches, and direct SDK imports after all consumers move to the new boundary.
7. Re-run the existing project checks and add targeted tests for the wrapper behavior.

## TypeScript Typing Considerations

- Prefer named interfaces or type aliases for consumer-facing capabilities.
- Use `Pick<T, ...>` only when the domain truly wants the same semantics as the source type. Otherwise define a domain type.
- Preserve async shapes: do not wrap `Promise<T>` APIs into callback or sync-looking APIs unless adapting by design.
- For decorators, return the same interface when behavior is extended but the role is unchanged; return an extended interface only when new capabilities are deliberately exposed.
- For adapters, avoid exporting third-party types from domain modules. Map them to domain values at the boundary.
- `Proxy` usually needs explicit type assertions or factory return types. Keep the handler small enough that the assertion remains honest.
- When forwarding overloaded functions, write explicit wrapper methods if generic `Proxy` forwarding would erase useful type information.

## Testing Requirements

- Test the wrapper through the public interface, not by inspecting private wrapper internals.
- Proxy tests must cover allowed and denied access, forwarding, validation, lazy behavior, observability/change interception, and `this` binding when relevant.
- Decorator tests must cover base behavior preservation, added behavior, composition order, error propagation, and async cleanup/flush behavior.
- Adapter tests must cover data translation, option translation, provider error mapping, unsupported cases, and that consumers do not import the third-party client directly.
- Add characterization tests before risky refactors, especially around legacy integrations and migration adapters.
- Include at least one negative path for validation, authorization, missing records, unsupported provider features, or incompatible input.

## JavaScript Proxy Performance

Use JavaScript `Proxy` with intent. It can be elegant for broad interception, dynamic properties, and observation, but it has real costs:

- Traps run on every intercepted operation and can hurt hot paths.
- Proxies are harder for readers, debuggers, type checkers, serializers, identity checks, and some optimizers.
- Broad `get` traps can accidentally wrap methods repeatedly or allocate closures per access.
- Prefer explicit wrappers in performance-sensitive loops, stream hot paths, parsers, and frequently called domain services unless dynamic interception is essential.
- If `Proxy` is justified, keep traps minimal, use `Reflect.get()`/`Reflect.set()` with the receiver where appropriate, cache wrapped methods if needed, and benchmark hot paths.

## Pitfalls To Avoid

- Transparent wrappers that unexpectedly change semantics, timing, identity, mutation behavior, errors, or resource ownership.
- Recursive `Proxy` traps caused by reading or writing through the proxy from inside the trap instead of the target or `Reflect`.
- Breaking `this` binding when forwarding methods.
- Leaking adaptee-specific concepts through adapters into domain code.
- Decorator ordering bugs where validation, logging, caching, retries, or authorization run in the wrong sequence.
- Excessive wrapper nesting that makes stack traces, ownership, and debugging unclear.
- Unnecessary runtime metaprogramming when explicit functions or composition would be simpler.
- Object augmentation or monkey-patching that mutates shared instances unexpectedly.
- Wrappers that swallow errors, lose `AbortSignal`, ignore backpressure, or fail to preserve cleanup behavior.
- Adapters that become bidirectional translation dumping grounds instead of protecting a clear boundary.

## Verification Checklist

- The chosen pattern directly addresses a named access, extension, translation, compatibility, or dependency-isolation problem.
- A simple function or ordinary composition was considered first.
- Existing external behavior is preserved or intentional behavior changes are explicitly tested.
- The wrapper has a narrow, documented ownership boundary.
- `this` binding, async timing, errors, events, stream backpressure, cancellation, and cleanup remain correct where applicable.
- TypeScript types expose domain-facing contracts and avoid unnecessary third-party leakage.
- JavaScript `Proxy` is used only where dynamic interception is worth the performance and readability costs.
- Decorator order is deterministic and covered by tests when multiple decorators compose.
- Adapters translate data, options, and errors at the infrastructure boundary.
- Tests cover success, failure, and edge cases for the wrapper behavior.
