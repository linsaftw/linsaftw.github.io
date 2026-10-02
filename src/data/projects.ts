import { links } from "./links";

export type ProjectCategory = "minecraft" | "game" | "ai" | "legal-ai" | "org" | "experiment";

export interface Project {
  readonly id: string;
  readonly name: string;
  readonly category: ProjectCategory;
  readonly description: string;
  readonly url: string;
  readonly image?: string;
  /** ISO date, or year-only where C4 forbids a day/month (FFAA Zombies). */
  readonly publicLaunch?: string;
  readonly launchConfidence?: "verified" | "verified-by" | "self-reported";
  readonly featured: boolean;
  /** Human-facing category label, e.g. "Security / Anti-exploit". */
  readonly kind: string;
  readonly disclaimer?: string;
  readonly platforms?: readonly string[];
}

// C5 — copy is verbatim and approved. Do not "improve" it.
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
    // C4: year only — never a day or month.
    publicLaunch: "2026",
    launchConfidence: "self-reported",
    featured: true,
    platforms: ["Browser", "Windows", "Linux", "Android", "Multiplayer"],
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
  },
  {
    id: "faus-legal",
    name: "FAUS Legal",
    category: "legal-ai",
    kind: "Legal AI",
    description: "AI-assisted legal research and case organization for Argentine legal work.",
    url: links.faus,
    // C5: FAUS must carry the disclaimer that it does not replace a lawyer.
    disclaimer:
      "FAUS Legal is a research and organization aid. It does not replace a licensed lawyer and is not legal advice.",
    featured: false,
  },
];

export const featuredProjects: readonly Project[] = projects.filter((p) => p.featured);

export const projectById = (id: string): Project | undefined =>
  projects.find((p) => p.id === id);

/** C16 — the four Minecraft products under #build. */
export const minecraftProjects: readonly Project[] = projects.filter(
  (p) => p.category === "minecraft",
);

/** C16 — #games. */
export const gameProjects: readonly Project[] = projects.filter((p) => p.category === "game");

/** C16 — #ai. */
export const aiProjects: readonly Project[] = projects.filter(
  (p) => p.category === "ai" || p.category === "legal-ai",
);
