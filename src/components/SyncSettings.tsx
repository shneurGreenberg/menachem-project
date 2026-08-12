import { Cloud, Copy, RefreshCw, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  buildPersonalSyncUrl,
  getStoredSyncCode,
  saveSyncCode,
} from '../firebase/configStore'
import { getSyncStatus, startAutoSync, subscribeSyncStatus, syncNow } from '../firebase/sync'
import { SUGGESTED_SYNC_CODE, type SyncStatus } from '../firebase/types'
import { Icon, ICON_SIZE_SM } from './icons'

export function SyncSettings() {
  const [code, setCode] = useState(getStoredSyncCode() ?? SUGGESTED_SYNC_CODE)
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus())
  const [msg, setMsg] = useState('')
  const [link, setLink] = useState('')

  useEffect(() => subscribeSyncStatus(setStatus), [])
  useEffect(() => {
    setLink(buildPersonalSyncUrl())
  }, [code, status.state])

  async function saveAndConnect() {
    try {
      saveSyncCode(code.trim() || SUGGESTED_SYNC_CODE)
      setMsg('מתחבר לענן…')
      await startAutoSync()
      setLink(buildPersonalSyncUrl())
      setMsg('הסנכרון פעיל. פתח את הקישור האישי בטלפון.')
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'שגיאה בשמירת הסנכרון')
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link)
      setMsg('הקישור הועתק.')
    } catch {
      setMsg('לא ניתן להעתיק — סמן את הקישור ידנית.')
    }
  }

  return (
    <section className="panel">
      <h2>
        <Icon icon={Cloud} size={20} /> סנכרון בין מכשירים
      </h2>
      <p>
        חיבור Firebase כבר מוגדר באתר. נשארו שני דברים בקונסול, ואז לחיצה אחת כאן.
      </p>
      <p className="meta" style={{ marginBottom: '0.75rem' }}>
        מצב: {status.message}
        {status.lastSyncedAt ? ` · עודכן ${new Date(status.lastSyncedAt).toLocaleString('he-IL')}` : ''}
      </p>

      <ol className="sync-steps">
        <li>
          בקונסול: קטגוריה <strong>Security</strong> → <strong>Authentication</strong> →
          Sign-in method → הפעל <strong>Anonymous</strong> → Save.
        </li>
        <li>
          <strong>Firestore</strong> → לשונית <strong>Rules</strong> → הדבק את הכללים למטה →
          <strong>Publish</strong>.
        </li>
      </ol>

      <pre className="sync-rules" dir="ltr">{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /spaces/{spaceId}/{document=**} {
      allow read, write: if request.auth != null
        && spaceId.matches('^[a-f0-9]{64}$');
    }
  }
}`}</pre>

      <div className="form" style={{ marginTop: '1rem' }}>
        <div className="field">
          <label>קוד סנכרון סודי</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="actions">
          <button type="button" className="btn shlichut" onClick={() => void saveAndConnect()}>
            <Icon icon={Save} size={ICON_SIZE_SM} />
            הפעלת סנכרון
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={() => void syncNow().catch((e) => setMsg(String(e)))}
          >
            <Icon icon={RefreshCw} size={ICON_SIZE_SM} />
            סנכרן עכשיו
          </button>
        </div>
        {link && (
          <div className="field">
            <label>קישור לטלפון / מחשב אחר</label>
            <textarea readOnly rows={2} value={link} />
            <button type="button" className="btn secondary small" onClick={() => void copyLink()}>
              <Icon icon={Copy} size={ICON_SIZE_SM} />
              העתקת קישור
            </button>
          </div>
        )}
        {msg && <div className="meta">{msg}</div>}
      </div>
    </section>
  )
}
