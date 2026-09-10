/**
 * Lightweight client-side gate for casual privacy on sensitive pages
 * (chutes, leaderboard) — not real security, just keeps the info from
 * showing to anyone who opens the link without the code.
 */
const UNLOCK_STORAGE_KEY = 'ddw-unlocked'
export const PASSCODE = '1234'

export function isUnlocked(): boolean {
  try {
    return localStorage.getItem(UNLOCK_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setUnlocked(): void {
  try {
    localStorage.setItem(UNLOCK_STORAGE_KEY, '1')
  } catch {
    // ignore (private browsing / storage disabled)
  }
}
