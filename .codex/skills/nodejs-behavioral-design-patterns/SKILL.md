---
name: nodejs-behavioral-design-patterns
description: "Recognize, select, implement, refactor, and review behavioral design patterns in production Node.js and TypeScript when algorithms, state-dependent behavior, workflow steps, iteration, pipelines, or task execution vary. Avoids pattern recommendations when a plain function, loop, or conditional is simpler."
---

# Node.js Behavioral Design Patterns

Use this skill to choose and implement behavioral abstractions in modern ESM JavaScript and TypeScript. The guidance is based on Chapter 9, "Behavioral Design Patterns", from *Node.js Design Patterns, Fourth Edition* and the corresponding official Packt examples, converted into original engineering guidance for real code.

Do not treat patterns as goals. Before naming or introducing a pattern, detect the actual source of variability in the code:

- `algorithm`: interchangeable ways to perform the same operation.
- `state`: behavior changes across lifecycle phases.
- `workflow steps`: a stable process has replaceable steps or hooks.
- `iteration`: values are traversed, streamed, generated, or processed lazily.
- `pipeline`: messages or requests pass through ordered processing stages.
- `operation/task`: work must be represented independently from when, where, or how it runs.

## When To Use

Activate this skill when asked to:

- Decide what behavioral abstraction best fits code.
- Replace growing conditionals, mode flags, lifecycle branching, callback arrays, stream loops, or ad hoc task queues.
- Introduce or review Strategy, State, Template, Iterator, Middleware, or Command.
- Make runtime behavior configuration-driven without spreading `switch` statements through business code.
- Model explicit state transitions, invalid transitions, or state machines.
- Design lazy sync or async traversal with iterators, generators, async iterators, async generators, or Node.js streams.
- Compose request, message, or event pipelines with explicit ordering and error behavior.
- Represent operations as queued, scheduled, retried, logged, audited, serialized, or remotely dispatched work.

## When NOT To Use

Prefer a plain function, object literal, loop, `for await`, direct stream pipeline, or small conditional when:

- There are only one or two local branches with no expected growth.
- The behavior varies once at startup and never needs a reusable contract.
- A class hierarchy would only rename callbacks into methods.
- State is just data, not a lifecycle with different valid operations.
- Iteration is eager, small, and clearer as an array operation.
- Middleware ordering is not meaningful and a direct function call is clearer.
- Commands would add ceremony around an operation that is never queued, scheduled, serialized, retried, audited, or undone.

## Pattern Selection

Use this matrix as guidance, not an automatic rule. Confirm the dominant source of variability and the simplest implementation that protects the codebase.

| Source of variability | Likely pattern | Main question |
| --- | --- | --- |
| Changing algorithm | Strategy | Can callers keep one contract while the algorithm is selected by config, input, dependency injection, or runtime capability? |
| Changing behavior by state | State | Does the object need explicit lifecycle behavior, transition rules, and invalid transition handling? |
| Fixed workflow with variable steps | Template | Is the high-level algorithm stable while individual steps or hooks differ? |
| Traversal/lazy sequence | Iterator | Should values be consumed one at a time, lazily, asynchronously, or by `for...of`/`for await...of`/streams? |
| Processing pipeline | Middleware | Do ordered stages transform, enrich, stop, continue, or fail a request/message? |
| Operation represented independently | Command | Must work be passed around, queued, scheduled, retried, logged, audited, serialized, or potentially undone? |

For detailed tradeoffs, read [references/pattern-selection.md](references/pattern-selection.md).

## Implementation Rules

- Use modern JavaScript/TypeScript and ESM imports/exports. For TypeScript emitted to Node ESM, use `.js` import specifiers where the target project requires them.
- Prefer JavaScript-native designs: functions as strategies, closures for captured context, generator functions for iterators, async generators for asynchronous sequences, and small middleware functions for pipelines.
- Introduce classes when identity, lifecycle, encapsulated mutable state, inheritance-based Template methods, or a public object contract makes them clearer.
- Make error behavior explicit: throw, return a result type, skip an item, stop the chain, route to error middleware, retry, or dead-letter. Do not silently swallow failures.
- Keep async code safe: preserve `AbortSignal`, backpressure, stream errors, cleanup, idempotency, and ordering where they matter.
- Centralize behavior selection. Do not scatter the same `switch`, mode flag, or lifecycle conditional across multiple methods.
- Keep contracts narrow and test through behavior, not private implementation details.
- Avoid adding dependencies unless the project already uses them or the pattern requires a mature engine, such as an established state-machine library for complex workflows.

## Pattern-Specific Guidance

- Strategy: use for interchangeable algorithms, configuration-driven behavior, functions as strategies, or injected policy objects. Keep the consumer unaware of the concrete algorithm except through a narrow contract.
- State: use when lifecycle state changes which operations are valid or how they behave. Make transitions explicit, reject invalid transitions predictably, and prefer a state machine over scattered conditionals when states and events multiply.
- Template: use when the algorithm skeleton is stable and customization points are limited. Prefer functional templates and hooks unless an existing inheritance style or framework lifecycle already fits.
- Iterator: use JavaScript iterator and iterable protocols for lazy traversal. Use generators or async generators for most hand-written iterators. For deeper async guidance, read [references/async-iteration.md](references/async-iteration.md).
- Middleware: use for ordered request/message pipelines with clear composition, control flow, and error propagation. For design details, read [references/middleware-design.md](references/middleware-design.md).
- Command: use when operations need an independent representation for delayed execution, queueing, scheduling, retries, logging, auditing, serialization, or remote dispatch. Implement undo only when the domain can actually compensate or reverse the effect.

For original TypeScript sketches, read [references/typescript-examples.md](references/typescript-examples.md).

## Testing Requirements

- Add unit tests for behavior selection, successful behavior, and explicit failure behavior.
- State changes must test allowed transitions, invalid transitions, idempotent or repeated events, and async transition races when relevant.
- Async iterators must have boundary tests: empty input, single item, multiple items, thrown/rejected source, early consumer break, cancellation, timeout, and cleanup.
- Middleware tests must cover ordering, short-circuiting when supported, error propagation, async rejection, and mutation/immutability expectations.
- Command tests must cover execution, scheduling or queue integration, retry policy, logging/auditing hooks, serialization when present, and undo/compensation only where supported.
- Use fakes for clocks, fetchers, queues, loggers, and services instead of real network, filesystem, or timers unless the project is running an integration test.

## Anti-Pattern Detection

Flag these during implementation or review:

- Pattern-first refactoring where the variability is not named.
- Multiple `switch` statements checking the same mode or state in different methods.
- Strategies that mutate shared state unexpectedly or hide I/O behind a pure-looking function.
- State objects that can transition anywhere without validation or observability.
- Template base classes with many required overrides, fragile call order, or hidden async hooks.
- Manual iterator objects where a generator would be shorter, safer, and clearer.
- Async iterators that ignore cancellation, leak resources after early break, or buffer the whole input.
- Middleware chains with undocumented ordering, swallowed errors, mixed sync/async conventions, or mutable shared context used as a dumping ground.
- Commands that are just renamed service method calls with no queueing, scheduling, retry, audit, serialization, or undo need.
- Fake undo for irreversible side effects such as emails, payments, external posts, or object storage writes without a real compensating operation.

## Verification Checklist

- The source of variability is explicitly identified as algorithm, state, workflow steps, iteration, pipeline, or operation/task.
- The chosen pattern directly addresses that variability, and a simpler function, loop, or conditional was considered.
- The implementation uses ESM and idiomatic modern JavaScript/TypeScript.
- Error behavior is documented in code structure and covered by tests.
- Async code preserves cancellation, cleanup, ordering, and backpressure where applicable.
- Configuration-driven behavior is centralized and type checked.
- Lifecycle states and invalid transitions are explicit when State is used.
- Middleware ordering is deterministic and tested when Middleware is used.
- Lazy iteration does not accidentally materialize unbounded data.
- Command retry, queue, schedule, audit, serialization, and undo semantics are explicit rather than implied.
