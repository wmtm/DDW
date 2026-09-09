import { timeOfDayOptions, type TimeOfDay } from './timeOfDay'
import { terrainTypeColors, terrainTypeLabels, type TerrainType } from './terrainZones'
import { historicalYears, type ImagerySelection } from './historicalImagery'
import { basemapOptions, usesSatelliteImagery, type BasemapStyle } from './basemap'
import type { ElevationSample } from './elevation'
import type { WeatherData } from './weather'
import type { ElevationProfile } from './elevationProfile'
import ElevationProfileChart from './ElevationProfileChart'

interface Props {
  basemap: BasemapStyle
  onBasemapChange: (basemap: BasemapStyle) => void
  timeOfDay: TimeOfDay
  onTimeOfDayChange: (t: TimeOfDay) => void
  tourRunning: boolean
  onToggleTour: () => void
  chuteCount: number
  landmarkTourActive: boolean
  onStartLandmarkTour: () => void
  onExitLandmarkTour: () => void
  measureActive: boolean
  onToggleMeasure: () => void
  measureResult: { distanceMeters: number; elevationDeltaMeters: number | null } | null
  onClearMeasure: () => void
  showOverlay: boolean
  onToggleOverlay: () => void
  hoverElevation: ElevationSample | null
  historicalYear: ImagerySelection
  onHistoricalYearChange: (year: ImagerySelection) => void
  sunMode: boolean
  onToggleSunMode: () => void
  sunDateTimeValue: string
  onSunDateTimeChange: (value: string) => void
  onSunNow: () => void
  sunInfo: { altitudeDeg: number; compassAzimuthDeg: number } | null
  weather: WeatherData | null
  weatherError: string | null
  onCaptureView: () => void
  onGenerateShareLink: () => void
  shareUrl: string | null
  shareCopied: boolean
  trailActive: boolean
  onToggleTrail: () => void
  trailPointCount: number
  trailProfile: ElevationProfile
  onClearTrail: () => void
  onCopyTrailBoundary: () => void
  slopeContrast: boolean
  onToggleSlopeContrast: () => void
}

const terrainTypes = Object.keys(terrainTypeLabels) as TerrainType[]

export default function ControlsPanel({
  basemap,
  onBasemapChange,
  timeOfDay,
  onTimeOfDayChange,
  tourRunning,
  onToggleTour,
  chuteCount,
  landmarkTourActive,
  onStartLandmarkTour,
  onExitLandmarkTour,
  measureActive,
  onToggleMeasure,
  measureResult,
  onClearMeasure,
  showOverlay,
  onToggleOverlay,
  hoverElevation,
  historicalYear,
  onHistoricalYearChange,
  sunMode,
  onToggleSunMode,
  sunDateTimeValue,
  onSunDateTimeChange,
  onSunNow,
  sunInfo,
  weather,
  weatherError,
  onCaptureView,
  onGenerateShareLink,
  shareUrl,
  shareCopied,
  trailActive,
  onToggleTrail,
  trailPointCount,
  trailProfile,
  onClearTrail,
  onCopyTrailBoundary,
  slopeContrast,
  onToggleSlopeContrast,
}: Props) {
  return (
    <div className="controls-panel">
      <div className="control-group">
        <span className="control-label">Current weather</span>
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
            <span className="hint">Loading weather…</span>
          )}
        </div>
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
        <span className="control-label">Time of day</span>
        <div className="button-row">
          {timeOfDayOptions.map((opt) => (
            <button
              key={opt.value}
              className={`chip ${timeOfDay === opt.value ? 'chip-active' : ''}`}
              onClick={() => onTimeOfDayChange(opt.value)}
              disabled={tourRunning || sunMode || landmarkTourActive}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="control-group">
        <button
          className={`action-button ${sunMode ? 'chip-active' : ''}`}
          onClick={onToggleSunMode}
          disabled={tourRunning || landmarkTourActive}
        >
          {sunMode ? 'Disable real sun position' : 'Use real sun position'}
        </button>
        {sunMode && (
          <div className="sun-controls">
            <input
              type="datetime-local"
              className="datetime-input"
              value={sunDateTimeValue}
              onChange={(e) => onSunDateTimeChange(e.target.value)}
            />
            <button className="clear-button" onClick={onSunNow}>
              Jump to now
            </button>
            {sunInfo && (
              <span className="hint">
                Altitude {sunInfo.altitudeDeg.toFixed(1)}° · Azimuth{' '}
                {sunInfo.compassAzimuthDeg.toFixed(0)}° ·{' '}
                {sunInfo.altitudeDeg > 0 ? 'daytime' : 'below horizon'}
              </span>
            )}
            <span className="hint">Mauritius local time (UTC+4)</span>
          </div>
        )}
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

      <div className="control-group">
        <button
          className={`action-button ${measureActive ? 'chip-active' : ''}`}
          onClick={onToggleMeasure}
          disabled={tourRunning || trailActive || landmarkTourActive}
        >
          {measureActive ? 'Exit measure mode' : 'Measure distance'}
        </button>
        {measureActive && !measureResult && (
          <span className="hint">Click two points on the terrain</span>
        )}
        {measureResult && (
          <div className="measure-result">
            <div>Distance: {formatDistance(measureResult.distanceMeters)}</div>
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
        <button
          className={`action-button ${trailActive ? 'chip-active' : ''}`}
          onClick={onToggleTrail}
          disabled={tourRunning || measureActive || landmarkTourActive}
        >
          {trailActive ? 'Finish trail' : 'Trail elevation profile'}
        </button>
        {trailActive && trailPointCount === 0 && (
          <span className="hint">Click along a path to build a profile</span>
        )}
        {trailPointCount >= 2 && (
          <div className="trail-result">
            <ElevationProfileChart profile={trailProfile} />
            <div>Length: {formatDistance(trailProfile.totalDistanceMeters)}</div>
            <div>
              Gain {Math.round(trailProfile.totalGainMeters)} m · Loss{' '}
              {Math.round(trailProfile.totalLossMeters)} m
            </div>
            <button className="clear-button" onClick={onClearTrail}>
              Clear
            </button>
            {trailPointCount >= 3 && (
              <button className="clear-button" onClick={onCopyTrailBoundary}>
                Copy boundary coordinates
              </button>
            )}
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
            {terrainTypes.map((type) => (
              <div key={type} className="legend-row">
                <span
                  className="legend-swatch"
                  style={{ background: terrainTypeColors[type] }}
                />
                {terrainTypeLabels[type]}
              </div>
            ))}
            <div className="legend-row">
              <span className="legend-swatch legend-swatch-boundary" />
              Estate boundary
            </div>
            <span className="hint">Placeholder outline — pending real site data</span>
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

      <div className="control-group">
        <span className="control-label">Share</span>
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
            <span className="hint">{shareCopied ? 'Copied to clipboard' : 'Copy the link above'}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`
}
