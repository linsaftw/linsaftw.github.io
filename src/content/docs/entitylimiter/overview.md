---
title: EntityLimiter overview
description: EntityLimiter 2.3.6 enforces per-type and group entity caps in RADIUS or GRID mode, with optional claim hooks and configurable removal order.
plugin: entitylimiter
pluginName: EntityLimiter
topic: overview
order: 1
updatedAt: 2026-10-30
version: "2.3.6"
platforms:
  - Bukkit
  - Spigot
  - Folia (declared)
officialUrl: https://builtbybit.com/resources/entitylimiter-optimize-performance.67164/
sourceStatus: private
draft: false
---

EntityLimiter is a Bukkit-family plugin that caps how many entities may exist in a local area. It is an entity limiter, not a spawn controller: it observes entities that already exist, compares them against configured caps, and removes over-limit entities or blocks further additions depending on the path that created them.

The current build version is 2.3.6. This page describes behaviour read from the 2.3.6 source and shipped configuration; the source repository is private and no license file is present.

## What it limits

Every entity is evaluated against two independent cap families:

- a per-type cap, taken from the exact entity type or `limits.default` when no type-specific key exists;
- every matching group cap, such as `monsters`, `animals`, `projectiles`, `boats` or `minecarts`.

`default` is a per-type fallback, not a shared bucket. A chicken with no specific rule is limited by `default`, and it still consumes a place in the `animals` total. Exceeding either family is enough to trigger enforcement.

Counting happens in one of two local modes:

| Mode | Counting rule |
| --- | --- |
| `RADIUS` | Entities within `radius` blocks of the candidate |
| `GRID` | Entities in the same vanilla-aligned 16×16×16 chunk section; `radius` is ignored |

`limits.yml` also supports per-world overrides. Entries under `world-limits` only take effect for worlds whose `enabled` flag is true; keys not listed there inherit the base rules. This is an override of the local rules for that world, not a whole-world total cap.

Two claim integrations are built in. When SuperiorSkyblock2 or Lands is installed, claim-scoped caps from `hooks.yml` are evaluated in addition to the local rules; either set can be exceeded. The adapters are keyed by provider id and are only active when the provider plugin is present.

## How enforcement runs

Spawn and removal checks are evaluated on demand. A passive reconciliation pass runs every `update-rate` ticks (20 by default, one second) and processes at most 128 entity validations per tick, so a large backlog is drained over several ticks instead of in one spike.

When a cap is exceeded, the plugin selects a victim using `remove-order`:

| Value | Selection |
| --- | --- |
| `YOUNG` (default) | Lowest `ticksLived` first |
| `OLD` | Highest `ticksLived` first |
| `OFF` | Current candidate / fallback random |

`kill-living-entities: true` sends living targets through Bukkit damage so normal death and drop handling applies; non-living entities are removed directly. `kill-tagged-last: true` defers entities carrying a scoreboard tag until untagged candidates are exhausted. Removals are recorded for `/el history`.

`protected-entities.yml` adds an age floor. `dropped_item: 100` and `item: 100` mean items younger than 100 ticks are not removed by the limiter, which prevents freshly spawned drops from disappearing before a player can see them.

## Item drops and provenance

The generic `item` and `dropped_item` caps are always available. The special `block-drops` and `death-drops` caps are separate buckets and are disabled by default. Enabling `block-drops` replaces the generic cap for player block drops; enabling `death-drops` applies a separate local cap instead of letting death drops bypass the generic and hook caps. Both count item entities, not stack sizes.

Provenance is stored in scoreboard tags on 1.12 and newer, where it survives chunk unloads and restarts. On 1.8–1.11 the plugin falls back to Bukkit entity metadata, which survives only while the item stays loaded. From 1.14, `BlockDropItemEvent` identifies block drops exactly; on 1.8–1.13, drops are matched from `BlockBreakEvent` against nearby item spawns, which can be imprecise when other plugins alter loot. Death drops are matched against the preceding `PlayerDeathEvent` within a short window. Pre-upgrade items with no tag are treated as ordinary items.

## Folia and legacy class paths

Folia support is reflective. `FoliaAPI` probes the server once, caches the scheduler classes and methods it finds, and falls back to the Bukkit scheduler when Folia is absent. No Folia type appears in a loaded signature, so the same jar can load on a non-Folia server. The 1.14-only event classes used by the item path are instantiated reflectively for the same reason, keeping the Java 8 class path clean.

## Requirements

| Requirement | Verified detail |
| --- | --- |
| Server | Bukkit or Spigot; `folia-supported: true` is declared in `plugin.yml` |
| API metadata | `api-version: 1.13` |
| Compiled against | `spigot-api 1.21.5-R0.1-SNAPSHOT` |
| Java | Java 8 source/target bytecode |
| Optional integrations | SuperiorSkyblock2, Lands (soft dependencies) |
| Command | `/entitylimiter`, alias `/el`, permission `entitylimiter.admin` (default `op`) |
| Distribution | Product page on BuiltByBit; no public source repository |

## What is not claimed

The README states that a cross-version server matrix still has to be run before claiming verified 1.8–1.21 compatibility, so this page does not claim it. `api-version: 1.13` is plugin metadata, not a test result. Folia support is declared and implemented reflectively; it has not been runtime-verified here. Paper is not separately claimed by the project metadata.

There is no `LICENSE` file and no `<licenses>` block in the POM, and the GitHub repository returns 404. Do not describe the plugin as open source or link a source repository. The README also notes that the project ships source and tests rather than a prebuilt JAR, so installation is a build step, not a download from the repository. No throughput or memory figures are published here because the repository contains no benchmark data.

> **Verified against** the private EntityLimiter 2.3.6 tree on 30 October 2026: `pom.xml`, `plugin.yml`, `config.yml`, `limits.yml`, `protected-entities.yml`, `hooks.yml`, the command class and the README compatibility note. No build or runtime test was executed.

For the shipped keys and admin commands, see [EntityLimiter configuration](/docs/entitylimiter/configuration.html).
