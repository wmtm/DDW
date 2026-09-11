import type { ReactElement } from 'react'
import type { PoiIconType } from './poi'

interface Props {
  type: PoiIconType
  title: string
}

function GlyphHouse() {
  return (
    <>
      <path d="M3 10.5 L12 3.5 L21 10.5" />
      <path d="M5.5 9.5 V20 A1 1 0 0 0 6.5 21 H9.5 V15 H14.5 V21 H17.5 A1 1 0 0 0 18.5 20 V9.5" />
    </>
  )
}

function GlyphGate() {
  return (
    <>
      <path d="M5 3 V21" />
      <path d="M19 3 V21" />
      <path d="M5 8 H19" />
      <path d="M5 16 H19" />
      <path d="M5 8 L19 16" />
      <path d="M19 8 L5 16" />
    </>
  )
}

function GlyphShop() {
  return (
    <>
      <path d="M3.5 8 L4.5 4 H19.5 L20.5 8" />
      <path d="M3.5 8 Q6.5 11 9.5 8 Q12 11 14.5 8 Q17.5 11 20.5 8" />
      <path d="M4.5 8 V20 H19.5 V8" />
      <path d="M10 20 V14 H14 V20" />
    </>
  )
}

const GLYPHS: Record<PoiIconType, () => ReactElement> = {
  house: GlyphHouse,
  gate: GlyphGate,
  shop: GlyphShop,
}

export default function PoiIcon({ type, title }: Props) {
  const Glyph = GLYPHS[type]
  return (
    <div className={`poi-marker poi-marker-${type}`} title={title}>
      <svg
        viewBox="0 0 24 24"
        width="100%"
        height="100%"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Glyph />
      </svg>
    </div>
  )
}
