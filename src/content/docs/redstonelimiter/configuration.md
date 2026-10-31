---
title: RedstoneLimiter configuration
description: RedstoneLimiter config-version 7 defaults for scope caps, presets, TPS scaling, quarantine, notifications, Redis and the /rl routes.
plugin: redstonelimiter
pluginName: RedstoneLimiter
topic: configuration
order: 2
updatedAt: 2026-10-30
version: "3.0.3"
platforms:
  - Bukkit
  - Spigot
  - Folia (declared)
officialUrl: https://github.com/ArkFlame/redstonelimiter-docs
sourceStatus: shipped-config
draft: false
---

RedstoneLimiter uses one `config.yml` with `config-version: 7`. Older files are migrated on load and the migrated version is persisted; an existing version 7 file is not rewritten. The defaults below are the values shipped with build 3.0.3.

## Global settings

| Key | Default | Effect |
| --- | --- | --- |
| `config-version` | `7` | Schema version; migration runs on load |
| `monitor` | `false` | `true` never cancels redstone and only notifies |
| `anti-lag.preset` | `STRICT` | Cap multiplier preset |
| `anti-lag.maintenance-interval-ticks` | `100` | Background maintenance cadence |
| `anti-lag.advanced.observer-dedup-millis` | `50` | Observer physics dedup window |
| `anti-lag.advanced.idle-state-ttl-millis` | `30000` | Idle state expiry |
| `gui.refresh-ticks` | `40` | Control panel refresh interval |
| `whitelist.chunks` | `[]` | Chunks that record but never block |
| `quarantine.manual-chunks` | `[]` | Operator-quarantined chunks |
| `disabled-worlds` | `[]` | Worlds with no counting, blocking, effects or notices |
| `prevent_comparator_trapdoor_dupe` | `true` | Blocks the comparator-above-trapdoor toggle |
| `max_piston_push` | `12` | Maximum piston push length |
| `block_effect` | `SMOKE` | Particle shown on a blocked activation |
| `block_effect_data` | `4` | Effect data value |

World names are case-insensitive and must match Bukkit world names. `monitor: true` also suppresses the blocked-activity particle.

## Scope settings

Each scope has an independent period. `period.sliding: true` uses a rolling window; `false` uses fixed periods that reset when the duration elapses. `sustain-millis` extends a temporary block after the cap is crossed; it is not quarantine and is never persisted.

| Key | Default |
| --- | --- |
| `blocks.enabled` | `true` |
| `blocks.period.duration-millis` | `5000` |
| `blocks.period.sustain-millis` | `2000` |
| `blocks.period.sliding` | `true` |
| `subchunks.enabled` | `true` |
| `subchunks.period.duration-millis` | `5000` |
| `subchunks.period.sustain-millis` | `2000` |
| `subchunks.period.sliding` | `true` |
| `subchunks.max-activations` | `96` |
| `chunks.enabled` | `true` |
| `chunks.period.duration-millis` | `5000` |
| `chunks.period.sustain-millis` | `2000` |
| `chunks.period.sliding` | `true` |
| `chunks.max-activations` | `1024` |
| `regions.enabled` | `true` |
| `regions.period.duration-millis` | `5000` |
| `regions.period.sustain-millis` | `2000` |
| `regions.period.sliding` | `true` |
| `regions.max-activations` | `96` |

A cap of `0` means unlimited for that scope and is never threshold-blocked. Setting `enabled: false` keeps telemetry but disables blocking for that scope.

## Per-material block caps

`blocks.max-activations` is a material map. `DEFAULT` is the only fallback; keys must resolve to a Bukkit material after alias canonicalization.

| Material key | Max activations |
| --- | --- |
| `DEFAULT` | `5` |
| `REDSTONE_WIRE` | `12` |
| `REDSTONE_TORCH` | `8` |
| `REPEATER` | `8` |
| `COMPARATOR` | `8` |
| `OBSERVER` | `8` |
| `DISPENSER` | `3` |
| `DROPPER` | `3` |
| `PISTON` | `3` |
| `STICKY_PISTON` | `3` |
| `LEVER` | `5` |
| `BUTTON` | `6` |
| `PRESSURE_PLATE` | `8` |
| `TRIPWIRE_HOOK` | `8` |
| `DAYLIGHT_DETECTOR` | `6` |
| `DETECTOR_RAIL` | `8` |
| `POWERED_RAIL` | `8` |
| `ACTIVATOR_RAIL` | `8` |
| `TRAPPED_CHEST` | `6` |
| `TARGET` | `8` |
| `REDSTONE_LAMP` | `8` |
| `HOPPER` | `6` |
| `NOTE_BLOCK` | `8` |
| `SCULK_SENSOR` | `10` |
| `CALIBRATED_SCULK_SENSOR` | `10` |
| `LIGHTNING_ROD` | `5` |
| `COPPER_BULB` | `8` |
| `LECTERN` | `5` |

## Presets and TPS scaling

Preset multipliers are fixed: `STRICT 1.0`, `BALANCED 1.5`, `LENIENT 2.0`. They multiply the configured cap, not the period.

| Key | Default | Effect |
| --- | --- | --- |
| `anti-lag.tps-scaling.enabled` | `true` | Enables the TPS multiplier |
| `anti-lag.tps-scaling.degraded-tps` | `16.0` | TPS at or below which the minimum applies |
| `anti-lag.tps-scaling.healthy-tps` | `19.5` | TPS at or above which the maximum applies |
| `anti-lag.tps-scaling.min-multiplier` | `1.0` | Multiplier at degraded TPS |
| `anti-lag.tps-scaling.max-multiplier` | `2.0` | Multiplier at healthy TPS |

At or below 16.0 TPS the multiplier is `1.0`, so caps stay at base values. At or above 19.5 it is `2.0`, so caps are twice as permissive. Values between are interpolated linearly and clamped; unavailable TPS or disabled scaling yields `1.0`.

## Notifications

| Key | Default |
| --- | --- |
| `notifications.enabled` | `true` |
| `notifications.permission` | `redstonelimiter.notify` |
| `notifications.global_cooldown_seconds` | `15` |
| `notifications.local_cooldown_seconds` | `60` |
| `notifications.per_player_cooldown_millis` | `1000` |
| `notifications.message_cache_size` | `256` |
| `notifications.cross_server.enabled` | `false` |
| `notifications.cross_server.server_id` | `""` |
| `notifications.cross_server.redis.host` | `127.0.0.1` |
| `notifications.cross_server.redis.port` | `6379` |
| `notifications.cross_server.redis.password` | `""` |
| `notifications.cross_server.redis.database` | `0` |
| `notifications.cross_server.redis.ssl` | `false` |
| `notifications.cross_server.redis.notification_channel` | `redstonelimiter:blocked` |
| `notifications.cross_server.redis.teleport_key_prefix` | `redstonelimiter:teleport:` |
| `notifications.cross_server.redis.teleport_ttl_seconds` | `45` |

The message cache is bounded because notification text includes coordinates. Set `message_cache_size` to `0` to disable rendering caches. Redis is only needed for cross-server notifications and `/rl visit`; local limiting works without it. The shipped `server_id` is empty, so set it before enabling the cross-server path.

## Commands and permissions

The root command is `/redstonelimiter`, aliases `/redstone` and `/rl`.

| Command | Permission | Behaviour |
| --- | --- | --- |
| `/rl` | `redstonelimiter.stats` | Root help plus per-scope totals |
| `/rl block` | `redstonelimiter.stats` | Top block danger zones and blocker stats |
| `/rl subchunk` | `redstonelimiter.stats` | Subchunk danger zones and stats |
| `/rl chunk` | `redstonelimiter.stats` | Chunk danger zones and stats |
| `/rl region` | `redstonelimiter.stats` | Region danger zones and stats |
| `/rl chunk <world> <x> <z>` | `redstonelimiter.stats` | Opens the block panel for that chunk; player only |
| `/rl menu` or `/rl gui` | `redstonelimiter.admin` | Control panel; player only |
| `/rl notifications` | `notifications.permission` | Toggles the sender's notices; player only |
| `/rl reload` | `redstonelimiter.reload` | Reloads configuration |
| `/rl tp <world> <x> <y> <z>` | none | Teleports the sender; player only |
| `/rl visit <server> <world> <x> <y> <z>` | `notifications.permission` | Cross-server teleport; needs Redis enabled |

| Permission | Default | Use |
| --- | --- | --- |
| `redstonelimiter.admin` | `op` | Control panel |
| `redstonelimiter.stats` | `op` | Root help and scope reports |
| `redstonelimiter.reload` | `op` | `/rl reload` |
| `redstonelimiter.notify` | `op` | Receive notices and use `/rl notifications` |

## Operational notes

Quarantine is operator-only. Add chunks to `quarantine.manual-chunks` or toggle them in the chunk view with shift-right; quarantined chunks override whitelist entries and block the whole chunk. Automatic quarantine was removed in 3.0.1, so there is no config key that quarantines on a threshold.

Whitelisted chunks still record telemetry but do not block. Disabled worlds bypass counting entirely. The `prevent_comparator_trapdoor_dupe` switch blocks right-click toggling of a comparator directly above a trapdoor, which closes the interaction used by minecart duplication setups.

`/rl tp` performs no explicit permission check in its handler and the root command declares no permission in `plugin.yml`; restrict it with a server-side command permission if that matters on your network. `/rl visit` does check `notifications.permission` and requires the Redis service.

> **Verified against** the private RedstoneLimiter 3.0.3 tree on 30 October 2026: `config.yml`, `plugin.yml`, `CHANGELOG.md`, `docs/tutorial.md`, `TuningPreset`, `RuntimeSettings`, `TpsScalingPolicy` and the command class. Defaults are shipped values; no server was started.
