# Additional Codex Skills — Node.js Design Patterns, 4th Edition

## 1. Callbacks and Events

Create a Codex Agent Skill named:

`nodejs-callbacks-and-events`

Use the built-in `$skill-creator` skill if available.

Create it under:

`${CODEX_HOME:-$HOME/.codex}/skills/nodejs-callbacks-and-events`

Base the engineering knowledge on Chapter 3, **Callbacks and Events**, of *Node.js Design Patterns, Fourth Edition* by Mario Casciaro and Luciano Mammino.

Use the official Packt GitHub examples from:

`03-callbacks-and-events`

Do not reproduce copyrighted book prose. Convert the chapter concepts and public examples into practical software-engineering guidance.

The purpose of this skill is to make Codex understand legacy and low-level asynchronous Node.js APIs built with callbacks and events, while avoiding unnecessary introduction of callback-based APIs into modern application code.

Cover:

* continuation-passing style;
* synchronous CPS;
* asynchronous CPS;
* non-CPS callbacks;
* consistent asynchronous behavior;
* avoiding Zalgo;
* Node.js callback conventions;
* error-first callbacks;
* error propagation;
* uncaught asynchronous errors;
* Observer pattern;
* `EventEmitter`;
* event listeners;
* event-based error propagation;
* synchronous versus asynchronous event emission;
* listener cleanup;
* memory leaks caused by listeners;
* callbacks versus events;
* combining callbacks and events.

The skill must clearly distinguish:

### Callback

Use when exactly one eventual result or failure must be communicated to one caller, particularly when interacting with an existing callback API.

### EventEmitter

Use when an object or process may emit zero, one, or many independent notifications over time and potentially has multiple observers.

### Promise / async-await

Prefer for modern APIs representing one future completion value.

### Stream

Prefer when the abstraction represents a sequence of data with flow control and backpressure.

The skill must NOT recommend callbacks merely because Node.js historically used callbacks.

When reviewing new application code:

* prefer `async/await`;
* use Promises where Promise composition is appropriate;
* use callbacks primarily for compatibility with existing callback APIs;
* use `EventEmitter` only when event semantics genuinely fit the problem.

Workflow:

1. Inspect the existing API.
2. Determine whether it represents:

   * one future result;
   * multiple events;
   * a data stream;
   * or synchronous computation.
3. Preserve callback interfaces when compatibility requires them.
4. Avoid introducing new callback-style public APIs without justification.
5. Ensure callbacks are invoked exactly once.
6. Ensure asynchronous APIs behave consistently asynchronously.
7. Propagate errors correctly.
8. Clean up event listeners.
9. Add tests for success, failure, multiple events, and cleanup.
10. Run available tests, linting, formatting, and type checking.

For callback APIs, enforce conventional Node.js shape where appropriate:

`callback(error, result)`

Teach Codex to recognize dangerous designs such as:

* callback called more than once;
* callback sometimes invoked synchronously and sometimes asynchronously;
* thrown exceptions used instead of callback errors;
* unhandled `error` events;
* listener accumulation;
* callback hell;
* nested callback control flow that should be modernized.

When modernization is allowed, prefer converting callback-based APIs to Promise-based APIs and consuming them with `async/await`.

Create:

* `SKILL.md`
* `agents/openai.yaml`
* `references/callback-conventions.md`
* `references/event-emitter.md`
* `references/callbacks-vs-events.md`
* `references/modernization.md`

Keep detailed examples in `references/`.

The skill description should trigger this skill for tasks involving:

* callbacks;
* Node-style callbacks;
* EventEmitter;
* events;
* Observer pattern;
* callback APIs;
* legacy asynchronous Node.js code;
* callback-to-Promise migration;
* event listener lifecycle;
* asynchronous error handling.

Validate the completed skill before finishing.

---

# 2. Asynchronous Control Flow Patterns with Callbacks

Create a Codex Agent Skill named:

`nodejs-callback-control-flow`

Use `$skill-creator` if available.

Create it under:

`${CODEX_HOME:-$HOME/.codex}/skills/nodejs-callback-control-flow`

Base it on Chapter 4, **Asynchronous Control Flow Patterns with Callbacks**, of *Node.js Design Patterns, Fourth Edition*.

Use the official Packt GitHub examples from:

`04-asynchronous-control-flow-patterns-with-callbacks`

This is primarily a **legacy-code comprehension, maintenance, and modernization skill**.

Do not encourage callback-based control flow for new application code when `async/await` can express the same behavior more clearly.

Cover:

* asynchronous control-flow challenges;
* callback hell;
* callback discipline;
* sequential execution;
* sequential iteration;
* data flowing through sequential operations;
* concurrent execution;
* race conditions;
* limited concurrency;
* global concurrency limits;
* task queues implemented using callbacks;
* asynchronous error propagation.

Codex must understand callback control-flow patterns well enough to safely maintain existing systems.

However, when adding new functionality or performing substantial refactoring, use this preference:

1. `async/await`
2. Promise-based composition
3. callbacks only when required by an existing API or compatibility constraint

Workflow for existing callback code:

1. Inspect the control flow.
2. Determine whether operations are:

   * sequential;
   * concurrent;
   * dependency-driven;
   * or concurrency-limited.
3. Identify callback nesting and error paths.
4. Identify shared-state race conditions.
5. Identify whether concurrency is bounded.
6. Preserve behavior before refactoring.
7. Add characterization tests when needed.
8. Simplify control flow.
9. If compatibility permits, migrate the internal implementation to Promises/async-await.
10. Preserve external callback APIs when changing them would break callers.
11. Validate concurrency and failure behavior.

When migrating callback code:

Prefer:

`callback API -> Promise wrapper -> async/await orchestration`

Do not merely mechanically replace callbacks with `await`.

Preserve:

* execution ordering;
* concurrency;
* failure semantics;
* retry behavior;
* resource cleanup;
* existing API contracts.

Explicitly warn against converting concurrent callback code into accidentally sequential `await` loops.

Teach Codex that:

```js
for (const item of items) {
  await process(item)
}
```

is intentionally sequential.

Where independent tasks should execute concurrently, consider constructs such as:

```js
await Promise.all(...)
```

Where concurrency must be bounded, use a concurrency-limiting mechanism rather than launching every operation simultaneously.

Do not use `Array.prototype.forEach()` as an asynchronous control-flow primitive.

Create:

* `SKILL.md`
* `agents/openai.yaml`
* `references/sequential-flow.md`
* `references/concurrent-flow.md`
* `references/limited-concurrency.md`
* `references/callback-modernization.md`

The skill should trigger strongly when Codex encounters nested callbacks or existing Node.js callback-based asynchronous orchestration.

It should usually recommend modernization rather than expanding callback-oriented architecture.

Validate the skill before finishing.

---

# 3. Asynchronous Control Flow with Promises and Async/Await

Create a Codex Agent Skill named:

`nodejs-promises-async-await`

Use `$skill-creator` if available.

Create it under:

`${CODEX_HOME:-$HOME/.codex}/skills/nodejs-promises-async-await`

Base it on Chapter 5, **Asynchronous Control Flow Patterns with Promises and Async/Await**, of *Node.js Design Patterns, Fourth Edition*.

Use the official Packt GitHub examples from:

`05-asynchronous-control-flow-patterns-with-promises-and-async-await`

This should become the primary skill for general asynchronous application logic in modern Node.js.

Target Node.js 24+.

## Core policy

When writing modern asynchronous Node.js code:

**Prefer `async/await` as the default expression of asynchronous control flow.**

Use direct Promise composition when Promise semantics provide a clearer solution.

Use callbacks only when integration with an existing callback API requires them.

Cover:

### Promises

* Promise states and settlement;
* creating Promises;
* Promise chaining;
* Promise return values;
* rejection propagation;
* promisification;
* lazy asynchronous operations where appropriate;
* sequential Promise execution;
* concurrent execution;
* limited concurrent execution.

### Promise combinators

Reason appropriately about:

* `Promise.all()`;
* `Promise.allSettled()`;
* `Promise.race()`;
* `Promise.any()`.

Do not choose a combinator mechanically.

Select it according to failure and completion semantics.

### Async/await

Cover:

* async functions;
* `await`;
* top-level await;
* structured error handling;
* `try/catch/finally`;
* sequential execution;
* concurrent execution;
* limited concurrency;
* returning Promises from async functions;
* difference between `return promise` and `return await promise` where error-stack or `try/catch` semantics make it relevant.

## Control-flow reasoning

Before writing asynchronous code, Codex must determine whether operations are:

### Sequential

Operation B depends on the result or side effect of operation A.

Use:

```js
const a = await operationA()
const b = await operationB(a)
```

### Concurrent

Independent operations can execute simultaneously.

Prefer starting them together and awaiting their completion.

### Limited concurrency

Many independent operations exist, but executing all of them simultaneously could overwhelm:

* APIs;
* databases;
* sockets;
* memory;
* CPU;
* file descriptors;
* external services.

Use bounded concurrency.

## Important anti-patterns

Explicitly detect:

* `await` inside `forEach`;
* unnecessarily sequential independent operations;
* unbounded `Promise.all()` over huge inputs;
* missing rejection handling;
* manually constructing Promises around already Promise-returning functions;
* Promise constructor anti-patterns;
* forgotten `await`;
* floating Promises;
* swallowed errors;
* retry loops without bounds;
* recursive Promise chains that can grow indefinitely;
* unnecessary mixtures of callbacks and Promises.

## Migration

When encountering callbacks:

Prefer platform or library Promise APIs first.

If none exist, consider promisification or a small Promise adapter.

Keep callback compatibility at boundaries where required.

Internally prefer async/await.

## Workflow

1. Inspect existing asynchronous behavior.
2. Determine dependencies between operations.
3. Determine desired concurrency.
4. Determine failure semantics.
5. Determine cancellation and timeout requirements.
6. Prefer async/await for orchestration.
7. Use Promise combinators where they clearly represent concurrent behavior.
8. Bound concurrency when necessary.
9. Propagate errors rather than silently swallowing them.
10. Add cancellation with `AbortSignal` where appropriate.
11. Test success, failure, concurrency, and cancellation.
12. Run project validation.

Create:

* `SKILL.md`
* `agents/openai.yaml`
* `references/async-await.md`
* `references/promise-combinators.md`
* `references/concurrency.md`
* `references/promisification.md`
* `references/async-antipatterns.md`

The skill description should make this skill activate for most implementation or review work involving:

* asynchronous Node.js code;
* async functions;
* Promises;
* API calls;
* database calls;
* filesystem operations;
* concurrency;
* parallel tasks;
* asynchronous loops;
* async refactoring.

This should be the **default asynchronous programming skill** for modern Node.js application code.

Validate the completed skill before finishing.

---

# 4. Coding with Streams

Create a Codex Agent Skill named:

`nodejs-streams`

Use `$skill-creator` if available.

Create it under:

`${CODEX_HOME:-$HOME/.codex}/skills/nodejs-streams`

Base it on Chapter 6, **Coding with Streams**, of *Node.js Design Patterns, Fourth Edition*.

Use the official Packt GitHub examples from:

`06-coding-with-streams`

Target Node.js 24+.

The purpose of this skill is to make Codex recognize when streams are a better abstraction than loading entire datasets into memory or manually coordinating repeated asynchronous operations.

Cover:

* Readable streams;
* Writable streams;
* Duplex streams;
* Transform streams;
* object mode;
* stream lifecycle;
* backpressure;
* buffering;
* flow control;
* piping;
* `pipeline`;
* stream errors;
* cleanup;
* asynchronous stream processing;
* stream composition;
* fork patterns;
* merge patterns;
* multiplexing where applicable;
* async iteration over streams;
* readable-stream utilities;
* stream consumer utilities;
* Web Streams;
* interoperability between Node.js streams and Web Streams.

## Pattern-selection responsibility

The skill must distinguish between:

### Promise / async-await

Best for a discrete asynchronous operation producing one eventual result.

### Async iterable

Best for a sequence of asynchronous values where pull-based iteration is appropriate.

### Stream

Best when processing potentially large or continuous data where:

* incremental processing matters;
* memory consumption matters;
* backpressure matters;
* data naturally flows through processing stages.

### EventEmitter

Best for notifications/events, not bulk data pipelines.

Do not use streams simply because an API happens to support them.

Do not buffer an entire large resource if a streaming implementation is straightforward and materially improves memory or latency.

## Prefer modern stream composition

Where practical, prefer robust pipeline APIs that correctly propagate errors and cleanup.

Avoid manual chains of `.pipe()` where a safer pipeline abstraction better represents the operation.

## Backpressure

The skill must treat backpressure as a first-class correctness property.

When writing custom streams:

* respect `write()` return values;
* correctly implement `_read`, `_write`, `_transform`, or equivalent modern APIs;
* avoid uncontrolled producers;
* avoid unbounded buffering.

## Error handling

Ensure:

* all stream errors propagate;
* partial pipelines are cleaned up;
* resources are closed;
* cancellation destroys or aborts the complete pipeline where appropriate.

## Async iteration

Where imperative consumption is clearer, consider:

```js
for await (const chunk of readable) {
  // process chunk
}
```

But do not replace a natural transformation pipeline with a manual loop without reason.

## Workflow

1. Determine the shape and expected size of the data.
2. Determine whether incremental processing provides value.
3. Determine memory constraints.
4. Determine backpressure requirements.
5. Choose streams only when appropriate.
6. Prefer existing Node.js stream utilities before writing custom stream classes.
7. Compose small transforms.
8. Propagate errors and cancellation.
9. Ensure resources are cleaned up.
10. Test slow consumers and producer/consumer failures.
11. Test large data where relevant.
12. Run project validation.

Create:

* `SKILL.md`
* `agents/openai.yaml`
* `references/stream-selection.md`
* `references/backpressure.md`
* `references/pipeline-patterns.md`
* `references/async-iteration.md`
* `references/web-streams.md`
* `references/testing-streams.md`

The skill should trigger for:

* file processing;
* uploads/downloads;
* HTTP request/response bodies;
* compression;
* parsing;
* ETL;
* data pipelines;
* large files;
* streaming APIs;
* incremental transformations;
* backpressure issues;
* memory-heavy data processing.

Validate the completed skill before finishing.

---

# 5. Preferred Node.js Asynchronous Programming Style

Create a Codex Agent Skill named:

`nodejs-async-programming-policy`

Use `$skill-creator` if available.

Create it under:

`${CODEX_HOME:-$HOME/.codex}/skills/nodejs-async-programming-policy`

This is a cross-cutting engineering policy skill.

Its purpose is to establish a consistent decision hierarchy for asynchronous Node.js development.

## Fundamental preference

For application-level asynchronous control flow, prefer:

**1. async/await**
**2. Promises**
**3. callbacks**

This ordering is a strong default, not an absolute prohibition.

Codex must understand the underlying asynchronous primitives even when a higher-level syntax is preferred.

---

# 1. Prefer async/await

Use `async/await` for most application control flow because it generally provides:

* clear sequential logic;
* straightforward error handling;
* readable branching;
* readable loops;
* easier refactoring;
* easier debugging;
* explicit control flow.

Prefer:

```js
const user = await loadUser(id)
const orders = await loadOrders(user.id)
```

over equivalent Promise chains when the operations are naturally sequential.

Use `try/catch/finally` where explicit error handling or cleanup is needed.

Do not add `try/catch` only to rethrow the exact same error without adding useful behavior.

---

# 2. Use Promise composition when it expresses the problem better

Promises remain the underlying abstraction and should be used directly where composition improves clarity.

Examples include:

* concurrent operations;
* aggregating asynchronous operations;
* racing alternatives;
* awaiting the first successful operation;
* reusable Promise-returning APIs;
* lazy or deferred asynchronous abstractions where justified.

Example:

```js
const [user, settings, permissions] = await Promise.all([
  loadUser(),
  loadSettings(),
  loadPermissions()
])
```

Do not rewrite good Promise concurrency into unnecessarily sequential awaits.

---

# 3. Use callbacks last

Do not create new callback-oriented application APIs unless a specific reason requires them.

Callbacks are acceptable when:

* implementing an API contract that requires callbacks;
* consuming a legacy callback-only API;
* implementing a low-level Node.js extension point defined using callbacks;
* maintaining backward compatibility;
* working inside an ecosystem where changing the callback interface is outside the scope of the task.

Where possible, adapt the callback boundary once:

`callback API -> Promise -> async/await application logic`

Do not repeatedly mix callbacks and Promises throughout the application.

---

# Important exceptions

The preference hierarchy applies to **one-shot asynchronous control flow**.

It does not mean async/await replaces every asynchronous abstraction.

## Events

Use `EventEmitter` when the problem genuinely represents multiple notifications or observer semantics.

Do not replace event semantics with arbitrary Promises simply to satisfy the hierarchy.

## Streams

Use streams when processing incremental or continuous data and backpressure matters.

Do not buffer an entire stream merely to use async/await.

Async iteration may provide an appropriate bridge:

```js
for await (const chunk of stream) {
  // process
}
```

## Async iterators

Use async iterators for pull-based asynchronous sequences where they naturally represent the domain.

## Worker threads

Use workers for CPU-bound operations.

`async/await` does not make CPU-intensive JavaScript non-blocking.

---

# Concurrency policy

Before writing awaits, classify dependencies.

If B requires A:

```text
A -> B
```

execute sequentially.

If A, B, and C are independent:

```text
A
B
C
```

start them concurrently.

If thousands of independent operations exist:

use bounded concurrency instead of unconstrained `Promise.all()`.

Concurrency must be intentional.

---

# Cancellation

For cancellable operations, prefer standard:

* `AbortController`
* `AbortSignal`

Propagate cancellation through layers where supported.

Do not invent custom cancellation mechanisms unless the repository or required dependency already uses one.

---

# Error handling

Prefer errors to propagate naturally unless the current layer can:

* recover;
* retry;
* translate the error;
* add meaningful context;
* perform cleanup;
* convert it into a domain-level result.

Never silently swallow rejected Promises.

---

# Modernization policy

When reviewing old Node.js code:

### Callback code

Consider:

`callback -> Promise adapter -> async/await`

### Long `.then()` chains

Consider converting orchestration to async/await if readability improves.

Do not convert Promise composition that is already clearer than the equivalent imperative code.

### EventEmitter code

Do not automatically convert event-oriented APIs into Promises.

First determine whether they represent events or one eventual result.

### Streams

Do not replace streams with complete buffering merely for simpler async syntax.

---

# Anti-pattern detection

Flag:

* callback hell;
* mixed callbacks and Promises without a boundary;
* Promise constructor anti-patterns;
* forgotten awaits;
* floating Promises;
* `async` callbacks passed to `forEach`;
* accidental sequential execution;
* accidental unlimited concurrency;
* swallowed errors;
* inconsistent synchronous/asynchronous callbacks;
* manually implemented Promise functionality already provided by Node.js;
* event listeners that are never removed;
* converting streams into giant in-memory buffers unnecessarily.

---

# Required decision process

Whenever designing or refactoring asynchronous Node.js code:

1. Identify the asynchronous operation.
2. Determine whether it produces:

   * one value;
   * multiple asynchronous values;
   * events;
   * streaming data.
3. Determine execution dependencies.
4. Determine concurrency requirements.
5. Determine failure semantics.
6. Determine cancellation requirements.
7. Select the abstraction.

Use this preference for one-result asynchronous control flow:

```text
async/await
    ↓
Promise composition
    ↓
callback
```

Use semantic abstractions where appropriate:

```text
multiple notifications -> EventEmitter

incremental data + backpressure -> Stream

asynchronous sequence -> AsyncIterable

CPU-bound computation -> Worker
```

---

# Relationship to other skills

When available, this skill should coordinate with:

* `nodejs-promises-async-await`
* `nodejs-callbacks-and-events`
* `nodejs-callback-control-flow`
* `nodejs-streams`
* `nodejs-async-cancellation`
* `nodejs-cpu-bound-work`

This skill defines **which abstraction should be preferred**.

The specialized skills define **how that abstraction should be implemented correctly**.

If multiple skills apply:

1. use this skill to choose the approach;
2. use the specialized skill for implementation guidance.

---

# Repository-awareness

Never force a repository-wide modernization simply because this policy prefers async/await.

Before changing code:

1. inspect existing conventions;
2. inspect public API compatibility;
3. inspect supported Node.js versions;
4. inspect framework conventions;
5. inspect tests;
6. determine migration risk.

For new code, strongly prefer the policy.

For existing code, modernize incrementally unless the user explicitly requests a broader refactoring.

---

# Validation

After modifying asynchronous code:

* run unit tests;
* run integration tests where applicable;
* run type checking;
* run linting;
* check formatting;
* verify error paths;
* verify concurrency behavior;
* verify cancellation when relevant;
* verify no unhandled Promise rejections occur.

Create:

* `SKILL.md`
* `agents/openai.yaml`
* `references/decision-tree.md`
* `references/concurrency.md`
* `references/modernization.md`
* `references/antipatterns.md`

Keep `SKILL.md` concise.

Put detailed examples and explanations in `references/`.

Make the skill description broad enough that it activates when Codex is:

* writing Node.js asynchronous code;
* refactoring asynchronous code;
* reviewing Node.js code;
* choosing between callbacks, Promises, and async/await;
* dealing with concurrency;
* modernizing legacy Node.js code.

Validate the completed skill before finishing.
