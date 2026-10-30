import { initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)

// Proves requests come from this app, so the public API key alone can't be used to run up
// Gemini (AI Logic) or Storage costs. Enforcement is switched on in the Firebase console.
const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY
if (recaptchaKey && import.meta.env.VITE_EMULATORS !== 'true') {
  initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(recaptchaKey), isTokenAutoRefreshEnabled: true })
}

// Online-only: no offline cache, so what's on screen is always what the server has.
// While offline the app is covered by OfflineOverlay.
export const db = getFirestore(app)

export const auth = getAuth(app)

// Receipt photos
export const storage = getStorage(app)

// `npm run dev:local`: everything against local emulators, never the real project
if (import.meta.env.VITE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
}
