---
title: Configure VeloFlame
description: "VeloFlame 1.4.9 configuration: global whitelist, early packet budgets, firewall and rate limits, limbo, and PRO-only sections."
plugin: veloflame
pluginName: VeloFlame
topic: configuration
order: 3
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

VeloFlame keeps its settings in one generated TOML file next to `velocity.toml`. It is loaded at
startup and by `/veloflame reload` (`veloflame.reload`). Values below are the shipped defaults in
`default-veloflame.toml` at the audited commit; a distributed JAR can lag or lead that file.

## File and reload

| Path | Purpose |
| --- | --- |
| `veloflame.toml` | All VeloFlame-specific settings |
| `velocity.toml` | Proxy servers, forwarding, bind address (upstream Velocity) |
| `forwarding.secret` | Proxy-to-backend forwarding secret |

`config-version` is `"0.0.8"`. On load, the detector compares the file with the embedded default
and logs missing keys, deprecated keys and recommendations. It does not silently upgrade the
file, so review the log after adding a new JAR.

`/veloflame reload` pauses limbo admissions, reloads the other modules, then reloads limbo in
place. It is not a proxy restart.

## Global settings

| Key | Default | Meaning |
| --- | --- | --- |
| `settings.whitelist` | 9 localhost/private entries plus `"LinsaFTW"` | Global bypass list; matched against IP, hostname or username |
| `auto-whitelist.enabled` / `.playtime` | `false` / `10` | Permanently whitelist after 10 minutes of playtime |
| `action-bar.enabled` / `.permission` | `false` / `false` | Action-bar notices; permission mode off |
| `command-controls.register-bungee-aliases` | `true` | Register `/bungeecord` and `/bungee` |
| `command-controls.bypass-permission` | `"veloflame.command.bypass"` | Bypass disabled commands |
| `country.enabled` / `.mode` / `.countries` | `true` / `"BLACKLIST"` / `["RU","CN"]` | Country filtering |

The whitelist is authoritative when explicitly set: an empty list means no bypass entries. Remove
`"LinsaFTW"` and any private addresses reachable by untrusted clients.

## Early packet limits

The global limiter runs before packet objects are created and before decompression allocates an
output buffer. Numeric limits set to `0` disable that individual limit.

| State | Packets / window | Wire bytes / window | Decompressed bytes / window |
| --- | --- | --- | --- |
| `HANDSHAKE` | `96` | `16384` | `0` (disabled) |
| `STATUS` | `5` | `65536` | `0` (disabled) |
| `LOGIN` | `30` | `262144` | `262144` |
| `CONFIG` | `120` | `524288` | `524288` |
| `PLAY` | `2048` | `1048576` | `2097152` |

All states use `global-early-packet-limiter-window-ms = 1000`. The companion `-logs`,
`-firewall` and `-action-bar` switches default to `true`.

A separate unknown-PLAY guard applies before a packet type is known:

| Key | Default |
| --- | --- |
| `packet-guard.serverbound-unknown-play-max-packet-size` | `204800` |
| `packet-guard.serverbound-unknown-play-max-bytes-per-window` | `256000` |
| `packet-guard.serverbound-unknown-play-window-ms` | `1000` |

Two JVM system properties also affect this layer and are not in the TOML:
`velocity.serverbound-max-compression-ratio` (default `1024`) and
`velocity.serverbound-uncompressed-cap` (default `2097152`).

## Firewall and rate limits

| Key | Default | Meaning |
| --- | --- | --- |
| `firewall.enabled` | `true` | Enable the firewall module |
| `firewall.duration` | `60` | Cache TTL and ipset element timeout, seconds |
| `firewall.ipset` / `.ipset-name` | `true` / `"veloflame-firewall"` | Host set and rule name |
| `firewall.always-active` | `true` | Run the check regardless of trigger activations |
| `ratelimit.enabled` | `true` | Per-IP login/status limits |
| `ratelimit.connections` / `.connections-period` | `3` / `5` | Login attempts per 5 seconds |
| `ratelimit.pings` / `.pings-period` | `15` / `5` | Status pings per 5 seconds |
| `ratelimit.firewall` | `true` | Escalate a rate hit to the firewall |

`firewall.trigger-activations` uses `"unique-joins:seconds"` strings. The shipped ladder is
`30:60`, `20:30`, `10:15`, `6:10`, `3:5`, `2:1`; repeated joins from one address count once.

## Limbo and verification

The shipped file marks the whole limbo section as PRO-only. Limbo is enabled but not
always-active:

| Key | Default | Meaning |
| --- | --- | --- |
| `limbo.enabled` | `true` | Enable limbo |
| `limbo.always-active` | `false` | Send every eligible connection to limbo |
| `limbo.read-timeout-ms` | `8000` | Session read timeout |
| `limbo.max-packets` | `325` | Packet cap per limbo session |
| `limbo.blacklist-threshold` | `2` | Failures before a temporary block |
| `limbo.captcha.enabled` / `.precompute` / `.max-attempts` | `true` / `500` / `3` | CAPTCHA policy |
| `limbo.transfer.enabled` | `true` | Transfer after verification |
| `limbo.transfer.destination-host` / `.destination-port` | `"play.my-server.com"` / `25565` | Placeholder destination |

Change the transfer destination or disable `limbo.transfer` before production. The placeholder is
not a real endpoint; `use-handshake-hostname = true` prefers the client's handshake host.

Bedrock/Geyser and Eagler players are not checked by default (`check-bedrock-players = false`,
`check-eagler-players = false`); both are deliberate.

## PRO-only sections

The shipped comments mark `vpn`, `vpn-online`, `account`, `reconnect`, `nickname` and `limbo` as
PRO features. Their defaults include `vpn.enabled = true`, `account.enabled = true` with
`limit = 5` and `concurrent = 3`, and `reconnect.enabled = true` with `timeout = 10`.

Do not tune these on a Lite deployment and expect behavior. Confirm the edition with
`/veloflame` and test the actual artifact; the shared default file is not proof that every
section loads in Lite.

## Tuning order

Fix the whitelist and limbo transfer destination first. Then run with defaults and watch the
firewall and rate-limit logs, changing one state budget at a time. Enable `always-active` on a
check only after confirming normal traffic stays inside it, and reload before retesting.

> Verified against VeloFlame `019f32053` (runtime version 1.4.9, 4 October 2026) on
> 30 October 2026. Defaults are source values and were not exercised on a live proxy.
