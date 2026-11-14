import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Map, {
  Marker,
  Popup,
  NavigationControl,
  FullscreenControl,
  Source,
  Layer,
  type MapRef,
  type MapLayerMouseEvent,
} from 'react-map-gl/maplibre'
import { setWorkerUrl, type MapSourceDataEvent } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

// MapLibre GL JS ships its tile-parsing worker as standalone files
// (maplibre-gl-worker.mjs + maplibre-gl-shared.mjs, copied into public/ by
// scripts/copy-maplibre-worker.mjs) rather than inlining them; without this,
// vector tiles never load even though raster tiles still work. Set here
// (rather than in main.tsx) so the leaderboard route — which never touches
// the map — doesn't pull all of maplibre-gl into its bundle just for this.
setWorkerUrl(`${import.meta.env.BASE_URL}maplibre-gl-worker.mjs`)
import { pois, type Poi } from './poi'
import PoiIcon from './PoiIcon'
import MapCompass from './MapCompass'
import { mapStyle } from './mapStyle'
import { pathLengthMeters, polygonAreaSquareMeters } from './geo'
import { estateBoundary } from './boundary'
import { ISOLATE_VIEW } from './isolateMode'
import { isUnlocked, isAdminUnlocked, setAdminUnlocked } from './passcode'
import { getReporterId } from './reporterId'
import drawnMapImage from './assets/estate-drawn-map.png'
import { historicalYears, waybackTileUrl, currentImageryTileUrl, type ImagerySelection } from './historicalImagery'
import {
  basemapOptions,
  landcoverLayerIds,
  waterLayerIds,
  roadLayerIds,
  buildingLayerIds,
  layerVisibilityFor,
  usesSatelliteImagery,
  type BasemapStyle,
} from './basemap'
import { sampleElevation, type ElevationSample } from './elevation'
import { fetchCurrentWeather, type WeatherData } from './weather'
import { parseShareStateFromUrl } from './shareState'
import { flyToEstate } from './cameraMotion'
import { computeDayNight } from './dayNight'
import { buildWindConeGeoJSON } from './windCone'
import {
  landmarks,
  landmarkCategoryColors,
  landmarkCategoryIcons,
  landmarkNumberSortKey,
  type Landmark,
} from './landmarks'
import { isFirebaseConfigured } from './firebaseConfig'
import type { WoundedDeerReport } from './fieldReports'
import ControlsPanel, { type SectionKey } from './ControlsPanel'
import LandmarkTourCard from './LandmarkTourCard'
import PhotoLightbox from './PhotoLightbox'
import OnboardingCard from './OnboardingCard'
import './App.css'

// Lazy-loaded so the ~hundreds of kB Three.js/postprocessing stack is only
// ever downloaded by visitors who actually open the 3D platform view.
const Isolate3DView = lazy(() => import('./Isolate3DView'))

interface MeasurePoint {
  lngLat: [number, number]
  elevation: number | null
}

const boundaryGeometry: GeoJSON.Feature = {
  type: 'Feature',
  properties: {},
  geometry: { type: 'Polygon', coordinates: [estateBoundary] },
}

const HOVER_THROTTLE_MS = 100
const ZOOM_THROTTLE_MS = 100
const LANDMARK_NUMBER_MIN_ZOOM = 16
/** Pin color for a chute whose number/name still needs the board's sign-off. */
const LANDMARK_REVIEW_COLOR = '#e5484d'
const LANDMARK_FADE_START_ZOOM = 13
const ROTATE_HINT_MIN_ZOOM = 13
const LANDMARK_FADE_END_ZOOM = 11

const ESTATE_CENTER = { longitude: 57.368, latitude: -20.302 }
// Fitted by tracing the drawn artwork's own outline (from its alpha mask)
// and running iterative closest-point alignment against the surveyed
// estateBoundary polygon, converging to ~7m median / ~20m p90 error; the
// drawing isn't north-up.
const drawnMapCoordinates: [[number, number], [number, number], [number, number], [number, number]] = [
  [57.393740, -20.285151],
  [57.387821, -20.318622],
  [57.361864, -20.314485],
  [57.367783, -20.281013],
]
const BASEMAP_STORAGE_KEY = 'ddw-basemap'

function readStoredBasemap(): BasemapStyle | null {
  try {
    const v = localStorage.getItem(BASEMAP_STORAGE_KEY)
    return v && basemapOptions.some((o) => o.value === v) ? (v as BasemapStyle) : null
  } catch {
    return null
  }
}

function landmarkPinOpacity(zoom: number): number {
  if (zoom >= LANDMARK_FADE_START_ZOOM) return 1
  if (zoom <= LANDMARK_FADE_END_ZOOM) return 0
  return (zoom - LANDMARK_FADE_END_ZOOM) / (LANDMARK_FADE_START_ZOOM - LANDMARK_FADE_END_ZOOM)
}

export default function App() {
  const mapRef = useRef<MapRef>(null)
  const cancelledRef = useRef(false)
  const hasFlownInRef = useRef(false)

  const lastHoverRef = useRef(0)
  const lastZoomRef = useRef(0)
  const lastBearingRef = useRef(0)

  const shared = useMemo(() => parseShareStateFromUrl(), [])

  const targetView = useMemo(
    () => ({
      longitude: shared.longitude ?? ESTATE_CENTER.longitude,
      latitude: shared.latitude ?? ESTATE_CENTER.latitude,
      zoom: shared.zoom ?? 15,
      pitch: shared.pitch ?? 65,
      bearing: shared.bearing ?? -20,
    }),
    [shared],
  )

  const [selected, setSelected] = useState<Poi | null>(null)
  const [tourRunning, setTourRunning] = useState(false)
  const [measureActive, setMeasureActive] = useState(false)
  const [measurePoints, setMeasurePoints] = useState<MeasurePoint[]>([])
  const [measureClosed, setMeasureClosed] = useState(false)
  const [showOverlay, setShowOverlay] = useState(shared.showOverlay ?? true)
  const [historicalYear, setHistoricalYear] = useState<ImagerySelection>(shared.historicalYear ?? null)
  const [hoverElevation, setHoverElevation] = useState<ElevationSample | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [slopeContrast, setSlopeContrast] = useState(false)
  const [basemap, setBasemap] = useState<BasemapStyle>(shared.basemap ?? readStoredBasemap() ?? 'satellite')
  const [basemapTransitioning, setBasemapTransitioning] = useState(false)
  const basemapMountedRef = useRef(false)
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null)
  const [openPopupPhotoIndex, setOpenPopupPhotoIndex] = useState<number | null>(null)
  const [landmarkTourIndex, setLandmarkTourIndex] = useState<number | null>(null)
  const [zoom, setZoom] = useState(Math.max(targetView.zoom - 3, 5))
  const [bearing, setBearing] = useState(targetView.bearing)
  const [rotateHintExpired, setRotateHintExpired] = useState(false)
  const rotateHintTimerStarted = useRef(false)
  const rotateHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isolate3dHintDismissed, setIsolate3dHintDismissed] = useState(false)
  const [mapDragging, setMapDragging] = useState(false)
  const [renderedImageryUrl, setRenderedImageryUrl] = useState<string | null>(null)
  const imageryFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [imageryLoading, setImageryLoading] = useState(false)
  const imageryLoadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [unlocked, setUnlockedState] = useState(isUnlocked())
  const [adminUnlocked, setAdminUnlockedState] = useState(isAdminUnlocked())
  const [showChutes, setShowChutes] = useState(true)
  const [woundedDeerReports, setWoundedDeerReports] = useState<WoundedDeerReport[]>([])
  const [selectedWoundedDeerReport, setSelectedWoundedDeerReport] = useState<WoundedDeerReport | null>(null)
  const [reportingDeer, setReportingDeer] = useState(false)
  const [draftDeerPoint, setDraftDeerPoint] = useState<{ lng: number; lat: number } | null>(null)
  const [hunterPosition, setHunterPosition] = useState<{ lng: number; lat: number } | null>(null)
  const [deerNote, setDeerNote] = useState('')
  const [deerSubmitting, setDeerSubmitting] = useState(false)
  const [deerActionError, setDeerActionError] = useState<string | null>(null)
  const [myReporterId] = useState(() => getReporterId())
  const [showDrawnMap, setShowDrawnMap] = useState(false)
  const [showWindCones, setShowWindCones] = useState(false)
  const [showSitePois, setShowSitePois] = useState(true)
  const [wolmarOnly, setWolmarOnly] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionKey>('weather')

  const chutesVisible = unlocked && showChutes

  // "Histoires et lieux importants" and "Noms" layers are disabled for now
  // (their toggles were removed from the UI) — revisit later.
  const visibleLandmarks = useMemo(
    () =>
      landmarks.filter(
        (l) =>
          (l.category === 'mirador' && chutesVisible) ||
          ((l.category === 'special-spot' || l.category === 'coral-reef') && showSitePois),
      ),
    [chutesVisible, showSitePois],
  )

  const chuteLandmarks = useMemo(
    () =>
      chutesVisible
        ? landmarks
            .filter((l) => l.category === 'mirador')
            .sort((a, b) => landmarkNumberSortKey(a.number) - landmarkNumberSortKey(b.number))
        : [],
    [chutesVisible],
  )
  const currentTourLandmark = landmarkTourIndex !== null ? chuteLandmarks[landmarkTourIndex] : null

  // Live wounded-deer pins (src/FieldReportPage.tsx writes them, this
  // subscribes and re-renders whenever one is added or expires). Gated the
  // same way as the chutes — private, unlocked-only — and entirely inert
  // until a real Firebase project is wired up in src/firebaseConfig.ts.
  // fieldReports.ts is dynamically imported here (not a top-level import)
  // so the ~150kB-gzipped Firestore SDK is only ever fetched once someone
  // actually unlocks the map with a real Firebase project configured —
  // never on a plain visit to the public map.
  useEffect(() => {
    if (!unlocked || !isFirebaseConfigured) {
      setWoundedDeerReports([])
      return
    }
    let unsubscribe: (() => void) | undefined
    let cancelled = false
    import('./fieldReports').then(({ subscribeActiveWoundedDeerReports }) => {
      if (cancelled) return
      unsubscribe = subscribeActiveWoundedDeerReports(setWoundedDeerReports)
    })
    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [unlocked])

  const windConeGeoJSON = useMemo(() => {
    if (!showWindCones || !chutesVisible || chuteLandmarks.length === 0 || !weather) return null
    return buildWindConeGeoJSON(chuteLandmarks, weather.windDirectionDeg, weather.windSpeedKmh)
  }, [showWindCones, chutesVisible, chuteLandmarks, weather])

  const handleUnlock = useCallback(() => setUnlockedState(true), [])
  const handleAdminUnlock = useCallback(() => {
    setAdminUnlocked()
    setAdminUnlockedState(true)
  }, [])
  const handleToggleChutes = useCallback(() => setShowChutes((v) => !v), [])

  // Map-based wounded-deer reporting: tap the floating button to arm it,
  // tap anywhere on the map to drop/move a draft pin (a "you are here" dot
  // from one-shot geolocation sits alongside it as a reference point, since
  // the real hit location is an eyeballed approximation, not the hunter's
  // own exact position), then confirm to actually write it.
  const handleToggleReportingDeer = useCallback(() => {
    setReportingDeer((active) => {
      const next = !active
      setDraftDeerPoint(null)
      setDeerNote('')
      setDeerActionError(null)
      if (next) {
        setMeasureActive(false)
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => setHunterPosition({ lng: pos.coords.longitude, lat: pos.coords.latitude }),
            () => setHunterPosition(null),
            { enableHighAccuracy: true, timeout: 15000 },
          )
        }
      } else {
        setHunterPosition(null)
      }
      return next
    })
  }, [])

  const handleConfirmDeerReport = useCallback(async () => {
    if (!draftDeerPoint) return
    setDeerSubmitting(true)
    setDeerActionError(null)
    try {
      const { reportWoundedDeer } = await import('./fieldReports')
      await reportWoundedDeer(draftDeerPoint.lat, draftDeerPoint.lng, deerNote)
      setReportingDeer(false)
      setDraftDeerPoint(null)
      setHunterPosition(null)
      setDeerNote('')
    } catch {
      setDeerActionError("Échec de l'envoi — réessayez.")
    } finally {
      setDeerSubmitting(false)
    }
  }, [draftDeerPoint, deerNote])

  const handleDeleteDeerReport = useCallback(async (id: string) => {
    setDeerActionError(null)
    try {
      const { deleteWoundedDeerReport } = await import('./fieldReports')
      await deleteWoundedDeerReport(id)
      setSelectedWoundedDeerReport(null)
    } catch {
      setDeerActionError('Échec de la suppression — réessayez.')
    }
  }, [])

  const handleMarkDeerFound = useCallback(async (id: string) => {
    setDeerActionError(null)
    try {
      const { markWoundedDeerFound } = await import('./fieldReports')
      await markWoundedDeerFound(id)
    } catch {
      setDeerActionError('Échec — réessayez.')
    }
  }, [])
  const handleToggleDrawnMap = useCallback(() => setShowDrawnMap((v) => !v), [])
  const handleToggleWindCones = useCallback(() => setShowWindCones((v) => !v), [])
  const handleToggleSitePois = useCallback(() => setShowSitePois((v) => !v), [])

  const handleBasemapChange = useCallback((next: BasemapStyle) => {
    setBasemap(next)
    try {
      localStorage.setItem(BASEMAP_STORAGE_KEY, next)
    } catch {
      // ignore (private browsing / storage disabled)
    }
  }, [])

  const flyToLandmark = useCallback((landmark: Landmark) => {
    const map = mapRef.current?.getMap()
    if (!map) return
    flyToEstate(
      map,
      {
        center: [landmark.longitude, landmark.latitude],
        zoom: Math.max(map.getZoom(), 17.5),
        pitch: 58,
        bearing: map.getBearing(),
      },
      1400,
    )
  }, [])

  const handleStartLandmarkTour = useCallback(() => {
    if (chuteLandmarks.length === 0) return
    setSelected(null)
    setSelectedLandmark(null)
    setOpenPopupPhotoIndex(null)
    setMeasureActive(false)
    cancelledRef.current = true
    setTourRunning(false)
    setLandmarkTourIndex(0)
    flyToLandmark(chuteLandmarks[0])
  }, [chuteLandmarks, flyToLandmark])

  const handleLandmarkTourNext = useCallback(() => {
    setLandmarkTourIndex((i) => {
      if (i === null) return i
      const next = Math.min(i + 1, chuteLandmarks.length - 1)
      flyToLandmark(chuteLandmarks[next])
      return next
    })
  }, [chuteLandmarks, flyToLandmark])

  const handleLandmarkTourPrevious = useCallback(() => {
    setLandmarkTourIndex((i) => {
      if (i === null) return i
      const prev = Math.max(i - 1, 0)
      flyToLandmark(chuteLandmarks[prev])
      return prev
    })
  }, [chuteLandmarks, flyToLandmark])

  const handleExitLandmarkTour = useCallback(() => {
    setLandmarkTourIndex(null)
  }, [])

  const handleSelectLandmark = useCallback(
    (landmark: Landmark) => {
      setSelected(null)
      setSelectedLandmark(landmark)
      setOpenPopupPhotoIndex(null)
      setLandmarkTourIndex(null)
      flyToLandmark(landmark)
    },
    [flyToLandmark],
  )

  const handleToggleMeasure = useCallback(() => {
    setMeasureActive((active) => !active)
    setMeasurePoints([])
    setMeasureClosed(false)
    setLandmarkTourIndex(null)
  }, [])

  const handleClearMeasure = useCallback(() => {
    setMeasurePoints([])
    setMeasureClosed(false)
  }, [])

  const handleUndoMeasurePoint = useCallback(() => {
    setMeasurePoints((prev) => prev.slice(0, -1))
    setMeasureClosed(false)
  }, [])

  const handleCloseMeasureLoop = useCallback(() => {
    setMeasureClosed(true)
  }, [])

  const handleToggleSlopeContrast = useCallback(() => {
    setSlopeContrast((active) => !active)
  }, [])

  const handleMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (reportingDeer) {
        setDraftDeerPoint({ lng: e.lngLat.lng, lat: e.lngLat.lat })
        return
      }
      if (!measureActive || measureClosed) return
      const map = e.target
      const elevation = map.queryTerrainElevation(e.lngLat)
      const point: MeasurePoint = { lngLat: [e.lngLat.lng, e.lngLat.lat], elevation }
      setMeasurePoints((prev) => [...prev, point])
    },
    [reportingDeer, measureActive, measureClosed],
  )

  const handleMapMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const now = performance.now()
    if (now - lastHoverRef.current < HOVER_THROTTLE_MS) return
    lastHoverRef.current = now
    setHoverElevation(sampleElevation(e.target, e.lngLat))
  }, [])

  const handleMapMouseLeave = useCallback(() => {
    setHoverElevation(null)
  }, [])

  const handleMapZoom = useCallback(() => {
    const now = performance.now()
    if (now - lastZoomRef.current < ZOOM_THROTTLE_MS) return
    lastZoomRef.current = now
    const map = mapRef.current?.getMap()
    if (map) setZoom(map.getZoom())
  }, [])

  const handleMapRotate = useCallback(() => {
    const now = performance.now()
    if (now - lastBearingRef.current < ZOOM_THROTTLE_MS) return
    lastBearingRef.current = now
    const map = mapRef.current?.getMap()
    if (map) setBearing(map.getBearing())
  }, [])

  const handleResetNorth = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (map) map.easeTo({ bearing: 0, duration: 500 })
  }, [])

  const handleToggleOverlay = useCallback(() => {
    setShowOverlay((v) => !v)
  }, [])

  const handleRecenter = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (map) {
      flyToEstate(
        map,
        {
          center: [targetView.longitude, targetView.latitude],
          zoom: targetView.zoom,
          pitch: targetView.pitch,
          bearing: targetView.bearing,
        },
        1800,
      )
    }
    setActiveSection('weather')
  }, [targetView])

  const handleToggleWolmarOnly = useCallback(() => {
    const map = mapRef.current?.getMap()
    setWolmarOnly((prev) => {
      const next = !prev
      if (map) {
        flyToEstate(
          map,
          next
            ? {
                center: [ISOLATE_VIEW.longitude, ISOLATE_VIEW.latitude],
                zoom: ISOLATE_VIEW.zoom,
                pitch: ISOLATE_VIEW.pitch,
                bearing: ISOLATE_VIEW.bearing,
              }
            : {
                center: [targetView.longitude, targetView.latitude],
                zoom: targetView.zoom,
                pitch: targetView.pitch,
                bearing: targetView.bearing,
              },
          2200,
        )
      }
      return next
    })
  }, [targetView])

  const handleHistoricalYearChange = useCallback((year: ImagerySelection) => {
    setHistoricalYear(year)
  }, [])

  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map || !mapReady) return

    map.setLayoutProperty('hillshade', 'visibility', slopeContrast ? 'none' : 'visible')
    map.setLayoutProperty('hillshade-contrast', 'visibility', slopeContrast ? 'visible' : 'none')
  }, [slopeContrast, mapReady])

  useEffect(() => {
    if (usesSatelliteImagery(basemap)) {
      setHistoricalYear((y) => y ?? 'current')
    } else {
      setHistoricalYear(null)
    }
  }, [basemap])

  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map || !mapReady) return

    const visibility = layerVisibilityFor(basemap)
    for (const id of landcoverLayerIds) map.setLayoutProperty(id, 'visibility', visibility.landcover)
    for (const id of waterLayerIds) map.setLayoutProperty(id, 'visibility', visibility.water)
    for (const id of roadLayerIds) map.setLayoutProperty(id, 'visibility', visibility.roads)
    for (const id of buildingLayerIds) map.setLayoutProperty(id, 'visibility', visibility.buildings)
  }, [basemap, mapReady])

  // Layer visibility above is toggled instantly (MapLibre can't transition
  // the 'visibility' layout property), which otherwise reads as an abrupt
  // pop of roads/water/buildings. A brief veil masks that swap instead of
  // reworking the layers into paint-opacity transitions.
  useEffect(() => {
    if (!basemapMountedRef.current) {
      basemapMountedRef.current = true
      return
    }
    setBasemapTransitioning(true)
    const timer = setTimeout(() => setBasemapTransitioning(false), 320)
    return () => clearTimeout(timer)
  }, [basemap])

  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map || !mapReady) return

    const applyDayNight = () => {
      const { light, sky } = computeDayNight(new Date())
      map.setLight(light)
      map.setSky(sky)
    }
    applyDayNight()
    const interval = setInterval(applyDayNight, 60000)
    return () => clearInterval(interval)
  }, [mapReady])

  useEffect(() => {
    if (!rotateHintTimerStarted.current && zoom >= ROTATE_HINT_MIN_ZOOM) {
      rotateHintTimerStarted.current = true
      rotateHintTimerRef.current = setTimeout(() => setRotateHintExpired(true), 30000)
    }
  }, [zoom])

  useEffect(() => {
    return () => {
      if (rotateHintTimerRef.current) clearTimeout(rotateHintTimerRef.current)
    }
  }, [])

  // The persistent 3D-view button is new, so a brief one-time callout points
  // visitors at it — dismissed either once they've tried it or after a
  // while, whichever comes first.
  useEffect(() => {
    const timer = setTimeout(() => setIsolate3dHintDismissed(true), 9000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (wolmarOnly) setIsolate3dHintDismissed(true)
  }, [wolmarOnly])

  useEffect(() => {
    let cancelled = false

    const load = () => {
      fetchCurrentWeather(ESTATE_CENTER.latitude, ESTATE_CENTER.longitude)
        .then((data) => {
          if (!cancelled) {
            setWeather(data)
            setWeatherError(null)
          }
        })
        .catch(() => {
          if (!cancelled) setWeatherError('Météo indisponible')
        })
    }

    load()
    const interval = setInterval(load, 10 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])


  const imageryTileUrl =
    historicalYear === 'current'
      ? currentImageryTileUrl()
      : historicalYear !== null
        ? waybackTileUrl(historicalYears.find((y) => y.year === historicalYear)!.releaseNum)
        : null

  useEffect(() => {
    if (imageryFadeTimerRef.current) {
      clearTimeout(imageryFadeTimerRef.current)
      imageryFadeTimerRef.current = null
    }
    if (imageryTileUrl !== null) {
      setRenderedImageryUrl(imageryTileUrl)
    } else {
      // Keep the tile source mounted briefly so the layer can fade out
      // instead of popping off instantly when leaving satellite basemaps.
      imageryFadeTimerRef.current = setTimeout(() => setRenderedImageryUrl(null), 400)
    }
  }, [imageryTileUrl])

  // Historical/satellite tiles can take a moment to fetch, so flip a loading
  // flag on right away when a year is picked (for instant feedback) and off
  // again once MapLibre reports the source fully loaded (or errors out). A
  // bounded safety timeout also clears it, in case a tile failure never
  // raises a clean 'error'/'sourcedata' signal (e.g. an empty 404 response).
  useEffect(() => {
    if (imageryLoadingTimeoutRef.current) {
      clearTimeout(imageryLoadingTimeoutRef.current)
      imageryLoadingTimeoutRef.current = null
    }
    setImageryLoading(imageryTileUrl !== null)
    if (imageryTileUrl !== null) {
      imageryLoadingTimeoutRef.current = setTimeout(() => setImageryLoading(false), 8000)
    }
  }, [imageryTileUrl])

  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map || !mapReady) return

    const clearImageryLoading = () => {
      if (imageryLoadingTimeoutRef.current) {
        clearTimeout(imageryLoadingTimeoutRef.current)
        imageryLoadingTimeoutRef.current = null
      }
      setImageryLoading(false)
    }
    const handleSourceData = (e: MapSourceDataEvent) => {
      if (e.sourceId === 'historical-imagery' && e.isSourceLoaded) {
        clearImageryLoading()
      }
    }
    const handleError = () => clearImageryLoading()

    map.on('sourcedata', handleSourceData)
    map.on('error', handleError)
    return () => {
      map.off('sourcedata', handleSourceData)
      map.off('error', handleError)
    }
  }, [mapReady])

  const measureCoords = measurePoints.map((p) => p.lngLat)
  const measureIsClosedLoop = measureClosed && measureCoords.length >= 3
  const measurePathCoords = measureIsClosedLoop ? [...measureCoords, measureCoords[0]] : measureCoords

  const measureResult =
    measurePoints.length >= 2
      ? {
          distanceMeters: pathLengthMeters(measurePathCoords),
          elevationDeltaMeters:
            measurePoints[0].elevation !== null && measurePoints[measurePoints.length - 1].elevation !== null
              ? measurePoints[measurePoints.length - 1].elevation! - measurePoints[0].elevation!
              : null,
          areaSquareMeters: measureIsClosedLoop ? polygonAreaSquareMeters(measureCoords) : null,
        }
      : null

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        longitude: targetView.longitude,
        latitude: targetView.latitude,
        zoom: Math.max(targetView.zoom - 3, 5),
        pitch: 15,
        bearing: 0,
      }}
      terrain={{ source: 'terrain-dem', exaggeration: 1.6 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle={mapStyle}
      canvasContextAttributes={{ preserveDrawingBuffer: true }}
      onClick={handleMapClick}
      onMouseMove={handleMapMouseMove}
      onMouseOut={handleMapMouseLeave}
      onZoom={handleMapZoom}
      onRotate={handleMapRotate}
      onDragStart={() => setMapDragging(true)}
      onDragEnd={() => setMapDragging(false)}
      onError={(e) => {
        // Cancelled tile requests (panning away mid-fetch) fire as errors too
        // and are completely normal. A transient failure before the map has
        // loaded isn't worth alarming the visitor over either — MapLibre
        // retries failed tile/style requests on its own, so the loading
        // animation below just keeps showing until onLoad actually fires;
        // only log it so a genuinely stuck load is still diagnosable.
        if (e.error?.name === 'AbortError') return
        if (!mapReady) console.warn('[map] load error (will keep retrying):', e.error)
      }}
      onLoad={() => {
        setMapReady(true)
        const map = mapRef.current?.getMap()
        if (map && !hasFlownInRef.current) {
          hasFlownInRef.current = true
          flyToEstate(
            map,
            {
              center: [targetView.longitude, targetView.latitude],
              zoom: targetView.zoom,
              pitch: targetView.pitch,
              bearing: targetView.bearing,
            },
            2600,
          )
        }
      }}
      cursor={reportingDeer || measureActive ? 'crosshair' : mapDragging ? 'grabbing' : 'grab'}
    >
      {/* These control the hidden 2D map, and their fixed top-right anchor
          collides with the 3D view's own axis gizmo/minimap in that same
          corner — hide them while that view is open, same reasoning as the
          compass below. */}
      {!wolmarOnly && (
        <>
          <FullscreenControl position="top-right" />
          <NavigationControl position="top-right" visualizePitch />
        </>
      )}
      {zoom >= ROTATE_HINT_MIN_ZOOM && !rotateHintExpired && !wolmarOnly && (
        <div className="rotate-hint">Cliquez et glissez pour incliner/pivoter</div>
      )}
      {basemapTransitioning && <div className="basemap-transition-veil" />}
      {!mapReady && (
        <div className="map-loading-overlay">
          <div className="map-loading-spinner" />
          <p>Chargement de la carte…</p>
        </div>
      )}
      <button
        type="button"
        className="recenter-button"
        onClick={handleRecenter}
        aria-label="Recentrer sur le domaine"
        title="Recentrer sur le domaine"
      >
        ⌂
      </button>
      <button
        type="button"
        className={`isolate-3d-button ${wolmarOnly ? 'isolate-3d-button-active' : ''}`}
        onClick={handleToggleWolmarOnly}
        disabled={tourRunning || landmarkTourIndex !== null}
        aria-label={wolmarOnly ? 'Quitter la vue plateforme 3D' : 'Isoler le domaine en vue plateforme 3D'}
        title={wolmarOnly ? 'Quitter la vue plateforme 3D' : 'Isoler le domaine en vue plateforme 3D'}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      </button>
      {!isolate3dHintDismissed && !wolmarOnly && (
        <div className="isolate-3d-hint">Cliquez pour une vue 3D isolée</div>
      )}
      {unlocked && !wolmarOnly && (
        <button
          type="button"
          className={`report-deer-button ${reportingDeer ? 'report-deer-button-active' : ''}`}
          onClick={handleToggleReportingDeer}
          aria-label={reportingDeer ? 'Annuler le signalement' : 'Signaler un animal blessé'}
          title={reportingDeer ? 'Annuler le signalement' : 'Signaler un animal blessé'}
        >
          🦌
        </button>
      )}
      {/* The 3D view has its own compass (reflecting the 3D camera's
          azimuth, not the hidden 2D map's) in the same corner — showing
          both would be a confusing, overlapping duplicate. */}
      {!wolmarOnly && <MapCompass bearing={bearing} onReset={handleResetNorth} />}
      <OnboardingCard />

      {renderedImageryUrl !== null && (
        <Source
          id="historical-imagery"
          type="raster"
          tiles={[renderedImageryUrl]}
          tileSize={256}
        >
          <Layer
            id="historical-imagery-layer"
            type="raster"
            beforeId="hillshade"
            paint={{
              'raster-opacity': imageryTileUrl !== null ? 1 : 0,
              'raster-opacity-transition': { duration: 400, delay: 0 },
              'raster-fade-duration': 500,
            }}
          />
        </Source>
      )}

      {showOverlay && (
        <Source id="estate-boundary" type="geojson" data={boundaryGeometry}>
          <Layer
            id="estate-boundary-fill"
            type="fill"
            paint={{
              'fill-color': '#f4a300',
              'fill-opacity': 0.05,
            }}
          />
          <Layer
            id="estate-boundary-glow"
            type="line"
            paint={{
              'line-color': '#f4a300',
              'line-width': 10,
              'line-blur': 6,
              'line-opacity': 0.35,
            }}
          />
          <Layer
            id="estate-boundary-line"
            type="line"
            paint={{
              'line-color': '#ffd166',
              'line-width': 2,
              'line-opacity': 0.95,
            }}
          />
        </Source>
      )}

      {windConeGeoJSON && (
        <Source id="wind-cones" type="geojson" data={windConeGeoJSON}>
          <Layer
            id="wind-cones-fill"
            type="fill"
            paint={{
              'fill-color': '#9fd8ff',
              'fill-opacity': 0.18,
            }}
          />
          <Layer
            id="wind-cones-outline"
            type="line"
            paint={{
              'line-color': '#9fd8ff',
              'line-width': 1,
              'line-opacity': 0.45,
            }}
          />
        </Source>
      )}

      {showDrawnMap && (
        <>
          <Source id="drawn-map-shadow" type="geojson" data={boundaryGeometry}>
            <Layer
              id="drawn-map-shadow-fill"
              type="fill"
              paint={{
                'fill-color': '#0a0a08',
                'fill-opacity': 0.3,
                'fill-translate': [5, 7],
                'fill-translate-anchor': 'viewport',
              }}
            />
            <Layer
              id="drawn-map-shadow-blur"
              type="line"
              paint={{
                'line-color': '#0a0a08',
                'line-width': 8,
                'line-blur': 6,
                'line-opacity': 0.35,
                'line-translate': [5, 7],
                'line-translate-anchor': 'viewport',
              }}
            />
          </Source>

          <Source id="drawn-map" type="image" url={drawnMapImage} coordinates={drawnMapCoordinates}>
            <Layer id="drawn-map-layer" type="raster" paint={{ 'raster-opacity': 0.92 }} />
          </Source>

          <Source id="drawn-map-outline" type="geojson" data={boundaryGeometry}>
            <Layer
              id="drawn-map-outline-glow"
              type="line"
              paint={{
                'line-color': '#f4a300',
                'line-width': 8,
                'line-blur': 5,
                'line-opacity': 0.4,
              }}
            />
            <Layer
              id="drawn-map-outline-line"
              type="line"
              paint={{
                'line-color': '#ffd166',
                'line-width': 2.5,
                'line-opacity': 0.95,
              }}
            />
          </Source>
        </>
      )}

      {pois.map((poi) => (
        <Marker
          key={poi.id}
          longitude={poi.longitude}
          latitude={poi.latitude}
          anchor="center"
          onClick={(e) => {
            e.originalEvent.stopPropagation()
            if (selected?.id === poi.id) {
              setSelected(null)
              return
            }
            setSelected(poi)
            const map = mapRef.current?.getMap()
            if (map) {
              flyToEstate(
                map,
                {
                  center: [poi.longitude, poi.latitude],
                  zoom: Math.max(map.getZoom(), 17.5),
                  pitch: 58,
                  bearing: map.getBearing(),
                },
                1400,
              )
            }
          }}
        >
          <PoiIcon type={poi.icon} title={poi.name} />
        </Marker>
      ))}

      {selected && (
        <Popup
          longitude={selected.longitude}
          latitude={selected.latitude}
          anchor="top"
          onClose={() => setSelected(null)}
          closeOnClick={false}
        >
          <strong>{selected.name}</strong>
          <p>{selected.description}</p>
        </Popup>
      )}

      {visibleLandmarks.map((landmark) => (
        <Marker
          key={landmark.id}
          longitude={landmark.longitude}
          latitude={landmark.latitude}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation()
            setSelectedLandmark(landmark)
            setOpenPopupPhotoIndex(null)
            flyToLandmark(landmark)
          }}
        >
          <div
            className={`landmark-pin ${selectedLandmark?.id === landmark.id ? 'landmark-pin-selected' : ''}`}
            style={{
              background: landmark.needsReview ? LANDMARK_REVIEW_COLOR : landmarkCategoryColors[landmark.category],
              opacity: landmark.category === 'mirador' ? landmarkPinOpacity(zoom) : 1,
              pointerEvents: landmark.category === 'mirador' && landmarkPinOpacity(zoom) === 0 ? 'none' : undefined,
            }}
            title={
              (landmark.name || (landmark.number !== null ? `Chute ${landmark.number}` : '')) +
              (landmark.needsReview ? ' (à confirmer)' : '')
            }
          >
            {landmark.number !== null && zoom >= LANDMARK_NUMBER_MIN_ZOOM && (
              <span className="landmark-pin-number">{landmark.number}</span>
            )}
            {landmarkCategoryIcons[landmark.category] && (
              <span className="landmark-pin-icon">{landmarkCategoryIcons[landmark.category]}</span>
            )}
          </div>
        </Marker>
      ))}

      {woundedDeerReports.map((report) => (
        <Marker
          key={report.id}
          longitude={report.longitude}
          latitude={report.latitude}
          anchor="center"
          onClick={(e) => {
            e.originalEvent.stopPropagation()
            setSelectedWoundedDeerReport(report)
          }}
        >
          <div
            className={`wounded-deer-pin ${report.foundAt ? 'wounded-deer-pin-found' : ''}`}
            title={report.foundAt ? 'Animal trouvé' : 'Animal blessé'}
          />
        </Marker>
      ))}

      {hunterPosition && (
        <Marker longitude={hunterPosition.lng} latitude={hunterPosition.lat} anchor="center">
          <div className="hunter-position-dot" title="Votre position" />
        </Marker>
      )}

      {draftDeerPoint && (
        <Marker longitude={draftDeerPoint.lng} latitude={draftDeerPoint.lat} anchor="center">
          <div className="wounded-deer-pin wounded-deer-pin-draft" title="Point à confirmer" />
        </Marker>
      )}

      {reportingDeer && (
        <div className="deer-report-panel">
          {!draftDeerPoint ? (
            <p className="hint">
              Touchez la carte à l'endroit approximatif où l'animal a été blessé.
              {hunterPosition && ' Le point bleu indique votre position actuelle, à titre de repère.'}
            </p>
          ) : (
            <>
              <p className="hint">Confirmez l'emplacement, ou touchez à nouveau la carte pour l'ajuster.</p>
              <textarea
                className="field-report-note-input"
                placeholder="Note optionnelle (ex : zone broussailleuse près du grand chêne)"
                value={deerNote}
                onChange={(e) => setDeerNote(e.target.value)}
                maxLength={280}
                rows={2}
              />
              {deerActionError && <p className="field-report-error">{deerActionError}</p>}
              <div className="deer-report-panel-actions">
                <button type="button" className="action-button" onClick={handleConfirmDeerReport} disabled={deerSubmitting}>
                  {deerSubmitting ? 'Envoi…' : 'Confirmer'}
                </button>
                <button type="button" className="action-button" onClick={handleToggleReportingDeer} disabled={deerSubmitting}>
                  Annuler
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {selectedWoundedDeerReport && (
        <Popup
          longitude={selectedWoundedDeerReport.longitude}
          latitude={selectedWoundedDeerReport.latitude}
          anchor="top"
          onClose={() => setSelectedWoundedDeerReport(null)}
          closeOnClick={false}
        >
          <strong>{selectedWoundedDeerReport.foundAt ? 'Animal trouvé' : 'Animal blessé'}</strong>
          <p>
            Signalé à{' '}
            {selectedWoundedDeerReport.createdAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          {selectedWoundedDeerReport.foundAt && (
            <p>
              Trouvé à{' '}
              {selectedWoundedDeerReport.foundAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          {selectedWoundedDeerReport.note && <p>{selectedWoundedDeerReport.note}</p>}
          {deerActionError && <p className="field-report-error">{deerActionError}</p>}
          <div className="deer-report-panel-actions">
            {!selectedWoundedDeerReport.foundAt && (
              <button
                type="button"
                className="action-button"
                onClick={() => handleMarkDeerFound(selectedWoundedDeerReport.id)}
              >
                Trouvé
              </button>
            )}
            {(adminUnlocked || selectedWoundedDeerReport.reporterId === myReporterId) && (
              <button
                type="button"
                className="action-button"
                onClick={() => handleDeleteDeerReport(selectedWoundedDeerReport.id)}
              >
                Supprimer
              </button>
            )}
          </div>
        </Popup>
      )}

      {selectedLandmark && (
        <Popup
          longitude={selectedLandmark.longitude}
          latitude={selectedLandmark.latitude}
          anchor="top"
          onClose={() => {
            setSelectedLandmark(null)
            setOpenPopupPhotoIndex(null)
          }}
          closeOnClick={false}
        >
          <strong>
            {selectedLandmark.number !== null
              ? `Chute ${selectedLandmark.number}${selectedLandmark.name ? ` · ${selectedLandmark.name}` : ''}`
              : selectedLandmark.name}
          </strong>
          {selectedLandmark.needsReview && (
            <p className="landmark-review-note">Nom et numéro à confirmer avec le comité</p>
          )}
          {selectedLandmark.size && (
            <p className="landmark-size-tag">
              <span className={`landmark-size-dot landmark-size-dot-${selectedLandmark.size}`} />
              {selectedLandmark.size === 'large' ? 'Grand mirador' : 'Petit mirador'}
            </p>
          )}
          {selectedLandmark.photos.length === 0 && <p className="landmark-photos-pending">Photos à venir</p>}
          {selectedLandmark.photos.map((photo, i) => (
            <button
              key={i}
              className="photo-thumb-button"
              onClick={() => setOpenPopupPhotoIndex(i)}
              aria-label={`Voir la photo : ${photo.caption ?? selectedLandmark.name ?? `Chute ${selectedLandmark.number}`}`}
            >
              <img
                className="landmark-popup-photo"
                src={photo.thumb}
                alt={photo.caption ?? selectedLandmark.name ?? `Chute ${selectedLandmark.number}`}
                title={photo.caption}
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </Popup>
      )}

      {selectedLandmark && openPopupPhotoIndex !== null && (
        <PhotoLightbox
          photos={selectedLandmark.photos}
          initialIndex={openPopupPhotoIndex}
          onClose={() => setOpenPopupPhotoIndex(null)}
        />
      )}

      {measurePoints.map((p, i) => (
        <Marker key={i} longitude={p.lngLat[0]} latitude={p.lngLat[1]} anchor="center">
          <div className="measure-pin" />
        </Marker>
      ))}

      {measureIsClosedLoop && (
        <Source
          id="measure-area"
          type="geojson"
          data={{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [measurePathCoords],
            },
          }}
        >
          <Layer id="measure-area-fill" type="fill" paint={{ 'fill-color': '#ffdd57', 'fill-opacity': 0.15 }} />
        </Source>
      )}

      {measurePoints.length >= 2 && (
        <Source
          id="measure-line"
          type="geojson"
          data={{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: measurePathCoords,
            },
          }}
        >
          <Layer
            id="measure-line-layer"
            type="line"
            paint={{
              'line-color': '#ffdd57',
              'line-width': 3,
              'line-dasharray': [2, 1],
            }}
          />
        </Source>
      )}

      {currentTourLandmark && (
        <LandmarkTourCard
          landmark={currentTourLandmark}
          index={landmarkTourIndex!}
          total={chuteLandmarks.length}
          onNext={handleLandmarkTourNext}
          onPrevious={handleLandmarkTourPrevious}
          onExit={handleExitLandmarkTour}
        />
      )}

      <ControlsPanel
        landmarks={visibleLandmarks}
        onSelectLandmark={handleSelectLandmark}
        onUnlock={handleUnlock}
        adminUnlocked={adminUnlocked}
        onAdminUnlock={handleAdminUnlock}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        showChutes={showChutes}
        onToggleChutes={handleToggleChutes}
        showWindCones={showWindCones}
        onToggleWindCones={handleToggleWindCones}
        showDrawnMap={showDrawnMap}
        onToggleDrawnMap={handleToggleDrawnMap}
        showSitePois={showSitePois}
        onToggleSitePois={handleToggleSitePois}
        basemap={basemap}
        onBasemapChange={handleBasemapChange}
        tourRunning={tourRunning}
        chuteCount={chuteLandmarks.length}
        landmarkTourActive={landmarkTourIndex !== null}
        onStartLandmarkTour={handleStartLandmarkTour}
        onExitLandmarkTour={handleExitLandmarkTour}
        measureActive={measureActive}
        onToggleMeasure={handleToggleMeasure}
        measurePointCount={measurePoints.length}
        measureClosed={measureClosed}
        measureResult={measureResult}
        onClearMeasure={handleClearMeasure}
        onUndoMeasurePoint={handleUndoMeasurePoint}
        onCloseMeasureLoop={handleCloseMeasureLoop}
        showOverlay={showOverlay}
        onToggleOverlay={handleToggleOverlay}
        hoverElevation={hoverElevation}
        historicalYear={historicalYear}
        onHistoricalYearChange={handleHistoricalYearChange}
        imageryLoading={imageryLoading}
        weather={weather}
        weatherError={weatherError}
        slopeContrast={slopeContrast}
        onToggleSlopeContrast={handleToggleSlopeContrast}
      />
      {wolmarOnly && (
        <Suspense fallback={null}>
          <Isolate3DView
            onClose={handleToggleWolmarOnly}
            landmarks={visibleLandmarks}
            woundedDeerReports={woundedDeerReports}
            onSelectLandmark={handleSelectLandmark}
          />
        </Suspense>
      )}
    </Map>
  )
}
