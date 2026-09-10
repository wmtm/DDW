import { useMemo, useState, type ReactNode } from 'react'
import { historicalYears, type ImagerySelection } from './historicalImagery'
import { basemapOptions, usesSatelliteImagery, type BasemapStyle } from './basemap'
import type { ElevationSample } from './elevation'
import type { WeatherData } from './weather'
import type { Landmark } from './landmarks'
import DateTimeWidget from './DateTimeWidget'

interface Props {
  landmarks: Landmark[]
  onSelectLandmark: (landmark: Landmark) => void
  basemap: BasemapStyle
  onBasemapChange: (basemap: BasemapStyle) => void
  tourRunning: boolean
  onToggleTour: () => void
  chuteCount: number
  landmarkTourActive: boolean
  onStartLandmarkTour: () => void
  onExitLandmarkTour: () => void
  measureActive: boolean
  onToggleMeasure: () => void
  measurePointCount: number
  measureClosed: boolean
  measureResult: { distanceMeters: number; elevationDeltaMeters: number | null; areaSquareMeters: number | null } | null
  onClearMeasure: () => void
  onUndoMeasurePoint: () => void
  onCloseMeasureLoop: () => void
  showOverlay: boolean
  onToggleOverlay: () => void
  hoverElevation: ElevationSample | null
  historicalYear: ImagerySelection
  onHistoricalYearChange: (year: ImagerySelection) => void
  weather: WeatherData | null
  weatherError: string | null
  onCaptureView: () => void
  onGenerateShareLink: () => void
  shareUrl: string | null
  shareCopied: boolean
  slopeContrast: boolean
  onToggleSlopeContrast: () => void
}

function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="panel-section">
      <button
        type="button"
        className="panel-section-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className={`panel-section-chevron ${open ? 'panel-section-chevron-open' : ''}`}>›</span>
      </button>
      {open && <div className="panel-section-body">{children}</div>}
    </div>
  )
}

export default function ControlsPanel({
  landmarks,
  onSelectLandmark,
  basemap,
  onBasemapChange,
  tourRunning,
  onToggleTour,
  chuteCount,
  landmarkTourActive,
  onStartLandmarkTour,
  onExitLandmarkTour,
  measureActive,
  onToggleMeasure,
  measurePointCount,
  measureClosed,
  measureResult,
  onClearMeasure,
  onUndoMeasurePoint,
  onCloseMeasureLoop,
  showOverlay,
  onToggleOverlay,
  hoverElevation,
  historicalYear,
  onHistoricalYearChange,
  weather,
  weatherError,
  onCaptureView,
  onGenerateShareLink,
  shareUrl,
  shareCopied,
  slopeContrast,
  onToggleSlopeContrast,
}: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return landmarks
      .filter((l) => l.name.toLowerCase().includes(q) || (l.number !== null && String(l.number).includes(q)))
      .slice(0, 8)
  }, [landmarks, searchQuery])

  return (
    <div className={`controls-panel ${collapsed ? 'controls-panel-collapsed' : ''}`}>
      <button
        type="button"
        className="controls-panel-toggle"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? 'Expand controls' : 'Collapse controls'}
      >
        Controls {collapsed ? '▲' : '▼'}
      </button>

      <div className="control-group">
        <span className="control-label">Estate now</span>
        <div className="estate-status">
          <div className="weather-readout">
            {weather ? (
              <>
                <div className="weather-main">
                  <span
                    className="wind-arrow"
                    style={{ transform: `rotate(${weather.windDirectionDeg}deg)` }}
                    title={`Wind from ${Math.round(weather.windDirectionDeg)}°`}
                  />
                  <span>{Math.round(weather.temperatureC)}°C</span>
                  <span className="hint">{weather.description}</span>
                </div>
                <span className="hint">
                  Wind {Math.round(weather.windSpeedKmh)} km/h · Precip{' '}
                  {weather.precipitationMm.toFixed(1)} mm
                </span>
              </>
            ) : weatherError ? (
              <span className="hint">{weatherError}</span>
            ) : (
              <div className="skeleton-line skeleton-line-weather" />
            )}
          </div>
          <DateTimeWidget />
        </div>
      </div>

      <PanelSection title="Explore">
        <div className="control-group">
          <span className="control-label">Find a chute or landmark</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by name or number…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((landmark) => (
                <button
                  key={landmark.id}
                  className="search-result"
                  onClick={() => {
                    onSelectLandmark(landmark)
                    setSearchQuery('')
                  }}
                >
                  {landmark.number !== null && (
                    <span className="search-result-number">{landmark.number}</span>
                  )}
                  {landmark.name}
                </button>
              ))}
            </div>
          )}
          {searchQuery.trim() && searchResults.length === 0 && (
            <span className="hint">No matches</span>
          )}
        </div>

        <div className="control-group">
          <span className="control-label">Basemap</span>
          <div className="button-row">
            {basemapOptions.map((opt) => (
              <button
                key={opt.value}
                className={`chip ${basemap === opt.value ? 'chip-active' : ''}`}
                onClick={() => onBasemapChange(opt.value)}
                disabled={tourRunning || landmarkTourActive}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <button className="action-button" onClick={onToggleTour} disabled={landmarkTourActive}>
            {tourRunning ? 'Stop tour' : 'Start fly-through tour'}
          </button>
        </div>

        <div className="control-group">
          <button
            className={`action-button ${landmarkTourActive ? 'chip-active' : ''}`}
            onClick={landmarkTourActive ? onExitLandmarkTour : onStartLandmarkTour}
            disabled={tourRunning || chuteCount === 0}
          >
            {landmarkTourActive ? 'Exit chute tour' : 'Visit the chutes'}
          </button>
          <span className="hint">
            {chuteCount} chute{chuteCount === 1 ? '' : 's'} recorded
          </span>
        </div>
      </PanelSection>

      <PanelSection title="Tools">
        <div className="control-group">
          <button
            className={`action-button ${measureActive ? 'chip-active' : ''}`}
            onClick={onToggleMeasure}
            disabled={tourRunning || landmarkTourActive}
          >
            {measureActive ? 'Exit measure mode' : 'Measure distance'}
          </button>
          {measureActive && measurePointCount === 0 && (
            <span className="hint">Click points on the terrain to build a path</span>
          )}
          {measureActive && measurePointCount > 0 && !measureClosed && (
            <div className="button-row">
              <button className="clear-button" onClick={onUndoMeasurePoint}>
                Undo point
              </button>
              {measurePointCount >= 3 && (
                <button className="clear-button" onClick={onCloseMeasureLoop}>
                  Close loop
                </button>
              )}
            </div>
          )}
          {measureResult && (
            <div className="measure-result">
              <div>
                {measureClosed ? 'Perimeter' : 'Length'}: {formatDistance(measureResult.distanceMeters)}
              </div>
              {measureResult.areaSquareMeters !== null && (
                <div>Area: {formatArea(measureResult.areaSquareMeters)}</div>
              )}
              <div>
                Elevation change:{' '}
                {measureResult.elevationDeltaMeters === null
                  ? 'unavailable'
                  : `${Math.round(measureResult.elevationDeltaMeters)} m`}
              </div>
              <button className="clear-button" onClick={onClearMeasure}>
                Clear
              </button>
            </div>
          )}
        </div>

        <div className="control-group">
          <span className="control-label">Terrain</span>
          <div className="elevation-readout">
            {hoverElevation && hoverElevation.elevationMeters !== null ? (
              <>
                <div>Elevation: {Math.round(hoverElevation.elevationMeters)} m</div>
                <div>
                  Slope (dénivelé):{' '}
                  {hoverElevation.slopePercent === null
                    ? 'unavailable'
                    : `${hoverElevation.slopePercent.toFixed(1)}%`}
                </div>
              </>
            ) : (
              <span className="hint">Hover the terrain</span>
            )}
          </div>
          <button
            className={`action-button ${slopeContrast ? 'chip-active' : ''}`}
            onClick={onToggleSlopeContrast}
          >
            {slopeContrast ? 'Show normal shading' : 'Highlight slope contrast'}
          </button>
          {slopeContrast && (
            <span className="hint">Steeper ground shows redder/darker as you fly around</span>
          )}
        </div>

        <div className="control-group">
          <button
            className={`action-button ${showOverlay ? 'chip-active' : ''}`}
            onClick={onToggleOverlay}
            disabled={tourRunning}
          >
            {showOverlay ? 'Hide estate overlay' : 'Show estate overlay'}
          </button>
          {showOverlay && (
            <div className="legend">
              <div className="legend-row">
                <span className="legend-swatch legend-swatch-boundary" />
                Estate boundary
              </div>
            </div>
          )}
        </div>

        {usesSatelliteImagery(basemap) && (
          <div className="control-group">
            <span className="control-label">Satellite imagery year</span>
            <div className="button-row">
              <button
                className={`chip ${historicalYear === 'current' ? 'chip-active' : ''}`}
                onClick={() => onHistoricalYearChange('current')}
                disabled={tourRunning || landmarkTourActive}
              >
                Now
              </button>
              {historicalYears.map((hy) => (
                <button
                  key={hy.year}
                  className={`chip ${historicalYear === hy.year ? 'chip-active' : ''}`}
                  onClick={() => onHistoricalYearChange(hy.year)}
                  disabled={tourRunning || landmarkTourActive}
                >
                  {hy.year}
                </button>
              ))}
            </div>
          </div>
        )}
      </PanelSection>

      <PanelSection title="Share">
        <div className="control-group">
          <div className="button-row">
            <button className="action-button" onClick={onCaptureView}>
              Capture view (PNG)
            </button>
            <button className="action-button" onClick={onGenerateShareLink}>
              Copy share link
            </button>
          </div>
          {shareUrl && (
            <div className="share-result">
              <input
                className="share-link-input"
                type="text"
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
              />
              {shareCopied ? (
                <div className="share-toast">Copied to clipboard</div>
              ) : (
                <span className="hint">Copy the link above</span>
              )}
            </div>
          )}
        </div>

        <div className="control-group">
          <a className="action-button leaderboard-link" href="#/leaderboard">
            2026 Gros Cerf leaderboard
          </a>
        </div>
      </PanelSection>
    </div>
  )
}

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`
}

function formatArea(squareMeters: number): string {
  return `${Math.round(squareMeters).toLocaleString('en-US')} m²`
}
