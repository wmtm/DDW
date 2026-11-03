import { useEffect, useMemo, useRef } from 'react'
import type { CameraOrientation, CameraRigHandle } from './CameraRig'

interface BoundaryBounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

interface Props {
  cameraApi: React.RefObject<CameraRigHandle>
  orientationRef: React.MutableRefObject<CameraOrientation>
  boundaryLocal: [number, number][]
  boundaryBounds: BoundaryBounds
  minElevationDeg: number
  maxElevationDeg: number
}

const MINIMAP_PAD = 14
const MARKER_ORBIT = 42

function buildMinimapPolygon(boundary: [number, number][], bounds: BoundaryBounds): string {
  const spanX = bounds.maxX - bounds.minX || 1
  const spanZ = bounds.maxZ - bounds.minZ || 1
  const span = Math.max(spanX, spanZ)
  const scale = (100 - MINIMAP_PAD * 2) / span
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerZ = (bounds.minZ + bounds.maxZ) / 2
  return boundary
    .map(([x, z]) => `${(50 + (x - centerX) * scale).toFixed(2)},${(50 + (z - centerZ) * scale).toFixed(2)}`)
    .join(' ')
}

function handleGizmoKeyDown(e: React.KeyboardEvent, action: () => void) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    action()
  }
}

/**
 * Pure-DOM overlay for the beta 3D view's navigation controls: a compass +
 * zoom stack, a top-down minimap with a live camera marker, a one-time
 * gesture hint, and a molecule-style axis gizmo for snapping to canonical
 * views. Lives outside the R3F <Canvas> (so it's plain React/CSS, not drei
 * <Html>), and reads the camera's live orientation off `orientationRef` — a
 * plain object CameraRig mutates every frame — via its own rAF loop rather
 * than React state, so a 60fps needle/marker update never forces a React
 * re-render of the rest of the view.
 */
export default function NavigationHUD({
  cameraApi,
  orientationRef,
  boundaryLocal,
  boundaryBounds,
  minElevationDeg,
  maxElevationDeg,
}: Props) {
  const compassNeedleRef = useRef<SVGGElement | null>(null)
  const minimapMarkerRef = useRef<SVGGElement | null>(null)

  const minimapPolygon = useMemo(() => buildMinimapPolygon(boundaryLocal, boundaryBounds), [boundaryLocal, boundaryBounds])

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const { azimuthDeg } = orientationRef.current
      if (compassNeedleRef.current) {
        compassNeedleRef.current.setAttribute('transform', `rotate(${(-azimuthDeg).toFixed(1)} 24 24)`)
      }
      if (minimapMarkerRef.current) {
        const az = (azimuthDeg * Math.PI) / 180
        const dx = Math.sin(az) * MARKER_ORBIT
        const dy = Math.cos(az) * MARKER_ORBIT
        minimapMarkerRef.current.setAttribute(
          'transform',
          `translate(${dx.toFixed(2)} ${dy.toFixed(2)}) rotate(${(-azimuthDeg).toFixed(1)})`,
        )
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [orientationRef])

  const flyToTop = () => cameraApi.current?.flyTo(orientationRef.current.azimuthDeg, maxElevationDeg)
  const flyToEast = () => cameraApi.current?.flyTo(90, minElevationDeg)
  const flyToSouth = () => cameraApi.current?.flyTo(0, minElevationDeg)
  const reorientNorth = () => cameraApi.current?.flyTo(0, orientationRef.current.elevationDeg)

  return (
    <>
      {/* Axis gizmo — top-left. Each node snaps to a canonical view along
          that axis, clamped to the same orbit limits a manual drag is held
          to (CameraRig's MIN/MAX_POLAR_ANGLE), so a snap can never land on
          the flat/thin side-on angle the camera is normally kept out of. */}
      <div className="isolate3d-gizmo" title="Points de vue">
        <svg viewBox="0 0 100 100" width="84" height="84">
          <line x1="50" y1="50" x2="50" y2="20" stroke="rgba(242,237,226,0.35)" strokeWidth="2" />
          <line x1="50" y1="50" x2="76" y2="64" stroke="rgba(242,237,226,0.35)" strokeWidth="2" />
          <line x1="50" y1="50" x2="26" y2="62" stroke="rgba(242,237,226,0.35)" strokeWidth="2" />
          <circle cx="24" cy="30" r="4" fill="#f9a8c9" opacity="0.55" />
          <circle cx="78" cy="38" r="4.5" fill="#93c5f0" opacity="0.55" />
          <circle cx="58" cy="82" r="4" fill="#bfe08a" opacity="0.5" />
          <circle cx="50" cy="50" r="7" fill="#2a241b" stroke="rgba(242,237,226,0.5)" strokeWidth="1.5" />
          <g
            className="isolate3d-gizmo-node"
            onClick={flyToTop}
            onKeyDown={(e) => handleGizmoKeyDown(e, flyToTop)}
            role="button"
            tabIndex={0}
            aria-label="Vue du dessus"
          >
            <circle cx="50" cy="20" r="9" fill="#5fcf6a" stroke="#1a1407" strokeWidth="1.5" />
            <text x="50" y="23.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0d1a0e">
              Y
            </text>
          </g>
          <g
            className="isolate3d-gizmo-node"
            onClick={flyToEast}
            onKeyDown={(e) => handleGizmoKeyDown(e, flyToEast)}
            role="button"
            tabIndex={0}
            aria-label="Vue depuis l'est"
          >
            <circle cx="76" cy="64" r="9" fill="#ef5b5b" stroke="#1a1407" strokeWidth="1.5" />
            <text x="76" y="67.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#2b0b0b">
              X
            </text>
          </g>
          <g
            className="isolate3d-gizmo-node"
            onClick={flyToSouth}
            onKeyDown={(e) => handleGizmoKeyDown(e, flyToSouth)}
            role="button"
            tabIndex={0}
            aria-label="Vue depuis le sud"
          >
            <circle cx="26" cy="62" r="9" fill="#5b9bef" stroke="#1a1407" strokeWidth="1.5" />
            <text x="26" y="65.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0b1a2b">
              Z
            </text>
          </g>
        </svg>
      </div>

      {/* Minimap — top-right, below the close button. The marker orbits the
          fixed parcel outline at the camera's live azimuth and its cone
          always points back at the target, so it's a true "where am I
          looking from" indicator, not a decorative compass. */}
      <div className="isolate3d-minimap" title="Position de la caméra">
        <svg viewBox="0 0 100 100" width="118" height="118">
          <polygon points={minimapPolygon} fill="rgba(147,145,106,0.4)" stroke="rgba(242,237,226,0.5)" strokeWidth="1.2" />
          <g ref={minimapMarkerRef}>
            <path d="M0,-9 L5,2 L0,-1 L-5,2 Z" fill="#ffd166" stroke="#1a1407" strokeWidth="1" />
          </g>
        </svg>
      </div>

      {/* Zoom + compass — bottom-right, stacked above each other. */}
      <div className="isolate3d-zoom-stack">
        <button type="button" aria-label="Zoomer" onClick={() => cameraApi.current?.zoomBy(0.82)}>
          +
        </button>
        <button type="button" aria-label="Dézoomer" onClick={() => cameraApi.current?.zoomBy(1.22)}>
          −
        </button>
      </div>
      <button
        type="button"
        className="isolate3d-compass"
        onClick={reorientNorth}
        aria-label="Réorienter vers le nord"
        title="Cliquez pour réorienter vers le nord"
      >
        <svg viewBox="0 0 48 48" width="100%" height="100%">
          <circle cx="24" cy="24" r="21" className="isolate3d-compass-ring" />
          <g ref={compassNeedleRef}>
            <polygon points="24,6 19,24 24,20 29,24" fill="#ffd166" />
            <polygon points="24,42 19,24 24,28 29,24" fill="rgba(255,255,255,0.35)" />
            <text x="24" y="15" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1a1407">
              N
            </text>
          </g>
          <circle cx="24" cy="24" r="2" fill="rgba(242,237,226,0.7)" />
        </svg>
      </button>

      {/* One-time gesture hint — fades in then out on mount, no persistent chrome left behind. */}
      <div className="isolate3d-gesture-hints" aria-hidden="true">
        <div className="isolate3d-gesture-hint">
          <svg viewBox="0 0 64 64" width="44" height="44">
            <circle cx="32" cy="32" r="30" fill="rgba(20,16,10,0.55)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
            <path d="M20 40 Q 32 14 44 40" fill="none" stroke="#ffd166" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="20" cy="40" r="3.5" fill="#ffd166" />
            <circle cx="44" cy="40" r="3.5" fill="#ffd166" />
          </svg>
          <span>Glisser pour pivoter</span>
        </div>
        <div className="isolate3d-gesture-hint isolate3d-gesture-hint-2">
          <svg viewBox="0 0 64 64" width="44" height="44">
            <circle cx="32" cy="32" r="30" fill="rgba(20,16,10,0.55)" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
            <line x1="22" y1="40" x2="32" y2="24" stroke="#ffd166" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="42" y1="40" x2="32" y2="24" stroke="#ffd166" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="22" cy="40" r="3.5" fill="#ffd166" />
            <circle cx="42" cy="40" r="3.5" fill="#ffd166" />
          </svg>
          <span>Pincer pour zoomer</span>
        </div>
      </div>
    </>
  )
}
