import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth'
import {
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Firestore,
} from 'firebase/firestore'
import { exportAllData, importAllData, TABLES } from '../utils/backup'
import {
  getStoredFirebaseConfig,
  getStoredSyncCode,
  spaceIdFromCode,
} from './configStore'
import { LAST_HASH_KEY, LAST_SYNC_KEY, type SyncStatus } from './types'

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let spaceId: string | null = null
let unsub: (() => void) | null = null
let applyingRemote = false
let timer: number | null = null
let listeners = new Set<(s: SyncStatus) => void>()
let status: SyncStatus = {
  state: 'idle',
  message: 'סנכרון לא פעיל',
}

function setStatus(next: SyncStatus) {
  status = next
  listeners.forEach((fn) => fn(status))
}

export function getSyncStatus(): SyncStatus {
  return status
}

export function subscribeSyncStatus(fn: (s: SyncStatus) => void) {
  listeners.add(fn)
  fn(status)
  return () => {
    listeners.delete(fn)
  }
}

function stripUndefined(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripUndefined)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue
      out[k] = stripUndefined(v)
    }
    return out
  }
  return value
}

async function ensureFirebase() {
  const config = getStoredFirebaseConfig()
  const code = getStoredSyncCode()
  if (!config || !code) {
    throw new Error('חסרים הגדרות Firebase או קוד סנכרון')
  }
  if (!getApps().length) {
    app = initializeApp(config)
  } else {
    app = getApps()[0]!
  }
  auth = getAuth(app)
  db = getFirestore(app)
  if (!auth.currentUser) {
    await signInAnonymously(auth)
  }
  spaceId = await spaceIdFromCode(code)
  return { db, spaceId }
}

function tableRef(firestore: Firestore, id: string, table: string) {
  return doc(firestore, 'spaces', id, 'tables', table)
}

function metaRef(firestore: Firestore, id: string) {
  return doc(firestore, 'spaces', id, 'data', 'meta')
}

async function localHash(json: string) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(json),
  )
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function pushLocalToCloud() {
  const { db: firestore, spaceId: id } = await ensureFirebase()
  const json = await exportAllData({ imagePolicy: 'auto', imageMaxChars: 80_000 })
  const parsed = JSON.parse(json) as { data?: Record<string, unknown[]> }
  const data = parsed.data ?? {}
  const updatedAt = new Date().toISOString()
  for (const [table, rows] of Object.entries(data)) {
    await setDoc(tableRef(firestore, id, table), {
      rows: stripUndefined(rows),
      updatedAt,
    })
  }
  await setDoc(metaRef(firestore, id), {
    version: 1,
    updatedAt,
    serverTime: serverTimestamp(),
  })
  const hash = await localHash(JSON.stringify(data))
  localStorage.setItem(LAST_HASH_KEY, hash)
  localStorage.setItem(LAST_SYNC_KEY, updatedAt)
}

export async function pullCloudToLocal() {
  const { db: firestore, spaceId: id } = await ensureFirebase()
  const meta = await getDoc(metaRef(firestore, id))
  if (!meta.exists()) return false
  const data: Record<string, unknown[]> = {}
  for (const table of TABLES) {
    const snap = await getDoc(tableRef(firestore, id, table))
    if (snap.exists()) {
      const rows = (snap.data() as { rows?: unknown[] }).rows
      data[table] = Array.isArray(rows) ? rows : []
    } else {
      data[table] = []
    }
  }
  applyingRemote = true
  try {
    await importAllData(JSON.stringify({ version: 1, data }))
    const hash = await localHash(JSON.stringify(data))
    localStorage.setItem(LAST_HASH_KEY, hash)
    localStorage.setItem(
      LAST_SYNC_KEY,
      String((meta.data() as { updatedAt?: string }).updatedAt ?? new Date().toISOString()),
    )
  } finally {
    applyingRemote = false
  }
  return true
}

export async function syncNow() {
  setStatus({ state: 'syncing', message: 'מסנכרן…', lastSyncedAt: status.lastSyncedAt })
  try {
    const { db: firestore, spaceId: id } = await ensureFirebase()
    const snap = await getDoc(metaRef(firestore, id))
    const localJson = await exportAllData({ imagePolicy: 'auto', imageMaxChars: 80_000 })
    const localParsed = JSON.parse(localJson) as { data?: Record<string, unknown[]> }
    const localData = localParsed.data ?? {}
    const localH = await localHash(JSON.stringify(localData))
    const lastH = localStorage.getItem(LAST_HASH_KEY)

    if (!snap.exists()) {
      await pushLocalToCloud()
      setStatus({
        state: 'ok',
        message: 'הועלה לענן בפעם הראשונה',
        lastSyncedAt: new Date().toISOString(),
      })
      return
    }

    // New device / first connect: take cloud as source of truth.
    if (!lastH) {
      await pullCloudToLocal()
      setStatus({
        state: 'ok',
        message: 'נטען מהענן למכשיר זה',
        lastSyncedAt: new Date().toISOString(),
      })
      return
    }

    const remoteUpdated = String((snap.data() as { updatedAt?: string }).updatedAt ?? '')
    if (lastH === localH && remoteUpdated && remoteUpdated !== localStorage.getItem(LAST_SYNC_KEY)) {
      await pullCloudToLocal()
      setStatus({
        state: 'ok',
        message: 'עודכן מהענן',
        lastSyncedAt: new Date().toISOString(),
      })
      return
    }

    if (localH !== lastH) {
      await pushLocalToCloud()
      setStatus({
        state: 'ok',
        message: 'נשמר בענן',
        lastSyncedAt: new Date().toISOString(),
      })
      return
    }

    setStatus({
      state: 'ok',
      message: 'מסונכרן',
      lastSyncedAt: localStorage.getItem(LAST_SYNC_KEY) ?? new Date().toISOString(),
    })
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'שגיאה בסנכרון'
    let message = raw
    if (raw.includes('auth/') || raw.includes('operation-not-allowed') || raw.includes('admin-restricted')) {
      message = 'יש להפעיל Anonymous ב-Authentication (Sign-in method)'
    } else if (raw.includes('permission-denied')) {
      message = 'Firestore Rules חוסמים כתיבה — פרסמו את firestore.rules'
    }
    setStatus({ state: 'error', message, lastSyncedAt: status.lastSyncedAt })
    throw err
  }
}

function listenRemote() {
  if (!db || !spaceId) return
  unsub?.()
  unsub = onSnapshot(metaRef(db, spaceId), async (snap) => {
    if (applyingRemote || !snap.exists()) return
    const remoteUpdated = String((snap.data() as { updatedAt?: string }).updatedAt ?? '')
    const last = localStorage.getItem(LAST_SYNC_KEY)
    if (remoteUpdated && remoteUpdated !== last) {
      try {
        await pullCloudToLocal()
        setStatus({
          state: 'ok',
          message: 'עודכן ממכשיר אחר',
          lastSyncedAt: new Date().toISOString(),
        })
      } catch (err) {
        setStatus({
          state: 'error',
          message: err instanceof Error ? err.message : 'שגיאה בעדכון מהענן',
        })
      }
    }
  })
}

let hooksAttached = false

export async function startAutoSync() {
  const code = getStoredSyncCode()
  const config = getStoredFirebaseConfig()
  if (!code || !config) {
    setStatus({ state: 'idle', message: 'סנכרון לא הוגדר עדיין' })
    return
  }
  if (!navigator.onLine) {
    setStatus({ state: 'offline', message: 'אין אינטרנט — עובד מקומית' })
    return
  }
  setStatus({ state: 'connecting', message: 'מתחבר לענן…' })
  try {
    await ensureFirebase()
    await syncNow()
    listenRemote()
    if (timer) window.clearInterval(timer)
    timer = window.setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        void syncNow().catch(() => undefined)
      }
    }, 20_000)
    if (!hooksAttached) {
      hooksAttached = true
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void syncNow().catch(() => undefined)
      })
      window.addEventListener('online', () => {
        void startAutoSync()
      })
    }
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err)
    let message = raw
    if (raw.includes('auth/') || raw.includes('operation-not-allowed') || raw.includes('admin-restricted')) {
      message = 'יש להפעיל Anonymous ב-Authentication (Sign-in method)'
    } else if (raw.includes('permission-denied')) {
      message = 'Firestore Rules חוסמים כתיבה — פרסמו את firestore.rules'
    }
    setStatus({
      state: 'error',
      message,
    })
  }
}

export function notifyLocalChange() {
  if (applyingRemote) return
  window.setTimeout(() => {
    void syncNow().catch(() => undefined)
  }, 800)
}
