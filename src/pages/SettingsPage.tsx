import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Icon, ICON_SIZE_SM } from '../components/icons'
import { SaveBar } from '../components/SaveBar'
import { SyncSettings } from '../components/SyncSettings'
import { db, getSetting, setSetting } from '../db'
import { useSaveFeedback } from '../hooks/useSaveFeedback'
import type { CustomFieldDef, FieldType } from '../types'
import { parseCategories } from '../utils/dates'

const HOME_INCOME = ['משכורת', 'מתנות', 'אחר']
const HOME_EXPENSE = ['מזון', 'דיור', 'תחבורה', 'בריאות', 'חינוך', 'אחר']
const CHABAD_INCOME = ['תרומות', 'מכירות', 'אחר']
const CHABAD_EXPENSE = ['אירועים', 'ציוד', 'מזון', 'תחבורה', 'אחר']

export function SettingsPage() {
  const fields = useLiveQuery(
    () => db.customFieldDefs.orderBy('order').toArray(),
    [],
  )
  const activityTypes = useLiveQuery(() => db.activityTypes.toArray(), [])
  const [leadDays, setLeadDays] = useState('45')
  const [savedLeadDays, setSavedLeadDays] = useState('45')
  const [msg, setMsg] = useState('')
  const { saving, saved, error, runSave } = useSaveFeedback()

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
    if (id == null || !confirm('למחוק שדה מותאם?')) return
    await db.customFieldDefs.delete(id)
  }

  async function addActivityType(e: React.FormEvent) {
    e.preventDefault()
    if (!typeName.trim()) return
    await db.activityTypes.add({ name: typeName.trim() })
    setTypeName('')
  }

  async function removeType(id?: number) {
    if (id == null || !confirm('למחוק סוג פעילות?')) return
    await db.activityTypes.delete(id)
  }

  return (
    <div>
      <div className="page-header">
        <h1>הגדרות</h1>
        <p>סנכרון, שדות מותאמים, קטגוריות וסוגי פעילות.</p>
      </div>

      {msg && (
        <div className="panel" style={{ marginBottom: '1rem', background: 'var(--shlichut-soft)' }}>
          {msg}
        </div>
      )}

      <div className="grid" style={{ gap: '1.25rem' }}>
        <SyncSettings />

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
              <Icon icon={Save} size={ICON_SIZE_SM} />
              שמירה
            </button>
          </div>
        </section>

        <section className="panel">
          <h2>קטגוריות כספים</h2>
          <p className="muted">מופרדות בפסיק. נשמרות מיד.</p>
          <CategoryEditor
            settingKey="homeIncomeCategories"
            label="הכנסות בית"
            fallback={HOME_INCOME}
          />
          <CategoryEditor
            settingKey="homeExpenseCategories"
            label="הוצאות בית"
            fallback={HOME_EXPENSE}
          />
          <CategoryEditor
            settingKey="chabadIncomeCategories"
            label="הכנסות חב״ד"
            fallback={CHABAD_INCOME}
          />
          <CategoryEditor
            settingKey="chabadExpenseCategories"
            label="הוצאות חב״ד"
            fallback={CHABAD_EXPENSE}
          />
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
                  <Icon icon={Trash2} size={ICON_SIZE_SM} />
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
              <Icon icon={Plus} size={ICON_SIZE_SM} />
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
                  <Icon icon={Trash2} size={ICON_SIZE_SM} />
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
              <Icon icon={Plus} size={ICON_SIZE_SM} />
              הוספה
            </button>
          </form>
        </section>
      </div>

      <SaveBar
        dirty={leadDirty}
        saving={saving}
        saved={saved}
        error={error}
        onSave={() => void saveLead()}
        context="הגדרות"
      />
    </div>
  )
}

function CategoryEditor({
  settingKey,
  label,
  fallback,
}: {
  settingKey: string
  label: string
  fallback: string[]
}) {
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    void getSetting(settingKey).then((v) => {
      setText(parseCategories(v, fallback).join(', '))
    })
  }, [settingKey, fallback])

  async function save() {
    const cats = text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    await setSetting(settingKey, JSON.stringify(cats.length ? cats : fallback))
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="field" style={{ marginBottom: '0.75rem' }}>
      <label>{label}</label>
      <div className="actions">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => void save()}
          style={{ flex: 1 }}
        />
        {saved && <span className="meta">נשמר</span>}
      </div>
    </div>
  )
}
