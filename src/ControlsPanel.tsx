import { useMemo, useState, type ReactNode } from 'react'
import { historicalYears, type ImagerySelection } from './historicalImagery'
import { basemapOptions, usesSatelliteImagery, type BasemapStyle } from './basemap'
import type { ElevationSample } from './elevation'
import type { WeatherData } from './weather'
import type { Landmark } from './landmarks'
import DateTimeWidget from './DateTimeWidget'
import WindCompass from './WindCompass'
import PasscodeGate from './PasscodeGate'
import logoWolmar from './assets/branding/logo-wolmar-small.png'
import iconWeather from './assets/branding/icon-weather.png'
import iconTimeTravel from './assets/branding/icon-time-travel.png'
import iconDistances from './assets/branding/icon-distances.png'
import iconMiradors from './assets/branding/icon-miradors.png'
import iconHallOfFame from './assets/branding/icon-hall-of-fame.png'
import iconSeeMore from './assets/branding/icon-see-more.png'

interface Props {
  landmarks: Landmark[]
  onSelectLandmark: (landmark: Landmark) => void
  onUnlock: () => void
  showChutes: boolean
  onToggleChutes: () => void
  showWindCones: boolean
  onToggleWindCones: () => void
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

type SectionKey = 'weather' | 'timeTravel' | 'distances' | 'miradors' | 'hallOfFame' | 'more'

const SECTIONS: { key: SectionKey; icon: string; label: string }[] = [
  { key: 'weather', icon: iconWeather, label: 'Météo' },
  { key: 'timeTravel', icon: iconTimeTravel, label: 'Voyage dans le temps' },
  { key: 'distances', icon: iconDistances, label: 'Distances' },
  { key: 'miradors', icon: iconMiradors, label: 'Miradors' },
  { key: 'hallOfFame', icon: iconHallOfFame, label: 'Hall of Fame' },
  { key: 'more', icon: iconSeeMore, label: 'Plus' },
]

function ControlGroup({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="control-group">
      {label && <span className="control-label">{label}</span>}
      {children}
    </div>
  )
}

export default function ControlsPanel({
  landmarks,
  onSelectLandmark,
  onUnlock,
  showChutes,
  onToggleChutes,
  showWindCones,
  onToggleWindCones,
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
  const [activeSection, setActiveSection] = useState<SectionKey>('weather')

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return landmarks
      .filter((l) => l.name.toLowerCase().includes(q) || (l.number !== null && String(l.number).includes(q)))
      .slice(0, 8)
  }, [landmarks, searchQuery])

  return (
    <>
      <button
        type="button"
        className={`panel-edge-toggle ${collapsed ? 'panel-edge-toggle-collapsed' : ''}`}
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? 'Afficher les commandes' : 'Masquer les commandes'}
      >
        {collapsed ? '›' : '‹'}
      </button>

      <div className={`controls-panel ${collapsed ? 'controls-panel-collapsed' : ''}`}>
        <button
          type="button"
          className="controls-panel-toggle"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Agrandir les commandes' : 'Réduire les commandes'}
        >
          Commandes {collapsed ? '▲' : '▼'}
        </button>

        <div className="controls-panel-scroll">
          <div className="panel-header">
            <img src={logoWolmar} alt="Domaine de Wolmar" className="panel-logo" />
          </div>

          <div className="panel-icon-tabs">
            {SECTIONS.map((section) => (
              <button
                key={section.key}
                type="button"
                className={`panel-icon-tab ${activeSection === section.key ? 'panel-icon-tab-active' : ''}`}
                onClick={() => setActiveSection(section.key)}
                aria-label={section.label}
                aria-pressed={activeSection === section.key}
                title={section.label}
              >
                <img src={section.icon} alt="" />
              </button>
            ))}
          </div>

          <div className="panel-section-content" key={activeSection}>
            {activeSection === 'weather' && (
          <ControlGroup>
            <div className="estate-status">
              <div className="weather-readout">
                {weather ? (
                  <>
                    <div className="weather-main">
                      <WindCompass directionDeg={weather.windDirectionDeg} speedKmh={weather.windSpeedKmh} />
                      <span className="weather-temp">{Math.round(weather.temperatureC)}°C</span>
                    </div>
                    <span className="hint weather-desc">{weather.description}</span>
                    <span className="hint">Précip. {weather.precipitationMm.toFixed(1)} mm</span>
                  </>
                ) : weatherError ? (
                  <span className="hint">{weatherError}</span>
                ) : (
                  <div className="skeleton-line skeleton-line-weather" />
                )}
              </div>
              <DateTimeWidget />
            </div>
            <span className="hint weather-source">
              Source :{' '}
              <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
                Open-Meteo
              </a>
            </span>
          </ControlGroup>
        )}

        {activeSection === 'timeTravel' && (
          <ControlGroup label="Année de l'imagerie satellite">
            {usesSatelliteImagery(basemap) ? (
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
            ) : (
              <span className="hint">
                Passez en fond de carte Satellite ou Hybride pour explorer les images historiques.
              </span>
            )}
          </ControlGroup>
        )}

        {activeSection === 'distances' && (
          <ControlGroup>
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
                  <div>
                    <span>Surface : </span>
                    <div className="area-chip-row">
                      {(() => {
                        const units = formatAreaUnits(measureResult.areaSquareMeters)
                        return (
                          <>
                            <span className="area-chip" title="Kilomètres carrés">
                              {units.km2} km²
                            </span>
                            <span className="area-chip" title="Hectares">
                              {units.ha} ha
                            </span>
                            <span className="area-chip" title="Pieds carrés">
                              {units.ft2} pi²
                            </span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
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
          </ControlGroup>
        )}

        {activeSection === 'miradors' && (
          <>
            <ControlGroup label="Rechercher une chute ou un point d'intérêt">
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
            </ControlGroup>

            <ControlGroup>
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
            </ControlGroup>

            <ControlGroup>
              <PasscodeGate label="Les chutes sont privées. Entrez le code pour les afficher." onUnlock={onUnlock}>
                <label className="layer-toggle-row">
                  <input type="checkbox" checked={showChutes} onChange={onToggleChutes} />
                  <span>Afficher les chutes sur la carte</span>
                </label>
                <label className="layer-toggle-row">
                  <input
                    type="checkbox"
                    checked={showWindCones}
                    onChange={onToggleWindCones}
                    disabled={!showChutes}
                  />
                  <span>Zones sous le vent (odeur)</span>
                </label>
                {showWindCones && showChutes && (
                  <span className="hint">
                    Cône indicatif dans le sens où porte le vent actuel — pas une garantie.
                  </span>
                )}
              </PasscodeGate>
            </ControlGroup>
          </>
        )}

        {activeSection === 'hallOfFame' && (
          <ControlGroup>
            <div className="hall-of-fame-panel">
              <img src={iconHallOfFame} alt="" className="hall-of-fame-icon" />
              <a className="action-button leaderboard-link" href="#/leaderboard">
                Découvrir le tableau d'honneur 2026
              </a>
            </div>
          </ControlGroup>
        )}

        {activeSection === 'more' && (
          <>
            <ControlGroup label="Fond de carte">
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
            </ControlGroup>

            <ControlGroup>
              <button className="action-button" onClick={onToggleTour} disabled={landmarkTourActive}>
                {tourRunning ? 'Arrêter la visite' : 'Démarrer la visite aérienne'}
              </button>
            </ControlGroup>

            <ControlGroup label="Terrain">
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
            </ControlGroup>

            <ControlGroup>
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
            </ControlGroup>

            <ControlGroup label="Couches">
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
            </ControlGroup>

            <ControlGroup label="La Boutique">
              <div className="boutique-info">
                <span>Lun-Ven : 9h–15h</span>
                <span>Sam : 9h–11h</span>
                <span className="hint">Autres informations à venir</span>
              </div>
            </ControlGroup>

            <ControlGroup label="Partager">
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
            </ControlGroup>
          </>
        )}
          </div>
        </div>
      </div>
    </>
  )
}

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`
}

function formatAreaUnits(squareMeters: number): { km2: string; ha: string; ft2: string } {
  const km2 = squareMeters / 1_000_000
  const ha = squareMeters / 10_000
  const ft2 = squareMeters * 10.7639
  return {
    km2: km2.toLocaleString('fr-FR', { maximumFractionDigits: 2 }),
    ha: ha.toLocaleString('fr-FR', { maximumFractionDigits: 2 }),
    ft2: Math.round(ft2).toLocaleString('fr-FR'),
  }
}
