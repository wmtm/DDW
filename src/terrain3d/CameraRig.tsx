import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

interface Props {
  target: THREE.Vector3
  settledPosition: THREE.Vector3
  introStartPosition: THREE.Vector3
  minDistance: number
  maxDistance: number
  /** Bumped from the parent to trigger a "reset view" without remounting the rig. */
  resetToken: number
}

const INTRO_DURATION_S = 2.4

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * A short fly-in-and-settle intro, then hands off to damped orbit controls
 * with a slow auto-rotate that stops the moment the visitor touches it.
 *
 * OrbitControls recomputes the camera's position from its own internal
 * spherical state every frame, which would fight a manual position lerp run
 * in a separate useFrame — so the controls stay fully disabled for the
 * duration of the intro and only take over once it's done.
 */
export default function CameraRig({ target, settledPosition, introStartPosition, minDistance, maxDistance, resetToken }: Props) {
  const { camera } = useThree()
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const introElapsed = useRef(0)
  const introActive = useRef(true)
  const autoRotate = useRef(true)
  const [controlsEnabled, setControlsEnabled] = useState(false)

  // Replays on mount and on an explicit "reset view" click (resetToken).
  // Target, settled position, and distance limits are deliberately left
  // out of the deps: they can change (e.g. the parcel's own fixed
  // geometry never does, but this keeps the effect from re-triggering if
  // a parent ever recomputes those vectors) without restarting the intro.
  useEffect(() => {
    camera.position.copy(introStartPosition)
    camera.lookAt(target)
    introElapsed.current = 0
    introActive.current = true
    autoRotate.current = true
    setControlsEnabled(false)
  }, [resetToken, camera, introStartPosition, target])

  useFrame((_, delta) => {
    if (!introActive.current) return
    introElapsed.current += delta
    const t = Math.min(1, introElapsed.current / INTRO_DURATION_S)
    const eased = easeOutCubic(t)
    camera.position.lerpVectors(introStartPosition, settledPosition, eased)
    camera.lookAt(target)
    if (t >= 1) {
      introActive.current = false
      setControlsEnabled(true)
    }
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
      maxPolarAngle={Math.PI * 0.49}
      minPolarAngle={Math.PI * 0.12}
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
}
