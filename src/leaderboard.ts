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

export const leaderboardEntries: LeaderboardEntry[] = []
