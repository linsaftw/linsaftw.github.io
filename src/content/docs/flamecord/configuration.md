---
title: FlameCord configuration
description: FlameCord 2.7.0 configuration defaults for antibot checks, limbo, packet limits, firewall, and modules.yml.
plugin: flamecord
pluginName: FlameCord
topic: configuration
order: 3
updatedAt: 2026-10-30
version: "2.7.0"
platforms:
  - BungeeCord
  - Waterfall
officialUrl: https://arkflame.com/plugins/flamecord/
sourceStatus: private
draft: false
---

FlameCord keeps the inherited proxy settings in `config.yml` and adds two files of its own:
`flamecord.yml` for antibot behavior and `modules.yml` for built-in command toggles. Both FlameCord
files are generated with `setIfUnexistant`, so a new key appears with its default on the next load
without overwriting values you already set.

## Files and reload

| File | Contents |
| --- | --- |
| `config.yml` | Standard proxy settings: servers, online mode, forwarding |
| `flamecord.yml` | Antibot checks, firewall, limbo, lockdown, balancer, MOTD |
| `modules.yml` | Enable or disable inherited commands and the reconnect module |
| `whitelist/` | Persistent per-entry whitelist written by `/flamecord whitelist` |

`/flamecord reload` requires `flamecord.reload` and re-initializes FlameCord configuration,
messages and modules. It is not a light file read: the command calls `FlameCord.initialize`,
which runs `init()` again. With `antibot.firewall.ipset: true` that re-issues the `apt`, `ipset`
and `iptables` commands and starts another firewall loop thread. Prefer a full restart for
firewall changes, and avoid repeated reloads on a host where the ipset layer is active.

## Firewall

| Key | Default | Meaning |
| --- | --- | --- |
| `antibot.firewall.enabled` | `true` | Generated setting; at the audited HEAD it is loaded but not read |
| `antibot.firewall.time` | `60` | Firewall duration and ipset timeout, in seconds |
| `antibot.firewall.ipset` | `true` | Install and use the host `flamecord` ipset |
| `antibot.firewall.whitelist` | `127.0.0.1` | Configured firewall whitelist entry |
| `antibot.firewall.exceptions` | `BadPacketException`, `QuietException`, `IllegalStateConfig`, `FastException` | Exception classes that do not trigger a firewall |

Only `antibot.firewall.ipset` is consumed by the startup code in the audited source; the
`antibot.firewall.enabled` key is loaded but has no other reference. Turning `enabled` off therefore
does not stop the host commands. To stop the host-level layer, disable `ipset` and restart.

## Login and connection checks

| Key | Default | Notes |
| --- | --- | --- |
| `antibot.accounts.enabled` / `.limit` | `true` / `3` | Accounts per IP; shipped whitelist entry is the placeholder `Nickname` |
| `antibot.latency.enabled` / `.limit` | `true` / `900` | Milliseconds; high-latency clients are rejected |
| `antibot.country.enabled` / `.blacklist` | `true` / `CN,HK,RU,IN,TH,ID,DZ,VN,IR,PK` | Country lookup, not a ping check |
| `antibot.ratelimit.connections-per-second` | `3` | Per-IP connection rate |
| `antibot.ratelimit.pings-per-second` | `8` | Per-IP status ping rate |
| `antibot.reconnect.enabled` / `.attempts` | `true` / `2` | Reconnect challenge |
| `antibot.reconnect.seconds-active` | `5` | Window in which reconnects are challenged |
| `antibot.nickname.enabled` / `.blacklist` | `true` / bot-name list | Nickname filtering |
| `antibot.password.enabled` / `.limit` | `true` / `3` | Repeated `/login` and `/register` attempts |
| `antibot.fastchat.enabled` / `.time` | `true` / `1000` | Chat and command flood window in milliseconds |
| `antibot.proxy.enabled` / `.online-check` | `true` / `false` | Proxy/VPN list checks; lists are downloaded at startup |

The country list is active by default. Blocking a country rejects every player routed from it, so
review the list against your actual player base and use the whitelist instead of assuming the
defaults are a neutral baseline. The accounts whitelist also ships with a placeholder name; replace
it with real staff accounts or clear it.

## Packet checks

| Key | Default | Meaning |
| --- | --- | --- |
| `antibot.packets.enabled` | `true` | Pre-decode packet accounting |
| `antibot.packets.vls-per-byte` | `0.0017` | VLS added per readable byte |
| `antibot.packets.vls-per-packet` | `0.01` | VLS added per packet |
| `antibot.packets.vls-to-cancel` | `25` | Cancel threshold |
| `antibot.packets.vls-to-kick` | `100` | Kick threshold |

These checks run before full packet decode: oversized frames are rejected outright, and the
decoder reads the packet ID before constructing a packet object. A low `vls-to-cancel` is not a
free tightening; it starts dropping packets for any client that legitimately sends a burst.

## Limbo and lockdown

| Key | Default | Meaning |
| --- | --- | --- |
| `antibot.limbo.enabled` | `true` | Limbo verification |
| `antibot.limbo.trigger.connections` | `2` | Connections in the trigger period before limbo |
| `antibot.limbo.trigger.period` | `5` | Trigger period, in seconds |
| `antibot.limbo.timeout` | `30` | Seconds before a limbo session times out |
| `antibot.limbo.captcha-count` | `100` | Captcha pool size |
| `antibot.lockdown.enabled` | `true` | Automatic lockdown |
| `antibot.lockdown.period` / `.period-limit` | `5000` / `4` | Detection window and hit count |
| `antibot.lockdown.duration` | `5000` | Lockdown duration |

Limbo runs after login success but before `LoginEvent`, and the filter has version-conditional
branches. Test it with the client versions you actually admit rather than assuming one behavior
covers all of them. `antibot.notifications.blocked-actionbar.enabled` defaults to `false`; enabling
it adds an action-bar notice for blocked players.

## modules.yml

| Key | Default | Effect |
| --- | --- | --- |
| `reconnect.enabled` | `false` | Inherited reconnect module |
| `alert.enabled` | `true` | `/alert` |
| `find.enabled` | `true` | `/find` |
| `ip.enabled` | `true` | `/ip` |
| `list.enabled` | `true` | `/list` |
| `perms.enabled` | `true` | `/perms` |
| `reload.enabled` | `true` | `/reload` |
| `send.enabled` | `true` | `/send` |
| `server.enabled` | `true` | `/server` |

Disabling a module removes the inherited command; it does not remove FlameCord's own
`/flamecord` subcommands. The `modules.yml` reconnect module and `antibot.reconnect.enabled` are
separate switches: the first toggles the inherited proxy module, the second the antibot challenge.

## Suggested order

1. Set proxy basics in `config.yml` and confirm players can reach a backend.
2. Decide whether the host can run the startup `apt`/`ipset`/`iptables` sequence. If not, disable
   `antibot.firewall.ipset` before treating the install as complete.
3. Replace placeholder whitelist entries and add staff addresses.
4. Review the country blacklist, latency limit and packet thresholds against your player base.
5. Leave `modules.yml` mostly default unless a command conflicts with an existing plugin.
6. Apply file edits with a restart. `/flamecord reload` re-runs initialization, including the host
   firewall commands when ipset is enabled, so do not use it as a cheap config refresh.

> Verified against FlameCord `4a1e58e` (release label 2.7.0, 16 September 2026) on
> 30 October 2026. Defaults come from source; no live proxy or firewall test was performed.
