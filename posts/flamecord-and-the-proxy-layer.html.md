# FlameCord and the proxy layer

> Why proxy security became one of the core parts of my work in the Minecraft server ecosystem.

- Author: LinsaFTW / Juan Cruz Linsalata
- Published: 2026-05-30
- Updated: 2026-05-30
- Slug: flamecord-and-the-proxy-layer
- Tags: flamecord, security, minecraft
- Canonical URL: https://linsaftw.arkflame.com/posts/flamecord-and-the-proxy-layer.html

FlameCord started from a practical problem: Minecraft networks need a proxy layer that can survive real traffic, not only normal traffic.

A BungeeCord or Waterfall proxy is not just a router. It is the first public surface of a network. Every ping, connection attempt, handshake, invalid state, bot wave, and weird client behavior reaches that layer first. If the proxy wastes too much work on bad traffic, the rest of the network pays the cost.

That is why FlameCord focuses on early rejection, anti-bot checks, anti-crash patches, anti-VPN behavior, and performance improvements. The point is not to add random features. The point is to reduce wasted CPU, block obvious abuse earlier, and give server owners a better baseline.

The proxy layer is also where a lot of support problems become visible. A user might report lag, but the real issue can be a plugin. Another user might report high CPU, but the real issue can be ping spam or connection abuse. A good workflow starts with evidence: profiler output, logs, traffic patterns, and exact reproduction.

FlameCord became important to me because it represents the kind of product I like building: technical, practical, and directly tied to uptime. If it works, the owner feels it. If it fails, everyone feels it. That creates a high standard.
