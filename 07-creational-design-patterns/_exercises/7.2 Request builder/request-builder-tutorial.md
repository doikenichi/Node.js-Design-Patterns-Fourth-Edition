# Exercise 7.2 — Build an HTTP Request Builder

A guided JavaScript ESM → TypeScript tutorial with project structure, Vitest, and test-quality practice

## How to use this tutorial

This tutorial accompanies Exercise 7.2 in *Node.js Design Patterns, Fourth Edition* by Luciano Mammino and Mario Casciaro, in the chapter on creational design patterns. The book’s prompt asks you to wrap Node’s built-in `http.request()` with a builder that configures a method, URL, query, headers, and body, then exposes `invoke()` as a Promise.

The goal here is to help you reason your way to your own implementation. You will get questions, constraints, design checkpoints, and test ideas, but no completed implementation. Work through one chapter at a time. Write down your decisions before coding; revisit them when tests expose a weakness.

The exercise is about the Builder pattern, but also about module boundaries, asynchronous APIs, HTTP semantics, test seams, and what coverage metrics can and cannot tell you.

## Learning goals

By the end, you should be able to:

- Explain why a builder can help when an object has several configurable parts.
- Define a useful Promise contract around a callback and stream based API.
- Organize a small ESM project with a deliberate public API.
- Test behavior with Vitest without making real internet requests.
- Distinguish unit tests from local HTTP integration tests.
- Read coverage and mutation results as evidence, not as a quality score.
- Port the design to TypeScript 7.0.2 after the JavaScript behavior is stable.

## Scope and assumptions

- Start with JavaScript ESM targeting the ES2025 language standard. ES2025 describes language features; the actual runtime is Node.js. Check that your chosen Node release supports every feature you use.
- Use Node’s `node:http` API for the first implementation. Decide explicitly whether you will support only `http:` or both `http:` and `https:`. The exercise names `http.request()`; supporting HTTPS requires routing to the matching built-in module and deserves a deliberate test.
- Use Vitest for both language versions. Keep the HTTP tests local; do not depend on a public service or internet availability.
- Convert response chunks into one documented representation, such as a UTF-8 string or `Buffer`. Do not silently assume that every response is JSON.
- An HTTP error status such as 404 is still a completed HTTP response. Decide whether the Promise resolves with the response or rejects on selected status codes. Keep transport failure separate from HTTP status unless you clearly document another contract.

## Chapter 1 — Understand the pattern before choosing the API

The Builder pattern separates the step-by-step configuration of a more involved product from the moment that product is used. A builder is useful when it makes a configuration sequence easier to read or validates a coherent set of options before execution. It is not automatically better than a plain options object.

### Think first

1. What is the product being configured: a Node request object, or a reusable description of a request that can be invoked later?
2. Which options are required before invocation? Which have sensible defaults?
3. Should configuration methods mutate one builder and return `this`, or return new builder instances? What trade-offs follow for reuse and accidental state sharing?
4. Is a class useful because the exercise asks for a Builder class, or would another API be simpler in production code?
5. What does the caller gain from a fluent chain compared with a single constructor options object?

### Design checkpoint

Write a short public API sketch in prose or pseudocode. Include only method names and their responsibilities. Do not implement it yet. Keep configuration separate from network I/O: setting a URL or header should not send anything.

A good first boundary is “configure request” versus “invoke request.” Avoid adding retries, redirects, streaming uploads, authentication helpers, or a general HTTP client before the basic contract works.

## Chapter 2 — Give the Promise a precise meaning

`http.request()` returns a `ClientRequest`, which is a writable stream. The response arrives asynchronously through a callback/event sequence. The exercise asks for `invoke()` to return a Promise, so your wrapper must decide when that Promise settles and what value it returns.

### Think first

1. Should `invoke()` resolve as soon as response headers arrive, or only after the full response body has been collected?
2. What information will callers need? Consider status code, headers, and body.
3. Which failures should reject: DNS/socket/request errors, response stream errors, invalid configuration, or all of these?
4. How will you avoid leaving a Promise pending if a response stream fails or the request errors?
5. Must `request.end()` always be called, including requests without a body?
6. If `invoke()` is called twice, should it send twice, reject the second call, or create independent requests? Pick and test a policy.

### Design checkpoint

Write the Promise contract in one sentence, for example: “`invoke()` resolves with ___ after ___, and rejects when ___.”

Do not use “success” to mean only a 2xx status unless you intentionally define that behavior. HTTP status is a response property. Network errors are a separate failure class.

## Chapter 3 — Design project structure as an exercise

Keep the first project small, but make each directory have a clear purpose. One possible starting point is below. Treat it as a proposal to evaluate, not a mandatory template.

```text
request-builder/
├── README.md
├── package.json
├── vitest.config.js
├── src/
│   └── request-builder/
│       ├── index.js
│       └── request-builder.js
└── test/
    ├── unit/
    │   └── request-builder.test.js
    ├── integration/
    │   └── request-builder.test.js
    └── support/
        └── local-http-server.js
```

### Think first

- Which file owns the implementation? Which file defines the supported public import path?
- Does `index.js` re-export only the supported API, or does it expose internal helpers by accident?
- Are unit and integration tests different enough to deserve separate folders? What is the value of `support/`?
- Would `src/http/` be clearer than `src/request-builder/`? Name directories by responsibility, not merely by file type.
- For a single class, is a directory useful, or is it unnecessary nesting? Record your reasoning.
- How will the project declare ESM (`"type": "module"`), and what file extensions will imports use?

### Practice task

Before coding, create the proposed folders and placeholder files. Add a short README section explaining how a consumer imports the public API and runs tests. Do not add directories for hypothetical future features.

## Chapter 4 — Specify configuration and state

You need a representation of method, URL, query values, headers, and body. Decide what state the builder owns and when that state is converted into Node request options.

### Think first

- Should the URL be a string, a `URL` object, or accept both? What validation happens when the value is set versus when invocation begins?
- How should query values be encoded? How will repeated keys work? What should happen when the URL already contains a query string?
- Does adding the same header twice replace, append, or reject? Are header names case-insensitive at the HTTP layer?
- Should the builder accept arbitrary body values, or only strings and byte buffers? If you want JSON convenience, which layer serializes the object and sets `Content-Type`?
- Who sets `Content-Length`, and how will byte length be calculated for non-ASCII text?
- Can callers mutate a `URL`, header object, or body object after passing it in? Should the builder copy inputs to protect its internal state?
- What are reasonable defaults for method and headers? Avoid defaults that create surprising behavior.

### Design checkpoint

Create a requirements table before implementation:

| Concern | Your chosen rule | How you will verify it |
|---|---|---|
| Required configuration |  |  |
| Default method |  |  |
| Query merge and encoding |  |  |
| Duplicate header behavior |  |  |
| Body types and serialization |  |  |
| Repeated invocation |  |  |

Use `URL` and `URLSearchParams` deliberately rather than concatenating strings. Learn their behavior for duplicate parameters and existing query components before deciding the API.

## Chapter 5 — Implement the smallest useful JavaScript version

Implement the public API in JavaScript ESM. Keep the first pass intentionally narrow. You can grow the behavior only when a requirement or test justifies it.

### Implementation sequence

1. Define the class and public configuration methods without networking.
2. Make a small focused test demonstrate a configuration rule.
3. Decide how the URL and options become the input to Node’s HTTP API.
4. Add `invoke()` and the minimum response collection needed by your Promise contract.
5. Add request and response error handling.
6. Add body writing and ensure the request is ended.
7. Re-run the complete unit suite after each change.

### Hints, not a solution

- A builder method that supports chaining usually returns the same builder instance, but that choice makes mutability part of the API.
- `URLSearchParams` can represent repeated query keys; converting it to a plain object may lose that property.
- Node’s `http.request()` accepts URL/options forms, but use the current Node documentation to select the form appropriate to your Node version.
- Request body bytes and `Content-Length` are measured in bytes, not JavaScript characters.
- Do not create a Promise that only listens for the request’s `'error'` event if the response stream can also emit errors.
- A response can arrive in multiple chunks, and an empty body is valid.
- Do not treat the request’s `'finish'` event as proof that the server responded successfully. It means the writable request stream finished sending.

### Review questions

- Can a consumer understand the returned value without reading implementation details?
- Is validation performed at a predictable point?
- Are errors preserved with useful context rather than swallowed?
- Is one method doing both configuration and side effects?
- Does the class store derived data that could be rebuilt from authoritative state?

## Chapter 6 — Test behavior with Vitest

Use unit tests to exercise the builder’s public behavior and test seams. Use a local HTTP server for the protocol-level behavior. Neither kind should call a public internet service.

### Unit test ideas

- Default method and the required URL policy.
- Fluent method return value, if chaining is part of the API.
- Query encoding, existing query components, repeated query keys, and replacement rules.
- Header addition and duplicate behavior.
- Body handling and content metadata rules.
- Invalid configuration and the chosen error timing.
- Invocation policy when called more than once.
- Response body collection across multiple chunks.
- Request and response error paths.

A unit test should not need a live external endpoint. If you introduce a small injectable transport function or request factory, justify that seam: does it make behavior testable, or merely add indirection? Another valid strategy is to make most configuration tests pure and reserve actual transport behavior for local-server integration tests.

### Local integration test ideas

Start a server bound to loopback on an ephemeral port. Have it record the method, path, query, headers, and body it receives, then return controlled status, headers, and response chunks. Close the server in `afterEach`/`afterAll`, even when an assertion fails.

Test at least:

- One request that checks method, query, custom header, and body together.
- A response split into multiple chunks.
- A non-2xx status response.
- A server that closes or otherwise causes a transport failure.

Keep integration tests deterministic. Avoid fixed sleeps; synchronize on server events and use bounded timeouts only as a failure guard.

### Vitest assertions and organization

- Group tests by externally meaningful behavior, not by one test per implementation line.
- Use descriptive names that state the behavior and condition.
- Use table-driven tests only where cases really share the same behavior.
- Prefer one focused reason for each assertion group; avoid huge tests that fail with ambiguous output.
- Keep test helpers small, named, and close to the tests that use them.

## Chapter 7 — Measure test quality responsibly

Start with line, branch, and function coverage. Set explicit include/exclude patterns so the report measures the code you intend. Add `@vitest/coverage-v8` or `@vitest/coverage-istanbul` matching your installed Vitest version and choose a provider intentionally.

Coverage tells you what executed, not whether assertions would catch incorrect behavior. Interpret the report by asking:

- Which meaningful branches remain untested, such as empty body, invalid URL, or error events?
- Are tests asserting observable outcomes, or merely executing setup code?
- Are important boundary values covered?
- Is the test suite independent and repeatable?

Then try mutation testing with a tool compatible with your Vitest and Node versions. A mutation tool changes code in small ways, such as changing a comparison or removing a line, and checks whether tests fail. Review surviving mutants: sometimes a survivor reveals a missing assertion, sometimes it is equivalent or unreachable. Do not optimize a mutation score without understanding the survivors.

### Quality practice

For every requirement in your Chapter 4 table, link at least one test. Then choose one test and deliberately remove or weaken its key assertion. Confirm that the relevant mutation or manual perturbation is detected. Restore the assertion afterward.

Track at least these measures during the exercise:

| Measure | What it helps reveal | What it does not prove |
|---|---|---|
| Line coverage | Executed statements | Correct assertions or complete behavior |
| Branch coverage | Executed decision outcomes | That important scenarios were chosen |
| Function coverage | Invoked functions | That functions were meaningfully verified |
| Mutation score / surviving mutants | Whether tests detect selected code changes | Overall correctness or production fitness |
| Test duration and repeatability | Feedback speed and flakiness | Test quality by themselves |

Avoid a universal coverage target. Use uncovered behavior and surviving meaningful mutants to guide the next test, not a vanity percentage.

## Chapter 8 — Review design and refactor

Before adding convenience features, review the core design.

- Is this a Builder, or has it grown into a complete HTTP client?
- Can the configuration be inspected or validated without sending a request?
- Is the builder reusable after invocation? If mutable, can old settings leak into later requests?
- Would an immutable builder improve safety, and is its extra complexity justified for this exercise?
- Are transport concerns and response parsing coupled too tightly?
- Are defaults and error behavior documented?
- Does the public entry point expose only what consumers need?
- Are names about domain concepts (`query`, `header`, `body`) rather than internal implementation?

Refactor only when you can state the design benefit and keep tests green. Do not split every method into a separate file or introduce abstractions just to demonstrate a pattern.

## Chapter 9 — Port the behavior to TypeScript 7.0.2

Port only after the JavaScript API and tests are stable. TypeScript adds compile-time descriptions; it does not change Node’s runtime HTTP behavior. Keep runtime validation for values that can be invalid at runtime.

### Suggested TypeScript project questions

- Will source files use `.ts` with Node ESM settings in `package.json` and `tsconfig.json`? Decide whether you execute TypeScript directly or compile to `dist/` and run emitted JavaScript.
- Does your selected Node release support the chosen TypeScript execution workflow? Keep runtime support separate from compiler version.
- What type expresses the supported body values without promising more than your implementation handles?
- Which Node types describe request options, response headers, and buffers? Install and pin compatible `@types/node` if required by your chosen compiler/toolchain.
- Should configuration methods return `this` for fluent chaining, or a more restrictive polymorphic type? Start simple and explain the choice.
- Can a response type accurately represent optional status fields and header values?
- How will strict mode reveal missing validation or uncertain state?

### Porting steps

1. Copy the same behavior and tests into a separate `typescript/` project area or a clearly separated branch.
2. Add TypeScript 7.0.2 and compatible Node type declarations as development dependencies; record exact versions in the lockfile.
3. Enable strict checking and Node ESM module settings supported by TypeScript 7.0.2. Consult its current release notes rather than copying an old config blindly.
4. Add types to the public API and internal state based on observed JavaScript behavior.
5. Run type checking, unit tests, and integration tests independently. A clean type check is not a substitute for runtime tests.
6. Compare the JS and TS public contracts. Any behavior difference should be intentional and documented.

## Chapter 10 — Retrospective

Write short answers after finishing both versions:

1. Which requirement changed the design most?
2. Which test found a real defect? Which did not add much confidence?
3. What did coverage show that you had overlooked?
4. Which surviving mutant mattered, and what test addressed it?
5. Did the builder simplify calling code enough to justify its API?
6. What would you change if this were a reusable production library?
7. What did TypeScript catch at compile time, and what still required runtime validation?

## Reference links

- Book: [Node.js Design Patterns, Fourth Edition — Packt](https://www.packtpub.com/en-us/product/nodejs-design-patterns-fourth-edition-9781803238944)
- Exercise listing: [Chapter 7 exercises — Packt](https://www.packtpub.com/en-PL/product/nodejs-design-patterns-fourth-edition-9781803238944/chapter/creational-design-patterns-7/section/exercises-ch07lvl1sec51)
- [Node.js HTTP API](https://nodejs.org/api/http.html)
- [Node.js URL API](https://nodejs.org/api/url.html)
- [Vitest guide](https://vitest.dev/guide/)
- [Vitest coverage](https://vitest.dev/guide/coverage)
- [TypeScript Handbook: modules](https://www.typescriptlang.org/docs/handbook/modules.html)
- [TypeScript release notes](https://www.typescriptlang.org/docs/handbook/release-notes/)

The book is the source of the exercise prompt and pattern context. This tutorial is an independent study guide and does not reproduce the book’s solution.
