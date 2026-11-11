# Higgsfield execution prompt — visual assets for sharmaketann.in

Written from the measured palette in `src/data/theme.ts` and `src/app/og/route.tsx`,
and from what the Higgsfield CLI and skills repos actually document (Nov 2026).

---

## 0. The route that is NOT blocked

The MCP connector in Claude Code exposes **read-only** tools — `balance`,
`models_list`, `models_get`, `show_generations`, `list_workspaces`,
`workspace_select`, and a Claude Motion importer. There is no `generate_*`
tool, so nothing can be generated through the connector.

The **CLI is a separate, standalone surface** and never mentions MCP:

```
npm install -g @higgsfield/cli
higgsfield auth login
higgsfield account                     # credits balance
higgsfield generate create <model> --prompt "..." --wait
```

Or install the official skills, which set up the CLI and auth for you:

```
/plugin marketplace add higgsfield-ai/skills
/plugin install higgsfield@higgsfield
```

Account state as of this writing: **0 credits, free plan**. Neither repo
states whether a free tier can generate, so the first real test is
`higgsfield account` after login.

---

## 1. The visual system every prompt must match

Non-negotiable. This is a trading-desk terminal, not a generic dev portfolio.

| token | value | role |
|---|---|---|
| ink (ground) | `#0b0e12` | near-black, cool, slightly blue |
| brass (accent) | `#c08a3e` | identity — the commodities pit |
| brass soft | `#8a6228` | shadowed brass |
| muted | `#79828f` | cool grey text |
| grid | `rgba(148,163,184,0.14)` | chart rules |
| up / down | `#1fa97a` / `#d9544d` | **semantic only — never decorative** |

Hard rules, from the theme file's own comment:

- **Green and red carry meaning.** Green = gain, red = loss (Indian market
  convention). Never let a generated image use them as decoration. If a
  render comes back with a red glow for mood, it is wrong, not stylish.
- Brass does all non-semantic emphasis.
- Dark-first. The site defaults to dark and most visitors never switch.
- Typeface is Space Grotesk. Do not ask a model to render the name or any
  real UI text — see §4.

Prompt fragment to paste into every generation:

> deep cool near-black ground #0b0e12, muted brass #c08a3e as the only accent,
> cool grey #79828f midtones, faint technical grid lines at very low opacity,
> no saturated red, no saturated green, no blue neon, no purple gradient,
> no lens flare, matte not glossy, restrained and editorial

---

## 2. What is worth generating

Ordered by value. Everything below assumes the asset **replaces** weight
rather than adding it — `public/_static/blogs` is already 4.4 MB and
`public/_static/projects` 2.2 MB.

### A. Homepage atmosphere plate  (highest value)
One wide, almost-empty abstract: a dark trading floor abstracted to light and
haze, or a macro of brass instrument surfaces. It sits *behind* content at low
opacity, so it must be calm and have no focal point competing with the text.

```
higgsfield generate create gpt_image_2_5 \
  --prompt "Extremely dark abstract photograph, a dim trading floor reduced to
  soft bokeh and haze, muted brass highlights, deep cool near-black ground
  #0b0e12, brass #c08a3e the only warm accent, cool grey midtones, heavy
  negative space across the centre, no people, no text, no screens showing
  readable content, matte film grain, editorial restraint, no saturated red,
  no saturated green, no neon" \
  --aspect_ratio 21:9 --quality high --resolution 2k --wait
```

Must survive: `opacity: 0.12` over `#0b0e12`, and a 9:16 mobile crop. Generate
the mobile crop separately rather than relying on `object-fit` — a 21:9 plate
cropped to portrait loses its composition.

### B. Cover art for the older projects
Only the college-era projects with no screenshot worth showing. **Abstract
only.** Never a rendered interface — a generated UI presented as your work is
a misrepresentation, and a recruiter who notices will not ask first.

```
higgsfield generate create nano_banana_2 \
  --prompt "Abstract geometric composition, dark #0b0e12 ground, thin brass
  #c08a3e linework, faint grid, isometric planes, no text, no UI, no screens,
  matte, generous negative space" \
  --aspect_ratio 3:2 --resolution 1k --wait
```

### C. A royalty-clean instrumental loop
Solves the rights problem that killed the audio on the board.
`sonilo_music` / ElevenLabs Music, `force_instrumental: true`, 20–40 s, built
to loop. Only if you actually want ambient sound — the synthesised chimes
already weigh zero bytes.

---

## 3. What NOT to generate, and why

- **Social / OG cards.** `src/app/og/route.tsx` already renders them per page
  with Satori in the real palette, vector-crisp, zero files. A PNG is worse on
  every axis.
- **Technical diagrams.** The loop-engineering SVGs re-colour for dark mode,
  stay sharp at any zoom, and weigh a few KB. Raster can do none of that.
- **A portrait of you.** Soul 2.0 is very good at photoreal faces. An AI
  version of your own face on a site recruiters read is a bad trade however
  good it looks.
- **Anything with text in it.** See below.

---

## 4. Text in images

Even the models tagged `text-rendering` get long strings wrong, and a
misspelt word in a hero plate is worse than no plate. Every prompt ends with
`no text, no letters, no numbers, no watermark`. All real type is DOM type —
it stays selectable, translatable, and searchable, and it re-colours with the
theme.

---

## 5. Delivery requirements

Measured guidance from current practice, adapted to this site's budget:

- **Under 200 KB per hero asset.** The shared JS bundle is 87.5 kB; a 2 MB
  background would dwarf the entire site.
- **AVIF with a WebP fallback.** Convert on arrival; never commit the PNG.
- **Two crops per plate** — wide (21:9 or 16:9) and portrait (9:16).
- **`alt=""`** for anything purely decorative, so screen readers skip it
  rather than announcing noise. Descriptive alt only where the image carries
  meaning.
- **`prefers-reduced-motion`** respected if the plate ever animates.
- Generated assets live in `public/_static/generated/` so they are
  distinguishable from real screenshots at a glance.

---

## 6. Consistency

The common failure with generated imagery across a site is that each asset
looks like it came from a different place. Two defences:

1. Reuse **one seed** across a family of assets where the model exposes
   `--seed`, and record the seed next to the file.
2. Keep a `MANIFEST.json` in `public/_static/generated/` recording, per file:
   model, full prompt, seed, date, and where it is used. Regenerating a
   matching asset in six months is then a copy-paste, not an archaeology
   project.

---

## 7. Unverified

- Several models advertise `supports_unlim`. Whether a free plan can use that
  mode is not documented anywhere I could find. Test with one cheap
  generation before planning around it.
- **Commercial-use licensing of generated assets is not stated** on the CLI
  repo, the skills repo, or the website-skill page. The MIT licences there
  cover the *code*, not the output. Check Higgsfield's actual terms before
  putting any of this on a site that represents you professionally.
- A "brand kit built from a website URL" appears in third-party summaries but
  could not be confirmed on any Higgsfield primary source. Treat as unproven.
