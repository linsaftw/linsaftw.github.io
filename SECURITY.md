# Security Policy

## Scope and threat model

This site is a **fully static, build-time-generated Astro project**. There is no server runtime, no
API, no database, and no authentication layer of any kind.

Specifically:

- **No credentials.** No usernames, passwords, tokens, API keys, SSH keys, or certificates are
  stored in this repository.
- **No API secrets.** The site fetches nothing at runtime and talks to no backend service.
- **No auth forms.** There is no login, registration, or session mechanism. The previous
  `admin.html`, `login.html`, `register.html`, and `post.html` pages were pure client-side
  illusions with no backend behind them and have been removed; the "login" state existed only as
  JavaScript in the visitor's own browser.
- **No dynamic admin.** No CMS, no edit endpoint, no publish pipeline that mutates remote state.
- **No user data storage.** No analytics payloads, no cookies, no local-storage user records, no
  comments, no submissions. Nothing the visitor does leaves their browser except the ordinary
  HTTP request for a static file.

Because of this, the practical attack surface is: static asset hosting, the Astro build pipeline,
and the deployment credentials used to publish.

## Reporting a vulnerability

If you believe you have found a real security issue in this repository, open a GitHub issue on the
repository, or contact the maintainer privately. Please do not include exploit payloads that
target third-party systems.

## Why `_headers` was removed

The repository previously contained a Netlify-style `_headers` file at the root. That file is
**inert on GitHub Pages**: GitHub Pages only serves files it has in the published `dist/` tree and
never reads `_headers`, so every rule in it had no effect in production. Keeping it was misleading,
so it was deleted and its intent recorded here instead.

### The headers it intended to set (verbatim, from the removed file)

Global:

```text
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Cross-Origin-Opener-Policy: same-origin
Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

`/assets/*`:

```text
Cache-Control: public, max-age=31536000, immutable
CDN-Cache-Control: public, max-age=31536000, immutable
Cloudflare-CDN-Cache-Control: public, max-age=31536000, immutable
```

`/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/llms-full.txt`, `/*.html.md`, `/posts/*.html.md`:

```text
Cache-Control: public, max-age=3600
```

and on the two markdown-twin path groups additionally:

```text
X-Robots-Tag: noindex, follow
```

### How those headers are actually applied now

For a GitHub Pages deployment, response headers **cannot** be set from repository code. They must be
applied at the CDN/proxy layer in front of the domain — for example Cloudflare (Pages/Worker rules,
or Transform Rules), Cloudflare Workers, Fastly, or a reverse proxy under the maintainer's control.

Notes for whoever configures that layer:

- The `X-Robots-Tag: noindex, follow` intent for the `.html.md` markdown twins is **already satisfied
  without any header**: the twins are excluded from `sitemap.xml`, carry
  `<meta name="robots" content="noindex, follow">` from the page itself, and are advertised via
  `<link rel="alternate" type="text/markdown">`. Do not rely on `_headers` for this.
- The `CDN-Cache-Control` / `Cloudflare-CDN-Cache-Control` variants only make sense behind
  Cloudflare and can be dropped elsewhere.
- The security headers above are defense-in-depth, not the primary control: this site has no
  secrets and no user data to protect in the first place.