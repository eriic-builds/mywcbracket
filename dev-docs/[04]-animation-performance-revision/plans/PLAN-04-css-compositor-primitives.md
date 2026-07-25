# PLAN: CSS compositor primitives

**Rank: 4 of 6. Run after Plan 03.**

## Goal
Replace the remaining layout-triggering and repaint-heavy CSS animations with explicit,
reviewable motion properties. Remove broad `transition: all` shorthands without adding new
animation to menus or overlays that currently open instantly.

## Exact files to touch
- `docs/css/dashboard.css`
- `docs/index.html`
- `tests/animation-performance.mjs`

Do not touch JavaScript in this plan.

## Step-by-step implementation order
1. Read Plan 01's `BASELINE.md` and the before/after notes from Plans 02 and 03.
2. Convert the dashboard toggle knob:
   - Keep `.tsw::after` anchored at `left:2px;top:2px`.
   - Transition only `transform` and its real color change.
   - Replace `.toggle input:checked + .tsw::after{left:18px}` with
     `transform:translateX(16px)`.
   - Keep the track size and hit target unchanged.
3. Replace the landing live-dot pulse:
   - Keep the eight-pixel dot itself stable.
   - Add a positioned `::after` ring.
   - Animate the ring from small/visible to larger/transparent using only `transform` and
     `opacity`.
   - Preserve the static glow if desired, but do not animate `box-shadow`.
4. Replace the dashboard `.pill.live .dot` pulse with the same transform/opacity pattern.
   Reuse one local keyframe name inside `dashboard.css`; do not create a JavaScript helper.
5. Update reduced-motion and theme overrides:
   - Landing reduced-motion explicitly disables `.badge .dot::after`.
   - Dashboard reduced-motion includes pseudo-elements, because `*` alone does not select
     `::before` and `::after`.
   - Easy mode disables the new live-dot pseudo-element.
   - GeoCities mode either disables the ring or gives the pseudo-element the existing
     steps-based blink intentionally. Do not accidentally run both the new pulse and the old
     theme animation.
6. Replace every broad `transition:.…` declaration in `docs/index.html` with named
   properties. Audit at least:
   - Landing theme buttons.
   - Drop zone.
   - Choice cards.
   - Share close button.
   - Builder team buttons.
   Keep existing explicit transform/opacity declarations.
7. Replace every broad `transition:.…` declaration in `dashboard.css` with named properties.
   Audit at least:
   - Theme and fun buttons.
   - Fun-menu items.
   - Sync link.
   - Chips.
   - Toggle track and knob.
   - Section toggle.
   - KPI cards.
   - Bracket/result controls.
   - Map expand control.
   - Team cards and favorite bar.
   - Score rows and segmented controls.
   - Final-four and story cards.
   - Floating back-to-top button.
8. For each selector, name only properties it truly changes:
   - Spatial hover motion: `transform`.
   - Fade: `opacity`.
   - State color: `color`, `background-color`, `border-color`.
   - Avoid transitioning `box-shadow`, `filter`, layout properties, or the `background`
     shorthand unless the trace and visual requirement justify it.
   - A state may change instantly if its old animation required repeated paint and adds no
     meaningful information.
9. Do not add slide or scale animations to `.fun-menu`, `.rail .links`, `.builder`,
   leaderboard, share popover, or match dialog merely because the source request mentioned
   menus and modals. Their instant open/close behavior is already cheaper than a new effect.
10. Extend `tests/animation-performance.mjs`:
    - Reject `transition` declarations whose first value is only a duration, which implies
      all properties.
    - Reject transitions naming left, right, top, bottom, width, height, margin, or padding.
    - Confirm the toggle checked state uses `translateX`.
    - Confirm pulse keyframes use only transform and opacity.
    - Confirm reduced-motion disables the new pseudo-elements.
    - Keep documented static positioning exceptions.
11. Run:
    ```bash
    node tests/animation-performance.mjs
    npm test
    ```
12. Inspect dark, light, easy, GeoCities, Minecraft, Windows XP, doodle, and sticker themes.
    Check hover-capable desktop and coarse-pointer mobile.
13. Repeat the Plan 01 toggle and pulse traces. Save results for Plan 06.

## Edge cases a weaker model will miss
- `transition:.16s` means "transition all animatable properties." Replacing it with another
  duration-only shorthand does not fix the problem.
- A pseudo-element needs its own `content`, positioning, border radius, and pointer-event
  behavior. It must not enlarge the control's layout box or block input.
- The universal selector in the current reduced-motion rule does not automatically target
  pseudo-elements. Add explicit `*::before,*::after` coverage or target the exact pulse
  pseudo-elements.
- Easy and GeoCities currently override animation on the dot element. After moving animation
  to `::after`, those selectors no longer affect it unless updated.
- `background` can be a gradient in several themes. Do not assume every background state can
  interpolate as `background-color`.
- Box-shadow and filter transitions can repaint even when no Layout event appears. The
  performance target is not limited to layout.
- `visibility` is a discrete state, not spatial motion. It is acceptable beside
  opacity/transform for existing tooltip hiding.
- `will-change` is not a free optimization. Do not place it on every hoverable card or button.
- Broad theme selectors can override component transitions. Check all seven dashboard themes,
  not only dark mode.
- Do not add animation to an instant modal to make the refactor look more extensive. The goal
  is less work, not more motion.

## Concrete acceptance criteria
- No first-party runtime CSS contains a duration-only transition shorthand.
- No CSS transition names left, right, top, bottom, width, height, margin, or padding.
- Toggle motion uses `translateX()` and retains the same endpoints.
- Landing and dashboard live-dot pulses animate only transform and opacity.
- Reduced-motion disables pulse pseudo-elements and all existing motion safeguards remain.
- Every theme remains readable and visually coherent.
- Paint Flashing no longer shows a continuously repainting pulse shadow.
- The toggle trace contains no layout caused by its state animation.
- `node tests/animation-performance.mjs` and full `npm test` pass.
- No JavaScript, dependency, or build command changes.
