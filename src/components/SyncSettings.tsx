import QRCode from 'qrcode'
import { Cloud, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { buildPersonalSyncUrl } from '../firebase/configStore'
import { getSyncStatus, startAutoSync, subscribeSyncStatus, syncNow } from '../firebase/sync'
import type { SyncStatus } from '../firebase/types'
import { Icon, ICON_SIZE_SM } from './icons'

export function SyncSettings() {
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus())
  const [qr, setQr] = useState('')

  useEffect(() => subscribeSyncStatus(setStatus), [])

  useEffect(() => {
    const url = buildPersonalSyncUrl()
    void QRCode.toDataURL(url, {
      width: 240,
      margin: 1,
      color: { dark: '#1f2a24', light: '#fffdf8' },
    }).then(setQr)
  }, [status.state])

  useEffect(() => {
    void startAutoSync()
  }, [])

  return (
    <section className="panel">
      <h2>
        <Icon icon={Cloud} size={20} /> סנכרון
      </h2>
      <p className="meta">
        {status.message}
        {status.lastSyncedAt
          ? ` · ${new Date(status.lastSyncedAt).toLocaleString('he-IL')}`
          : ''}
      </p>
      <div className="sync-qr-wrap">
        {qr ? (
          <img className="sync-qr" src={qr} alt="ברקוד לפתיחה בטלפון" />
        ) : (
          <div className="muted">טוען ברקוד…</div>
        )}
        <p className="meta">סריקה מהטלפון</p>
      </div>
      <div className="actions">
        <button
          type="button"
          className="btn secondary"
          onClick={() => void syncNow().catch(() => undefined)}
        >
          <Icon icon={RefreshCw} size={ICON_SIZE_SM} />
          סנכרן עכשיו
        </button>
      </div>
    </section>
  )
}
