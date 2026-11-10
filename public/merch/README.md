# Product photos

Drop real product photos here, one folder per product:

```
public/merch/<product-id>/<colour-id>-<view>.png
```

- `<product-id>` — the `id` field in `src/merch/products.ts` (e.g. `tshirt`, `mug`, `casquette`).
- `<colour-id>` — the matching `ColorOption.id` for that product in the same file (e.g. `noir`, `kaki`, `sable`).
- `<view>` — one of `face`, `dos`, `detail`.

Example: `public/merch/tshirt/noir-face.png`, `public/merch/tshirt/noir-dos.png`.

Accepted formats: `.png`, `.jpg`, `.jpeg`, `.webp`.

A colour only shows up as a swatch on the site once at least one photo
exists for it — you don't need every colour or every view for every
product; the site falls back to a "Visuel bientôt disponible" placeholder
for anything missing.

Nothing else to do — `npm run dev` / `npm run build` automatically convert
whatever's here into optimized WebP images (`scripts/build-merch-images.mjs`)
before starting; there's no manual export step.
