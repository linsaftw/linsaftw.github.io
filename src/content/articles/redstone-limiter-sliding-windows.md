---
title: "Sliding windows for redstone, not a global off switch"
description: "How RedstoneLimiter counts at four spatial scopes, why TPS scaling loosens caps on healthy servers, and why quarantine stays manual."
publishedAt: 2026-10-30
updatedAt: 2026-10-30
tags: ["redstonelimiter", "minecraft", "performance", "folia"]
author: "LinsaFTW / Juan Cruz Linsalata"
canonicalPath: "/posts/redstone-limiter-sliding-windows.html"
draft: false
featured: false
relatedProjects: ["redstonelimiter"]
relatedDocs: ["/docs/redstonelimiter/overview.html", "/docs/redstonelimiter/configuration.html"]
---

Redstone lag is usually not one broken circuit. It is a legal circuit repeated until the update budget is gone: a clock that is fine at one hertz, then forty of them in the same chunk, then a piston feed that touches every neighbor every tick. The server does not know intent. It just runs the updates.

RedstoneLimiter is a passive limiter for that situation. It observes the events the server already produces — redstone transitions, observer physics, dispenses, piston extends and retracts — and blocks an activation when a configured window is exceeded. It does not generate, schedule or rewrite redstone.

## Four scopes, one hierarchy

Every activation is evaluated through one spatial hierarchy:

`Block -> Subchunk -> Chunk -> Region`

| Scope | Geometry | Shipped cap |
| --- | --- | --- |
| Block | Exact world `x/y/z`; per-material map with `DEFAULT` fallback | `DEFAULT 5`; `REDSTONE_WIRE 12`; dispensers and pistons 3 |
| Subchunk | 16×16×16 blocks (`blockX >> 4`, `blockY >> 4`, `blockZ >> 4`) | 96 |
| Chunk | 16×16 block footprint in X/Z (`blockX >> 4`, `blockZ >> 4`) | 1024 |
| Region | 32×32 chunks in X/Z (`chunkX >> 5`), no Y dimension | 96 |

The region is server region geometry, not a Folia scheduler region, and its size is not configurable. An activation is recorded at every scope it reaches. If a scope blocks, evaluation returns immediately and the remaining scopes are not consulted.

Block caps are keyed by material. `DEFAULT` is the only fallback for unspecified materials; the legacy `GLOBAL` key is migration-only and is rewritten to `DEFAULT`. Material aliases are canonicalized before lookup, so legacy and modern names resolve to the same entry.

The block cap matters because not every activation costs the same. A redstone wire transition is cheap; a dispenser or piston is not. The shipped material map reflects that: wire allows 12 activations per window, while dispensers, droppers, pistons and sticky pistons allow 3.

## The window has a memory

Each scope owns an independent period. The defaults are a 5000 ms window, a 2000 ms sustain, and `sliding: true`.

```yaml
chunks:
  period:
    duration-millis: 5000
    sustain-millis: 2000
    sliding: true
  max-activations: 1024
```

With a sliding window, the counter looks back over the duration instead of resetting on a fixed boundary. A fixed period is also available: set `sliding: false` and the counter resets when the duration elapses. Sliding is the better default for redstone because bursts rarely align with a wall-clock boundary.

The first `N` activations are allowed when the cap is `N`; activation `N + 1` is blocked. Over-limit attempts are still counted and extend the sustain deadline to at least `now + sustain-millis`. Sustain is temporary automatic blocking, not quarantine, and it is never persisted. A server restart clears it, which is the correct behavior for a transient overload.

A cap of `0` means unlimited for that scope or material. Setting `enabled: false` keeps telemetry but disables blocking for that scope, which is useful for measuring a new area before enforcing anything. Changing a scope's period settings discards its old counter and sustain deadline.

## TPS scaling goes the other way

The counter-intuitive part of the policy is the direction of TPS scaling. At or below 16.0 TPS, the multiplier is 1.0, so caps stay at their configured base. At or above 19.5 TPS, the multiplier is 2.0, so caps are twice as permissive. Values between are interpolated linearly and clamped. If TPS is unavailable or scaling is disabled, the multiplier is 1.0.

That is deliberate. A server already below the degraded threshold should not get looser limits; it should keep the stricter base caps. A healthy server can afford to be more permissive and avoid false positives on legitimate builds. The multiplier changes the cap, never the period.

Effective caps are computed centrally:

```text
effective = ceil(base × presetMultiplier × tpsMultiplier)
```

The preset multipliers are fixed: `STRICT 1.0`, `BALANCED 1.5`, `LENIENT 2.0`. `STRICT` is the shipped default. The preset and TPS multiplier multiply each other, so `LENIENT` on a healthy server can allow up to four times the base cap. That is a policy decision an operator should make explicitly, not a hidden optimization.

## Quarantine is a decision, not a reaction

Automatic quarantine paths were removed in 3.0.1. Quarantine is now operator-only: a chunk is added to `quarantine.manual-chunks`, or toggled in the chunk view, and it stays quarantined until an operator removes it.

A quarantined chunk blocks the whole chunk with a quarantine cause and overrides whitelist entries. That ordering is intentional. Whitelisting a chunk says "record but do not block"; quarantine says "block this chunk now". The operator's explicit block wins.

Whitelisted chunks still record telemetry, so an operator can see activity without enforcement. `disabled-worlds` goes further and stops counting, blocking, effects and notifications entirely. `monitor: true` makes the plugin never cancel redstone and act only as a notification service; it also suppresses the blocked-activity particle.

The removal of automatic quarantine is a good example of a limiter choosing observability over autonomy. An automatic quarantine can turn one noisy farm into a silent gameplay bug. A manual quarantine is slower, but the operator knows why the chunk is blocked and how to undo it.

## Notifications have their own budget

A limiter that blocks a thousand activations per second and sends a message for each one has replaced a redstone problem with a chat problem. RedstoneLimiter throttles notices at three levels:

| Level | Default |
| --- | --- |
| Global cooldown | 15 seconds |
| Local cooldown | 60 seconds |
| Per-player cooldown | 1000 milliseconds |

Rendered MiniMessage components are cached up to `message_cache_size` entries, default 256. The cache is bounded because notification text includes coordinates; an unbounded cache would grow with every distinct location. Setting the size to 0 disables the cache.

Cross-server notification and teleport over Redis is optional and disabled by default. It is not required for local limiting. The shipped `server_id` is empty, so it must be set before enabling the cross-server path. `/rl visit` checks `notifications.permission` and requires the Redis service; local limiting continues to work without either.

## What this does not prove

No performance measurement exists in the repository, so this article makes no lag-reduction or throughput claim. The plugin is a limiter with a monitor mode, not a redstone optimizer.

Folia support is a declared descriptor flag plus reflective scheduler and TPS handling. No Folia run is recorded for this build, and `api-version: 1.13` with a 1.8.8 compile target does not prove runtime behavior on any specific server version.

The changelog's latest entry is 3.0.2, dated 2026-10-10, while the POM and latest commit identify 3.0.3. There are no 3.0.3 release notes to quote. The project README is unedited Bukkit boilerplate and is not a source for behavior. No license file exists and the source repository is private.

One operational gap is worth flagging: `/rl tp` performs no explicit permission check in its handler, and the root command declares no permission in `plugin.yml`. Restrict it with a server-side command permission if that matters on your network. `/rl visit` does check `notifications.permission`.

For the exact keys and routes, see the [RedstoneLimiter configuration](/docs/redstonelimiter/configuration.html) and the [product overview](/work.html).
