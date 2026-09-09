/**
 * 2026 hunting season leaderboard, ranked by GC (number of Gros Cerf killed
 * per hunter). Data comes from an Excel export; add/update entries here
 * after each export.
 */
export interface LeaderboardEntry {
  id: string
  hunterName: string
  gc: number
}

export const leaderboardSeason = '2026'

export const leaderboardEntries: LeaderboardEntry[] = [
  { id: 'herbert-de-robillard', hunterName: 'Herbert de Robillard', gc: 2 },
  { id: 'florian-maigrot', hunterName: 'Florian Maigrot (Didier Maigrot)', gc: 1 },
  { id: 'j-edgar-bega', hunterName: 'J. Edgar Bega', gc: 1 },
  { id: 'j-raymond-hardy', hunterName: 'J. Raymond Hardy', gc: 1 },
  { id: 'julien-harel-j-philip-rae', hunterName: 'Julien Harel / J. Philip Rae', gc: 1 },
  { id: 'julien-rey', hunterName: 'Julien Rey', gc: 1 },
  { id: 'roland-faydherbe', hunterName: "Roland Fayd'herbe", gc: 1 },
  { id: 'yan-bradshaw', hunterName: 'Yan Bradshaw', gc: 1 },
  { id: 'cyril-de-maroussem', hunterName: 'Cyril de Maroussem', gc: 1 },
  { id: 'patrick-quentin-de-maroussem', hunterName: 'Patrick / Quentin de Maroussem', gc: 1 },
  { id: 'sebastien-mouriot', hunterName: 'Sébastien Mouriot', gc: 1 },
  { id: 'didier-maigrot', hunterName: 'Didier Maigrot', gc: 1 },
]
