// C3 — the ONLY allowed external URLs. Nothing in markup may hardcode one of these;
// always import from here. Domain-root-only links (no path segment) are banned by C3.
export const links = {
  github: "https://github.com/linsaftw",
  githubOrg: "https://github.com/ArkFlame",
  arkflame: "https://arkflame.com/",
  bbbCreator: "https://builtbybit.com/creators/linsaftw.152552/",
  youtube: "https://www.youtube.com/@LinsaFTW",
  x: "https://x.com/LinsaFTW",
  modrinth: "https://modrinth.com/user/LinsaFTW",
  linkedin: "https://ar.linkedin.com/in/linsaftw",
  flamecord: "https://flamecord.com/",
  exploitfix: "https://exploitfixer.org/",
  veloflame: "https://veloflame.com/",
  fairplay: "https://builtbybit.com/resources/fairplay-combat-anticheat.111265/",
  ffaa: "https://ffaa.arkflame.com/",
  arkAi: "https://ai.arkflame.com/",
  faus: "https://faus.arkflame.com/",
  flamecordBb: "https://builtbybit.com/resources/flamecord-ultimate-anti-bot-solution.13492/",
  exploitfixBb: "https://builtbybit.com/resources/exploitfixer-anti-crash-dupe-plugin.26463/",
  veloflameBb: "https://builtbybit.com/resources/veloflame-secure-minecraft-proxy.80990/",
} as const;

export type LinkName = keyof typeof links;

/** C3 — canonical sameAs profile set for the Person node (C9). */
export const personProfileLinks = [
  links.github,
  links.arkflame,
  links.x,
  links.youtube,
  links.modrinth,
  links.bbbCreator,
  links.linkedin,
] as const;

export const SITE_URL = "https://linsaftw.arkflame.com";

/** C7 — the only routes the site publishes. */
export const routes = {
  home: "/",
  work: "/work.html",
  games: "/games.html",
  ai: "/ai.html",
  experiments: "/experiments.html",
  about: "/about.html",
  articles: "/articles.html",
  notFound: "/404.html",
} as const;

export const postPath = (slug: string): string => `/posts/${slug}.html`;
