---
name: nodejs-dry-kiss-streams
description: "Create, review, and refactor Node.js and TypeScript code for maintainable simplicity: remove harmful duplication, avoid over-abstraction, and use streams with backpressure for large or incremental data flows."
---

# Node.js DRY, KISS, And Streams

Use this skill when creating, reviewing, or refactoring Node.js and TypeScript code where maintainability depends on simpler structure, less duplicated knowledge, or stream-based data flow. Apply it to production code, examples, tests, CLIs, services, libraries, and data-processing pipelines.

Do not treat DRY, KISS, or streams as slogans. Name the concrete maintenance pressure first, then choose the smallest design that makes the code easier to change safely.

## When To Use

Activate this skill when asked to:

- Refactor duplicated Node.js or TypeScript code, repeated validation, repeated mapping, repeated error handling, repeated async flow, repeated configuration, or repeated resource cleanup.
- Review code for over-engineering, unclear abstractions, accidental complexity, hard-to-follow control flow, or unnecessary dependencies.
- Create new code where the user explicitly wants DRY, KISS, reusable helpers, simple module boundaries, or maintainable examples.
- Replace large in-memory buffering with Node.js streams, async iterables, or `pipeline()` because data is large, incremental, backpressured, or comes from I/O.
- Review or implement stream transforms, file/network pipelines, compression, parsing, serialization, upload/download flows, CLI input/output, or ETL-style processing.
- Decide whether a stream, async iterator, array operation, ordinary promise, helper function, class, or module extraction is the clearest shape.

## When NOT To Use

Do not force this skill when:

- The task is primarily about a named design pattern, caching, cancellation, async initialization, testing, scaling, messaging, or CPU-bound work; use the more specific skill first.
- Two pieces of code merely look similar but represent different domain rules, different change cadences, or separate ownership boundaries.
- Data is small, bounded, already in memory, and clearer as an array or plain object.
- A one-off helper would hide intent, create indirection, or make the call site harder to read.
- A stream would add lifecycle, error, and backpressure complexity without reducing memory pressure or improving composition.

## Core Judgments

- DRY means avoid duplicated knowledge, not eliminate every repeated line. Repetition is sometimes clearer than an abstraction that couples unrelated behavior.
- KISS means prefer the smallest explicit design that handles the real requirements. It does not mean ignoring errors, cleanup, backpressure, validation, or edge cases.
- Streams are for incremental data and pressure-aware composition. If the code needs the entire dataset before doing useful work, a stream may only disguise buffering.
- Refactoring should preserve observable behavior unless the user explicitly asks for a behavior change.
- Prefer established project conventions over introducing a new abstraction style.

## Context To Gather

Before changing code, inspect:

- Call sites and future change pressure: what varies together, what varies independently, and who owns each rule.
- Existing project idioms for modules, factories, helpers, classes, error types, logging, configuration, streams, and tests.
- The shape and size of data: bounded vs unbounded, object mode vs byte streams, chunk size, memory pressure, latency, and ordering requirements.
- Async behavior: cancellation, cleanup, retries, concurrency, backpressure, and whether callers expect a promise, event emitter, stream, or async iterable.
- Public contracts: exported names, return types, thrown errors, event names, stream modes, side effects, timing, and compatibility expectations.
- Test coverage that characterizes current behavior before a risky simplification or extraction.

## DRY Refactoring Guidance

- Extract a helper when duplicated code shares the same reason to change. Keep the helper named after the domain operation, not the incidental mechanics.
- Keep duplication when it protects separate concepts from being coupled. Similar shape is not enough; shared meaning is the test.
- Prefer small pure functions for repeated transformations, predicates, normalization, validation, and formatting.
- Extract configuration or constants only when the value is a shared policy. Leave obvious local literals local when naming them adds noise.
- Avoid "options object soup" where one generic helper grows flags for unrelated cases. Split helpers when branching policy becomes harder than the duplicated code was.
- Keep abstractions close to their consumers until there is evidence that a wider module boundary is useful.
- Remove dead parameters, unused generality, speculative extension points, and inheritance introduced only to share a few lines.

## KISS Implementation Guidance

- Choose direct control flow over clever composition when the direct version is easier to debug.
- Prefer ordinary functions, plain objects, and local composition before classes, decorators, proxies, frameworks, or metaprogramming.
- Make data flow visible. Avoid hidden module-level state unless it is an explicit cache, singleton, registry, or process-wide policy.
- Keep error handling explicit at the boundary that can add context or recover. Do not swallow errors to keep code short.
- Use dependency injection for nondeterministic or external capabilities when it improves testability without distorting the production API.
- Keep modules cohesive: one reason to change, clear exports, and no mixed domain/infrastructure utility dumping ground.
- Refactor incrementally. Characterize behavior, extract or simplify one concern, update call sites, then run focused checks.

## Stream Guidance

- Prefer `stream/promises.pipeline()` for production pipelines so errors, completion, and teardown are handled consistently.
- Respect backpressure. Do not consume a stream with `data` events and write manually unless the code handles `write()` return values and `drain`.
- Use async iteration (`for await...of`) when it makes sequential chunk processing clearer and backpressure-aware.
- Use `Transform` streams for reusable chunk transformations, especially when composing file, network, compression, parser, or serializer stages.
- Set `objectMode`, `highWaterMark`, and encoding intentionally. Defaults for byte streams and object streams mean different things.
- Preserve chunk boundaries only when the format guarantees they matter. Parsers should handle records split across chunks.
- Propagate errors and close resources. Destroy streams on failure when ownership belongs to the pipeline.
- Avoid collecting all chunks into memory unless the output must be a complete bounded value.
- Prefer built-in Node.js stream utilities and Web Streams interop only when the surrounding APIs need that shape.

## Review Procedure

When reviewing code, lead with concrete risks:

- duplicated business rules that can diverge;
- abstractions that hide simple behavior or couple unrelated cases;
- stream code that ignores backpressure, errors, cleanup, or partial chunks;
- excessive buffering of large or unbounded input;
- unclear ownership of helpers, constants, configuration, or lifecycle;
- tests that lock in implementation details instead of observable behavior.

If the code is already simple and the duplication is harmless, say so. Recommend no change when a refactor would lower clarity.

## Testing And Verification

- Add characterization tests before refactoring behavior with meaningful blast radius.
- Test extracted helpers through meaningful public behavior where possible; add direct helper tests only when the helper is exported or complex enough to merit its own contract.
- Stream tests should cover success, source errors, transform errors, destination errors, early close, partial records across chunks, and backpressure-sensitive behavior when relevant.
- Verify memory behavior or peak buffering when replacing buffered code with streams.
- Run the most focused project checks first, then the relevant broader suite.

## Pitfalls To Avoid

- Replacing obvious duplication with a generic function full of flags.
- Creating a shared utility module that becomes a miscellaneous dumping ground.
- Hiding domain decisions behind names like `processData`, `handleItem`, or `commonHelper`.
- Introducing classes solely to group stateless functions.
- Turning a readable loop into a dense chain of callbacks or reducers.
- Treating `Promise.all()` concurrency as streaming.
- Mixing object-mode assumptions with byte streams.
- Ignoring stream errors because the happy path worked with small fixtures.
- Claiming performance or memory improvements without evidence.

## Verification Checklist

- The refactor removes duplicated knowledge or accidental complexity, not just repeated syntax.
- Any new abstraction has one clear reason to exist and fewer moving parts than the duplication it replaces.
- Simple local code stayed local when broader reuse was speculative.
- Stream usage is justified by data size, incremental processing, composition, or backpressure.
- Backpressure, errors, cleanup, encodings, object mode, and partial chunks are handled where streams are involved.
- Public behavior, exports, async timing, and error semantics are preserved or intentionally changed with tests.
- Targeted tests or checks were run, and any unrun verification is reported.
