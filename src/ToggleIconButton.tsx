import type { CSSProperties, ReactNode } from 'react'

/**
 * Icon + label toggle, matching the look of the top-level section tabs
 * (panel-icon-tab in App.css): a dark/neutral tile by default, filled with
 * a mix of its own accent color when active, border and icon tinted to
 * match. Used for the display panel's on/off options (slope contrast,
 * boundary outline, drawn map, landmarks) and the basemap picker, so every
 * toggle in that panel reads the same way instead of mixing checkboxes,
 * text-only buttons and icon tabs.
 */
interface ToggleIconButtonProps {
  icon: ReactNode
  label: string
  active: boolean
  onClick: () => void
  accent: string
  disabled?: boolean
  pill?: boolean
}

export function ToggleIconButton({ icon, label, active, onClick, accent, disabled, pill }: ToggleIconButtonProps) {
  return (
    <button
      type="button"
      className={`toggle-icon-button ${pill ? 'toggle-icon-button-pill' : ''} ${active ? 'toggle-icon-button-active' : ''}`}
      style={{ '--toggle-accent': accent } as CSSProperties}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
    >
      <span className="toggle-icon-button-glyph">{icon}</span>
      <span className="toggle-icon-button-label">{label}</span>
    </button>
  )
}

const common = {
  viewBox: '0 0 24 24',
  width: 18,
  height: 18,
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function SlopeContrastIcon() {
  return (
    <svg {...common}>
      <path d="M3 18 L9 9 L13 13 L21 4" />
      <path d="M15 4 L21 4 L21 10" />
    </svg>
  )
}

export function BoundaryIcon() {
  return (
    <svg {...common}>
      <path d="M4 15 L8 5 L16 6 L20 14 L14 20 L6 19 Z" strokeDasharray="3 3" />
    </svg>
  )
}

export function DrawnMapIcon() {
  return (
    <svg {...common}>
      <path d="M4 7 L9 5 L15 7 L20 5 L20 18 L15 20 L9 18 L4 20 Z" />
      <path d="M8 10 C10 8.5 12 11 14 9.5 C16 8 17 10 18 9.5" strokeWidth="1.4" />
      <circle cx="18.3" cy="6" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function LandmarkIcon() {
  return (
    <svg {...common}>
      <path d="M12 21 C8 16.5 5.5 13 5.5 9.5 A6.5 6.5 0 0 1 18.5 9.5 C18.5 13 16 16.5 12 21 Z" />
      <circle cx="12" cy="9.5" r="2.2" />
    </svg>
  )
}

export function SatelliteIcon() {
  return (
    <svg {...common}>
      <rect x="9" y="9" width="6" height="6" rx="1" transform="rotate(45 12 12)" />
      <path d="M4 4 L8 8" />
      <path d="M20 4 L16 8" />
      <path d="M4 20 L8 16" />
      <path d="M3 3 L6 6" strokeWidth="2.2" />
      <path d="M21 3 L18 6" strokeWidth="2.2" />
    </svg>
  )
}

export function MapIcon() {
  return (
    <svg {...common}>
      <path d="M4 6 L9 4 L15 6 L20 4 L20 18 L15 20 L9 18 L4 20 Z" />
      <path d="M9 4 L9 18" />
      <path d="M15 6 L15 20" />
    </svg>
  )
}

export function HybridIcon() {
  return (
    <svg {...common}>
      <rect x="4" y="4" width="12" height="12" rx="2" />
      <rect x="8" y="8" width="12" height="12" rx="2" />
    </svg>
  )
}

export function TerrainIcon() {
  return (
    <svg {...common}>
      <path d="M3 18 L8 9 L12 14 L15 10 L21 18 Z" />
      <path d="M8 9 L10 12" />
    </svg>
  )
}

export function MeatIcon() {
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M8.8 8.3 L7.5 15.5" />
      <path d="M12.3 7.7 L10.9 16.1" />
      <path d="M15.6 8.6 L14.5 14.8" />
    </svg>
  )
}
