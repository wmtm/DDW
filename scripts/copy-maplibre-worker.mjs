// MapLibre GL JS ships its vector-tile worker as two sibling files
// (maplibre-gl-worker.mjs importing maplibre-gl-shared.mjs by relative path)
// rather than inlining them. They must be served verbatim, unhashed, from the
// same directory for that relative import to resolve, so Vite's asset
// pipeline can't handle them directly. Copy them into public/ before every
// dev/build run so they always match the installed maplibre-gl version.
import { copyFileSync, mkdirSync } from 'node:fs'

const files = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']

mkdirSync('public', { recursive: true })
for (const file of files) {
  copyFileSync(`node_modules/maplibre-gl/dist/${file}`, `public/${file}`)
}
