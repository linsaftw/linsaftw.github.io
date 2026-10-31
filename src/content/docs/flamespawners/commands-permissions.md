---
title: FlameSpawners commands and permissions
description: The verified FlameSpawners 1.0.6 command routes, permission nodes and default grants.
plugin: flamespawners
pluginName: FlameSpawners
topic: commands-permissions
order: 2
updatedAt: 2026-10-30
version: "1.0.6"
platforms:
  - Bukkit
  - Spigot
  - Paper
  - Folia (declared)
sourceStatus: shipped-config
draft: false
---

The root command is `/flamespawners`, with aliases `/fs`, `/fspawners` and `/spawners`. The
command declaration and its `help` route require `flamespawners.use`. Unknown subcommands
fall through to help. Console can run routes marked "console or player"; routes that target
the block a player is looking at are player-only.

## Player and content commands

| Command | Permission | Sender |
| --- | --- | --- |
| `/flamespawners help` | `flamespawners.use` | Console or player |
| `/flamespawners types` | `flamespawners.types` | Console or player |
| `/flamespawners info` | `flamespawners.info` | Player; targets the looked-at block within 6 blocks |
| `/flamespawners inspect` | `flamespawners.admin.inspect` | Player; detailed state dump for the targeted spawner |
| `/flamespawners menu` | `flamespawners.menu` | Player |
| `/flamespawners language` (`lang`) | `flamespawners.language` | Player |
| `/flamespawners near [radius] [definition]` | `flamespawners.admin.near` | Player; default radius `32` |

`language` without an argument reports the current language. Control arguments are
`available`/`list`, `auto`/`default`/`reset`, or a loaded language id. `near` also accepts
`cancel`, `next` and `previous` (`prev`) to manage the selection session; its scan is async,
publishes on the entity scheduler, and renders the current selection with effects and a
compass target.

## Item and economy commands

| Command | Permission | Sender |
| --- | --- | --- |
| `/flamespawners give <player> <type> [amount]` | `flamespawners.admin.give` | Console or player |
| `/flamespawners givewand <player> <tier> [amount]` | `flamespawners.admin.givewand` | Console or player |
| `/flamespawners setstack <amount>` | `flamespawners.admin.setstack` | Player; compatibility alias for `set stack` |
| `/flamespawners remove [force]` | `flamespawners.admin.remove`; `force` also needs `flamespawners.admin.force-remove` | Player |

`setstack` forwards to the canonical `set stack` route. The `force` argument is a separate
grant so an operator can allow ordinary removal without allowing forced removal.

## Admin content commands

| Command | Permission | Sender |
| --- | --- | --- |
| `/flamespawners reload` | `flamespawners.admin.reload` | Console or player |
| `/flamespawners diagnose` | `flamespawners.admin.diagnose` | Console or player |
| `/flamespawners definitions [info <id> \| reload]` | `flamespawners.admin.definitions` | Console or player |
| `/flamespawners prices [key]` | `flamespawners.admin.prices` | Console or player |
| `/flamespawners editloot <type>` | `flamespawners.admin.editloot` | Player |
| `/flamespawners list` | `flamespawners.admin.list` | Player; paginated summaries, 20 per page |

`definitions reload` reloads definitions on the async scheduler. `diagnose` reports readiness,
scheduler mode, storage backend, dirty-queue state, registry counts and loaded definitions,
which makes it the first check after a restart or configuration change.

## Targeted admin commands

| Command | Permission | Effect |
| --- | --- | --- |
| `/flamespawners set stack <amount>` | `flamespawners.admin.set` | Sets the targeted spawner's stack amount |
| `/flamespawners set range <blocks>` | `flamespawners.admin.set` | Writes a per-spawner activation-range override |
| `/flamespawners set delay <millis>` | `flamespawners.admin.set` | Writes a per-spawner production-interval override |
| `/flamespawners hologram status \| refresh-all \| refresh` | `flamespawners.admin.hologram` | `refresh` is player-only |
| `/flamespawners clear ghosts scan \| apply` | `flamespawners.admin.clear` | Finds or removes registry entries whose block is gone |
| `/flamespawners clear orphans scan` | `flamespawners.admin.clear` | Reports spawners whose definition is no longer loaded |

Per-spawner range and delay overrides persist, reschedule production and refresh the
hologram. `clear ghosts scan` is read-only; `apply` removes the entries from the registry,
persistence and hologram layer.

## Storage, migration and layouts

| Command | Permission |
| --- | --- |
| `/flamespawners storage` / `storage info` | `flamespawners.admin.storage` |
| `/flamespawners storage health` | `flamespawners.admin.storage` |
| `/flamespawners storage list [world]` | `flamespawners.admin.storage` |
| `/flamespawners storage migrate scan <YAML\|SQLITE\|MYSQL>` | `flamespawners.admin.storage-migrate` |
| `/flamespawners storage migrate apply <YAML\|SQLITE\|MYSQL>` | `flamespawners.admin.storage-migrate` |
| `/flamespawners migrate smartspawner scan \| apply [path]` | `flamespawners.admin.migrate` |
| `/flamespawners migrate smartspawner menus scan \| apply <dir> <name>` | `flamespawners.admin.migrate` |
| `/flamespawners gui-layout list \| active \| set <name>` | `flamespawners.admin.gui-layout` |
| `/flamespawners gui-layout import-smart (scan \| apply) <dir> <name>` | `flamespawners.admin.gui-layout` |

`storage health` reports initialized state, pending saves and deletes, queue saturation,
consecutive failures, and the last success or failure. `MARIADB` is accepted wherever
`MYSQL` is. Migration `scan` reports; `apply` writes. The optional SmartSpawner path defaults
to the `SmartSpawner` directory under the server plugins directory.

## Permission defaults

Player-facing nodes ship as `true`: `flamespawners.use`, `.language`, `.place`, `.stack`,
`.break`, `.menu`, `.info`, `.types`, `.change-type`, `.sell`, `.sellwand.use`, `.upgrade`,
`.xp`, `.storage` and `.loot-filter`.

| Node | Default | Scope |
| --- | --- | --- |
| `flamespawners.admin` | `op` | Parent of 22 admin child nodes |
| `flamespawners.bypass.stack-limit` | `op` | Ignore stack caps |
| `flamespawners.bypass.chunk-limit` | `op` | Ignore per-chunk placement limits |
| `flamespawners.bypass.ownership` | `op` | Ignore spawner ownership checks |
| `flamespawners.bypass.tool` | `op` | Ignore break-tool requirements |
| `flamespawners.bypass.drop-chance` | `op` | Ignore the configured break drop chance |
| `flamespawners.bypass.protection` | `op` | Skip external protection-provider checks |
| `flamespawners.bypass.cooldown` | `op` | Ignore action cooldowns |

`flamespawners.admin` grants its children, which cover give, setstack, list, remove,
force-remove, reload, diagnose, inspect, givewand, migrate, editloot, definitions, prices,
hologram, near, set, clear, gui-layout, storage, booster and storage-migrate. It does **not**
grant the bypass nodes; those are separate `op` grants. Granting the parent to a non-operator
also grants forced removal, so review the child list before using a permissions plugin to
hand it out.

> **Verified against** the private FlameSpawners 1.0.6 `plugin.yml` and bundled
> `docs/admin/commands.md`, on 30 October 2026. The descriptor declares 22 children under
> `flamespawners.admin`. No server run was performed; check routes on your build, since
> command aliases and player-only restrictions are enforced by the plugin at runtime.
