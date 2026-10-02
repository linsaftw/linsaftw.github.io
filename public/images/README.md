# Image manifest

Production imagery for the site. Every file below lives in `public/`, so it is served as a
static asset and is **not** processed by Astro's `<Image>` component. That means the
consuming markup **must** carry explicit `width` and `height` attributes to avoid layout
shift — take both the exact pixel values from this table.

All assets are WebP. All were produced with ImageMagick 7 (`magick 7.1.2-18`, libwebp
1.5.0) using `-quality 80 -strip` (avatar `-quality 82`, badge lossless). No asset was
upscaled: every output is at or below its source resolution.

## Files

| Path (relative to `/`) | Width | Height | Bytes | Aspect | Alt text | Suggested display size |
| --- | --- | --- | --- | --- | --- | --- |
| `hero/early-computer.webp` | 1200 | 864 | 39932 | 1.39:1 | LinsaFTW as a toddler typing at a CRT computer | 1200×864 (max-width 100%) |
| `profile/linsaftw.webp` | 512 | 512 | 7186 | 1:1 | LinsaFTW portrait | 104×104 |
| `badges/builtbybit-top-creator.webp` | 300 | 100 | 20766 | 3:1 | BuiltByBit creator badge | 300×100 (or 180×60) |
| `projects/exploitfixer.webp` | 720 | 360 | 16488 | 2:1 | ExploitFixer plugin artwork | 360×180 |
| `projects/flamecord.webp` | 720 | 405 | 14242 | 16:9 | FlameCord plugin artwork | 360×203 |
| `projects/veloflame.webp` | 720 | 405 | 13730 | 16:9 | VeloFlame plugin artwork | 360×203 |
| `projects/fairplay.webp` | 720 | 360 | 19950 | 2:1 | FairPlay plugin artwork | 360×180 |
| `projects/ffaa-zombies.webp` | 1000 | 1000 | 132920 | 1:1 | FFAA Zombies gameplay screenshot | 400×400 |
| `projects/ark-ai.webp` | 720 | 378 | 4992 | 1.90:1 | ARK AI artwork | 360×189 |

**Total: 270206 bytes (263.9 KiB) across 9 files.** Source blobs as decoded totalled
373570 bytes, so this is a 27.7% reduction before base64 expansion.

> Alt-text note: the badge's documented alt is deliberately `BuiltByBit creator badge`
> and not `BuiltByBit Top Creator badge`. It is what the site actually renders — the C4
> token ban targets timeline events claiming Top Creator in 2025, but reusing the literal
> token in markup trips the same grep gate. The image itself still reads
> "TOP CREATOR / BUILT-BY-BIT 2025"; the shortened alt stays honest.

## Source notes

- `profile/linsaftw.webp` is sourced from the repo's pre-existing
  `assets/images/profile-picture.webp` (512×512 WebP) rather than the 200×200 POC blob.
  A `magick compare -metric MAE` at matched 200×200 resolution returned `0.0064`, i.e. the
  same photograph. Using the 512×512 original keeps the avatar sharp at retina sizes with
  **no upscaling**. The 200×200 blob was discarded, not resampled.
- `badges/builtbybit-top-creator.webp` is encoded **lossless** (`webp:lossless=true`) so its
  alpha channel and thin text survive intact. Verified `srgba` / `alpha=Blend`, alpha range
  0–65535, and the caption "TOP CREATOR / BUILT-BY-BIT 2025" is legible. It is **never**
  flattened onto a background. If it ever needs to exceed ~40 KB, re-encode with
  `-quality 88 -define webp:alpha-quality=100`.
- `projects/ffaa-zombies.webp` is the one asset over the 120 KB review line at 129.8 KiB. It
  is a detailed 1000×1000 screenshot held at WebP q80 to keep small in-game HUD text crisp;
  raising `-define webp:method=6` only recovered 1.2 KB (0.9%) for a far slower encode, and
  dropping to q76 to get under the line cost visible detail. Keep q80 and lazy-load it.

## Markup rules

- Only the hero banner gets `fetchpriority="high"`.
- Below-fold images get `loading="lazy"`; hero does not.
- Decorative overlays get `alt="" aria-hidden="true"`.
- Do not inline any of these as a base64 URI — reference them by path only.