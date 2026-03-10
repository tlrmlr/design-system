# Color Mixing — Decision Log & Todo

## What the brief says

Tint application controls how the **selected hue** bleeds into the ink (dark) and paper (light) extremes of every palette. Three modes:

- **Ink %** — tint applied only to the dark end
- **Paper %** — tint applied only to the light end
- **Linked** — tint applied symmetrically to both ends

The midpoint (step 500) is always the "pure" color — unaffected by tint. Tint influence increases as steps move toward either extreme.

---

## What we built

`generatePalette` accepts:
- `hue` — the color's own hue angle (0–360°)
- `chromaPeak` — peak chroma at the midpoint (step 500)
- `inkTint` / `paperTint` — 0–100% tint application
- `tintHue` — the selected hue to blend toward at extremes (from the hue wheel)
- `tintChroma` — chroma level of the tint at extremes (currently = global `chromaPeak` slider)

**Chroma curve:** smoothstep from `tintChroma × tint%` floor → `chromaPeak` at midpoint → `tintChroma × tint%` floor.

**Hue shift:** at each step, lerp from the color's own hue toward `tintHue`, weighted by `(distance from midpoint) × tint%`. Shortest-path circular interpolation.

For the palette section, each Tailwind color uses its own hardcoded `hue` and `chromaPeak`, while `tintHue` and `tintChroma` come from global controls.

---

## Current problems

### 1. Chroma floor is derived from `tintChroma`, not from a natural tint model
The chroma at the extremes is `tintChroma × tint%`, where `tintChroma` is the global chroma slider. This creates odd coupling — dragging the chroma slider changes both the midpoint saturation of the selected color AND the intensity of tint bleeding into every palette's extremes. These feel like they should be independent.

### 2. Near-neutral colors (slate, gray, zinc, neutral, stone) barely show tint
Their own `chromaPeak` is near zero (0.000–0.035). We addressed this by routing the tint extremes through `tintChroma` (global), but the result still doesn't feel right — the chroma jump at the extremes is abrupt relative to their flat neutral midrange.

### 3. The hue shift and chroma shift happen on different curves
Hue shifts linearly (weighted by distance × tint%), chroma shifts on a smoothstep curve. These two don't track together, which can produce steps where the hue has noticeably shifted but the chroma hasn't yet, or vice versa — making the transition look unnatural.

### 4. No concept of "tint strength" independent of chroma
There's currently no way to say "apply a strong tint but keep the midpoint lightly saturated" — the chroma slider controls both.

---

## What good mixing should probably look like

- The midpoint (500) is always the pure color, unmodified.
- Moving toward ink (950): the color gradually picks up the selected hue. At 100% ink tint, the darkest step should feel like "a very dark version of the tint hue" — not the color's own hue.
- Moving toward paper (50): same logic at the light end.
- The hue shift and chroma transition should be **coupled** — the step should look like a blend between two colors, not a hue rotation applied independently of chroma.

A better mental model might be: at each extreme step, perform a **perceptual color blend** in OKLCH between:
- The "natural" color at that step (color's hue, tapered chroma, correct lightness)
- The "tint" color at that step (tint hue, tint chroma, same lightness)

The blend ratio at each step = `(distance from midpoint) × tint%`.

This would require computing both colors per step and blending their L, C, H values — but since L is already fixed by step, it really means blending C and H together proportionally.

---

## Todo

- [ ] Decide on tint scope: currently tint only affects the extremes with the midpoint (500) completely unaffected. The better model is likely that **all steps receive some tint**, with the midpoint getting the least and the extremes the most — consistent with how real palettes behave (e.g. a warm-tinted palette should feel warm at every step, not just at the ends). The tint % would control the maximum at the extreme, with the midpoint receiving a proportionally smaller but nonzero amount.
- [ ] Rethink the tint model: blend per-step between the "natural" color and the "tint" color rather than independently shifting hue and chroma
- [ ] Decouple tint chroma from the global chroma slider — introduce a dedicated **tint intensity** parameter or derive tint chroma from a fixed reasonable value
- [ ] Ensure hue and chroma shift at the same rate so transitions feel like smooth color blends
- [ ] Revisit near-neutral palettes (slate, gray, etc.) — their midpoints should stay desaturated while their extremes can pick up the tint
- [ ] Consider whether `tintChroma` should be a fixed value (e.g. 0.1) rather than user-controlled, since perceptually "correct" tinting doesn't need high chroma at the extremes
- [ ] Evaluate: should the tint hue come from the hue wheel, or should it be a separate control?
