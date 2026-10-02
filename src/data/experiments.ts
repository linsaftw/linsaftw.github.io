// C6 — user-confirmed 2026-10-01. Both are real but local and never published.
// No URLs exist, so `url` is undefined and no link may be rendered. Never invent one.
export interface Experiment {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly status: "EXPERIMENT";
  readonly url: undefined;
  readonly published: false;
}

export const experiments: readonly Experiment[] = [
  {
    id: "flamemc",
    name: "FlameMC",
    description: "Asynchronous Paper fork.",
    category: "Paper fork",
    status: "EXPERIMENT",
    url: undefined,
    published: false,
  },
  {
    id: "apex",
    name: "Apex",
    description: "Asynchronous, high-performance anti-ESP.",
    category: "Anti-ESP",
    status: "EXPERIMENT",
    url: undefined,
    published: false,
  },
];

/** C6 — honest note shown alongside the rows. No status beyond EXPERIMENT. */
export const experimentsIntro =
  "Things I build to test an idea, solve a problem, or learn whether something should exist.";

export const experimentsNote =
  "Both of these are unpublished local experiments. There is no public build and no public link yet.";
