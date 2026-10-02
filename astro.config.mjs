// @ts-check
import { readFile, writeFile, rm } from "node:fs/promises";
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

import emitMarkdownTwins from "./src/integrations/emitMarkdownTwins";

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
      filter: (page) => !page.endsWith(".md"),
    }),
    singleSitemapFile(),
    emitMarkdownTwins(),
  ],
});
