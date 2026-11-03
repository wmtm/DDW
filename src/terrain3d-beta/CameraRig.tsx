import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

export interface CameraOrientation {
  azimuthDeg: number
  elevationDeg: number
  distance: number
}

export interface CameraRigHandle {
  /** Smoothly flies the camera to the given azimuth/elevation (degrees), keeping the current distance. Elevation is clamped to the same orbit limits a manual drag is held to. */
  flyTo: (azimuthDeg: number, elevationDeg: number) => void
  /** Multiplies the current camera distance by `factor` (e.g. 0.82 to step in, 1.22 to step out), clamped to [minDistance, maxDistance]. */
  zoomBy: (factor: number) => void
}

interface Props {
  target: THREE.Vector3
  settledPosition: THREE.Vector3
  introStartPosition: THREE.Vector3
  minDistance: number
  maxDistance: number
  /** Bumped from the parent to trigger a "reset view" without remounting the rig. */
  resetToken: number
  /** Written every frame with the camera's current azimuth/elevation/distance so HUD overlays (compass, minimap, axis gizmo) can read it without forcing a React re-render. */
  orientationRef: React.MutableRefObject<CameraOrientation>
}

const INTRO_DURATION_S = 2.4
const FLIGHT_DURATION_S = 1.1

// Capped well short of fully horizontal/vertical: past about 70° from the
// top the cutaway block reads as a thin, flat sliver rather than a solid
// cutaway. Exported so the HUD's axis-gizmo and compass snap to the same
// floor/ceiling a manual drag is held to, instead of occasionally landing
// on the one angle the camera is deliberately kept out of.
export const MIN_POLAR_ANGLE = Math.PI * 0.12
export const MAX_POLAR_ANGLE = Math.PI * 0.39

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/** Wraps an azimuth delta (radians) to (-PI, PI] so a commanded flight always takes the shorter way round. */
function shortestAngleDelta(from: number, to: number): number {
  let delta = (to - from) % (Math.PI * 2)
  if (delta > Math.PI) delta -= Math.PI * 2
  if (delta < -Math.PI) delta += Math.PI * 2
  return delta
}

/**
 * A short fly-in-and-settle intro, then hands off to damped orbit controls
 * with a slow auto-rotate that stops the moment the visitor touches it (or
 * commands a flight via the HUD). Also exposes an imperative `flyTo`/`zoomBy`
 * API so the compass, axis gizmo and zoom buttons can drive the same camera
 * without reimplementing orbit math of their own.
 *
 * OrbitControls recomputes the camera's position from its own internal
 * spherical state every frame, which would fight a manual position lerp run
 * in a separate useFrame — so the controls stay fully disabled for the
 * duration of any animated transition (intro or commanded flight) and only
 * take over once it's done.
 */
const CameraRig = forwardRef<CameraRigHandle, Props>(function CameraRig(
  { target, settledPosition, introStartPosition, minDistance, maxDistance, resetToken, orientationRef },
  ref,
) {
  const { camera } = useThree()
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const introElapsed = useRef(0)
  const introActive = useRef(true)
  const autoRotate = useRef(true)
  const [controlsEnabled, setControlsEnabled] = useState(false)

  // A commanded flight (compass reorient / axis gizmo snap), independent of
  // the mount intro but mutually exclusive with it — starting one cancels
  // the other, always using the camera's actual current position as the
  // "from" state so a flight commanded mid-intro still hands off smoothly.
  const flight = useRef<{
    fromTheta: number
    deltaTheta: number
    fromPhi: number
    toPhi: number
    radius: number
    elapsed: number
  } | null>(null)

  // Scratch objects reused every frame instead of allocating fresh
  // Vector3/Spherical instances 60 times a second for the whole time the
  // view is open.
  const scratchOffset = useRef(new THREE.Vector3())
  const scratchSpherical = useRef(new THREE.Spherical())

  useEffect(() => {
    camera.position.copy(introStartPosition)
    camera.lookAt(target)
    introElapsed.current = 0
    introActive.current = true
    autoRotate.current = true
    flight.current = null
    setControlsEnabled(false)
  }, [resetToken, camera, introStartPosition, target])

  useImperativeHandle(
    ref,
    () => ({
      flyTo(azimuthDeg, elevationDeg) {
        const offset = scratchOffset.current.copy(camera.position).sub(target)
        const current = scratchSpherical.current.setFromVector3(offset)
        const toTheta = THREE.MathUtils.degToRad(azimuthDeg)
        const toPhi = THREE.MathUtils.clamp(
          Math.PI / 2 - THREE.MathUtils.degToRad(elevationDeg),
          MIN_POLAR_ANGLE,
          MAX_POLAR_ANGLE,
        )
        flight.current = {
          fromTheta: current.theta,
          deltaTheta: shortestAngleDelta(current.theta, toTheta),
          fromPhi: current.phi,
          toPhi,
          radius: current.radius,
          elapsed: 0,
        }
        introActive.current = false
        autoRotate.current = false
        if (controlsRef.current) controlsRef.current.autoRotate = false
        setControlsEnabled(false)
      },
      zoomBy(factor) {
        const offset = scratchOffset.current.copy(camera.position).sub(target)
        const spherical = scratchSpherical.current.setFromVector3(offset)
        spherical.radius = THREE.MathUtils.clamp(spherical.radius * factor, minDistance, maxDistance)
        offset.setFromSpherical(spherical)
        camera.position.copy(target).add(offset)
        camera.lookAt(target)
        autoRotate.current = false
        if (controlsRef.current) controlsRef.current.autoRotate = false
      },
    }),
    [camera, target, minDistance, maxDistance],
  )

  useFrame((_, delta) => {
    if (introActive.current) {
      introElapsed.current += delta
      const t = Math.min(1, introElapsed.current / INTRO_DURATION_S)
      const eased = easeOutCubic(t)
      camera.position.lerpVectors(introStartPosition, settledPosition, eased)
      camera.lookAt(target)
      if (t >= 1) {
        introActive.current = false
        setControlsEnabled(true)
      }
    } else if (flight.current) {
      const f = flight.current
      f.elapsed += delta
      const t = Math.min(1, f.elapsed / FLIGHT_DURATION_S)
      const eased = easeInOutCubic(t)
      const theta = f.fromTheta + f.deltaTheta * eased
      const phi = f.fromPhi + (f.toPhi - f.fromPhi) * eased
      const offset = scratchOffset.current.setFromSphericalCoords(f.radius, phi, theta)
      camera.position.copy(target).add(offset)
      camera.lookAt(target)
      if (t >= 1) {
        flight.current = null
        setControlsEnabled(true)
      }
    }

    const offset = scratchOffset.current.copy(camera.position).sub(target)
    const spherical = scratchSpherical.current.setFromVector3(offset)
    orientationRef.current.azimuthDeg = THREE.MathUtils.radToDeg(spherical.theta)
    orientationRef.current.elevationDeg = 90 - THREE.MathUtils.radToDeg(spherical.phi)
    orientationRef.current.distance = spherical.radius
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={controlsEnabled}
      target={target}
      enableDamping
      dampingFactor={0.08}
      minDistance={minDistance}
      maxDistance={maxDistance}
      maxPolarAngle={MAX_POLAR_ANGLE}
      minPolarAngle={MIN_POLAR_ANGLE}
      autoRotate={autoRotate.current}
      autoRotateSpeed={0.5}
      onStart={() => {
        if (autoRotate.current) {
          autoRotate.current = false
          if (controlsRef.current) controlsRef.current.autoRotate = false
        }
      }}
    />
  )
})

export default CameraRig
