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

/** How long an animal-report pin stays visible on the map after it's reported, unless removed sooner by the reporter or an admin. */
export const WOUNDED_DEER_VISIBLE_HOURS = 24

export interface WoundedDeerReport {
  id: string
  latitude: number
  longitude: number
  note: string | null
  reporterId: string
  createdAt: Date
  expiresAt: Date
  /** Set once someone marks the animal found/recovered — also the display color trigger (black -> green). */
  foundAt: Date | null
}

export interface WoundedDeerComment {
  id: string
  text: string
  authorId: string
  createdAt: Date
}

const COLLECTION = 'woundedDeer'

/** Written the moment someone confirms a point on the map for an animal they've just wounded. */
export async function reportWoundedDeer(latitude: number, longitude: number, note?: string): Promise<void> {
  const now = Timestamp.now()
  const expiresAt = Timestamp.fromMillis(now.toMillis() + WOUNDED_DEER_VISIBLE_HOURS * 60 * 60 * 1000)
  await addDoc(collection(getDb(), COLLECTION), {
    latitude,
    longitude,
    note: note?.trim() || null,
    reporterId: getReporterId(),
    createdAt: now,
    expiresAt,
    foundAt: null,
  })
}

/** Marks a report as found/recovered — this is what flips its pin from black to green, with the time logged. */
export async function markWoundedDeerFound(id: string): Promise<void> {
  await updateDoc(doc(getDb(), COLLECTION, id), { foundAt: Timestamp.now() })
}

/**
 * Removes a report outright. The UI only shows this to whoever placed the
 * point (matched by reporterId) or to admin (see isAdminUnlocked) — but
 * like the rest of this app's privacy model, that's enforced in the UI,
 * not by the security rules, since there's no real login to check against.
 */
export async function deleteWoundedDeerReport(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), COLLECTION, id))
}

/**
 * Live-subscribes to every animal report, already filtered to the still-
 * active ones (expiresAt in the future) and newest first. No server-side
 * where/orderBy on purpose — the collection stays tiny (a handful of
 * reports per hunt), and filtering client-side avoids needing a Firestore
 * composite index set up before this works.
 */
export function subscribeActiveWoundedDeerReports(callback: (reports: WoundedDeerReport[]) => void): Unsubscribe {
  return onSnapshot(collection(getDb(), COLLECTION), (snapshot) => {
    const now = Date.now()
    const reports = snapshot.docs
      .map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          latitude: data.latitude as number,
          longitude: data.longitude as number,
          note: (data.note as string | null) ?? null,
          reporterId: (data.reporterId as string | undefined) ?? '',
          createdAt: (data.createdAt as Timestamp).toDate(),
          expiresAt: (data.expiresAt as Timestamp).toDate(),
          foundAt: data.foundAt ? (data.foundAt as Timestamp).toDate() : null,
        }
      })
      .filter((r) => r.expiresAt.getTime() > now)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    callback(reports)
  })
}

/** Adds one entry to a report's comment log — same "review/explain/say something" thread as warnings. */
export async function addWoundedDeerComment(reportId: string, text: string): Promise<void> {
  const trimmed = text.trim()
  if (!trimmed) return
  await addDoc(collection(getDb(), COLLECTION, reportId, 'comments'), {
    text: trimmed,
    authorId: getReporterId(),
    createdAt: Timestamp.now(),
  })
}

/** Live-subscribes to one report's comment thread, oldest first — only call this for a report whose popup is actually open, not for every pin on the map. */
export function subscribeWoundedDeerComments(
  reportId: string,
  callback: (comments: WoundedDeerComment[]) => void,
): Unsubscribe {
  const q = query(collection(getDb(), COLLECTION, reportId, 'comments'), orderBy('createdAt', 'asc'))
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
