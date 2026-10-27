import { useMemo } from 'react'
import * as THREE from 'three'
import { ContactShadows } from '@react-three/drei'
import { EffectComposer, N8AO, DepthOfField, Vignette, SMAA } from '@react-three/postprocessing'
import TerrainMesh from './TerrainMesh'
import CutawayWalls from './CutawayWalls'
import Markers from './Markers'
import CameraRig from './CameraRig'
import { BOUNDARY_LOCAL_BOUNDS } from './terrainContext'
import type { TerrainContext } from './terrainContext'
import type { TerrainTextures } from './satelliteTexture'
import type { Landmark } from '../landmarks'

interface Props {
  terrain: TerrainContext
  textures: TerrainTextures
  exaggeration: number
  sunAzimuthDeg: number
  sunElevationDeg: number
  isMobile: boolean
  resetToken: number
  onSelectLandmark?: (landmark: Landmark) => void
}

export default function Scene({ terrain, textures, exaggeration, sunAzimuthDeg, sunElevationDeg, isMobile, resetToken, onSelectLandmark }: Props) {
  const centerX = (BOUNDARY_LOCAL_BOUNDS.minX + BOUNDARY_LOCAL_BOUNDS.maxX) / 2
  const centerZ = (BOUNDARY_LOCAL_BOUNDS.minZ + BOUNDARY_LOCAL_BOUNDS.maxZ) / 2
  const footprintSize = Math.max(
    BOUNDARY_LOCAL_BOUNDS.maxX - BOUNDARY_LOCAL_BOUNDS.minX,
    BOUNDARY_LOCAL_BOUNDS.maxZ - BOUNDARY_LOCAL_BOUNDS.minZ,
  )
  const midHeight = ((terrain.grid.minElevation + terrain.grid.maxElevation) / 2) * exaggeration

  const target = useMemo(() => new THREE.Vector3(centerX, midHeight, centerZ), [centerX, centerZ, midHeight])

  const settledPosition = useMemo(() => {
    const azimuth = THREE.MathUtils.degToRad(35)
    const elevation = THREE.MathUtils.degToRad(32)
    const distance = footprintSize * 0.85
    return new THREE.Vector3(
      centerX + Math.sin(azimuth) * Math.cos(elevation) * distance,
      midHeight + Math.sin(elevation) * distance,
      centerZ + Math.cos(azimuth) * Math.cos(elevation) * distance,
    )
  }, [centerX, centerZ, midHeight, footprintSize])

  const introStartPosition = useMemo(() => {
    const azimuth = THREE.MathUtils.degToRad(-55)
    const elevation = THREE.MathUtils.degToRad(58)
    const distance = footprintSize * 2.3
    return new THREE.Vector3(
      centerX + Math.sin(azimuth) * Math.cos(elevation) * distance,
      midHeight + Math.sin(elevation) * distance,
      centerZ + Math.cos(azimuth) * Math.cos(elevation) * distance,
    )
  }, [centerX, centerZ, midHeight, footprintSize])

  const sunPosition = useMemo(() => {
    const az = THREE.MathUtils.degToRad(sunAzimuthDeg)
    const el = THREE.MathUtils.degToRad(sunElevationDeg)
    const distance = footprintSize * 1.6
    return new THREE.Vector3(
      centerX + Math.sin(az) * Math.cos(el) * distance,
      midHeight + Math.sin(el) * distance,
      centerZ + Math.cos(az) * Math.cos(el) * distance,
    )
  }, [centerX, centerZ, midHeight, footprintSize, sunAzimuthDeg, sunElevationDeg])

  const shadowExtent = footprintSize * 0.7
  const shadowMapSize = isMobile ? 1024 : 2048
  // One shadow-map texel in world space, used as the normal bias: large
  // enough to stop the terrain's own small-scale relief from
  // self-shadowing into acne, small enough not to visibly detach the
  // shadow from the geometry it belongs to.
  const shadowNormalBias = (2 * shadowExtent) / shadowMapSize

  const sunDirection = useMemo(() => {
    const az = THREE.MathUtils.degToRad(sunAzimuthDeg)
    const el = THREE.MathUtils.degToRad(sunElevationDeg)
    return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize()
  }, [sunAzimuthDeg, sunElevationDeg])

  return (
    <>
      <hemisphereLight args={['#cfe6ff', '#4a3f30', 0.55]} />
      <ambientLight intensity={0.18} />
      <directionalLight
        position={sunPosition}
        target-position={[centerX, 0, centerZ]}
        intensity={2.2}
        color="#fff3e0"
        castShadow
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-camera-left={-shadowExtent}
        shadow-camera-right={shadowExtent}
        shadow-camera-top={shadowExtent}
        shadow-camera-bottom={-shadowExtent}
        shadow-camera-near={1}
        shadow-camera-far={footprintSize * 4}
        shadow-bias={-0.00015}
        shadow-normalBias={shadowNormalBias}
      />
      {/* Soft fill mirrored to the opposite side of center, so the shadowed faces of the cutaway walls don't go fully black. */}
      <directionalLight
        position={[2 * centerX - sunPosition.x, midHeight + footprintSize * 0.3, 2 * centerZ - sunPosition.z]}
        intensity={0.35}
        color="#bcd4ff"
      />

      <group scale={[1, exaggeration, 1]}>
        <TerrainMesh terrain={terrain} textures={textures} />
        <CutawayWalls terrain={terrain} sunDirection={sunDirection} />
        <Markers terrain={terrain} onSelectLandmark={onSelectLandmark} />
      </group>

      <ContactShadows
        position={[centerX, terrain.grid.minElevation * exaggeration - 2, centerZ]}
        opacity={0.45}
        scale={footprintSize * 2.2}
        blur={2.4}
        far={footprintSize * 0.5}
        color="#1a1510"
      />

      <CameraRig
        target={target}
        settledPosition={settledPosition}
        introStartPosition={introStartPosition}
        minDistance={footprintSize * 0.3}
        maxDistance={footprintSize * 2.2}
        resetToken={resetToken}
      />

      <EffectComposer multisampling={0} enableNormalPass>
        <N8AO aoRadius={footprintSize * 0.025} intensity={isMobile ? 0 : 0.8} quality={isMobile ? 'low' : 'medium'} />
        <DepthOfField focusDistance={0.02} focalLength={0.05} bokehScale={isMobile ? 0 : 2.2} />
        <Vignette eskil={false} offset={0.15} darkness={0.5} />
        <SMAA />
      </EffectComposer>
    </>
  )
}
