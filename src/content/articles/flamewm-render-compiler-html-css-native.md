---
title: "Compiling HTML and CSS into native render commands"
description: "How FlameWM turns shell markup into a build-time render artifact, what the compiler accepts, and what disappears when the browser does."
publishedAt: 2026-10-30
updatedAt: 2026-10-30
tags: ["flamewm", "rendering", "html", "rust"]
author: "LinsaFTW / Juan Cruz Linsalata"
canonicalPath: "/posts/flamewm-render-compiler-html-css-native.html"
draft: false
featured: false
relatedProjects: ["flamewm"]
relatedDocs: []
---

A desktop panel is a small, fixed set of rectangles: a bar, some labels, icons, hover states and a menu that appears when clicked. A browser engine can draw that. So can a compiler that resolves the markup once, at build time, and emits a display list the compositor paints directly.

FlameWM takes the second route. The shell is described in HTML and CSS, but the shipped process does not parse either format. `flamewm-shell/build.rs` compiles fourteen templates and a shared menu stylesheet into `.rwr` artifacts. The runtime loads a compiled document and paints it through X11 and Xft. There is no WebView, no browser runtime and no stylesheet cascade at startup.

## The build step is the browser

The compiler entry point is `compile_file`. It parses the HTML, resolves linked and embedded CSS, applies the cascade, loads referenced images, and returns a document. `encode` serializes that document into the RWRB/2 container that the shell reads. The build script runs this for the panel, start menu, task menu, media, audio, network, calendar, OSD, launch feedback, battery, weather, notification, launcher and switcher templates.

That placement matters. An unsupported property fails `cargo build`, not a user's login. The artifact is built from a fixed source tree, and the runtime has no parser to keep compatible with a moving web standard.

The shell controller is still a V8 program. It consumes typed state and events and issues commands; it is not a browser page controller. There is no browser DOM or runtime CSS parser. The compiled document already carries the resolved tree, style data, layout inputs and paint commands. The split is: JavaScript controls behavior, the compiler owns presentation, and the WM owns X11 windows.

## The accepted subset is fixed

The compiler implements a deliberate CSS subset. The property match is a fixed list, not the CSS specification:

| Area | Supported examples |
| --- | --- |
| Box display | `display: block`, `flex`, `none` |
| Flex layout | `flex-direction`, `justify-content`, `align-items`, `gap`, `flex-grow` |
| Positioning | `position: static`, `relative`, `absolute`; `top`, `right`, `bottom`, `left` |
| Sizing | `width`, `height`, `min-*`, `max-*` |
| Spacing | `margin`, `padding`, `gap` |
| Paint | `background`, `color`, `border`, `border-radius`, `opacity` |
| Type | `font-size`, `font-weight`, `text-shadow` |
| State | `:root`, `:hover`, `:active`; custom properties |

Unsupported values are not silently approximated. `display: grid`, for example, is rejected rather than treated as a block. `!important` is rejected as an unsupported declaration. In strict mode, which is the compiler's default and the mode the shell build uses, an unsupported declaration returns an error; in non-strict mode it becomes a warning. That difference is worth knowing if you reuse the compiler: the same stylesheet can pass one build configuration and fail another.

The compiler also skips `<script>` tags. Scripts are not part of the compiled document, which is consistent with the controller/renderer split: behavior is not compiled into paint commands.

## What the runtime receives

The compiled artifact feeds four runtime responsibilities:

1. layout, using the resolved tree and style data;
2. hit testing, so a click lands on the intended control;
3. paint command generation;
4. typed runtime mutations, so a hover or state change updates the compiled document without re-parsing markup.

The performance contract around this path is explicit. There is no continuous frame loop. Layout and repaint follow state, damage or input events only. Pointer motion is coalesced only across contiguous same-window `MotionNotify` events, and event ordering is never crossed. Cached X11 pixmaps, masks, fonts and colors are reused, and `GraphicsExpose` is disabled for retained image copies.

Those rules are not micro-optimizations added after the fact. They are the reason a compiled shell can be event-driven: if every frame required a full parse and layout pass, the build-time compiler would only move the cost, not remove the runtime model.

## The trade-offs are the point

A browser gives you an enormous, familiar platform. It also gives you a runtime you did not write, a compatibility surface you do not control, and a rendering path that has to serve arbitrary documents. FlameWM gives that up on purpose.

The costs are real:

- **The CSS surface is smaller than the web.** A developer has to learn which properties exist and how FlameWM interprets them. Porting a web design is not a copy-paste operation.
- **The compiler is part of the product.** Adding a visual capability means changing the compiler, the document model and the renderer, not adding a stylesheet rule.
- **There is no browser inspector.** Debugging is a build error, a compiler warning, or the separate inspect gate, not a DOM panel in developer tools.
- **Arbitrary web content is out of scope.** The shell cannot embed a third-party web page and expect it to render. That is a constraint, not a missing feature to be papered over later.
- **Build-time strictness can be inconvenient.** A typo in a property name stops the build. That is preferable to a silently unstyled panel, but it changes the edit loop.

In exchange, the runtime does not ship a browser engine, a WebView or a GPU compositor it does not need. The shell's presentation is an in-repo artifact with an in-repo renderer. For a desktop panel, that is a defensible trade.

## What it does not solve

Compiling the shell does not make painting free. The project's own pixel benchmark, run on 2026-10-29 on a 1350x641 frame, measured a radius-12 full-frame blur at 58.09 ms on CPU and 4.84 ms on the GPU backend. Fills and strokes were much closer: 4.00 ms versus 3.83 ms for a rounded fill, and 0.07 ms versus 3.73 ms for a rounded stroke. Those numbers are the minimum of fifteen runs on a shared machine with a load average between 56 and 81, and the performance document says they are not a release claim.

The GPU path is also opt-in, not a default win. In the project's live test under software GL, the GPU whole-frame path was slower than CPU presentation; the benchmark table shows why a blanket "GPU is faster" claim would be wrong. Blur benefits from the GPU; small strokes and some batches do not.

The compiler also does not guarantee browser-identical text layout, provide web compatibility, or remove the need to measure a new visual effect. It removes a runtime parser and a browser dependency. That is a narrower claim, and it is the one the code supports.

## What this does not prove

FlameWM 0.1.3 had not yet been tested as an installed session on real hardware in this revision, and the performance figures come from self-run samples on a shared machine, not an independent benchmark.

The render compiler crate declares MIT while the workspace is LGPL-2.0-only; the project notes that the maintainer has not confirmed that crate's license. That is a packaging question to resolve before redistributing the compiler, not a rendering claim.

What the code does show is a complete build-time path: HTML and CSS in, a compiled document out, native paint commands at runtime, and no browser engine in the shipped shell. The limits are the interesting part, because they define what the shell can become without turning back into a browser.

For the product context, see the [FlameWM case study](/work/flamewm.html).
