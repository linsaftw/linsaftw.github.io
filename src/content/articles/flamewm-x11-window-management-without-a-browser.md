---
title: "Owning the root window: X11 window management in FlameWM"
description: "What it takes to be the X11 window manager rather than wrap one: reparenting, EWMH, workspace ownership, and the Wayland boundary."
publishedAt: 2026-10-30
updatedAt: 2026-10-30
tags: ["flamewm", "x11", "rust", "wayland"]
author: "LinsaFTW / Juan Cruz Linsalata"
canonicalPath: "/posts/flamewm-x11-window-management-without-a-browser.html"
draft: false
featured: true
relatedProjects: ["flamewm"]
relatedDocs: []
---

The root window does not belong to a process until one claims it. On X11, a window manager takes ownership by selecting `SubstructureRedirect` on the root window. From that point, new top-level windows are redirected to the manager instead of being mapped directly by the server. If the claim fails, another manager already owns the display. If the manager hangs, new windows can stop appearing; if it exits, its frames can be left behind.

FlameWM's X11 session is built around that contract. `flamewm-wm` owns the root window, client discovery, reparenting, frame lifetime, ICCCM close and state handling, EWMH root and client properties, focus, minimize/maximize/fullscreen, interactive move and resize, workspace assignment, and work-area and snap geometry. It uses `x11rb` and talks to the X server directly; no IceWM executable or compatibility bridge runs underneath it.

## The claim obliges you to finish the job

Selecting the redirect mask is the easy part. The obligations arrive immediately:

- a client that maps a window expects a frame, a border, and a sensible size;
- a client that closes expects its window to disappear without leaving a frame behind;
- a client that exits unexpectedly expects the manager to release its resources;
- a panel expects to know which window is active, which desktop is current, and where the work area ends;
- the session expects the manager to survive a client that ignores every convention.

The architecture separates authority from presentation for this reason. `flamewm-wm` is the only owner of managed windows and workspace state. The shell process draws the panel, start menu, popovers and settings, but it does not construct a second hidden window manager. That rule matters when a panel button says "close window": the shell sends a command; the WM performs the operation against the X11 client it owns.

## Reparenting is a lifetime, not a decoration

Reparenting puts each client window inside a frame window owned by the manager. The frame gives the manager a place to draw borders, apply size constraints and handle input on the client's behalf. It also creates a second lifetime to manage. When the client goes away, the frame must go away. When the manager exits, the server needs enough information to keep the client alive or to restore it cleanly; that is what the SaveSet and frame-lifetime handling are for.

The visible features depend on the same bookkeeping. Minimize is not "hide the window and hope"; it is a state transition the WM records and reverses. Maximize is not "resize once"; it has to survive a work-area change, a panel resize, or a monitor geometry change. Fullscreen has to interact with the same state machine. Interactive move and resize have to track pointer events without letting a late motion event overwrite a newer position.

FlameWM's renderer follows a related rule: it coalesces contiguous `MotionNotify` events for the same window, never reorders across a `ButtonRelease` or another event, and mutates from the newest coordinate that has arrived. That is a rendering rule with a window-management consequence: the frame should follow the pointer, not a stale sample of it.

## Workspaces need one owner

A workspace model looks trivial until the panel, the WM and the keyboard shortcuts each keep their own copy. Then the pager highlights desktop 3 while the WM is on desktop 2, and a "move window right" action does something different depending on which component handled it.

FlameWM puts the topology in `flamewm-api::workspace`. The product layout is two rows, with `workspace_columns(count) = ceil(count / 2)`, row-major cells and no wrap-around. `flamewm-platform::workspace` exposes it to the rest of the product, the X11 WM resolves arrow shortcuts with `grid_neighbor` and publishes the same grid through `_NET_DESKTOP_GEOMETRY` and `_NET_DESKTOP_VIEWPORT`, and the shell's workspace pager owns only presentation: cell ids, metrics and labels derived from the shared model.

The earlier single-row rule made up and down no-ops. The current rule keeps left and right inside the current row and lets up and down switch rows. That is a small product decision, but it is the kind of decision that has to live in one place or it will drift.

## Why Rust, specifically

The useful claim is not that Rust makes a window manager correct. It is that this codebase can enforce a boundary. The workspace forbids `unsafe_code` where the lint is inherited; the X11 WM uses `x11rb`'s safe protocol APIs; the Xlib/Xft renderer is the explicit FFI boundary and does not inherit that lint. Pure models such as the workspace topology do not depend on X11 or Wayland, so they can be tested without a display server.

That structure is why the project can keep one workspace model for two sessions. It is also why the X11 and Wayland paths can share shortcut names and workspace rules without sharing a compositor implementation.

## The Wayland session is a separate compositor

The Wayland session is not a second mode of the X11 WM. `flamewm-wm-wayland`, built on Smithay 0.7, owns the Wayland session. `model.rs` owns stacking, workspaces, cascade, minimize/maximize/fullscreen and grabs without depending on Smithay; `handlers.rs` maps xdg-shell, server-side decorations, layer-shell and seat events onto that model. Seat access is a systemd-logind client over the system bus, with DRM/KMS and libinput behind the crate's `drm` feature.

The shell, desktop, settings, launcher and screenshot processes remain X11 clients running on the compositor's XWayland display. They are not Wayland-native, and the compositor's window model remains the only stacking and workspace authority for them. Shared policy stays in `flamewm-api` and `flamewm-platform` so workspace topology and shortcut names cannot drift between sessions.

The status is part of the design. No successful native DRM login is on record. At least one reported login fails after the cursor appears. The Wayland session has no session lock, screenshot portal, per-output layout or per-output scale, and the terminal body renders black at the default 80% opacity. The wrapper does not fall back to X11 by itself; if the Wayland session fails, the login screen is the recovery path.

## What this does not prove

FlameWM 0.1.3 is a source-level release. No installed session has been accepted on real hardware in this revision, and the screenshots come from a headless test session on Xorg's dummy driver. The repository records a workspace test run of 3843 passing tests across 125 suites on 2026-10-29, but that is a project-recorded result, not something this article re-ran.

The measured idle memory is 23.8 MiB PSS for Flame-owned processes in session mode and 26.9 MiB PSS in direct mode, from a nested Xephyr run on a shared machine. Those are samples from a source release, not a guarantee, and they are not a like-for-like comparison with a full desktop environment. The project's own performance document says the figures are not a release claim.

What the code does support is narrower and more useful: an X11 manager that owns its protocol responsibilities, a workspace model with one owner, and a Wayland compositor kept behind an explicit boundary. That is the part worth reading.

For the product context, see the [FlameWM case study](/work/flamewm.html). The source is public at [github.com/ArkFlame/FlameWM](https://github.com/ArkFlame/FlameWM).
