---
title: AuthMePremium configuration
description: Verified AuthMePremium 2.7.2 proxy and backend keys, defaults and bridge validation rules.
plugin: authmepremium
pluginName: AuthMePremium
topic: configuration
order: 2
updatedAt: 2026-10-30
version: "2.7.2"
platforms:
  - BungeeCord
  - Velocity
  - Bukkit
  - Paper
  - Folia (declared)
sourceStatus: shipped-config
draft: false
---

AuthMePremium ships two configuration surfaces: `proxy-config.yml`, generated as the proxy
`config.yml`, and `bukkit-config.yml`, generated as
`plugins/AuthMePremiumBukkit/config.yml`. Stop servers before editing generated files.

## Platform differences

Velocity loads the proxy file through typed nested sections. Bungee reads several legacy
top-level paths directly, so a key that works on one proxy is not guaranteed to behave the
same on the other. Check the Bungee path before assuming parity.

## Profile storage

| Key | Shipped default | Meaning |
| --- | --- | --- |
| `provider` | `YAML` | `YAML`, `MYSQL` or `MEMORY` |
| `database.cache.profile-ttl-seconds` | `300` | Profile snapshot lifetime |
| `database.cache.uuid-migration-ttl-seconds` | `86400` | UUID migration lookup cache |
| `database.cache.save-interval-seconds` | `1` | Queued save flush cadence |
| `database.mysql.enabled` | `false` | Enables the MySQL profile store |
| `database.mysql.host` / `port` / `database` | `localhost` / `3306` / `authmepremium` | MySQL endpoint and schema |
| `database.mysql.sync.enabled` | `true` | Cross-proxy invalidation rows |
| `database.mysql.sync.expire-seconds` | `5` | Sync row retention |

`MEMORY` profiles and history are process-local and disappear on restart. `YAML` writes
`users/<name>.yml` under the proxy data directory. `MYSQL` uses one shared database for
multiple proxies. Sync rows are cache-invalidation signals only, not profile truth: do not
run multi-proxy on per-proxy storage.

## Bridge keys

| Key | Default | Notes |
| --- | --- | --- |
| `bridge.plugin-message.enabled` | `true` | Mode A master switch |
| `bridge.plugin-message.token` | `""` | Must match the backend token after trimming |
| `bridge.authme-native.enabled` | `false` | Mode B; Velocity reads it, Bungee ignores it |
| `bridge.authme-native.shared-secret` | `""` | Must match `Hooks.proxySharedSecret` |
| `bridge.authme-native.login-source-servers` | `[]` | Servers allowed to promote a cracked session |
| `bridge.authme-native.target-servers` | `[]` | Servers receiving `perform.login` |
| `bridge.authme-native.all-target-servers` | `false` | `false` keeps the target allowlist |
| `bridge.authme-native.max-retries` | `3` | Extra sends after the immediate attempt |
| `bridge.authme-native.retry-delay-millis` | `1000` | Delay between retries |

Mode A and Mode B are independent: Mode B can run with the proprietary bridge disabled, and
Mode A continues to work when native validation fails. Mode B is fail-closed: a blank secret,
empty login-source list, empty target list while `all-target-servers` is `false`, negative
retries or a non-positive delay disables only the native bridge. The plugin logs one warning
naming the key and never logs the secret. Token matching does not approve a UUID; UUID
approval does not excuse a token mismatch.

## Proxy behaviour

| Key | Default | Effect |
| --- | --- | --- |
| `command-blacklist.servers` | `["auth", "auth-server"]` | Servers where self-service commands are blocked |
| `self-service-commands.require-permission` | `false` | When false, player commands skip the individual nodes |
| `premium-command.confirm` | `true` | `/premium` needs a confirmation step |
| `premium-command.confirm-timeout-seconds` | `15` | Confirmation window |
| `premium-command.kick-after-confirm` | `true` | Reconnect for premium verification |
| `protection.block-commands-unauthenticated` | `true` | Cracked players must log in before other commands |
| `protection.block-server-switch-unauthenticated` | `true` | No backend switching before AuthMe confirms |
| `protection.allowed-while-unauthenticated` | `login`, `l`, `register`, `reg`, `email`, `captcha`, `verification`, `totp`, `2fa` | Command roots allowed before login |
| `auto-premium` | `true` | Try the premium path for unknown names |
| `auto-premium-skip-registered` | `true` | Skip that path for already-registered names |
| `first-join-cracked.enabled` | `true` | Enable the first-join cracked fallback |

`protection.*` applies until backend AuthMe confirms login. Current verified premium sessions
bypass these guards because proxy online-mode verification is the proof. Removing `login`
from the allowed list locks cracked players out, so keep an authentication command reachable.

## UUID and security

| Key | Default |
| --- | --- |
| `uuid.mode` | `PREMIUM` |
| `uuid.migrate-uuid` | `true` |
| `uuid.old-cracked-uuid.enabled` | `false` |
| `security.ip-change-cooldown-hours` | `24` |
| `security.max-linked-premium-accounts` | `3` |
| `migrate-command.confirm-timeout-seconds` | `15` |
| `migrate-command.request-timeout-minutes` | `15` |

UUID ownership migration is guarded by the IP cooldown, the linked-account cap and the
confirmation window. `/authmepremium migrateuuid` is a separate admin operation and is denied
unless global `uuid.mode` is `AUTO`.

## Bedrock and lookups

`bedrock.enabled`, `bedrock.floodgate`, `bedrock.geyser.enabled` and
`bedrock.autologin.enabled` default to `true`; the Geyser prefix hook is enabled with `.` and
`bedrock.autologin.require-api-verified-bedrock` is `true`. Bedrock players bypass stored
premium profiles; auto-login still depends on the verified Floodgate or Geyser path. The two
AuthMe lookup hooks default to `false`; they read registration state, not premium proof.

## Backend file

| Key | Default | Meaning |
| --- | --- | --- |
| `authme.enabled` | `true` | Allow AuthMe API calls; when false, premium completion is rejected |
| `auto-login.delay-ticks` | `10` | Delay before the first auto-login attempt |
| `auto-login.timeout-seconds` | `15` | Auto-login completion timeout |
| `auto-login.max-retries` | `5` | AuthMe state checks after one submitted request |
| `bridge.plugin-message.token` | `""` | Must match the proxy token when set |
| `bridge.plugin-message.learn-first-token` | `true` | Learn and persist the first non-empty token |
| `bedrock-auto-login.enabled` | `true` | Backend Bedrock auto-login |
| `bedrock-auto-login.delay-ticks` | `5` | Bedrock join delay |
| `bedrock-auto-login.retry-delay-ticks` | `2` | Bedrock retry delay |
| `bedrock-auto-login.timeout-seconds` | `6` | Bedrock completion timeout |

The canonical backend section is `bedrock-auto-login`; a read-only `floodgate-auto-login`
fallback exists with the same defaults. All three bundled resources use the canonical
section, so do not keep both with conflicting values. A backend token is learned only when the
configured token is empty and learning is enabled; it is persisted to the backend config.

## Proxy trust files

`allowed-proxies.txt` stores one proxy UUID per line; blank lines and `#` comments are ignored.
An empty file auto-approves the first proxy UUID and writes it. After that, unknown UUIDs are
rejected into `pending-proxies.txt` and must be approved per backend. Files live in
`plugins/AuthMePremiumBukkit/`. Trust is local per backend and is not a substitute for
firewalling backend ports.

## Nickname bypass conflict

The bundled documentation and the shipped proxy/backend files disagree on the exact nickname
validation-bypass prefix form, so this page publishes neither value. Backend bypass exists so
proxy-assigned cracked or Bedrock names can pass Paper/Folia username validation; it does not
validate arbitrary client names, and the proxy must validate the original name. Inspect your
generated files and use one form consistently on proxy and backend.

> **Verified against** AuthMePremium 2.7.2's bundled `common/src/main/resources/proxy-config.yml`
> and `bukkit/src/main/resources/bukkit-config.yml`, plus the bundled `docs/configuration.md`
> and `docs/installation.md`, on 30 October 2026. Defaults are the shipped values; no server
> run was performed, and Bungee legacy-key behaviour was not exercised.
