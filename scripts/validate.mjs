#!/usr/bin/env node
/**
 * scripts/validate.mjs — C13 acceptance gate for the built `dist/` tree.
 *
 * Dependency-free (bare Node, no `node_modules` imports) so it can run as the last
 * step of the Pages workflow and of `npm run validate`.
 *
 *   node scripts/validate.mjs [<distRoot>]
 *   node scripts/validate.mjs --dist <distRoot>
 *
 * Collects EVERY failure, prints them all, exits 1 if any check failed. Warnings never
 * fail the run. Never throws on malformed input: per-file parsing is wrapped and a parse
 * error is recorded as a failure for that file so one bad page cannot hide the rest.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve as resolvePath } from "node:path";

/* ------------------------------------------------------------------ constants */

const SITE = "https://linsaftw.arkflame.com";
const CNAME_VALUE = "linsaftw.arkflame.com";
const SITEMAP_URL = `${SITE}/sitemap.xml`;

/** C14 — the exact 16 migrated article slugs. */
const SLUGS = [
  "ai-assisted-coding-needs-standards",
  "ai-coding-agents-for-minecraft-plugin-development",
  "arkflame-product-ecosystem-for-minecraft-infrastructure",
  "arkflame-studios-main-hub",
  "builtbybit-creators-need-support-operations",
  "developer-health-and-output",
  "exploitfixer-and-packet-security",
  "flamecord-and-the-proxy-layer",
  "folia-support-is-a-threading-discipline",
  "linsaftw-minecraft-infrastructure-from-argentina",
  "linsaftw-persona-builder-operator-infrastructure-founder",
  "minecraft-performance-work-is-customer-support",
  "minecraft-plugin-compatibility-is-product-quality",
  "minecraft-server-security-starts-at-the-edge",
  "packetevents-anticheat-proof-over-vibes",
  "velocity-bungeecord-and-proxy-trust-boundaries",
];

/** C11 — every URL that must still resolve after the build. */
const STATIC_FILES = [
  "/index.html",
  "/about.html",
  "/work.html",
  "/games.html",
  "/ai.html",
  "/experiments.html",
  "/articles.html",
  "/404.html",
  "/robots.txt",
  "/sitemap.xml",
  "/CNAME",
  "/favicon.ico",
  "/manifest.webmanifest",
  "/llms.txt",
  "/llms-full.txt",
  "/index.html.md",
  "/about.html.md",
  // C11 legacy image shims.
  "/assets/images/banner.webp",
  "/assets/images/profile-picture.webp",
  "/assets/images/bbb-top.webp",
  // C10 production imagery.
  "/images/hero/early-computer.webp",
  "/images/profile/linsaftw.webp",
  "/images/badges/builtbybit-top-creator.webp",
  "/images/projects/exploitfixer.webp",
  "/images/projects/flamecord.webp",
  "/images/projects/veloflame.webp",
  "/images/projects/fairplay.webp",
  "/images/projects/ffaa-zombies.webp",
  "/images/projects/ark-ai.webp",
];

/** C11 line 1 — the 7 non-article pages that must be sitemap entries. */
const SITEMAP_REQUIRED = [
  "/",
  "/about.html",
  "/work.html",
  "/games.html",
  "/ai.html",
  "/experiments.html",
  "/articles.html",
];

/**
 * C13.10 year/chronology bans apply to the marketing + machine-readable pages only.
 * Article bodies are migrated verbatim (C14: "Do not rewrite"), so a year inside an
 * article is reported informationally instead of failing the gate.
 */
const NON_ARTICLE_PAGES = new Set([
  "/index.html",
  "/about.html",
  "/work.html",
  "/games.html",
  "/ai.html",
  "/experiments.html",
  "/articles.html",
  "/404.html",
  "/robots.txt",
  "/llms.txt",
  "/llms-full.txt",
]);

/** Banned verbatim anywhere in `dist/` (C13.10 + C3 + C4). */
const BANNED_PHRASES = [
  "hello_world",
  "2023 VeloFlame",
  "2024 FairPlay",
  "2023 Velocity",
  "2025 Top Creator",
  "Years of server problems turned into",
  "neural-network detection",
  "fully neural-network-powered",
  "fairplay.arkflame.com",
  "WAVE 07",
];

/** Chronology claims. Scoped to NON_ARTICLE_PAGES, with `alt="..."` values excluded. */
const BANNED_CHRONOLOGY = ["2015", "2023", "2024", "Top Creator", "CEO"];

/** Bare-domain link bans (C3). Only illegal with no path after the origin. */
const BARE_DOMAINS = ["https://github.com/", "https://builtbybit.com/"];

const TEXT_EXT = new Set([".html", ".md", ".txt", ".xml", ".webmanifest", ".json", ".css"]);
const SKIP_DIRS = new Set([".git", "node_modules", ".astro", ".cache"]);

/* --------------------------------------------------------------- tiny helpers */

const exists = (p) => {
  try {
    return existsSync(p);
  } catch {
    return false;
  }
};
const isFile = (p) => {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
};
const isDir = (p) => {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
};
const readText = (p) => readFileSync(p, "utf8");

/** Deterministic recursive walk; returns absolute paths sorted by POSIX-ish path. */
function walk(root) {
  const out = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      out.push({ file: dir, unreadable: err });
      continue;
    }
    for (const e of entries) {
      if (e.isDirectory() && SKIP_DIRS.has(e.name)) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        stack.push(full);
      } else {
        out.push({ file: full, unreadable: null });
      }
    }
  }
  return out.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));
}

/** dist-absolute file -> site path with forward slashes. */
const sitePath = (root, file) => `/${root === file ? "" : file.slice(root.length + 1)}`.replace(/\\/g, "/");

const ATTR = (name, global = false) =>
  new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, global ? "gi" : "i");

function attr(tag, name) {
  const m = ATTR(name).exec(tag);
  if (!m) return null;
  return m[1] ?? m[2] ?? m[3] ?? null;
}
const hasAttr = (tag, name) => new RegExp(`\\s${name}(?=[\\s=/>])`, "i").test(tag);

const stripAlt = (html) => html.replace(ATTR("alt", true), 'alt=""');
const stripUrlAttrs = (html) =>
  html.replace(ATTR("href", true), 'data-href=""').replace(ATTR("src", true), 'data-src=""');

function snippetAround(text, needle, radius = 34) {
  const i = text.indexOf(needle);
  if (i === -1) return needle;
  const a = Math.max(0, i - radius);
  const b = Math.min(text.length, i + needle.length + radius);
  return `${a > 0 ? "…" : ""}${text.slice(a, b).replace(/\s+/g, " ")}${b < text.length ? "…" : ""}`;
}

/** All attribute values of `href`/`src` in a chunk of HTML. */
function urlAttrs(html) {
  const out = [];
  const re = new RegExp(`\\b(href|src)\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "gi");
  let m;
  while ((m = re.exec(html)) !== null) {
    const value = m[2] ?? m[3] ?? m[4] ?? "";
    out.push({ name: m[1].toLowerCase(), value, index: m.index });
  }
  return out;
}

const allTags = (html, tag) => {
  const out = [];
  const re = new RegExp(`<${tag}\\b[^>]*>`, "gi");
  let m;
  while ((m = re.exec(html)) !== null) out.push({ raw: m[0], index: m.index });
  return out;
};

const ids = (html) => {
  const set = new Set();
  const re = new RegExp(`\\bid\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "gi");
  let m;
  while ((m = re.exec(html)) !== null) set.add(m[1] ?? m[2] ?? "");
  return set;
};

const headerSpans = (html) => {
  const spans = [];
  const re = /<header\b[^>]*>[\s\S]*?<\/header>/gi;
  let m;
  while ((m = re.exec(html)) !== null) spans.push([m.index, m.index + m[0].length]);
  return spans;
};

/** Minimal but real XML well-formedness: balanced, correctly nested tags. */
function xmlWellFormed(src) {
  const stack = [];
  const re =
    /<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<!DOCTYPE[^>]*>|<\/([A-Za-z_][\w.:-]*)\s*>|<([A-Za-z_][\w.:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    if (m[1]) {
      const top = stack.pop();
      if (top !== m[1]) return `closing </${m[1]}> does not match <${top ?? "nothing"}>`;
    } else if (m[2]) {
      if (!m[4]) stack.push(m[2]);
    }
  }
  if (stack.length) return `unclosed <${stack.join("> <")}>`;
  if (!/<urlset\b/.test(src)) return "no <urlset> root element";
  return null;
}

/* --------------------------------------------------------------- check runner */

const checks = [];
function check(name, fn) {
  const rec = { name, failures: [], warnings: [], notes: [] };
  checks.push(rec);
  try {
    fn(rec);
  } catch (err) {
    rec.failures.push(`validator internal error in check "${name}": ${err?.message ?? err}`);
  }
  rec.failures.sort();
  rec.warnings.sort();
  rec.notes.sort();
}
const fail = (rec, msg) => rec.failures.push(msg);
const warn = (rec, msg) => rec.warnings.push(msg);

/* ------------------------------------------------------------------- arg parse */

const argv = process.argv.slice(2);
let distArg = "dist";
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--dist") distArg = argv[++i] ?? "dist";
  else if (a.startsWith("--dist=")) distArg = a.slice(7);
  else if (!a.startsWith("-")) distArg = a;
}
const DIST = resolvePath(distArg || "dist");

/* ----------------------------------------------------------------- preflight */

if (!exists(DIST)) {
  console.error(`\n  validate: dist/ not found at ${DIST}`);
  console.error("  validate: run `npm run build` (or `npm run validate` after it) first.\n");
  process.exit(1);
}
if (!isDir(DIST)) {
  console.error(`\n  validate: ${DIST} exists but is not a directory.\n`);
  process.exit(1);
}

const ALL = walk(DIST);
const UNREADABLE = ALL.filter((e) => e.unreadable).map((e) => e.file);
const FILES = ALL.filter((e) => !e.unreadable).map((e) => e.file);
const HTML_FILES = FILES.filter((f) => f.toLowerCase().endsWith(".html"));
const TEXT_FILES = FILES.filter((f) => {
  const dot = f.lastIndexOf(".");
  return dot !== -1 && TEXT_EXT.has(f.slice(dot).toLowerCase());
});

/** Parse every HTML page once, per-file errors isolated. */
const PAGES = new Map(); // sitePath -> { html, path, err }
for (const file of HTML_FILES) {
  const path = sitePath(DIST, file);
  try {
    PAGES.set(path, { html: readText(file), path, file });
  } catch (err) {
    PAGES.set(path, { html: null, path, file, err });
  }
}
const pagePaths = [...PAGES.keys()].sort();
const parseFail = (rec, p) => fail(rec, `${p}: cannot parse (${PAGES.get(p).err?.message ?? "unreadable"})`);

/* ------------------------------------------------------------ 1. output exists */

check("1. C11 output existence", (rec) => {
  for (const p of STATIC_FILES) {
    if (!isFile(join(DIST, p.slice(1)))) fail(rec, `missing ${p}`);
  }
  for (const slug of SLUGS) {
    for (const suffix of [".html", ".html.md"]) {
      const p = `/posts/${slug}${suffix}`;
      if (!isFile(join(DIST, p.slice(1)))) fail(rec, `missing ${p}`);
    }
  }
  const cname = join(DIST, "CNAME");
  if (isFile(cname)) {
    let raw = "";
    try {
      raw = readText(cname);
    } catch (err) {
      fail(rec, `CNAME unreadable: ${err?.message ?? err}`);
    }
    const value = raw.replace(/^\uFEFF/, "").replace(/\r?\n$/, "");
    if (value !== CNAME_VALUE) fail(rec, `CNAME content is ${JSON.stringify(value)}, expected ${JSON.stringify(CNAME_VALUE)}`);
  }
  // C14: exactly the 16 slugs — no missing, no extra.
  const postDir = join(DIST, "posts");
  if (!exists(postDir)) {
    fail(rec, "missing directory /posts/");
  } else {
    for (const suffix of [".html", ".html.md"]) {
      const found = readdirSync(postDir)
        .filter((n) => n.endsWith(suffix))
        .map((n) => n.slice(0, -suffix.length))
        .sort();
      const want = [...SLUGS].sort();
      for (const s of want) if (!found.includes(s)) fail(rec, `slug missing from /posts/*${suffix}: ${s}`);
      for (const s of found) if (!want.includes(s)) fail(rec, `unexpected slug in /posts/*${suffix}: ${s}`);
    }
  }
  for (const f of UNREADABLE) fail(rec, `unreadable path: ${sitePath(DIST, f)}`);
});

/* ---------------------------------------------------- 2. broken internal links */

/** Resolve a root-relative URL against dist/; returns the existing file or null. */
function resolveInDist(urlPath) {
  let clean;
  try {
    clean = decodeURIComponent(urlPath.split("#")[0].split("?")[0]);
  } catch {
    return null;
  }
  if (clean.includes("\0")) return null;
  const candidates = [];
  if (clean === "" || clean === "/") {
    candidates.push("/index.html");
  } else {
    if (!clean.startsWith("/")) return null;
    const norm = clean.replace(/\/{2,}/g, "/").replace(/\/+$/, "");
    candidates.push(norm);
    if (norm.endsWith("/index.html") === false) {
      candidates.push(`${norm}.html`, `${norm}/index.html`);
    }
  }
  for (const c of candidates) {
    if (c.includes("..")) continue;
    const abs = join(DIST, c.slice(1));
    if (isFile(abs)) return { file: abs, path: c };
  }
  return null;
}

const IGNORED_SCHEME = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

const decodeSafe = (s) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

check("2. internal links resolve", (rec) => {
  for (const p of pagePaths) {
    const { html } = PAGES.get(p);
    if (html === null) {
      parseFail(rec, p);
      continue;
    }
    for (const { name, value } of urlAttrs(html)) {
      if (value === "") continue; // check 3 owns empty attributes
      if (IGNORED_SCHEME.test(value)) continue; // http(s)/mailto/tel/data/protocol-relative
      if (!value.startsWith("/") && !value.startsWith("#")) continue; // relative links are out of scope
      if (value === "#") {
        fail(rec, `${p}: ${name}="#" is a placeholder (see check 3)`);
        continue;
      }
      const [beforeHash, ...restFrag] = value.split("#");
      const fragment = restFrag.length ? restFrag.join("#") : null;
      if (beforeHash === "") {
        // pure #fragment — the target page is this page
        if (fragment && !ids(html).has(decodeSafe(fragment))) {
          fail(rec, `${p}: ${name}="${value}" — no element with id="${fragment}" on this page`);
        }
        continue;
      }
      const hit = resolveInDist(value);
      if (!hit) {
        fail(rec, `${p}: ${name}="${value}" does not resolve to a file in dist/`);
        continue;
      }
      if (fragment) {
        let targetHtml = null;
        if (hit.path.endsWith(".html")) {
          const t = PAGES.get(hit.path);
          if (t && t.html !== null) targetHtml = t.html;
        }
        if (targetHtml === null) {
          try {
            targetHtml = readText(hit.file);
          } catch {
            targetHtml = null;
          }
        }
        if (targetHtml === null) continue; // non-HTML target: nothing to anchor into
        if (!ids(targetHtml).has(decodeSafe(fragment))) {
          fail(rec, `${p}: ${name}="${value}" — target ${hit.path} has no element with id="${fragment}"`);
        }
      }
    }
  }
});

/* ------------------------------------------------------------ 3. no placeholders */

check("3. no placeholder href/src", (rec) => {
  for (const file of TEXT_FILES) {
    const p = sitePath(DIST, file);
    let text;
    try {
      text = readText(file);
    } catch (err) {
      fail(rec, `${p}: unreadable (${err?.message ?? err})`);
      continue;
    }
    for (const { name, value } of urlAttrs(text)) {
      if (value === "#" || value === "") {
        fail(rec, `${p}: ${name}="${value}" — ${snippetAround(text, `${name}="${value}"`)}`);
      }
    }
  }
});

/* ------------------------------------------------------------------ 4. no base64 */

check("4. no base64 / data:image payloads", (rec) => {
  for (const file of HTML_FILES) {
    const p = sitePath(DIST, file);
    const { html } = PAGES.get(p);
    if (html === null) {
      parseFail(rec, p);
      continue;
    }
    for (const needle of ["data:image", "base64,"]) {
      if (html.includes(needle)) fail(rec, `${p}: contains ${JSON.stringify(needle)} — ${snippetAround(html, needle)}`);
    }
  }
});

/* ---------------------------------------------------------- 5. heading hierarchy */

check("5. heading hierarchy", (rec) => {
  for (const p of pagePaths) {
    const { html } = PAGES.get(p);
    if (html === null) {
      parseFail(rec, p);
      continue;
    }
    const levels = allTags(html, "h[1-6]")
      .map((t) => Number(/^<h([1-6])\b/i.exec(t.raw)[1]))
      .filter((n) => Number.isInteger(n));
    const h1s = levels.filter((l) => l === 1).length;
    if (h1s !== 1) fail(rec, `${p}: expected exactly one <h1>, found ${h1s}`);
    levels.forEach((l, i) => {
      if (l === 3 && !levels.slice(0, i).includes(2)) {
        fail(rec, `${p}: <h3> at position ${i + 1} appears before any <h2>`);
      }
    });
    let prev = levels[0] ?? 1;
    levels.forEach((l, i) => {
      if (i > 0 && l > prev + 1) fail(rec, `${p}: heading level skips h${prev} -> h${l} (position ${i + 1})`);
      prev = l;
    });
  }
});

/* ------------------------------------------------------- 6. canonical + head SEO */

const metaCount = (html, kind, key) => {
  const re = new RegExp(`<meta\\b[^>]*\\b${kind}\\s*=\\s*(?:"${key}"|'${key}'|${key})[^>]*>`, "gi");
  return (html.match(re) ?? []).length;
};

check("6. canonical + head tags", (rec) => {
  if (pagePaths.length === 0) {
    fail(rec, "no HTML pages found in dist/ — the build produced no pages, so nothing below can be verified");
    return;
  }
  for (const p of pagePaths) {
    const { html } = PAGES.get(p);
    if (html === null) {
      parseFail(rec, p);
      continue;
    }
    const expectedPath = p === "/index.html" ? "/" : p;
    const expected = `${SITE}${expectedPath}`;
    const canonicals = allTags(html, "link").filter((t) => (attr(t.raw, "rel") ?? "").toLowerCase().split(/\s+/).includes("canonical"));
    if (canonicals.length !== 1) {
      fail(rec, `${p}: expected exactly one <link rel="canonical">, found ${canonicals.length}`);
    } else {
      const href = attr(canonicals[0].raw, "href");
      if (href !== expected) fail(rec, `${p}: canonical href is ${JSON.stringify(href)}, expected ${JSON.stringify(expected)}`);
    }
    const required = [
      ["exactly one <title>", allTags(html, "title").length, 1],
      ["exactly one meta[name=description]", metaCount(html, "name", "description"), 1],
      ["exactly one meta[property=og:title]", metaCount(html, "property", "og:title"), 1],
      ["exactly one meta[property=og:description]", metaCount(html, "property", "og:description"), 1],
      ["exactly one meta[property=og:url]", metaCount(html, "property", "og:url"), 1],
      ["exactly one meta[name=twitter:card]", metaCount(html, "name", "twitter:card"), 1],
    ];
    for (const [label, got, want] of required) {
      if (got !== want) fail(rec, `${p}: expected ${label}, found ${got}`);
    }
  }
});

/* ------------------------------------------------------------------ 7. images */

let heroCount = 0;
const imageCount = { total: 0, noLoading: 0 };

check("7. img alt/width/height", (rec) => {
  for (const p of pagePaths) {
    const { html } = PAGES.get(p);
    if (html === null) {
      parseFail(rec, p);
      continue;
    }
    const imgs = allTags(html, "img");
    const headers = headerSpans(html);
    imgs.forEach((t, i) => {
      imageCount.total++;
      const where = `${p} <img> #${i + 1}`;
      const alt = attr(t.raw, "alt");
      if (alt === null || alt.trim() === "") {
        if (attr(t.raw, "aria-hidden") === null) {
          fail(rec, `${where}: missing or empty alt`);
        }
      }
      const w = attr(t.raw, "width");
      const h = attr(t.raw, "height");
      if (w === null || !/^\d+$/.test(w.trim())) fail(rec, `${where}: missing/invalid width (${JSON.stringify(w)})`);
      if (h === null || !/^\d+$/.test(h.trim())) fail(rec, `${where}: missing/invalid height (${JSON.stringify(h)})`);
      if (hasAttr(t.raw, "fetchpriority") && (attr(t.raw, "fetchpriority") ?? "").toLowerCase() === "high") {
        heroCount++;
        if (heroCount > 1) fail(rec, `${where}: fetchpriority="high" — only the hero may have it (${heroCount} so far)`);
      }
      // WARNING only: approximate below-the-fold as "not in <header>, not the first <img>".
      const inHeader = headers.some(([a, b]) => t.index >= a && t.index < b);
      if (i > 0 && !inHeader && !hasAttr(t.raw, "loading")) {
        imageCount.noLoading++;
        warn(rec, `${where}: below the fold (approx) but has no loading attribute`);
      }
    });
  }
});

/* ----------------------------------------------------------------- 8. sitemap */

check("8. sitemap.xml", (rec) => {
  const file = join(DIST, "sitemap.xml");
  if (!isFile(file)) {
    fail(rec, "missing /sitemap.xml");
    return;
  }
  let xml;
  try {
    xml = readText(file);
  } catch (err) {
    fail(rec, `sitemap.xml unreadable: ${err?.message ?? err}`);
    return;
  }
  const bad = xmlWellFormed(xml);
  if (bad) fail(rec, `sitemap.xml is not well-formed XML: ${bad}`);

  const locs = [...xml.matchAll(/<loc>\s*([^<]*?)\s*<\/loc>/g)].map((m) => m[1].trim());
  if (locs.length === 0) fail(rec, "sitemap.xml has no <loc> entries");

  const normalized = locs.map((l) => {
    try {
      return new URL(l).pathname;
    } catch {
      return l;
    }
  });

  for (const want of SITEMAP_REQUIRED) {
    if (!normalized.includes(want)) fail(rec, `sitemap.xml has no <loc> for ${want}`);
  }
  for (const slug of SLUGS) {
    const want = `/posts/${slug}.html`;
    if (!normalized.includes(want)) fail(rec, `sitemap.xml has no <loc> for ${want}`);
  }

  for (const loc of locs) {
    const low = loc.toLowerCase();
    for (const banned of [".md", "/admin", "/login", "/register", "post.html"]) {
      if (low.includes(banned)) fail(rec, `sitemap.xml must not list ${JSON.stringify(loc)} (matches ${JSON.stringify(banned)})`);
    }
    let pathname;
    try {
      pathname = new URL(loc).pathname;
    } catch {
      fail(rec, `sitemap.xml <loc> is not an absolute URL: ${JSON.stringify(loc)}`);
      continue;
    }
    if (pathname !== "/" && !pathname.endsWith(".html")) {
      fail(rec, `sitemap.xml <loc> ${JSON.stringify(loc)} lost its .html extension (build.format is "file")`);
    }
    if (!resolveInDist(pathname)) fail(rec, `sitemap.xml <loc> ${JSON.stringify(loc)} does not resolve to a file in dist/`);
  }

  if (!normalized.includes("/")) fail(rec, `sitemap.xml root <loc> missing (expected ${SITE}/)`);
  if (!locs.includes(`${SITE}/`)) fail(rec, `root <loc> is not exactly ${JSON.stringify(`${SITE}/`)}`);

  const robots = join(DIST, "robots.txt");
  if (!isFile(robots)) {
    fail(rec, "missing /robots.txt");
  } else {
    let txt = "";
    try {
      txt = readText(robots);
    } catch (err) {
      fail(rec, `robots.txt unreadable: ${err?.message ?? err}`);
    }
    if (!txt.includes(SITEMAP_URL)) fail(rec, `robots.txt does not reference ${SITEMAP_URL}`);
  }
});

/* -------------------------------------------------------- 9. banned content scan */

check("9. banned content scan", (rec) => {
  const articleYearNotes = [];
  for (const file of TEXT_FILES) {
    const p = sitePath(DIST, file);
    let text;
    try {
      text = readText(file);
    } catch (err) {
      fail(rec, `${p}: unreadable (${err?.message ?? err})`);
      continue;
    }
    const noAlt = stripAlt(text);

    for (const needle of BANNED_PHRASES) {
      if (noAlt.includes(needle)) fail(rec, `${p}: banned token ${JSON.stringify(needle)} — ${snippetAround(text, needle)}`);
    }

    /*
     * Bare-domain bans (C3). Scoped to href/src ATTRIBUTE VALUES in .html files only.
     * A bare `href="https://github.com/"` is a real navigational defect, but the same
     * string as prose in a .txt/.md file is a legitimate full canonical URL
     * (e.g. /llms.txt listing https://github.com/linsaftw), so scanning raw text of
     * every dist/ file produced false positives. HTML attribute values are still
     * checked at full strength: an exact bare origin fails, a path-bearing one passes.
     */
    if (p.toLowerCase().endsWith(".html")) {
      for (const { name, value } of urlAttrs(text)) {
        for (const needle of BARE_DOMAINS) {
          if (value === needle || value === needle.slice(0, -1)) {
            fail(rec, `${p}: ${name}="${value}" is a bare domain with no path`);
          }
        }
      }
    }

    // Chronology bans: the C13.10 list of non-article pages, plus every other
    // non-article HTML page. Article pages (C14: bodies are verbatim) are reported
    // informationally instead of failing the gate.
    const isArticlePage = p.startsWith("/posts/") && !p.endsWith(".html.md");
    const chronoScoped = NON_ARTICLE_PAGES.has(p) || (!p.startsWith("/posts/") && p.toLowerCase().endsWith(".html"));
    if (chronoScoped) {
      for (const needle of BANNED_CHRONOLOGY) {
        if (noAlt.includes(needle)) {
          fail(rec, `${p}: chronology token ${JSON.stringify(needle)} — ${snippetAround(text, needle)}`);
        }
      }
    } else if (isArticlePage) {
      for (const needle of BANNED_CHRONOLOGY) {
        if (noAlt.includes(needle)) {
          articleYearNotes.push(`${p}: ${JSON.stringify(needle)} (article body, informational — C14 bodies are verbatim)`);
        }
      }
    }
  }
  for (const n of [...new Set(articleYearNotes)].sort()) rec.notes.push(n);
});

/* ------------------------------------------------------------- 10. zero client JS */

let jsonLdBytes = 0;

check("10. zero client JS", (rec) => {
  let jsBytes = 0;
  for (const p of pagePaths) {
    const { html } = PAGES.get(p);
    if (html === null) {
      parseFail(rec, p);
      continue;
    }
    const scripts = allTags(html, "script");
    for (const s of scripts) {
      const type = (attr(s.raw, "type") ?? "").toLowerCase();
      if (type === "application/ld+json") {
        jsonLdBytes += Buffer.byteLength(s.raw, "utf8");
        continue;
      }
      if (hasAttr(s.raw, "src")) {
        jsBytes += Buffer.byteLength(attr(s.raw, "src") ?? "", "utf8");
        fail(rec, `${p}: executable <script src="${attr(s.raw, "src")}"> (type=${JSON.stringify(type || null)})`);
      } else {
        const close = html.indexOf("</script>", s.index);
        const body = close === -1 ? "" : html.slice(s.index, close);
        jsBytes += Buffer.byteLength(body, "utf8");
        fail(rec, `${p}: inline <script> without type="application/ld+json" — ${snippetAround(body, body.slice(0, 1) || "<", 40)}`);
      }
    }
  }
  for (const file of FILES) {
    if (file.toLowerCase().endsWith(".js") || file.toLowerCase().endsWith(".mjs")) {
      let size = 0;
      try {
        size = statSync(file).size;
      } catch {
        size = 0;
      }
      jsBytes += size;
      fail(rec, `${sitePath(DIST, file)}: JavaScript file shipped in dist/ (${size} bytes) — C1 forbids client JS`);
    }
  }
  rec.notes.push(`JS bytes across site (excl. JSON-LD): ${jsBytes}; JSON-LD bytes: ${jsonLdBytes}; <img> count: ${imageCount.total}`);
});

/* --------------------------------------------------------------------- report */

const FAILED = checks.filter((c) => c.failures.length > 0);
const PASSED = checks.length - FAILED.length;
const totalFailures = checks.reduce((n, c) => n + c.failures.length, 0);
const totalWarnings = checks.reduce((n, c) => n + c.warnings.length, 0);

const mark = (c) => (c.failures.length > 0 ? "FAIL" : c.warnings.length > 0 ? "PASS*" : "PASS");
const w = (n, len) => String(n).padEnd(len);

console.log(`\n  validate: dist root = ${DIST}`);
console.log(`  validate: ${HTML_FILES.length} html, ${FILES.length} files\n`);
console.log(`  ${w("#", 3)}${w("check", 42)} ${w("result", 7)}fail  warn`);
console.log(`  ${"-".repeat(62)}`);
checks.forEach((c, i) => {
  console.log(`  ${w(i + 1, 3)}${w(c.name, 42)} ${w(mark(c), 7)}${w(c.failures.length, 5)}${c.warnings.length}`);
});
console.log(`  ${"-".repeat(62)}`);
if (totalFailures > 0) {
  console.log(`\n  FAILURES (${totalFailures}):`);
  for (const c of FAILED) {
    console.log(`\n  [${c.name}]`);
    for (const f of c.failures) console.log(`    - ${f}`);
  }
}
if (totalWarnings > 0) {
  console.log(`\n  WARNINGS (${totalWarnings}, non-blocking):`);
  for (const c of checks) for (const m of c.warnings) console.log(`    - [${c.name}] ${m}`);
}
const notes = checks.flatMap((c) => c.notes.map((n) => `[${c.name}] ${n}`));
if (notes.length > 0) {
  console.log(`\n  NOTES:`);
  for (const n of [...new Set(notes)].sort()) console.log(`    - ${n}`);
}
console.log(`\n  ${checks.length} checks, ${PASSED} passed, ${FAILED.length} failed  (* = passed with warnings)`);
console.log(`  ${FAILED.length === 0 ? "RESULT: OK" : "RESULT: FAILED"}\n`);

process.exit(FAILED.length === 0 ? 0 : 1);
