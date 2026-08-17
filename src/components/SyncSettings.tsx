import QRCode from 'qrcode'
import { Cloud, Copy, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  buildPersonalSyncUrl,
  ensureSyncCode,
  getStoredSyncCode,
  saveSyncCode,
} from '../firebase/configStore'
import { getSyncStatus, restartSync, subscribeSyncStatus, syncNow } from '../firebase/sync'
import type { SyncStatus } from '../firebase/types'
import { Icon, ICON_SIZE_SM } from './icons'

export function SyncSettings() {
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus())
  const [qr, setQr] = useState('')
  const [code, setCode] = useState(() => ensureSyncCode())
  const [joinCode, setJoinCode] = useState('')
  const [copied, setCopied] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => subscribeSyncStatus(setStatus), [])

  useEffect(() => {
    const url = buildPersonalSyncUrl()
    void QRCode.toDataURL(url, {
      width: 240,
      margin: 1,
      color: { dark: '#1f2a24', light: '#fffdf8' },
    }).then(setQr)
  }, [code])

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      window.setTimeout(() => setCopied(''), 1600)
    } catch {
      setCopied('לא ניתן להעתיק')
    }
  }

  async function join() {
    const next = joinCode.trim().toUpperCase()
    if (!next || next === getStoredSyncCode()) return
    setBusy(true)
    try {
      saveSyncCode(next)
      setCode(next)
      setJoinCode('')
      await restartSync()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel">
      <h2>
        <Icon icon={Cloud} size={20} /> סנכרון
      </h2>
      <p className={status.state === 'error' ? 'over-budget' : 'meta'}>
        {status.message}
        {status.lastSyncedAt
          ? ` · ${new Date(status.lastSyncedAt).toLocaleString('he-IL')}`
          : ''}
      </p>
      {status.state === 'error' && (
        <p className="muted">
          במחשב שעובד: העתיקו את הקוד או סרקו את הברקוד. כאן הדביקו את אותו קוד ולחצו «חיבור».
        </p>
      )}
      <div className="sync-qr-wrap">
        {qr ? (
          <img className="sync-qr" src={qr} alt="ברקוד לפתיחה בטלפון" />
        ) : (
          <div className="muted">טוען ברקוד…</div>
        )}
        <p className="meta">סריקה מהטלפון / מחשב אחר</p>
      </div>
      <div className="field" style={{ marginBottom: '0.75rem' }}>
        <label>קוד המחשב הזה</label>
        <div className="actions">
          <input value={code} readOnly dir="ltr" />
          <button
            type="button"
            className="btn small secondary"
            onClick={() => void copy(code, 'הקוד הועתק')}
          >
            <Icon icon={Copy} size={ICON_SIZE_SM} />
            העתק
          </button>
        </div>
      </div>
      <div className="field" style={{ marginBottom: '0.75rem' }}>
        <label>חיבור למחשב אחר — הדביקו את הקוד משם</label>
        <div className="actions">
          <input
            dir="ltr"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="MENACHEM-…"
            aria-label="קוד סנכרון ממחשב אחר"
          />
          <button
            type="button"
            className="btn small shlichut"
            disabled={busy || !joinCode.trim()}
            onClick={() => void join()}
          >
            חיבור
          </button>
        </div>
      </div>
      {copied && <p className="meta">{copied}</p>}
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
