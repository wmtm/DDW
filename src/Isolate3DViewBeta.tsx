import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import './terrain3d-beta/Isolate3D.css'
import { BOUNDARY_LOCAL, BOUNDARY_LOCAL_BOUNDS, loadTerrainContext } from './terrain3d-beta/terrainContext'
import { buildTerrainTextures, type TerrainTextures } from './terrain3d-beta/satelliteTexture'
import Scene from './terrain3d-beta/Scene'
import NavigationHUD from './terrain3d-beta/NavigationHUD'
import { MIN_POLAR_ANGLE, MAX_POLAR_ANGLE } from './terrain3d-beta/CameraRig'
import type { CameraOrientation, CameraRigHandle } from './terrain3d-beta/CameraRig'
import type { TerrainContext } from './terrain3d-beta/terrainContext'
import type { Landmark } from './landmarks'

interface Props {
  onClose: () => void
  landmarks: Landmark[]
  onSelectLandmark?: (landmark: Landmark) => void
}

const DEFAULT_EXAGGERATION = 2.75
const DEFAULT_CANOPY_EXAGGERATION = 1.75
const DEFAULT_SUN_AZIMUTH = 55
const DEFAULT_SUN_ELEVATION = 28

/**
 * The premium 3D cutaway: a dedicated Three.js scene (not MapLibre), lazy-
 * loaded only when the "Isoler le domaine" toggle opens so visitors who
 * never use it never download the Three.js bundle. Built from the same
 * parcel boundary as the main map, over a pre-baked Copernicus DEM
 * heightmap (see terrain3d/elevationData.ts) and satellite tiles fetched
 * live for just the estate's footprint.
 */
export default function Isolate3DView({ onClose, landmarks, onSelectLandmark }: Props) {
  const [terrain, setTerrain] = useState<TerrainContext | null>(null)
  const [textures, setTextures] = useState<TerrainTextures | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [exaggeration, setExaggeration] = useState(DEFAULT_EXAGGERATION)
  const [canopyExaggeration, setCanopyExaggeration] = useState(DEFAULT_CANOPY_EXAGGERATION)
  const [sunAzimuth, setSunAzimuth] = useState(DEFAULT_SUN_AZIMUTH)
  const [sunElevation, setSunElevation] = useState(DEFAULT_SUN_ELEVATION)
  const [resetToken, setResetToken] = useState(0)

  const cameraRigRef = useRef<CameraRigHandle>(null)
  // Matches Scene.tsx's own settledPosition default (azimuth 35°, elevation
  // 48°) so the compass/minimap read something sane on the very first frame,
  // before CameraRig's own useFrame has written a real value.
  const orientationRef = useRef<CameraOrientation>({ azimuthDeg: 35, elevationDeg: 48, distance: 0 })
  const minElevationDeg = 90 - THREE.MathUtils.radToDeg(MAX_POLAR_ANGLE)
  const maxElevationDeg = 90 - THREE.MathUtils.radToDeg(MIN_POLAR_ANGLE)

  const isMobile = useMemo(() => {
    try {
      return window.matchMedia('(max-width: 720px)').matches
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    loadTerrainContext()
      .then((ctx) => {
        if (cancelled) return
        setTerrain(ctx)
        return buildTerrainTextures(ctx)
      })
      .then((tex) => {
        if (cancelled || !tex) return
        setTextures(tex)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      textures?.map.dispose()
      textures?.alphaMap.dispose()
    }
  }, [textures])

  // Prevent the page behind the overlay from scrolling while it's open.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  const ready = terrain !== null && textures !== null

  return (
    <div className="isolate3d-overlay">
      <button type="button" className="isolate3d-close" onClick={onClose} aria-label="Quitter la vue 3D" title="Quitter la vue 3D">
        ✕
      </button>

      {!ready && !loadError && (
        <div className="isolate3d-loading">
          <div className="isolate3d-loading-spinner" />
          <p>Préparation du relief du domaine…</p>
        </div>
      )}

      {loadError && (
        <div className="isolate3d-loading">
          <p>Le relief n'a pas pu se charger. Réessayez dans un instant.</p>
        </div>
      )}

      {ready && (
        <>
          <div className="isolate3d-canvas-wrap">
            <Canvas
              shadows
              dpr={Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2)}
              gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
              camera={{ near: 1, far: 20000, fov: 50 }}
            >
              <Scene
                terrain={terrain}
                textures={textures}
                exaggeration={exaggeration}
                canopyExaggeration={canopyExaggeration}
                sunAzimuthDeg={sunAzimuth}
                sunElevationDeg={sunElevation}
                isMobile={isMobile}
                resetToken={resetToken}
                landmarks={landmarks}
                onSelectLandmark={onSelectLandmark}
                cameraRigRef={cameraRigRef}
                orientationRef={orientationRef}
              />
            </Canvas>
          </div>

          <NavigationHUD
            cameraApi={cameraRigRef}
            orientationRef={orientationRef}
            boundaryLocal={BOUNDARY_LOCAL}
            boundaryBounds={BOUNDARY_LOCAL_BOUNDS}
            minElevationDeg={minElevationDeg}
            maxElevationDeg={maxElevationDeg}
          />

          <div className="isolate3d-panel">
            <p className="isolate3d-panel-title">Vue plateforme 3D (BETA)</p>
            <label className="isolate3d-slider-row">
              <span className="isolate3d-slider-label">
                <span>Exagération du relief</span>
                <span>{exaggeration.toFixed(1)}×</span>
              </span>
              <input
                type="range"
                min={1}
                max={6}
                step={0.1}
                value={exaggeration}
                onChange={(e) => setExaggeration(Number(e.target.value))}
              />
            </label>
            <label className="isolate3d-slider-row">
              <span className="isolate3d-slider-label">
                <span>Hauteur de la canopée</span>
                <span>{canopyExaggeration.toFixed(1)}×</span>
              </span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={canopyExaggeration}
                onChange={(e) => setCanopyExaggeration(Number(e.target.value))}
              />
            </label>
            <label className="isolate3d-slider-row">
              <span className="isolate3d-slider-label">
                <span>Angle du soleil</span>
                <span>{Math.round(sunElevation)}°</span>
              </span>
              <input
                type="range"
                min={8}
                max={75}
                step={1}
                value={sunElevation}
                onChange={(e) => setSunElevation(Number(e.target.value))}
              />
            </label>
            <label className="isolate3d-slider-row">
              <span className="isolate3d-slider-label">
                <span>Orientation du soleil</span>
                <span>{Math.round(sunAzimuth)}°</span>
              </span>
              <input
                type="range"
                min={0}
                max={359}
                step={1}
                value={sunAzimuth}
                onChange={(e) => setSunAzimuth(Number(e.target.value))}
              />
            </label>
            <button type="button" className="isolate3d-reset-button" onClick={() => setResetToken((n) => n + 1)}>
              Réinitialiser la vue
            </button>
          </div>
        </>
      )}
    </div>
  )
}
