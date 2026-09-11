---
name: nodejs-creational-design-patterns
description: "Recognize, select, implement, refactor, and review creational design patterns in production Node.js and TypeScript when object creation, initialization, runtime implementation selection, singleton state, or dependency wiring is part of the request. Avoids pattern recommendations when direct construction or ordinary functions are simpler."
---

# Node.js Creational Design Patterns

Use this skill to make creation logic clearer, safer, and easier to test in modern ESM Node.js 24+ and TypeScript codebases. The guidance is based on Chapter 7, "Creational Design Patterns", from *Node.js Design Patterns, Fourth Edition* and the corresponding repository examples, expressed as practical engineering rules rather than book prose.

Do not treat patterns as goals. First identify the creation problem, then choose the smallest design that solves it.

## When To Use

Activate this skill when asked to:

- Create objects whose concrete implementation varies by configuration, input, environment, feature flag, tenant, transport, file type, or runtime capability.
- Improve dependency construction or move wiring out of business logic.
- Introduce or review factories, builders, revealing constructors, singletons, or dependency injection.
- Remove hard-coded dependencies such as direct database/client/logger/cache imports from domain modules.
- Refactor constructors with many optional parameters, fragile initialization order, or hidden side effects.
- Improve initialization that needs controlled mutation followed by an immutable public surface.
- Review whether process-wide shared state is justified.
- Choose an appropriate creational pattern.

## When NOT To Use

Do not recommend or introduce a pattern merely because object creation exists.

Prefer direct construction, plain functions, or a small helper when:

- The constructor has a few obvious required arguments.
- There is only one implementation and no realistic runtime selection.
- A builder would only rename object-literal properties into setter calls.
- The object does not require staged construction, validation, or a readable construction DSL.
- Initialization can be handled by a normal constructor or factory without exposing restricted capabilities.
- Process-wide uniqueness is not a real invariant.
- Dependency injection would spread plumbing through a tiny script where a local import is clearer.

## Inputs/Context To Inspect

Before changing code, inspect:

- Existing constructors, factory functions, module exports, and composition/root entrypoints.
- Call sites that create the object, especially repeated argument lists or conditionals.
- Runtime selection signals: config, environment variables, file extensions, protocol names, feature flags, tenant settings, or CLI options.
- Module-level state and ESM imports that create resources during import.
- Tests and mocks around the object or dependency.
- Lifecycle requirements: async startup/shutdown, pooling, caching, disposal, idempotency, and reset behavior.
- TypeScript contracts: interfaces, discriminated unions, option types, branded values, readonly fields, and strict null checks.
- Error handling and validation boundaries.

## Pattern-Selection Workflow

Answer these questions in order:

1. What concrete problem exists at the call site or lifecycle boundary?
2. Is object creation actually complex, repeated, or error-prone?
3. Does the implementation need runtime selection?
4. Does the object require staged construction or a readable chain of optional choices?
5. Is controlled initialization required, where mutation should be possible only during construction?
6. Does state genuinely need process-wide uniqueness?
7. Would ordinary functions, direct construction, or an options object be simpler?

Then choose:

- Direct construction/no pattern for simple one-off creation.
- Factory when creation details or implementation selection should be hidden behind a stable API.
- Builder when many optional settings, construction order, or readability make an object literal too weak.
- Revealing Constructor when initialization code needs a narrow temporary capability and the final object must not expose mutation.
- Singleton only when process-wide identity is a true invariant and lifecycle/test costs are accepted.
- Dependency Injection when dependencies should be explicit, replaceable, and wired at the application boundary.

For a compact comparison, read [references/pattern-selection.md](references/pattern-selection.md).

## Refactoring Workflow

1. Preserve behavior first. Characterize current call sites and tests before moving creation logic.
2. Identify the creation boundary. Prefer a composition root such as `main.ts`, `server.ts`, `worker.ts`, route setup, command setup, or a `createApp()` function.
3. Extract the smallest useful creation API. A factory function is often enough; a class hierarchy or generic container should prove its value.
4. Move policy decisions out of consumers. Consumers should request a capability, not know which implementation class is selected.
5. Make dependencies explicit. Prefer constructor or factory injection over imports from deep inside business modules.
6. Keep lifecycle visible. Async resource creation should happen in an explicit startup path; cleanup should be returned or registered where ownership is clear.
7. Update tests to assert behavior through interfaces, not concrete implementation details.
8. Remove dead branching and duplicated construction once call sites are migrated.

## Implementation Workflow

- Define the smallest interface that consumers need.
- Keep factories deterministic where possible: input in, implementation out.
- Validate inputs near the creation boundary and fail with actionable errors.
- Avoid importing heavyweight resources at module load unless eager singleton behavior is intentional.
- In TypeScript, use `readonly`, `Readonly<T>`, literal unions, discriminated unions, and `satisfies` to tighten contracts without runtime dependencies.
- Return immutable final products when mutation after construction would break invariants.
- Keep async factories explicit with names such as `createDb()` or `createConfiguredClient()`.
- For runtime implementation maps, prefer typed registries over long conditional chains once variants grow.
- Keep wiring modules boring: instantiate dependencies, pass them in, start the app.

For original Node.js/TypeScript examples, read [references/typescript-examples.md](references/typescript-examples.md).

## JavaScript/TypeScript Considerations

- Use ESM imports/exports and include `.js` extensions in emitted JavaScript import paths when the project uses `moduleResolution: node16`, `nodenext`, or similar settings.
- `import.meta.dirname` is available in modern Node.js; use it when the codebase already targets Node 24+.
- Remember that ESM modules are cached by resolved module URL. Duplicate packages, alternate specifiers, workers, processes, test module isolation, or separate realms can still produce multiple instances.
- Prefer native `node:test`, `assert/strict`, `AbortController`, `URL`, `URLSearchParams`, `structuredClone`, and `Object.freeze()` where sufficient.
- Do not introduce dependency injection containers, reflection metadata, decorators, or runtime schema libraries unless the project already uses them or the scale justifies them.
- Keep class constructors side-effect-light. Put I/O and async startup into factories or composition roots.
- Represent dependencies as narrow object types or interfaces instead of concrete clients when only a few methods are needed.

## Testability Requirements

- Factories must be testable with representative selection inputs, including unsupported variants.
- Builders must test required-field validation, default behavior, invalid staged combinations, and immutability of the product when applicable.
- Revealing constructors must test that initialization can perform allowed mutation and the final object cannot.
- Singleton changes must test lifecycle behavior and must document/reset shared state if tests depend on it.
- Dependency-injected modules should be unit tested with small fakes or stubs without loading real databases, networks, clocks, or environment state.
- Composition roots can have thinner integration tests that prove real wiring works.

## Common Anti-Patterns

- Pattern-first refactoring with no clear creation problem.
- Factories that hide global state, I/O, or service location behind a friendly name.
- Builders with dozens of setters but no validation or invariant protection.
- Mutable builder state leaked into the final product.
- Constructors that perform network/database/file-system work.
- Singleton database/client/logging modules imported directly by domain code.
- ESM singleton assumptions that fail when packages are duplicated or code runs in multiple processes/workers.
- Service-locator APIs such as `container.get("db")` scattered through business logic.
- Tests that mock module internals instead of passing dependencies explicitly.
- Overly broad interfaces that force tests to fake entire infrastructure clients.

## Verification Checklist

- The chosen pattern directly addresses a named creation, initialization, lifecycle, or testability problem.
- Direct construction or a plain function was considered and rejected for a concrete reason.
- The implementation uses modern ESM and Node.js 24+ conventions.
- No new dependency was added when native JavaScript/Node.js was enough.
- Dependencies are explicit at business-module boundaries.
- Runtime implementation selection is centralized and covered by tests.
- Builders validate before returning a finished object.
- Final products are immutable when invariants depend on immutability.
- Singletons, if retained, have explicit lifecycle, reset/testing strategy, and documented scope limits.
- Tests cover both successful creation and invalid/unsupported creation paths.
