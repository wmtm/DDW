# La Boutique — mockup system

## What generates each product's "photo"

Every product image on this page is composited live in the browser —
nothing is a pre-rendered photo. Two layers:

1. **Base silhouette** (`bases/`) — a simple, consistent illustrated
   render of the product itself (studio backdrop, soft gradient shading,
   floor shadow), recolored per the chosen color swatch.
2. **Logo** (`mockup.ts`) — the client's own logo artwork, drawn onto a
   `<canvas>` layered on top, using one of four techniques depending on
   the product's surface: a soft multiply/texture blend for printed or
   embroidered fabric, a cylindrical warp for mugs/bottles/caps/golf
   balls, a flat print for plastic (frisbee), or an engraved bevel effect
   for metal (pet tag, leash tag).

## Why illustrated bases instead of real product photos

This build didn't have access to real photography for 14 of the 16
products — only two pre-made finished mockups (a cap and a t-shirt) were
supplied, both already composited with the logo baked in. Two options
were available: source stock "blank product" photos from the web (real
licensing risk per-item, and a real risk of an inconsistent look across
16 items pulled from different sources), or generate consistent
illustrated renders directly in code (no licensing risk, guaranteed
visual consistency, same "soft studio" look across the whole catalogue).
This build uses the second option — every base in `bases/shapes.tsx` is
original vector artwork, not photography.

The two real reference mockups (`Mockup Cap Black WFS.png`, `Mockup
TShirt Black WFS.png`) were used only to calibrate realistic logo
placement, scale and proportions — they aren't shipped in the site.

## Swapping in real photography later

Nothing about the logo compositing needs to change. For a given product:

- To swap one product to a real photo: replace what `ProductBase`
  (`bases/index.tsx`) renders for that `BaseKind`, or bypass it entirely
  in `MockupCanvas.tsx` for that product and render an `<img>` instead —
  the canvas logo layer on top works the same either way, as long as the
  photo uses the same roughly-square framing and neutral background the
  illustrated bases use.
- To keep the live color-swap/swatch behavior with real photos, you'd
  want one photo per color per product (rather than one silhouette
  recolored programmatically).
- `products.ts`'s `logoZone` (position/size/rotation/curve) for that
  product will very likely need retuning against the real photo's actual
  geometry — the current values are tuned against the illustrated
  shapes' own coordinates, not a real garment's.

## The logo artwork

Two variants came from the client's `.ai` files, each exported as a
light (white) and dark (near-black) ink version (`src/assets/merch/`):

- `crest` — the full "WOLMAR FREE STATE" + skull/antler emblem, used for
  larger placements (cap front, mug, bottle, golf ball, frisbee, pet
  tag).
- `pocket` — the smaller "WOLMAR FREE STATE" + crossed-bullets badge,
  used for small placements (shirt/polo/apron chest, plush tag).

`bases/color.ts`'s `logoVariantFor()` picks light vs. dark automatically
from the product color's luminance — there's no "full colour" logo
variant because the supplied artwork is itself single-color by design.
