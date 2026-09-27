# Exercise 7.1 Tutorial: Console Color Factory

> Based on **Chapter 7 — Creational Design Patterns** in *Node.js Design Patterns, 4th Edition*, by Mario Casciaro and Luciano Mammino.
>
> Exercise: **7.1 Console color factory**.
>
> Learning sequence: **JavaScript ESM (ES2025) first**, then **TypeScript 7.0.2**.

---

## 1. Purpose of this tutorial

The goal is **not** to give you the finished implementation.

The goal is to help you develop the solution yourself while practicing:

- recognizing when the Factory pattern is useful;
- separating object creation from object usage;
- defining a common product interface;
- using inheritance deliberately rather than mechanically;
- deciding where input validation belongs;
- designing a small CLI around reusable application code;
- comparing a direct implementation with a more maintainable design;
- translating a JavaScript design into TypeScript without merely adding type annotations.

This tutorial intentionally uses **progressive hints**. Do not read every hint immediately.

A useful rule is:

> Try to solve each checkpoint first. Reveal the next hint only after you can explain why your current approach does or does not work.

---

# Part I — Understand the pattern before coding

## Chapter 1 — Restate the problem in design terms

The exercise asks for:

1. a base `ColorConsole` class;
2. three concrete subclasses:
   - `RedConsole`
   - `BlueConsole`
   - `GreenConsole`
3. a `log()` operation implemented differently by each concrete class;
4. a factory that receives a color and chooses which concrete console to create;
5. a command-line program that uses the factory.

Before writing code, identify the design-pattern roles.

### Checkpoint 1

Write down your answers to these questions:

1. What is the **product**?
2. What are the **concrete products**?
3. What is the **creator/factory**?
4. What code is the **client**?
5. Which part of the program should know the names `RedConsole`, `BlueConsole`, and `GreenConsole`?
6. Which part should *not* need to know them?

Do not continue until you can answer at least questions 1–4.

### Hint 1

The Factory pattern is useful because the caller can say roughly:

> "Give me the console appropriate for this color."

instead of making the caller decide which concrete class to instantiate.

### Hint 2

Think about the dependency direction:

```text
CLI -> factory -> concrete console classes
          |
          -> common ColorConsole abstraction
```

The CLI should depend mainly on the factory and the common behavior, not on the construction details of every console class.

---

## Chapter 2 — Define the smallest useful contract

The book exercise deliberately starts with a simple base class containing a `log()` method.

Ask yourself what all colored consoles have in common.

### Checkpoint 2

Without implementing color yet, sketch the public API in pseudocode.

For example, reason about something shaped like:

```text
ColorConsole
  log(message)
```

Then answer:

1. What should `log()` receive?
2. Should it return anything?
3. Should callers care how coloring is implemented?
4. Should a caller be able to replace a red console with a blue console without changing how it calls `log()`?

The fourth question is a small application of the **Liskov Substitution Principle**.

### Design note: book fidelity vs defensive design

The exercise explicitly asks for an **empty** `log()` method in `ColorConsole`.

For your first implementation, follow the exercise literally.

After you complete it, revisit the design and compare an empty method with alternatives such as:

- throwing a `Not implemented` error;
- using a more explicit abstraction in TypeScript;
- avoiding inheritance entirely and using composition.

Do not prematurely improve the exercise before you understand what the exercise is teaching.

---

# Part II — JavaScript ESM implementation

## Chapter 3 — Set up a minimal ES2025 ESM project

Use native ECMAScript modules.

A simple structure is:

```text
console-color-factory/
  package.json
  src/
    color-console.js
    red-console.js
    blue-console.js
    green-console.js
    create-color-console.js
    cli.js
```

This is intentionally explicit. For a tiny exercise, you *could* put everything in one file, but separate files make the pattern roles visible.

### Checkpoint 3

Decide whether the project will identify `.js` files as ESM using:

- `.mjs` file extensions; or
- `"type": "module"` in `package.json`.

For this tutorial, prefer normal `.js` filenames plus:

```json
{
  "type": "module"
}
```

Node.js supports ESM directly, and relative ESM imports should include their file extensions.

### Critical-thinking question

Why is this import clearer in Node.js ESM?

```js
import { ColorConsole } from "./color-console.js";
```

than omitting the `.js` extension?

Research the Node.js ESM resolution rules if you are unsure.

---

## Chapter 3A — Practice project structure deliberately

Project structure is part of this exercise, not setup trivia. Since JavaScript and TypeScript organization are new concepts for you, do **not** start with the final folder tree and copy it blindly. Build the structure in stages and justify each change.

### Mental model: file, module, directory, package

For this exercise, use these meanings:

- **file** — a physical source file such as `red-console.js`;
- **module** — in Node.js ESM, normally one source file with its own module scope and explicit imports/exports;
- **directory** — an organizational grouping of files; it is not automatically a language-level package;
- **package** — the Node.js package boundary described by `package.json`;
- **entry point** — a module intended to start the program, such as a CLI module.

Compare this mentally with Go:

```text
Go                         Node.js ESM
------------------------   --------------------------------
package                    usually many files in a directory
module/file                each .js/.ts file is a module
package API                exported identifiers across files
Node package               package.json boundary
````

Do not try to force Go's package model onto JavaScript. The concepts overlap, but they are not equivalent.

### Structure exercise 1 — Start intentionally flat

Begin with the smallest useful tree:

```text
console-color-factory/
  package.json
  src/
    color-console.js
    cli.js
````

Before adding another file, answer:

1. Why is `package.json` at the project root?
2. Why is application code under `src/`?
3. Why is `cli.js` separate from `color-console.js`?
4. Which file is an entry point?
5. Which files are ESM modules?

### Structure exercise 2 — Let responsibilities create files

When you add `RedConsole`, resist creating a `classes/`, `models/`, or `utils/` directory automatically. First ask:

> Does a new directory communicate a meaningful concept, or merely hide files?

For three concrete products, a flat `src/` layout is defensible:

```text
console-color-factory/
  package.json
  src/
    color-console.js
    red-console.js
    blue-console.js
    green-console.js
    create-color-console.js
    cli.js
````

Your task is to explain what responsibility each file owns in one sentence.

### Structure exercise 3 — Compare flat vs feature grouping

After the first working solution, compare the flat structure with this alternative:

```text
console-color-factory/
  package.json
  src/
    consoles/
      color-console.js
      red-console.js
      blue-console.js
      green-console.js
    factories/
      create-color-console.js
    cli.js
````

Do **not** assume the second tree is better. Evaluate:

- Does the directory name add useful meaning?
- How many files justify a subdirectory?
- Would `factories/` containing one file be premature taxonomy?
- Does navigation become easier or harder?
- If the project grew to five unrelated factories, would your answer change?

For this tiny exercise, prefer the flat structure first. The grouped structure is a refactoring exercise.

### Structure exercise 4 — Think about module public APIs

Suppose you later introduce:

```text
src/
  consoles/
    color-console.js
    red-console.js
    blue-console.js
    green-console.js
    index.js
````

Before creating `index.js`, investigate the concept of a **barrel module**. Ask:

- What convenience does it provide?
- What dependencies can it hide?
- Does this project need one?

For the first implementation, prefer direct imports. Add a barrel only as an explicit comparison exercise.

### Structure exercise 5 — Separate production code from tests

When you add automated tests, compare two common layouts:

```text
# colocated
src/
  red-console.js
  red-console.test.js
````

versus:

```text
src/
  red-console.js
test/
  red-console.test.js
````

Do not choose based on aesthetics alone. Consider:

- discoverability;
- import paths;
- whether tests are shipped/published;
- how larger projects group unit, integration, and end-to-end tests.

For this exercise, either is valid if you can justify it.

### Structure checkpoint

Before Chapter 4, you should be able to explain these statements in your own words:

1. A JavaScript ESM source file is a module.
2. A directory is not automatically a JavaScript package.
3. `package.json` helps define the Node package boundary and module mode.
4. Files should usually be split by responsibility, not by arbitrary type names.
5. A tiny project often benefits from staying flat until grouping provides real value.
6. Imports reveal architectural dependencies, so file placement and module boundaries are design decisions.

---

## Chapter 4 — Implement the base product first

Create `src/color-console.js`.

Your first task is deliberately small.

### Goal

Define and export a `ColorConsole` class containing a `log()` method that accepts a message.

### Constraint

For the first pass, follow the book exercise and leave the method body empty.

### Skeleton

```js
export class ColorConsole {
  log(message) {
    // TODO: exercise intentionally asks for an empty base implementation.
  }
}
```

Do not add the subclasses yet.

### Checkpoint 4

Ask yourself:

- Why does this class exist if its method does nothing?
- Is JavaScript actually enforcing this as an interface?
- What benefit does the base class give the reader of the code?
- What weakness does this approach have?

Write one or two sentences answering each question.

---

## Chapter 5 — Solve console coloring independently

Before combining coloring with inheritance, prove that you know how to print one colored string.

Do this in a temporary scratch file or Node REPL.

ANSI escape sequences are enough for this exercise; you do not need a dependency such as `chalk`.

### Research target

Find the ANSI codes for:

- red foreground;
- blue foreground;
- green foreground;
- reset.

### Important design question

Why is the **reset** sequence important?

### Hint 1

The general shape is:

```text
COLOR_CODE + message + RESET_CODE
```

### Hint 2

Avoid spreading raw escape codes through the entire program if you can name them clearly.

Think about whether constants would improve readability.

### Checkpoint 5

You should be able to run a one-line experiment that:

1. prints a word in one color;
2. prints a second word afterward in the terminal's normal color.

Only continue after this works.

---

## Chapter 6 — Implement one concrete product

Start only with `RedConsole`.

### Why only one?

Because you want to validate the design before duplicating it three times.

### Your task

Create `src/red-console.js` and make `RedConsole` extend `ColorConsole`.

Its `log(message)` method should print the message in red.

### Skeleton

```js
import { ColorConsole } from "./color-console.js";

export class RedConsole extends ColorConsole {
  log(message) {
    // TODO
  }
}
```

### Checkpoint 6

Before implementing blue and green, manually instantiate `RedConsole` from a scratch script.

Verify:

- it is an instance of `RedConsole`;
- it is also an instance of `ColorConsole`;
- calling `log()` produces colored output;
- the next console output is not accidentally still red.

### Critical-thinking question

What would change in the caller if `RedConsole` did **not** extend `ColorConsole` but merely implemented the same `log()` method?

This distinction will become more interesting in the TypeScript version.

---

## Chapter 7 — Add the remaining concrete products

Once `RedConsole` works, implement:

- `BlueConsole`
- `GreenConsole`

### Before copying code

Look at the red implementation and ask:

> What varies, and what stays the same?

If the only variation is the ANSI color code, you have discovered duplication.

Do **not** immediately refactor it away.

Finish the exercise first so you can see the original pattern clearly.

### Checkpoint 7

Your three classes should expose the same public operation:

```text
log(message)
```

The caller should not need color-specific method names such as:

```text
logRed()
logBlue()
logGreen()
```

Explain why color-specific methods would weaken substitutability.

---

# Part III — Build the factory

## Chapter 8 — Decide what the factory returns

The exercise says the factory receives a color and returns the related `ColorConsole` subclass.

There are two interpretations worth understanding:

### Option A — return a constructor/class

Conceptually:

```text
factory("red") -> RedConsole class
```

The caller then constructs it.

### Option B — return an instance

Conceptually:

```text
factory("red") -> new RedConsole()
```

The caller immediately receives an object it can use.

### Checkpoint 8

Before coding, answer:

1. Which interpretation hides more construction knowledge from the caller?
2. Which interpretation produces a simpler CLI?
3. Does the exercise require constructor parameters?
4. If constructors later needed dependencies, which option would give the factory more responsibility?

For this exercise, a factory that returns a ready-to-use instance is a natural interpretation, but make sure you can explain *why*.

---

## Chapter 9 — Implement the simplest factory first

Create:

```text
src/create-color-console.js
```

Your function should accept a color and select the appropriate concrete console.

### Do not optimize prematurely

For three colors, an explicit conditional structure is perfectly reasonable.

Possible implementation strategies include:

- `if / else if`;
- `switch`;
- a lookup object or `Map`.

### Checkpoint 9

Choose one and justify it using these criteria:

- readability;
- ease of adding a fourth color;
- behavior for unsupported input;
- whether construction logic is obvious.

### Hint 1

A first implementation may conceptually look like:

```text
if red -> create RedConsole
if blue -> create BlueConsole
if green -> create GreenConsole
otherwise -> ???
```

The `???` is an important design decision.

---

## Chapter 10 — Decide how invalid colors behave

What should happen for:

```text
yellow
RED
 red 
undefined
```

Do not silently invent behavior without deciding it.

### Possible policies

1. accept only exact supported lowercase values;
2. normalize whitespace and case;
3. fall back to a default console;
4. throw an error for unsupported colors.

### Critical-thinking checkpoint

For a learning exercise, compare these two principles:

- **Postel-style permissiveness:** accept several equivalent forms;
- **fail fast:** reject invalid input immediately.

Which makes the factory contract easier to understand?

### Recommended progression

First version:

- support exactly the documented values;
- throw a clear error for unsupported values.

Optional second version:

- normalize user-facing CLI input before passing it into the factory.

This keeps input sanitation at the boundary while keeping the factory contract predictable.

---

# Part IV — Build the CLI client

## Chapter 11 — Keep CLI parsing separate from object creation

The command-line script is the **client** of your factory.

A useful invocation might eventually look like:

```bash
node src/cli.js red "Factory patterns are useful"
```

Do not copy that behavior blindly. Decide your CLI contract first.

### Checkpoint 11

Determine:

1. Which argument is the color?
2. Which argument or arguments form the message?
3. What happens when no color is supplied?
4. What happens when no message is supplied?
5. Should the CLI print usage help?

### Hint

Node exposes command-line arguments through:

```js
process.argv
```

Inspect `process.argv` before writing parsing logic.

Run something like:

```bash
node src/cli.js red hello
```

and temporarily print the argument array.

Understand it before destructuring it.

---

## Chapter 12 — Connect the pieces

Your CLI should have a simple orchestration flow:

```text
read arguments
    |
validate/normalize CLI input
    |
ask factory for a ColorConsole
    |
call console.log(message)
```

### Architecture checkpoint

Your CLI should **not** contain logic equivalent to:

```text
if red, instantiate RedConsole
if blue, instantiate BlueConsole
...
```

Why?

Because doing so duplicates the factory's responsibility and defeats the central lesson of the exercise.

---

# Part V — Review the JavaScript solution

## Chapter 13 — Self-review before comparing with anyone else's answer

Review your implementation with this checklist.

### Pattern correctness

- [ ] The CLI does not instantiate concrete color classes directly.
- [ ] The factory owns the concrete-class selection.
- [ ] All concrete consoles present the same `log(message)` API.
- [ ] Concrete creation is centralized.

### ESM correctness

- [ ] `package.json` identifies the package as ESM.
- [ ] Imports use `import` / `export`.
- [ ] Relative imports include `.js` extensions.

### Code quality

- [ ] Names describe roles rather than implementation accidents.
- [ ] Unsupported input produces deliberate behavior.
- [ ] ANSI reset behavior prevents color leakage.
- [ ] The CLI is thin.
- [ ] No dependency was introduced without a reason.

### Simplicity

Ask yourself:

> Did I add architecture that the problem did not need?

A three-product factory does not need a registry framework, dependency injection container, plugin system, or reflection mechanism.

KISS matters here.

---

## Chapter 14 — Build the test suite with Vitest

Testing is now a **first-class learning objective** of this exercise. Use **Vitest** rather than `node:test`, but do not let the framework hide the fundamentals of unit testing.

The purpose of this chapter is not to maximize the number of tests. It is to learn how to decide whether a test suite gives useful evidence about the behavior of the code.

### Learning objectives

By the end of the JavaScript version, you should be able to explain:

- what makes a test a unit test;
- test subject vs dependency;
- observable behavior vs implementation detail;
- Arrange, Act, Assert;
- equivalence partitions;
- boundary and invalid-input cases;
- positive and negative tests;
- test isolation and determinism;
- spies and mocks, including when **not** to use them;
- code coverage and its limitations;
- mutation testing and why it measures something different from coverage.

### Structure checkpoint — where should tests live?

Before creating a test file, compare at least these layouts:

```text
Option A — separate test tree
project/
  src/
    create-color-console.js
  test/
    create-color-console.test.js
```

```text
Option B — colocated tests
project/
  src/
    create-color-console.js
    create-color-console.test.js
```

Do not choose based on habit. Explain which organization makes the production modules and tests easiest to discover in this project.

### Checkpoint 14.1 — derive tests from the contract

Do **not** begin by looking at the implementation and trying to execute every line.

Start from the contract. For the factory, identify input partitions such as:

- each supported color;
- an unsupported color;
- any additional input category your chosen API contract explicitly supports or rejects.

Then ask:

1. What observable result proves the correct concrete product was selected?
2. Am I testing public behavior or duplicating the implementation in my assertion?
3. Would the test still be valuable if the factory implementation changed from `switch` to a lookup table?

That third question is especially important. A unit test that breaks during a behavior-preserving refactor may be coupled too closely to implementation details.

### Checkpoint 14.2 — test one concrete console

Start with a single concrete product before cloning tests for all colors.

Think about the contract of `log(message)`:

```text
input: message
observable effect: colored text is emitted
```

The challenge is the side effect. Ask yourself:

> How can I observe output without depending on a human looking at a real terminal?

Possible directions to investigate, in increasing architectural impact:

1. spy on the output function used by the implementation;
2. temporarily intercept console output;
3. separate formatting from emission;
4. inject an output dependency.

Do not jump immediately to dependency injection. First experience the testing friction and explain what coupling causes it.

### Checkpoint 14.3 — avoid accidental test duplication

When red, blue, and green follow the same behavioral rule, ask whether a **table-driven test** can express the cases more clearly.

Before doing that, answer:

- Are these genuinely equivalent cases?
- Will a table make failures easier or harder to diagnose?
- Is the abstraction reducing duplication or hiding intent?

DRY applies to tests, but readability is often more important than removing every repeated line.

---

## Chapter 14A — Measure code coverage with Vitest

Vitest supports coverage for lines, functions, statements, and branches. Use the V8 provider first for this Node.js exercise.

Add a dedicated coverage command rather than making every normal test run collect coverage. Conceptually:

```text
npm test              -> fast development feedback
npm run test:coverage -> explicit coverage analysis
```

### Learn what each metric means

| Metric | Question it answers | What it does **not** prove |
| --- | --- | --- |
| Statement coverage | Were executable statements run? | That results were asserted correctly |
| Line coverage | Were source lines executed? | That all logical outcomes were checked |
| Function coverage | Were functions invoked? | That meaningful inputs were tested |
| Branch coverage | Were alternative control-flow outcomes taken? | That assertions would detect wrong behavior |

### Coverage experiment

Do this deliberately:

1. Write only the happy-path tests.
2. Run coverage.
3. Record the four metrics.
4. Inspect the uncovered locations rather than only the percentages.
5. Add the unsupported-color test.
6. Run coverage again.
7. Explain **which behavior** the new test added, not merely how many percentage points increased.

### Critical-thinking checkpoint

Try to construct a test that executes code but contains a weak or meaningless assertion.

Then answer:

> Can coverage distinguish this bad test from a strong test?

It cannot. This is the key limitation you should remember before treating a coverage percentage as a test-quality score.

### Coverage thresholds

Vitest can fail the run when line, statement, function, or branch coverage drops below configured thresholds. Treat thresholds as a **regression guard**, not as a definition of quality.

For this tiny exercise, reaching 100% may be realistic because the behavior surface is intentionally small. If you reach it, you must still demonstrate why 100% coverage does **not** imply a high-quality suite.

Do not add exclusions merely to improve the percentage. Every exclusion should have a reason.

---

## Chapter 14B — Evaluate test quality beyond coverage

Create a small test-quality review after the suite works. Do not reduce everything to one artificial score. Evaluate multiple dimensions separately.

### 1. Behavior coverage

Create a behavior matrix such as:

```text
Behavior                                     Covered?
-------------------------------------------  --------
Factory selects RedConsole                   yes/no
Factory selects BlueConsole                  yes/no
Factory selects GreenConsole                 yes/no
Unsupported color follows defined contract   yes/no
RedConsole emits red-formatted message       yes/no
BlueConsole emits blue-formatted message     yes/no
GreenConsole emits green-formatted message   yes/no
```

This is different from line coverage. It starts from requirements and contracts rather than source-code structure.

### 2. Assertion strength

For each test ask:

- What defect would make this assertion fail?
- Could the implementation return the wrong thing and still pass?
- Am I merely checking that no exception was thrown?
- Am I asserting the most meaningful observable behavior?

### 3. Isolation

Ask:

- Can any test change state that affects another test?
- Does execution order matter?
- Is global console state restored after a spy?
- Can tests run independently?

### 4. Determinism

Run the suite repeatedly. A unit suite for this exercise should produce the same result every time.

Investigate any test whose outcome depends on:

- timing;
- execution order;
- shared mutable state;
- environment-specific terminal behavior.

### 5. Readability and diagnostic quality

Ask:

- Does the test name state behavior rather than implementation?
- When it fails, can I tell what requirement broke?
- Is Arrange/Act/Assert visually understandable even if comments are unnecessary?
- Is setup smaller than the behavior being tested?

### 6. Execution time

Record total suite time as a baseline. Do not optimize milliseconds in this tiny project. The learning objective is to recognize that fast unit tests support frequent execution.

---

## Chapter 14C — Introduce mutation testing after coverage

Only do this **after** you understand normal Vitest tests and coverage.

Use **StrykerJS with its Vitest runner** as an advanced exercise. Mutation testing deliberately changes production code and checks whether your tests detect the change.

Examples of mutations that are conceptually interesting for this exercise:

- a factory condition selecting the wrong class;
- an unsupported input no longer throwing;
- a color escape sequence changing;
- a branch condition being inverted.

### Mutation vocabulary

Learn these terms:

- **killed mutant** — a test failed because of the injected defect;
- **survived mutant** — the injected defect escaped the tests;
- **mutation score** — proportion of relevant mutants detected by the suite;
- **equivalent mutant** — a mutation that does not actually change observable behavior and therefore may be impossible to kill.

### The key experiment

Compare these two situations:

```text
Suite A
100% line coverage
weak assertions
several surviving mutants

Suite B
100% line coverage
behavior-focused assertions
fewer surviving mutants
```

Then explain why mutation testing gives information that raw coverage cannot.

Do not chase a mutation score blindly. Inspect surviving mutants and decide whether each one reveals:

1. a missing behavior test;
2. a weak assertion;
3. unreachable/dead code;
4. an equivalent or irrelevant mutation.

---

## Chapter 14D — Your test-quality report

At the end of the JavaScript implementation, create a short Markdown report containing:

```text
## Unit Test Quality Review

### Test inventory
- number of test files:
- number of tests:
- behaviors covered:

### Coverage
- statements:
- branches:
- functions:
- lines:

### Mutation testing
- mutation score:
- killed mutants:
- survived mutants:
- notable surviving mutants:

### Quality observations
- strongest test:
- weakest test:
- duplicated test logic:
- isolation concerns:
- determinism concerns:
- implementation coupling:

### Improvement decision
- one improvement worth making:
- one possible improvement intentionally rejected as unnecessary:
```

The final two items are important. Test engineering includes deciding **what not to add**.

---

# Part VI — Refactor only after the basic pattern works

## Chapter 15 — Examine duplication

Your three concrete classes may differ only by a color code.

That raises a design question:

> Are three subclasses genuinely expressing three different behaviors, or are they encoding three pieces of configuration?

This is where critical thinking matters more than blindly applying a pattern.

### Compare two designs

#### Design A — subclass-per-color

Strengths:

- mirrors the exercise exactly;
- makes Factory roles obvious;
- easy to teach and inspect.

Weaknesses:

- duplicates nearly identical `log()` implementations;
- adding many colors creates many tiny classes.

#### Design B — one configured console class

Conceptually:

```text
ColorConsole(colorCode)
```

Strengths:

- less duplication;
- adding colors may require only data/configuration.

Weaknesses:

- makes the exercise's concrete-product hierarchy less visible;
- may teach a different lesson than the chapter intended.

### Lesson

A design pattern is a tool, not a requirement to maximize the number of classes.

Complete Design A first because that is the exercise. Then compare it with Design B.

---

# Part VII — Rebuild it in TypeScript 7.0.2

## Chapter 16 — Do not merely rename `.js` to `.ts`

The TypeScript version should revisit the design contract.

TypeScript gives you language-level tools that JavaScript does not enforce in the same way.

Your goal is to ask:

> What assumptions were implicit in JavaScript that can now be made explicit?

---

## Chapter 17 — Set up TypeScript 7.0.2 intentionally

At the time this tutorial was prepared, TypeScript 7.0 is the current native compiler line and the official TypeScript announcement references `^7.0.2`.

Install the requested version deliberately in your exercise project.

A minimal project might become:

```text
console-color-factory-ts/
  package.json
  tsconfig.json
  src/
    color-console.ts
    red-console.ts
    blue-console.ts
    green-console.ts
    create-color-console.ts
    cli.ts
```

### TypeScript 7 considerations

TypeScript 7.0 changed several defaults compared with older TypeScript generations, including strict checking being enabled by default and `module` defaulting to `esnext`.

Even when defaults are useful, a learning project benefits from an explicit `tsconfig.json` so that you know which assumptions your code relies on.

### Checkpoint 17

Decide explicitly what you want for at least:

- `target`;
- `module`;
- `rootDir`;
- `outDir`;
- Node type declarations if your CLI uses `process`.

Do not copy a giant `tsconfig.json` from a framework project.

Keep it understandable.

---

## Chapter 17A — Rebuild the project structure for TypeScript

Do not simply rename every `.js` file to `.ts` and keep moving. Use the TypeScript pass to learn the additional project boundaries introduced by compilation.

Start by identifying the roles of:

```text
console-color-factory/
  package.json
  tsconfig.json
  src/
    ... .ts source modules
  test/                  # if you choose separate tests
  dist/                  # generated output, if emitting JavaScript
````

### TypeScript structure questions

Answer before configuring the compiler:

1. Which directory contains source-of-truth code?
2. Which directory, if any, contains generated code?
3. Should `dist/` be edited manually? Why not?
4. Should `dist/` be committed to Git for this exercise? Explain your choice.
5. What do `rootDir` and `outDir` mean conceptually?
6. Does TypeScript change the fact that each `.ts` file is a module when it uses imports/exports?
7. Why might your source imports still use `.js` specifiers in a Node ESM TypeScript project, depending on compiler/module settings?

### Compare two TypeScript layouts

**Layout A — mirrors the JavaScript exercise:**

```text
src/
  color-console.ts
  red-console.ts
  blue-console.ts
  green-console.ts
  create-color-console.ts
  cli.ts
````

**Layout B — grouped after the domain becomes clearer:**

```text
src/
  consoles/
    color-console.ts
    red-console.ts
    blue-console.ts
    green-console.ts
  create-color-console.ts
  cli.ts
````

Your job is not to pick the tree that looks more professional. Your job is to explain what change in project complexity would justify moving from A to B.

### Build-artifact checkpoint

At the end of the TypeScript pass, be able to trace one file through the system:

```text
src/red-console.ts
        |
        | TypeScript compiler
        v
dist/red-console.js
        |
        | Node.js executes
        v
runtime module
````

If your chosen TypeScript runtime executes `.ts` directly instead of emitting first, explicitly compare that workflow with the compile-to-`dist/` workflow rather than treating them as the same thing.

---

## Chapter 18 — Model the color input as a domain type

In JavaScript your factory probably receives a string.

In TypeScript, ask whether *every possible string* is a meaningful factory input.

### First idea to investigate

A string-literal union can represent a closed set of supported colors.

Conceptually:

```text
Color = red OR blue OR green
```

### Checkpoint 18

Compare:

```text
function createColorConsole(color: string)
```

with:

```text
function createColorConsole(color: Color)
```

Questions:

1. Which catches mistakes earlier for programmatic callers?
2. Does a CLI argument automatically satisfy the narrower type?
3. Where must runtime validation still happen?

Important lesson:

> Static typing does not remove the need to validate external input.

CLI input is still runtime data.

---

## Chapter 19 — Reconsider the base class

The JavaScript exercise requested a base class with an empty method.

TypeScript gives you a stronger option: an abstract contract.

Do not adopt it automatically.

### Compare

#### Concrete base class with empty method

Pros:

- matches the exercise literally.

Cons:

- subclasses can accidentally inherit a no-op implementation.

#### Abstract base class

Pros:

- expresses that `ColorConsole` is incomplete on its own;
- forces concrete subclasses to provide `log()`.

Cons:

- slightly diverges from the exact wording of the exercise.

### Suggested learning sequence

1. Port the exercise literally first.
2. Make tests pass.
3. Refactor `ColorConsole` into an abstract class.
4. Observe what the compiler now prevents.

This lets you *experience* the design benefit instead of accepting it as dogma.

---

## Chapter 20 — Compare abstract class vs interface

Now ask a deeper question:

> Does a colored console need shared implementation, or merely a common contract?

If it needs only this:

```text
log(message): void
```

then an interface could potentially represent the contract.

### Critical-thinking checkpoint

Compare:

- `abstract class ColorConsole`
- `interface ColorConsole`

Evaluate them on:

- runtime identity;
- shared implementation;
- inheritance coupling;
- flexibility for unrelated implementations;
- fidelity to the book exercise.

Do not decide based on "interfaces are better" or "classes are OOP". Decide based on what the abstraction needs to represent.

---

# Part VIII — TypeScript factory design

## Chapter 21 — Type the factory's result

The factory should expose the abstraction, not unnecessarily advertise concrete products.

Ask yourself why a return type conceptually equivalent to:

```text
ColorConsole
```

can be preferable to a union of every concrete console class.

### Principle

Clients should depend on what they **need to use**, not on every concrete implementation the factory might choose.

This reflects the **Dependency Inversion Principle** at a small scale.

---

## Chapter 22 — Runtime parsing at the CLI boundary

`process.argv` produces runtime strings.

Even if the factory accepts only a narrow `Color` type, the CLI must first prove that the incoming value is supported.

### Design challenge

Create a boundary between:

```text
unknown user string
```

and:

```text
validated Color
```

Possible tools to investigate:

- a validation function;
- a type guard;
- a parser that either returns a valid color or throws/reports an error.

### Strong separation of responsibilities

A good architecture might reason like this:

```text
CLI parsing -> validation -> typed domain value -> factory -> product
```

The factory should not need to understand `process.argv`.

---

# Part IX — Compare JavaScript and TypeScript implementations

## Chapter 23 — Write a small comparison

After both versions work, write a short note answering these questions.

### Contract

- What did JavaScript communicate only by convention?
- What could TypeScript enforce?

### Invalid input

- Which invalid inputs can TypeScript prevent at compile time?
- Which still require runtime validation?

### Abstraction

- Did an abstract class improve the design?
- Would an interface be enough?

### Factory

- Did the factory implementation itself materially change?
- Or did mostly its contract become clearer?

### Complexity

- Did TypeScript improve maintainability?
- Did it add ceremony that is disproportionate for such a small program?

There is no value in claiming TypeScript is automatically superior. Explain the tradeoff.

---

# Part X — Final critical-thinking challenges

Do these only after completing the exercise.

## Challenge A — Fourth color

Add `YellowConsole`.

Observe exactly how many files and code locations change.

Ask:

> Is the factory open for extension, or do I need to modify it every time?

Relate this to the **Open/Closed Principle** without forcing an abstraction prematurely.

---

## Challenge B — Factory lookup table

Replace a conditional factory with a lookup-based implementation.

Then compare the two versions.

Do not assume the lookup table is better.

Evaluate:

- readability;
- type safety;
- failure behavior;
- ease of extension;
- discoverability.

---

## Challenge C — No inheritance

Implement the same behavior without subclasses.

Possible direction:

```text
createColorConsole(color) -> object with log(message)
```

Compare this with the class hierarchy.

Question:

> Was inheritance required by the underlying problem, or required mainly by the exercise so that the Factory pattern is easier to see?

---

## Challenge D — Dependency injection for output

Instead of calling the global console directly, investigate passing an output function or output object into the console implementation.

Then ask:

- does this improve testing?
- does it complicate a tiny exercise unnecessarily?
- when would this become worthwhile in production code?

---

## Challenge E — Replace Factory with data

Imagine supporting 50 ANSI colors.

Would you still create 50 subclasses?

If not, what changed about the problem that makes a configuration/data-driven design more appropriate?

This is the most important final lesson:

> Patterns should emerge from design pressure. They should not be applied merely because you know their names.

---

# Part XI — Suggested interaction protocol with your tutor

When you want help, do **not** ask for the full solution first.

Use one of these prompts:

```text
I am at Chapter 6. Review only my RedConsole design. Do not give me the implementation. Ask me questions that help me find problems myself.
```

```text
My factory works, but I am unsure how invalid colors should be handled. Compare the design choices without writing the final factory for me.
```

```text
Give me one hint only. Do not reveal the next hint unless I ask.
```

```text
Review this code against Factory-pattern responsibilities, KISS, SOLID, and Node.js ESM conventions. Identify issues, but let me propose the fix first.
```

```text
My JavaScript version is complete. Before moving to TypeScript, quiz me on why the Factory exists and what coupling it removed.
```

---

# Completion criteria

You are done when you can explain, without looking at the code:

1. what problem the factory solves;
2. which code owns object creation;
3. why the CLI should not instantiate concrete products directly;
4. what all products have in common;
5. how unsupported input is handled and why;
6. how ESM affects your module organization;
7. what TypeScript adds to the design beyond syntax;
8. why runtime input still requires validation in TypeScript;
9. when the subclass-per-color design stops scaling well;
10. when a simpler data-driven design would be better.

If you cannot explain one of these, revisit the corresponding chapter before comparing your code with a reference solution.

---

# References

- Mario Casciaro and Luciano Mammino, *Node.js Design Patterns, 4th Edition*, Chapter 7, **Creational Design Patterns**, Exercise **7.1 Console color factory**.
- Packt, *Node.js Design Patterns, Fourth Edition*, Chapter 7 exercises.
- Node.js documentation, **ECMAScript modules**.
- Microsoft TypeScript Team, **Announcing TypeScript 7.0**, July 8, 2026. The announcement references TypeScript `^7.0.2` and documents the TypeScript 7 compiler/configuration changes relevant to this tutorial.

