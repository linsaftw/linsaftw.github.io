---
title: RedstoneLimiter overview
description: RedstoneLimiter 3.0.3 limits redstone activity across block, subchunk, chunk and region scopes with sliding windows and TPS-scaled caps.
plugin: redstonelimiter
pluginName: RedstoneLimiter
topic: overview
order: 1
updatedAt: 2026-10-30
version: "3.0.3"
platforms:
  - Bukkit
  - Spigot
  - Folia (declared)
officialUrl: https://github.com/ArkFlame/redstonelimiter-docs
sourceStatus: private
draft: false
---

RedstoneLimiter is a passive redstone and circuit limiter for Bukkit-family servers. It counts observable circuit activity at four spatial scopes and blocks an activation when the configured window is exceeded. It does not generate, schedule or rewrite redstone; it observes events that the server already produces.

The build version is 3.0.3. The changelog's latest entry is 3.0.2, dated 2026-10-10, so 3.0.3 is the current POM and commit version rather than a dated release. The source repository is private and contains no license file; the plugin's public documentation repository is listed in the page metadata.

## What it counts

The circuit engine observes four signal types:

- redstone transitions through `BlockRedstoneEvent`, counted when `oldCurrent != newCurrent`; a blocked transition restores the old current;
- observers through `BlockPhysicsEvent`, recorded as uncancellable telemetry rather than cancelled physics;
- dispensers and droppers through `BlockDispenseEvent`;
- pistons through `BlockPistonExtendEvent` and `BlockPistonRetractEvent`.

Piston push length is checked independently through `max_piston_push`, default `12`. Observer physics are deduplicated for `anti-lag.advanced.observer-dedup-millis`, default `50` milliseconds, so repeated physics calls for the same observation do not inflate the count.

## Spatial scopes

Every activation is evaluated through one hierarchy:

`Block -> Subchunk -> Chunk -> Region`

| Scope | Geometry | Default max activations |
| --- | --- | --- |
| Block | Exact world `x/y/z`; per-material caps with `DEFAULT` fallback | Material map, `DEFAULT 5` |
| Subchunk | 16×16×16 blocks (`blockX >> 4`, `blockY >> 4`, `blockZ >> 4`) | `96` |
| Chunk | 16×16 block footprint in X/Z (`blockX >> 4`, `blockZ >> 4`) | `1024` |
| Region | 32×32 chunks in X/Z, no Y dimension (`chunkX >> 5`) | `96` |

The region is server region geometry, not a Folia scheduler region, and its size is not configurable. An activation is recorded at every scope it reaches. If a scope blocks, evaluation returns immediately and the remaining scopes are not consulted.

Block caps are keyed by material name. `DEFAULT` is the only fallback for unspecified materials; the legacy `GLOBAL` key is migration-only and is rewritten to `DEFAULT`. Material aliases are canonicalized before lookup, so legacy and modern names resolve to the same entry.

## Windows, sustain and blocking

Each scope owns an independent activity period:

| Setting | Default | Meaning |
| --- | --- | --- |
| `enabled` | `true` | When false, telemetry is still recorded but the scope cannot block |
| `period.duration-millis` | `5000` | How far back activity is counted |
| `period.sustain-millis` | `2000` | Temporary block after the threshold is crossed |
| `period.sliding` | `true` | Rolling window; false uses fixed periods that reset |
| `max-activations` | Scope-specific | Allowed activations before the next one is blocked |

The first `N` activations are allowed when the cap is `N`; activation `N+1` is blocked. Over-limit attempts are still counted and extend the sustain deadline to at least `now + sustain-millis`. Sustain is temporary automatic blocking, not quarantine, and is never persisted. A cap of `0` means unlimited for that scope or material.

Effective caps are computed centrally as `ceil(base × preset multiplier × TPS multiplier)`; multipliers never change the period, only the cap. When a scope's period settings change, its old counter and sustain deadline are discarded.

## Presets and TPS scaling

`anti-lag.preset` defaults to `STRICT`. The multipliers are fixed: `STRICT 1.0`, `BALANCED 1.5`, `LENIENT 2.0`.

TPS scaling is enabled by default with `degraded-tps: 16.0`, `healthy-tps: 19.5`, `min-multiplier: 1.0` and `max-multiplier: 2.0`. At or below 16.0 TPS the multiplier is 1.0, so caps stay at their base values under load. At or above 19.5 TPS it is 2.0, so caps are twice as permissive on a healthy server. Values between are interpolated linearly and clamped. If TPS is unavailable or scaling is disabled, the multiplier is 1.0.

## Quarantine, whitelist and monitor

Quarantine is manual only. Automatic quarantine paths were removed in 3.0.1; `quarantine.manual-chunks` ships empty. A quarantined chunk blocks the whole chunk with a quarantine cause and overrides whitelist entries.

Whitelisted chunks (`whitelist.chunks`) still record telemetry but never block. `disabled-worlds` stops counting, blocking, effects and notifications entirely for the named worlds. `monitor: true` makes the plugin never cancel redstone and act only as a notification service.

## Notifications

Blocked-activity notices are throttled at three levels: a global cooldown of 15 seconds, a local cooldown of 60 seconds, and a per-player cooldown of 1000 milliseconds. Rendered MiniMessage components are cached up to `message_cache_size` entries, default `256`; `0` disables the cache.

Cross-server notification and teleport over Redis is optional and disabled by default. It is not required for local limiting.

## Requirements

| Requirement | Verified detail |
| --- | --- |
| Server | Bukkit or Spigot; `folia-supported: true` is declared in `plugin.yml` |
| API metadata | `api-version: 1.13`, so the descriptor targets 1.13+ loaders |
| Compiled against | `spigot-api 1.8.8-R0.1-SNAPSHOT` |
| Optional dependency | Jedis 7.1.0 for Redis cross-server features |
| Command | `/redstonelimiter`, aliases `/redstone` and `/rl` |
| Distribution | Private source; public documentation repository |

## What is not claimed

This page does not cite the project README: the file is unedited Bukkit boilerplate and its feature list is placeholder text. The changelog stops at 3.0.2, so there are no 3.0.3 release notes to quote. No license file exists and the source repository returns 404; the plugin is not open source.

Folia support is a declared descriptor flag plus reflective scheduler and TPS handling; no Folia run is recorded. `api-version: 1.13` and the 1.8.8 compile target do not prove runtime behaviour on any specific server version. No performance measurement exists in the repository, so no lag-reduction or throughput figure is published here.

> **Verified against** the private RedstoneLimiter 3.0.3 tree on 30 October 2026: `pom.xml`, `plugin.yml`, `config.yml`, `CHANGELOG.md`, `docs/tutorial.md`, the command class and the engine policy classes. No build or runtime test was executed.

For the shipped keys and routes, see [RedstoneLimiter configuration](/docs/redstonelimiter/configuration.html).
