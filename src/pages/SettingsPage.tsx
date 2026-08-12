import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { SaveBar } from '../components/SaveBar'
import { db, getSetting, setSetting } from '../db'
import { useSaveFeedback } from '../hooks/useSaveFeedback'
import type { CustomFieldDef, FieldType } from '../types'
import { downloadJson, exportAllData, importAllData } from '../utils/backup'
import { nowISO } from '../utils/dates'

export function SettingsPage() {
  const fields = useLiveQuery(
    () => db.customFieldDefs.orderBy('order').toArray(),
    [],
  )
  const activityTypes = useLiveQuery(() => db.activityTypes.toArray(), [])
  const [leadDays, setLeadDays] = useState('45')
  const [savedLeadDays, setSavedLeadDays] = useState('45')
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const { saving, saved, runSave } = useSaveFeedback()

  const leadDirty = leadDays !== savedLeadDays

  const [fieldForm, setFieldForm] = useState({
    label: '',
    key: '',
    type: 'text' as FieldType,
    options: '',
  })
  const [typeName, setTypeName] = useState('')

  useEffect(() => {
    void getSetting('planResurfaceLeadDays', '45').then((value) => {
      setLeadDays(value)
      setSavedLeadDays(value)
    })
  }, [])

  async function saveLead() {
    await runSave(async () => {
      const n = Math.min(90, Math.max(7, Number(leadDays) || 45))
      const value = String(n)
      await setSetting('planResurfaceLeadDays', value)
      setLeadDays(value)
      setSavedLeadDays(value)
      setMsg('ימי הקדמה נשמרו.')
    })
  }

  async function addField(e: React.FormEvent) {
    e.preventDefault()
    const key =
      fieldForm.key.trim() ||
      fieldForm.label
        .trim()
        .replace(/\s+/g, '_')
        .toLowerCase() ||
      `field_${Date.now()}`
    const order = (fields?.length ?? 0) + 1
    const def: CustomFieldDef = {
      key,
      label: fieldForm.label.trim(),
      type: fieldForm.type,
      order,
      options:
        fieldForm.type === 'select'
          ? fieldForm.options
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
    }
    await db.customFieldDefs.add(def)
    setFieldForm({ label: '', key: '', type: 'text', options: '' })
  }

  async function removeField(id?: number) {
    if (id == null) return
    await db.customFieldDefs.delete(id)
  }

  async function addActivityType(e: React.FormEvent) {
    e.preventDefault()
    if (!typeName.trim()) return
    await db.activityTypes.add({ name: typeName.trim() })
    setTypeName('')
  }

  async function removeType(id?: number) {
    if (id == null) return
    await db.activityTypes.delete(id)
  }

  async function doExport() {
    const json = await exportAllData()
    downloadJson(`menachem-backup-${nowISO().slice(0, 10)}.json`, json)
    setMsg('הגיבוי הורד בהצלחה.')
  }

  async function doImport(file: File) {
    const text = await file.text()
    if (
      !confirm(
        'ייבוא יחליף את כל הנתונים הנוכחיים. להמשיך?',
      )
    ) {
      return
    }
    await importAllData(text)
    setMsg('הנתונים שוחזרו מהגיבוי.')
  }

  return (
    <div>
      <div className="page-header">
        <h1>הגדרות</h1>
        <p>גיבוי, שדות מותאמים, סוגי פעילות והתראות שנתיות.</p>
      </div>

      {msg && (
        <div className="panel" style={{ marginBottom: '1rem', background: 'var(--shlichut-soft)' }}>
          {msg}
        </div>
      )}

      <div className="grid" style={{ gap: '1.25rem' }}>
        <section className="panel">
          <h2>גיבוי ושחזור</h2>
          <p>
            הנתונים נשמרים בדפדפן בלבד. מומלץ לייצא גיבוי JSON מדי פעם.
            מחיקת נתוני האתר בדפדפן תמחק גם את המידע.
          </p>
          <div className="actions">
            <button type="button" className="btn shlichut" onClick={doExport}>
              ייצוא גיבוי JSON
            </button>
            <button
              type="button"
              className="btn secondary"
              onClick={() => fileRef.current?.click()}
            >
              ייבוא מגיבוי
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void doImport(f)
                e.target.value = ''
              }}
            />
          </div>
        </section>

        <section className="panel">
          <h2>התראות שנתיות לתוכניות</h2>
          <div className="form-row">
            <div className="field">
              <label>ימי הקדמה (30–60 מומלץ)</label>
              <input
                type="number"
                min={7}
                max={90}
                value={leadDays}
                onChange={(e) => setLeadDays(e.target.value)}
              />
            </div>
          </div>
          <div className="actions" style={{ marginTop: '0.75rem' }}>
            <button type="button" className="btn" onClick={saveLead}>
              שמירה
            </button>
          </div>
        </section>

        <section className="panel">
          <h2>שדות מותאמים לאנשי קשר</h2>
          <p>השדות מופיעים בכל כרטיס איש קשר.</p>
          <div className="list" style={{ marginBottom: '1rem' }}>
            {(fields ?? []).map((f) => (
              <div key={f.id} className="list-item">
                <div>
                  <strong>{f.label}</strong>
                  <div className="meta">
                    {f.key} · {f.type}
                    {f.options?.length ? ` · ${f.options.join(', ')}` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn small ghost"
                  onClick={() => removeField(f.id)}
                >
                  מחיקה
                </button>
              </div>
            ))}
          </div>
          <form className="form" onSubmit={addField}>
            <div className="form-row">
              <div className="field">
                <label>תווית</label>
                <input
                  required
                  value={fieldForm.label}
                  onChange={(e) =>
                    setFieldForm((s) => ({ ...s, label: e.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label>מפתח (אופציונלי)</label>
                <input
                  value={fieldForm.key}
                  onChange={(e) =>
                    setFieldForm((s) => ({ ...s, key: e.target.value }))
                  }
                />
              </div>
              <div className="field">
                <label>סוג</label>
                <select
                  value={fieldForm.type}
                  onChange={(e) =>
                    setFieldForm((s) => ({
                      ...s,
                      type: e.target.value as FieldType,
                    }))
                  }
                >
                  <option value="text">טקסט</option>
                  <option value="number">מספר</option>
                  <option value="select">בחירה</option>
                </select>
              </div>
            </div>
            {fieldForm.type === 'select' && (
              <div className="field">
                <label>אפשרויות (מופרדות בפסיק)</label>
                <input
                  value={fieldForm.options}
                  onChange={(e) =>
                    setFieldForm((s) => ({ ...s, options: e.target.value }))
                  }
                />
              </div>
            )}
            <button type="submit" className="btn secondary">
              הוספת שדה
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>סוגי פעילות (שליחות)</h2>
          <div className="list" style={{ marginBottom: '1rem' }}>
            {(activityTypes ?? []).map((t) => (
              <div key={t.id} className="list-item">
                <strong>{t.name}</strong>
                <button
                  type="button"
                  className="btn small ghost"
                  onClick={() => removeType(t.id)}
                >
                  מחיקה
                </button>
              </div>
            ))}
          </div>
          <form
            className="actions"
            onSubmit={addActivityType}
            style={{ gap: '0.5rem' }}
          >
            <input
              placeholder="שם סוג חדש"
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
              style={{
                padding: '0.55rem 0.7rem',
                border: '1px solid var(--border)',
                borderRadius: 8,
                flex: 1,
              }}
            />
            <button type="submit" className="btn secondary">
              הוספה
            </button>
          </form>
        </section>
      </div>

      <SaveBar
        dirty={leadDirty}
        saving={saving}
        saved={saved}
        onSave={() => void saveLead()}
      />
    </div>
  )
}
