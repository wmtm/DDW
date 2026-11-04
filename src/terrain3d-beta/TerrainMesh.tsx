import { useMemo } from 'react'
import * as THREE from 'three'
import { SCENE_ORIGIN, TERRAIN_LNGLAT_BOUNDS, displaySurfaceHeightAtLocal } from './terrainContext'
import { toLocalXZ } from './projection'
import type { TerrainContext } from './terrainContext'
import type { TerrainTextures } from './satelliteTexture'

interface Props {
  terrain: TerrainContext
  textures: TerrainTextures
  /** Baked directly into vertex Y (not a group scale) so only local relief is exaggerated, not the regional slope — see displayHeightAtLocal. */
  exaggeration: number
  /** Independent exaggeration applied to canopy height on top of the ground — see displaySurfaceHeightAtLocal. */
  canopyExaggeration: number
}

/**
 * Vertex density. The ground DEM is only ~30m native resolution, but the
 * canopy-height data baked into this same mesh (see canopyData.ts) is
 * ~2.4m — a firebreak or track can be just a few meters wide, so matching
 * the DEM's own coarseness here would smooth those features away entirely.
 * ~7-8m spacing resolves them with a few vertices across without going all
 * the way to the canopy data's native density, which the mesh doesn't need.
 */
const RESOLUTION_X = 384
const RESOLUTION_Z = 448

/**
 * The displaced terrain surface, clipped to the parcel boundary via the
 * material's alpha map (crisp even on the estate's concave notches, which a
 * hand-rolled constrained triangulation would need real care to get right).
 * Vertex Y is the exaggerated ground plus exaggerated canopy on top (see
 * displaySurfaceHeightAtLocal) — rebuilt whenever either exaggeration
 * slider moves, since both are baked directly into the geometry rather
 * than applied as a group scale (see displayHeightAtLocal for why: a
 * uniform scale would exaggerate the regional slope too, not just relief).
 */
export default function TerrainMesh({ terrain, textures, exaggeration, canopyExaggeration }: Props) {
  const geometry = useMemo(() => {
    const [minX, minZ] = toLocalXZ(SCENE_ORIGIN, TERRAIN_LNGLAT_BOUNDS.minLng, TERRAIN_LNGLAT_BOUNDS.maxLat)
    const [maxX, maxZ] = toLocalXZ(SCENE_ORIGIN, TERRAIN_LNGLAT_BOUNDS.maxLng, TERRAIN_LNGLAT_BOUNDS.minLat)

    const geo = new THREE.PlaneGeometry(maxX - minX, maxZ - minZ, RESOLUTION_X - 1, RESOLUTION_Z - 1)
    geo.rotateX(-Math.PI / 2)

    const position = geo.attributes.position
    const uv = geo.attributes.uv
    for (let i = 0; i < position.count; i++) {
      const localX = position.getX(i) + (minX + maxX) / 2
      const localZ = position.getZ(i) + (minZ + maxZ) / 2
      const height = displaySurfaceHeightAtLocal(terrain, localX, localZ, exaggeration, canopyExaggeration)
      position.setY(i, height)

      // PlaneGeometry's default V runs bottom-to-top in its own local
      // space; flip it to match the texture's north-at-top row order,
      // which already covers this same TERRAIN_LNGLAT_BOUNDS rectangle.
      uv.setY(i, 1 - uv.getY(i))
    }
    position.needsUpdate = true
    geo.computeVertexNormals()
    return geo
  }, [terrain, exaggeration, canopyExaggeration])

  return (
    <mesh geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial
        map={textures.map}
        alphaMap={textures.alphaMap}
        alphaTest={0.5}
        roughness={0.92}
        metalness={0}
      />
    </mesh>
  )
}
