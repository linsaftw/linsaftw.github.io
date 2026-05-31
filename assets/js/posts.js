window.LINSA_POSTS = [
  {
    "id": "linsaftw-minecraft-infrastructure-from-argentina",
    "slug": "linsaftw-minecraft-infrastructure-from-argentina",
    "title": "LinsaFTW: Minecraft infrastructure from Argentina",
    "caption": "A short overview of my path from Minecraft servers to ArkFlame, FlameCord, ExploitFixer, and infrastructure work.",
    "created_at": "2026-05-31T18:20:00-03:00",
    "updated_at": "2026-05-31T18:20:00-03:00",
    "image_path": "",
    "tags": [
      "linsaftw",
      "arkflame",
      "minecraft"
    ],
    "content_markdown": "I am Juan Cruz Linsalata, known online as LinsaFTW. Most of my work comes from the same place: running Minecraft servers, seeing real operational problems, and building tools to solve them.\n\nMinecraft was not only a game for me. It became the environment where I learned programming, server administration, community management, product support, and distribution. When you run a public server, you learn fast. Players break things. Bots attack. Plugins lag. Updates change behavior. Something that works in a test server can fail under real traffic.\n\nThat pressure shaped the way I build software. I care about security, performance, compatibility, and support because those are the things server owners feel immediately. If a proxy fails during a bot attack, the network goes down. If a packet exploit reaches the server process, the server crashes. If a plugin wastes CPU every tick, the player experience gets worse.\n\nArkFlame is the brand where I organize that work. FlameCord, ExploitFixer, VeloFlame, FlamePaper, FairPlay, and the newer systems are all part of the same direction: making Minecraft infrastructure safer, faster, and easier to run in production.\n\nI still write from the perspective of a builder, not from a corporate marketing voice. Some days are about low-level packet behavior. Some days are about landing pages, documentation, support, or product positioning. Some days are about energy, focus, health, and keeping the machine stable enough to keep building.\n\nThe goal is simple: build useful software, publish it clearly, support it properly, and keep improving the ecosystem."
  },
  {
    "id": "flamecord-and-the-proxy-layer",
    "slug": "flamecord-and-the-proxy-layer",
    "title": "FlameCord and the proxy layer",
    "caption": "Why proxy security became one of the core parts of my work in the Minecraft server ecosystem.",
    "created_at": "2026-05-30T15:00:00-03:00",
    "updated_at": "2026-05-30T15:00:00-03:00",
    "image_path": "",
    "tags": [
      "flamecord",
      "security",
      "minecraft"
    ],
    "content_markdown": "FlameCord started from a practical problem: Minecraft networks need a proxy layer that can survive real traffic, not only normal traffic.\n\nA BungeeCord or Waterfall proxy is not just a router. It is the first public surface of a network. Every ping, connection attempt, handshake, invalid state, bot wave, and weird client behavior reaches that layer first. If the proxy wastes too much work on bad traffic, the rest of the network pays the cost.\n\nThat is why FlameCord focuses on early rejection, anti-bot checks, anti-crash patches, anti-VPN behavior, and performance improvements. The point is not to add random features. The point is to reduce wasted CPU, block obvious abuse earlier, and give server owners a better baseline.\n\nThe proxy layer is also where a lot of support problems become visible. A user might report lag, but the real issue can be a plugin. Another user might report high CPU, but the real issue can be ping spam or connection abuse. A good workflow starts with evidence: profiler output, logs, traffic patterns, and exact reproduction.\n\nFlameCord became important to me because it represents the kind of product I like building: technical, practical, and directly tied to uptime. If it works, the owner feels it. If it fails, everyone feels it. That creates a high standard."
  },
  {
    "id": "exploitfixer-and-packet-security",
    "slug": "exploitfixer-and-packet-security",
    "title": "ExploitFixer and packet security",
    "caption": "A note on why server security needs to happen before bad packets become expensive server work.",
    "created_at": "2026-05-29T14:35:00-03:00",
    "updated_at": "2026-05-29T14:35:00-03:00",
    "image_path": "",
    "tags": [
      "exploitfixer",
      "packets",
      "security"
    ],
    "content_markdown": "ExploitFixer is built around a simple idea: a Minecraft server should not fully process malicious input before deciding it is malicious.\n\nCrash clients and exploit tools usually work by abusing edge cases. Oversized payloads, invalid NBT, strange inventory interactions, book data, map data, tab completion, custom payload spam, and other malformed inputs can become expensive if they reach the wrong part of the server.\n\nThe earlier the server rejects unsafe behavior, the better. That is why packet-level security matters. It is closer to the actual attack surface. It gives you a chance to stop the problem before it turns into lag, a crash, a dupe, or support chaos.\n\nFor me, ExploitFixer is not just another protection plugin. It is part of the ArkFlame security stack. FlameCord handles proxy-level threats. ExploitFixer handles server-side exploit paths. VeloFlame brings the same thinking to Velocity. FairPlay extends the work into competitive integrity.\n\nThe pattern is always the same: identify where the server wastes work, move the protection earlier, reduce false positives, keep compatibility, and make the result usable for real server owners."
  },
  {
    "id": "arkflame-studios-main-hub",
    "slug": "arkflame-studios-main-hub",
    "title": "ArkFlame Studios as the main hub",
    "caption": "ArkFlame is moving toward one clearer public identity for security, performance, gameplay systems, and server infrastructure.",
    "created_at": "2026-05-28T19:10:00-03:00",
    "updated_at": "2026-05-28T19:10:00-03:00",
    "image_path": "",
    "tags": [
      "arkflame",
      "business",
      "online-presence"
    ],
    "content_markdown": "ArkFlame should not look like a random collection of plugins. It should look like one infrastructure brand.\n\nThat is the direction I want: ArkFlame Studios as the main website and main public hub, with each product connected clearly. FlameCord for proxy security. ExploitFixer for exploit protection. VeloFlame for Velocity networks. FlamePaper for performance-focused server software. FairPlay for anticheat and competitive integrity. Other products should fit into the same system instead of floating around disconnected.\n\nGood software still needs good presentation. A product page has to explain the problem, the value, the use case, the proof, and the next action. Documentation has to reduce support. A personal site has to explain who I am and why the work exists. Social profiles have to point to the same identity.\n\nThis is not only design. It is distribution. If someone finds one project, they should understand the rest of the ecosystem. If someone knows LinsaFTW from Spigot, Reddit, GitHub, YouTube, BuiltByBit, or Modrinth, they should end up with a clear picture: Minecraft infrastructure, security, performance, and practical server engineering from Argentina.\n\nThat is the online presence I want to build."
  },
  {
    "id": "ai-assisted-coding-needs-standards",
    "slug": "ai-assisted-coding-needs-standards",
    "title": "AI-assisted coding still needs standards",
    "caption": "Using AI does not remove engineering responsibility. It makes specifications, tests, and review more important.",
    "created_at": "2026-05-27T17:40:00-03:00",
    "updated_at": "2026-05-27T17:40:00-03:00",
    "image_path": "",
    "tags": [
      "coding",
      "ai",
      "engineering"
    ],
    "content_markdown": "I do not think using AI tools makes someone less of a developer. Developers have been using completion, generators, templates, search, documentation, and automation for years. The tool changed. The responsibility did not.\n\nThe real issue is quality. If someone uses AI to generate bad code, ships it without understanding, and does not test it, the problem is not only AI. The problem is bad engineering discipline. The same person would probably ship bad manually written code too, just slower.\n\nFor Minecraft plugins, this matters a lot. A small mistake can become a crash, a dupe, a memory leak, a Folia thread issue, a false positive in an anticheat, or a performance problem under load. AI can speed up implementation, but it can also speed up mistakes if the specification is vague.\n\nThe workflow I prefer is strict. Define the bug. Point to files. State non-goals. Require real tests. Verify target APIs. Build. Inspect the diff. Run the server if needed. Read the logs. Then publish. The human still owns the result.\n\nI care less about whether code was typed by hand and more about whether the plugin works, performs well, is maintainable, and solves the actual problem for server owners."
  },
  {
    "id": "developer-health-and-output",
    "slug": "developer-health-and-output",
    "title": "Health issues can look like motivation problems",
    "caption": "A personal note on breathing, sleep, energy, and treating performance like an engineering problem.",
    "created_at": "2026-05-26T19:10:00-03:00",
    "updated_at": "2026-05-26T19:10:00-03:00",
    "image_path": "",
    "tags": [
      "personal",
      "health",
      "performance"
    ],
    "content_markdown": "For a long time I thought some problems were only discipline, attention, or motivation. Wake up tired, have trouble starting work, need too much force to begin, then blame yourself and try another routine. Gym, diet, meditation, productivity systems. Some of it helps, but not always enough.\n\nAt some point I started paying more attention to basic health variables. Breathing, sleep quality, nasal obstruction, digestion, blood pressure, food tolerance, caffeine, and how I actually feel after waking up. That changed the way I look at performance.\n\nI am not saying every attention problem is caused by sleep or breathing. That would be too simple. But I do think health problems can create symptoms that look like laziness or weak discipline from the outside. If sleep is not restorative, or digestion is constantly off, then the brain is not starting from a clean baseline.\n\nThe better approach is to treat it like debugging. Define the symptom. Collect evidence. Test one variable. Talk to specialists when needed. Do not invent a diagnosis from a post, but also do not ignore obvious signals from the body.\n\nThe goal is still to build, ship, and grow. The difference is that I want the machine to run correctly, not just force it until it breaks."
  }
];
