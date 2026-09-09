import { useState } from 'react'
import { landmarkCategoryLabels, type Landmark } from './landmarks'
import PhotoLightbox from './PhotoLightbox'

interface Props {
  landmark: Landmark
  index: number
  total: number
  onNext: () => void
  onPrevious: () => void
  onExit: () => void
}

export default function LandmarkTourCard({ landmark, index, total, onNext, onPrevious, onExit }: Props) {
  const [openPhotoIndex, setOpenPhotoIndex] = useState<number | null>(null)

  return (
    <div className="landmark-tour-card">
      <div className="landmark-tour-header">
        <h3>
          {landmark.number !== null ? `Chute ${landmark.number} — ` : ''}
          {landmark.name}
        </h3>
        <span className="hint">
          {index + 1} / {total}
        </span>
      </div>
      <span className="hint">{landmarkCategoryLabels[landmark.category]}</span>
      <p>{landmark.description}</p>
      {landmark.photos.length > 0 && (
        <div className="landmark-tour-photos">
          {landmark.photos.map((photo, i) => (
            <button
              key={i}
              className="photo-thumb-button"
              onClick={() => setOpenPhotoIndex(i)}
              aria-label={`View photo: ${photo.caption ?? landmark.name}`}
            >
              <img src={photo.src} alt={photo.caption ?? landmark.name} title={photo.caption} />
            </button>
          ))}
        </div>
      )}
      <div className="landmark-tour-nav">
        <button className="action-button" onClick={onPrevious} disabled={index === 0}>
          Previous
        </button>
        <button className="action-button" onClick={onNext} disabled={index === total - 1}>
          Next
        </button>
        <button className="clear-button" onClick={onExit}>
          Exit
        </button>
      </div>

      {openPhotoIndex !== null && (
        <PhotoLightbox
          photos={landmark.photos}
          initialIndex={openPhotoIndex}
          onClose={() => setOpenPhotoIndex(null)}
        />
      )}
    </div>
  )
}
