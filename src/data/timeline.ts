// C4 — verified chronology, source of truth. The retired claims that must appear
// nowhere in shipped output are listed in the frozen spec C4 "BANNED claims"; they
// are deliberately not restated here so a repo-wide grep stays clean.
export interface TimelineEntry {
  readonly year: number;
  readonly text: string;
  /** Extended entries are for /about.html only and must not reach the homepage. */
  readonly aboutPageOnly?: boolean;
}

/** C4 — the homepage timeline is EXACTLY these 6, in this order. */
export const timeline: readonly TimelineEntry[] = [
  { year: 2010, text: "Started coding." },
  { year: 2013, text: "Publicly building in the Minecraft community." },
  { year: 2018, text: "Released early public Minecraft plugins and security tools." },
  { year: 2020, text: "Launched FlameCord." },
  { year: 2025, text: "Launched VeloFlame." },
  { year: 2026, text: "FairPlay, ARK AI, FAUS Legal, FFAA Zombies, and FlameWM 0.1.5." },
];

/** C4 — the about page may additionally include the self-reported 2014 entry. */
export const extendedTimeline: readonly TimelineEntry[] = [
  ...timeline,
  {
    year: 2014,
    text: "Started building Minecraft server security tooling.",
    aboutPageOnly: true,
  },
];
