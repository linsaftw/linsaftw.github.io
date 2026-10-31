---
title: FlameSpawners overview
description: What FlameSpawners does, how its bounded production loop and storage backends work in the 1.0.6 build.
plugin: flamespawners
pluginName: FlameSpawners
topic: overview
order: 1
updatedAt: 2026-10-30
version: "1.0.6"
platforms:
  - Bukkit
  - Spigot
  - Paper
  - Folia (declared)
sourceStatus: private
draft: false
---

FlameSpawners manages stacked loot spawners: blocks that roll configured loot on a cycle,
store or emit the result, and can be sold, upgraded and inspected. It targets Bukkit-family
servers, and the same shaded JAR is intended to load on Bukkit, Spigot, Paper and Folia.
Folia support is declared and implemented through a reflective scheduler bridge; it was not
verified on a Folia server for this page.

## Build status

`1.0.6` is the version in `pom.xml` and in the plugin descriptor. The changelog still lists
the 1.0.6 entry under `[Unreleased]`, so this page calls it the current build version rather
than a dated release. The source is private and the licence is proprietary: all rights
reserved, with redistribution, resale, relicensing or publication requiring written
permission. No public repository link is published here.

## Requirements

| Requirement | Verified detail |
| --- | --- |
| Server | Bukkit, Spigot or Paper; `api-version: 1.13` is the declared floor |
| Folia | `folia-supported: true`; reflective `SchedulerBridge` with a Bukkit fallback |
| Build target | `spigot-api 1.8.8-R0.1-SNAPSHOT`, `maven.compiler.release 8` |
| Java | Java 8 bytecode; run the JVM your server version requires |
| Storage | YAML, SQLite or MySQL; SQLite is the shipped default |
| Optional hooks | Vault or ExcellentEconomy, hologram providers, protection and claim plugins, PlaceholderAPI |

The 1.8.8 build target describes the compile classpath, not a supported server floor. The
descriptor asks for the 1.13 API, and only the metadata is declared; test your own server
build and plugin set.

## Production is a bounded loop

Production is tick-driven and batched rather than one task per spawner. A dispatcher walks a
limited slice of the registry, computes due cycles, and hands large roll counts to an async
path. The shipped values put hard ceilings on each pass:

| Key | Shipped default | What it bounds |
| --- | --- | --- |
| `production.enabled` | `true` | Master switch for automatic production |
| `production.dispatcher-interval-ticks` | `20` | How often a dispatch pass runs |
| `production.max-spawners-per-dispatch` | `32` | Spawners examined per pass |
| `production.default-cycle-seconds` | `40` | Default cycle when a spawner has no override |
| `production.minimum-cycle-seconds` | `1` | Lower bound for per-spawner delays |
| `production.max-catch-up-cycles-per-pass` | `1` | Overdue cycles settled in one pass |
| `production.max-logical-rolls-per-pass` | `250000` | Roll ceiling for a single pass |
| `production.async-calculation-threshold-rolls` | `10000` | Roll count that moves calculation off the tick thread |
| `production.activation.require-nearby-player` | `false` | Whether activation needs a nearby player |
| `production.activation.nearby-player-radius` | `16.0` | Radius used when that check is enabled |

The consequence is backpressure, not a promise of zero lag. A large spawner network drains
over multiple passes, overdue work is capped, and output that cannot be delivered is held
against explicit limits. Tune the cycle and per-spawner overrides before raising the pass
ceilings, and watch the diagnostics rather than assuming the defaults fit your load.

## Output modes

Each spawner has an output mode. `STORAGE` is the shipped default; the alternatives change
where produced items go, not how often they are rolled.

| Mode | Destination |
| --- | --- |
| `STORAGE` | The spawner's persistent container |
| `DROP` | Items in the world near the spawner |
| `MONSTER` | A managed monster entity output |
| `HOPPER` | A physical hopper below the spawner, when one is available |

Delivery has its own caps: `output.max-pending-cycles: 256`, `output.max-pending-items:
1000000`, `output.max-world-item-entities-per-spawner: 50`, and
`output.max-monster-entities-per-spawner: 10`. A blocked destination retries after
`output.blocked-retry-ticks: 40`. These are the mechanisms that keep a stalled chunk from
turning into an unbounded queue.

## Storage backends

| Setting | Shipped default | Notes |
| --- | --- | --- |
| `storage.backend` | `SQLITE` | `YAML`, `SQLITE` or `MYSQL`; `MARIADB` is accepted as a MySQL alias |
| `storage.queue-limit` | `10000` | Pending persistence operations |
| `storage.flush-interval-millis` | `2000` | Queued flush cadence |
| `storage.flush-batch-size` | `256` | Operations per flush batch |
| `storage.shutdown-timeout-millis` | `10000` | Time allowed for a final flush |
| `storage.sqlite.file` | `spawners.db` | Relative to the plugin data folder |
| `storage.mysql.pool-size` | `6` | MySQL connection pool |

Backend selection is restart-only. Switching backends is an offline operation:
`/flamespawners storage migrate scan <YAML|SQLITE|MYSQL>` reports what would move, and
`apply` performs it. The persistence schema is versioned separately from the plugin build,
and retries back off from 1 second to 60 seconds.

## Public API

The plugin exposes `FlameSpawnersApi`, and `getApiVersion()` returns `3`. The surface covers
spawner views and operations, a GUI layout registry, Bukkit events, and an external
sell-price provider SPI used by the economy integration. The API version is a code contract
for consumers; it does not guarantee identical runtime behaviour across server versions or
third-party forks.

## What is not claimed

- No zero-lag or unlimited-throughput claim. Production, output and storage all have
  explicit ceilings and backpressure.
- No dated 1.0.6 release. The changelog entry is still unreleased.
- No verified Folia or 1.8 runtime. Folia is a declared, reflective integration.
- No benchmark figures. The source contains tests, not a published performance study.
- No claim that SmartSpawner import makes every third-party spawner format compatible.

## Next steps

- [Commands and permissions](/docs/flamespawners/commands-permissions.html) for the exact
  routes, nodes and default grants.

> **Verified against** the private FlameSpawners source at version 1.0.6 (`pom.xml`), its
> bundled `plugin.yml`, `config.yml` and admin command reference, on 30 October 2026. No
> build or server run was performed. Values describe the shipped defaults and declarations;
> confirm them in your generated configuration and JAR.
