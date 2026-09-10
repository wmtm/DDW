/**
 * 2026 hunting season leaderboard, ranked by GC (number of Gros Cerf killed
 * per hunter). Data comes from the season's per-hunt-date log; add/update
 * entries here after each hunt is recorded.
 */
export interface LeaderboardEntry {
  id: string
  hunterName: string
  gc: number
}

export const leaderboardSeason = '2026'

export const leaderboardPendingNote = 'Results for the 3 September 2026 hunt are not yet recorded.'

export const leaderboardEntries: LeaderboardEntry[] = [
  { id: 'bertrand-closel', hunterName: 'Bertrand Closel', gc: 1 },
  { id: 'j-edgar-bega', hunterName: 'J. Edgar Bega', gc: 1 },
  { id: 'j-raymond-hardy', hunterName: 'J. Raymond Hardy', gc: 1 },
  { id: 'julien-harel-j-philip-rae', hunterName: 'Julien Harel / J. Philip Rae', gc: 1 },
  { id: 'julien-rey', hunterName: 'Julien Rey', gc: 1 },
  { id: 'jean-luc-fayolle', hunterName: 'Jean Luc Fayolle', gc: 1 },
  { id: 'roland-faydherbe', hunterName: "Roland Fayd'herbe", gc: 1 },
  { id: 'yan-bradshaw', hunterName: 'Yan Bradshaw', gc: 1 },
  { id: 'cyril-de-maroussem', hunterName: 'Cyril de Maroussem', gc: 1 },
  { id: 'bernard-leclezio', hunterName: 'Bernard Leclézio', gc: 1 },
  { id: 'sebastien-mouriot', hunterName: 'Sébastien Mouriot', gc: 1 },
  { id: 'daniel-maigrot', hunterName: 'Daniel Maigrot', gc: 1 },
  { id: 'william-de-robillard', hunterName: 'William de Robillard', gc: 1 },
  { id: 'gregoire-leclezio', hunterName: 'Grégoire Leclézio', gc: 1 },
]
