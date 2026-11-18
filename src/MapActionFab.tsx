import { useEffect, useState } from 'react'
import { PawIcon, WarningIcon, RulerIcon, CrossIcon, PlusIcon } from './MapActionIcons'

interface Props {
  reportingDeer: boolean
  onToggleReportingDeer: () => void
  placingWarning: boolean
  onTogglePlacingWarning: () => void
  measureActive: boolean
  onToggleMeasure: () => void
  measureDisabled: boolean
}

/**
 * Bottom-right expandable action button grouping the three "do something
 * on the map" actions (report animal, report warning, measure) — thumb
 * reach on mobile, replacing three always-visible circles with one. Recenter
 * and the 3D toggle stay as their own separate buttons (bottom-left,
 * unchanged): those are view controls, not actions on the map itself.
 */
export default function MapActionFab({
  reportingDeer,
  onToggleReportingDeer,
  placingWarning,
  onTogglePlacingWarning,
  measureActive,
  onToggleMeasure,
  measureDisabled,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const anyActive = reportingDeer || placingWarning || measureActive

  // Once one of the three actions actually starts, the expanded menu has
  // done its job — collapse it so it isn't sitting open over the map.
  useEffect(() => {
    if (anyActive) setExpanded(false)
  }, [anyActive])

  const handleMainClick = () => {
    if (reportingDeer) onToggleReportingDeer()
    else if (placingWarning) onTogglePlacingWarning()
    else if (measureActive) onToggleMeasure()
    else setExpanded((e) => !e)
  }

  return (
    <div className="map-action-fab">
      {expanded && (
        <div className="map-action-fab-menu">
          <button type="button" className="map-action-fab-item" onClick={onToggleReportingDeer}>
            <span>Signaler un animal</span>
            <PawIcon />
          </button>
          <button type="button" className="map-action-fab-item" onClick={onTogglePlacingWarning}>
            <span>Signaler un point inhabituel</span>
            <WarningIcon />
          </button>
          <button type="button" className="map-action-fab-item" onClick={onToggleMeasure} disabled={measureDisabled}>
            <span>Mesurer une distance</span>
            <RulerIcon />
          </button>
        </div>
      )}
      <button
        type="button"
        className={`map-action-fab-main ${anyActive ? 'map-action-fab-main-active' : ''}`}
        onClick={handleMainClick}
        aria-label={anyActive ? 'Annuler' : expanded ? 'Fermer le menu des actions' : 'Actions sur la carte'}
        aria-expanded={expanded}
      >
        {anyActive || expanded ? <CrossIcon /> : <PlusIcon />}
      </button>
    </div>
  )
}
