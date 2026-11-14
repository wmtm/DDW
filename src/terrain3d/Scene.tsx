import { useMemo } from 'react'
import * as THREE from 'three'
import { ContactShadows } from '@react-three/drei'
import { EffectComposer, N8AO, Vignette, SMAA } from '@react-three/postprocessing'
import TerrainMesh from './TerrainMesh'
import CutawayWalls, { CUTAWAY_DISPLAY_DEPTH } from './CutawayWalls'
import Markers from './Markers'
import CameraRig from './CameraRig'
import TextureDiagnostics from './TextureDiagnostics'
import { BOUNDARY_LOCAL, BOUNDARY_LOCAL_BOUNDS, displayHeightAtLocal } from './terrainContext'
import type { TerrainContext } from './terrainContext'
import type { TerrainTextures } from './satelliteTexture'
import type { Landmark } from '../landmarks'
import type { WoundedDeerReport } from '../fieldReports'
import type { Warning } from '../warnings'
import type { CameraOrientation, CameraRigHandle } from './CameraRig'

interface Props {
  terrain: TerrainContext
  textures: TerrainTextures
  exaggeration: number
  canopyExaggeration: number
  sunAzimuthDeg: number
  sunElevationDeg: number
  isMobile: boolean
  resetToken: number
  landmarks: Landmark[]
  woundedDeerReports: WoundedDeerReport[]
  warnings: Warning[]
  onSelectLandmark?: (landmark: Landmark) => void
  cameraRigRef: React.RefObject<CameraRigHandle>
  orientationRef: React.MutableRefObject<CameraOrientation>
}

export default function Scene({
  terrain,
  textures,
  exaggeration,
  canopyExaggeration,
  sunAzimuthDeg,
  sunElevationDeg,
  isMobile,
  resetToken,
  landmarks,
  woundedDeerReports,
  warnings,
  onSelectLandmark,
  cameraRigRef,
  orientationRef,
}: Props) {
  const centerX = (BOUNDARY_LOCAL_BOUNDS.minX + BOUNDARY_LOCAL_BOUNDS.maxX) / 2
  const centerZ = (BOUNDARY_LOCAL_BOUNDS.minZ + BOUNDARY_LOCAL_BOUNDS.maxZ) / 2
  const footprintSize = Math.max(
    BOUNDARY_LOCAL_BOUNDS.maxX - BOUNDARY_LOCAL_BOUNDS.minX,
    BOUNDARY_LOCAL_BOUNDS.maxZ - BOUNDARY_LOCAL_BOUNDS.minZ,
  )
  // A least-squares plane fit passes through the centroid of its own input
  // data, so the regional trend evaluated at the footprint's center is
  // already a solid estimate of the property's overall elevation — no
  // exaggeration multiply here any more, since the trend itself is held at
  // 1x (see displayHeightAtLocal) and only local relief is exaggerated.
  const midHeight = useMemo(() => terrain.trendAtLocal(centerX, centerZ), [terrain, centerX, centerZ])

  // The lowest point ON THE PROPERTY BOUNDARY itself, not the padded DEM
  // grid's own min (which can dip toward sea level outside the property
  // line), in display space (detrended + exaggerated) so it tracks
  // whatever the mesh and walls are actually showing right now — see the
  // note on CUTAWAY_DISPLAY_DEPTH in CutawayWalls.tsx. Shared between the
  // cutaway wall and the contact shadow so they stay anchored together.
  const boundaryMinElevation = useMemo(
    () => Math.min(...BOUNDARY_LOCAL.map(([x, z]) => displayHeightAtLocal(terrain, x, z, exaggeration))),
    [terrain, exaggeration],
  )

  const target = useMemo(() => new THREE.Vector3(centerX, midHeight, centerZ), [centerX, centerZ, midHeight])

  const settledPosition = useMemo(() => {
    const azimuth = THREE.MathUtils.degToRad(35)
    const elevation = THREE.MathUtils.degToRad(48)
    const distance = footprintSize * 0.95
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

      <TextureDiagnostics textures={textures} />

      <group>
        <TerrainMesh terrain={terrain} textures={textures} exaggeration={exaggeration} canopyExaggeration={canopyExaggeration} />
        <CutawayWalls terrain={terrain} exaggeration={exaggeration} sunDirection={sunDirection} />
        <Markers
          terrain={terrain}
          landmarks={landmarks}
          woundedDeerReports={woundedDeerReports}
          warnings={warnings}
          exaggeration={exaggeration}
          canopyExaggeration={canopyExaggeration}
          onSelectLandmark={onSelectLandmark}
        />
      </group>

      {/* Scaled much closer to the footprint than before (was 2.2x — a
          plane that large, if its blend ever reads as flat instead of a
          soft falloff, shows up as a hard dark shape well past the
          property's own edges, which is exactly the "out of bounds" black
          area reported on the live site). Smaller + heavier blur keeps it
          a soft contact shadow hugging the block instead of a slab. */}
      <ContactShadows
        position={[centerX, boundaryMinElevation - CUTAWAY_DISPLAY_DEPTH - 2, centerZ]}
        opacity={0.4}
        scale={footprintSize * 1.3}
        blur={3.2}
        far={footprintSize * 0.3}
        color="#1a1510"
      />

      <CameraRig
        ref={cameraRigRef}
        target={target}
        settledPosition={settledPosition}
        introStartPosition={introStartPosition}
        minDistance={footprintSize * 0.3}
        maxDistance={footprintSize * 2.2}
        resetToken={resetToken}
        orientationRef={orientationRef}
      />

      {/* DepthOfField removed entirely — it was blurring the whole block, not
          giving a "miniature" effect, since its focus plane never reliably
          tracked the terrain at every zoom/orbit angle. */}
      <EffectComposer multisampling={0} enableNormalPass>
        <N8AO aoRadius={footprintSize * 0.012} intensity={isMobile ? 0 : 0.8} quality={isMobile ? 'low' : 'medium'} />
        <Vignette eskil={false} offset={0.15} darkness={0.5} />
        <SMAA />
      </EffectComposer>
    </>
  )
}
