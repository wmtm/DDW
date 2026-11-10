#!/usr/bin/env node
/**
 * Build-time image pipeline for the merch catalogue (src/merch/).
 *
 * Reads real product photos the client drops into public/merch/<productId>/
 * named <colorId>-<view>.<ext> (view is one of face/dos/detail; colorId must
 * match a ColorOption.id in src/merch/products.ts, productId must match a
 * Product.id) and, for each one:
 *   - converts it to WebP at a small "thumb" size for the product grid and
 *     a larger 2x "full" size for the detail panel / lightbox
 *   - records whether it has an alpha channel, so the UI knows whether to
 *     paint a floor-shadow decoration under it
 *
 * Outputs go to public/merch-optimized/ (gitignored — regenerated on every
 * dev/build, see package.json's predev/prebuild) and a manifest at
 * src/merch/imageManifest.generated.json that the app imports at runtime to
 * know, for a given product, which colours actually have photos and which
 * views exist for each. Safe to run with no public/merch/ directory at all
 * (writes an empty manifest) — that's the state until real photos are added.
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const SRC_DIR = join(ROOT, 'public', 'merch')
const OUT_DIR = join(ROOT, 'public', 'merch-optimized')
const MANIFEST_PATH = join(ROOT, 'src', 'merch', 'imageManifest.generated.json')

const THUMB_WIDTH = 640
const FULL_WIDTH = 1600
const VIEW_ORDER = ['face', 'dos', 'detail']
const EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp'])

async function buildOne(productId, file) {
  const dot = file.lastIndexOf('.')
  const ext = file.slice(dot).toLowerCase()
  if (!EXTENSIONS.has(ext)) return null
  const base = file.slice(0, dot)
  const dash = base.indexOf('-')
  if (dash === -1) {
    console.warn(`[merch-images] Skipping "${productId}/${file}" — expected "<colour>-<view>${ext}".`)
    return null
  }
  const colorId = base.slice(0, dash)
  const view = base.slice(dash + 1)
  if (!VIEW_ORDER.includes(view)) {
    console.warn(`[merch-images] Skipping "${productId}/${file}" — view "${view}" isn't face/dos/detail.`)
    return null
  }

  const srcPath = join(SRC_DIR, productId, file)
  const outProductDir = join(OUT_DIR, productId)
  mkdirSync(outProductDir, { recursive: true })

  const image = sharp(srcPath)
  const metadata = await image.metadata()
  let transparent = false
  if (metadata.hasAlpha) {
    const { channels } = await image.stats()
    transparent = channels[channels.length - 1].min < 255
  }

  const thumbName = `${colorId}-${view}-thumb.webp`
  const fullName = `${colorId}-${view}-full.webp`

  const [thumbInfo, fullInfo] = await Promise.all([
    sharp(srcPath)
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(join(outProductDir, thumbName)),
    sharp(srcPath)
      .resize({ width: FULL_WIDTH, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(join(outProductDir, fullName)),
  ])

  return {
    colorId,
    view,
    transparent,
    thumb: { src: `merch-optimized/${productId}/${thumbName}`, w: thumbInfo.width, h: thumbInfo.height },
    full: { src: `merch-optimized/${productId}/${fullName}`, w: fullInfo.width, h: fullInfo.height },
  }
}

async function main() {
  rmSync(OUT_DIR, { recursive: true, force: true })

  const manifest = {}

  if (!existsSync(SRC_DIR)) {
    writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n')
    console.log('[merch-images] No public/merch/ directory yet — wrote an empty manifest.')
    return
  }

  const productDirs = readdirSync(SRC_DIR, { withFileTypes: true }).filter((d) => d.isDirectory())
  let count = 0

  for (const dir of productDirs) {
    const productId = dir.name
    const files = readdirSync(join(SRC_DIR, productId)).filter((f) => !f.startsWith('.'))
    const entries = []
    for (const file of files) {
      const entry = await buildOne(productId, file)
      if (entry) entries.push(entry)
    }
    if (entries.length === 0) continue

    const byColor = {}
    for (const { colorId, view, transparent, thumb, full } of entries) {
      byColor[colorId] ??= []
      byColor[colorId].push({ view, transparent, thumb, full })
    }
    for (const views of Object.values(byColor)) {
      views.sort((a, b) => VIEW_ORDER.indexOf(a.view) - VIEW_ORDER.indexOf(b.view))
    }
    manifest[productId] = byColor
    count += entries.length
  }

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`[merch-images] Processed ${count} image(s) across ${Object.keys(manifest).length} product(s).`)
}

main().catch((err) => {
  console.error('[merch-images] Build failed:', err)
  process.exit(1)
})
