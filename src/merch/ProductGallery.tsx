import { useEffect, useState } from 'react'
import { imagesFor } from './images'
import { Photo } from './Photo'

/**
 * The detail panel's image side: the selected view shown large (click to
 * zoom into a lightbox), with a thumbnail strip to switch between the
 * views that exist (face/dos/detail) for the current colour. Resets back
 * to the first view whenever the product or colour changes.
 */
export default function ProductGallery({ productId, colorId, alt }: { productId: string; colorId: string; alt: string }) {
  const images = imagesFor(productId, colorId)
  const [activeIndex, setActiveIndex] = useState(0)
  const [zoomed, setZoomed] = useState(false)

  useEffect(() => {
    setActiveIndex(0)
    setZoomed(false)
  }, [productId, colorId])

  const active = images[activeIndex] ?? null

  return (
    <div className="boutique-gallery">
      <Photo
        image={active}
        size="full"
        alt={alt}
        className="boutique-gallery-main"
        onClick={active ? () => setZoomed(true) : undefined}
      />

      {images.length > 1 && (
        <div className="boutique-gallery-thumbs">
          {images.map((img, i) => (
            <button
              key={img.view}
              type="button"
              className={`boutique-gallery-thumb ${i === activeIndex ? 'boutique-gallery-thumb-active' : ''}`}
              onClick={() => setActiveIndex(i)}
              aria-label={img.view}
            >
              <Photo image={img} size="thumb" alt={`${alt} — ${img.view}`} />
            </button>
          ))}
        </div>
      )}

      {zoomed && active && (
        <div className="boutique-lightbox" onClick={() => setZoomed(false)}>
          <img src={active.full.src} alt={alt} className="boutique-lightbox-img" />
          <button type="button" className="boutique-lightbox-close" aria-label="Fermer" onClick={() => setZoomed(false)}>
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
