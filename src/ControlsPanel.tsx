import { useMemo, useState, type ReactNode } from 'react'
import { historicalYears, type ImagerySelection } from './historicalImagery'
import { basemapOptions, usesSatelliteImagery, type BasemapStyle } from './basemap'
import type { ElevationSample } from './elevation'
import type { WeatherData } from './weather'
import type { Landmark } from './landmarks'
import DateTimeWidget from './DateTimeWidget'
import PasscodeGate from './PasscodeGate'

interface Props {
  landmarks: Landmark[]
  onSelectLandmark: (landmark: Landmark) => void
  onUnlock: () => void
  showChutes: boolean
  onToggleChutes: () => void
  showSpots: boolean
  onToggleSpots: () => void
  showNames: boolean
  onToggleNames: () => void
  showDrawnMap: boolean
  onToggleDrawnMap: () => void
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
  onUnlock,
  showChutes,
  onToggleChutes,
  showSpots,
  onToggleSpots,
  showNames,
  onToggleNames,
  showDrawnMap,
  onToggleDrawnMap,
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
        aria-label={collapsed ? 'Agrandir les commandes' : 'Réduire les commandes'}
      >
        Commandes {collapsed ? '▲' : '▼'}
      </button>

      <div className="control-group">
        <span className="control-label">En ce moment</span>
        <div className="estate-status">
          <div className="weather-readout">
            {weather ? (
              <>
                <div className="weather-main">
                  <span
                    className="wind-arrow"
                    style={{ transform: `rotate(${weather.windDirectionDeg}deg)` }}
                    title={`Vent venant de ${Math.round(weather.windDirectionDeg)}°`}
                  />
                  <span>{Math.round(weather.temperatureC)}°C</span>
                  <span className="hint">{weather.description}</span>
                </div>
                <span className="hint">
                  Vent {Math.round(weather.windSpeedKmh)} km/h · Précip.{' '}
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

      <PanelSection title="Explorer">
        <div className="control-group">
          <span className="control-label">Rechercher une chute ou un point d'intérêt</span>
          <input
            type="text"
            className="search-input"
            placeholder="Rechercher par nom ou numéro…"
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
            <span className="hint">Aucun résultat</span>
          )}
        </div>

        <div className="control-group">
          <span className="control-label">Fond de carte</span>
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
            {tourRunning ? 'Arrêter la visite' : 'Démarrer la visite aérienne'}
          </button>
        </div>

        <div className="control-group">
          <button
            className={`action-button ${landmarkTourActive ? 'chip-active' : ''}`}
            onClick={landmarkTourActive ? onExitLandmarkTour : onStartLandmarkTour}
            disabled={tourRunning || chuteCount === 0}
          >
            {landmarkTourActive ? 'Quitter la visite des chutes' : 'Visiter les chutes'}
          </button>
          <span className="hint">
            {chuteCount} chute{chuteCount === 1 ? '' : 's'} enregistrée{chuteCount === 1 ? '' : 's'}
          </span>
        </div>
      </PanelSection>

      <PanelSection title="Couches">
        <div className="control-group">
          <PasscodeGate label="Les chutes sont privées. Entrez le code pour les afficher." onUnlock={onUnlock}>
            <label className="layer-toggle-row">
              <input type="checkbox" checked={showChutes} onChange={onToggleChutes} />
              <span>Chutes</span>
            </label>
          </PasscodeGate>

          <label className="layer-toggle-row">
            <input type="checkbox" checked={showSpots} onChange={onToggleSpots} />
            <span>Histoires et lieux importants</span>
          </label>

          <label className="layer-toggle-row">
            <input type="checkbox" checked={showDrawnMap} onChange={onToggleDrawnMap} />
            <span>Carte dessinée</span>
          </label>

          <label className="layer-toggle-row">
            <input type="checkbox" checked={showNames} onChange={onToggleNames} />
            <span>Noms</span>
          </label>
        </div>
      </PanelSection>

      <PanelSection title="Outils">
        <div className="control-group">
          <button
            className={`action-button ${measureActive ? 'chip-active' : ''}`}
            onClick={onToggleMeasure}
            disabled={tourRunning || landmarkTourActive}
          >
            {measureActive ? 'Quitter le mode mesure' : 'Mesurer une distance'}
          </button>
          {measureActive && measurePointCount === 0 && (
            <span className="hint">Cliquez sur le terrain pour tracer un parcours</span>
          )}
          {measureActive && measurePointCount > 0 && !measureClosed && (
            <div className="button-row">
              <button className="clear-button" onClick={onUndoMeasurePoint}>
                Annuler le point
              </button>
              {measurePointCount >= 3 && (
                <button className="clear-button" onClick={onCloseMeasureLoop}>
                  Fermer la boucle
                </button>
              )}
            </div>
          )}
          {measureResult && (
            <div className="measure-result">
              <div>
                {measureClosed ? 'Périmètre' : 'Longueur'} : {formatDistance(measureResult.distanceMeters)}
              </div>
              {measureResult.areaSquareMeters !== null && (
                <div>Surface : {formatArea(measureResult.areaSquareMeters)}</div>
              )}
              <div>
                Dénivelé :{' '}
                {measureResult.elevationDeltaMeters === null
                  ? 'indisponible'
                  : `${Math.round(measureResult.elevationDeltaMeters)} m`}
              </div>
              <button className="clear-button" onClick={onClearMeasure}>
                Effacer
              </button>
            </div>
          )}
        </div>

        <div className="control-group">
          <span className="control-label">Terrain</span>
          <div className="elevation-readout">
            {hoverElevation && hoverElevation.elevationMeters !== null ? (
              <>
                <div>Altitude : {Math.round(hoverElevation.elevationMeters)} m</div>
                <div>
                  Pente :{' '}
                  {hoverElevation.slopePercent === null
                    ? 'indisponible'
                    : `${hoverElevation.slopePercent.toFixed(1)}%`}
                </div>
              </>
            ) : (
              <span className="hint">Survolez le terrain</span>
            )}
          </div>
          <button
            className={`action-button ${slopeContrast ? 'chip-active' : ''}`}
            onClick={onToggleSlopeContrast}
          >
            {slopeContrast ? "Afficher l'ombrage normal" : 'Accentuer le contraste des pentes'}
          </button>
          {slopeContrast && (
            <span className="hint">Les terrains plus pentus apparaissent plus rouges/sombres lors du survol</span>
          )}
        </div>

        <div className="control-group">
          <button
            className={`action-button ${showOverlay ? 'chip-active' : ''}`}
            onClick={onToggleOverlay}
            disabled={tourRunning}
          >
            {showOverlay ? 'Masquer le contour du domaine' : 'Afficher le contour du domaine'}
          </button>
          {showOverlay && (
            <div className="legend">
              <div className="legend-row">
                <span className="legend-swatch legend-swatch-boundary" />
                Limite du domaine
              </div>
            </div>
          )}
        </div>

        {usesSatelliteImagery(basemap) && (
          <div className="control-group">
            <span className="control-label">Année de l'imagerie satellite</span>
            <div className="button-row">
              <button
                className={`chip ${historicalYear === 'current' ? 'chip-active' : ''}`}
                onClick={() => onHistoricalYearChange('current')}
                disabled={tourRunning || landmarkTourActive}
              >
                Actuel
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

      <PanelSection title="Partager">
        <div className="control-group">
          <div className="button-row">
            <button className="action-button" onClick={onCaptureView}>
              Capturer la vue (PNG)
            </button>
            <button className="action-button" onClick={onGenerateShareLink}>
              Copier le lien de partage
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
                <div className="share-toast">Copié dans le presse-papiers</div>
              ) : (
                <span className="hint">Copiez le lien ci-dessus</span>
              )}
            </div>
          )}
        </div>

        <div className="control-group">
          <a className="action-button leaderboard-link" href="#/leaderboard">
            Classement Gros Cerf 2026
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
  return `${Math.round(squareMeters).toLocaleString('fr-FR')} m²`
}
