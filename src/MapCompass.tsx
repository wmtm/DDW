interface Props {
  bearing: number
  onReset: () => void
}

export default function MapCompass({ bearing, onReset }: Props) {
  return (
    <button
      type="button"
      className="map-compass"
      onClick={onReset}
      aria-label="Orienter la carte vers le nord"
      title="Cliquez pour réorienter vers le nord"
    >
      <svg viewBox="0 0 48 48" width="100%" height="100%">
        <circle cx="24" cy="24" r="21" className="map-compass-ring" />
        <g className="map-compass-needle" style={{ transform: `rotate(${-bearing}deg)`, transformOrigin: '24px 24px' }}>
          <polygon points="24,6 19,24 24,20 29,24" className="map-compass-needle-north" />
          <polygon points="24,42 19,24 24,28 29,24" className="map-compass-needle-south" />
          <text x="24" y="15" className="map-compass-needle-label">
            N
          </text>
        </g>
        <circle cx="24" cy="24" r="2" className="map-compass-pivot" />
      </svg>
    </button>
  )
}
