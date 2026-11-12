import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig'

export { isFirebaseConfigured }

let app: FirebaseApp | null = null
let db: Firestore | null = null

/** Lazily initialized so an unconfigured project never touches the Firebase SDK at all. */
export function getDb(): Firestore {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured yet — fill in src/firebaseConfig.ts first.')
  }
  if (!app) app = initializeApp(firebaseConfig)
  if (!db) db = getFirestore(app)
  return db
}
