---
title: "Entity caps as a budget, not a single number"
description: "How EntityLimiter combines per-type and group caps, RADIUS and GRID counting, bounded reconciliation, tombstones and claim hooks."
publishedAt: 2026-10-30
updatedAt: 2026-10-30
tags: ["entitylimiter", "minecraft", "performance", "folia"]
author: "LinsaFTW / Juan Cruz Linsalata"
canonicalPath: "/posts/entitylimiter-chunk-budgeting.html"
draft: false
featured: false
relatedProjects: ["entitylimiter"]
relatedDocs: ["/docs/entitylimiter/overview.html", "/docs/entitylimiter/configuration.html"]
---

The first symptom of an entity leak is rarely an exception. It is a tick that takes longer than it did yesterday, then a chunk that saves more slowly, then a player who reports that mobs are "lagging" while the server is actually spending its budget on entity bookkeeping. By the time the count is obviously wrong, the cost is already being paid every tick.

EntityLimiter approaches that problem as a budgeting system rather than a single number. It observes entities that already exist, compares them against configured caps, and removes over-limit entities or rejects additions depending on the path that created them. It is not a spawn controller and does not decide what a farm is allowed to produce. It decides how much local entity state the server will carry.

## Two cap families, evaluated together

Every entity is checked against two independent families:

- a **per-type** cap, taken from the exact entity type or `limits.default` when no type-specific key exists;
- every matching **group** cap, such as `monsters`, `animals`, `projectiles`, `boats` or `minecarts`.

`default` is a per-type fallback, not a shared bucket. A chicken with no specific rule is limited by `default`, and it still consumes a place in the `animals` total. A zombie is limited by `limits.zombie` and by `limits.monsters`. Exceeding either family is enough to trigger enforcement.

Setting `default: 32` does not mean "32 entities total"; it means "32 of each type that has no explicit entry". Group totals are counted separately and are not reduced by a type's unused allowance.

```yaml
limits:
  mode: RADIUS
  radius: 16
  default: 32
  monsters: 32
  animals: 32
  projectiles: 16
```

The shipped defaults also include per-type entries such as `zombie: 16`, `horse: 40` and `item_frame: 256`, plus the group totals above. Those are starting values, not a recommendation for every server.

Per-world overrides live under `world-limits.<world>`. Each world has its own `enabled` flag and its own limit map. Only enabled worlds override matching keys; unspecified keys inherit the base rules. The section is an override of local rules, not a whole-world total cap.

## RADIUS versus GRID

Counting mode changes what "near" means, and the two modes fail in different ways.

| Mode | What it counts | Consequence |
| --- | --- | --- |
| `RADIUS` | Entities within `radius` blocks of the candidate | Smooths across chunk borders, but every check has a spatial query and clusters can overlap |
| `GRID` | Entities in the same vanilla-aligned 16×16×16 chunk section | Cheap, stable key aligned with storage, but a hard boundary at the section edge |

`RADIUS` defaults to 16 blocks. `GRID` ignores `radius` and uses the section coordinates directly. Both modes evaluate the same per-type and group rules.

Neither mode is universally better. A farm that straddles a section boundary can look acceptable in `GRID` while doubling its real local density; a `RADIUS` check catches that cluster but pays for a spatial query. The right choice depends on farm shape and server hardware.

## Reconciliation has a ceiling

Entity limits fail when enforcement becomes the new lag source. A plugin that scans every loaded entity on every tick to find the one over the limit has moved the problem rather than solved it.

EntityLimiter splits enforcement into two paths. Spawn and removal events are evaluated on demand. A passive reconciliation pass runs every `update-rate` ticks — 20 by default, one second — and processes at most 128 entity validations per tick from a queue.

When a cap is exceeded, `remove-order` selects the victim:

| Value | Selection |
| --- | --- |
| `YOUNG` (default) | Lowest `ticksLived` first |
| `OLD` | Highest `ticksLived` first |
| `OFF` | Current candidate or fallback random |

`kill-living-entities: true` sends living targets through Bukkit damage, so normal death and drop handling applies. Non-living entities are removed directly. `kill-tagged-last: true` defers entities carrying a scoreboard tag until untagged candidates are exhausted, which protects named or plugin-owned entities from being the first casualty.

`protected-entities.yml` adds an age floor. The shipped `dropped_item: 100` and `item: 100` mean items younger than 100 ticks are not removed by the limiter. That prevents a freshly spawned drop from disappearing before a player can see it.

## Tombstones and provenance

Removal creates an echo problem. The plugin removes an entity, the server fires another event, and a naive implementation queries the entity again to find out what it was. EntityLimiter suppresses those echoes with a TTL tombstone map. The default TTL is five seconds, and the prune scan is bounded at 4096 entries.

Item provenance is a separate problem because an item entity does not inherently say whether it came from a block break, a death, or a farm. On 1.12 and newer, provenance is stored in scoreboard tags, which survive chunk unloads and restarts. On 1.8 through 1.11, the plugin falls back to Bukkit entity metadata, which survives only while the item stays loaded.

From 1.14, `BlockDropItemEvent` identifies block drops exactly. On 1.8 through 1.13, drops are matched from `BlockBreakEvent` against nearby item spawns, which can be imprecise when another plugin alters loot. Death drops are matched against the preceding `PlayerDeathEvent` within a short window.

The special `block-drops` and `death-drops` buckets are disabled by default. When enabled, `block-drops` replaces the generic cap for player block drops, while `death-drops` applies a separate local cap instead of letting death drops bypass the generic and hook caps. Both count item entities, not stack sizes.

## Claim hooks are an additional constraint

On a survival network, the relevant boundary is often a claim, not a radius. EntityLimiter ships adapters for SuperiorSkyblock2 and Lands behind `ClaimHookManager`. The adapters are keyed by provider id and are only active when the provider plugin is present.

Hook caps are evaluated after local caps. Both are checked; exceeding either one is enough to reject an addition or select a victim. The shipped hook defaults are a `default` limit of 64 and group limits of 32 for monsters and animals. `hooks.yml` can change those values independently of the local rules.

Exempt worlds, the entity allow-list and the exclusion list apply to both local and hook limits. A hook is not a way to bypass a world exemption, and an excluded entity is not limited by either path.

## Folia without a hard class dependency

Folia support is reflective. `FoliaAPI` probes the server once, caches the scheduler classes and methods it finds, and falls back to the Bukkit scheduler when Folia is absent. No Folia type appears in a loaded signature, so the same jar can load on a non-Folia server. The 1.14-only event classes used by the item path are instantiated reflectively for the same reason, keeping the Java 8 class path clean.

That is an engineering choice, not a certification: the plugin does not fail at class-load time on an older server, but the behavior has not been exercised on every Folia build.

## What this does not prove

The source tree states that a cross-version server matrix still has to be run before claiming verified 1.8 through 1.21 compatibility. `api-version: 1.13` is plugin metadata, not a test result, and Paper is not separately claimed by the project metadata.

There is no `LICENSE` file and no public source repository. The project ships source and tests rather than a prebuilt jar; the 25 test classes are source evidence, not a runtime result, and no benchmark data is published.

Folia support is declared and implemented reflectively; it was not runtime-verified for this article. The defaults are the shipped values for build 2.3.6 and may not match an existing installation's edited files. `limits.yml` wins when both it and `config.yml` contain `item-limits`.

For the operational surface, see the [EntityLimiter configuration](/docs/entitylimiter/configuration.html) and the [EntityLimiter overview](/docs/entitylimiter/overview.html); the wider product list is on [work](/work.html).
