import React, { Suspense, lazy, useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// Code-split so each route only pays for what it needs: the leaderboard is a
// plain scoreboard with no map dependency, so it shouldn't have to download
// and parse the entire map bundle (MapLibre alone is >500kB) just to render,
// and the map shouldn't have to wait on leaderboard code it'll never use.
const App = lazy(() => import('./App'))
const LeaderboardPage = lazy(() => import('./LeaderboardPage'))

const fallback = <div style={{ position: 'fixed', inset: 0, background: '#14100c' }} />

function Root() {
  const [hash, setHash] = useState(() => window.location.hash)

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return <Suspense fallback={fallback}>{hash === '#/leaderboard' ? <LeaderboardPage /> : <App />}</Suspense>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
