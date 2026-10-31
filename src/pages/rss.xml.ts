import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { SITE_URL, postPath } from "../data/links";

const escapeXml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

export const GET: APIRoute = async () => {
  const entries = (await getCollection("articles"))
    .filter((entry) => !entry.data.draft)
    .sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());

  const items = entries
    .map((entry) => {
      const slug = /^\/posts\/(.+)\.html$/.exec(entry.data.canonicalPath)?.[1];
      if (!slug) throw new Error(`[rss] bad canonicalPath: ${entry.data.canonicalPath}`);
      const url = `${SITE_URL}${postPath(slug)}`;
      const published = entry.data.publishedAt.toUTCString();
      return [
        "    <item>",
        `      <title>${escapeXml(entry.data.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <description>${escapeXml(entry.data.description)}</description>`,
        `      <pubDate>${published}</pubDate>`,
        ...entry.data.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`),
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const lastBuild = entries[0]?.data.updatedAt.toUTCString() ?? new Date(0).toUTCString();
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    "    <title>LinsaFTW — technical writing</title>",
    `    <link>${SITE_URL}/articles.html</link>`,
    `    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />`,
    "    <description>Source-backed notes on Minecraft infrastructure, security, systems and AI products.</description>",
    "    <language>en</language>",
    `    <lastBuildDate>${lastBuild}</lastBuildDate>`,
    items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
};
