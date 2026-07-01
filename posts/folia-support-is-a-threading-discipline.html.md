# Folia support is a threading discipline

> Real Folia support means choosing the correct scheduler by ownership, not adding one compatibility flag.

- Author: LinsaFTW / Juan Cruz Linsalata
- Published: 2026-06-28
- Updated: 2026-07-01
- Slug: folia-support-is-a-threading-discipline
- Tags: folia, threading, minecraft-plugins
- Canonical URL: https://linsaftw.arkflame.com/posts/folia-support-is-a-threading-discipline.html

Folia support is a threading discipline. It is not only a line in plugin metadata. A plugin becomes Folia-compatible when its world, entity, region, global, and async work follows the ownership model consistently.

The mistake is treating Folia like Paper with a different scheduler name. Folia divides server work by region and entity ownership. Player inventory changes, teleports, health, and entity state belong to entity-owned execution. Block and chunk operations belong to region-owned execution. Database, file, HTTP, compression, and heavy computation belong off-thread in async work.

That classification needs to happen before implementation. If a command changes a player and writes to a database, it is not one generic task. It is a sequence: capture safe data on the player owner context, write the data asynchronously, then schedule any player feedback back to the correct owner context.

This matters for security and anticheat work too. Packet listeners can decode wrappers, read thread-safe cached state, cancel illegal packets, and produce decisions. They should not mutate Bukkit world or player state from the packet pipeline. Enforcement needs to hop to the correct scheduler.

The clean design is a scheduler bridge owned by the plugin. Product code asks for entity, region, global, or async execution. It does not create raw threads, guess server version strings, or scatter platform checks across unrelated services.

For LinsaFTW and ArkFlame, Folia support is part of the bigger quality rule: infrastructure products should respect the runtime they claim to support. Compatibility is not a badge. It is behavior under load.
