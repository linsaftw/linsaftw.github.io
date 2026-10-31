---
title: FlameCord installation
description: Build or deploy FlameCord 2.7.0, including the patch-based build and the root, apt, ipset and iptables firewall caveat.
plugin: flamecord
pluginName: FlameCord
topic: installation
order: 2
updatedAt: 2026-10-30
version: "2.7.0"
platforms:
  - BungeeCord
  - Waterfall
officialUrl: https://arkflame.com/plugins/flamecord/
sourceStatus: private
draft: false
---

FlameCord is distributed as a proxy JAR. You either use a release build or produce one from the
patch-based source tree; there is no plugin folder to populate and no external plugin dependency
to install. The two things that break first-time installs are the non-standard build and the
host-level firewall that starts by default.

## Requirements

| Requirement | Detail |
| --- | --- |
| Java | 17 or newer; proxy classes are compiled with release 17 |
| Build tools | Git, Maven and a JDK 17+ for a source build |
| Host | Linux with `apt`, `ipset` and `iptables` for the default firewall |
| Privileges | Root for the startup `apt`, `ipset` and `iptables` commands |
| Network | Outbound HTTPS for the default proxy lists and the GeoLite country database |

## Build from the maintainer tree

The source repository is not public. If you have access to the maintainer tree, note that it is
not a plain `mvn package` project at its root: it applies Waterfall patches to a submodule and
builds the patched tree. The `flamecord` wrapper drives the scripts:

```bash
cd FlameCord
git submodule update --init --recursive

./flamecord p     # apply the Waterfall patches only
./flamecord b     # apply patches and build the JAR
```

`./flamecord b` runs `scripts/build.sh --jar`, which updates the submodule, applies the patches,
then runs `mvn clean package` in `FlameCord-Proxy`. The runnable artifact is:

```text
FlameCord-Proxy/bootstrap/target/FlameCord.jar
```

That filename comes from the bootstrap module's `finalName`. Do not expect a `2.7.0` artifact:
the Maven version in the tree is `26.1-R0.1-SNAPSHOT`, and `2.7.0` is the release label taken from
the commit subject. Confirm which source revision you built before reporting a version to players.

## Deploy

1. Put `FlameCord.jar` in the proxy directory.
2. Start it with `java -jar FlameCord.jar`.
3. On first start, FlameCord generates `flamecord.yml` and `modules.yml`; the inherited proxy
   generates its normal `config.yml`.
4. Configure the proxy basics in `config.yml` — backend servers, online mode and forwarding — as
   you would for Waterfall.
5. Configure antibot behavior in `flamecord.yml` and the built-in command modules in `modules.yml`.
6. Restart after changing host-level firewall settings.

There is no `plugins/` install step for FlameCord itself. Any proxy plugins you already use still
go in the proxy's plugin directory.

## The firewall prerequisite

The default `antibot.firewall.ipset: true` is the most consequential install setting. At startup,
FlameCord starts a thread that runs, through `/bin/sh -c` (the `60` is the default expiry in
seconds, taken from `antibot.firewall.time`):

```text
apt install iptables -y
apt install ipset -y
ipset destroy flamecord
ipset create flamecord hash:ip timeout 60
iptables -t raw -I PREROUTING -m set --match-set flamecord src -j DROP
```

Consequences:

- It assumes a Debian-style host with `apt`, root access and both tools available.
- It **destroys** an existing ipset named `flamecord` before recreating it.
- Process exit codes are ignored. A failed `apt` or `iptables` invocation does not stop startup;
  the console only logs that the feature requires Linux and root when the process cannot spawn.
- On a host that cannot satisfy this, the proxy keeps its in-memory per-address firewall state but
  no host-level DROP rule is installed.

`/flamecord reload` goes through the same initialization path, so with ipset enabled it re-runs
this command sequence as well. Use a restart when changing firewall settings, and avoid repeated
reloads on a host where the ipset layer is active.

If the host cannot run these commands, set `antibot.firewall.ipset: false` in `flamecord.yml` and
restart. Disabling the ipset layer does not disable the other antibot checks.

Verify the host rule with read-only commands:

```bash
ipset list flamecord
iptables -t raw -S PREROUTING | grep flamecord
```

The loop that consumes the command queue exits when the proxy shuts down. The source then queues
an iptables delete and an ipset destroy, but that queue is only drained inside the loop that just
ended, so do not assume the rule and set are removed automatically. Check and clean them up
manually after stopping the proxy on a shared host.

## First start checks

- The console should reach the normal proxy startup without a stack trace.
- `/flamecord` prints help and status; the base command has no permission gate.
- `/flamecord stats` requires `flamecord.stats` and shows antibot counters.
- `modules.yml` controls the inherited commands (`alert`, `find`, `ip`, `list`, `perms`, `reload`,
  `send`, `server`) plus the reconnect module, which is disabled by default.

## Permissions

FlameCord's command permissions (`flamecord.whitelist`, `flamecord.reload`, `flamecord.stats`,
`flamecord.firewall`, `flamecord.accounts`, `flamecord.lockdown`, `flamecord.bplugins`,
`flamecord.bip`, `flamecord.bkick`) have no declared defaults. Console bypasses permission checks;
other senders depend on the proxy permission provider. Grant the nodes explicitly to staff groups
before handing out access.

## Upgrades

Replace the JAR and restart. Keep `config.yml`, `flamecord.yml`, `modules.yml` and the `whitelist/`
directory. FlameCord fills in missing keys with defaults on load, so a new release can add settings
without erasing your values, but review the generated file after an upgrade rather than assuming
old thresholds still mean the same thing.

> Verified against FlameCord `4a1e58e` (release label 2.7.0, 16 September 2026) on
> 30 October 2026. Build paths and firewall commands come from source; the build was not executed
> and no host firewall rule was applied.
