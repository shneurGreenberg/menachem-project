import type { FirebaseWebConfig } from './types'

/** Client SDK keys are public by design. Access is gated by the sync code + Firestore rules. */
export const BUILTIN_FIREBASE_CONFIG: FirebaseWebConfig = {
  apiKey: 'AIzaSyD1IdH33gdw4UGowFltE-hK8gCX3LcoCEQ',
  authDomain: 'menachem-project.firebaseapp.com',
  projectId: 'menachem-project',
  storageBucket: 'menachem-project.firebasestorage.app',
  messagingSenderId: '764804168731',
  appId: '1:764804168731:web:d585d1784f17eb29950cbe',
}
