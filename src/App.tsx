import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import 'maplibre-gl/dist/maplibre-gl.css'
import { pois, type Poi } from './poi'
import { mapStyle } from './mapStyle'
import { runTour } from './tour'
import { pathLengthMeters, polygonAreaSquareMeters } from './geo'
import { estateBoundary } from './boundary'
import { placeNames } from './placeNames'
import { isUnlocked } from './passcode'
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
import { buildShareUrl, parseShareStateFromUrl } from './shareState'
import { flyToEstate } from './cameraMotion'
import { computeDayNight } from './dayNight'
import { buildWindConeGeoJSON } from './windCone'
import { landmarks, landmarkCategoryColors, landmarkCategoryLabels, type Landmark } from './landmarks'
import ControlsPanel, { type SectionKey } from './ControlsPanel'
import LandmarkTourCard from './LandmarkTourCard'
import PhotoLightbox from './PhotoLightbox'
import OnboardingCard from './OnboardingCard'
import './App.css'

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
  const shareCopiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)
  const [slopeContrast, setSlopeContrast] = useState(false)
  const [basemap, setBasemap] = useState<BasemapStyle>(shared.basemap ?? readStoredBasemap() ?? 'satellite')
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null)
  const [openPopupPhotoIndex, setOpenPopupPhotoIndex] = useState<number | null>(null)
  const [landmarkTourIndex, setLandmarkTourIndex] = useState<number | null>(null)
  const [zoom, setZoom] = useState(Math.max(targetView.zoom - 3, 5))
  const [rotateHintExpired, setRotateHintExpired] = useState(false)
  const rotateHintTimerStarted = useRef(false)
  const rotateHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [renderedImageryUrl, setRenderedImageryUrl] = useState<string | null>(null)
  const imageryFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [unlocked, setUnlockedState] = useState(isUnlocked())
  const [showChutes, setShowChutes] = useState(true)
  const [showSpots, setShowSpots] = useState(true)
  const [showNames, setShowNames] = useState(true)
  const [showDrawnMap, setShowDrawnMap] = useState(false)
  const [showWindCones, setShowWindCones] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionKey>('weather')

  const chutesVisible = unlocked && showChutes

  const visibleLandmarks = useMemo(
    () => landmarks.filter((l) => (l.category === 'mirador' ? chutesVisible : showSpots)),
    [chutesVisible, showSpots],
  )

  const chuteLandmarks = useMemo(
    () =>
      chutesVisible
        ? landmarks.filter((l) => l.category === 'mirador').sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
        : [],
    [chutesVisible],
  )
  const currentTourLandmark = landmarkTourIndex !== null ? chuteLandmarks[landmarkTourIndex] : null

  const windConeGeoJSON = useMemo(() => {
    if (!showWindCones || !chutesVisible || chuteLandmarks.length === 0 || !weather) return null
    return buildWindConeGeoJSON(chuteLandmarks, weather.windDirectionDeg, weather.windSpeedKmh)
  }, [showWindCones, chutesVisible, chuteLandmarks, weather])

  const handleUnlock = useCallback(() => setUnlockedState(true), [])
  const handleToggleChutes = useCallback(() => setShowChutes((v) => !v), [])
  const handleToggleSpots = useCallback(() => setShowSpots((v) => !v), [])
  const handleToggleNames = useCallback(() => setShowNames((v) => !v), [])
  const handleToggleDrawnMap = useCallback(() => setShowDrawnMap((v) => !v), [])
  const handleToggleWindCones = useCallback(() => setShowWindCones((v) => !v), [])

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

  const handleToggleTour = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return

    if (tourRunning) {
      cancelledRef.current = true
      setTourRunning(false)
      return
    }

    setSelected(null)
    setMeasureActive(false)
    setLandmarkTourIndex(null)
    cancelledRef.current = false
    setTourRunning(true)
    runTour(map, cancelledRef).finally(() => setTourRunning(false))
  }, [tourRunning])

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
      if (!measureActive || measureClosed) return
      const map = e.target
      const elevation = map.queryTerrainElevation(e.lngLat)
      const point: MeasurePoint = { lngLat: [e.lngLat.lng, e.lngLat.lat], elevation }
      setMeasurePoints((prev) => [...prev, point])
    },
    [measureActive, measureClosed],
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

  const handleCaptureView = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    const canvas = map.getCanvas()
    const link = document.createElement('a')
    link.download = `wolmar-estate-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [])

  const handleGenerateShareLink = useCallback(() => {
    const map = mapRef.current?.getMap()
    const center = map ? map.getCenter() : { lng: ESTATE_CENTER.longitude, lat: ESTATE_CENTER.latitude }

    const url = buildShareUrl({
      longitude: center.lng,
      latitude: center.lat,
      zoom: map?.getZoom(),
      pitch: map?.getPitch(),
      bearing: map?.getBearing(),
      showOverlay,
      historicalYear,
      basemap,
    })

    setShareUrl(url)
    setShareCopied(false)
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setShareCopied(true)
        if (shareCopiedTimeoutRef.current) clearTimeout(shareCopiedTimeoutRef.current)
        shareCopiedTimeoutRef.current = setTimeout(() => setShareCopied(false), 2500)
      })
      .catch(() => {})
  }, [showOverlay, historicalYear, basemap])

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
      cursor={measureActive ? 'crosshair' : 'grab'}
    >
      <FullscreenControl position="top-right" />
      <NavigationControl position="top-right" visualizePitch />
      {zoom >= ROTATE_HINT_MIN_ZOOM && !rotateHintExpired && (
        <div className="rotate-hint">Cliquez et glissez pour incliner/pivoter</div>
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
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation()
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
          <div className="marker-pin" title={poi.name} />
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
              background: landmarkCategoryColors[landmark.category],
              opacity: landmarkPinOpacity(zoom),
              pointerEvents: landmarkPinOpacity(zoom) === 0 ? 'none' : undefined,
            }}
            title={landmark.name}
          >
            {landmark.number !== null && zoom >= LANDMARK_NUMBER_MIN_ZOOM && (
              <span className="landmark-pin-number">{landmark.number}</span>
            )}
          </div>
        </Marker>
      ))}

      {showNames &&
        placeNames
          .filter((p) => zoom >= p.minZoom)
          .map((place) => (
            <Marker key={place.id} longitude={place.longitude} latitude={place.latitude} anchor="center">
              <span className="place-name-label">{place.name}</span>
            </Marker>
          ))}

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
            {selectedLandmark.number !== null ? `Chute ${selectedLandmark.number} — ` : ''}
            {selectedLandmark.name}
          </strong>
          <p>{landmarkCategoryLabels[selectedLandmark.category]}</p>
          <p>{selectedLandmark.description}</p>
          {selectedLandmark.photos.map((photo, i) => (
            <button
              key={i}
              className="photo-thumb-button"
              onClick={() => setOpenPopupPhotoIndex(i)}
              aria-label={`Voir la photo : ${photo.caption ?? selectedLandmark.name}`}
            >
              <img
                className="landmark-popup-photo"
                src={photo.src}
                alt={photo.caption ?? selectedLandmark.name}
                title={photo.caption}
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
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        showChutes={showChutes}
        onToggleChutes={handleToggleChutes}
        showWindCones={showWindCones}
        onToggleWindCones={handleToggleWindCones}
        showSpots={showSpots}
        onToggleSpots={handleToggleSpots}
        showNames={showNames}
        onToggleNames={handleToggleNames}
        showDrawnMap={showDrawnMap}
        onToggleDrawnMap={handleToggleDrawnMap}
        basemap={basemap}
        onBasemapChange={handleBasemapChange}
        tourRunning={tourRunning}
        onToggleTour={handleToggleTour}
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
        weather={weather}
        weatherError={weatherError}
        onCaptureView={handleCaptureView}
        onGenerateShareLink={handleGenerateShareLink}
        shareUrl={shareUrl}
        shareCopied={shareCopied}
        slopeContrast={slopeContrast}
        onToggleSlopeContrast={handleToggleSlopeContrast}
      />
    </Map>
  )
}
