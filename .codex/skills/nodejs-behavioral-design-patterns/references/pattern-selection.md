# Pattern Selection

Use this reference when answering "What behavioral abstraction best fits this code?" The mapping below is useful only after inspecting the code and naming the actual source of variability. It is guidance, not an automatic rule.

| Pattern | Source of variability | Signals | Benefits | Costs | Testing implications | When not to use it |
| --- | --- | --- | --- | --- | --- | --- |
| Direct function, loop, or conditional | Local behavior differs in a small, obvious way. | One call site, few branches, no reusable contract, no lifecycle or ordering concerns. | Lowest indirection, easy debugging, minimal typing burden. | Can duplicate policy if the same decision spreads. | Test the caller or helper branch behavior. | Branches are repeated across methods, variants are expected to grow, or behavior must be injected/tested independently. |
| Strategy | Changing algorithm. | File format parsers, pricing rules, ranking algorithms, retry policies, compression choices, validation policies, transport choices, feature-flagged implementations. | Isolates interchangeable behavior behind one contract, makes selection configuration-driven, improves testability through injection. | Too many tiny strategy files can obscure simple logic; shared mutable dependencies can surprise callers. | Test each strategy against the same contract, unsupported selection, injected dependencies, and error behavior. | The variants do not share a meaningful contract or the branch is a one-off local decision. |
| State | Changing behavior by lifecycle state. | Same method behaves differently when disconnected/connected, draft/submitted, pending/running/failed, open/closed, locked/unlocked. Invalid operations depend on state. | Centralizes lifecycle behavior, makes transitions explicit, removes scattered `if (state)` checks, supports transition tests. | More moving parts than a simple discriminated union; state objects can hide transition complexity if unconstrained. | Test allowed transitions, rejected transitions, side effects on enter/exit, repeated events, and async races. | State only labels data for display and does not alter behavior or valid operations. |
| Template | Fixed workflow with variable steps. | A stable algorithm such as load/parse/validate/save, import/transform/export, connect/authenticate/handle/disconnect. Steps differ by format or provider. | Keeps algorithm order in one place, limits customization points, supports hooks for optional behavior. | Inheritance templates can be brittle; async hooks can create hidden sequencing bugs. | Test skeleton order, required step failures, optional hooks, and subclass/function variants. | The workflow order varies substantially or callers need arbitrary composition. |
| Iterator | Traversal or lazy sequence. | Potentially large data, streaming source, pagination, generated ranges, matrix traversal, async polling, `for...of`, `for await...of`, stream consumption. | Lazy processing, uniform consumer syntax, natural backpressure with async iteration, composable generators. | Manual protocol objects are easy to get wrong; async iterators must handle cleanup and cancellation. | Test empty/single/multiple values, early break, errors, cancellation, cleanup, and unbounded source behavior. | Data is tiny, eagerly available, and clearer as an array. |
| Middleware | Processing pipeline. | Ordered request/message stages, inbound/outbound transformations, validation/auth/logging/compression/parsing, `next()` control flow, short-circuit responses. | Composable cross-cutting behavior, deterministic pipeline order, localizes request/message transformations. | Ordering bugs, swallowed errors, shared context sprawl, double `next()` calls, hard-to-debug chains. | Test order, short-circuiting, error path, async rejection, and stage-specific context changes. | There is no meaningful stage ordering or one direct function call expresses the flow better. |
| Command | Operation represented independently. | Queue items, background jobs, retryable tasks, scheduled work, audit logs, remote dispatch, serialized operations, undoable local actions. | Separates request from execution, supports queue/scheduler/retry/audit concerns, can serialize intent. | Can become ceremony if execution is immediate and local; undo is often unrealistic for external side effects. | Test run behavior, retry/idempotency, serialization, audit fields, queue integration, and compensation if supported. | The operation is never delayed, stored, retried, observed, or dispatched independently. |

## Selection Workflow

1. Inspect call sites before naming a pattern. Repeated conditionals usually reveal the real variability better than the class or function being edited.
2. Name the source of variability: algorithm, state, workflow steps, iteration, pipeline, or operation/task.
3. Identify ownership: configuration boundary, lifecycle owner, workflow owner, sequence producer, pipeline host, or queue/scheduler.
4. Choose the smallest abstraction that removes duplication or protects the boundary.
5. Define error behavior and async behavior before writing the public API.
6. Add tests around the behavioral contract before or alongside the refactor.

## Ambiguous Cases

- Strategy vs State: choose Strategy when the selected algorithm is stable during an operation. Choose State when the same object changes behavior as lifecycle events occur.
- Strategy vs Template: choose Strategy when the entire algorithm varies. Choose Template when the algorithm order is stable and only steps vary.
- Template vs Middleware: choose Template for a controlled skeleton with named steps. Choose Middleware when users can assemble an ordered chain of independent stages.
- Iterator vs Stream: use async iterators for simple pull-based consumption or APIs that naturally fit `for await`. Use Node.js streams when you need stream ecosystem integration, piping, backpressure controls, transforms, or binary/object mode pipelines.
- Middleware vs Command: choose Middleware for one request/message flowing through stages. Choose Command when each operation is a value that can outlive the caller.
- Command vs Strategy: a command represents "do this operation"; a strategy represents "use this algorithm to do the operation."

## JavaScript-Native Bias

Traditional class-heavy GoF implementations are often unnecessary in Node.js:

- A strategy can be a function, closure, or typed object with one or two methods.
- A state machine can be a transition table plus handlers instead of a class per state.
- A template can be a function that accepts step functions and optional hooks.
- An iterator should usually be a generator or async generator.
- Middleware is naturally modeled as functions composed by a small pipeline runner.
- A command can be a function with metadata, or an object only when serialization, auditing, undo, or dependency capture needs named methods.

Use classes when they clarify lifecycle, encapsulation, polymorphism, or an existing codebase convention. Do not use classes just to make code look like a catalog pattern.
