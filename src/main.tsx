import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { setWorkerUrl } from 'maplibre-gl'
import App from './App'
import LeaderboardPage from './LeaderboardPage'
import './index.css'

// MapLibre GL JS ships its tile-parsing worker as standalone files
// (maplibre-gl-worker.mjs + maplibre-gl-shared.mjs, copied into public/ by
// scripts/copy-maplibre-worker.mjs) rather than inlining them; without this,
// vector tiles never load even though raster tiles still work.
setWorkerUrl(`${import.meta.env.BASE_URL}maplibre-gl-worker.mjs`)

function Root() {
  const [hash, setHash] = useState(() => window.location.hash)

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return hash === '#/leaderboard' ? <LeaderboardPage /> : <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
