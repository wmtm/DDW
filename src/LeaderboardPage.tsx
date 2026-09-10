import { leaderboardEntries, leaderboardPendingNote, leaderboardSeason } from './leaderboard'
import './Leaderboard.css'

export default function LeaderboardPage() {
  const ranked = [...leaderboardEntries].sort((a, b) => {
    if (b.gc !== a.gc) return b.gc - a.gc
    return a.hunterName.localeCompare(b.hunterName)
  })

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-card">
        <a className="leaderboard-back" href="#/">
          ← Back to map
        </a>

        <div className="leaderboard-hero">
          <span className="leaderboard-badge">{leaderboardSeason} Season</span>
          <h1>Chassée de Wolmar</h1>
          <h2>Gros Cerf Leaderboard</h2>
        </div>

        {leaderboardPendingNote && <div className="leaderboard-pending-note">{leaderboardPendingNote}</div>}

        {ranked.length === 0 ? (
          <div className="leaderboard-empty">
            <p>No results recorded yet for the {leaderboardSeason} season.</p>
            <span className="hint">Results will appear here once the season's kills are logged.</span>
          </div>
        ) : (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Hunter</th>
                <th>GC</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((entry, i) => (
                <tr key={entry.id} className={i === 0 ? 'leaderboard-row-first' : undefined}>
                  <td>{i + 1}</td>
                  <td>{entry.hunterName}</td>
                  <td>{entry.gc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
