---
title: "A spawner production loop with a ceiling"
description: "FlameSpawners dispatches production in bounded passes, caps logical rolls, and treats output as backpressure instead of an unbounded queue."
publishedAt: 2026-10-30
updatedAt: 2026-10-30
tags: ["flamespawners", "minecraft", "scheduling", "folia"]
author: "LinsaFTW / Juan Cruz Linsalata"
canonicalPath: "/posts/flamespawners-bounded-production-loop.html"
draft: false
featured: false
relatedProjects: ["flamespawners"]
relatedDocs: ["/docs/flamespawners/overview.html", "/docs/flamespawners/commands-permissions.html"]
---

One repeating task per spawner is the obvious implementation. It is also the implementation that turns a large spawner network into a scheduler problem: hundreds or thousands of independent tasks, each with its own due time, each competing for the same tick. The server does not slow down because one spawner is expensive. It slows down because the sum of small tasks is larger than the tick.

FlameSpawners uses one dispatcher instead. A pass walks a limited slice of the spawner registry, computes which cycles are due, and hands large roll counts to an async calculation path. The design is explicit backpressure with numbers an operator can inspect, not a "no lag" claim.

## One dispatcher, not one task per spawner

The shipped production settings define the shape of a pass:

```yaml
production:
  dispatcher-interval-ticks: 20
  max-spawners-per-dispatch: 32
  max-logical-rolls-per-pass: 250000
  max-catch-up-cycles-per-pass: 1
  async-calculation-threshold-rolls: 10000
  default-cycle-seconds: 40
```

The dispatcher runs every 20 ticks. Each pass examines at most 32 spawners. A spawner that has no override uses a 40-second cycle; per-spawner delays can go down to one second. Overdue work is limited to one catch-up cycle per pass, so a spawner that missed ten cycles does not settle all ten at once.

The 32-spawner slice is the part that makes the loop predictable. A network with more than 32 spawners is not processed in one tick; it drains across passes. That is a deliberate trade: a large network will take longer to complete a full sweep, but no single pass grows without bound.

## The roll ceiling is a scheduling decision

`max-logical-rolls-per-pass: 250000` is a ceiling on loot computation, not on items produced. A roll is the work of evaluating a loot table; the resulting item count depends on the table. The distinction matters when tuning, because a table that produces stacks is not the same load as a table that produces one item.

When a pass would exceed 10,000 rolls, calculation moves off the tick thread. The dispatcher stays on the tick; the expensive roll computation moves off it, while output delivery still has to respect the caps below. Below the threshold, the work stays inline because the handoff would cost more than it saves.

The ceiling also changes what "due" means. A spawner can be due and still wait for a later pass if the current pass has spent its roll budget. That is backpressure, not a bug. The server is choosing to delay production rather than blow the tick.

## Output is where backpressure becomes visible

Production is only half of the loop. A spawner that rolls loot still has to put it somewhere, and the destination can be full, unloaded or blocked. FlameSpawners has four output modes that make that destination explicit:

| Mode | Destination |
| --- | --- |
| `STORAGE` (default) | The spawner's persistent container |
| `DROP` | Items in the world near the spawner |
| `MONSTER` | A managed monster entity output |
| `HOPPER` | A physical hopper below the spawner, when available |

Each mode has its own failure mode. `STORAGE` is bounded by the container. `DROP` is bounded by world item entities. `MONSTER` is bounded by entity counts. `HOPPER` depends on a block that may be missing, full or unloaded.

The plugin puts explicit caps around those paths:

- `output.max-pending-cycles: 256`
- `output.max-pending-items: 1000000`
- `output.max-world-item-entities-per-spawner: 50`
- `output.max-monster-entities-per-spawner: 10`
- `output.blocked-retry-ticks: 40`

A blocked destination retries after 40 ticks. Output that cannot be delivered is held against those limits rather than queued forever. When a limit is reached, production for that spawner has to wait; the alternative is an in-memory queue that grows until the server runs out of memory.

That is the part operators should watch. A spawner network that looks fine at low population can accumulate pending output when players are not online to collect it, or when a hopper line is broken. The caps make the failure visible in diagnostics instead of turning it into an OOM.

## Storage is part of the production loop

The default backend is `SQLITE`. `YAML` and `MYSQL` are also available, with `MARIADB` accepted as a MySQL alias. Backend selection is restart-only.

Persistence is queued and batched:

| Setting | Default |
| --- | --- |
| `storage.queue-limit` | 10000 |
| `storage.flush-interval-millis` | 2000 |
| `storage.flush-batch-size` | 256 |
| `storage.shutdown-timeout-millis` | 10000 |
| `storage.mysql.pool-size` | 6 |

The queue limit is another backpressure point. A slow database does not get an unbounded write queue; it gets a bounded one and a flush cadence. Shutdown gets a final flush with a timeout, and retries back off from one second to sixty seconds.

Switching backends is an offline operation. `/flamespawners storage migrate scan <backend>` reports what would move, and `apply` performs it. The persistence schema is versioned separately from the plugin build, which is the right boundary: a plugin update should not silently imply a storage migration.

## Activation and the limits around it

`production.activation.require-nearby-player` ships as `false`, with a radius of `16.0` when enabled. That default suits servers that want spawners to run while players are elsewhere; it also means a large network can produce without anyone present. Operators who want player-gated production should enable the check rather than assume it is on.

Stacking has its own cap: `stacking.global-cap` and `stacking.maximum` both default to 100. Placement has `placement.per-chunk-limit: 0`, which means unlimited, so the per-chunk limit is not a safeguard unless an operator sets one. Breaking defaults to requiring silk touch, with `stored-content-policy: DELIVER`. Natural spawners convert on interact by default.

Those are independent policy choices, not part of the production loop. The production ceiling bounds work per pass; the stacking and placement limits bound how much state a player can create. A server that raises one without considering the other is tuning half the system.

## Folia and the legacy class path

Folia support is implemented through `SchedulerBridge`, a reflective bridge with a Bukkit fallback. Folia classes are kept out of loaded signatures, which is what lets the same shaded jar load on a non-Folia server. The build targets Java 8 bytecode with `api-version: 1.13`.

That is a compatibility design, not a certification. The bridge has not been runtime-verified on a Folia server for this article, and the 1.8.8 compile target describes the compile classpath, not a supported server floor. The descriptor asks for the 1.13 API; test your own server build and plugin set.

## What this does not prove

`1.0.6` is the version in the POM and the plugin descriptor, but the changelog still lists the entry under `[Unreleased]`. There is no dated 1.0.6 release to cite.

The source is private and the license is proprietary: all rights reserved, with redistribution, resale, relicensing or publication requiring written permission. No public repository link is published here.

The shipped defaults are not recommendations. A 250,000-roll ceiling and a 32-spawner slice are starting points; a network with expensive loot tables may need a lower ceiling, and a small network may never reach either limit. The source ships tests, not a published performance study, so no throughput or tick-time figure is claimed.

The public API returns version 3 and includes a sell-price provider SPI, but an API version is a code contract for consumers, not a guarantee of identical runtime behavior across server versions or forks. SmartSpawner import does not make every third-party spawner format compatible.

For the production and storage keys, see the [FlameSpawners overview](/docs/flamespawners/overview.html). For the wider product list, see [work](/work.html).
