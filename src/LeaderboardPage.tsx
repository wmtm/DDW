import { leaderboardEntries, leaderboardPendingNote, leaderboardSeason } from './leaderboard'
import PasscodeGate from './PasscodeGate'
import './App.css'
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
          ← Retour à la carte
        </a>

        <div className="leaderboard-hero">
          <span className="leaderboard-badge">Saison {leaderboardSeason}</span>
          <h1>Chassée de Wolmar</h1>
          <h2>Classement Gros Cerf</h2>
        </div>

        <PasscodeGate label="Ce classement est privé. Entrez le code pour voir les résultats.">
          {leaderboardPendingNote && (
            <div className="leaderboard-pending-note">{leaderboardPendingNote}</div>
          )}

          {ranked.length === 0 ? (
            <div className="leaderboard-empty">
              <p>Aucun résultat enregistré pour la saison {leaderboardSeason} pour le moment.</p>
              <span className="hint">Les résultats apparaîtront ici une fois les prises de la saison enregistrées.</span>
            </div>
          ) : (
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rang</th>
                  <th>Chasseur</th>
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
        </PasscodeGate>
      </div>
    </div>
  )
}
