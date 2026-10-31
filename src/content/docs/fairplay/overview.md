---
title: FairPlay overview
description: What FairPlay 4.1.0 detects, how its PacketEvents combat pipeline decides, and which platform claims are declared rather than tested.
plugin: fairplay
pluginName: FairPlay
topic: overview
order: 1
updatedAt: 2026-10-30
version: "4.1.0"
platforms:
  - Bukkit
  - Spigot
  - Paper
  - Folia (declared)
officialUrl: https://arkflame.com/plugins/fairplay/
sourceStatus: private
draft: false
---

FairPlay is a Bukkit-family anticheat focused on combat compensation. It reads packets through
PacketEvents, evaluates combat, aim, interaction and timing checks, and can either alert,
cancel/modify the action, or apply a configured mitigation. It is not a movement-prediction
anticheat and does not claim to replace one.

The source was inspected for this documentation, but the license is **Personal Use Only**, not an open-source
license. Commercial use, redistribution and publishing modified or unmodified copies require
prior written permission.

| Field | Verified value |
| --- | --- |
| Version | `4.1.0` |
| License | Personal Use Only; non-commercial, no redistribution |
| Main class | `com.arkflame.fairplay.FairPlayPlugin` |
| Plugin metadata | `api-version: 1.13`, `folia-supported: true` |
| Bytecode | Java 8 source/target |
| Build API | Spigot `1.21.11-R0.1-SNAPSHOT` |
| Required dependency | PacketEvents, external and not shaded |
| Optional hooks | GrimAC, Vulcan and other soft dependencies |

## What it evaluates

The plugin ships check modules for aimbot, autoclicker, AutoTotem, fastbreak, hitbox, killaura,
scaffold and timer families, plus protocol and inventory checks. Checks are registered from
packages at startup and can be listed or toggled with `/fp checks` and `/fp toggle`.

The README calls the current production posture combat-only and points at `ToggleCommand` and
`FairCheckManager` for which checks are enabled in a given build. Treat the shipped check tree as
available configuration, not as a promise that every module is active on your server.

FairPlay does not ship fly, speed, vertical-prediction, movement-simulation, velocity-prediction
or replay-baseline checks. Movement packets, locations and rotation history are kept as shared
telemetry for combat, aim, hitbox, scaffold and timing checks. That boundary is deliberate: a
combat decision should be explainable from the packets that produced it.

## How a packet reaches a decision

1. **Receive once.** The PacketEvents listener deduplicates events by event identity before
   dispatch, so two listeners cannot apply the same compensation twice.
2. **Dispatch by packet type.** Dedicated handlers process attacks, swings, block placement,
   inventory clicks and the rest, each with a stage label.
3. **Evaluate checks.** Check modules return results. A hitbox attack decision aggregates
   independent results and cancels when any result is a failure; `PASS` and `UNKNOWN` are not
   cancellation reasons.
4. **Resolve latency.** The transaction service selects `AUTO`, `GRIM`, `NATIVE` or `DISABLED` at
   startup. `AUTO` uses Grim when its API is available and native markers otherwise. If Grim is
   detected but its API fails, the service reports `GRIM_UNAVAILABLE` and keeps native markers
   disabled to avoid a packet-owner collision; Polar or Vulcan ownership selects a conflict mode
   instead of stacking transaction sources.
5. **Apply policy.** Detection and mitigation are separate. The punishment and mitigation
   configuration decides whether a failure produces an alert, a cancellation, a kick or a ban.

Reach compensation is a specific path: after a reach-increase punishment, an eligible main-hand
AIR swing can apply melee damage against a nearby target within the configured compensated-reach
band. It is not a general reach extension applied to every attack.

## Requirements

| Requirement | Verified detail |
| --- | --- |
| Server | Bukkit, Spigot or Paper; `folia-supported: true` is declared |
| API metadata | `api-version: 1.13` |
| Java | Java 8 bytecode; use the JVM your server version requires |
| Packet layer | PacketEvents required; FairPlay disables itself when it is absent or not external |
| PacketEvents build | Compiled against `2.14.0`; no minimum version is declared |
| Optional hooks | GrimAC, Vulcan, NoCheatPlus, PolarLoader, Intave, Matrix, Spartan |
| Storage | `YAML` by default under `storage/players` |

PacketEvents is a hard `depend` in `plugin.yml` and is also checked at runtime. FairPlay verifies
that the loaded PacketEvents API is external and disables itself rather than shading or replacing
it.

## What is not claimed

- The README statement “Minecraft 1.8–1.21” is a claim, not a tested compatibility matrix. The
  build targets Spigot 1.21.11 only.
- The Folia flag is metadata. No Folia runtime test is documented in the audited source.
- No minimum PacketEvents version is declared; the build compiles against 2.14.0.
- “All checks active” is not a safe assumption; toggles and per-check YAML decide.
- The license does not permit commercial deployment or redistribution without permission.

For deployment see [install FairPlay](/docs/fairplay/installation.html). For administration see
[commands and permissions](/docs/fairplay/commands-permissions.html). The
[FairPlay case study](/work/fairplay.html) covers the packet pipeline and cancellation authority.

> Verified against FairPlay `aad8a638` (version 4.1.0, 29 October 2026) on 30 October 2026.
> Metadata, defaults and code paths come from source; no live server or Folia run was performed.
