const REPORTER_ID_STORAGE_KEY = 'ddw-reporter-id'

/**
 * A random id generated once per browser/device and reused for every report
 * it submits — not a real account, just enough to tell "a point I added"
 * from "a point someone else added" for the owner-only edit/delete controls
 * (see isAdminUnlocked in passcode.ts for the admin bypass). Lost if the
 * visitor clears site data; that's fine, it only affects who sees the
 * Supprimer/Trouvé controls on their own old points, nothing about the data.
 *
 * Deliberately has zero Firebase SDK imports (unlike fieldReports.ts) so
 * App.tsx can read "is this my point" synchronously without pulling in the
 * ~150kB-gzipped Firestore SDK just to render a pin's popup.
 */
export function getReporterId(): string {
  try {
    let id = localStorage.getItem(REPORTER_ID_STORAGE_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(REPORTER_ID_STORAGE_KEY, id)
    }
    return id
  } catch {
    return 'anonymous'
  }
}
