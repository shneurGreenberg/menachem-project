import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Firestore,
} from 'firebase/firestore'
import { beginSilentWrites, db as localDb, endSilentWrites } from '../db'
import { exportAllData, importAllData, TABLES } from '../utils/backup'
import {
  getStoredFirebaseConfig,
  getStoredSyncCode,
  spaceIdFromCode,
} from './configStore'
import { LAST_HASH_KEY, LAST_SYNC_KEY, type SyncStatus } from './types'

let app: FirebaseApp | null = null
let firestoreDb: Firestore | null = null
let spaceId: string | null = null
let unsub: (() => void) | null = null
let applyingRemote = false
let inflight: Promise<void> | null = null
let pendingSync = false
let hooksAttached = false
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
  firestoreDb = getFirestore(app)
  spaceId = await spaceIdFromCode(code)
  return { db: firestoreDb, spaceId }
}

function tableRef(firestore: Firestore, id: string, table: string) {
  return doc(firestore, 'spaces', id, 'tables', table)
}

function metaRef(firestore: Firestore, id: string) {
  return doc(firestore, 'spaces', id, 'data', 'meta')
}

function imageRef(firestore: Firestore, id: string, contactId: number) {
  return doc(firestore, 'spaces', id, 'images', `contact-${contactId}`)
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

async function pushContactImages(
  firestore: Firestore,
  id: string,
  contacts: Array<{ id?: number; imageDataUrl?: string }>,
) {
  for (const c of contacts) {
    if (c.id == null) continue
    const ref = imageRef(firestore, id, c.id)
    if (c.imageDataUrl) {
      await setDoc(ref, {
        imageDataUrl: c.imageDataUrl,
        updatedAt: new Date().toISOString(),
      })
    } else {
      await deleteDoc(ref).catch(() => undefined)
    }
  }
}

async function pullContactImages(
  firestore: Firestore,
  id: string,
  contacts: Array<Record<string, unknown> & { id?: number }>,
) {
  const out = []
  for (const c of contacts) {
    if (c.id == null) {
      out.push(c)
      continue
    }
    const snap = await getDoc(imageRef(firestore, id, c.id))
    if (snap.exists()) {
      const imageDataUrl = (snap.data() as { imageDataUrl?: string }).imageDataUrl
      out.push({ ...c, imageDataUrl: imageDataUrl || c.imageDataUrl })
    } else {
      out.push(c)
    }
  }
  return out
}

export async function pushLocalToCloud() {
  if (applyingRemote) return
  const { db: firestore, spaceId: id } = await ensureFirebase()
  const json = await exportAllData({ imagePolicy: 'exclude' })
  const parsed = JSON.parse(json) as { data?: Record<string, unknown[]> }
  const data = parsed.data ?? {}
  const updatedAt = new Date().toISOString()
  for (const [table, rows] of Object.entries(data)) {
    await setDoc(tableRef(firestore, id, table), {
      rows: stripUndefined(rows),
      updatedAt,
    })
  }
  const contacts = (await localDb.contacts.toArray()) as Array<{
    id?: number
    imageDataUrl?: string
  }>
  await pushContactImages(firestore, id, contacts)
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
  const contacts = (data.contacts ?? []) as Array<Record<string, unknown> & { id?: number }>
  data.contacts = await pullContactImages(firestore, id, contacts)

  applyingRemote = true
  beginSilentWrites()
  try {
    await importAllData(JSON.stringify({ version: 1, data }), { merge: true })
    const hash = await localHash(JSON.stringify(data))
    localStorage.setItem(LAST_HASH_KEY, hash)
    localStorage.setItem(
      LAST_SYNC_KEY,
      String((meta.data() as { updatedAt?: string }).updatedAt ?? new Date().toISOString()),
    )
  } finally {
    endSilentWrites()
    applyingRemote = false
  }
  return true
}

async function doSync() {
  if (applyingRemote) return
  setStatus({ state: 'syncing', message: 'מסנכרן…', lastSyncedAt: status.lastSyncedAt })
  try {
    const { db: firestore, spaceId: id } = await ensureFirebase()
    const snap = await getDoc(metaRef(firestore, id))
    const localJson = await exportAllData({ imagePolicy: 'exclude' })
    const localParsed = JSON.parse(localJson) as { data?: Record<string, unknown[]> }
    const localData = localParsed.data ?? {}
    const localH = await localHash(JSON.stringify(localData))
    const lastH = localStorage.getItem(LAST_HASH_KEY)
    const lastSync = localStorage.getItem(LAST_SYNC_KEY)
    const remoteUpdated = snap.exists()
      ? String((snap.data() as { updatedAt?: string }).updatedAt ?? '')
      : ''
    const remoteChanged = Boolean(remoteUpdated && remoteUpdated !== lastSync)
    const localChanged = Boolean(lastH && localH !== lastH)

    if (!snap.exists()) {
      await pushLocalToCloud()
      setStatus({
        state: 'ok',
        message: 'הועלה לענן בפעם הראשונה',
        lastSyncedAt: new Date().toISOString(),
      })
      return
    }

    if (!lastH) {
      await pullCloudToLocal()
      const after = await exportAllData({ imagePolicy: 'exclude' })
      const afterData = (JSON.parse(after) as { data?: Record<string, unknown[]> }).data ?? {}
      const afterH = await localHash(JSON.stringify(afterData))
      if (afterH !== localH) {
        await pushLocalToCloud()
      }
      setStatus({
        state: 'ok',
        message: 'סונכרן עם הענן',
        lastSyncedAt: new Date().toISOString(),
      })
      return
    }

    if (localChanged && remoteChanged) {
      await pullCloudToLocal()
      await pushLocalToCloud()
      setStatus({
        state: 'ok',
        message: 'מוזג בין המכשירים',
        lastSyncedAt: new Date().toISOString(),
      })
      return
    }

    if (localChanged) {
      await pushLocalToCloud()
      setStatus({
        state: 'ok',
        message: 'נשמר בענן',
        lastSyncedAt: new Date().toISOString(),
      })
      return
    }

    if (remoteChanged) {
      await pullCloudToLocal()
      setStatus({
        state: 'ok',
        message: 'עודכן מהענן',
        lastSyncedAt: new Date().toISOString(),
      })
      return
    }

    setStatus({
      state: 'ok',
      message: 'מסונכרן',
      lastSyncedAt: lastSync ?? new Date().toISOString(),
    })
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'שגיאה בסנכרון'
    let message = raw
    if (raw.includes('permission-denied')) {
      message = 'אין הרשאה לענן — בדקו את כללי Firestore'
    }
    setStatus({ state: 'error', message, lastSyncedAt: status.lastSyncedAt })
    throw err
  }
}

export async function syncNow() {
  if (applyingRemote) return
  if (inflight) {
    pendingSync = true
    return inflight
  }
  inflight = doSync()
    .catch(() => undefined)
    .finally(() => {
      inflight = null
      if (pendingSync) {
        pendingSync = false
        void syncNow()
      }
    })
  return inflight
}

function listenRemote() {
  if (!firestoreDb || !spaceId) return
  unsub?.()
  unsub = onSnapshot(metaRef(firestoreDb, spaceId), async (snap) => {
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
    if (raw.includes('permission-denied')) {
      message = 'אין הרשאה לענן — בדקו את כללי Firestore'
    }
    setStatus({
      state: 'error',
      message,
    })
  }
}
