---
title: Install FairPlay
description: Install FairPlay 4.1.0 with PacketEvents, generate its configuration tree, and verify a safe first start.
plugin: fairplay
pluginName: FairPlay
topic: installation
order: 2
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

FairPlay is a Bukkit plugin with a hard PacketEvents dependency. Unlike plugins that degrade to a
reduced mode, it disables itself when PacketEvents is missing or when the API it finds is not the
external plugin. Install PacketEvents first, then FairPlay, then read the generated configuration.

## Requirements

| Requirement | Verified detail |
| --- | --- |
| Server | Bukkit, Spigot or Paper; `folia-supported: true` is declared |
| Plugin metadata | `api-version: 1.13` |
| Java | Java 8 bytecode; run the JVM your server version requires |
| Required plugin | PacketEvents, installed separately |
| PacketEvents build | Compiled against `2.14.0`; no minimum version is declared |
| Optional anticheats | GrimAC and/or Vulcan for flag hooks |
| Storage | YAML by default |

A Java 8 bytecode target is not a Java 8 runtime requirement for a modern server. Paper and
Spigot builds for recent Minecraft versions require a newer JVM, so follow the server's
requirement, not the plugin's compile target.

## Install order

1. Stop the server.
2. Install PacketEvents in `plugins/` and start once to confirm it enables.
3. Put the FairPlay JAR in `plugins/`.
4. Start the server and watch the console.
5. Confirm that FairPlay enabled and generated `plugins/FairPlay/`.
6. Configure the server, then restart or use `/fp reload`.

Do not bundle PacketEvents inside the FairPlay JAR or load a second PacketEvents API copy.
FairPlay checks that the API is external and disables itself if it is not.

## Generated files

FairPlay has no YAML in its resources except `plugin.yml`; configuration is generated from
annotated classes on first start.

```text
plugins/FairPlay/
├── config.yml
├── mitigations.yml
├── transaction.yml
├── hooks.yml
├── punishments.yml
├── banwave.yml
├── webhook.yml
├── snapshot.yml
├── redis.yml
├── lang/
│   ├── commands.yml
│   └── menus.yml
└── check/
    ├── aimbot/
    ├── autoclicker/
    ├── autototem/
    ├── hitbox/
    ├── killaura/
    ├── scaffold/
    └── ...
```

The `check/` tree holds per-check YAML, grouped by family and short source code. Do not assume a
file exists until the corresponding check has loaded; the tree is produced by the runtime.

## First-start settings

| File | Key | Default | Meaning |
| --- | --- | --- | --- |
| `config.yml` | `bedrock-check` | `true` | Evaluate Bedrock players |
| `config.yml` | `auto-update-models` | `true` | Replace bundled AIM/AutoClicker models at startup |
| `config.yml` | `player-logs-enabled` | `true` | Per-player logs under `logs/<player>/<date>.txt` |
| `config.yml` | `cancel-message-cooldown-ms` | `60000` | Shared feedback cooldown |
| `config.yml` | `storage.type` | `"YAML"` | Player storage backend |
| `mitigations.yml` | `kick.enabled` | `false` | Automatic kicks |
| `mitigations.yml` | `ban.enabled` | `false` | Automatic bans |
| `mitigations.yml` | `reach-increase.enabled` | `true` | Reach-increase compensation |
| `transaction.yml` | `enabled` | `true` | Client-sync transaction system |
| `transaction.yml` | `provider.mode` | `"AUTO"` | `AUTO`, `GRIM`, `NATIVE` or `DISABLED` |

Automatic kicks and bans are off by default. Reach compensation is on, so a fresh install can
change combat behavior before any punishment policy is configured. Review `mitigations.yml` before
production.

`provider.mode: "AUTO"` selects a transaction provider at startup. If Grim is detected but its
API is unavailable, the mode becomes `GRIM_UNAVAILABLE`; native markers stay disabled to avoid a
packet-owner collision, so this is not a native fallback. Explicit `NATIVE` mode with Grim present
is refused with a warning, and Polar or Vulcan ownership disables transaction-dependent behavior.

## Optional anticheat hooks

`hooks.yml` contains Grim, Vulcan, NoCheatPlus, Polar, Intave, Matrix and Spartan sections. Each
has `enabled = true` by default, but a hook only acts when the corresponding plugin and event
classes are present. GrimAC and Vulcan are the integrations named in the README; the other
sections are adapters, not bundled anticheats.

Install only the external anticheat you actually run. Stacking several packet-owning plugins is
a configuration decision, not a default recommendation.

## Verify the install

- Run `/fp help`. The base command requires `fairplay.command`; grant it explicitly if the help
  output is denied.
- Run `/fp reload` with `fairplay.command.reload` and confirm all configs reload.
- Run `/fp checks enable <check>` or `/fp toggle <check>` with the matching permission and confirm
  the change is written to the check YAML.
- Check the console for PacketEvents disable messages before troubleshooting checks.
- Confirm `plugins/FairPlay/config.yml`, `mitigations.yml` and `transaction.yml` exist.

If FairPlay disabled itself, look for `PacketEvents is required but not found` or an API/external
verification failure. Fixing PacketEvents is the only path back; there is no standalone mode.

## Building from source

The 4.1.0 reactor build requires original pretrained model resources that are not ordinary
source files. Building the plugin is not a plain `mvn package` in a fresh checkout. Server
operators should use the distributed JAR.

Plugin developers can compile against `fairplay-api` 4.1.0 plus the Spigot API as `provided` and
declare `depend: [FairPlay]`. The API JAR is an SDK, not a server plugin; do not shade its
classes.

> Verified against FairPlay `aad8a638` (version 4.1.0, 29 October 2026) on 30 October 2026.
> Dependency checks, generated paths and defaults come from source; no live server install was
> performed.
