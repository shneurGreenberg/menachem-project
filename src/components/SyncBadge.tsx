import { Cloud, CloudOff, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getSyncStatus, subscribeSyncStatus, syncNow } from '../firebase/sync'
import type { SyncStatus } from '../firebase/types'
import { Icon, ICON_SIZE_SM } from './icons'

export function SyncBadge() {
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus())

  useEffect(() => subscribeSyncStatus(setStatus), [])

  const spinning = status.state === 'syncing' || status.state === 'connecting'
  const icon = spinning ? Loader2 : status.state === 'ok' ? Cloud : CloudOff
  const label =
    status.state === 'ok'
      ? 'מסונכרן'
      : status.state === 'error'
        ? 'שגיאת ענן'
        : status.state === 'idle'
          ? 'ענן'
          : 'סנכרון'

  return (
    <button
      type="button"
      className={`sync-badge ${status.state}`}
      title={status.message}
      aria-label={`סנכרון: ${status.message}`}
      onClick={() => void syncNow().catch(() => undefined)}
    >
      <Icon icon={icon} size={ICON_SIZE_SM} className={spinning ? 'spin' : undefined} />
      <span>{label}</span>
    </button>
  )
}
