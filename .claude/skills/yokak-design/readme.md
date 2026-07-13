# YÖKAK Design System

Design system for the **Turkish Higher Education Quality Council** (THEQC) —
in Turkish, *Yükseköğretim Kalite Kurulu* (YÖKAK). YÖKAK is the independent
public body responsible for the external quality assurance and accreditation
of higher-education institutions in Turkey.

This system is derived from the official **Visual Identity Guidelines
(KK EN V1.0 / July 2021)** supplied as `uploads/yokak_identity_EN.pdf`. It is
a print-first corporate-identity manual; the digital foundations, component
library, and UI kit here extend that identity to screen.

## Source materials
- `uploads/yokak_identity_EN.pdf` — 61-page Visual Identity Guidelines (logotype
  story, exclusion zone, colour system, type, and ~40 print/application
  templates: business card, letterhead, certificates, event poster, roll-up,
  social banners, press release, etc.).
- `uploads/Camber W04 *.ttf` — Camber, the primary corporate typeface.
- `uploads/DINPro*.otf` — DIN Pro, the secondary typeface.
- `uploads/YÖKAK Yeni Nesil Logo Paketi…/` — official new-generation logo package:
  TR/EN colour lockups, white & black mono versions, minimal digital/print
  marks, and accreditation seal artwork (5-year gold, 2-year silver PDF).
- Public site referenced throughout: **www.yokak.gov.tr**.

## Brand at a glance
- **Blues only.** Three PANTONE blues carry the entire identity:
  7685C `#2b5597` (dark), 285C `#006eb7` (mid, primary), 2915C `#5eb3e4` (light).
  The logotype gradient runs dark → mid blue.
- **Type:** Camber (headings + UI), DIN Pro (data, labels, numerals).
- **Tone:** formal, institutional, bilingual (English / Turkish). Trust,
  quality, elevation — the logo symbol is a flying bird denoting approval.

---

## CONTENT FUNDAMENTALS

**Voice.** Official and impartial — the register of a national regulator, not a
brand. Copy is declarative and precise: *"The following design should be used
as a guide for THEQC Business Cards."* Sentences are complete, measured, and
free of hype or exclamation.

**Person.** Third person and institutional ("the Council", "THEQC", "YÖKAK").
First-person plural appears only in ceremonial contexts (*"We present you this
certificate…"*, *"We are proud to introduce…"*). Second-person "you" is rare and
reserved for direct instruction on forms/cards.

**Naming & casing.** The institution is written in full — *Turkish Higher
Education Quality Council* — or as the abbreviation **THEQC** (EN) / **YÖKAK**
(TR). Section and template titles are UPPERCASE (e.g. *MAIN AND SECONDARY
COLOURS*, *INSTITUTIONAL ACCREDITATION SEAL*). Titles/honorifics are always
spelled out and capitalised: *Prof. Dr. Muzaffer ELMAS, President*.

**Bilingualism.** Turkish and English coexist; official/legal artefacts
(ID cards, accreditation certificates) are frequently Turkish-only and noted as
*"(Available only in Turkish)"*. Use British spelling for colour terms as the
guideline does (*colour*, *popularised*).

**No emoji, ever.** None appear in the identity and none should be used. No
casual idiom, no marketing slang.

**Vibe:** authoritative, contemporary, restrained. "Contemporary, eye-catching,
direct and dramatic, respectful to the original" is how the guideline describes
the logo redesign — a good north star for all copy and layout.

---

## VISUAL FOUNDATIONS

**Colour.** Monochromatic blue system, cool and confident. Primary actions and
links use mid-blue `#006eb7`; dark blue `#2b5597` for depth, headings on light,
and hover/press states; light blue `#5eb3e4` for accents, tints, and secondary
fills. The **logotype gradient** (`--yokak-gradient`, dark→mid, left→right) is
the single signature flourish — used sparingly on hero surfaces, section rules,
and gradient CTAs. Neutrals are a cool grey ramp tuned slightly toward the blue.
Status colours are muted and institutional (green/amber/red), never candy-bright.

**Typography.** Camber is the workhorse — clean, humanist, stable. Weights used:
Light 300, Regular 400, Medium 500, Bold 700 (+ italics). Headings are Bold with
tight tracking (`-0.02em`) and balanced wrapping. DIN Pro is the technical
companion for data, tabular figures, eyebrows/kickers, and small uppercase
labels — set with wide tracking (`0.14em`) when uppercase. Body copy is Camber
Regular at 16px / 1.6 line-height.

**Backgrounds.** Predominantly white and very light grey (`#f6f8fa`). Brand
blue and the gradient are used as *deliberate* full-bleed panels (hero bands,
footers, certificate borders), not as ambient decoration. No photographic
textures, no noise/grain, no busy patterns — the print system leaves generous
white space and places "MAPPED VISUAL"/"PHOTO" boxes for imagery, so imagery is
framed and rectangular, not full-bleed collage. Imagery tone: clean, bright,
neutral-to-cool.

**Layout.** Rectilinear and grid-driven, on a 4px base. Generous margins;
content sits in centred containers (≤1280px). The exclusion zone around the
logo (one logo-block = "x") is sacred — keep clear space around the wordmark.

**Corners & borders.** Restrained radii — most surfaces are square or lightly
rounded (`3–10px`); pills only for tags/toggles. Borders are hairline cool-grey
(`#e2e6eb`/`#c9cfd7`); brand-blue borders mark selected/active. A short gradient
rule (`.yokak-rule`, 56×3px) under section titles is the recurring accent motif.

**Shadows.** Soft, low-contrast, cool-tinted (`rgba(27,34,44,…)`) — used for
lift on cards and menus, never heavy drop shadows. A blue-tinted `--shadow-brand`
is reserved for gradient CTAs on hover.

**Motion.** Understated and quick. Standard ease `cubic-bezier(.4,0,.2,1)`,
120–320ms. Hover = darken/tint + subtle shadow; press = 1px nudge down
(`translateY(1px)`). No bounces, no long or looping animations. Respect
`prefers-reduced-motion`.

**Cards** look like: white surface, hairline grey border and/or `--shadow-sm`,
`--radius-lg` corners, comfortable padding. Selected state swaps the border to
brand blue.

---

## ICONOGRAPHY

The Visual Identity Guidelines define **no icon set** — it is a logotype- and
typography-led identity. There is **no built-in icon font, no SVG icon library,
and no emoji** in the source material. The only proprietary graphics are the
**flying-bird logo symbol** and the **institutional accreditation seals**
(gold foil = 5-year full accreditation, silver = 2-year provisional) — brand
marks, not UI icons.

**Guidance for digital work:** where UI icons are unavoidable (nav, forms,
status), use a **thin, single-weight line set** that matches Camber's clean,
neutral tone. **Substitution:** we recommend **Lucide** (1.5–2px stroke,
rounded joins) loaded from CDN, tinted with brand blue or grey tokens. *This is
a substitution — no icon system ships with the brand; flag it to the client and
replace if an official set is provided.* Draw nothing by hand; never approximate
the bird mark or seals.

**Official artwork (supplied 2026-07):** the "Yeni Nesil Logo Paketi" provides
the real logo — a double-check/wing mark with italic wordmark — in TR and EN,
plus the gold 5-year accreditation seal. Copies live in `assets/logos/`:
`theqc-logo-en[.-white/-black].png`, `yokak-logo-tr[.-white/-black].png`
(mono versions regenerated from the colour logo's alpha channel — the package's
mono PNGs have baked-in backgrounds),
`*-min.png` (small-size digital versions), `seal-5yr-full-accreditation.png`.
Render via the `Logotype` component; never redraw. The package's `V3_SC.jpg`
swatch sheet also documents an extended secondary Pantone palette (435C, 489C,
7440C, 270C, 623C, 625C, 646C, Warm Red C) for data/illustration accents.
These are tokenized in `tokens/palette-v3.css` as `--v3-<pantone>` (hex sampled
directly from the artwork), with an ordered `--v3-cat-1…8` categorical scale
for charts. Accent-only — core UI chrome stays on the three institutional blues.

---

## COMPONENTS

Reusable React primitives (namespace resolved at build — see
`check_design_system`). Each lives in `components/<group>/` with a `.d.ts`,
`.prompt.md`, and a showcase card.

- **Logotype** (`components/brand/`) — official logo PNGs; EN/TR, colour /
  white / black, size presets.
- **SectionHeading** (`components/brand/`) — eyebrow + title + gradient rule.
- **Button** (`components/core/`) — primary / secondary / ghost / gradient /
  danger, three sizes, icon slots.
- **Badge, Tag, Card** (`components/core/`) — chips and surfaces.
- **Input, Select, Checkbox, Radio** (`components/forms/`) — form controls.
- **Alert** (`components/feedback/`) — inline notice banner.
- **Breadcrumb** (`components/navigation/`) — uppercase trail.

_Intentional additions: the guideline defines no UI components; this standard
set was authored from the visual foundations for digital use._

---

## FOUNDATIONS
Global tokens live in `tokens/` and ship via the root `styles.css`
(`@import` list only):
- `fonts.css` — Camber + DIN Pro `@font-face` rules.
- `colors.css` — brand blues, gradient, neutral ramp, status, seals, and
  semantic aliases (`--brand-primary`, `--text-body`, `--surface-card`, …).
- `typography.css` — families, weights, type scale, line-heights, tracking.
- `spacing.css` — 4px grid, containers, section rhythm.
- `effects.css` — radii, borders, shadows, motion.
- `base.css` — element defaults and utilities (`.yokak-eyebrow`, `.yokak-rule`,
  `.yokak-gradient-text`).

## INDEX (root manifest)
- `styles.css` — global entry point (link this one file).
- `tokens/` — token CSS (see Foundations above).
- `components/` — `brand/` (Logotype, SectionHeading), `core/` (Button, Badge,
  Tag, Card), `forms/` (Input, Select, Checkbox, Radio), `feedback/` (Alert),
  `navigation/` (Breadcrumb) — each with `.d.ts`, `.prompt.md`, showcase card.
- `guidelines/` — foundation specimen cards (colors, type, spacing, effects,
  brand logos & seal).
- `ui_kits/website/` — yokak.gov.tr home-page recreation (interactive).
- `assets/fonts/` — Camber (ttf) + DIN Pro (otf) binaries.
- `assets/logos/` — official logo lockups + accreditation seal.
- `uploads/` — original guideline PDF, logo package, full raw font set.
- `readme.md` — this file.
- `SKILL.md` — Agent-Skill entry point.

## CAVEATS
1. **Seal artwork:** only the 5-year gold seal PNG was extractable; the 2-year
   silver seal exists as PDF only (`uploads/...Akreditasyon Logo Paketi/2yıl.pdf`).
2. **PDF page images could not be rasterised** in the build sandbox, so layout
   reading of the identity guide is text-based. Reference screenshots of
   yokak.gov.tr would sharpen the UI kit.
