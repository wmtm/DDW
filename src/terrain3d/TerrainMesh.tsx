import { useMemo } from 'react'
import * as THREE from 'three'
import { SCENE_ORIGIN, TERRAIN_LNGLAT_BOUNDS } from './terrainContext'
import { toLocalXZ } from './projection'
import type { TerrainContext } from './terrainContext'
import type { TerrainTextures } from './satelliteTexture'

interface Props {
  terrain: TerrainContext
  textures: TerrainTextures
}

/** Vertex density — tuned so spacing lands close to the DEM's own ~30m native resolution rather than faking detail the source data doesn't have. */
const RESOLUTION_X = 192
const RESOLUTION_Z = 224

/**
 * The displaced terrain surface, clipped to the parcel boundary via the
 * material's alpha map (crisp even on the estate's concave notches, which a
 * hand-rolled constrained triangulation would need real care to get right).
 * Heights are left in true, unexaggerated meters — the scene applies
 * exaggeration as a uniform Y-scale on the whole group above this, so
 * dragging the slider never rebuilds geometry.
 */
export default function TerrainMesh({ terrain, textures }: Props) {
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
      const height = terrain.heightAtLocal(localX, localZ)
      position.setY(i, height)

      // PlaneGeometry's default V runs bottom-to-top in its own local
      // space; flip it to match the texture's north-at-top row order,
      // which already covers this same TERRAIN_LNGLAT_BOUNDS rectangle.
      uv.setY(i, 1 - uv.getY(i))
    }
    position.needsUpdate = true
    geo.computeVertexNormals()
    return geo
  }, [terrain])

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
