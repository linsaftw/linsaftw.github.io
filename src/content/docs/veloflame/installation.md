---
title: Install VeloFlame
description: Deploy VeloFlame 1.4.9 as a Velocity proxy, generate veloflame.toml, and verify the first start safely.
plugin: veloflame
pluginName: VeloFlame
topic: installation
order: 2
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

VeloFlame replaces the Velocity proxy JAR in the proxy working directory. There is no plugin
installation step, and no Bukkit server is involved. Two failures are easy to avoid: starting it
from the wrong directory, and leaving the shipped placeholder values in `veloflame.toml`.

## Requirements

| Requirement | Verified detail |
| --- | --- |
| Artifact | `VeloFlame-Lite.jar` or `VeloFlame-Pro.jar` |
| Java | Build toolchain is Java 25; runtime minimum is not documented |
| Working directory | Must contain `velocity.toml` and `forwarding.secret` |
| Config | `veloflame.toml` is generated on first start |
| Backends | Normal Velocity server definitions in `velocity.toml` |
| Host firewall | Optional Linux `ipset` + `iptables`, root or `CAP_NET_ADMIN` |

Because no runtime floor is declared, do not infer one from the Gradle toolchain. The toolchain
compiles with Java 25; the bytecode target and tested JVM range are not stated.

## Install order

1. Stop the existing proxy.
2. Keep `velocity.toml`, `forwarding.secret` and the `plugins/` directory in place.
3. Put the VeloFlame JAR in the proxy directory and remove the old proxy JAR to avoid starting the
   wrong one by accident.
4. Start the proxy from that directory:

   ```bash
   java -jar VeloFlame-Lite.jar
   ```

5. Watch the first start. VeloFlame writes `veloflame.toml` from `default-veloflame.toml` and
   logs a configuration analysis if keys are missing or deprecated.
6. Stop the proxy, edit `veloflame.toml`, then start it again.

Do not rename the generated file. The config path is a fixed `Path.of("veloflame.toml")` relative
to the process working directory, not a path inside a plugin data folder.

## Expected layout

```text
proxy/
├── velocity.toml
├── forwarding.secret
├── veloflame.toml
├── VeloFlame-Lite.jar
└── plugins/
    └── <your Velocity plugins>
```

`veloflame.toml` ships with `config-version = "0.0.8"`. The startup detector compares the file
against the embedded default and logs missing options, deprecated options and recommendations.
It reports the difference; it does not rewrite your file into the new shape.

## First-start changes

Edit these before accepting players:

| Key | Shipped value | Action |
| --- | --- | --- |
| `settings.whitelist` | Includes `"LinsaFTW"` | Remove or replace the username entry |
| `limbo.transfer.enabled` | `true` | Keep only if you have a verification destination |
| `limbo.transfer.destination-host` | `"play.my-server.com"` | Replace the placeholder host |
| `limbo.transfer.destination-port` | `25565` | Set the real port |
| `firewall.ipset` | `true` | Set `false` if the host cannot run ipset |

The global whitelist also contains localhost and private-range addresses. That is useful for
testing and dangerous as a production bypass if those addresses are reachable from untrusted
networks.

## Host firewall setup

With `firewall.ipset = true`, VeloFlame creates the configured set (default
`veloflame-firewall`) and installs an iptables rule equivalent to:

```bash
iptables -w 5 -I INPUT 1 -m set --match-set veloflame-firewall src \
  -m comment --comment "VeloFlame firewall ipset veloflame-firewall" -j DROP
```

This needs Linux, `ipset`, `iptables`, and root or `CAP_NET_ADMIN`. The shell work runs
asynchronously and failures are logged; the Java-side TTL cache keeps working without it. Two
cases disable ipset by design: proxy protocol/HAProxy is enabled, or the configured set name is
invalid. VeloFlame cannot block real client addresses through a proxy protocol hop.

## Verify the install

- Run `/veloflame`. It prints the runtime version, edition, proxy version and available commands.
- Run `/veloflame reload` with `veloflame.reload` and confirm the reload completes.
- Connect a test client that is not on the whitelist and confirm limbo behaves as configured.
- Check the console for ipset warnings and for the configuration analysis output.
- Confirm `velocity.toml` still points at the intended backends; VeloFlame does not rewrite it.

## Management commands

The base command is `/veloflame`, with `/velo` as an alias. Lite also registers `/bungeecord` and
`/bungee`; PRO registers those only when `command-controls.register-bungee-aliases = true`.

| Command | Permission | Behavior |
| --- | --- | --- |
| `/veloflame` | none | Version, edition, proxy version and help |
| `/veloflame reload` | `veloflame.reload` | Reload `veloflame.toml` and modules |
| `/veloflame whitelist add\|remove <entry>` | `veloflame.whitelist` | Add or remove a persistent user-whitelist entry |
| `/veloflame whitelist list\|clear` | `veloflame.whitelist` | List or clear user-whitelist entries |
| `/veloflame firewall add\|remove <ip>` | `veloflame.firewall` | Add or remove a firewall entry |
| `/veloflame firewall list` | `veloflame.firewall` | List up to 50 firewalled addresses |
| `/veloflame maintenance` | `veloflame.maintenance` | Show global maintenance status and usage |
| `/veloflame maintenance on\|off [backend] [proxy\|all]` | `veloflame.maintenance` | Toggle global or per-backend maintenance |

Proxy permissions have no declared defaults. Console access bypasses the checks; other senders
depend on the permission provider.

## Reload and upgrade

`/veloflame reload` reloads `veloflame.toml` and modules. Limbo admissions pause while the other
modules reload, then limbo reloads in place. Replacing the JAR still requires a proxy restart.

When upgrading, keep the old `veloflame.toml`, start once with the new JAR, and read the detector
output before copying values forward. The shipped file can lag or lead the running build.

> Verified against VeloFlame `019f32053` (runtime version 1.4.9, 4 October 2026) on
> 30 October 2026. Paths, key defaults and startup behavior come from source; no live proxy
> install was performed.
