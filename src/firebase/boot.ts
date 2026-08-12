import { captureSyncFromUrl } from './configStore'
import { startAutoSync, syncNow } from './sync'

export function startCloudSync() {
  captureSyncFromUrl()
  void startAutoSync()
  window.addEventListener('menachem-data-changed', () => {
    window.setTimeout(() => {
      void syncNow().catch(() => undefined)
    }, 1200)
  })
}
