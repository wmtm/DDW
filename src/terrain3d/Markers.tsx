import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import { landmarkCategoryColors, landmarkCategoryIcons, type Landmark } from '../landmarks'
import { pois, type Poi } from '../poi'
import PoiIcon from '../PoiIcon'
import type { WoundedDeerReport } from '../fieldReports'
import { SCENE_ORIGIN, displayHeightAtLocal, displaySurfaceHeightAtLocal } from './terrainContext'
import { toLocalXZ, pointInPolygon } from './projection'
import { BOUNDARY_LOCAL } from './terrainContext'
import type { TerrainContext } from './terrainContext'

interface Props {
  terrain: TerrainContext
  /**
   * Already filtered by the main app's own chutes/sites visibility rules
   * (passcode-gated chutes, the "Lieux remarquables & coraux" toggle) —
   * mirrors whatever is currently visible on the 2D map instead of a
   * separate, unconditional copy that would leak passcode-gated pins.
   */
  landmarks: Landmark[]
  /** Live pins from the field-report page (src/FieldReportPage.tsx) — same data the 2D map renders, kept in sync here too. */
  woundedDeerReports: WoundedDeerReport[]
  /** Used with displayHeightAtLocal so pins sit on the same detrended+exaggerated surface as the mesh, not a plain group scale any more. */
  exaggeration: number
  /** Used (mirador pins only) so a chute built up in a tree sits on the canopy top, not buried at ground level under it — see the per-pin height choice below. */
  canopyExaggeration: number
  onSelectLandmark?: (landmark: Landmark) => void
}

/**
 * Chute pins and the estate's reference POIs (entrance, camp, shop),
 * reusing the exact same .landmark-pin / .poi-marker markup the main
 * MapLibre map already uses, as drei <Html> billboards anchored to the
 * real terrain height at each point — so they sit on the surface instead
 * of floating. Only points that actually fall inside the parcel polygon
 * are shown, since anything outside it has no visible ground under it
 * (the terrain mesh is alpha-clipped to the boundary).
 */
export default function Markers({ terrain, landmarks, woundedDeerReports, exaggeration, canopyExaggeration, onSelectLandmark }: Props) {
  const placedLandmarks = useMemo(() => {
    return landmarks
      .map((l) => {
        const [x, z] = toLocalXZ(SCENE_ORIGIN, l.longitude, l.latitude)
        return { landmark: l, x, z }
      })
      .filter(({ x, z }) => pointInPolygon(x, z, BOUNDARY_LOCAL))
  }, [landmarks])

  const placedWoundedDeerReports = useMemo(() => {
    return woundedDeerReports
      .map((r) => {
        const [x, z] = toLocalXZ(SCENE_ORIGIN, r.longitude, r.latitude)
        return { report: r, x, z }
      })
      .filter(({ x, z }) => pointInPolygon(x, z, BOUNDARY_LOCAL))
  }, [woundedDeerReports])

  const placedPois = useMemo(() => {
    return pois
      .map((p) => {
        const [x, z] = toLocalXZ(SCENE_ORIGIN, p.longitude, p.latitude)
        return { poi: p, x, z }
      })
      .filter(({ x, z }) => pointInPolygon(x, z, BOUNDARY_LOCAL))
  }, [])

  return (
    <group>
      {placedLandmarks.map(({ landmark, x, z }) => {
        // Miradors are physically built up in a tree, not standing on bare
        // ground — anchoring them to ground height alone left the pin
        // buried inside the mesh's own (exaggerated) canopy bump at that
        // spot, often hard to spot at all. Every other category really is
        // a ground-level feature, so it keeps the plain ground height.
        const y =
          landmark.category === 'mirador'
            ? displaySurfaceHeightAtLocal(terrain, x, z, exaggeration, canopyExaggeration)
            : displayHeightAtLocal(terrain, x, z, exaggeration)
        return (
          <Html key={landmark.id} position={[x, y, z]} center distanceFactor={140} zIndexRange={[10, 0]}>
            <div
              className="landmark-pin"
              style={{ background: landmarkCategoryColors[landmark.category], cursor: onSelectLandmark ? 'pointer' : undefined }}
              title={landmark.name || (landmark.number !== null ? `Chute ${landmark.number}` : '')}
              onClick={() => onSelectLandmark?.(landmark)}
            >
              {landmark.number !== null && <span className="landmark-pin-number">{landmark.number}</span>}
              {landmarkCategoryIcons[landmark.category] && (
                <span className="landmark-pin-icon">{landmarkCategoryIcons[landmark.category]}</span>
              )}
            </div>
          </Html>
        )
      })}
      {placedWoundedDeerReports.map(({ report, x, z }) => {
        const y = displayHeightAtLocal(terrain, x, z, exaggeration)
        return (
          <Html key={report.id} position={[x, y, z]} center distanceFactor={140} zIndexRange={[10, 0]}>
            <div
              className={`wounded-deer-pin ${report.foundAt ? 'wounded-deer-pin-found' : ''}`}
              title={report.foundAt ? 'Animal trouvé' : 'Animal blessé'}
            />
          </Html>
        )
      })}
      {placedPois.map(({ poi, x, z }: { poi: Poi; x: number; z: number }) => {
        const y = displayHeightAtLocal(terrain, x, z, exaggeration)
        return (
          <Html key={poi.id} position={[x, y, z]} center distanceFactor={140} zIndexRange={[10, 0]}>
            <PoiIcon type={poi.icon} title={poi.name} />
          </Html>
        )
      })}
    </group>
  )
}
