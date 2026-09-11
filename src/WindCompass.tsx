const COMPASS_LABELS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']

function cardinalLabel(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360
  const index = Math.round(normalized / 45) % 8
  return COMPASS_LABELS[index]
}

interface Props {
  directionDeg: number
  speedKmh: number
}

export default function WindCompass({ directionDeg, speedKmh }: Props) {
  return (
    <div className="wind-compass" title={`Vent venant du ${cardinalLabel(directionDeg)} (${Math.round(directionDeg)}°)`}>
      <svg viewBox="0 0 64 64" width="44" height="44" className="wind-compass-svg">
        <circle cx="32" cy="32" r="29" className="wind-compass-ring" />
        <text x="32" y="12" className="wind-compass-tick wind-compass-tick-main">N</text>
        <text x="55" y="36" className="wind-compass-tick">E</text>
        <text x="32" y="59" className="wind-compass-tick">S</text>
        <text x="9" y="36" className="wind-compass-tick">O</text>
        <g className="wind-compass-needle" style={{ transform: `rotate(${directionDeg}deg)`, transformOrigin: '32px 32px' }}>
          <polygon points="32,10 27,29 32,25 37,29" className="wind-compass-needle-head" />
          <line x1="32" y1="32" x2="32" y2="48" className="wind-compass-needle-tail" />
        </g>
        <circle cx="32" cy="32" r="2.5" className="wind-compass-pivot" />
      </svg>
      <span className="wind-compass-readout">
        {cardinalLabel(directionDeg)} · {Math.round(speedKmh)} km/h
      </span>
    </div>
  )
}
