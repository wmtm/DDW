/**
 * One consistent stroke-icon set for the floating map action buttons
 * (replacing emoji: 🦌 → PawIcon, ⚠️ → WarningIcon, ⌂ → RecenterIcon) and
 * their confirm/cancel pair, matching the same viewBox/stroke convention
 * already used for the display panel's toggle icons (see
 * ToggleIconButton.tsx's own `common`) — kept as a separate small module
 * since these two icon sets serve different parts of the UI, not because
 * the style itself differs.
 */
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

/** Report a wounded/sighted animal — a paw print reads for "animal" without pinning the report to one species. */
export function PawIcon() {
  return (
    <svg {...common}>
      <circle cx="11" cy="4" r="2" />
      <circle cx="18" cy="8" r="2" />
      <circle cx="20" cy="16" r="2" />
      <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
    </svg>
  )
}

/** Report something unusual on the site. */
export function WarningIcon() {
  return (
    <svg {...common}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

/** Recenter the map on the estate. */
export function RecenterIcon() {
  return (
    <svg {...common}>
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  )
}

/** Confirm / mark done. */
export function CheckIcon() {
  return (
    <svg {...common}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

/** Cancel / close. */
export function CrossIcon() {
  return (
    <svg {...common}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
