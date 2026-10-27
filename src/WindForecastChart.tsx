import type { HourlyWind } from './weather'

interface Props {
  windForecast: HourlyWind[]
}

/**
 * Sequential wind-speed ramp (one hue, light -> dark = calm -> strong),
 * validated with the dataviz skill's palette checker against this panel's
 * dark surface (#14100c): lightness monotone, >=0.06 steps apart, dark end
 * at 3.73:1 contrast. Thresholds in km/h are the common kite/windsurf
 * reading of a Beaufort-ish scale, since that's who actually watches wind
 * forecasts at this estate.
 */
const BANDS: { max: number; color: string; label: string }[] = [
  { max: 12, color: '#a8cdf0', label: 'Calme' },
  { max: 20, color: '#6db3ff', label: 'Léger' },
  { max: 28, color: '#4a98e0', label: 'Bon' },
  { max: Infinity, color: '#2a6fc0', label: 'Fort' },
]

const WIND_SCALE_MAX_KMH = 45

function bandFor(speedKmh: number) {
  return BANDS.find((b) => speedKmh < b.max) ?? BANDS[BANDS.length - 1]
}

const COMPASS_LABELS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']

function cardinalLabel(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360
  const index = Math.round(normalized / 45) % 8
  return COMPASS_LABELS[index]
}

/**
 * A compact, self-designed wind forecast for the next few hours: a bar per
 * hour (height + color both carry speed, reinforcing each other), a small
 * direction arrow per bar, and a gust callout when gusts run meaningfully
 * ahead of sustained speed. Built on Open-Meteo (the same source already
 * powering the weather card above) rather than an embedded third-party
 * widget, so the whole thing can be styled to match the site exactly.
 */
export default function WindForecastChart({ windForecast }: Props) {
  if (windForecast.length === 0) return null

  const maxSustained = Math.max(...windForecast.map((h) => h.windSpeedKmh))
  const maxGust = Math.max(...windForecast.map((h) => h.windGustKmh))
  const showGustCallout = maxGust - maxSustained >= 5

  return (
    <div className="wind-forecast-card">
      <div className="wind-forecast-header">
        <span className="wind-forecast-title">Vent à Flic en Flac</span>
        {showGustCallout && <span className="wind-forecast-gust">Rafales jusqu'à {Math.round(maxGust)} km/h</span>}
      </div>

      <div className="wind-forecast-bars">
        {windForecast.map((h) => {
          const band = bandFor(h.windSpeedKmh)
          const pct = Math.max(6, Math.min(100, (h.windSpeedKmh / WIND_SCALE_MAX_KMH) * 100))
          return (
            <div
              className="wind-bar-chip"
              key={h.hoursAhead}
              title={`${h.timeLabel} — ${Math.round(h.windSpeedKmh)} km/h, rafales ${Math.round(h.windGustKmh)} km/h, vent du ${cardinalLabel(h.windDirectionDeg)}`}
            >
              <span className="wind-bar-value">{Math.round(h.windSpeedKmh)}</span>
              <div className="wind-bar-track">
                <div className="wind-bar-fill" style={{ height: `${pct}%`, background: band.color }} />
              </div>
              <svg
                className="wind-bar-arrow"
                viewBox="0 0 16 16"
                style={{ transform: `rotate(${h.windDirectionDeg}deg)` }}
                aria-hidden="true"
              >
                <path d="M8 2.2 L11.2 10.5 L8 8.6 L4.8 10.5 Z" />
              </svg>
              <span className="wind-bar-hour">{h.timeLabel.slice(0, 2)}h</span>
            </div>
          )
        })}
      </div>

      <div className="wind-forecast-legend">
        {BANDS.map((b) => (
          <span className="wind-legend-item" key={b.label}>
            <i className="wind-legend-swatch" style={{ background: b.color }} />
            {b.label}
          </span>
        ))}
      </div>

      <span className="hint weather-source">
        Source :{' '}
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
          Open-Meteo
        </a>
      </span>
    </div>
  )
}
