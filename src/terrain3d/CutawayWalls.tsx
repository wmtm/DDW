import { useMemo } from 'react'
import * as THREE from 'three'
import { BOUNDARY_LOCAL } from './terrainContext'
import { FOOTPRINT_TRIANGLES } from './boundaryTriangulation'
import './SoilShaderMaterial'
import type { TerrainContext } from './terrainContext'

interface Props {
  terrain: TerrainContext
  /** Current terrain-relief exaggeration, so the wall's own depth can be kept constant on screen regardless of it. */
  exaggeration: number
  /** Normalized direction toward the sun, kept in sync with the scene's directional light. */
  sunDirection: THREE.Vector3
}

/**
 * How deep the cut reads on screen, in already-exaggerated display meters —
 * a fixed stylistic plinth depth, not a real geological measurement. This
 * is deliberately independent of the exaggeration slider: that slider is
 * meant to emphasize subtle terrain relief, not balloon the cutaway into a
 * several-hundred-meter cliff at high settings.
 *
 * The cut follows the terrain's own silhouette at this constant depth
 * everywhere (a "skirt", not a single flat plane at the property's lowest
 * point) — this site has real relief along its boundary (tens of meters),
 * and a flat-bottomed cut necessarily makes the wall at the highest
 * boundary point span that *entire* range, which at any real exaggeration
 * reads as a wildly oversized ramp jutting out of the block instead of a
 * plinth. A constant-depth skirt keeps every segment the same modest
 * height regardless of where it sits on the property.
 */
export const CUTAWAY_DISPLAY_DEPTH = 26

/**
 * The cut face around the estate: a wall dropped a constant depth below
 * the real terrain surface along the property line. Each boundary segment
 * is its own unshared quad (not indexed/shared with neighbors) so
 * computeVertexNormals() gives flat, faceted shading per segment — the
 * "cut stone block" look, rather than a smoothed organic wall.
 */
export default function CutawayWalls({ terrain, exaggeration, sunDirection }: Props) {
  const depthBelowMin = CUTAWAY_DISPLAY_DEPTH / exaggeration

  const { wallGeometry, capGeometry } = useMemo(() => {
    const tops = BOUNDARY_LOCAL.map(([x, z]) => terrain.heightAtLocal(x, z))
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
    // Real (unexaggerated) depth of the terrain surface directly above
    // each vertex — lets the soil shader band consistently at the same
    // thickness on every segment, in object-local space so it's immune to
    // the group's exaggeration scale (computed purely from position.y and
    // this attribute, never from world-space Y).
    const localTops: number[] = []
    for (let i = 0; i < segments; i++) {
      const [ax, az] = BOUNDARY_LOCAL[i]
      const [bx, bz] = BOUNDARY_LOCAL[i + 1]
      const topA = tops[i]
      const topB = tops[i + 1]
      const bottomA = topA - depthBelowMin
      const bottomB = topB - depthBelowMin

      // Two triangles: (a-top, b-top, b-bottom) and (a-top, b-bottom, a-bottom).
      // Winding chosen so the face points outward given outwardSign.
      const quad: [number, number, number, number][] =
        outwardSign > 0
          ? [
              [ax, topA, az, topA],
              [bx, topB, bz, topB],
              [bx, bottomB, bz, topB],
              [ax, topA, az, topA],
              [bx, bottomB, bz, topB],
              [ax, bottomA, az, topA],
            ]
          : [
              [bx, topB, bz, topB],
              [ax, topA, az, topA],
              [ax, bottomA, az, topA],
              [bx, topB, bz, topB],
              [ax, bottomA, az, topA],
              [bx, bottomB, bz, topB],
            ]
      for (const [x, y, z, localTop] of quad) {
        positions.push(x, y, z)
        localTops.push(localTop)
      }
    }

    const wallGeo = new THREE.BufferGeometry()
    wallGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    wallGeo.setAttribute('aLocalTop', new THREE.Float32BufferAttribute(localTops, 1))
    wallGeo.computeVertexNormals()

    const capPositions: number[] = []
    for (const index of FOOTPRINT_TRIANGLES) {
      const [x, z] = BOUNDARY_LOCAL[index]
      capPositions.push(x, tops[index] - depthBelowMin, z)
    }
    const capGeo = new THREE.BufferGeometry()
    capGeo.setAttribute('position', new THREE.Float32BufferAttribute(capPositions, 3))
    capGeo.computeVertexNormals()

    return { wallGeometry: wallGeo, capGeometry: capGeo }
  }, [terrain, depthBelowMin])

  return (
    <group>
      <mesh geometry={wallGeometry} castShadow receiveShadow>
        <cutawaySoilMaterial uDepth={depthBelowMin} uLightDir={sunDirection} />
      </mesh>
      <mesh geometry={capGeometry} receiveShadow>
        <meshStandardMaterial color="#1f2124" roughness={1} metalness={0} />
      </mesh>
    </group>
  )
}
