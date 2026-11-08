import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Content Layer API (Astro 5+). `loader` is required — a collection without one
// throws ContentCollectionMissingLoader (errors-data.js:638).
//
// Astro 7.3.5 requires this file at `src/content.config.ts` (utils.js:563-568
// `searchConfig`). The legacy `src/content/config.ts` location throws
// LegacyContentConfigError (utils.js:532) unless `legacy.collectionsBackwardsCompat`
// is set — that flag is deprecated and was removed, so the collection now lives here.
//
// Verified against the installed package:
//   - `glob` is still exported from `astro/loaders`
//     (node_modules/astro/dist/content/loaders/index.d.ts).
//   - `base` is still resolved against the Astro project ROOT, not src/content:
//     `baseDir = new URL(globOptions.base, config.root)`
//     (node_modules/astro/dist/content/loaders/glob.js:179).
//   - `z` re-exported from `astro:content` is `zod/v4`
//     (node_modules/astro/dist/content/runtime.js:2), which keeps `z.coerce.date()`.
const articles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/articles" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    tags: z.array(z.string()),
    author: z.string(),
    canonicalPath: z.string(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    relatedProjects: z.array(z.string()).default([]),
    relatedDocs: z.array(z.string()).default([]),
    ogImage: z.string().optional(),
  }),
});

/*
 * Documentation is written per plugin, per topic. The route derives both path
 * segments from the content id (e.g. exploitfixer/configuration), so a file
 * cannot claim a canonical path that the router will not generate.
 */
const docs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/docs" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    plugin: z.string(),
    pluginName: z.string(),
    topic: z.string(),
    order: z.number().int().nonnegative(),
    updatedAt: z.coerce.date(),
    version: z.string().optional(),
    platforms: z.array(z.string()).default([]),
    officialUrl: z.url().optional(),
    sourceStatus: z.enum(["public", "private", "shipped-config"]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles, docs };
