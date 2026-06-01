# Design-System Consistency Audit (frontend visual polish)

Behavior is now coherent (UX_REVIEW_2). This pass is about the **visual language** — making the whole app read as one crafted product. Audited by quantifying token usage across `app/` + `src/` and comparing key screens. **Nothing edited yet — this is the plan to approve.**

## The canonical system (source of truth: `../src/index.css` + `tailwind.config.js`)
- **Radii:** `xs 4 · sm 8 · md 10 · lg 14 · pill 9999`. Cards (`.card-white`) = **lg (14)** + `p-4` (16) + hairline border. Buttons = `rounded-lg` (14) + **h-44**.
- **Controls:** primary button height **44**.
- **Surfaces:** white/`surface-tile-2` bg, `border-black/7` / `hairline-dark` border.

## The drift (measured, whole repo)

### D-1 — Card radius is split 10 vs 14 🔴
`borderRadius: 14` appears **104×** and `borderRadius: 10` **100×** — two competing "card" looks used interchangeably for the same kind of surface. Per the source of truth a card is **14**; ~100 surfaces are wrong.

### D-2 — Off-scale radii (not on the token scale) 🟠
`12` (**38×**), `16` (**29×**), plus `18 / 20 / 24 / 5 / 3 / 2…` — values that don't exist in the scale (4/8/10/14). Hotspots: plan-details, nutrition-plan, measurements, photos, settings/*, week editor, exercise, adaptive-insights, subscription. Each is a small visual "off" note.

### D-3 — Control heights scatter 🔴
For buttons/inputs/rows: `44` (**83×**, canonical), `40` (**75×**), `48` (**67×**), `56` (**50×**), `52` (**8×**). The `Btn` primitive is 44, but inline CTAs drift to 48/56 and inputs/rows to 40 — so "the same button" is a different height on different screens.

### D-4 — Card padding drift 🟡
`padding: 16` (**86×**, canonical `p-4`), but `20` (**31×**) and `24` (**21×**) are common for the same card type, and `12` (**58×**) mixes inner/outer.

### D-5 — The "eyebrow" label is re-implemented ~63× 🟠
The small primary-colored uppercase section label (`fontSize: 11, fontWeight: "600", textTransform: uppercase, letterSpacing: …`) is hand-written **63 times** with **drifting letterSpacing** (0.5 / 1 / 1.5) and color (primary vs inkMuted). No shared primitive.

### D-6 — Shared primitives exist but are bypassed 🟠
`src/components/ui/Card.tsx` (rounded-lg/p-4/hairline) exists but is essentially **unused** — screens roll their own `const card = {…}` (plan, analytics, Nutrition) or inline surfaces, which is exactly why D-1/D-2/D-4 drift. There's no shared `Eyebrow`/`SectionLabel`.

### D-7 — Spacing / gaps are ad-hoc 🟡
gaps and margins use arbitrary values (6/8/10/12/16/20/24/32) without a consistent rhythm; lower priority but contributes to the "slightly off" feel.

*(Theming/tints D were largely fixed in P1; structural color is tokenized via `useColors()`.)*

## Fix plan (phased; approve + decide first)

### Phase D1 — Define + centralize the surface vocabulary
Add small shared primitives/helpers so screens stop hand-rolling:
- `radii` token map (xs/sm/md/lg/pill) exported for inline `style` use.
- A `<SurfaceCard>` (or extend `Card`) for the standard card, and a `<SectionLabel>`/`<Eyebrow>` for D-5.
- A `controlHeights` constant (e.g. `control: 44`, `large: 52`).

### Phase D2 — Normalize radii (D-1, D-2)
Cards → **14 (lg)**; inner chips/tiles/inputs → **10 (md)** or **8 (sm)**; map every off-scale value to the nearest token (12→14 or 10, 16→14, 18/20→14 or pill, etc.). Pills stay 9999.

### Phase D3 — Normalize control heights (D-3)
Standardize buttons/inputs/rows to **44** (canonical); allow one **large = 52** for hero/onboarding CTAs; remove the scattered 48/56/40-as-button. (Keep 40 only for genuinely small icon circles.)

### Phase D4 — Normalize card padding (D-4) + adopt the eyebrow primitive (D-5/D-6)
Cards → `p-4` (16) unless intentionally spacious (then 20/24 consistently); replace the 63 hand-written eyebrows with `<SectionLabel>`.

### Phase D5 — Spacing rhythm pass (D-7, optional)
Nudge gaps/margins onto a 4-pt rhythm where it's cheap; lowest priority.

## Decisions — ✅ RESOLVED (user-approved)
1. **Card radius:** 2-tier — outer/content cards **14 (lg)**, inner tiles/chips/inputs **10 (md)**; map off-scale (12/16/18/20…) to the nearest token; pills stay 9999; icon circles stay (size/2).
2. **Control height:** strict **44** for buttons/inputs/rows; one **large = 52** for hero/onboarding CTAs; remove scattered 48/56; small icon circles (40/36/32) unchanged.
3. **Depth:** normalize values in place + add shared primitives (`radii`/`controlHeight` tokens, `<SectionLabel>`, extend `Card`) and adopt where cheap. **No blanket sed** — radii/heights are context-dependent (icon circles, inputs vs buttons); normalize per-surface, highest-traffic screens first, verified in light + dark.

## Progress log
- **D1 (centralize vocabulary)** — in progress.

## Open decisions (block the sweep) — superseded by the RESOLVED block above
1. **Card radius target:** (a) unify ALL cards to **14** (source of truth; slightly rounder than the ~100 currently at 10); (b) keep a **2-tier** system — outer cards **14**, inner tiles/chips **10** — and just kill the off-scale values. *(Recommend b — most natural.)*
2. **Control height:** (a) strict **44** everywhere + one **large 52** for hero CTAs; (b) leave prominent CTAs at 48/56 but make them consistent per role. *(Recommend a.)*
3. **Refactor depth:** (a) **normalize values in place** (fix radii/heights/padding to tokens, introduce primitives for new code) — lower risk, faster; (b) **full primitive refactor** (rewrite every surface to `<Card>`/`<SectionLabel>`) — cleaner long-term, higher churn/risk. *(Recommend a now; b incrementally later.)*

## Sequencing & resumability
After approval: D1 → D2 → D3 → D4 → (D5 optional), one tight commit per phase/area, `npx tsc --noEmit` + sim-verify key screens in light **and** dark, log progress here + in FIX_LOG, update RESUME at each checkpoint. **Do not edit until the user approves + answers the 3 decisions.**
