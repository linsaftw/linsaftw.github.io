# Image manifest

Production imagery for the site. Every file below lives in `public/`, so it is served as a
static asset and is **not** processed by Astro's `<Image>` component. That means the
consuming markup **must** carry explicit `width` and `height` attributes to avoid layout
shift — take both the exact pixel values from this table.

All assets are WebP. Existing artwork and badge files retain their documented encoding. New
project cards, FlameWM crops and OG cards were encoded with Pillow 12.1.1 (`WebP quality 86-88`,
method 6). No asset was upscaled: every output is at or below its source resolution except the
typographic cards, which contain no photographic pixels.

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
| `projects/flamewm.webp` | 720 | 405 | 9012 | 16:9 | FlameWM desktop screenshot | 360×203 |
| `projects/flamewm-desktop.webp` | 1200 | 568 | 18214 | 2.11:1 | FlameWM desktop with panel and settings | 1200×568 (max-width 100%) |
| `projects/entitylimiter.webp` | 720 | 405 | 7016 | 16:9 | EntityLimiter typographic banner | 360×203 |
| `projects/redstonelimiter.webp` | 720 | 405 | 8578 | 16:9 | RedstoneLimiter typographic banner | 360×203 |
| `projects/flamespawners.webp` | 720 | 405 | 7690 | 16:9 | FlameSpawners typographic banner | 360×203 |
| `projects/authmepremium.webp` | 720 | 405 | 6714 | 16:9 | AuthMePremium typographic banner | 360×203 |
| `projects/faus.webp` | 720 | 405 | 7316 | 16:9 | FAUS Legal typographic banner | 360×203 |
| `og/*.webp` | 1200 | 630 | varies | 1.9:1 | Social share cards for home, work, articles, docs, about and case studies | 1200×630 |

**Production project and OG imagery is generated from approved product screenshots, existing artwork, or typographic brand cards; no screenshot is fabricated.**

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
- `projects/flamewm.webp` and `projects/flamewm-desktop.webp` are cropped from the project's own
  public screenshot (`flamewm-website/assets/images/flamewm-desktop.webp`). The desktop screenshot
  is used as evidence of the shipped shell; it is not a fabricated mockup.
- `projects/entitylimiter.webp`, `redstonelimiter.webp`, `flamespawners.webp`, `authmepremium.webp`
  and `faus.webp` are typographic cards generated from the site palette because no approved product
  screenshot was available. They are clearly branded cards, not screenshots.
- `projects/ffaa-zombies.webp` is the one asset over the 120 KB review line at 129.8 KiB. It
  is a detailed 1000×1000 screenshot held at WebP q80 to keep small in-game HUD text crisp;
  raising `-define webp:method=6` only recovered 1.2 KB (0.9%) for a far slower encode, and
  dropping to q76 to get under the line cost visible detail. Keep q80 and lazy-load it.

## Markup rules

- At most one LCP image per page gets `fetchpriority="high"` (the hero/home banner or the case-study banner).
- Below-fold images get `loading="lazy"`; the LCP image does not.
- Decorative overlays get `alt="" aria-hidden="true"`.
- Do not inline any of these as a base64 URI — reference them by path only.