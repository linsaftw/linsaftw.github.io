---
title: "VeloFlame's limbo takeover is an event-loop contract"
description: "How VeloFlame admits a login into limbo with a ticket and a bounded queue, and why frame limits and the transfer host belong to the same design."
publishedAt: 2026-10-30
updatedAt: 2026-10-30
tags: ["veloflame", "limbo", "velocity", "concurrency"]
author: "LinsaFTW / Juan Cruz Linsalata"
canonicalPath: "/posts/velocity-limbo-takeover-design.html"
draft: false
featured: true
relatedProjects: ["veloflame"]
relatedDocs: ["/docs/veloflame/overview.html", "/docs/veloflame/configuration.html"]
---

A limbo implementation can look correct in a single-client test and still corrupt state under connection churn. The hard part is not sending a player to a hold world. It is taking over a login that the proxy is already processing without moving session state across threads or admitting a stale session twice.

## Takeover happens before PreLoginEvent

VeloFlame's login path checks reconnect, maintenance, then `tryLimboTakeover`. A takeover cleans up the inbound login and returns. The limbo session is installed before the normal pre-login flow continues.

That placement is deliberate. The proxy has enough information to decide whether this connection should be diverted, but it has not yet exposed the connection to the backend login flow. Moving the takeover later would mean cleaning up more state; moving it earlier would mean deciding before the proxy knows enough about the session.

The dispatch is in `InitialLoginSessionHandler`, immediately before `PreLoginEvent`. That is the boundary the code is built around.

## Admission is event-loop-bound

`tryTakeover` rejects off-event-loop calls. It allocates a generation lease and a session ticket, enqueues the admission into a bounded queue, and activates the session before installing the handler.

The event-loop rule is the core contract. Velocity session state is not a concurrent data structure; touching it from an arbitrary thread creates races that are difficult to reproduce and expensive to diagnose. Rejecting the off-loop call is better than hoping the caller is careful.

The ticket and lease solve a different problem: a queued admission can outlive the connection that created it. The lease and ticket give queued work an identity that can be checked against the current generation and session, so stale work can be recognized instead of applied to a new connection that reused the same address or username.

The bounded queue is backpressure. An unbounded queue turns a connection spike into a memory spike and delays every admission behind it. A bounded queue forces the proxy to decide what happens when limbo capacity is exhausted, which is a policy question the code cannot answer silently.

## Cheap limits run before limbo

Limbo allocates a session, a handler, and captcha state. An oversized frame should never reach that point.

The frame decoder calls `validateFrame` before packet creation. The compression decoder checks the claimed decompressed size before inflation and the actual size after it. `ServerboundCompressionGuard` rejects serverbound compression ratios above the system property `velocity.serverbound-max-compression-ratio` (default `1024`) and claimed sizes above `velocity.serverbound-uncompressed-cap` (default `2097152`).

The per-state limiter adds a sliding window over packet count, wire bytes, and decompressed bytes. The shipped packet budgets are deliberately different by state:

| State | Packets per window | Window |
| --- | --- | --- |
| `HANDSHAKE` | `96` | `1000` ms |
| `STATUS` | `5` | `1000` ms |
| `LOGIN` | `30` | `1000` ms |
| `PLAY` | `2048` | `1000` ms |

These are counts and byte ceilings, not CPU-time measurements. They stop a connection from making the proxy do unbounded work before any semantic decision. They do not prove that the remaining work is cheap, and they do not replace the limbo read timeout.

## Limbo policy and transfer

The shipped limbo section is enabled, but not always active. `limbo.enabled` is `true`, `limbo.always-active` is `false`, `limbo.read-timeout-ms` is `8000`, and `limbo.max-packets` is `325`. Two failures (`limbo.blacklist-threshold`) produce a temporary block. Captcha precompute is `500`, with `3` maximum attempts.

The transfer block is the part most likely to surprise an operator. `limbo.transfer.enabled` is `true`, and the destination host is the placeholder `play.my-server.com` on port `25565`. `use-handshake-hostname` is also true. A verified player can therefore be transferred to a host that does not exist unless the operator changes or disables the block.

That is a shipped-default problem, not a hidden behavior. The configuration reference calls it out, and the code path is enabled by default. Treat the transfer destination as a required first-start edit, alongside the global whitelist entry that grants a username bypass out of the box.

Reload has its own ordering. `/veloflame reload` pauses limbo admissions, reloads the other modules, then reloads limbo in place. Pausing admissions first avoids swapping limbo state underneath sessions that are mid-verification. It is still a reload, not a restart, and the module reload sequence is worth watching in logs.

## What this does not prove

No live proxy run was performed for this article. The limbo section is marked PRO-only in the shipped configuration comments, and the shared default file is not proof that every section loads in the Lite artifact.

No Minecraft client or backend range is declared. The build toolchain is Java 25, but that is not a documented runtime floor. The placeholder transfer destination is not a working endpoint.

The event-loop contract is enforced in code, but runtime thread behavior under connection churn was not measured here. A bounded queue prevents unbounded admission growth; it does not prove that the queue drains fast enough for a given host. Captcha and read timeouts are policy controls, not proof that limbo cannot be abused.

What the design does show is a consistent rule: admit on the event loop, identify the session before queueing it, and spend frame-level checks before session-level work. The transfer host is part of the same operational contract, because a successful limbo session that transfers to a placeholder is still a failed login.

See the [VeloFlame configuration reference](/docs/veloflame/configuration.html) for the full limbo, packet, and firewall keys. The [VeloFlame case study](/work/veloflame.html) covers the wider proxy context; the official product page is [veloflame.com](https://veloflame.com/).
