---
title: AuthMePremium overview
description: How AuthMePremium 2.7.2 bridges premium, cracked and Bedrock sessions across a proxy and AuthMe backends.
plugin: authmepremium
pluginName: AuthMePremium
topic: overview
order: 1
updatedAt: 2026-10-30
version: "2.7.2"
platforms:
  - BungeeCord
  - Velocity
  - Bukkit
  - Paper
  - Folia (declared)
sourceStatus: private
draft: false
---

AuthMePremium is an authentication bridge for the AuthMe ecosystem. A Bungee-compatible or
Velocity proxy decides whether a login is premium, cracked or Bedrock, and a Bukkit-family
backend completes the corresponding AuthMe session. It also manages UUID preferences and
migration; Mode A carries profile state across the proxy-backend boundary.

The package is MIT-licensed, but the source repository is private, so this page publishes no
repository link. The current version is `2.7.2` from the Maven reactor; the README and
`docs/development.md` still name a `2.2.1-SNAPSHOT` artifact, which is documentation drift.
Use the POM version and check the JAR you actually deploy.

## Requirements

| Component | Verified detail |
| --- | --- |
| Proxy | Bungee-compatible proxy or Velocity; both entrypoints ship in the universal JAR |
| Backend | Bukkit, Paper or Folia; `api-version: "1.20"` and `folia-supported: true` |
| Java | `common`, `bukkit` and `bungee` compile for Java 17; `velocity` compiles for Java 21 |
| Build | JDK 21 and Maven; the build produces the universal artifact |
| AuthMe | AuthMeReloaded 5.x through the Mode A companion; standard AuthMe 6.0.0+ for Mode B |
| Optional hooks | Vault, Floodgate and Geyser-Spigot, AuthMeBungee or AuthMeVelocity |

The compiled API versions (`Paper 1.21.11`, `Velocity 3.4.0`, `BungeeCord
1.21-R0.3-SNAPSHOT`) are build targets, not a tested runtime matrix. Folia support is
declared; this review did not run a Folia server.

## Two session bridges

The proxy has two independent ways to move session state. They are not layers of the same
protocol, and either can run while the other is disabled.

| | Mode A | Mode B |
| --- | --- | --- |
| Channel | Proprietary `authmp:*` plugin messages | Native `authme:main` |
| Proxy | Bungee-compatible or Velocity | Velocity only |
| Backend requirement | AuthMePremium Bukkit companion on every backend that receives proxy players | Standard AuthMeReloaded 6.0.0+; no companion needed for session continuity |
| Owns | AuthMe 5.x auto-login, Bedrock completion, Vault group changes, `SYNC_CRACKED_STATE`, `authmp:success` and `authmp:authstate` | Signed `perform.login` and login-message promotion |
| Enable | Default; `bridge.plugin-message.enabled: true` | `bridge.authme-native.enabled: true` |

Mode A remains the only option when you need Bedrock completion, Vault groups,
`SYNC_CRACKED_STATE`, AuthMe 5.x backends or a Bungee-compatible proxy. Mode B
does not provide those companion features; backend-only work still needs Mode A.

Mode B backends must set `Hooks.bungeecord: true` and a `Hooks.proxySharedSecret` that matches
`bridge.authme-native.shared-secret` exactly. AuthMe also rejects stale signed messages, so
proxy and backend clocks must stay sane, and AuthMe DataSource caching should be disabled in
proxy deployments as AuthMe documents.

## Fail-closed validation

Mode B is validated when enabled. Any of these conditions leaves the native bridge
inoperable: a blank `shared-secret`; an empty `login-source-servers`; empty `target-servers`
while `all-target-servers` is `false`; a negative `max-retries`; or a non-positive
`retry-delay-millis`. The plugin logs one warning naming the invalid key, does not register
the native bridge, and leaves Mode A untouched. The shared secret is never logged.

`login-source-servers` controls whose AuthMe `login` message may promote an unauthenticated
cracked session. `target-servers` controls where `perform.login` is sent. A server can be a
target without being a login source, in which case promotion still needs a trusted source.

## Proxy trust is a separate axis

Backend trust is based on the proxy UUID in the bridge payload, not on a name, nickname
prefix or Bedrock dot. Each backend keeps `allowed-proxies.txt` and, after a rejection,
`pending-proxies.txt` in `plugins/AuthMePremiumBukkit/`. An empty allowlist auto-approves the
first proxy UUID; once the file is non-empty, unknown UUIDs are rejected and recorded.

Approve them locally with `/authmepremium pendingproxies`, `approveproxy <uuid>` or
`rejectproxy <uuid>`. These Bukkit routes use `authmepremium.admin`, which defaults to `op`.
Approval is per backend, and matching the bridge token does not approve a UUID. Trust
authenticates bridge messages; it does not make a publicly reachable backend safe. Keep
backend ports firewalled to the proxy.

## Player and admin commands

| Command | Alias | Permission |
| --- | --- | --- |
| `/authmepremium setpremium\|check\|clear\|setpremiumuuid\|setuuidmode\|migrateuuid\|reload` | none | `authmepremium.usage` |
| `/premium` | `/prem` | `authmepremium.premium` |
| `/cracked` | `/crack` | `authmepremium.cracked` |
| `/premiumuuid` | `/uuid` | `authmepremium.premiumuuid` |
| `/migrate request\|confirm\|cancel` | none | `authmepremium.migrate` |
| `/authmepremium pendingproxies\|approveproxy\|rejectproxy` | none | `authmepremium.admin` (backend, `op`) |

Self-service permissions are dormant by default: `self-service-commands.require-permission`
ships as `false`, so eligible players can use the player commands without the individual
nodes until an operator turns checks on. `/premium` is a recovery path after a verified owner
logs in, not proof of current premium status; `/cracked` and `/premiumuuid` require current
proxy-verified premium state and apply the server blacklist.

## What it does not do

It does not replace AuthMe, Geyser, Floodgate, a proxy, a firewall or proxy-forwarding
security. Premium proof comes from proxy online-mode verification. Username lookups and
client UUID matches are routing hints, never proof. Bedrock auto-login needs a verified
Floodgate or Geyser path; a leading dot is not identity.

One configuration detail is deliberately not published here: the nickname-validation bypass
prefix. The written documentation and the shipped configuration files disagree on its exact
form. Verify the generated `config.yml` on both proxy and backend, and keep the proxy as the
component that validates original player names.

## Next steps

- [Configuration](/docs/authmepremium/configuration.html) for providers, bridge keys,
  protection defaults and the backend file.

> **Verified against** the private AuthMePremium reactor at POM version 2.7.2, its bundled
> `proxy-config.yml`, `bukkit-config.yml`, `plugin.yml`, README and `docs/` set, on
> 30 October 2026. No build or server run was performed; Mode A/B and trust behaviour are
> source-level and configuration-level claims, not runtime results.
