// C15 — canonical shape, verbatim from the frozen spec.
export const identity = {
  name: "Juan Cruz Linsalata",
  handle: "LinsaFTW",
  location: "Argentina",
  role: "Software developer",
  founderOf: "ArkFlame Studios",
  codingSince: 2010,
} as const;

export type Identity = typeof identity;

/** C9 — Person node. `alternateName` carries the handle ONLY (C9 explicit bug fix). */
export const personSchemaName = "LinsaFTW";
export const jobTitle = "Software Developer";

/** C7 — exact homepage description. Do not paraphrase. */
export const homeDescription =
  "LinsaFTW is Juan Cruz Linsalata, an Argentine software developer and founder of ArkFlame " +
  "Studios building Minecraft infrastructure, security systems, a Linux desktop, games and AI projects.";

/** C16 — exact H1 and lead for the homepage. */
export const homeH1 = "I make Minecraft infrastructure.";
export const homeH1Accent = "infrastructure.";

/** C16 — identity row under the banner. */
export const identityRow = `@${identity.handle} · ${identity.name} · ${identity.location}`;

/** C16 — banner caption. Retired filename captions are banned by C4. */
export const bannerCaption = "> coding since 2010";

/** C16 — terminal panel, verbatim. */
export const terminalLines: ReadonlyArray<readonly [prompt: string, output: string]> = [
  ["$ whoami", "linsaftw — founder, developer, operator"],
  ["$ ls ~/work", "arkflame  flamecord  exploitfixer  veloflame  fairplay  flamewm  ffaa  ark-ai  faus"],
  [
    "$ cat ~/stack",
    "java · paper · folia · bungeecord · velocity · packets · concurrency · typescript · rust · linux",
  ],
  ["$ uptime", "coding since 2010 · building for production systems"],
];

/** C16 — "How I work", 6 steps, verbatim. */
export const workSteps: ReadonlyArray<{ label: string; text: string }> = [
  { label: "Leadership", text: "Set the objective and constraints." },
  { label: "Organizing", text: "Turn ambiguity into executable work." },
  { label: "Planning", text: "Find the critical path." },
  { label: "Developing", text: "Build and verify." },
  { label: "Translating", text: "Turn client needs into technical requirements." },
  { label: "Delivering", text: "Ship under real constraints." },
];

/** C16 — stack chips. */
export const stackItems: readonly string[] = [
  "Java",
  "Bukkit/Paper/Folia",
  "BungeeCord/Velocity",
  "Packet protocols",
  "Concurrency",
  "Profiling",
  "Security",
  "TypeScript",
  "Linux",
];

/** C16 — section eyebrow labels. */
export const sections = {
  build: { id: "build", eyebrow: "Minecraft plugins", right: "Top LinsaFTW plugins", viewAll: "/work.html" },
  how: { id: "how", eyebrow: "How I work", right: "Lead → Deliver" },
  games: { id: "games", eyebrow: "Video games", right: "Multiplayer · Co-op · Survival", viewAll: "/games.html" },
  ai: { id: "ai", eyebrow: "AI systems", right: "Providers · Detection · Research", viewAll: "/ai.html" },
  lab: {
    id: "lab",
    eyebrow: "Experiments",
    right: "Built to find out if they should exist",
    viewAll: "/experiments.html",
  },
  timeline: { id: "timeline", eyebrow: "Timeline", right: "Journey milestones" },
} as const;

export type SectionId = (typeof sections)[keyof typeof sections]["id"];

export const sectionIds: readonly SectionId[] = [
  sections.build.id,
  sections.how.id,
  sections.games.id,
  sections.ai.id,
  sections.lab.id,
  sections.timeline.id,
];
