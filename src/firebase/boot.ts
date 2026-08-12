import { dbReady } from '../db'
import { captureSyncFromUrl } from './configStore'
import { startAutoSync, syncNow } from './sync'

export function startCloudSync() {
  captureSyncFromUrl()
  let timer: number | null = null
  window.addEventListener('menachem-data-changed', () => {
    if (timer) window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      void syncNow().catch(() => undefined)
    }, 1500)
  })
  void Promise.resolve(dbReady).then(() => startAutoSync())
}
