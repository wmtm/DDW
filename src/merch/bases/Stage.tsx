import type { ReactNode } from 'react'

/**
 * Shared "studio" backdrop every product base sits on — a soft warm
 * radial gradient plus a floor shadow ellipse, so all 16 products read as
 * one consistent shoot rather than 16 separately-styled illustrations.
 * Every base shares this 0–1000 square viewBox, which is also the
 * coordinate space LogoZone positions are defined in.
 */
export default function Stage({ children, stageId }: { children: ReactNode; stageId: string }) {
  const bgId = `merch-stage-bg-${stageId}`
  const shadowId = `merch-stage-shadow-${stageId}`
  return (
    <svg viewBox="0 0 1000 1000" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={bgId} cx="50%" cy="38%" r="75%">
          <stop offset="0%" stopColor="#efe6d4" />
          <stop offset="65%" stopColor="#ddd0b7" />
          <stop offset="100%" stopColor="#c7b798" />
        </radialGradient>
        <radialGradient id={shadowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2a2013" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#2a2013" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="1000" height="1000" fill={`url(#${bgId})`} />
      <ellipse cx="500" cy="860" rx="300" ry="46" fill={`url(#${shadowId})`} />
      {children}
    </svg>
  )
}
