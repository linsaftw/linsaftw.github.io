---
title: FairPlay commands and permissions
description: FairPlay 4.1.0 command tree, declared permission nodes, and the subcommands that are code-checked but missing from plugin.yml.
plugin: fairplay
pluginName: FairPlay
topic: commands-permissions
order: 3
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

FairPlay registers `/fairplay` with the aliases `/fp` and `/anticheat`. The base command checks
`fairplay.command` before dispatching any subcommand, then each subcommand checks its own node.
The permission metadata is incomplete, which matters more than the command list itself.

## Commands

| Command | Permission checked | Behavior |
| --- | --- | --- |
| `/fp help` (`/?`) | `fairplay.command` | Help filtered by the sender's permissions |
| `/fp reload` | `fairplay.command.reload` | Reload all configs and check runtime configs |
| `/fp checks <enable\|disable\|toggle> <check\|category>` | `fairplay.command.checks` | Change state for a check or category |
| `/fp toggle <check\|category>` (`tg`) | `fairplay.command.toggle` | Flip one check or category |
| `/fp alerts [enable\|disable\|toggle\|inspect\|clear] [player]` | `fairplay.command.alerts` | Staff alert subscription; `inspect` and `clear` are player-only |
| `/fp menu` | `fairplay.command.menu` | Open the GUI menu |
| `/fp punishments <list\|add\|remove\|clear> [value]` (`punish`) | `fairplay.command.punishments` | Manage punishment tiers |
| `/fp kick <enable\|disable\|toggle>` | `fairplay.command.kick` | Toggle the kick mitigation |
| `/fp damagecancel <enable\|disable\|toggle>` | `fairplay.command.damagecancel` | Toggle damage-cancel compensation |
| `/fp blockcancel <enable\|disable\|toggle>` | `fairplay.command.blockcancel` | Toggle block-place cancellation |
| `/fp latency <player> <1..120>` | `fairplay.command.latency` | Transaction latency diagnostics |
| `/fp rotations ...` | `fairplay.command.rotations` | Attacker rotation and hitbox diagnostics |
| `/fp banwave run` | `fairplay.command.banwave` | Run the banwave queue |
| `/fp totemtest <player> [50..5000]` (`totemcheck`) | `fairplay.command.totemtest` | Manual AutoTotem test |
| `/fp ml ...` (`mltrain`, `machinelearning`, `trainml`) | `fairplay.command.ml` | Model, training and window commands |

`/fp checks` and `/fp toggle` write the check's `enabled` value back to its YAML, so a toggle
survives a restart. The two commands differ in intent: `checks` takes an explicit action, while
`toggle` flips the current state.

## Declared permissions

These nodes have a declaration block in `plugin.yml`.

| Node | Default | Purpose |
| --- | --- | --- |
| `fairplay.admin` | `op` | Parent for its listed children only |
| `fairplay.train` | `op` | Training sessions and pending data |
| `fairplay.check` | `op` | Check violation status |
| `fairplay.notify` | `op` | Receive flag alerts |
| `fairplay.command.ml` | `op` | ML command |
| `fairplay.command.ml.global` | `op` | Record all online players' aim rotations |
| `fairplay.command.damagecancel` | `op` | Damage-cancel toggle |
| `fairplay.command.blockcancel` | `op` | Block-cancel toggle |
| `fairplay.command.latency` | `op` | Latency tracing |
| `fairplay.command.rotations` | `op` | Rotation diagnostics |
| `fairplay.command.banwave` | `op` | Banwave queue |
| `fairplay.exempt` | `false` | Exempt from checks while tracking continues |
| `fairplay.nosetback` | `false` | Prevent check setbacks |
| `fairplay.nomodifypacket` | `false` | Prevent packet cancellation/modification |

## Undeclared but code-checked

`fairplay.admin` lists eleven children, and it is not a wildcard. The following nodes are checked
by code but have no declaration block with a default in `plugin.yml`.

| Node | Used by |
| --- | --- |
| `fairplay.command` | Base command and tab completion |
| `fairplay.command.reload` | `/fp reload` |
| `fairplay.command.checks` | `/fp checks` |
| `fairplay.command.toggle` | `/fp toggle` |
| `fairplay.command.alerts` | `/fp alerts` |
| `fairplay.command.menu` | `/fp menu` |
| `fairplay.command.punishments` | `/fp punishments` |
| `fairplay.command.kick` | `/fp kick` |
| `fairplay.command.totemtest` | `/fp totemtest` |

`fairplay.command` is referenced as a child of several declared nodes, but it is not itself
declared. The eight subcommand nodes above are neither declared nor children of `fairplay.admin`.
A group granted only `fairplay.admin` can therefore be denied reload, checks, toggle, alerts,
menu, punishments, kick and totemtest. Grant each node explicitly through your permission plugin.

## Behavioral notes

- **Console bypasses permission checks.** Bukkit treats the console as permitted; the checks
  matter for players and other non-console senders.
- **Help is filtered, not complete.** `/fp help` hides lines whose permission the sender lacks,
  so a missing subcommand in help can mean a missing permission rather than a missing command.
- **`fairplay.admin` is a parent, not a wildcard.** It grants the exact children listed in
  `plugin.yml`; it does not imply sibling nodes added by a newer build.
- **Alerts are per player.** `/fp alerts inspect <player>` and `/fp alerts clear` require a player
  sender because they store a target UUID and save the player record.
- **Exemptions are separate from bypass.** `fairplay.exempt`, `fairplay.nosetback` and
  `fairplay.nomodifypacket` default to `false` and must be granted deliberately.
- **Proxy permissions do not apply.** This is a Bukkit plugin; use a Bukkit permission provider,
  not a proxy permission node.

## Recommended grants

For a staff role that should triage but not reconfigure:

```text
fairplay.command
fairplay.command.alerts
fairplay.command.latency
fairplay.command.rotations
fairplay.notify
```

For an administrator, grant `fairplay.admin` plus the nine undeclared nodes above. Do not assume
`fairplay.admin` alone is enough.

## Verify permissions

1. As a non-OP test account, run `/fp help` and confirm the visible lines match the granted nodes.
2. Run a subcommand without its node and confirm the denial message.
3. Grant the node, rerun, and confirm the action succeeds.
4. Run `/fp reload` after a toggle and confirm the check state persists in its YAML.

> Verified against FairPlay `aad8a638` (version 4.1.0, 29 October 2026) on 30 October 2026.
> Permission checks and command behavior come from source; `plugin.yml` declarations were read at
> HEAD. No live server permission test was performed.
