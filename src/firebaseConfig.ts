/**
 * Firebase project config for the live field-reporting features (wounded-deer
 * pins, and later the hunt line tracking) — see src/firebase.ts.
 *
 * This is NOT a secret. Firebase's web config only identifies which project
 * to talk to; it's meant to ship in client-side code (every Firebase web app
 * does this). Real protection comes from the Firestore security rules
 * (see firestore.rules at the repo root), not from hiding this object.
 *
 * To fill this in:
 * 1. https://console.firebase.google.com → Add project (free "Spark" plan
 *    is plenty for this).
 * 2. Build > Firestore Database > Create database (start in production
 *    mode — we provide our own rules, see firestore.rules).
 * 3. Project settings (gear icon) > General > "Your apps" > Add app > Web
 *    (</>) icon. Register it (any nickname), skip hosting.
 * 4. Copy the `firebaseConfig` object it shows you and paste its values in
 *    below.
 * 5. Firestore Database > Rules tab > paste in the contents of
 *    firestore.rules (repo root) > Publish.
 *
 * Until this is filled in, the live field-reporting features are disabled
 * (see isFirebaseConfigured in src/firebase.ts) — everything else on the
 * site works exactly as before.
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyB_PLdubOPGxfa9Nl49cJXPr4sq3jLaoU8',
  authDomain: 'domaine-de-wolmar.firebaseapp.com',
  projectId: 'domaine-de-wolmar',
  storageBucket: 'domaine-de-wolmar.firebasestorage.app',
  messagingSenderId: '767954521616',
  appId: '1:767954521616:web:57bf61581816424ec94495',
}

/**
 * True once the values above are filled in. Deliberately has zero Firebase
 * SDK imports (unlike firebase.ts) so checking "is this feature even on"
 * never pulls the ~150kB-gzipped Firestore SDK into a page that doesn't
 * need it — callers that just want this flag (e.g. App.tsx, to decide
 * whether to bother dynamically importing fieldReports.ts at all) should
 * import it from here, not from firebase.ts.
 */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
