---
title: "Premium sessions and the trust boundary between proxy and backend"
description: "AuthMePremium's two session bridges, fail-closed validation, proxy UUID trust files, and the identity checks that remain outside the plugin."
publishedAt: 2026-10-30
updatedAt: 2026-10-30
tags: ["authmepremium", "minecraft", "authentication", "proxy"]
author: "LinsaFTW / Juan Cruz Linsalata"
canonicalPath: "/posts/authme-premium-session-trust.html"
draft: false
featured: false
relatedProjects: ["authmepremium"]
relatedDocs: ["/docs/authmepremium/overview.html", "/docs/authmepremium/configuration.html"]
---

A proxy can verify that a Minecraft account owns its name. It cannot make a backend trust that verification without a protocol. The backend has its own AuthMe state, its own player record and its own idea of whether a session is authenticated. The gap between those two views is where premium-session bridges live.

AuthMePremium fills that gap with two independent mechanisms. They are not layers of one protocol, and either can run while the other is disabled. Understanding which one owns which behavior is the difference between a working premium login and a backend that silently treats a verified player as cracked.

## Two bridges, two contracts

| | Mode A | Mode B |
| --- | --- | --- |
| Channel | Proprietary `authmp:*` plugin messages | Native `authme:main` |
| Proxy | Bungee-compatible or Velocity | Velocity only |
| Backend | AuthMePremium Bukkit companion on every receiving backend | Stock AuthMeReloaded 6.0.0+ |
| Owns | AuthMe 5.x auto-login, Bedrock completion, Vault groups, `SYNC_CRACKED_STATE`, `authmp:success` and `authmp:authstate` | Signed `perform.login` and login-message promotion |
| Shipped state | Enabled by default | Disabled by default |

Mode A is the companion bridge. It exists because AuthMe 5.x, Bedrock completion, Vault group changes and cracked-state synchronization need code on both sides of the proxy boundary. The backend companion receives the proxy's plugin messages and performs the corresponding AuthMe work.

Mode B is narrower. It uses AuthMe's native plugin channel, sends a signed `perform.login`, and can promote an unauthenticated cracked session from a trusted login source. It does not provide Bedrock completion, Vault groups, `SYNC_CRACKED_STATE` or AuthMe 5.x support. A network that needs those features still needs Mode A, even if Mode B is also enabled.

The two bridges can coexist. Mode B can run with the proprietary bridge disabled, and Mode A continues to work when native validation fails. That independence helps during a migration, but an operator still has to know which bridge carries which behavior.

## Fail-closed means the bridge disappears

Mode B is validated when it is enabled. Any of these conditions leaves the native bridge inoperable:

- a blank `shared-secret`;
- an empty `login-source-servers` list;
- an empty `target-servers` list while `all-target-servers` is `false`;
- a negative `max-retries`;
- a non-positive `retry-delay-millis`.

The plugin logs one warning naming the invalid key, does not register the native bridge, and leaves Mode A untouched. The shared secret is never logged. A misconfigured bridge should not half-work, and it should not take down the bridge that was already functioning.

The backend side has its own requirements. `Hooks.bungeecord: true` and a `Hooks.proxySharedSecret` must match `bridge.authme-native.shared-secret` exactly. AuthMe rejects stale signed messages, so proxy and backend clocks have to stay sane. AuthMe DataSource caching should be disabled in proxy deployments, as AuthMe documents, or a cached session can disagree with the proxy's view.

`login-source-servers` controls whose AuthMe `login` message may promote an unauthenticated cracked session. `target-servers` controls where `perform.login` is sent. A server can be a target without being a login source; promotion still needs a trusted source.

## Trust files are a second lock

The bridge token and the proxy UUID are separate trust axes. A valid token proves that a message came from a component that knows the token. It does not prove that the component is an approved proxy for this backend.

Each backend keeps `allowed-proxies.txt` and, after a rejection, `pending-proxies.txt` in its plugin data directory. The allowlist stores one proxy UUID per line; blank lines and `#` comments are ignored. An empty allowlist auto-approves the first proxy UUID and writes it. Once the file is non-empty, unknown UUIDs are rejected and recorded for review.

Approve or reject them locally with `/authmepremium pendingproxies`, `approveproxy <uuid>` or `rejectproxy <uuid>`. These backend routes use `authmepremium.admin`, which defaults to `op`. Approval is per backend, not network-wide. A proxy approved on the lobby backend is not automatically approved on the survival backend.

The two checks do not substitute for each other. Matching the bridge token does not approve a UUID, and approving a UUID does not excuse a token mismatch. Trust authenticates bridge messages; it does not make a publicly reachable backend safe, so keep backend ports firewalled.

## UUID modes and migration

`uuid.mode` ships as `PREMIUM`. `uuid.migrate-uuid` is enabled, while `uuid.old-cracked-uuid.enabled` is disabled. The migration path is guarded by three separate controls:

| Control | Default |
| --- | --- |
| IP-change cooldown | 24 hours |
| Maximum linked premium accounts | 3 |
| Migration confirmation timeout | 15 seconds |
| Migration request timeout | 15 minutes |

`/authmepremium migrateuuid` is a separate admin operation and is denied unless the global `uuid.mode` is `AUTO`.

The guards are not cosmetic: the IP-change cooldown limits how quickly a compromised account can be re-linked, and the linked-account cap limits how many premium identities can share one cracked history.

## Cache TTLs are not identity

Profile storage defaults to `YAML`, with `MYSQL` and `MEMORY` as alternatives. The cache is a decorator over the provider, with separate lifetimes for different kinds of data:

| Key | Default |
| --- | --- |
| `database.cache.profile-ttl-seconds` | 300 |
| `database.cache.uuid-migration-ttl-seconds` | 86400 |
| `database.cache.save-interval-seconds` | 1 |
| `database.mysql.sync.expire-seconds` | 5 |

A five-minute profile TTL is a performance choice, not a statement that premium status is re-verified every five minutes. The proxy's online-mode verification is the proof; the cache stores the resulting state.

MySQL sync rows are cache-invalidation signals, not profile truth. They tell other proxies that a cached profile changed; they do not replace shared storage. Multi-proxy deployments need a shared database; per-proxy storage with sync rows will still diverge. `MEMORY` profiles and history are process-local and disappear on restart.

## What the plugin does not verify

Premium proof comes from proxy online-mode verification. Username lookups and client UUID matches are routing hints, never proof. Bedrock auto-login depends on a verified Floodgate or Geyser path; a leading dot in a username is not identity.

The plugin does not replace AuthMe, Geyser, Floodgate, a proxy, a firewall or proxy-forwarding security. It also does not make a backend safe to expose directly.

Self-service command permissions ship dormant: `self-service-commands.require-permission` is `false`, so eligible players can use the player commands without the individual nodes until an operator enables checks. `premium-command.confirm` is enabled with a 15-second window, and `kick-after-confirm` is enabled, so the premium path includes a reconnect for verification rather than trusting the first command.

The bundled documentation and shipped files also disagree on the exact nickname-validation bypass prefix. This article does not publish either form. The backend bypass exists so proxy-assigned cracked or Bedrock names can pass Paper or Folia username validation; it does not validate arbitrary client names. The proxy must validate the original name; check the generated files on both sides before publishing a value.

## What this does not prove

The current POM version is `2.7.2`, but the README and development docs still name a `2.2.1-SNAPSHOT` artifact. Use the POM version and check the jar you actually deploy.

Bungee and Velocity do not read every key the same way. Velocity loads typed nested sections; Bungee reads several legacy top-level paths directly. A key that works on one proxy is not guaranteed to behave the same on the other, and this article did not exercise Bungee legacy-key behavior.

No build or server run was performed for this article. Mode A and Mode B behavior, trust-file handling and UUID migration are source-level and configuration-level claims, not runtime results. Folia support is declared in the backend descriptor; no Folia run is recorded. The source repository is private, so no repository link is published.

For the exact keys and defaults, see the [AuthMePremium configuration](/docs/authmepremium/configuration.html). For the wider product list, see [work](/work.html).
