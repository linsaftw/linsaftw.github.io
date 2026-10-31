---
title: "Folia scheduler bridges without hard dependencies"
description: "How three plugins keep Folia scheduler types out of loaded signatures, what reflective bridges buy at class-load time, and what they still do not prove."
publishedAt: 2026-10-30
updatedAt: 2026-10-30
tags: ["folia", "threading", "minecraft-plugins", "compatibility"]
author: "LinsaFTW / Juan Cruz Linsalata"
canonicalPath: "/posts/folia-scheduler-bridges-without-hard-dependencies.html"
draft: false
featured: false
relatedProjects: ["entitylimiter", "flamespawners", "exploitfixer"]
relatedDocs: ["/docs/entitylimiter/overview.html", "/docs/flamespawners/overview.html"]
---

A plugin that compiles against Folia can fail on Paper before it runs a single task. The failure is class loading, not scheduling logic: a Folia type in a method signature, field, cast, or annotation can force the JVM to resolve a class that does not exist on the server.

## The class-loading problem

Java resolves referenced types when a class is loaded and verified. If a plugin's loaded class mentions a Folia scheduler type in a signature, the JVM may need that type even when the Folia branch is never executed. A method body protected by `if (isFolia())` is not enough if the method signature itself names the missing class.

The naive fixes are worse than the problem. Shipping two JARs doubles the artifact surface. Adding a hard Folia dependency stops the plugin from loading on Paper. Shading server classes is a compatibility hazard, not a solution.

The bridge approach keeps Folia types out of loaded signatures. The plugin probes the server once, caches the scheduler classes and methods it finds, and calls them through reflection. When Folia is absent, the same code falls back to the Bukkit scheduler.

## Three implementations of the same idea

EntityLimiter, FlameSpawners, and ExploitFixer use comparable bridges, but they are separate implementations, not a shared library.

| Project | Bridge | What it keeps out of the loaded path |
| --- | --- | --- |
| EntityLimiter | `utils/FoliaAPI` | Folia scheduler classes; caches classes and methods after one capability probe |
| FlameSpawners | `compat/SchedulerBridge` | Folia scheduler types, with a Bukkit fallback in the same JAR |
| ExploitFixer | `FoliaAPI` | Periodic watchdog, violation, player, and debug tasks; console punishment dispatch |

EntityLimiter also instantiates 1.14-only event classes reflectively, so the mandatory 1.8 class path stays clean. That is the same discipline applied to a different API: do not name a type in a loaded signature if the type may be absent at runtime.

The metadata is the easy part:

```yaml
api-version: "1.13"
folia-supported: true
```

The flag tells the platform that the plugin intends to support Folia. It does not implement the bridge, and it does not prove that the plugin's tasks obey region ownership.

## What the bridge buys

The first benefit is a single artifact. A server owner can move the same JAR between Paper and Folia without choosing a build. That reduces deployment mistakes, especially in a network where not every backend runs the same fork.

The second is a clean failure mode. If the Folia probe fails, the plugin falls back to the Bukkit scheduler instead of throwing `NoClassDefFoundError` during class loading. A missing capability becomes a scheduling fallback, not a startup crash.

The third is legacy loadability. FlameSpawners is compiled against Spigot 1.8.8 with Java 8 bytecode and declares `api-version: 1.13`; the reflective bridge is part of why the same shaded JAR is intended to load on Bukkit, Spigot, Paper, and Folia. EntityLimiter's reflective 1.14 event construction follows the same reasoning.

Caching matters too. EntityLimiter probes once and caches the classes and methods it found. Reflection is not free, but a cached method handle is a different cost from a lookup on every task. The bridge is designed as startup work plus cached dispatch, not as a reflective call in the hot path.

## What it does not prove

Loading successfully is not the same as scheduling correctly.

Folia's ownership model distinguishes entity, region, global, and async work. A bridge can find a scheduler and still send a task to the wrong owner. The class-loading problem is solved; the threading problem remains. A plugin can pass a smoke test, load on Folia, and still mutate entity state from a region task or touch a block from an entity task.

None of the three projects records a Folia runtime test in the audited source. `folia-supported: true` is a declaration. EntityLimiter's README explicitly says a cross-version matrix still has to be run before claiming verified 1.8–1.21 compatibility; the 1.8 compile target is not a verified runtime either. FlameSpawners describes the bridge as a compatibility mechanism, not as a test result. ExploitFixer's Folia flag is metadata in the same way.

Reflection is also a compatibility bet. Cached class and method names can change between server versions. A probe that succeeds on one Folia build can fail on another, and the fallback may hide the failure until a task does not run when expected. Logging and a startup diagnostic are part of making the bridge reviewable.

Unit tests do not close that gap. EntityLimiter and FlameSpawners ship substantial test suites, but a JUnit test on a non-Folia JVM cannot prove region ownership. It can prove that the fallback branch and the task wrapper behave, which is useful but narrower.

## A review checklist

1. Search loaded classes for Folia package names in signatures, fields, casts, and annotations, not only in method bodies.
2. Confirm the capability probe runs once and caches what it resolves.
3. Check which scheduler each operation uses: entity, region, global, or async. "It runs" is not the test.
4. Check cancellation and shutdown behavior on both paths.
5. Run the actual JAR on the Folia build and plugin set you deploy, with entity and block operations exercised.

The bridge is a packaging and class-loading technique. It removes a hard dependency from the artifact. It does not remove the need to reason about ownership, and it does not turn a metadata flag into a compatibility guarantee.

For the surrounding behavior, see the [EntityLimiter overview](/docs/entitylimiter/overview.html) and the [FlameSpawners overview](/docs/flamespawners/overview.html). EntityLimiter is distributed through its [BuiltByBit product page](https://builtbybit.com/resources/entitylimiter-optimize-performance.67164/).
