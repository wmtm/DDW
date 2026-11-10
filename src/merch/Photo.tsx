import type { MerchImage } from './images'

/**
 * One product photo in its frame — the cream backdrop keeps the grid
 * looking consistent even if the client's source photos have different
 * backgrounds of their own (object-fit: contain never crops), and a soft
 * floor shadow is added under genuinely transparent photos (detected at
 * build time, see scripts/build-merch-images.mjs) so they don't look like
 * they're floating. Renders the "visuel bientôt disponible" placeholder
 * whenever `image` is null, i.e. there's no real photo for this product/
 * colour yet.
 */
export function Photo({
  image,
  size,
  alt,
  onClick,
  className,
}: {
  image: MerchImage | null
  size: 'thumb' | 'full'
  alt: string
  onClick?: () => void
  className?: string
}) {
  if (!image) return <ImagePlaceholder className={className} />
  const variant = image[size]
  return (
    <div
      className={`boutique-photo-frame ${onClick ? 'boutique-photo-frame-clickable' : ''} ${className ?? ''}`}
      onClick={onClick}
    >
      {image.transparent && <div className="boutique-photo-shadow" />}
      <img
        src={variant.src}
        width={variant.w}
        height={variant.h}
        alt={alt}
        loading="lazy"
        className="boutique-photo-img"
      />
    </div>
  )
}

export function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div className={`boutique-photo-frame boutique-photo-placeholder ${className ?? ''}`}>
      <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="1.6" />
        <path d="M3 17 L8.5 12.5 L13 16 L16.5 12.5 L21 16.5" />
      </svg>
      <span>Visuel bientôt disponible</span>
    </div>
  )
}
