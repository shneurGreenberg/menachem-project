export type FirebaseWebConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

export type SyncStatus = {
  state: 'idle' | 'offline' | 'connecting' | 'syncing' | 'ok' | 'error'
  message: string
  lastSyncedAt?: string
}

export const SYNC_CODE_KEY = 'menachem-sync-code'
export const FIREBASE_CONFIG_KEY = 'menachem-firebase-config'
export const LAST_SYNC_KEY = 'menachem-last-sync'
export const LAST_HASH_KEY = 'menachem-last-sync-hash'
export const SUGGESTED_SYNC_CODE = 'MENACHEM-5776'
