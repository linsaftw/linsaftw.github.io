---
title: EntityLimiter configuration
description: EntityLimiter 2.3.6 shipped defaults for config.yml, limits.yml, protected-entities.yml and hooks.yml, plus the /el admin commands.
plugin: entitylimiter
pluginName: EntityLimiter
topic: configuration
order: 2
updatedAt: 2026-10-30
version: "2.3.6"
platforms:
  - Bukkit
  - Spigot
  - Folia (declared)
officialUrl: https://builtbybit.com/resources/entitylimiter-optimize-performance.67164/
sourceStatus: shipped-config
draft: false
---

EntityLimiter splits its settings across four files. The values below are the defaults shipped with build 2.3.6; existing installations may have older files, and `limits.yml` takes precedence when both it and `config.yml` define `item-limits`.

| File | Controls |
| --- | --- |
| `config.yml` | update cadence, removal policy, action bar, world and entity filters |
| `limits.yml` | counting mode, per-type and group caps, item buckets, per-world overrides |
| `protected-entities.yml` | minimum age, in ticks, before an entity may be removed |
| `hooks.yml` | claim-scoped caps for SuperiorSkyblock2 and Lands |

## Core settings

| Key | Default | Effect |
| --- | --- | --- |
| `update-rate` | `20` | Passive reconciliation cadence in ticks |
| `debug` | `false` | Logs removal details to console |
| `remove-order` | `YOUNG` | Victim selection: `OFF`, `YOUNG` or `OLD` |
| `kill-living-entities` | `true` | Living targets die through Bukkit damage |
| `kill-tagged-last` | `true` | Prefer untagged entities when removing |
| `prevent-dispenser-drop` | `true` | Dispensers cannot drop tagged entities |
| `actionbar.enabled` | `true` | Master switch for action bar notices |
| `actionbar.groups.monsters` | `true` | Per-group action bar toggle |
| `actionbar.groups.animals` | `true` | Per-group action bar toggle |
| `actionbar.groups.default` | `true` | Fallback group toggle |
| `exempt-worlds` | `[lobby, spawn]` | Worlds where the plugin does nothing |
| `entity-whitelist` | `[]` | If non-empty, only these types are limited |
| `excluded-entities` | `[]` | Types never limited; applies to local and hook limits |

The action bar can also be disabled per world through `actionbar.worlds.<world>.enabled`; groups not named under that world inherit `true`. Exempt worlds, the entity allow-list and the exclusion list are applied before any cap is evaluated.

## Counting mode

| Key | Default | Notes |
| --- | --- | --- |
| `mode` | `RADIUS` | `RADIUS` or `GRID`; invalid values fall back to `RADIUS` with a warning |
| `radius` | `16` | Used only in `RADIUS` mode |

`GRID` counts entities in the same vanilla-aligned 16×16×16 chunk section and ignores `radius`. Both modes evaluate the same per-type and group rules.

## Default caps

`limits.default` is the per-type fallback. It is not a shared cap: each type without an explicit entry gets its own `default` allowance, and group totals are counted separately.

| Key | Default | Kind |
| --- | --- | --- |
| `limits.zombie` | `16` | Per type |
| `limits.skeleton` | `16` | Per type |
| `limits.cow` | `16` | Per type |
| `limits.sheep` | `16` | Per type |
| `limits.horse` | `40` | Per type |
| `limits.axolotl` | `10` | Per type |
| `limits.bee` | `10` | Per type |
| `limits.armor_stand` | `16` | Per type |
| `limits.item_frame` | `256` | Per type |
| `limits.glow_item_frame` | `128` | Per type |
| `limits.painting` | `128` | Per type |
| `limits.end_crystal` | `2` | Per type |
| `limits.item` | `64` | Generic item bucket |
| `limits.dropped_item` | `64` | Generic dropped-item bucket |
| `limits.monsters` | `32` | Group total |
| `limits.animals` | `32` | Group total |
| `limits.projectiles` | `16` | Group total |
| `limits.boats` | `5` | Group total |
| `limits.minecarts` | `4` | Group total |
| `limits.default` | `32` | Per-type fallback |

`alternate-limit-tagged` is empty by default. When populated, it supplies alternate per-type caps for tagged entities; keys must be concrete entity types, and tagged entities still count toward group totals.

Per-world overrides live under `world-limits.<world>`. Each world has its own `enabled` flag, false by default for `world`, `world_nether` and `world_the_end`, and its own `limits` map (`PIG: 1`, `HORSE: 1` in the shipped example). Only enabled worlds override matching keys; unspecified keys inherit the base rules, and the section is not a whole-world total cap.

## Item limits and protection

| Key | Default | Effect |
| --- | --- | --- |
| `item-limits.enabled` | `true` | Master switch for the two special buckets |
| `item-limits.block-drops.enabled` | `false` | Use a separate cap for player block drops |
| `item-limits.block-drops.amount` | `16` | Cap when block drops are enabled |
| `item-limits.death-drops.enabled` | `false` | Use a separate cap for player death drops |
| `item-limits.death-drops.amount` | `16` | Cap when death drops are enabled |
| `protected-entities.dropped_item` | `100` | Minimum age in ticks before removal |
| `protected-entities.item` | `100` | Minimum age in ticks before removal |

When a special bucket is disabled, the matching items use the generic cap or ordinary vanilla behaviour: block drops stay under the generic item cap, and death drops bypass generic and hook item caps. When enabled, `block-drops` replaces the generic cap for player block drops, while `death-drops` applies a separate local cap; both still respect the local radius or grid scope, world exemptions and age protection. Limits count item entities, not stack sizes.

Claim hooks have their own caps in `hooks.yml`:

| Key | Default |
| --- | --- |
| `hooks.superiorskyblock2.enabled` | `true` |
| `hooks.superiorskyblock2.limits.default.limit` | `64` |
| `hooks.superiorskyblock2.limits.monsters.limit` | `32` |
| `hooks.superiorskyblock2.limits.animals.limit` | `32` |
| `hooks.lands.enabled` | `true` |
| `hooks.lands.limits.default.limit` | `64` |
| `hooks.lands.limits.monsters.limit` | `32` |
| `hooks.lands.limits.animals.limit` | `32` |

Hook caps are evaluated after local caps. Both are checked; exceeding either one is enough to reject an addition or select a victim. A hook is only active when its provider plugin is installed.

## Commands

Every route requires `entitylimiter.admin`, which defaults to `op`. The root command is `/entitylimiter`, alias `/el`.

| Command | Behaviour |
| --- | --- |
| `/el` | Version, tracked entity count and total removed |
| `/el reload` | Reloads plugin configuration and messages |
| `/el limits` | Dumps the configured limits and local-limit worlds |
| `/el history [page]` | Removal history; an invalid page number silently falls back to page 1 |
| `/el stats` | Tracked entities and total removed |
| `/el help` | Help text; any unknown subcommand also prints help |

## Operational notes

Save changes before reloading. `/el reload` rebuilds configuration and messages, but the removal policy and cap maps are read from those files, so a partial edit can produce a valid file with unintended values.

`limits.yml` wins when both files contain `item-limits`; the README describes this as a migration aid for installations that have not moved the section yet. `exempt-worlds` and the entity exclusions apply to both local and hook limits. Folia scheduling is reflective and does not change the configuration surface.

> **Verified against** the private EntityLimiter 2.3.6 tree on 30 October 2026: `config.yml`, `limits.yml`, `protected-entities.yml`, `hooks.yml`, `plugin.yml` and the command class. Defaults are the shipped resource values; no server was started.
