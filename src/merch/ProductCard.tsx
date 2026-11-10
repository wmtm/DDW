import MockupCanvas from './MockupCanvas'
import { PRIX_SUR_DEMANDE } from './products'
import type { Product } from './types'

export default function ProductCard({ product, onOpen }: { product: Product; onOpen: (p: Product) => void }) {
  return (
    <button type="button" className="boutique-card" onClick={() => onOpen(product)}>
      <span className="boutique-card-mockup">
        <MockupCanvas product={product} colorId={product.colors[0].id} />
      </span>
      <span className="boutique-card-body">
        <span className="boutique-card-name">{product.name}</span>
        <span className="boutique-card-price">{PRIX_SUR_DEMANDE}</span>
        {product.colors.length > 1 && (
          <span className="boutique-card-swatches">
            {product.colors.map((c) => (
              <span key={c.id} className="boutique-swatch-dot" style={{ background: c.hex }} />
            ))}
          </span>
        )}
      </span>
    </button>
  )
}
