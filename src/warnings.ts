import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { getDb } from './firebase'
import { getReporterId } from './reporterId'

/** How long a resolved warning stays visible (greyed out) before it drops out of the live view — gives people a window to see it was handled. Unresolved warnings have no expiry; something unusual on the site stays flagged until someone actually marks it resolved or deletes it. */
export const RESOLVED_WARNING_VISIBLE_HOURS = 24

export interface Warning {
  id: string
  latitude: number
  longitude: number
  note: string | null
  reporterId: string
  createdAt: Date
  /** Set once someone marks the warning resolved — also the display color trigger (amber -> grey) and start of its fade-out window. */
  resolvedAt: Date | null
}

export interface WarningComment {
  id: string
  text: string
  authorId: string
  createdAt: Date
}

const COLLECTION = 'warnings'

/** Written the moment someone confirms a point on the map for anything unusual worth flagging. */
export async function reportWarning(latitude: number, longitude: number, note?: string): Promise<void> {
  await addDoc(collection(getDb(), COLLECTION), {
    latitude,
    longitude,
    note: note?.trim() || null,
    reporterId: getReporterId(),
    createdAt: Timestamp.now(),
    resolvedAt: null,
  })
}

/** Marks a warning resolved — flips its pin from amber to grey and starts its fade-out window. */
export async function resolveWarning(id: string): Promise<void> {
  await updateDoc(doc(getDb(), COLLECTION, id), { resolvedAt: Timestamp.now() })
}

/** Removes a warning outright. The UI only shows this to whoever placed it or to admin — see reporterId.ts / passcode.ts. */
export async function deleteWarning(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), COLLECTION, id))
}

/**
 * Live-subscribes to every warning, filtered to the ones still worth
 * showing: unresolved, or resolved within the last RESOLVED_WARNING_VISIBLE_HOURS.
 * No server-side where/orderBy on purpose — this collection stays small, and
 * filtering client-side avoids needing a Firestore composite index.
 */
export function subscribeActiveWarnings(callback: (warnings: Warning[]) => void): Unsubscribe {
  return onSnapshot(collection(getDb(), COLLECTION), (snapshot) => {
    const now = Date.now()
    const warnings = snapshot.docs
      .map((d) => {
        const data = d.data()
        return {
          id: d.id,
          latitude: data.latitude as number,
          longitude: data.longitude as number,
          note: (data.note as string | null) ?? null,
          reporterId: (data.reporterId as string | undefined) ?? '',
          createdAt: (data.createdAt as Timestamp).toDate(),
          resolvedAt: data.resolvedAt ? (data.resolvedAt as Timestamp).toDate() : null,
        }
      })
      .filter((w) => !w.resolvedAt || now - w.resolvedAt.getTime() < RESOLVED_WARNING_VISIBLE_HOURS * 60 * 60 * 1000)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    callback(warnings)
  })
}

/** Adds one entry to a warning's comment log — the "review/explain/say something" thread. */
export async function addWarningComment(warningId: string, text: string): Promise<void> {
  const trimmed = text.trim()
  if (!trimmed) return
  await addDoc(collection(getDb(), COLLECTION, warningId, 'comments'), {
    text: trimmed,
    authorId: getReporterId(),
    createdAt: Timestamp.now(),
  })
}

/** Live-subscribes to one warning's comment thread, oldest first — only call this for a warning whose popup is actually open, not for every pin on the map. */
export function subscribeWarningComments(warningId: string, callback: (comments: WarningComment[]) => void): Unsubscribe {
  const q = query(collection(getDb(), COLLECTION, warningId, 'comments'), orderBy('createdAt', 'asc'))
  return onSnapshot(q, (snapshot) => {
    callback(
      snapshot.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          text: data.text as string,
          authorId: (data.authorId as string | undefined) ?? '',
          createdAt: (data.createdAt as Timestamp).toDate(),
        }
      }),
    )
  })
}
