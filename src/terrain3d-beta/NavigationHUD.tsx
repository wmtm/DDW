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
const GIZMO_RADIUS = 32
const GIZMO_MIN_R = 7
const GIZMO_MAX_R = 12

interface GizmoNodeRefs {
  line: SVGLineElement | null
  circle: SVGCircleElement | null
  text: SVGTextElement | null
}

/**
 * Projects a world axis (ex/ey/ez, one of the 3 unit vectors) onto the
 * gizmo's 2D face given the camera's current azimuth/elevation, the same
 * way a real orientation cube (Blender, Fusion 360, …) does: build the
 * camera's own right/up/forward basis from its spherical position (exactly
 * the formula Scene.tsx already uses for the camera's world position, see
 * settledPosition), then read off each axis's component along right/up for
 * its 2D position and along "toward the camera" for depth (used to make
 * the node facing the viewer read as closer: bigger and more opaque).
 */
function projectAxis(
  axis: readonly [number, number, number],
  azimuthDeg: number,
  elevationDeg: number,
): { x: number; y: number; depth: number } {
  const az = (azimuthDeg * Math.PI) / 180
  const el = (elevationDeg * Math.PI) / 180
  // Direction from the target to the camera — see Scene.tsx's settledPosition/sunPosition formulas.
  const dirX = Math.sin(az) * Math.cos(el)
  const dirY = Math.sin(el)
  const dirZ = Math.cos(az) * Math.cos(el)

  // right = normalize(worldUp × dir); worldUp = (0,1,0).
  let rightX = dirZ
  let rightZ = -dirX
  const rightLen = Math.hypot(rightX, rightZ) || 1
  rightX /= rightLen
  rightZ /= rightLen

  // up = dir × right.
  const upX = dirY * rightZ
  const upY = dirZ * rightX - dirX * rightZ
  const upZ = -dirY * rightX

  const [ax, ay, az_] = axis
  return {
    x: ax * rightX + ay * 0 + az_ * rightZ,
    y: ax * upX + ay * upY + az_ * upZ,
    depth: ax * dirX + ay * dirY + az_ * dirZ,
  }
}

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
  const gizmoYRef = useRef<GizmoNodeRefs>({ line: null, circle: null, text: null })
  const gizmoXRef = useRef<GizmoNodeRefs>({ line: null, circle: null, text: null })
  const gizmoZRef = useRef<GizmoNodeRefs>({ line: null, circle: null, text: null })

  const minimapPolygon = useMemo(() => buildMinimapPolygon(boundaryLocal, boundaryBounds), [boundaryLocal, boundaryBounds])

  // Initial paint, before the rAF loop below has run even once — recomputed
  // from whatever orientationRef already holds (CameraRig's own mount
  // default) rather than hardcoding a rest pose that would visibly jump on
  // the very first frame.
  const initial = orientationRef.current
  const initY = projectAxis([0, 1, 0], initial.azimuthDeg, initial.elevationDeg)
  const initX = projectAxis([1, 0, 0], initial.azimuthDeg, initial.elevationDeg)
  const initZ = projectAxis([0, 0, 1], initial.azimuthDeg, initial.elevationDeg)

  useEffect(() => {
    let raf = 0
    const applyGizmoNode = (ref: React.MutableRefObject<GizmoNodeRefs>, axis: readonly [number, number, number], azimuthDeg: number, elevationDeg: number, label: string) => {
      const { x, y, depth } = projectAxis(axis, azimuthDeg, elevationDeg)
      const nx = 50 + x * GIZMO_RADIUS
      const ny = 50 - y * GIZMO_RADIUS
      const r = GIZMO_MIN_R + ((depth + 1) / 2) * (GIZMO_MAX_R - GIZMO_MIN_R)
      const { line, circle, text } = ref.current
      if (line) {
        line.setAttribute('x2', nx.toFixed(2))
        line.setAttribute('y2', ny.toFixed(2))
      }
      if (circle) {
        circle.setAttribute('cx', nx.toFixed(2))
        circle.setAttribute('cy', ny.toFixed(2))
        circle.setAttribute('r', r.toFixed(2))
      }
      if (text) {
        text.setAttribute('x', nx.toFixed(2))
        text.setAttribute('y', (ny + r * 0.38).toFixed(2))
        text.setAttribute('font-size', (r * 1.05).toFixed(2))
        text.textContent = label
      }
    }

    const tick = () => {
      const { azimuthDeg, elevationDeg } = orientationRef.current
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
      applyGizmoNode(gizmoYRef, [0, 1, 0], azimuthDeg, elevationDeg, 'Y')
      applyGizmoNode(gizmoXRef, [1, 0, 0], azimuthDeg, elevationDeg, 'X')
      applyGizmoNode(gizmoZRef, [0, 0, 1], azimuthDeg, elevationDeg, 'Z')
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
      {/* Axis gizmo — top-right. A real orientation gizmo: each node's
          position (and its depth-based size) is recomputed every frame from
          the live camera orientation (see projectAxis), so it rotates in
          sync as the view orbits, the same way Blender's or Fusion 360's
          does — not just a static clickable icon. Clicking a node still
          snaps to that axis's canonical view, clamped to the same orbit
          limits a manual drag is held to (CameraRig's MIN/MAX_POLAR_ANGLE),
          so a snap can never land on the flat/thin side-on angle the camera
          is normally kept out of. */}
      <div className="isolate3d-gizmo" title="Points de vue">
        <svg viewBox="0 0 100 100" width="92" height="92">
          <line ref={(el) => (gizmoYRef.current.line = el)} x1="50" y1="50" x2={initY.x * GIZMO_RADIUS + 50} y2={50 - initY.y * GIZMO_RADIUS} stroke="#ade34a" strokeWidth="2.5" />
          <line ref={(el) => (gizmoXRef.current.line = el)} x1="50" y1="50" x2={initX.x * GIZMO_RADIUS + 50} y2={50 - initX.y * GIZMO_RADIUS} stroke="#ea3058" strokeWidth="2.5" />
          <line ref={(el) => (gizmoZRef.current.line = el)} x1="50" y1="50" x2={initZ.x * GIZMO_RADIUS + 50} y2={50 - initZ.y * GIZMO_RADIUS} stroke="#4f9fdc" strokeWidth="2.5" />
          <circle cx="22" cy="28" r="4.5" fill="#ec8ca3" />
          <circle cx="80" cy="36" r="5" fill="#a2c8e9" />
          <circle cx="60" cy="84" r="4.5" fill="#cee79c" />
          <g
            className="isolate3d-gizmo-node"
            onClick={flyToTop}
            onKeyDown={(e) => handleGizmoKeyDown(e, flyToTop)}
            role="button"
            tabIndex={0}
            aria-label="Vue du dessus"
          >
            <circle ref={(el) => (gizmoYRef.current.circle = el)} cx={initY.x * GIZMO_RADIUS + 50} cy={50 - initY.y * GIZMO_RADIUS} r="11" fill="#ade34a" />
            <text ref={(el) => (gizmoYRef.current.text = el)} x={initY.x * GIZMO_RADIUS + 50} y={50 - initY.y * GIZMO_RADIUS + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#17390a">
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
            <circle ref={(el) => (gizmoXRef.current.circle = el)} cx={initX.x * GIZMO_RADIUS + 50} cy={50 - initX.y * GIZMO_RADIUS} r="11" fill="#ea3058" />
            <text ref={(el) => (gizmoXRef.current.text = el)} x={initX.x * GIZMO_RADIUS + 50} y={50 - initX.y * GIZMO_RADIUS + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#3a0512">
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
            <circle ref={(el) => (gizmoZRef.current.circle = el)} cx={initZ.x * GIZMO_RADIUS + 50} cy={50 - initZ.y * GIZMO_RADIUS} r="11" fill="#4f9fdc" />
            <text ref={(el) => (gizmoZRef.current.text = el)} x={initZ.x * GIZMO_RADIUS + 50} y={50 - initZ.y * GIZMO_RADIUS + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#0a2338">
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
