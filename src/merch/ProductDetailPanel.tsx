import { useState } from 'react'
import MockupCanvas from './MockupCanvas'
import OrderForm from './OrderForm'
import { PRIX_SUR_DEMANDE } from './products'
import type { Product } from './types'

export default function ProductDetailPanel({ product, onClose }: { product: Product; onClose: () => void }) {
  const [colorId, setColorId] = useState(product.colors[0].id)
  const [size, setSize] = useState(product.sizes?.[0] ?? '')
  const [ordering, setOrdering] = useState(false)

  const colorLabel = product.colors.find((c) => c.id === colorId)?.label ?? ''
  const itemLabel = [product.name, colorLabel].filter(Boolean).join(' — ')

  return (
    <div className="boutique-modal-backdrop" onClick={onClose}>
      <div className="boutique-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="boutique-modal-close" onClick={onClose} aria-label="Fermer">
          ✕
        </button>

        <div className="boutique-modal-mockup">
          <MockupCanvas product={product} colorId={colorId} />
        </div>

        <div className="boutique-modal-info">
          <h3>{product.name}</h3>
          <p className="boutique-modal-description">{product.description}</p>
          <p className="boutique-modal-price">{PRIX_SUR_DEMANDE}</p>

          {product.colors.length > 1 && (
            <div className="boutique-option-group">
              <span className="boutique-option-label">Couleur — {colorLabel}</span>
              <div className="boutique-swatch-row">
                {product.colors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`boutique-swatch ${c.id === colorId ? 'boutique-swatch-active' : ''}`}
                    style={{ background: c.hex }}
                    onClick={() => setColorId(c.id)}
                    aria-label={c.label}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          )}

          {product.sizes && product.sizes.length > 0 && (
            <div className="boutique-option-group">
              <span className="boutique-option-label">Taille</span>
              <div className="boutique-size-row">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`boutique-size-chip ${s === size ? 'boutique-size-chip-active' : ''}`}
                    onClick={() => setSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!ordering ? (
            <button type="button" className="action-button boutique-order-button" onClick={() => setOrdering(true)}>
              Commander
            </button>
          ) : (
            <OrderForm itemLabel={itemLabel} initialNotes={size} onClose={() => setOrdering(false)} />
          )}
        </div>
      </div>
    </div>
  )
}
