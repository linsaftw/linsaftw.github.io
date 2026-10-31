---
title: "FairPlay: compensation only after the checks agree"
description: "How FairPlay deduplicates PacketEvents input, aggregates combat results, resolves transaction providers, and keeps compensation inside a combat-only scope."
publishedAt: 2026-10-30
updatedAt: 2026-10-30
tags: ["fairplay", "anticheat", "packetevents", "combat"]
author: "LinsaFTW / Juan Cruz Linsalata"
canonicalPath: "/posts/fairplay-combat-compensation-pipeline.html"
draft: false
featured: false
relatedProjects: ["fairplay"]
relatedDocs: ["/docs/fairplay/overview.html"]
---

A combat anticheat can be right about a hit and still apply the wrong compensation twice. FairPlay's pipeline is organized around that failure mode: one packet event, one decision, and one owner for the latency markers that make the decision meaningful.

## Receive once, then dispatch by type

The PacketEvents listener deduplicates receive events by event identity before processing. It then dispatches by packet type to dedicated handlers with stage labels.

Without that first step, two registrations or two paths can apply the same compensation twice: damage cancelled twice, a setback applied twice, an alert counted twice. Deduplication is not a performance optimization here. It is a correctness boundary.

The boundary is limited to duplicate delivery of the same event identity. Two distinct packets that describe similar actions are still two events, and the checks have to decide whether they represent one hit or two. Deduplication does not remove that modeling problem.

## PASS and UNKNOWN are not FAIL

For the hitbox attack decision, `HitboxAttackDecision.fromResults` collects the results where `isFail()` is true and returns `pass("all_pass")` when none fail. Project documentation is explicit that `PASS` and `UNKNOWN` do not cancel.

That rule is the right default for an anticheat. A check that cannot decide should not silently become a punishment. `UNKNOWN` usually means the evidence is incomplete: a missing transaction, an unloaded chunk, a player state the check does not model. Treating that as `FAIL` would turn uncertainty into false positives.

It also puts a burden on the check set. `PASS` and `UNKNOWN` are safe only if the checks that can return `FAIL` are complete for the decision being made. A pipeline that cancels on any failure is not the same as a pipeline that detects every failure.

Cancellation authority is separate from detection. `HitboxAttackDecision` cancels when a result fails, but the wider plugin separates detection from mitigation. Configuration decides whether a failure becomes an alert, a cancellation, a kick, or a ban. A check result is an input to policy, not the policy itself.

## Transactions identify the latency window

`FairTransactionService` selects `AUTO`, `GRIM`, `NATIVE`, or `DISABLED` at startup. `AUTO` uses Grim when its API is available and native markers otherwise. If Grim is detected but its API fails, the service reports `GRIM_UNAVAILABLE` and keeps native markers disabled so two transaction sources do not collide.

Polar or Vulcan ownership selects a conflict mode instead of stacking transaction sources. That is the same principle as event deduplication: more data is not always better if two systems disagree about who owns the packet. Transactions are polled every tick through the Folia-aware scheduler.

The provider choice is a runtime decision, not only a config label. An operator who sets `AUTO` gets whichever path the installed plugin set supports. That makes the installed plugin list part of the anticheat's behavior, which is easy to forget during a migration.

## Compensation is a specific path

Reach compensation is not a general reach extension applied to every attack. After a reach-increase punishment, an eligible main-hand AIR swing can apply melee damage against a nearby target within the configured compensated-reach band. The shipped band is `3.01` to `4.0` blocks, with a minimum hit delay.

The compensation is scoped by config as well. `compensation.cancel-attacks-when-damage-reduced` and `compensation.cancel-shielding-attacks-when-damage-reduced` default to `true`, and `compensation.cancel-blocks-when-disabled` defaults to `true`. Those switches decide whether a mitigated action is cancelled rather than left half-applied.

FairPlay is combat-only by design. It does not ship movement-prediction checks. Movement packets, locations, and rotation history are kept as shared telemetry for combat, aim, hitbox, scaffold, and timing checks. A combat decision should be explainable from the packets that produced it; that is the stated boundary.

The boundary is also a limitation. A player flying across the map is not what this pipeline is built to prove. Treating FairPlay as a movement anticheat would be a category error, not a tuning problem.

## The permission model has a sharp edge

`fairplay.admin` is not a wildcard. Its declared children list omits `fairplay.command.reload`, `.checks`, `.toggle`, `.alerts`, `.menu`, `.punishments`, `.kick`, and `.totemtest`. Several of those nodes are not declared in `plugin.yml` at all, even though the code checks them.

A non-OP admin group granted only `fairplay.admin` can therefore be denied subcommands that look administrative. Explicit grants are required. This matters because the pipeline is tunable at runtime: who can toggle checks and reload configs is part of the safety model.

The licence is another operational constraint. FairPlay is Personal Use Only, not open source. Commercial use, redistribution, and publishing modified or unmodified copies require prior written permission.

## What this does not prove

No live server or Folia run was performed for this article. The README's Minecraft 1.8–1.21 statement is a claim, not a tested matrix; the build targets Spigot 1.21.11. The Folia flag is metadata.

PacketEvents is a hard external dependency. FairPlay verifies that the loaded API is external and disables itself when it is absent, which is a clear failure but not a compatibility guarantee. No minimum PacketEvents version is declared; the build compiles against `2.14.0`.

"All checks active" is not a safe assumption. Toggles and per-check configuration decide what runs in a given build. Deduplication does not prove that two distinct packets cannot produce two compensations, and result aggregation only covers checks that return results.

What the code does show is a disciplined order: consume one event, let checks report independently, cancel only on a real failure, and give latency markers a single owner. That is a stronger foundation than a pipeline that treats every uncertain signal as guilt.

See the [FairPlay overview](/docs/fairplay/overview.html) for the packet path and platform caveats. The [FairPlay case study](/work/fairplay.html) covers the wider product context; the official product page is [arkflame.com/plugins/fairplay](https://arkflame.com/plugins/fairplay/).
