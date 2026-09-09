import React from 'react'
import ReactDOM from 'react-dom/client'
import { setWorkerUrl } from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import App from './App'
import './index.css'

// MapLibre GL JS ships its tile-parsing worker as a standalone file rather than
// inlining it; without this, the bundler never emits it and vector tiles never load.
setWorkerUrl(maplibreWorkerUrl)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
