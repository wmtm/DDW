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

/**
 * A second, separate code for admin actions (editing/removing an
 * animal-report point someone else added). There's no real per-person
 * login anywhere in this app, so this can't be enforced server-side any
 * more than the main passcode is — it just reveals the admin controls in
 * the UI to whoever knows it. Share it only with whoever should have that
 * power (e.g. the person coordinating at the kiosk).
 */
const ADMIN_UNLOCK_STORAGE_KEY = 'ddw-admin-unlocked'
export const ADMIN_PASSCODE = '4242'

export function isAdminUnlocked(): boolean {
  try {
    return localStorage.getItem(ADMIN_UNLOCK_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setAdminUnlocked(): void {
  try {
    localStorage.setItem(ADMIN_UNLOCK_STORAGE_KEY, '1')
  } catch {
    // ignore (private browsing / storage disabled)
  }
}
