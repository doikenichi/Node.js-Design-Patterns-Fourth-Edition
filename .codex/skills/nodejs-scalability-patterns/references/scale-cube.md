# Scale Cube Decision Guide

Use the Scale Cube to choose the smallest scaling dimension that matches the limiting resource. Treat each axis as a costed design move, not as maturity ladder.

## X-Axis: Cloning

X-axis scaling runs multiple identical copies of the same service.

Use it when:

- One Node.js process cannot use available CPU cores because one event loop owns request handling.
- Availability improves if a process, container, or host can fail while another replica continues serving.
- Work is stateless, state is externalized, or client affinity is acceptable for a transition period.
- The bottleneck is per-process memory, connection count, event-loop delay, or process failure isolation.

Avoid or delay it when:

- A shared database, broker, cache, filesystem, or external API is already saturated.
- Work depends on in-memory sessions, process-local locks, local files, in-process schedulers, or singleton jobs.
- Replication would multiply background jobs, cron tasks, websocket subscriptions, or dependency connections without coordination.

Implementation notes:

- For local process replication, Node.js `cluster` can share a server port across workers, but process lifecycle, readiness, graceful shutdown, and sticky traffic remain application concerns.
- Prefer platform replication such as containers, orchestrators, or process managers when the system already uses them.
- Make per-replica identity observable with process ID, worker ID, pod name, instance ID, or service version.

Original ESM sketch:

```js
// cluster-server.js
import cluster from 'node:cluster'
import { availableParallelism } from 'node:os'
import process from 'node:process'
import { createServer } from './server.js'

const workers = Number(process.env.WEB_CONCURRENCY ?? availableParallelism())

if (cluster.isPrimary) {
  for (let i = 0; i < workers; i++) {
    cluster.fork()
  }

  cluster.on('exit', (worker, code, signal) => {
    console.error({ workerId: worker.id, code, signal }, 'worker exited')
    cluster.fork()
  })
} else {
  const server = createServer()
  server.listen(Number(process.env.PORT ?? 3000), () => {
    console.log({ pid: process.pid }, 'worker ready')
  })
}
```

Add graceful shutdown and readiness before using a sketch like this in production.

## Y-Axis: Service Or Function Decomposition

Y-axis scaling splits responsibilities into separately deployable services or separately scaled functions.

Use it when:

- One capability has a different scaling profile from the rest of the system.
- A team needs independent release ownership and the boundary is already stable.
- A failure-prone capability should be isolated from core flows.
- Data ownership can be separated without shared-table coupling.
- A compliance, security, or dependency boundary justifies a separate runtime.

Avoid or delay it when:

- The only problem is code size or untidy modules.
- The candidate service would share most database tables with the monolith.
- The new service would require synchronous fan-out on every request and make latency worse.
- Deployment, observability, and incident response are not ready for distributed operation.

Prefer a modular monolith when module boundaries, explicit interfaces, and independent tests solve the immediate problem without distributed-system costs.

## Z-Axis: Data Partitioning

Z-axis scaling splits data or traffic by a routing key while keeping the same functional shape.

Use it when:

- Data volume, tenant count, write throughput, or hot data sets exceed one database or service instance.
- Requests can be routed by tenant, user, region, account, object ID, or another stable key.
- Cross-partition operations are rare, asynchronous, or can be explicitly planned.
- Regulatory, latency, or data locality requirements align with partitions.

Avoid or delay it when:

- No stable partition key exists.
- Most queries need global ordering, global aggregation, or cross-partition joins.
- Hot keys would dominate a partition.
- The migration and rebalancing plan is vague.

Design checks:

- Define the partition key and prove it is present early enough in the request path.
- Plan initial assignment, lookup, migration, rebalancing, and backfill.
- Decide how to handle global IDs, unique constraints, reporting, search, and analytics.
- Add metrics per partition, not only global averages.

## Combining Dimensions

Combination is common, but every dimension should solve a separate named pressure:

- X + Y: replicate each service independently after extracting a service with a distinct scaling profile.
- X + Z: run many identical replicas that route to partitioned data stores.
- Y + Z: split services and partition the data owned by a high-volume service.
- X + Y + Z: use only when scale, ownership, and data volume are all proven and operations can support it.

Before combining dimensions, write down:

- The limiting resource addressed by each axis.
- The failure domain introduced or reduced by each axis.
- The new routing, state, deployment, observability, and testing requirements.
- The rollback or migration path if one dimension underperforms.

## Decision Output Template

When using this reference, summarize the choice like this:

```text
Limiting resource:
Evidence:
Scaling required now:
Chosen axis:
Why simpler fixes are insufficient:
State impact:
Failure-domain impact:
Backpressure impact:
Operational complexity:
Verification plan:
```
