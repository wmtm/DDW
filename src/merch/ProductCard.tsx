import { useState } from 'react'
import { Photo } from './Photo'
import { availableColorIds, imagesFor } from './images'
import { PRIX_SUR_DEMANDE } from './products'
import type { Product } from './types'

export default function ProductCard({ product, onOpen }: { product: Product; onOpen: (p: Product) => void }) {
  const [hover, setHover] = useState(false)

  const availableIds = new Set(availableColorIds(product.id))
  const shownColors = product.colors.filter((c) => availableIds.has(c.id))
  const defaultColorId = shownColors[0]?.id ?? product.colors[0].id

  const images = imagesFor(product.id, defaultColorId)
  const shown = (hover && images[1] ? images[1] : images[0]) ?? null

  return (
    <button
      type="button"
      className="boutique-card"
      onClick={() => onOpen(product)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span className="boutique-card-mockup">
        {product.featured && <span className="boutique-card-badge">Coup de cœur</span>}
        <Photo image={shown} size="thumb" alt={product.name} />
      </span>
      <span className="boutique-card-body">
        <span className="boutique-card-name">{product.name}</span>
        <span className="boutique-card-price">{PRIX_SUR_DEMANDE}</span>
        {shownColors.length > 1 && (
          <span className="boutique-card-swatches">
            {shownColors.map((c) => (
              <span key={c.id} className="boutique-swatch-dot" style={{ background: c.hex }} />
            ))}
          </span>
        )}
      </span>
    </button>
  )
}
