import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import { landmarks, landmarkCategoryColors, landmarkCategoryIcons, type Landmark } from '../landmarks'
import { pois, type Poi } from '../poi'
import PoiIcon from '../PoiIcon'
import { SCENE_ORIGIN } from './terrainContext'
import { toLocalXZ, pointInPolygon } from './projection'
import { BOUNDARY_LOCAL } from './terrainContext'
import type { TerrainContext } from './terrainContext'

interface Props {
  terrain: TerrainContext
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
 *
 * Positions are left in real, unexaggerated meters, same as TerrainMesh and
 * CutawayWalls — this component is meant to be rendered inside the same
 * exaggeration-scaled <group> as those, so the one group scale lifts the
 * markers with the terrain instead of each component exaggerating on its own.
 */
export default function Markers({ terrain, onSelectLandmark }: Props) {
  const placedLandmarks = useMemo(() => {
    return landmarks
      .filter((l) => l.category === 'mirador')
      .map((l) => {
        const [x, z] = toLocalXZ(SCENE_ORIGIN, l.longitude, l.latitude)
        return { landmark: l, x, z }
      })
      .filter(({ x, z }) => pointInPolygon(x, z, BOUNDARY_LOCAL))
  }, [])

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
        const y = terrain.heightAtLocal(x, z)
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
      {placedPois.map(({ poi, x, z }: { poi: Poi; x: number; z: number }) => {
        const y = terrain.heightAtLocal(x, z)
        return (
          <Html key={poi.id} position={[x, y, z]} center distanceFactor={140} zIndexRange={[10, 0]}>
            <PoiIcon type={poi.icon} title={poi.name} />
          </Html>
        )
      })}
    </group>
  )
}
