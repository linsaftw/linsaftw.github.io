---
title: VeloFlame overview
description: What VeloFlame 1.4.9 adds to the Velocity proxy edge, how admission control is ordered, and which defaults must change.
plugin: veloflame
pluginName: VeloFlame
topic: overview
order: 1
updatedAt: 2026-10-30
version: "1.4.9"
platforms:
  - Velocity
  - Velocity-CTD plugins
  - Paper / Sponge / Fabric / Forge backends (declared goal)
officialUrl: https://veloflame.com/
sourceStatus: private
draft: false
---

VeloFlame is a Velocity proxy fork shipped as the proxy JAR itself, not as a Bukkit plugin. It
keeps the Velocity plugin and API surface and adds admission controls around it: early packet
limits, per-IP rate limits, an expiring firewall, limbo verification and maintenance controls.
The runtime brand and configuration are VeloFlame; the inherited `README.md` heading still says
Velocity-CTD, and the code retains upstream `com.velocitypowered.*` and `com.velocityctd.*`
packages.

| Field | Verified value |
| --- | --- |
| Runtime version | `1.4.9` |
| Upstream identity | Velocity / Velocity-CTD fork |
| License | GNU GPL v3 |
| JAR names | `VeloFlame-Lite.jar`, `VeloFlame-Pro.jar` |
| Configuration | `veloflame.toml` next to `velocity.toml` |
| Gradle project version | `4.2.1-SNAPSHOT`; not the runtime release label |

## Where it sits in the connection path

The controls are ordered from cheapest to most expensive:

1. **Frame and compression checks.** `MinecraftVarintFrameDecoder` validates a frame before the
   packet object exists. `MinecraftCompressDecoder` checks the claimed and inflated sizes, and
   `ServerboundCompressionGuard` rejects serverbound compression ratios above the system property
   `velocity.serverbound-max-compression-ratio` (default `1024`) or claimed sizes above
   `velocity.serverbound-uncompressed-cap` (default `2097152`).
2. **Per-state early limiter.** A sliding window tracks packet count, wire bytes and decompressed
   bytes separately for `HANDSHAKE`, `STATUS`, `LOGIN`, `CONFIG` and `PLAY`. A handshake budget is
   deliberately much smaller than a play budget.
3. **Rate limits.** Login and status counters are separate. Reaching a limit can add the address
   to the firewall once per window.
4. **Firewall.** Blocked addresses live in a Caffeine cache with a configurable TTL. The optional
   host path adds them to an `ipset` set and installs an iptables `INPUT` drop rule.
5. **Limbo.** A login can be diverted before `PreLoginEvent`, verified by a limbo session, and
   only then transferred to the backend. Admission is queue-bound and event-loop aware; the code
   rejects off-loop calls rather than touching session state from the wrong thread.

## Editions

`VeloFlame.isPro()` selects the edition shown by `/veloflame`, and the two builds have different
JAR names. The shipped configuration marks six sections as PRO-only: `vpn`, `vpn-online`,
`account`, `reconnect`, `nickname` and `limbo`. Do not assume a default-enabled section exists in
the Lite artifact. Verify the JAR you actually run before planning around a module.

## Requirements

| Requirement | Verified detail |
| --- | --- |
| Proxy | Velocity-compatible fork; started as the proxy JAR |
| Java | Build toolchain is Java 25; no runtime minimum is documented |
| Existing files | `velocity.toml` and `forwarding.secret` in the working directory |
| Generated file | `veloflame.toml`, created on first start |
| External plugin | None required to boot the proxy |
| Host firewall | Linux `ipset` and `iptables` plus root or `CAP_NET_ADMIN` for the optional path |
| Client range | Not declared in metadata |

The Java 25 entry is a build toolchain, not a documented runtime floor. Test the artifact on the
JVM you intend to deploy and pin it.

## Defaults to review before production

| Default | Value | Risk |
| --- | --- | --- |
| `settings.whitelist` | localhost/private addresses plus `"LinsaFTW"` | Grants that username bypass out of the box |
| `limbo.transfer.destination-host` | `"play.my-server.com"` | Placeholder; post-verification transfer is enabled |
| `firewall.ipset` | `true` | Needs host privileges; falls back to the Java cache |
| `limbo.always-active` | `false` | Limbo triggers on join pressure, not every connection |

The shipped limbo transfer block is enabled with `use-handshake-hostname = true` and port `25565`.
Change the host or disable the transfer before exposing the proxy.

## What is not claimed

- No tested Minecraft client or backend version range is declared.
- This is a proxy; backend support statements in the inherited README are project goals, not a
  compatibility matrix.
- Lite feature parity with PRO is not established by the shared configuration file.
- The placeholder transfer destination is not a working endpoint.

For the deployment sequence see [install VeloFlame](/docs/veloflame/installation.html). For keys
and defaults see [configuration](/docs/veloflame/configuration.html). The
[VeloFlame case study](/work/veloflame.html) covers the limbo and packet-guard design decisions.

> Verified against VeloFlame `019f32053` (runtime version 1.4.9, 4 October 2026) on
> 30 October 2026. Values come from source and the shipped `default-veloflame.toml`; no live proxy
> run was performed.
