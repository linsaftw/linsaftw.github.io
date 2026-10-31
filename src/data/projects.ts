import { links } from "./links";

export type ProjectCategory =
  | "minecraft"
  | "desktop"
  | "game"
  | "ai"
  | "legal-ai"
  | "org"
  | "experiment";

export type Availability = "public" | "source" | "private" | "experiment";

export interface ProjectFacts {
  readonly label: string;
  readonly value: string;
}

export interface CaseStudySection {
  readonly title: string;
  readonly body: string;
}

export interface ProjectShot {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly caption?: string;
}

export interface CaseStudy {
  /** One sentence that adds context beyond the card description. */
  readonly tagline: string;
  /** The concrete problem this product addresses. */
  readonly problem: string;
  /** What I personally built or decided, in plain language. */
  readonly contribution: readonly string[];
  /** Architecture and trade-offs, only where source or public material supports it. */
  readonly architecture: readonly CaseStudySection[];
  readonly capabilities: readonly string[];
  /** Verified platform/version facts. Never a marketing compatibility matrix. */
  readonly facts: readonly ProjectFacts[];
  readonly status: string;
  readonly availability: Availability;
  readonly version?: string;
  /** ISO date of the latest source/release evidence checked for this page. */
  readonly checked: string;
  readonly sourceUrl?: string;
  readonly docs?: readonly string[];
  readonly articles?: readonly string[];
  readonly related?: readonly string[];
  readonly gallery?: readonly ProjectShot[];
  readonly caveat?: string;
  readonly disclaimer?: string;
}

export interface Project {
  readonly id: string;
  readonly name: string;
  readonly category: ProjectCategory;
  readonly description: string;
  readonly url: string;
  readonly image?: string;
  /** ISO date, or year-only where the public chronology is intentionally coarse. */
  readonly publicLaunch?: string;
  readonly launchConfidence?: "verified" | "verified-by" | "self-reported";
  readonly featured: boolean;
  /** Human-facing category label, e.g. "Security / Anti-exploit". */
  readonly kind: string;
  readonly disclaimer?: string;
  readonly platforms?: readonly string[];
  /** Internal /work/<id>.html case study. */
  readonly caseStudy?: CaseStudy;
  readonly docsHref?: string;
  readonly marketplaceUrl?: string;
  readonly sourceUrl?: string;
}

/*
 * The card copy for the original products stays as approved. New material is
 * additive case-study data, kept in the same typed manifest so routes, cards and
 * official CTAs cannot drift apart.
 */
export const projects: readonly Project[] = [
  {
    id: "exploitfixer",
    name: "ExploitFixer",
    category: "minecraft",
    kind: "Security / Anti-exploit",
    description:
      "Packet, crash, dupe and abuse protection for Bukkit, Spigot, Paper and Folia servers.",
    url: links.exploitfix,
    image: "/images/projects/exploitfixer.webp",
    publicLaunch: "2023-01-02",
    launchConfidence: "verified-by",
    featured: true,
    marketplaceUrl: links.exploitfixBb,
    docsHref: "/docs/exploitfixer/overview.html",
    caseStudy: {
      tagline: "A packet-first defence layer for servers that cannot afford a bad Tuesday.",
      problem:
        "Public Minecraft servers take malformed packets, crash attempts, dupe tricks and command abuse from players who never need a legitimate reason to send them. The expensive failure is rarely the packet itself; it is what the server does next.",
      contribution: [
        "Built the module system, packet hooks and violation pipeline that turn individual exploit checks into one operational policy.",
        "Kept the optional PacketEvents and ProtocolLib adapters isolated, so a missing or broken hook cannot stop the core plugin from loading.",
        "Added a raw pre-decode guard and a processing-time watchdog alongside the semantic packet checks.",
        "Made periodic work and console punishment dispatch Folia-aware without pretending that every Minecraft version is tested.",
      ],
      architecture: [
        {
          title: "Validate before decode where possible",
          body: "The raw packet guard runs at the decode boundary and can cancel oversized or malformed frames before the server spends time constructing a semantic packet. Decoded packets then pass through a second receive pipeline for module-specific checks.",
        },
        {
          title: "Modules, not a pile of listeners",
          body: "Detection lives in named modules with their own YAML files. Operators can enable, disable or tune a check without rebuilding the plugin, and the shared violation system decides when a score becomes a notification, kick or command.",
        },
        {
          title: "A watchdog with a budget",
          body: "The packet watchdog compares per-packet and rolling processing time against configurable budgets. It is a safety valve for pathological input, not a claim that every plugin on the server is cheap.",
        },
        {
          title: "Dependencies fail loudly",
          body: "HamsterAPI is a hard dependency and is checked before modules load. Optional packet libraries are detected at runtime and loaded reflectively. The plugin refuses to pretend it is protecting a server when its required scheduling layer is absent.",
        },
      ],
      capabilities: [
        "Raw and decoded packet inspection",
        "Crash, dupe and invalid-payload modules",
        "Packet size, rate and processing-time limits",
        "Violation thresholds with configurable actions",
        "Command blocker and tab-complete limits",
        "Optional PacketEvents or ProtocolLib hooks",
      ],
      facts: [
        { label: "Server", value: "Bukkit, Spigot, Paper; Folia flag declared" },
        { label: "API metadata", value: "api-version 1.13" },
        { label: "Java", value: "Java 8 bytecode; run the JVM your server requires" },
        { label: "Required dependency", value: "HamsterAPI 0.3.5 or newer" },
        { label: "Optional hooks", value: "PacketEvents 2.13.0, ProtocolLib 5.3.0" },
        { label: "Source version checked", value: "4.1.2, 24 October 2026" },
      ],
      status: "Active. Source is at 4.1.2; the public build is distributed through ArkFlame and BuiltByBit.",
      availability: "public",
      version: "4.1.2",
      checked: "2026-10-30",
      docs: ["/docs/exploitfixer/overview.html", "/docs/exploitfixer/configuration.html"],
      articles: ["/posts/exploitfixer-packet-validation-order.html"],
      related: ["flamecord", "veloflame", "fairplay"],
      caveat:
        "The metadata does not declare a tested Minecraft version range. Install it on a staging server before rolling it across a network.",
    },
  },
  {
    id: "flamecord",
    name: "FlameCord",
    category: "minecraft",
    kind: "Proxy / Anti-bot",
    description:
      "Security-focused BungeeCord/Waterfall-compatible proxy infrastructure with integrated " +
      "anti-bot and network protection.",
    url: links.flamecord,
    image: "/images/projects/flamecord.webp",
    publicLaunch: "2020-02-01",
    launchConfidence: "verified-by",
    featured: true,
    marketplaceUrl: links.flamecordBb,
    docsHref: "/docs/flamecord/overview.html",
    caseStudy: {
      tagline: "Connection filtering where the attack actually arrives: the proxy.",
      problem:
        "Bot floods and reconnect loops hit the front door before a backend server sees a player. Rate limits inside a Bukkit plugin are already too late; the proxy has to decide which connections deserve a login attempt.",
      contribution: [
        "Built the anti-bot check sequence around the BungeeCord/Waterfall login lifecycle.",
        "Added per-address connection, ping and nickname accounting with a limbo verification step.",
        "Integrated optional host-level firewall rules while keeping the in-memory decision path available when host tooling is missing.",
        "Exposed the operational controls as proxy commands rather than requiring a restart for every block.",
      ],
      architecture: [
        {
          title: "Ordered admission checks",
          body: "Login checks run in a fixed sequence: reconnect challenge, lockdown, latency, accounts per address and nickname rules. Each check can disconnect before the connection reaches a backend, and status pings are handled separately from logins.",
        },
        {
          title: "Limbo before the backend",
          body: "After login the proxy can hand the connection to a limbo filter, complete the login there and only release the player to the network once verification passes. That keeps bot sessions away from game servers.",
        },
        {
          title: "Packet limits before full decode",
          body: "The decoder rejects oversized frames and tracks packet volume per address. The aim is to spend as little CPU as possible on traffic that has already failed the admission test.",
        },
        {
          title: "Host firewall is best effort",
          body: "The host firewall path uses ipset and iptables and assumes Linux, root and the required packages. The plugin logs a clear failure when that is unavailable; operators still get the in-memory protection path.",
        },
      ],
      capabilities: [
        "Reconnect and limbo verification",
        "Per-IP connection and ping rate limits",
        "Accounts-per-address and nickname checks",
        "Country and latency gates",
        "Packet volume thresholds",
        "Lockdown, whitelist and firewall commands",
      ],
      facts: [
        { label: "Proxy", value: "BungeeCord / Waterfall-compatible fork" },
        { label: "Java", value: "Java 17 bytecode" },
        { label: "Build", value: "Patch-based Waterfall tree" },
        { label: "Release label checked", value: "2.7.0, 16 September 2026" },
        { label: "Host firewall", value: "Optional ipset/iptables path; Linux root required" },
        { label: "Minecraft range", value: "Not declared in metadata" },
      ],
      status: "Active. The 2.7.0 source line is current; the public build is distributed through ArkFlame and BuiltByBit.",
      availability: "public",
      version: "2.7.0",
      checked: "2026-10-30",
      docs: ["/docs/flamecord/overview.html", "/docs/flamecord/configuration.html"],
      articles: ["/posts/flamecord-connection-lifecycle-antibot.html"],
      related: ["exploitfixer", "veloflame", "fairplay"],
      caveat:
        "The automatic firewall setup shells out to apt, ipset and iptables. Treat it as a Debian-style root host feature, not a portable default.",
    },
  },
  {
    id: "veloflame",
    name: "VeloFlame",
    category: "minecraft",
    kind: "Proxy / Velocity",
    description:
      "Velocity and Velocity-CTD fork focused on performance, anti-bot and native Limbo verification.",
    url: links.veloflame,
    image: "/images/projects/veloflame.webp",
    publicLaunch: "2025-10-27",
    launchConfidence: "verified-by",
    featured: true,
    marketplaceUrl: links.veloflameBb,
    docsHref: "/docs/veloflame/overview.html",
    caseStudy: {
      tagline: "A Velocity fork that treats admission control as part of the proxy, not an add-on.",
      problem:
        "Velocity networks inherit the same front-door problem as BungeeCord, but the modern proxy also carries more state: login sessions, compression, limbo handoffs and plugin integrations. Bolting checks onto the side makes the hot path harder to reason about.",
      contribution: [
        "Worked on the VeloFlame fork's early packet limiter, limbo admission and firewall modules.",
        "Added packet-size and decompression guards at the frame/compression layer, before normal packet handling.",
        "Built an event-loop-bound limbo takeover that can verify a connection before it reaches a backend.",
        "Kept host firewall work asynchronous and best effort, with a Java-side cache as the fallback.",
      ],
      architecture: [
        {
          title: "Early limits at the frame layer",
          body: "The frame decoder validates a packet before it becomes a normal object. The compression decoder checks both the claimed uncompressed size and the actual inflated size, which closes the obvious decompression-bomb gap.",
        },
        {
          title: "Per-state windows",
          body: "Counters switch by protocol state and track packet count, bytes and decompressed bytes separately. A handshake limit is not the same budget as a play-state limit, so the defaults differ.",
        },
        {
          title: "Limbo takeover before login completes",
          body: "The login handler can divert a connection into limbo before the backend sees it. Admission is queue-bound and event-loop aware; the code rejects off-loop calls instead of quietly touching state from the wrong thread.",
        },
        {
          title: "Firewall with a TTL",
          body: "Blocked addresses live in an expiring cache. The optional ipset path is disabled automatically when proxy protocol or an invalid set name makes it unsafe, and shell work runs off the hot path.",
        },
      ],
      capabilities: [
        "Early packet and decompression limits",
        "Limbo verification and CAPTCHA flow",
        "Per-IP connection and ping rate limits",
        "Expiring firewall cache with optional ipset",
        "Maintenance mode and command controls",
        "PRO / Lite feature split",
      ],
      facts: [
        { label: "Proxy", value: "Velocity / Velocity-CTD fork" },
        { label: "Runtime version checked", value: "1.4.9, 4 October 2026" },
        { label: "Build toolchain", value: "Java 25; runtime floor not declared" },
        { label: "Editions", value: "Lite and PRO; some modules are PRO-only" },
        { label: "Host firewall", value: "Optional ipset; needs host privileges" },
        { label: "Minecraft range", value: "Not declared in metadata" },
      ],
      status: "Active. Runtime version 1.4.9; public builds are distributed through ArkFlame and BuiltByBit.",
      availability: "public",
      version: "1.4.9",
      checked: "2026-10-30",
      docs: ["/docs/veloflame/overview.html", "/docs/veloflame/configuration.html"],
      articles: ["/posts/velocity-limbo-takeover-design.html"],
      related: ["flamecord", "exploitfixer", "fairplay"],
      caveat:
        "The shipped limbo transfer destination is a placeholder and must be changed before production. Lite does not include every PRO module listed in the default configuration.",
    },
  },
  {
    id: "fairplay",
    name: "FairPlay",
    category: "minecraft",
    kind: "Anticheat",
    description:
      "Combat-focused Minecraft anticheat combining deterministic checks, packet-level analysis, " +
      "integrations, mitigation systems and machine-learning workflows.",
    url: links.fairplay,
    image: "/images/projects/fairplay.webp",
    publicLaunch: "2026-06-12",
    launchConfidence: "verified-by",
    featured: true,
    marketplaceUrl: links.fairplay,
    docsHref: "/docs/fairplay/overview.html",
    caseStudy: {
      tagline: "Combat compensation built from observable packets, not a movement-prediction fantasy.",
      problem:
        "Combat cheats are messy: reach, hitboxes, autoclickers, velocity and latency all interact. A check that cannot explain which packet produced a decision is difficult to tune and easy to distrust.",
      contribution: [
        "Built a combat-focused detection pipeline on PacketEvents with deterministic checks and explicit cancellation authority.",
        "Added transaction synchronization with provider arbitration for Grim, native and disabled modes.",
        "Kept mitigation separate from detection so servers can choose alerts, cancellation or punishment deliberately.",
        "Added an API and optional hooks instead of hard-coding one server's plugin stack.",
      ],
      architecture: [
        {
          title: "Receive packets once, dispatch by type",
          body: "Incoming PacketEvents are deduplicated by event identity and sent to dedicated handlers. That prevents two listeners from applying the same compensation twice.",
        },
        {
          title: "Detection and mitigation are separate decisions",
          body: "Checks produce results; a hitbox decision aggregates independent failures. PASS and UNKNOWN are not treated as a cancellation reason. Mitigation configuration decides what happens after a failure.",
        },
        {
          title: "Transactions resolve latency honestly",
          body: "The transaction service can use Grim, its native implementation, or disable itself. Provider conflicts are handled at startup instead of being discovered under load.",
        },
        {
          title: "No movement prediction by design",
          body: "FairPlay concentrates on combat. It does not pretend to replace a movement-prediction anticheat, and it does not require one specific external check suite to make a decision.",
        },
      ],
      capabilities: [
        "Reach and hitbox compensation",
        "Autoclicker and aim analysis",
        "Transaction latency providers",
        "Configurable kick, ban and cancellation mitigations",
        "Grim and Vulcan hook adapters",
        "Developer API and check toggles",
      ],
      facts: [
        { label: "Server", value: "Bukkit, Spigot, Paper; Folia flag declared" },
        { label: "API metadata", value: "api-version 1.13" },
        { label: "Java", value: "Java 8 bytecode; modern servers still need a modern JVM" },
        { label: "Required dependency", value: "PacketEvents" },
        { label: "License", value: "Personal Use Only" },
        { label: "Source version checked", value: "4.1.0, 29 October 2026" },
      ],
      status: "Active development. Source is at 4.1.0; distribution is through BuiltByBit.",
      availability: "public",
      version: "4.1.0",
      checked: "2026-10-30",
      docs: ["/docs/fairplay/overview.html", "/docs/fairplay/commands-permissions.html"],
      articles: ["/posts/fairplay-combat-compensation-pipeline.html"],
      related: ["exploitfixer", "flamecord", "veloflame"],
      caveat:
        "The README's 1.8-1.21 statement is a claim, not a tested matrix. The license prohibits commercial use and redistribution without permission.",
    },
  },
  {
    id: "flamewm",
    name: "FlameWM",
    category: "desktop",
    kind: "Desktop / Window manager",
    description:
      "A Rust X11 window manager and desktop shell for Linux, with an experimental Wayland session and an HTML/CSS shell compiled to native rendering.",
    url: links.flamewm,
    image: "/images/projects/flamewm.webp",
    publicLaunch: "2026-10-30",
    launchConfidence: "verified-by",
    featured: true,
    sourceUrl: links.flamewmGithub,
    docsHref: undefined,
    caseStudy: {
      tagline: "A small Linux desktop built as a systems project, not a theme.",
      problem:
        "Desktop environments are enormous because they solve decades of integration problems. A useful alternative has to choose a narrower contract: own the window-management authority, render a shell efficiently, and be honest about which session is ready.",
      contribution: [
        "Built the window-management core, workspace model and X11 authority instead of wrapping an existing WM.",
        "Built an in-repo renderer that compiles HTML/CSS shell descriptions into native drawing code, with no browser runtime.",
        "Added a Wayland compositor path on Smithay while keeping X11 as the supported default.",
        "Wrote verification gates for architecture, render compilation, tests and packaging rather than relying on screenshots.",
      ],
      architecture: [
        {
          title: "One owner for workspace state",
          body: "The workspace topology lives in a shared API model and is consumed by the WM, platform layer and pager. A single owner avoids the usual drift where the panel and the window manager disagree about which desktop is active.",
        },
        {
          title: "Rust crates with hard boundaries",
          body: "Window management, Wayland compositing, shell control and rendering are separate crates. Pure models stay independent of X11 and Wayland so they can be tested without a display server.",
        },
        {
          title: "Compiled shell, no web runtime",
          body: "The shell is described in HTML/CSS and compiled into native rendering commands. That keeps the layout model familiar without shipping a browser engine or a JavaScript runtime to draw a panel.",
        },
        {
          title: "Verification is part of the product",
          body: "The project runs doctor, architecture audit, promotion audit, cargo checks, tests, release build, render compilation and font checks before a source release. The 0.1.3 release is explicitly source-level; it does not claim that a full installed session has been accepted on every machine.",
        },
      ],
      capabilities: [
        "X11 reparenting window manager",
        "Workspaces, focus and snapping",
        "Panel, start menu and settings shell",
        "PAM lock screen and screenshot tool",
        "Optional ARK AI assistant",
        "Experimental Wayland session",
      ],
      facts: [
        { label: "Platform", value: "x86_64 Linux" },
        { label: "Session", value: "X11 default; Wayland experimental" },
        { label: "Version", value: "0.1.3, released 30 October 2026" },
        { label: "Toolchain", value: "Rust 1.88, edition 2024" },
        { label: "License", value: "LGPL-2.0-only" },
        { label: "Packages", value: "Debian .deb and Arch flamewm-git" },
      ],
      status: "Source-level 0.1.3 release. X11 is the supported default; Wayland is not yet a daily-driver claim.",
      availability: "source",
      version: "0.1.3",
      checked: "2026-10-30",
      sourceUrl: links.flamewmGithub,
      docs: [],
      articles: [
        "/posts/flamewm-x11-window-management-without-a-browser.html",
        "/posts/flamewm-render-compiler-html-css-native.html",
      ],
      related: ["ark-ai", "exploitfixer"],
      gallery: [
        {
          src: "/images/projects/flamewm-desktop.webp",
          alt: "FlameWM desktop with the panel, wallpaper and open windows",
          width: 1200,
          height: 568,
          caption: "FlameWM 0.1.3 desktop, captured from the project's own screenshots.",
        },
      ],
      caveat:
        "The '17 MB RAM' figure used in earlier marketing is not a controlled release claim. The project's measured idle session figures are 23.8 MiB PSS (session mode) and 26.9 MiB PSS (direct mode), with the method documented in the repository.",
    },
  },
  {
    id: "ffaa-zombies",
    name: "FFAA Zombies",
    category: "game",
    kind: "Game",
    description:
      "Multiplayer zombie survival built around large enemy counts, weapons, classes, custom maps, " +
      "local co-op and online play.",
    url: links.ffaa,
    image: "/images/projects/ffaa-zombies.webp",
    // Public chronology is intentionally year-only.
    publicLaunch: "2026",
    launchConfidence: "self-reported",
    featured: true,
    platforms: ["Browser", "Windows", "Linux", "Android", "Multiplayer"],
    caseStudy: {
      tagline: "A browser-first zombie survival game built for co-op, not a storefront demo.",
      problem:
        "Large enemy counts, classes, weapons and custom maps create a lot of state to keep coherent when more than one player is in the session. A browser build also has to load quickly and tolerate hardware that was never bought for gaming.",
      contribution: [
        "Designed and shipped the public browser build at ffaa.arkflame.com.",
        "Built the game around multiplayer zombie survival rather than a single-player showcase.",
        "Kept the interface and controls usable across desktop and mobile-sized screens.",
      ],
      architecture: [
        {
          title: "Scope is the product",
          body: "The public page is the game, not a landing page around it. The build starts in the viewport and keeps menus and HUD in the same application shell.",
        },
        {
          title: "Co-op first",
          body: "Enemy counts, classes, weapons and maps are designed as shared-session systems. Local co-op and online play are part of the product description, not a post-launch maybe.",
        },
      ],
      capabilities: [
        "Large zombie counts",
        "Weapons and classes",
        "Custom maps",
        "Local co-op and online play",
        "Desktop and mobile browser support",
      ],
      facts: [
        { label: "Platform", value: "Browser; Windows, Linux and Android listed" },
        { label: "Mode", value: "Single-player, local co-op and online play" },
        { label: "Public build", value: "ffaa.arkflame.com" },
        { label: "Source", value: "Private; not part of this audit" },
        { label: "Version", value: "Not published" },
      ],
      status: "Public browser build available. Source and internal architecture are private, so this page limits itself to the shipped product.",
      availability: "public",
      checked: "2026-10-30",
      docs: [],
      articles: [],
      related: ["flamewm", "ark-ai"],
      caveat:
        "No public source, version metadata or benchmark was available. Platform and feature statements come from the shipped product description and public build.",
    },
  },
  {
    id: "ark-ai",
    name: "ARK AI",
    category: "ai",
    kind: "AI platform",
    description: "AI provider and experimentation platform for model access and developer workflows.",
    url: links.arkAi,
    image: "/images/projects/ark-ai.webp",
    featured: false,
    caseStudy: {
      tagline: "A provider-facing AI product with a strict request contract.",
      problem:
        "An AI gateway that accepts arbitrary request shapes is difficult to bill, cache and debug. Provider differences leak into every client, and a malformed field can silently change cost or behavior.",
      contribution: [
        "Built the canonical OpenAI-compatible ingress and the internal provider routing around it.",
        "Added usage accounting with idempotent reserve, settle, release and refund operations.",
        "Built an agent loop with bounded continuation turns and tool-call limits.",
        "Committed an internal evaluation dataset and methodology instead of quoting a vague capability score.",
      ],
      architecture: [
        {
          title: "One canonical parse",
          body: "Requests are parsed once into a canonical shape, then plan resolution, billing and provider calls use that object. Unknown top-level fields are rejected, and the provider body is rebuilt field by field.",
        },
        {
          title: "Streaming without a fake stream",
          body: "Provider streaming is normalized through one path, including a single terminator and sanitizer. The API does not synthesize a stream after buffering a complete response.",
        },
        {
          title: "Bounded agent work",
          body: "Continuation turns and tool calls have explicit caps. Read-only calls can run concurrently; writes and destructive calls stay sequential.",
        },
        {
          title: "Evaluation with a method",
          body: "The ARK Capability 100 benchmark is a closed-book, no-tools, no-judge set with a committed dataset hash and published per-profile scores. It is an internal benchmark, not an independent ranking.",
        },
      ],
      capabilities: [
        "OpenAI-compatible chat completions",
        "Instant and Thinking reasoning modes",
        "Usage-based wallet accounting",
        "Agent tools with bounded loops",
        "Model/provider routing",
        "Internal capability evaluation",
      ],
      facts: [
        { label: "Runtime", value: "Next.js, React, TypeScript, MongoDB" },
        { label: "Version checked", value: "2.5.0" },
        { label: "API", value: "OpenAI-compatible /v1/chat/completions" },
        { label: "Reasoning modes", value: "Instant, Thinking" },
        { label: "Source", value: "Private" },
        { label: "Public service", value: "ai.arkflame.com" },
      ],
      status: "Production service with private source. The public contract is documented; internal provider routing is not.",
      availability: "private",
      version: "2.5.0",
      checked: "2026-10-30",
      docs: [],
      articles: ["/posts/ark-ai-canonical-api-contract.html"],
      related: ["faus-legal", "flamewm"],
      caveat:
        "The ARK Capability 100 result is self-run. It is not an independent benchmark and should not be read as a model ranking.",
    },
  },
  {
    id: "faus-legal",
    name: "FAUS Legal",
    category: "legal-ai",
    kind: "Legal AI",
    description: "AI-assisted legal research and case organization for Argentine legal work.",
    url: links.faus,
    image: "/images/projects/faus.webp",
    disclaimer:
      "FAUS Legal is a research and organization aid. It does not replace a licensed lawyer and is not legal advice.",
    featured: false,
    caseStudy: {
      tagline: "Research tooling for Argentine law, with the limits written down.",
      problem:
        "Legal research produces long documents, tangled citations and a lot of context that has to stay attached to the right case. A generic chat window loses that structure quickly.",
      contribution: [
        "Built a research workspace with a supervised web and worker runtime.",
        "Added document ingestion and retrieval flows for Argentine legal material.",
        "Kept the product as an aid: it organizes research and does not present itself as a lawyer or legal advice.",
      ],
      architecture: [
        {
          title: "Web and worker are separate processes",
          body: "The launcher supervises a web process and a worker process, tracks children, and shuts them down gracefully. It does not rely on pkill or killall.",
        },
        {
          title: "Local data, explicit operations",
          body: "The application runs against MongoDB with documented ingestion, data model, operations and security notes. Research state is stored deliberately instead of being reconstructed from a chat transcript.",
        },
      ],
      capabilities: [
        "Legal research workspace",
        "Document ingestion and organization",
        "Case-oriented retrieval",
        "Supervised web and worker runtime",
        "Local MongoDB deployment",
      ],
      facts: [
        { label: "Runtime", value: "Next.js 16, Node 24, MongoDB" },
        { label: "Version checked", value: "2.1.0" },
        { label: "Source", value: "Private" },
        { label: "Public service", value: "faus.arkflame.com" },
        { label: "Scope", value: "Argentine legal research and organization" },
        { label: "Legal status", value: "Research aid, not legal advice" },
      ],
      status: "Private-source research product. Public claims are limited to the documented runtime and product scope.",
      availability: "private",
      version: "2.1.0",
      checked: "2026-10-30",
      disclaimer:
        "FAUS Legal is a research and organization aid. It does not replace a licensed lawyer and is not legal advice.",
      docs: [],
      articles: [],
      related: ["ark-ai"],
      caveat:
        "No independent evaluation of legal accuracy or coverage is published. Treat every output as a research lead requiring professional review.",
    },
  },
  {
    id: "entitylimiter",
    name: "EntityLimiter",
    category: "minecraft",
    kind: "Performance / Entity limits",
    description:
      "Per-type and per-group entity caps with radius or grid counting, per-world overrides and optional claim-provider hooks.",
    url: "https://builtbybit.com/resources/entitylimiter-optimize-performance.67164/",
    image: "/images/projects/entitylimiter.webp",
    featured: false,
    marketplaceUrl: "https://builtbybit.com/resources/entitylimiter-optimize-performance.67164/",
    docsHref: "/docs/entitylimiter/overview.html",
    caseStudy: {
      tagline: "Bounded entity populations without a blanket kill switch.",
      problem:
        "Entity farms, stacked mobs and item spills can turn a healthy chunk into a tick-time problem. A single global cap is easy to write and hard to operate: it either removes the wrong entities or leaves the actual offender untouched.",
      contribution: [
        "Built separate per-type and per-group limit families that are evaluated together.",
        "Added RADIUS and GRID counting modes, per-world overrides and exempt worlds.",
        "Kept Folia support reflective so the same jar still loads on Bukkit-family servers without Folia classes.",
        "Added item provenance and claim-provider hooks instead of assuming every entity belongs to the server.",
      ],
      architecture: [
        {
          title: "Two limits, one decision",
          body: "A type can be under its own cap while its group is already over budget. The plugin checks both, so a zombie limit and a monster-group limit can coexist without one silently disabling the other.",
        },
        {
          title: "Bounded reconciliation",
          body: "Entity validation is queued and capped per tick. The limiter does not scan every loaded chunk on every pass; it spreads work so cleanup does not become the new lag source.",
        },
        {
          title: "Reflective platform support",
          body: "Folia scheduler classes are resolved at runtime and cached. Bukkit paths remain free of hard Folia imports, which is what keeps a single artifact loadable across server families.",
        },
      ],
      capabilities: [
        "Per-type and group caps",
        "RADIUS or GRID counting",
        "Per-world overrides and exemptions",
        "Item drop limits and provenance",
        "SuperiorSkyblock2 and Lands hooks",
        "Admin stats and removal history",
      ],
      facts: [
        { label: "Server", value: "Bukkit/Spigot; Folia flag declared" },
        { label: "Built against", value: "Spigot API 1.21.5" },
        { label: "Java", value: "Java 8 bytecode" },
        { label: "API metadata", value: "api-version 1.13" },
        { label: "Version checked", value: "2.3.6, 27 October 2026" },
        { label: "Source", value: "Private" },
      ],
      status: "Current build 2.3.6. The source is private and the README explicitly says a full version matrix has not been run.",
      availability: "private",
      version: "2.3.6",
      checked: "2026-10-30",
      docs: ["/docs/entitylimiter/overview.html", "/docs/entitylimiter/configuration.html"],
      articles: ["/posts/entitylimiter-chunk-budgeting.html", "/posts/folia-scheduler-bridges-without-hard-dependencies.html"],
      related: ["redstonelimiter", "flamespawners", "exploitfixer"],
      caveat:
        "Do not read api-version or the Folia flag as a tested 1.8-1.21 matrix. Validate your server version and claim plugin before production.",
    },
  },
  {
    id: "redstonelimiter",
    name: "RedstoneLimiter",
    category: "minecraft",
    kind: "Performance / Redstone limits",
    description:
      "Sliding-window redstone and circuit limits at block, subchunk, chunk and region scope, with TPS scaling and manual quarantine.",
    url: "https://github.com/ArkFlame/redstonelimiter-docs",
    image: "/images/projects/redstonelimiter.webp",
    featured: false,
    docsHref: "/docs/redstonelimiter/overview.html",
    caseStudy: {
      tagline: "A spatial budget for redstone, not a blanket disable.",
      problem:
        "Redstone lag is rarely one bad block. It is a circuit that activates too often across a volume, and by the time TPS drops the server has already paid for the work.",
      contribution: [
        "Built a four-level spatial model: block, subchunk, chunk and region.",
        "Added sliding-window counters with a sustain period instead of a simple per-tick count.",
        "Made TPS scaling explicit and centralized so the same cap math is used at every scope.",
        "Kept quarantine manual after automatic quarantine proved too risky for operators.",
      ],
      architecture: [
        {
          title: "Record at every scope",
          body: "An activation increments the block, subchunk, chunk and region windows. If any parent scope is already blocked, the event returns immediately, so the cheap check happens before more work.",
        },
        {
          title: "Windows with memory",
          body: "A sliding window with a sustain period distinguishes a short burst from a circuit that keeps firing. Caps are evaluated against nanosecond timestamps, not a reset-every-tick counter.",
        },
        {
          title: "TPS scaling is deliberate",
          body: "When TPS degrades, the multiplier moves toward the configured minimum; when the server is healthy it can rise to the maximum. The direction is explicit in the policy class, not scattered through listeners.",
        },
        {
          title: "Observability over automatic action",
          body: "Observer physics are telemetry, not cancellable events. Quarantine is operator-only, and notifications are globally throttled with a bounded message cache.",
        },
      ],
      capabilities: [
        "Block, subchunk, chunk and region caps",
        "Sliding windows with sustain",
        "Per-material block limits",
        "TPS-aware multipliers",
        "Manual chunk quarantine",
        "Optional Redis cross-server notifications",
      ],
      facts: [
        { label: "Server", value: "Bukkit/Spigot; Folia flag declared" },
        { label: "Built against", value: "Spigot API 1.8.8" },
        { label: "Config version", value: "7" },
        { label: "Version checked", value: "3.0.3 build, 14 October 2026" },
        { label: "Source", value: "Private; public docs repository exists" },
        { label: "Changelog", value: "Latest dated entry is 3.0.2" },
      ],
      status: "Current build 3.0.3. The public changelog stops at 3.0.2, so 3.0.3 is a build version rather than a dated release note.",
      availability: "private",
      version: "3.0.3",
      checked: "2026-10-30",
      docs: ["/docs/redstonelimiter/overview.html", "/docs/redstonelimiter/configuration.html"],
      articles: ["/posts/redstone-limiter-sliding-windows.html"],
      related: ["entitylimiter", "flamespawners", "exploitfixer"],
      caveat:
        "The repository README is unedited boilerplate and is not used as documentation here. No performance claim is made without a controlled benchmark.",
    },
  },
  {
    id: "flamespawners",
    name: "FlameSpawners",
    category: "minecraft",
    kind: "Gameplay / Spawners",
    description:
      "Stacked-loot spawners with bounded production, storage, selling, XP, upgrades, holograms and an offline storage migration path.",
    url: "https://arkflame.com/plugins/",
    image: "/images/projects/flamespawners.webp",
    featured: false,
    docsHref: "/docs/flamespawners/overview.html",
    caseStudy: {
      tagline: "A spawner economy with backpressure.",
      problem:
        "Spawner plugins fail when production, storage and selling are treated as independent loops. A burst of drops becomes a burst of database writes, then a burst of lag, then a support ticket.",
      contribution: [
        "Built a batched production dispatcher with explicit per-pass ceilings.",
        "Added durable output modes and a pending-cycle cap instead of unbounded in-memory queues.",
        "Added YAML, SQLite and MySQL storage with queued flushes and an offline migration path.",
        "Kept the public API versioned and added a sell-price provider SPI.",
      ],
      architecture: [
        {
          title: "Batched production",
          body: "A 20-tick dispatcher processes a bounded number of spawners per pass and caps logical rolls. Large farms do not get to monopolize the tick.",
        },
        {
          title: "Backpressure is a feature",
          body: "Pending output and cycle caps prevent an offline or slow economy from growing an unbounded queue. The plugin would rather hold production than lose the server.",
        },
        {
          title: "Storage is restart-scoped",
          body: "Backend choice is restart-only. That avoids pretending a live migration is safe when the queue and the database need to agree on ordering.",
        },
      ],
      capabilities: [
        "Stacked-loot spawners",
        "Bounded production loop",
        "Storage, selling and XP",
        "Holograms and upgrades",
        "YAML / SQLite / MySQL backends",
        "API v3 and sell-price SPI",
      ],
      facts: [
        { label: "Server", value: "Bukkit/Spigot/Paper; Folia bridge" },
        { label: "API metadata", value: "api-version 1.13" },
        { label: "Java", value: "Java 8 bytecode" },
        { label: "Version checked", value: "1.0.6 build, 13 October 2026" },
        { label: "License", value: "Proprietary, all rights reserved" },
        { label: "Source", value: "Private" },
      ],
      status: "Current build 1.0.6. The changelog still marks 1.0.6 as unreleased, so no dated release claim is made.",
      availability: "private",
      version: "1.0.6",
      checked: "2026-10-30",
      docs: ["/docs/flamespawners/overview.html", "/docs/flamespawners/commands-permissions.html"],
      articles: ["/posts/flamespawners-bounded-production-loop.html"],
      related: ["entitylimiter", "redstonelimiter", "authmepremium"],
      caveat:
        "Folia support is a reflective scheduler bridge, not a recorded runtime certification. The license prohibits redistribution without permission.",
    },
  },
  {
    id: "authmepremium",
    name: "AuthMePremium",
    category: "minecraft",
    kind: "Authentication / Proxy bridge",
    description:
      "An authentication bridge for AuthMe networks, with a companion plugin path and an optional Velocity-native AuthMe 6 session path.",
    url: "https://arkflame.com/plugins/",
    image: "/images/projects/authmepremium.webp",
    featured: false,
    docsHref: "/docs/authmepremium/overview.html",
    caseStudy: {
      tagline: "Proxy authentication where trust boundaries are explicit.",
      problem:
        "Premium and cracked players enter through different identity paths. A proxy bridge that treats a matching token as proof of a UUID, or silently falls back when configuration is wrong, creates an account-takeover surface.",
      contribution: [
        "Built two explicit session bridges: a companion plugin-message path and a Velocity-native AuthMe 6 path.",
        "Made the native bridge fail closed on blank secrets, empty source/target lists or invalid retry settings.",
        "Separated proxy trust files from the bridge token instead of conflating them.",
        "Added YAML, MySQL and in-memory profile storage with TTL caches and UUID migration state.",
      ],
      architecture: [
        {
          title: "Two bridges, not a fallback chain",
          body: "Mode A uses the authmp plugin-message channel with the backend companion. Mode B uses AuthMe 6 native messages and is Velocity-only. Each can be configured and reasoned about independently.",
        },
        {
          title: "Fail closed on bad configuration",
          body: "A blank secret, empty server lists or invalid retry values disable the native bridge with a warning. The bridge does not log the secret and does not continue with partial trust.",
        },
        {
          title: "Proxy trust is separate",
          body: "Backend proxy approval is tracked in pending and allowed proxy files. A valid bridge token does not automatically approve a backend UUID.",
        },
      ],
      capabilities: [
        "Companion and native AuthMe bridges",
        "Premium / cracked routing",
        "UUID migration modes",
        "Proxy trust approval",
        "YAML / MySQL / memory profiles",
        "Bedrock auto-login support",
      ],
      facts: [
        { label: "Proxy", value: "Bungee-compatible or Velocity" },
        { label: "Backend", value: "Paper 1.21.11 build target; api-version 1.20" },
        { label: "Java", value: "Java 17 backends, Java 21 Velocity" },
        { label: "Version checked", value: "2.7.2" },
        { label: "License", value: "MIT package; source private" },
        { label: "Docs drift", value: "README still names 2.2.1-SNAPSHOT" },
      ],
      status: "Current build 2.7.2. Documentation in the repository lags the POM, so this page uses the POM version.",
      availability: "private",
      version: "2.7.2",
      checked: "2026-10-30",
      docs: ["/docs/authmepremium/overview.html", "/docs/authmepremium/configuration.html"],
      articles: ["/posts/authme-premium-session-trust.html"],
      related: ["flamecord", "veloflame", "exploitfixer"],
      caveat:
        "Mode B does not provide Bedrock completion, Vault groups or AuthMe 5.x support. The docs and shipped config disagree on the nickname bypass prefix, so neither is published here as a guarantee.",
    },
  },
  {
    id: "arkflame-studios",
    name: "ArkFlame Studios",
    category: "org",
    kind: "Organization",
    description: "Minecraft infrastructure, security, performance, networking and gameplay products.",
    url: links.arkflame,
    featured: false,
  },
];

export const featuredProjects: readonly Project[] = projects.filter((p) => p.featured);

export const projectById = (id: string): Project | undefined => projects.find((p) => p.id === id);

export const projectBySlug = (slug: string): Project | undefined =>
  projects.find((p) => p.id === slug);

export const caseStudyProjects: readonly Project[] = projects.filter((p) => p.caseStudy);

/** The four Minecraft products on the original homepage build. */
export const minecraftProjects: readonly Project[] = projects.filter(
  (p) => p.category === "minecraft",
);

export const gameProjects: readonly Project[] = projects.filter((p) => p.category === "game");

export const aiProjects: readonly Project[] = projects.filter(
  (p) => p.category === "ai" || p.category === "legal-ai",
);

export const desktopProjects: readonly Project[] = projects.filter(
  (p) => p.category === "desktop",
);

/** Homepage selection: four shipped products plus the FlameWM desktop project. */
export const homeWork: readonly Project[] = [
  "exploitfixer",
  "flamecord",
  "veloflame",
  "fairplay",
  "flamewm",
]
  .map((id) => projectById(id))
  .filter((p): p is Project => Boolean(p));
