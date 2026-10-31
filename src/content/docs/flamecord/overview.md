---
title: FlameCord overview
description: "How FlameCord's 2.7.0 antibot pipeline works: login checks, limbo, packet validation, and host-level firewall."
plugin: flamecord
pluginName: FlameCord
topic: overview
order: 1
updatedAt: 2026-10-30
version: "2.7.0"
platforms:
  - BungeeCord
  - Waterfall
officialUrl: https://arkflame.com/plugins/flamecord/
sourceStatus: private
draft: false
---

FlameCord is a security-focused fork of BungeeCord and Waterfall. It is a proxy JAR, not a Bukkit
plugin: it replaces the proxy in front of your network and adds antibot checks, packet validation
and an optional host-level firewall. The `2.7.0` label comes from the release commit; the build
tree itself reports `26.1-R0.1-SNAPSHOT`, so do not look for `2.7.0` as a Maven artifact version.

## Identity

| Field | Verified value |
| --- | --- |
| Project | BungeeCord/Waterfall fork |
| Release label | 2.7.0 (commit `4a1e58e`, 16 September 2026) |
| Build version | `26.1-R0.1-SNAPSHOT` |
| Upstream base | Waterfall `26.1-R0.1-SNAPSHOT` |
| Java | Compiled with release 17 |
| License | MIT |
| Distribution | Proxy JAR; no plugin installation step |

## Where checks run

FlameCord separates status pings from logins at the handshake. A status request gets its own
rate-limit path; a login increments connection counters and enters the login pipeline. The login
checks run in a fixed order — reconnect, lockdown, latency, accounts, nickname — and each can
disconnect the connection before the player reaches a backend.

Country lookup is offloaded and resumes on the channel event loop rather than blocking it. Limbo
verification runs after login success but before `LoginEvent`: the connection is handed to the
limbo filter, login success is sent, and the session either stays in the bot filter or continues
to the normal login state depending on the client version.

Packet validation happens before full decode. The decoder rejects frames above 2 MiB and reads the
packet ID before constructing the packet; a separate check adds VLS by byte count and packet
count, then cancels or kicks at the configured thresholds.

The firewall has two layers. Each remote address accumulates connection, ping, nickname and
latency data, and a hit can mark that address as firewalled. Separately, startup can install a
host-level `ipset` and an iptables raw-PREROUTING DROP rule, which is the part that affects the
whole machine rather than one proxy process.

## Antibot defaults

| Key | Default | Effect |
| --- | --- | --- |
| `antibot.accounts.enabled` / `.limit` | `true` / `3` | Accounts per IP |
| `antibot.latency.enabled` / `.limit` | `true` / `900` | High-latency gate in milliseconds |
| `antibot.ratelimit.connections-per-second` | `3` | Per-IP connection rate |
| `antibot.ratelimit.pings-per-second` | `8` | Per-IP ping rate |
| `antibot.reconnect.enabled` / `.attempts` | `true` / `2` | Reconnect challenge |
| `antibot.firewall.time` / `.ipset` | `60` / `true` | Firewall duration and host ipset use |
| `antibot.packets.vls-to-cancel` / `.vls-to-kick` | `25` / `100` | Packet VLS thresholds |
| `antibot.country.enabled` / `.blacklist` | `true` / `CN,HK,RU,IN,TH,ID,DZ,VN,IR,PK` | Country blocking |
| `antibot.fastchat.enabled` / `.time` | `true` / `1000` | Chat and command flood window |
| `antibot.lockdown.enabled` / `.period-limit` | `true` / `4` | Automatic lockdown policy |
| `antibot.limbo.enabled` / `.timeout` | `true` / `30` | Limbo verification |

The defaults are active out of the box, including the country list and the host firewall. Review
them before the first production start; see
[Configure FlameCord](/docs/flamecord/configuration.html) for the full operational subset.

## Requirements

| Requirement | Verified detail |
| --- | --- |
| Runtime | Java 17 or newer, matching the release-17 bytecode |
| Host | Linux with `apt`, `ipset` and `iptables` for the default host firewall |
| Privileges | Root for the startup firewall commands |
| Upstream build | Waterfall patches applied through the repo's scripts |
| Plugin dependencies | None required to run the proxy |

The firewall setup is not optional in the sense of being harmless when it fails. With
`antibot.firewall.ipset: true`, startup runs `apt install iptables -y`, `apt install ipset -y`,
destroys and recreates the `flamecord` ipset, and inserts the DROP rule. Commands run through
`/bin/sh -c`, exit codes are ignored, and a spawn failure only logs that the feature requires
Linux and root. On a non-apt host, the in-memory firewall state remains but no host rule is
installed. The startup sequence also destroys any existing ipset named `flamecord`.

## What is not claimed

- No Minecraft client version range is declared.
- No git tags or published Maven artifact correspond to `2.7.0` in this checkout.
- The exact tested Waterfall upstream commit is not recorded.
- Proxy permission nodes have no `default` metadata; behavior depends on the permission provider.
- Limbo has version-conditional branches, but the full supported range is not stated.

Nothing here establishes that every antibot check is appropriate for every network. Start with
the defaults on a staging proxy, watch what the checks block, then tune.

## Next steps

- [Install FlameCord](/docs/flamecord/installation.html) for the build and host prerequisites.
- [Configure FlameCord](/docs/flamecord/configuration.html) for checks, limbo, firewall and
  `modules.yml`.
- Read the [FlameCord engineering case study](/work/flamecord.html) for the design tradeoffs.

> Verified against FlameCord `4a1e58e` (release label 2.7.0, 16 September 2026) on
> 30 October 2026. Values come from source; no proxy was started and no firewall rule was applied.
