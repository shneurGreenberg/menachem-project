import { Cloud, Copy, RefreshCw, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  buildPersonalSyncUrl,
  getStoredFirebaseConfig,
  getStoredSyncCode,
  parseFirebaseConfig,
  saveFirebaseConfig,
  saveSyncCode,
} from '../firebase/configStore'
import { getSyncStatus, startAutoSync, subscribeSyncStatus, syncNow } from '../firebase/sync'
import { SUGGESTED_SYNC_CODE, type SyncStatus } from '../firebase/types'
import { Icon, ICON_SIZE_SM } from './icons'

export function SyncSettings() {
  const stored = getStoredFirebaseConfig()
  const [configText, setConfigText] = useState(
    stored ? JSON.stringify(stored, null, 2) : '',
  )
  const [code, setCode] = useState(getStoredSyncCode() ?? SUGGESTED_SYNC_CODE)
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus())
  const [msg, setMsg] = useState('')
  const [link, setLink] = useState('')

  useEffect(() => subscribeSyncStatus(setStatus), [])
  useEffect(() => {
    setLink(buildPersonalSyncUrl())
  }, [configText, code, status.state])

  async function saveAndConnect() {
    try {
      const cfg = parseFirebaseConfig(configText)
      saveFirebaseConfig(cfg)
      saveSyncCode(code.trim() || SUGGESTED_SYNC_CODE)
      setMsg('נשמר. מתחבר לענן…')
      await startAutoSync()
      setLink(buildPersonalSyncUrl())
      setMsg('הסנכרון פעיל. שמור את הקישור האישי בטלפון.')
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
        בלי התחברות לחשבון. הקוד הסודי והקישור האישי הם ההרשאה.
        במכשיר חדש פותחים את <strong>אותו קישור</strong> — והנתונים מגיעים מהענן.
      </p>
      <p className="meta" style={{ marginBottom: '0.75rem' }}>
        מצב: {status.message}
        {status.lastSyncedAt ? ` · עודכן ${new Date(status.lastSyncedAt).toLocaleString('he-IL')}` : ''}
      </p>

      <ol className="sync-steps">
        <li>
          ב-Firebase: גלגל השיניים ליד שם הפרויקט → <strong>Project settings</strong> →
          גלול ל-<strong>Your apps</strong> → אם אין אפליקציית Web, לחץ על אייקון {'</>'} והוסף.
        </li>
        <li>
          העתק את האובייקט <code>firebaseConfig</code> והדבק למטה.
        </li>
        <li>
          Authentication → Sign-in method → הפעל <strong>Anonymous</strong>.
        </li>
        <li>
          Firestore → Rules → הדבק את הכללים מקובץ <code>firestore.rules</code> בריפו ולחץ Publish.
        </li>
      </ol>

      <div className="form" style={{ marginTop: '1rem' }}>
        <div className="field">
          <label>firebaseConfig</label>
          <textarea
            rows={8}
            placeholder={'const firebaseConfig = {\n  apiKey: "...",\n  ...\n};'}
            value={configText}
            onChange={(e) => setConfigText(e.target.value)}
          />
        </div>
        <div className="field">
          <label>קוד סנכרון סודי</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
          />
          <div className="meta">מומלץ להשאיר: {SUGGESTED_SYNC_CODE}</div>
        </div>
        <div className="actions">
          <button type="button" className="btn shlichut" onClick={() => void saveAndConnect()}>
            <Icon icon={Save} size={ICON_SIZE_SM} />
            שמירה והפעלת סנכרון
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
            <label>הקישור האישי שלך (לפתיחה בטלפון / מחשב אחר)</label>
            <textarea readOnly rows={3} value={link} />
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
