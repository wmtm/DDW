import type { ReactElement } from 'react'

type WeatherIconCategory = 'sun' | 'partly' | 'cloud' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm'

function categoryFor(code: number): WeatherIconCategory {
  if (code === 0) return 'sun'
  if (code === 1 || code === 2) return 'partly'
  if (code === 3) return 'cloud'
  if (code === 45 || code === 48) return 'fog'
  if (code === 51 || code === 53 || code === 55) return 'drizzle'
  if ((code >= 61 && code <= 65) || (code >= 80 && code <= 82)) return 'rain'
  if (code >= 71 && code <= 75) return 'snow'
  if (code >= 95) return 'storm'
  return 'cloud'
}

function Sun() {
  return (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.5 M12 19v2.5 M4.2 4.2l1.8 1.8 M18 18l1.8 1.8 M2.5 12h2.5 M19 12h2.5 M4.2 19.8l1.8-1.8 M18 6l1.8-1.8" />
    </>
  )
}

function CloudShape() {
  return <path d="M7 18a4.5 4.5 0 0 1-.5-8.97A5.5 5.5 0 0 1 17.3 8.1 4 4 0 0 1 17 16H7Z" />
}

function Partly() {
  return (
    <>
      <circle cx="8" cy="8" r="3.2" />
      <path d="M8 3.2V2 M13.4 8H14.6 M4.2 4.2 3.4 3.4" />
      <path d="M9.5 20a4 4 0 0 1-.4-7.98 4.9 4.9 0 0 1 9.3-1.3 3.6 3.6 0 0 1-.3 9.28H9.5Z" />
    </>
  )
}

function Fog() {
  return <path d="M4 8h16 M2.5 12h19 M4 16h16 M6 20h12" />
}

function Drizzle() {
  return (
    <>
      <CloudShape />
      <path d="M9 20v1.5 M13 20v1.5 M17 20v1.5" />
    </>
  )
}

function Rain() {
  return (
    <>
      <CloudShape />
      <path d="M8 19l-1.2 2.4 M13 19l-1.2 2.4 M18 19l-1.2 2.4" />
    </>
  )
}

function Snow() {
  return (
    <>
      <CloudShape />
      <path d="M9 19.5v3 M7.6 21h2.8 M15 19.5v3 M13.6 21h2.8" />
    </>
  )
}

function Storm() {
  return (
    <>
      <CloudShape />
      <path d="M12.5 15.5 10 20h3l-1.5 3.2" />
    </>
  )
}

const ICONS: Record<WeatherIconCategory, () => ReactElement> = {
  sun: Sun,
  partly: Partly,
  cloud: CloudShape,
  fog: Fog,
  drizzle: Drizzle,
  rain: Rain,
  snow: Snow,
  storm: Storm,
}

function IconSvg({ className, children }: { className?: string; children: ReactElement }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="100%"
      height="100%"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  )
}

interface Props {
  code: number
  className?: string
}

export default function WeatherIcon({ code, className }: Props) {
  const category = categoryFor(code)
  const Glyph = ICONS[category]
  return (
    <IconSvg className={className}>
      <Glyph />
    </IconSvg>
  )
}

export function SunriseIcon({ className }: { className?: string }) {
  return (
    <IconSvg className={className}>
      <>
        <path d="M12 2v5" />
        <path d="M9 5l3-3 3 3" />
        <path d="M4 17h16" />
        <path d="M6.5 17a5.5 5.5 0 0 1 11 0" />
      </>
    </IconSvg>
  )
}

export function SunsetIcon({ className }: { className?: string }) {
  return (
    <IconSvg className={className}>
      <>
        <path d="M12 2v5" />
        <path d="M9 4l3 3 3-3" />
        <path d="M4 17h16" />
        <path d="M6.5 17a5.5 5.5 0 0 1 11 0" />
      </>
    </IconSvg>
  )
}
