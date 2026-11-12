import {
  addDoc,
  collection,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { getDb } from './firebase'

/** How long a wounded-deer pin stays visible on the map after it's reported. */
export const WOUNDED_DEER_VISIBLE_HOURS = 4

export interface WoundedDeerReport {
  id: string
  latitude: number
  longitude: number
  note: string | null
  createdAt: Date
  expiresAt: Date
}

const COLLECTION = 'woundedDeer'

/** Written from the field page the moment a hunter taps to report a hit. */
export async function reportWoundedDeer(latitude: number, longitude: number, note?: string): Promise<void> {
  const now = Timestamp.now()
  const expiresAt = Timestamp.fromMillis(now.toMillis() + WOUNDED_DEER_VISIBLE_HOURS * 60 * 60 * 1000)
  await addDoc(collection(getDb(), COLLECTION), {
    latitude,
    longitude,
    note: note?.trim() || null,
    createdAt: now,
    expiresAt,
  })
}

/**
 * Live-subscribes to every wounded-deer report, already filtered to the
 * still-active ones (expiresAt in the future) and newest first. No
 * server-side where/orderBy on purpose — the collection stays tiny (a
 * handful of reports per hunt), and filtering client-side avoids needing a
 * Firestore composite index set up before this works.
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
          createdAt: (data.createdAt as Timestamp).toDate(),
          expiresAt: (data.expiresAt as Timestamp).toDate(),
        }
      })
      .filter((r) => r.expiresAt.getTime() > now)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    callback(reports)
  })
}
