# Container And Orchestrator Guidelines

Use this reference when scaling Node.js applications with Docker, containers, or Kubernetes.

## Container Boundaries

A container should normally run one main application process:

- HTTP API
- worker
- scheduler
- migration job
- CLI task

Keep roles separate when they have different scaling, shutdown, resource, or failure behavior. Avoid bundling an API server, scheduler, and queue consumer into one container unless the platform or project intentionally supervises them together.

Container boundaries are not service boundaries by themselves. A modular monolith can run in a container, and one service can have multiple containerized roles.

## Docker Guidance

Production-oriented Dockerfiles should:

- Use a Node.js 24+ base image or a base image approved by the project.
- Install only runtime dependencies in the final image.
- Run as a non-root user when feasible.
- Set `NODE_ENV=production` for production images.
- Avoid baking secrets into layers.
- Expose the application port as documentation, not as security.
- Use deterministic package manager commands matching the repo lockfile.
- Keep native build tools out of the final image unless needed at runtime.
- Include signal-friendly process startup, such as `CMD ["node", "server.js"]`.

Original multi-stage shape:

```dockerfile
FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
```

Adapt package-manager commands to the project. For pnpm, use Corepack and the lockfile already present.

## Stateless Service Rules

Horizontal scaling works best when replicas are interchangeable:

- Store sessions in signed cookies or external session stores.
- Store durable job state in a database or broker, not memory.
- Store shared counters, rate limits, and locks in external coordinated stores.
- Treat in-process caches as disposable and bounded.
- Write uploaded files to durable object storage or volumes designed for the deployment model.
- Coordinate schedulers and singleton jobs with leases, leader election, or platform-native cron jobs.

Sticky sessions can be acceptable for websocket-heavy or migration scenarios, but document what happens when the sticky replica dies and how the design can move toward externalized state.

## Health And Readiness

Expose separate signals when the platform supports them:

- Liveness: the process is alive and should be restarted if this fails repeatedly.
- Readiness: the instance can receive new traffic.
- Startup: the process is still initializing and should not be killed too early.

Readiness should fail when:

- Startup is incomplete.
- Shutdown drain has started.
- Required dependencies are unavailable.
- Local queues are beyond an overload threshold.
- Database or broker connections required for serving traffic are not usable.

Liveness should be conservative. Do not restart a process only because a downstream dependency is unavailable.

Original ESM health sketch:

```js
let ready = false
let draining = false

export function markReady() {
  ready = true
}

export function markDraining() {
  draining = true
}

export function healthRoutes({ app, dependencies }) {
  app.get('/health/live', (req, res) => {
    res.status(200).json({ status: 'live' })
  })

  app.get('/health/ready', async (req, res) => {
    const databaseOk = await dependencies.database.ping()
    const status = ready && !draining && databaseOk ? 200 : 503
    res.status(status).json({ ready, draining, databaseOk })
  })
}
```

Use the local framework style; the behavior matters more than the library.

## Graceful Shutdown

Production services should handle `SIGTERM` and `SIGINT`:

- Stop accepting new work by failing readiness.
- Close HTTP servers so new connections are refused.
- Drain in-flight requests with a deadline.
- Stop queue consumers and schedulers.
- Commit, ack, nack, or requeue messages according to delivery semantics.
- Close database, broker, cache, and telemetry clients.
- Force close idle or remaining connections only after the drain deadline.
- Exit with a status that reflects success or failure.

Original ESM shape:

```js
import process from 'node:process'

export function installShutdown({ server, closeResources, markDraining, timeoutMs = 10_000 }) {
  async function shutdown(signal) {
    console.log({ signal }, 'shutdown started')
    markDraining()

    const deadline = AbortSignal.timeout(timeoutMs)
    server.close()
    server.closeIdleConnections?.()

    try {
      await closeResources({ signal: deadline })
      process.exitCode = 0
    } catch (error) {
      console.error({ error }, 'shutdown failed')
      process.exitCode = 1
    } finally {
      server.closeAllConnections?.()
    }
  }

  process.once('SIGTERM', shutdown)
  process.once('SIGINT', shutdown)
}
```

Adapt this to avoid exiting before async logging or telemetry flushes complete.

## Kubernetes Review

When using Kubernetes, inspect:

- Deployment replica count, rolling update strategy, pod disruption budget, and resource requests/limits.
- Readiness, liveness, and startup probes.
- Service and ingress routing behavior.
- Horizontal Pod Autoscaler signals and whether they match the bottleneck.
- ConfigMaps, Secrets, environment variables, and secret rotation.
- Container ports, termination grace period, and preStop hooks.
- Pod anti-affinity or topology spread when availability requires it.
- Database, broker, cache, and external dependency connection limits multiplied by replicas.

Replica count is not a capacity plan. Size replicas from load tests and production metrics, then verify downstream dependencies can absorb the multiplied traffic and connections.

## Reverse Proxy And Load Balancing Concepts

Reverse proxies can provide:

- TLS termination
- request routing
- health-aware upstream selection
- buffering policy
- timeout policy
- compression policy
- request size limits
- connection reuse
- static asset serving
- access logs and metrics

Nginx-style upstream balancing commonly involves upstream pools, passive/active health behavior, per-upstream timeouts, buffering choices, websocket upgrade handling, and graceful reload. Keep config generated or templated if service instances change frequently.

Use service discovery when instance addresses are dynamic. Use peer-to-peer balancing only when clients can discover peers, handle stale membership, retry safely, and emit enough observability to debug uneven routing.

## Container Verification

Verify with:

- Image build and startup command.
- Unit or integration tests for health/readiness and shutdown behavior.
- Local container run with signal handling checked.
- Load test against one replica and multiple replicas.
- Failure test: kill a container during traffic and confirm readiness/load balancer behavior.
- Metrics check: per-replica CPU, memory, event-loop delay, active connections, request rate, and error rate.
- Dependency connection check: total pools across replicas stay under database/cache/broker limits.
