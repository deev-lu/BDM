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

**One manual addition survives only if you re-apply it after every export:**
the template's `<head>` loads the menu script, right after the first `<script>`:

```html
<script src="/menu.js"></script>
```

In the exported `index.html` this sits inside the JSON-encoded
`__bundler/template` string as `<script src=\"/menu.js\"></script>`.
Add it to the design file itself, or re-insert it after exporting.

## Speisekarten (menu cards) — admin at `/admin`

The customer uploads the **Saisonkarte** and the **Klassische Karte** as a PDF or
photo at `https://<domain>/admin`. Several files per card can be kept; one is
online at a time. `menu.js` adds a "Speisekarte" section (after "Unser Angebot")
and a nav link; with no active card the section is hidden.

Backend: Supabase (table `menu_files`, storage bucket `menu-cards`). No server
code — `admin/index.html` and `menu.js` talk to Supabase directly, and the
database policies decide who can write.

### Setup (once)

1. Create a Supabase project and run
   `supabase/migrations/20260928000000_menu_cards.sql` (SQL editor or
   `supabase db push`).
2. Put the project URL and the **publishable** key in `supabase-config.js`
   (both are public by design).
3. Authentication → Sign In / Providers: turn **off** "Allow new users to sign up"
   (and leave anonymous sign-ins off). Otherwise anyone could create an account
   and, during the test phase, upload.
4. Authentication → Users → **Add user** for each person, with
   "Auto confirm user" on, and give them their password.

**Test phase:** while `public.menu_admins` is empty, *every* logged-in user may
upload. **Going live:** add the real addresses — from then on only those can:

```sql
insert into public.menu_admins (email) values ('person@example.lu');
```

The Supabase project can later be moved to the customer's own organisation
(Project settings → General → Transfer project); nothing in the site changes.

## Image credits

Food and interior photography from [Unsplash](https://unsplash.com), used under the
Unsplash License (free for commercial use, no attribution required). The founders'
portrait and the logo are property of the client.
