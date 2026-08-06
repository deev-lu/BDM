# Brasserie Bei der Mamm — Website

Static single-page website. No build step, no dependencies — `index.html` is fully
self-contained (fonts, images and scripts are inlined).

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Go to vercel.com → **Add New → Project** → import the repository.
3. Framework preset: **Other**. Leave Build Command empty and set
   Output Directory to `.` (or leave defaults — Vercel serves `index.html` directly).
4. Deploy.

Alternatively, from this folder:

```bash
npx vercel --prod
```

## Deploy to GitHub Pages

1. Push this folder to a repository (files at the repo root).
2. Repository → **Settings → Pages**.
3. Source: **Deploy from a branch**, branch `main`, folder `/ (root)`.
4. Save. The site appears at `https://<user>.github.io/<repo>/`.

## ⚠ Before going live: set your domain

`index.html` contains an Open Graph image tag used for WhatsApp / Facebook /
Instagram link previews:

```html
<meta property="og:image" content="https://beidermamm.lu/assets/og-image.png">
```

OG crawlers do not accept relative URLs, so this must be an absolute `https://`
address. Replace `beidermamm.lu` with the real production domain once it is known.
Keep `assets/og-image.png` (1200×630) deployed next to `index.html` — it is the
only file the bundle references externally; everything else is inlined.

## Local preview

Open `index.html` in a browser, or run:

```bash
npx serve .
```

## Editing

Do not edit `index.html` by hand — it is compiled output. Make changes in the
source design file (`Brasserie Bei der Mamm.dc.html`) and re-export.

## Image credits

Food and interior photography from [Unsplash](https://unsplash.com), used under the
Unsplash License (free for commercial use, no attribution required). The founders'
portrait and the logo are property of the client.
