import { BUILTIN_FIREBASE_CONFIG } from './builtinConfig'
import type { FirebaseWebConfig } from './types'
import { FIREBASE_CONFIG_KEY, SYNC_CODE_KEY } from './types'

export function parseFirebaseConfig(raw: string): FirebaseWebConfig {
  const text = raw.trim()
  if (!text) throw new Error('הדבק את ה-firebaseConfig')

  const pick = (key: string) => {
    const quoted = text.match(new RegExp(`${key}\\s*:\\s*['"]([^'"]+)['"]`))
    if (quoted?.[1]) return quoted[1]
    try {
      const jsonish = text.match(/\{[\s\S]*\}/)?.[0]
      if (!jsonish) return ''
      const parsed = JSON.parse(jsonish) as Record<string, unknown>
      return String(parsed[key] ?? '')
    } catch {
      return ''
    }
  }

  const config: FirebaseWebConfig = {
    apiKey: pick('apiKey'),
    authDomain: pick('authDomain'),
    projectId: pick('projectId'),
    storageBucket: pick('storageBucket'),
    messagingSenderId: pick('messagingSenderId'),
    appId: pick('appId'),
  }
  if (!config.apiKey || !config.projectId || !config.appId) {
    throw new Error('חסרים apiKey / projectId / appId')
  }
  return config
}

export function getStoredFirebaseConfig(): FirebaseWebConfig | null {
  const envConfig = envFirebaseConfig()
  if (envConfig) return envConfig
  try {
    const raw = localStorage.getItem(FIREBASE_CONFIG_KEY)
    if (raw) return JSON.parse(raw) as FirebaseWebConfig
  } catch {
    /* ignore */
  }
  return BUILTIN_FIREBASE_CONFIG
}

export function saveFirebaseConfig(config: FirebaseWebConfig) {
  localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config))
}

function envFirebaseConfig(): FirebaseWebConfig | null {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined
  const appId = import.meta.env.VITE_FIREBASE_APP_ID as string | undefined
  if (!apiKey || !projectId || !appId) return null
  return {
    apiKey,
    authDomain:
      (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined) ||
      `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket:
      (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined) ||
      `${projectId}.appspot.com`,
    messagingSenderId: String(
      import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    ),
    appId,
  }
}

export function generateSyncCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `MENACHEM-${hex.toUpperCase()}`
}

export function getStoredSyncCode(): string | null {
  return localStorage.getItem(SYNC_CODE_KEY)
}

export function saveSyncCode(code: string) {
  localStorage.setItem(SYNC_CODE_KEY, code.trim())
}

export function ensureSyncCode(): string {
  const existing = getStoredSyncCode()
  if (existing) return existing
  const code = generateSyncCode()
  saveSyncCode(code)
  return code
}

export async function spaceIdFromCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code.trim())
  const hash = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function decodeCfg(raw: string): FirebaseWebConfig | null {
  try {
    const padded = raw.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(escape(atob(padded)))
    return parseFirebaseConfig(json)
  } catch {
    return null
  }
}

export function captureSyncFromUrl() {
  const url = new URL(window.location.href)
  const sync =
    url.searchParams.get('sync') ||
    new URLSearchParams(url.hash.replace(/^#/, '')).get('sync')
  const cfgParam =
    url.searchParams.get('cfg') ||
    new URLSearchParams(url.hash.replace(/^#/, '')).get('cfg')

  if (sync) saveSyncCode(sync)
  else ensureSyncCode()
  if (cfgParam) {
    const cfg = decodeCfg(cfgParam)
    if (cfg) saveFirebaseConfig(cfg)
  }
}

export function buildPersonalSyncUrl(): string {
  const code = ensureSyncCode()
  const base = `${window.location.origin}${import.meta.env.BASE_URL}`
  const params = new URLSearchParams()
  params.set('sync', code)
  return `${base}?${params.toString()}`
}

export function hasSyncSetup(): boolean {
  return Boolean(getStoredFirebaseConfig() && getStoredSyncCode())
}
