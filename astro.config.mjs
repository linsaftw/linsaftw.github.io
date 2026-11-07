// @ts-check
import { readFile, writeFile, rm } from "node:fs/promises";
import { readdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

import emitMarkdownTwins from "./src/integrations/emitMarkdownTwins";

const ROOT = fileURLToPath(new URL("./", import.meta.url));

/** Route key without `.html` or trailing slash, so sitemap URLs and file paths compare equal. */
const routeKey = (pathname) => pathname.replace(/\.html$/, "").replace(/(.)\/$/, "$1") || "/";

/**
 * Sitemap `lastmod` per route (W3C date).
 *   - articles: front-matter `updatedAt` (keyed by `canonicalPath`)
 *   - docs:     front-matter `updatedAt` (keyed by `src/content/docs/<plugin>/<topic>.md`)
 *   - others:   date of the newest git commit touching `src` or `public`. This is a
 *               site-wide date, not per page. Omitted when git is unavailable.
 */
function sitemapLastmod() {
  const dates = new Map();
  const field = (text, key) =>
    text.match(new RegExp(`^${key}:\\s*"?([^"\\n]+?)"?\\s*$`, "m"))?.[1];
  const frontMatter = (file) => readFileSync(file, "utf8").match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const mdFiles = (dir) =>
    readdirSync(new URL(dir, `file://${ROOT}`), { recursive: true })
      .filter((f) => String(f).endsWith(".md"))
      .map((f) => ({ rel: String(f), file: new URL(`${dir}/${f}`, `file://${ROOT}`) }));

  for (const { file } of mdFiles("src/content/articles")) {
    const fm = frontMatter(fileURLToPath(file));
    const canonical = field(fm, "canonicalPath");
    const updated = field(fm, "updatedAt");
    if (canonical && updated) dates.set(routeKey(canonical), new Date(updated));
  }
  for (const { rel, file } of mdFiles("src/content/docs")) {
    const fm = frontMatter(fileURLToPath(file));
    const updated = field(fm, "updatedAt");
    if (updated) dates.set(routeKey(`/docs/${rel.replace(/\.md$/, "")}`), new Date(updated));
  }

  let siteDate;
  try {
    const iso = execFileSync("git", ["log", "-1", "--format=%cs", "--", "src", "public"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    siteDate = iso ? new Date(iso) : undefined;
  } catch {
    siteDate = undefined;
  }
  if (siteDate && Number.isNaN(siteDate.getTime())) siteDate = undefined;

  return (item) => {
    const lastmod = dates.get(routeKey(new URL(item.url).pathname)) ?? siteDate;
    return lastmod ? { ...item, lastmod } : item;
  };
}

/**
 * @astrojs/sitemap@3.7.4 always writes `sitemap-index.xml` plus one or more
 * `sitemap-<n>.xml` chunks (node_modules/@astrojs/sitemap/dist/write-sitemap.js:37,50),
 * and under `build.format: "file"` it serializes routes WITHOUT their `.html`
 * extension (dist writes `/work.html`, the sitemap says `/work`).
 *
 * The frozen contract (C11/C13) requires ONE file at `/sitemap.xml` whose entries
 * are the real on-disk URLs. This integration runs after `sitemap()` (registration
 * order = hook order), flattens index + chunks into `sitemap.xml`, restores the
 * `.html` extension on every non-root entry, and deletes the index and chunks.
 */
function singleSitemapFile() {
  return {
    name: "linsaftw-single-sitemap",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const indexFile = new URL("./sitemap-index.xml", dir);
        let index;
        try {
          index = await readFile(indexFile, "utf8");
        } catch {
          logger.warn("single-sitemap: sitemap-index.xml not found, nothing to flatten.");
          return;
        }
        const chunkUrls = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

        const inner = [];
        for (const chunkUrl of chunkUrls) {
          const chunk = await readFile(new URL(`.${new URL(chunkUrl).pathname}`, dir), "utf8");
          const open = chunk.indexOf("<urlset");
          const close = chunk.lastIndexOf("</urlset>");
          if (open === -1 || close === -1) continue;
          inner.push(chunk.slice(chunk.indexOf(">", open) + 1, close));
        }

        // Rewrite each <loc> to the real file path, then drop the index/chunks.
        const urls = [...inner.join("\n").matchAll(/<url>[\s\S]*?<\/url>/g)].map((m) =>
          m[0].replace(/<loc>([^<]*)<\/loc>/, (_all, loc) => {
            const url = new URL(loc);
            if (url.pathname !== "/" && !url.pathname.endsWith(".html")) {
              url.pathname += ".html";
            }
            return `<loc>${url.href}</loc>`;
          }),
        );

        await writeFile(
          new URL("./sitemap.xml", dir),
          `<?xml version="1.0" encoding="UTF-8"?>\n` +
            `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
            `${urls.map((u) => `  ${u.replace(/\s+/g, " ")}`).join("\n")}\n` +
            `</urlset>\n`,
          "utf8",
        );

        await rm(indexFile, { force: true });
        for (const chunkUrl of chunkUrls) {
          await rm(new URL(`.${new URL(chunkUrl).pathname}`, dir), { force: true });
        }
        logger.info(`sitemap.xml created (${urls.length} urls, ${chunkUrls.length} chunk(s) flattened)`);
      },
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: "https://linsaftw.arkflame.com",
  output: "static",
  trailingSlash: "never",
  build: { format: "file" },
  // The collection config lives at `src/content.config.ts` (Astro 7 path), so the
  // deprecated `legacy.collectionsBackwardsCompat` flag is gone. With it removed the
  // glob loader returns PATH-DERIVED entry ids (glob.js:11-29 -> `slug`), not the
  // legacy id scheme. Nothing depends on `entry.id`: `src/integrations/emitMarkdownTwins.ts`
  // derives every slug from the `canonicalPath` front-matter field instead.
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      entryLimit: 5000,
      // C11: the `.html.md` twins are deliberate SEO back-compat, never sitemap entries.
      // The 404 page is noindex, so it must never be listed.
      filter: (page) => !page.endsWith(".md") && !/\/404(\.html)?\/?$/.test(page),
      serialize: sitemapLastmod(),
    }),
    singleSitemapFile(),
    emitMarkdownTwins(),
  ],
});
