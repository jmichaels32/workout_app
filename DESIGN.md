# Design System — "Thermograph"

This file is the single source of truth for how this app looks. **Read it before
touching any UI code.** If a change can't be expressed with the tokens and rules
below, the design system gets updated first — the change doesn't ship on a
one-off color or font.

The reference mood: a thermal camera pointed at training. Warm carbon-black
ground, film grain, glowing heat gradients that MEAN something, huge condensed
headlines, tiny monospace labels. Editorial and experimental — printed race bib
meets thermographic scan — never dashboard, never neon-gamer.

---

## 1. The two rules

1. **Chrome is ink on carbon.** Text, borders, buttons, cards: warm off-white
   ink on warm near-black. Hierarchy = type size/weight and ink *tint*.
2. **Color is temperature, and temperature is meaning.** Every colored pixel
   comes from the one heat ramp below and encodes intensity: cool indigo = low,
   magenta = mid, ember/amber = high. If a color isn't saying "how hot," it
   shouldn't be colored.

## 2. Color tokens

Defined once in `:root` in `index.html`. Never hard-code hex values in
components; always use the variable.

### Chrome (the quiet 90%)

| Token         | Value                     | Use                                                  |
| ------------- | ------------------------- | ---------------------------------------------------- |
| `--bg`        | `#131118`                 | Page ground. Warm carbon black, slight plum cast.    |
| `--panel`     | `#1c1923`                 | Cards / surfaces on the ground.                      |
| `--panel-2`   | `#262230`                 | Inputs, nested surfaces.                             |
| `--ink`       | `#f2ede4`                 | Text. Warm paper white (heritage of v1).             |
| `--muted`     | `#a49b8e`                 | Secondary text, micro-labels.                        |
| `--line`      | `rgba(242,237,228,0.5)`   | Strong 1px borders (heroes, tiles, dialogs).         |
| `--soft-line` | `rgba(242,237,228,0.14)`  | Hairline 1px borders (cards, chips).                 |
| `--ink-25`    | `rgba(242,237,228,0.25)`  | Empty stars, disabled marks.                         |
| `--ink-12`    | `rgba(242,237,228,0.12)`  | Empty dots, faintest fills.                          |
| `--button`    | `--ink`                   | Filled (primary) button background — the light block.|
| `--button-ink`| `#16131b`                 | Text on filled buttons / light blocks.               |
| `--danger`    | `#ff453a`                 | Errors / destructive only.                           |

### The heat ramp (the loud 10%)

| Token        | Value     | Temperature            |
| ------------ | --------- | ---------------------- |
| `--heat-0`   | `#3946d8` | Cold — indigo          |
| `--heat-25`  | `#7d3bee` | Cool — violet          |
| `--heat-50`  | `#e0369e` | Mid — magenta          |
| `--heat-75`  | `#ff4d1f` | Hot — ember (= `--accent`) |
| `--heat-100` | `#ffa62b` | Peak — amber           |

`--thermal-ramp` is the full linear gradient of all five stops. In JS,
`heatColor(score)` interpolates the ramp for any 0–100 value — always use it,
never pick a ramp color by hand for data.

Readable-on-dark text variants (for small colored text only): primary
`#ffa62b`, secondary `#f04fae`, support `#8a93ff`.

### Where heat is ALLOWED

- Score numbers (`heatColor(score)`) and the global score chip.
- Muscle roles everywhere they appear: primary = amber/ember, secondary =
  magenta, support = indigo. Including the 3D viewer (it IS a thermal scan).
- Selected/active states: active filter chip = ember, selected muscle = ember.
- Community stars (filled = amber).
- The one art moment per screen (see §5) and the thermal-ramp spine strips.

### Where heat is FORBIDDEN

Body text, card borders, ordinary buttons, backgrounds of readable surfaces,
"success" semantics, and any second decorative accent. No green anywhere.

## 3. Typography

Three voices, no more:

| Voice       | Stack                                                          | Rules                                                              |
| ----------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Display** | `"DIN Condensed", "Arial Narrow", "Aptos", system-ui`           | UPPERCASE, weight 900, line-height 0.9, huge (`clamp(42px…96px)`). Headlines, movement names, tile titles, big numbers. |
| **Label**   | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas`         | UPPERCASE, 9–11px, letter-spacing 0.06–0.14em, weight 700–900. Eyebrows, tags, buttons, counts, chips. |
| **Body**    | `ui-sans-serif, system-ui, -apple-system, "Segoe UI"`           | Sentence case, 13–14px, line-height 1.45–1.55, ink at 75–100%.     |

## 4. Shape & texture

- **Corners are square.** `border-radius: 0` everywhere (dots excepted).
- **Borders are 1px**, `--line` for frames, `--soft-line` for the rest.
  Borders do the separating, not shadows.
- **Film grain everywhere:** a fixed full-viewport SVG-noise overlay
  (`body::after`, soft-light, ~0.35 opacity). Never remove it; never exceed
  0.5 opacity.
- **No glows.** `box-shadow` bloom around chips/dots/markers reads as cheap
  90s render. The only shadow in the app is the modal dialog's. Richness comes
  from the raster art, grain, and type — not bloom.
- **Blur is for depth:** `backdrop-filter` on the modal scrim only. Never blur
  readable text.
- **Dot grids stay the data motif:** ratings are 10-dot rows — filled dots are
  ink, empty dots `--ink-12`. The heat lives in the score *number* only; a
  rainbow of colored dots is too loud.

## 5. Art moments — composed, not random, and NEVER faked in CSS

**The house art is pre-rendered raster, not CSS.** Stacked radial-gradients +
`filter: blur()` is the mesh-gradient starter pack and it shows. Organic art
(thermal fields, waves, contours) is generated offline by
`scripts/generate_art.py` (spectral noise → domain warp → thermal LUT →
isotherm contours → film grain; fixed seeds, deterministic) and shipped as
assets in `assets/art/`. CSS's only jobs on top of art are layout, a dark
legibility scrim (`linear-gradient` over the image), and typography. If a new
screen needs art, add a render function to the script — do not build it from
CSS primitives.

**Exactly one art moment per screen:**

- **Home hero:** `assets/art/thermal-hero.webp`, `background-size: cover`,
  `background-position: 100% 0%` (the hot core lives top-right; text sits on
  the dark left), with a bottom-up scrim for the headline.
- **Collection header:** the *spine* — a 5px `--thermal-ramp` strip across the
  top edge. Quiet signature, not a second image.
- **Detail page:** the 3D thermal body is the art; nothing else is colored
  except the score chip, score numbers, and role labels.

Lists, cards, and grids stay clean — art never sits behind text people scan.

## 6. Layout

- Max width 1080px, centered. Mobile-first: must work at 390px; desktop is the
  mobile view with more air.
- Spacing unit 4px; common gaps 8 / 10 / 12 / 14 / 18.
- Touch targets ≥ 44px.

## 7. Checklist before shipping any UI change

1. Zero new hex values outside `:root`; data colors only via `heatColor()`.
2. Every colored element answers "what temperature is this?" — if it can't,
   it's ink.
3. One art moment per screen, max. Grain intact. No CSS-built art — raster
   assets from `scripts/generate_art.py` only.
4. All-caps text is Display or Label voice; corners square; borders 1px.
5. No glow shadows anywhere; blur only on the modal scrim.
6. Looks right at 390px first, 1080px second.
