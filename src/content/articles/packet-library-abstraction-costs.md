---
title: "What a packet library abstraction still costs"
description: "PacketEvents can be a hard dependency or an optional adapter. Neither choice removes version drift, cancellation ownership, or multi-path maintenance."
publishedAt: 2026-10-30
updatedAt: 2026-10-30
tags: ["packetevents", "packets", "architecture", "minecraft"]
author: "LinsaFTW / Juan Cruz Linsalata"
canonicalPath: "/posts/packet-library-abstraction-costs.html"
draft: false
featured: false
relatedProjects: ["exploitfixer", "fairplay"]
relatedDocs: ["/docs/exploitfixer/overview.html", "/docs/fairplay/overview.html"]
---

A packet library is often described as the thing that makes multi-version support someone else's problem. It does move protocol mapping out of the plugin. It does not move the plugin's own compatibility decisions, and the integration model changes what those decisions cost.

## Two integration models

FairPlay and ExploitFixer sit at opposite ends of the dependency spectrum.

| Question | FairPlay | ExploitFixer |
| --- | --- | --- |
| PacketEvents relationship | Hard `depend` | Optional adapter |
| Other packet path | None | ProtocolLib adapter |
| Missing library | Plugin disables itself | Plugin starts without that hook |
| Built against | PacketEvents `2.14.0` | PacketEvents `2.13.0`, ProtocolLib `5.3.0` |
| Declared minimum | None | None |

FairPlay treats PacketEvents as part of its runtime contract. It checks at startup that the API is present and external, and disables itself if not. That produces one code path and a clear failure. It also means every operator must install the library, and a version conflict becomes a startup failure rather than a degraded feature.

ExploitFixer treats the packet libraries as optional adapters. `PacketHooks.packet-events` and `PacketHooks.protocol-lib` default to `true`, but the libraries are `provided`, not shaded, and are only resolved when the plugin is present. The plugin has a separate required dependency, HamsterAPI, which is checked before modules load.

The optional model produces fewer install requirements. It also produces more supported configurations, because the packet surface depends on which adapter is installed.

## Adapter isolation is real work

ExploitFixer's `PacketHookManager` checks each optional plugin, constructs the adapter by class name, and cleans up when construction fails. That is isolation: a missing or broken optional library does not take down startup.

Isolation has a second half that is easier to skip. The plugin must define what still works without the adapter. An optional hook is not a feature toggle unless the behavior behind it degrades predictably. The adapter boundary has to be explicit in code, not only in the config file.

FairPlay takes the opposite approach for a reason. It verifies that the loaded PacketEvents API is external, which prevents a shaded copy from creating two packet layers in one JVM. That is a different failure mode from "library missing": a bundled copy can appear to work while conflicting with the server's copy.

Neither model is universally better. A hard dependency is simpler to reason about and easier to support. An optional adapter is easier to install and harder to test exhaustively.

## Version drift is not solved by the abstraction

"Compiled against" is not "supported range". FairPlay compiles against PacketEvents `2.14.0` and declares no minimum version. ExploitFixer compiles against `2.13.0` and ProtocolLib `5.3.0`. Those are build inputs, not compatibility matrices.

A packet library can change event registration, wrapper behavior, cancellation semantics, or the set of packet types it exposes. The plugin's code may compile against one API and fail at runtime on another. The abstraction hides protocol details; it does not hide API drift.

The usual mitigations are unglamorous: pin the library version, test the versions you support, and fail fast with a useful message when the API does not match. A library does not provide that matrix for you.

## The library does not own cancellation or coexistence

FairPlay's transaction service is a concrete example of work that stays in the plugin. It selects `AUTO`, `GRIM`, `NATIVE`, or `DISABLED` at startup. If Grim is detected but its API fails, the service reports `GRIM_UNAVAILABLE` and disables native markers to avoid a packet-owner collision. Polar or Vulcan ownership selects a conflict mode instead of stacking transaction sources.

The packet library delivers events. It does not arbitrate which plugin owns a transaction marker, and it does not decide whether two consumers should both cancel the same attack.

The same is true of event deduplication. FairPlay deduplicates receive events by event identity before dispatch. That is the plugin protecting itself from applying one compensation twice. A library can tell you a packet arrived; it cannot know that your own two handlers both acted on it.

## Protocol compatibility is a matrix

A packet library helps with packet IDs, protocol versions, and wrapper types. The plugin still owns:

- server implementation differences across Spigot, Paper, and Folia;
- event ordering and state transitions;
- cancellation authority when several plugins listen to the same packet;
- coexistence with other packet consumers;
- the tested Minecraft and library version range it actually supports.

Those are separate axes. A library that maps many protocol versions does not prove that a plugin's combat logic works on all of them. A hard dependency does not prove that every library build is compatible. An optional adapter does not prove feature parity between paths.

The practical conclusion is to treat the library as a dependency with its own contract, not as a compatibility layer that absorbs every difference. Write down the versions you build against, the versions you test, and the behavior when the library is absent or too new. That documentation is more useful than a claim that the plugin "supports PacketEvents".

## What this does not prove

No runtime tests or compatibility matrix were produced for this article. The version numbers are compile inputs from the audited builds. Neither project declares a full supported Minecraft range or a minimum PacketEvents version here.

Optional adapter presence does not prove that every module works with that adapter. A hard dependency does not prove that PacketEvents itself is configured correctly on the server. And the abstraction does not remove the need to test plugin coexistence, which is where transaction ownership and duplicate cancellation actually surface.

ExploitFixer also requires HamsterAPI, so its "optional packet hooks" should not be read as "no dependencies". FairPlay's licence is Personal Use Only, which affects deployment and redistribution independently of the technical pipeline.

See the [ExploitFixer overview](/docs/exploitfixer/overview.html) and [FairPlay overview](/docs/fairplay/overview.html) for the per-project requirements. The engineering case studies are [ExploitFixer](/work/exploitfixer.html) and [FairPlay](/work/fairplay.html); the official ExploitFixer product page is [arkflame.com/plugins/exploitfixer](https://arkflame.com/plugins/exploitfixer/).
