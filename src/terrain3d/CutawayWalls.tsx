import { useMemo } from 'react'
import * as THREE from 'three'
import { BOUNDARY_LOCAL } from './terrainContext'
import { FOOTPRINT_TRIANGLES } from './boundaryTriangulation'
import './SoilShaderMaterial'
import type { TerrainContext } from './terrainContext'

interface Props {
  terrain: TerrainContext
  /** How far below the lowest terrain point the cut extends, in real (unexaggerated) meters. */
  depthBelowMin?: number
  /** Normalized direction toward the sun, kept in sync with the scene's directional light. */
  sunDirection: THREE.Vector3
}

/**
 * The cut face around the estate: a wall dropped from the real terrain
 * surface along the property line down to a flat bottom. Each boundary
 * segment is its own unshared quad (not indexed/shared with neighbors) so
 * computeVertexNormals() gives flat, faceted shading per segment — the
 * "cut stone block" look, rather than a smoothed organic wall.
 */
export default function CutawayWalls({ terrain, depthBelowMin = 110, sunDirection }: Props) {
  const { wallGeometry, capGeometry, bottomY, topYMax } = useMemo(() => {
    const tops = BOUNDARY_LOCAL.map(([x, z]) => terrain.heightAtLocal(x, z))
    const bottom = terrain.grid.minElevation - depthBelowMin
    const segments = BOUNDARY_LOCAL.length - 1 // last point repeats the first

    // Outward-normal sign, same shoelace trick estateSlab.ts used.
    let doubleArea = 0
    for (let i = 0; i < segments; i++) {
      const [ax, az] = BOUNDARY_LOCAL[i]
      const [bx, bz] = BOUNDARY_LOCAL[i + 1]
      doubleArea += ax * bz - bx * az
    }
    const outwardSign = doubleArea > 0 ? 1 : -1

    const positions: number[] = []
    for (let i = 0; i < segments; i++) {
      const [ax, az] = BOUNDARY_LOCAL[i]
      const [bx, bz] = BOUNDARY_LOCAL[i + 1]
      const topA = tops[i]
      const topB = tops[i + 1]

      // Two triangles: (a-top, b-top, b-bottom) and (a-top, b-bottom, a-bottom).
      // Winding chosen so the face points outward given outwardSign.
      const quad: [number, number, number][] =
        outwardSign > 0
          ? [
              [ax, topA, az],
              [bx, topB, bz],
              [bx, bottom, bz],
              [ax, topA, az],
              [bx, bottom, bz],
              [ax, bottom, az],
            ]
          : [
              [bx, topB, bz],
              [ax, topA, az],
              [ax, bottom, az],
              [bx, topB, bz],
              [ax, bottom, az],
              [bx, bottom, bz],
            ]
      for (const [x, y, z] of quad) positions.push(x, y, z)
    }

    const wallGeo = new THREE.BufferGeometry()
    wallGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    wallGeo.computeVertexNormals()

    const capPositions: number[] = []
    for (const index of FOOTPRINT_TRIANGLES) {
      const [x, z] = BOUNDARY_LOCAL[index]
      capPositions.push(x, bottom, z)
    }
    const capGeo = new THREE.BufferGeometry()
    capGeo.setAttribute('position', new THREE.Float32BufferAttribute(capPositions, 3))
    capGeo.computeVertexNormals()

    return {
      wallGeometry: wallGeo,
      capGeometry: capGeo,
      bottomY: bottom,
      topYMax: Math.max(...tops),
    }
  }, [terrain, depthBelowMin])

  return (
    <group>
      <mesh geometry={wallGeometry} castShadow receiveShadow>
        <cutawaySoilMaterial uTopY={topYMax} uBottomY={bottomY} uLightDir={sunDirection} />
      </mesh>
      <mesh geometry={capGeometry} receiveShadow>
        <meshStandardMaterial color="#1f2124" roughness={1} metalness={0} />
      </mesh>
    </group>
  )
}
