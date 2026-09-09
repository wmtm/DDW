import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { LandmarkPhoto } from './landmarks'

interface Props {
  photos: LandmarkPhoto[]
  initialIndex: number
  onClose: () => void
}

const PANORAMA_ASPECT_THRESHOLD = 2
const MOMENTUM_DECAY = 0.94
const MOMENTUM_STOP_VELOCITY = 0.05

export default function PhotoLightbox({ photos, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex)
  const [isPanoramic, setIsPanoramic] = useState(false)

  const frameRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const translateRef = useRef(0)
  const boundsRef = useRef({ min: 0, max: 0 })
  const dragRef = useRef<{
    active: boolean
    startX: number
    startTranslate: number
    lastX: number
    lastTime: number
    velocity: number
  } | null>(null)
  const momentumFrameRef = useRef<number | null>(null)
  const aspectRef = useRef(1)

  const photo = photos[index]

  const applyTranslate = useCallback((x: number) => {
    const { min, max } = boundsRef.current
    const clamped = Math.min(max, Math.max(min, x))
    translateRef.current = clamped
    if (imgRef.current) imgRef.current.style.transform = `translateX(${clamped}px)`
    return clamped
  }, [])

  const stopMomentum = useCallback(() => {
    if (momentumFrameRef.current !== null) {
      cancelAnimationFrame(momentumFrameRef.current)
      momentumFrameRef.current = null
    }
  }, [])

  const runMomentum = useCallback(
    (velocity: number) => {
      stopMomentum()
      const step = () => {
        velocity *= MOMENTUM_DECAY
        const next = applyTranslate(translateRef.current + velocity)
        if (Math.abs(velocity) < MOMENTUM_STOP_VELOCITY || next === boundsRef.current.min || next === boundsRef.current.max) {
          momentumFrameRef.current = null
          return
        }
        momentumFrameRef.current = requestAnimationFrame(step)
      }
      momentumFrameRef.current = requestAnimationFrame(step)
    },
    [applyTranslate, stopMomentum],
  )

  const resetPan = useCallback(() => {
    stopMomentum()
    translateRef.current = 0
    boundsRef.current = { min: 0, max: 0 }
    if (imgRef.current) imgRef.current.style.transform = 'translateX(0px)'
    setIsPanoramic(false)
  }, [stopMomentum])

  useEffect(() => {
    resetPan()
  }, [index, resetPan])

  useEffect(() => stopMomentum, [stopMomentum])

  const handleImageLoad = useCallback(() => {
    const img = imgRef.current
    if (!img) return
    const aspect = img.naturalWidth / img.naturalHeight
    aspectRef.current = aspect
    setIsPanoramic(aspect > PANORAMA_ASPECT_THRESHOLD)
  }, [])

  // Runs after the DOM reflects isPanoramic (i.e. after the panoramic CSS
  // class — and its fixed frame size — is actually applied), so the frame's
  // measured dimensions are the real ones, not the pre-panoramic layout.
  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!isPanoramic || !frame) {
      boundsRef.current = { min: 0, max: 0 }
      return
    }
    const frameWidth = frame.clientWidth
    const frameHeight = frame.clientHeight
    const renderedWidth = frameHeight * aspectRef.current
    boundsRef.current = { min: Math.min(0, frameWidth - renderedWidth), max: 0 }
    translateRef.current = 0
    if (imgRef.current) imgRef.current.style.transform = 'translateX(0px)'
  }, [isPanoramic])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isPanoramic) return
      stopMomentum()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      dragRef.current = {
        active: true,
        startX: e.clientX,
        startTranslate: translateRef.current,
        lastX: e.clientX,
        lastTime: performance.now(),
        velocity: 0,
      }
    },
    [isPanoramic, stopMomentum],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      if (!drag?.active) return
      const now = performance.now()
      const dt = Math.max(1, now - drag.lastTime)
      const instantVelocity = ((e.clientX - drag.lastX) / dt) * 16.7
      applyTranslate(drag.startTranslate + (e.clientX - drag.startX))
      drag.velocity = instantVelocity
      drag.lastX = e.clientX
      drag.lastTime = now
    },
    [applyTranslate],
  )

  const endDrag = useCallback(() => {
    const drag = dragRef.current
    if (!drag?.active) return
    drag.active = false
    if (Math.abs(drag.velocity) > MOMENTUM_STOP_VELOCITY) runMomentum(drag.velocity)
  }, [runMomentum])

  const goPrevious = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const goNext = useCallback(() => setIndex((i) => Math.min(photos.length - 1, i + 1)), [photos.length])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') goPrevious()
      else if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, goPrevious, goNext])

  return createPortal(
    <div className="lightbox-backdrop" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close">
        ×
      </button>

      {photos.length > 1 && index > 0 && (
        <button
          className="lightbox-nav lightbox-nav-prev"
          onClick={(e) => {
            e.stopPropagation()
            goPrevious()
          }}
          aria-label="Previous photo"
        >
          ‹
        </button>
      )}

      <div
        ref={frameRef}
        className={`lightbox-frame ${isPanoramic ? 'lightbox-frame-panoramic' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <img
          ref={imgRef}
          src={photo.src}
          alt={photo.caption ?? ''}
          className={isPanoramic ? 'lightbox-image-panoramic' : 'lightbox-image'}
          onLoad={handleImageLoad}
          draggable={false}
        />
      </div>

      {photos.length > 1 && index < photos.length - 1 && (
        <button
          className="lightbox-nav lightbox-nav-next"
          onClick={(e) => {
            e.stopPropagation()
            goNext()
          }}
          aria-label="Next photo"
        >
          ›
        </button>
      )}

      <div className="lightbox-caption" onClick={(e) => e.stopPropagation()}>
        {photo.caption && <span>{photo.caption}</span>}
        {photos.length > 1 && (
          <span className="hint">
            {index + 1} / {photos.length}
            {isPanoramic ? ' · drag to look around' : ''}
          </span>
        )}
        {photos.length === 1 && isPanoramic && <span className="hint">Drag to look around</span>}
      </div>
    </div>,
    document.body,
  )
}
