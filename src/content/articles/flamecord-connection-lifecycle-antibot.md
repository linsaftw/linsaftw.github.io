---
title: "FlameCord's connection lifecycle is the antibot"
description: "FlameCord orders antibot work by connection state: status pings, login checks, limbo, per-address accounting, and a host firewall that is not free."
publishedAt: 2026-10-30
updatedAt: 2026-10-30
tags: ["flamecord", "antibot", "proxy", "minecraft"]
author: "LinsaFTW / Juan Cruz Linsalata"
canonicalPath: "/posts/flamecord-connection-lifecycle-antibot.html"
draft: false
featured: false
relatedProjects: ["flamecord"]
relatedDocs: ["/docs/flamecord/overview.html", "/docs/flamecord/configuration.html"]
---

A bot connection is cheap for the bot and expensive for the proxy only if the proxy performs the same work for every connection. FlameCord's antibot code is organized as a sequence of gates, each placed where the connection state makes the check meaningful. The order matters more than the individual check list.

## Status and login are separate paths

The handshake carries a requested protocol. FlameCord splits status (`protocol == 1`) from login (`protocol == 2`) before the heavier login machinery runs. A status request has its own rate-limit path; a login increments connection counters and enters the login pipeline.

That split is not cosmetic. Status pings are cheap to send and can be used to probe a proxy or amplify work. The shipped per-IP limits are `connections-per-second: 3` and `pings-per-second: 8`, with separate counters. A status request that only needs a MOTD response should not pay for account checks, limbo setup, or backend selection.

## The login checks have a fixed order

The login path runs reconnect, lockdown, latency, accounts, and nickname checks in that order. Each check can disconnect the connection before it reaches a backend. The order is fixed in code, not sorted by configuration.

Fixed order buys predictability. A reconnect challenge runs before a country lookup; a lockdown state short-circuits the rest; a latency rejection happens before the proxy spends time on account history. Operators can reason about which check rejected a connection without reconstructing a race.

The country lookup is the one that cannot always finish inline. `checkAsyncIfNeeded` runs it asynchronously and then calls the delayed login handler back on the channel event loop. The point is not "async is faster". The point is that the continuation returns to the event loop before it touches session state.

The defaults are active out of the box. `antibot.latency.limit` is `900` milliseconds, `antibot.accounts.limit` is `3`, and the country blacklist ships with ten entries. Those are policy choices, not neutral safety values: a high-latency player or a country route can be rejected before any cheat check exists.

## Limbo sits between login success and LoginEvent

Limbo verification runs after login success but before `LoginEvent`. `InitialHandler` calls `LimboCheck` and hands the connection to `LimboFilter.connectToBotFilter`. The filter installs a `LimboHandler`, sends login success, and switches the session to `BOTFILTER` or `LOGIN` depending on the client version.

The placement gives the proxy a state where the client is authenticated to the proxy but not yet admitted to a backend. Verification can happen there without spending backend slots or world resources. The shipped trigger is `2` connections in a `5` second period, with a `30` second timeout and a captcha pool of `100`.

This is also where version-conditional behavior lives. The filter has branches around client versions, and the project does not declare a full supported range. A limbo flow that works for one client family is not evidence that every admitted client follows the same branch.

## Per-address accounting is the common thread

`AddressData` accumulates connection counts, ping counts, nicknames, latency, and a firewall reason for each remote address. Rate limits, account limits, and nickname checks read that state. A firewall hit updates the counters and queues an ipset add.

Per-address accounting is the right default for a proxy, but it has known edges. A household or mobile carrier NAT shares one address, so an accounts-per-IP limit of `3` can affect legitimate players. IPv6 rotation and distributed botnets weaken the signal. The firewall also operates on the address, not the account, so a shared address can be blocked for everyone behind it.

Those are tradeoffs, not defects. They become defects when an operator treats the defaults as precise. The whitelist and the exception list exist for a reason: `BadPacketException`, `QuietException`, `IllegalStateConfig`, and `FastException` are excluded from firewall triggers in the shipped configuration.

## The host firewall is a separate operational risk

The in-memory firewall and the host firewall are different layers. The first tracks addresses inside the proxy. The second changes the machine.

At startup, `FlameCord.init` starts a thread that runs `apt install iptables -y`, `apt install ipset -y`, destroys and recreates the `flamecord` set, and inserts an iptables raw-PREROUTING DROP rule. The commands run through `/bin/sh -c`, and exit codes are ignored. A failure only logs that the feature requires Linux and root.

That assumes a Debian-style host with `apt`, root privileges, and no conflicting firewall manager. On a non-apt host, or without root, the in-memory state remains but no host rule is installed. The startup sequence also destroys any existing set named `flamecord`, which is a real collision if another tool uses that name.

There is a config trap. `antibot.firewall.enabled` is generated and loaded, but at the audited source it is not read by the startup path. Turning `enabled` off does not stop the `apt`/`ipset`/`iptables` commands. To stop the host layer, set `antibot.firewall.ipset: false` and restart.

Reload is not a light refresh either. `/flamecord reload` re-runs `FlameCord.initialize`, which calls `init()` again. With ipset enabled, that re-issues the host commands and starts another firewall loop thread. Prefer a full restart for firewall changes.

## Packet validation before full decode

The decoder rejects frames above 2 MiB of readable bytes or capacity and reads the packet ID before constructing a packet object. A separate packet check adds VLS by byte count (`0.0017` per byte) and packet count (`0.01` per packet), then cancels at `25` VLS and kicks at `100`.

Doing this before decode is the same cost argument as the login order: reject what is obviously oversized before the server allocates the object graph. A low cancel threshold is not free. It will drop packets for a client that legitimately bursts, so the threshold is a tuning decision, not a universal hardening step.

## What this does not prove

No live proxy or firewall test was performed for this article. The `2.7.0` label comes from the release commit; the build tree reports `26.1-R0.1-SNAPSHOT`, and there is no Maven artifact at `2.7.0`.

No Minecraft client range is declared. Limbo has version-conditional branches, and the audited source does not establish the full range. Proxy permission nodes have no `default` metadata, so behavior depends on the permission provider. The host firewall depends on the operating system and privileges of the machine, not on the proxy alone.

What the code does show is a coherent lifecycle: classify the connection, reject the cheap cases, verify before backend admission, account per address, and keep the host-level action explicit. The host firewall is the part that deserves a change-control process, because it outlives the proxy process.

See the [FlameCord overview](/docs/flamecord/overview.html) and [configuration reference](/docs/flamecord/configuration.html) for the full key set. The [FlameCord case study](/work/flamecord.html) covers the product context; the official product page is [arkflame.com/plugins/flamecord](https://arkflame.com/plugins/flamecord/).
