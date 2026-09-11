# Playwright Guidelines

Use this reference when creating, reviewing, or debugging browser end-to-end tests for Node.js and TypeScript applications.

## Test Scope

Playwright tests should prove realistic user flows, not internal implementation details.

Good flows:

- A user signs in, completes a critical task, and sees persisted results.
- A user submits invalid data and receives accessible validation feedback.
- A user navigates between key views and state survives reload or session boundaries.
- A user can recover from a server-side error or empty state.
- A regression path previously missed by lower-level tests is covered through the UI.

Avoid using E2E tests to exhaustively test every branch already covered by unit or integration tests.

## Locators

Prefer resilient, user-facing locators:

```ts
await page.getByRole('button', { name: 'Create booking' }).click()
await expect(page.getByRole('heading', { name: 'Booking confirmed' })).toBeVisible()
```

Locator preference:

- `getByRole` with accessible name.
- `getByLabel`, `getByPlaceholder`, `getByText`, or `getByAltText` when they match how users perceive the UI.
- `getByTestId` for controls without stable accessible text, dynamic visual widgets, or repeated elements where the accessible contract is insufficient.
- CSS or XPath only when no better locator exists.

Red flags:

- Deep CSS chains tied to layout.
- Selecting by generated class names.
- Text locators for copy that changes frequently and is not the behavior.
- Index-based locators without first narrowing to a meaningful region.

## Waits And Timeouts

Use Playwright's web-first assertions and event-aware waits:

```ts
await page.getByRole('button', { name: 'Save' }).click()
await expect(page.getByText('Saved')).toBeVisible()
```

Avoid arbitrary sleeps such as `waitForTimeout()` unless debugging locally. Replace them with:

- `expect(locator).toBeVisible()`, `toHaveText()`, `toHaveURL()`, `toBeEnabled()`, or `toHaveCount()`.
- `page.waitForURL()` for navigation.
- `page.waitForResponse()` only when a network event is the behavior or a necessary readiness signal.
- App-level readiness markers or deterministic API setup.

Keep custom timeouts local and explain why the operation may take longer. Raising the global timeout usually hides nondeterminism.

## Deterministic Data

- Seed data through API helpers, database fixtures, or worker-scoped setup.
- Use unique names or IDs per test and worker.
- Prefer direct setup APIs over clicking through unrelated UI just to create prerequisites.
- Clean up data or use disposable namespaces.
- Freeze or inject time when UI behavior depends on current dates, expiry, countdowns, or sorting by recency.
- Avoid dependencies on public external services in routine CI.

## Authentication

- Prefer storage state or API-level login setup when the login flow itself is not under test.
- Keep one or two true login tests if authentication UX is critical.
- Avoid sharing mutable accounts across parallel workers unless each test owns its data.
- Reset server-side session state when tests mutate permissions or profile attributes.

## Assertions

Assert outcomes users care about:

- Visible confirmation, validation, error, or empty state.
- Persisted data after navigation or reload.
- Correct URL or route when navigation is the behavior.
- Enabled/disabled state for guarded actions.
- Accessible name, role, focus, or keyboard behavior when accessibility is part of the contract.

Avoid asserting implementation internals:

- React/Vue/Svelte component names.
- Redux/store state exposed only for tests.
- Network call counts unless the behavior is specifically about network behavior.
- Animation timing unrelated to user outcome.

## Debugging Flakiness

When a Playwright test flakes:

- Check whether the locator can match more than one element.
- Replace sleeps with web-first assertions.
- Ensure test data is unique and setup completed before the flow begins.
- Verify the app server, worker, database, and browser context are isolated per test or worker.
- Capture trace, screenshot, video, console logs, network logs, and server logs in CI.
- Look for actionability issues: covered elements, disabled controls, unfinished navigation, focus traps, or animations.
- Reproduce with repeat mode and the same worker count used in CI.

## Parallelism

Design E2E tests for parallel execution:

- Use worker-specific accounts or data namespaces.
- Avoid fixed ports unless the Playwright config owns a single shared web server.
- Do not mutate global feature flags or shared admin settings without isolation.
- Keep cleanup best-effort but do not rely on cleanup from a previous test for correctness.

## Review Checklist

- The test covers a realistic user flow that lower-level tests cannot fully prove.
- Locators are accessible and resilient.
- There are no arbitrary sleeps.
- Test data is deterministic and isolated.
- Authentication setup matches the behavior under test.
- Assertions verify user-visible outcomes.
- Timeouts are local and justified.
- CI artifacts are enabled for failures.
- The test can run alone, with the file, and in the relevant E2E suite.
