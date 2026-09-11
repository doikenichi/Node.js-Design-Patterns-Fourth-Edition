# Application Decomposition And Microservice Integration

This reference helps decide whether to keep a monolith, improve a modular monolith, or introduce service decomposition. It must not be used to recommend microservices by default.

## Default Position

Prefer the least distributed architecture that meets the target:

- Monolith: one deployable, one primary runtime boundary, simplest transactions and debugging.
- Modular monolith: one deployable with strong internal module boundaries, explicit interfaces, independent tests, and separated data access ownership inside the codebase.
- Microservices: multiple independently deployable services with independent ownership, operational maturity, and clear contracts.

Code size alone is not a reason to split a service. Untidy modules usually need modularization before distribution.

## Monolith

Use or keep a monolith when:

- One team can release safely together.
- Data consistency benefits from local transactions.
- Traffic shape is similar across capabilities.
- Runtime failures do not need strict isolation between capabilities.
- Operational tooling for distributed systems is limited.

Improve it with:

- Clear module boundaries and public module APIs.
- Composition roots that wire dependencies.
- Internal event or command boundaries where useful.
- Domain-facing adapters for external systems.
- Focused tests for module contracts.

## Modular Monolith

Use a modular monolith when:

- The codebase needs stronger ownership boundaries but independent deployment is not yet necessary.
- A future service boundary is being explored and should be validated inside one deployable first.
- Shared database access can be constrained by module ownership.
- Local development and transactions still matter.

Practical rules:

- Modules should not import each other's internals.
- Cross-module communication should use explicit functions, commands, events, or interfaces.
- Each module should own its data access layer or repository surface.
- Tests should enforce module behavior through public APIs.
- Observability should include module names in logs and metrics to expose future scaling pressure.

## Microservices

Use microservices only when one or more of these are concrete and important:

- Independent scaling: one capability has a different load profile or resource bottleneck.
- Independent release: teams need separate deploy cadence with clear API contracts.
- Fault isolation: one capability can fail or degrade without taking down core flows.
- Data ownership: a service can own its data without shared writes from other services.
- Security/compliance: a runtime boundary reduces access or audit scope.
- Technology/runtime fit: a workload needs a different runtime, deployment model, or resource class.

Costs to account for:

- Network latency, partial failure, retries, timeouts, and versioned contracts.
- Distributed tracing, centralized logs, metrics, and alerting.
- Data consistency, schema evolution, migrations, and backfills.
- Local development, test environments, fixtures, and contract testing.
- Authentication, authorization, secret management, and service identity.
- Deployment orchestration, rollback, incident response, and on-call ownership.

Red flags:

- Shared database tables across services.
- Synchronous fan-out that makes one user request depend on many services.
- No idempotency story for commands or messages.
- No clear owner for data, uptime, and deployment.
- No contract tests or compatibility plan.
- Splitting because "microservices scale" without a measured bottleneck.

## Service Boundary Checklist

Before extracting a service, answer:

- What limiting resource or ownership problem does this boundary solve?
- What data does the service own exclusively?
- Which operations remain synchronous, and which become asynchronous?
- What is the service-level objective and alerting policy?
- How are contracts versioned and tested?
- How are retries, idempotency, and duplicate messages handled?
- What happens if the new service is slow or unavailable?
- Can the monolith continue to operate in a degraded mode?
- How will migration, backfill, dual-write avoidance, and rollback work?

If the answers are weak, improve the module boundary inside the current deployable first.

## Integration Patterns

### API Proxy

Use an API proxy when clients need one edge surface for routing, authentication, TLS termination, rate limiting, or gradual backend migration.

Good fit:

- Stable client API hiding backend service topology.
- Central auth, request limits, or routing policy.
- Migration from monolith endpoints to extracted services.

Risks:

- Proxy becomes a business-logic dumping ground.
- Hidden coupling and unclear ownership.
- Added latency and another failure domain.

Keep it thin: route, authenticate, authorize, validate edge constraints, translate coarse protocol concerns, and emit observability.

### API Orchestration

Use API orchestration when one request must aggregate several backend capabilities and the composition is truly an application workflow.

Good fit:

- A backend-for-frontend or workflow service owns response composition.
- Fan-out is bounded and latency budgets are explicit.
- Partial failure behavior is defined.

Risks:

- N+1 service calls and tail-latency amplification.
- Transaction-like logic spread across services.
- Orchestrator becomes a new monolith without clear ownership.

Engineering rules:

- Set deadlines and pass `AbortSignal` through downstream calls.
- Bound parallelism and fan-out.
- Cache or precompute expensive aggregates when freshness permits.
- Return partial data only when product behavior defines it.
- Trace each downstream call with correlation IDs.

Original ESM sketch:

```js
export async function getDashboard({ userId, clients, signal }) {
  const timeout = AbortSignal.timeout(800)
  const combinedSignal = AbortSignal.any([signal, timeout].filter(Boolean))

  const [profile, invoices, incidents] = await Promise.all([
    clients.users.getProfile(userId, { signal: combinedSignal }),
    clients.billing.listOpenInvoices(userId, { signal: combinedSignal }),
    clients.status.listIncidents(userId, { signal: combinedSignal })
  ])

  return { profile, invoices, incidents }
}
```

### Message Broker

Use a message broker when work should be asynchronous, buffered, distributed, retried, or delivered to multiple consumers.

Good fit:

- Background jobs, email, notifications, media processing, order workflows, analytics events, and integration events.
- Producers and consumers should remain available independently.
- Burst smoothing or work distribution is needed.

Risks:

- Duplicate delivery, out-of-order delivery, poison messages, lag, and difficult debugging.
- Event schemas become long-lived contracts.
- Backpressure moves into queues and must be monitored.

Engineering rules:

- Consumers must be idempotent.
- Use explicit retry limits and dead-letter handling.
- Track lag, processing duration, failures, and redelivery count.
- Preserve ordering only where it is a real business invariant.
- Keep event names and payloads versioned.
- Use transactional outbox or equivalent when database writes and event publication must stay consistent.

## Migration Strategy

Prefer incremental extraction:

1. Create a module boundary in the monolith.
2. Define a narrow interface and data ownership rules.
3. Add observability by module/capability.
4. Move one integration path behind an adapter or proxy.
5. Add contract tests and compatibility tests.
6. Extract runtime only when the boundary proves useful.
7. Migrate traffic gradually with rollback.

Successful extraction should reduce or isolate a named pressure. It should not merely move complexity into network calls.
