import { useLiveQuery } from 'dexie-react-hooks'
import { Check, ClipboardPlus, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { CollapsibleAdd } from '../../components/CollapsibleAdd'
import { Icon, ICON_SIZE_SM } from '../../components/icons'
import { DateField } from '../../components/DateField'
import { db } from '../../db'
import { formatDate, nowISO, todayISO } from '../../utils/dates'

export function TeachingPlansPage() {
  const plans = useLiveQuery(
    () => db.teachingPlans.orderBy('date').reverse().toArray(),
    [],
  )
  const materials = useLiveQuery(() => db.lessonMaterials.toArray(), [])
  const students = useLiveQuery(() => db.students.toArray(), [])

  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({
    title: '',
    topic: '',
    date: todayISO(),
    notes: '',
    materialIds: [] as number[],
    studentIds: [] as number[],
  })

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.topic.trim()) return
    const payload = {
      title: form.title.trim(),
      topic: form.topic.trim(),
      date: form.date || undefined,
      notes: form.notes.trim() || undefined,
      materialIds: form.materialIds,
      studentIds: form.studentIds,
    }
    if (editId != null) {
      await db.teachingPlans.update(editId, payload)
    } else {
      await db.teachingPlans.add({
        ...payload,
        status: 'planned',
        createdAt: nowISO(),
      })
    }
    setEditId(null)
    setFormOpen(false)
    setForm({
      title: '',
      topic: '',
      date: todayISO(),
      notes: '',
      materialIds: [],
      studentIds: [],
    })
  }

  function startEdit(id: number) {
    const p = (plans ?? []).find((x) => x.id === id)
    if (!p) return
    setEditId(id)
    setFormOpen(true)
    setForm({
      title: p.title,
      topic: p.topic,
      date: p.date ?? todayISO(),
      notes: p.notes ?? '',
      materialIds: [...p.materialIds],
      studentIds: [...p.studentIds],
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function markDone(id?: number) {
    if (id == null) return
    await db.teachingPlans.update(id, { status: 'done' })
  }

  async function remove(id?: number) {
    if (id == null || !confirm('למחוק תוכנית?')) return
    await db.teachingPlans.delete(id)
  }

  function toggleId(
    key: 'materialIds' | 'studentIds',
    id: number,
    checked: boolean,
  ) {
    setForm((s) => ({
      ...s,
      [key]: checked
        ? [...s[key], id]
        : s[key].filter((x) => x !== id),
    }))
  }

  return (
    <div className="grid" style={{ gap: '1.25rem' }}>
      <section className="panel">
        <h2>תוכניות</h2>
        {!plans?.length ? (
          <div className="empty">אין תוכניות הוראה.</div>
        ) : (
          <div className="list">
            {plans.map((p) => (
              <div key={p.id} className="list-item">
                <div className="stack-sm">
                  <strong>{p.title}</strong>
                  <div className="meta">
                    {p.topic}
                    {p.date ? ` · ${formatDate(p.date)}` : ''}
                    {` · ${p.status === 'planned' ? 'מתוכננת' : 'בוצעה'}`}
                  </div>
                  <div className="meta">
                    חומרים: {p.materialIds.length} · תלמידים: {p.studentIds.length}
                  </div>
                </div>
                <div className="actions">
                  {p.status === 'planned' && (
                    <button
                      type="button"
                      className="btn small chinuch"
                      onClick={() => markDone(p.id)}
                    >
                      <Icon icon={Check} size={ICON_SIZE_SM} />
                      בוצע
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn small secondary"
                    onClick={() => p.id != null && startEdit(p.id)}
                  >
                    <Icon icon={Pencil} size={ICON_SIZE_SM} />
                    עריכה
                  </button>
                  <button
                    type="button"
                    className="btn small ghost"
                    onClick={() => remove(p.id)}
                  >
                    <Icon icon={Trash2} size={ICON_SIZE_SM} />
                    מחק
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <CollapsibleAdd
        title={editId != null ? 'עריכת תוכנית הוראה' : 'תוכנית הוראה חדשה'}
        buttonLabel="תוכנית חדשה"
        buttonClass="chinuch"
        open={formOpen || editId != null}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditId(null)
            setForm({
              title: '',
              topic: '',
              date: todayISO(),
              notes: '',
              materialIds: [],
              studentIds: [],
            })
          }
        }}
      >
        <form className="form" onSubmit={save}>
          <div className="form-row">
            <div className="field">
              <label>כותרת</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>נושא</label>
              <input
                required
                value={form.topic}
                onChange={(e) => setForm((s) => ({ ...s, topic: e.target.value }))}
              />
            </div>
            <DateField label="תאריך" value={form.date} onChange={(date) => setForm((s) => ({ ...s, date }))} />
          </div>
          <div className="field">
            <label>חומרים מתוכננים</label>
            <div className="list">
              {(materials ?? []).map((m) => (
                <label key={m.id} className="list-item" style={{ cursor: 'pointer' }}>
                  <span>{m.title}</span>
                  <input
                    type="checkbox"
                    checked={form.materialIds.includes(m.id!)}
                    onChange={(e) => toggleId('materialIds', m.id!, e.target.checked)}
                  />
                </label>
              ))}
              {!materials?.length && <div className="muted">אין חומרים במאגר.</div>}
            </div>
          </div>
          <div className="field">
            <label>תלמידים</label>
            <div className="list">
              {(students ?? []).map((s) => (
                <label key={s.id} className="list-item" style={{ cursor: 'pointer' }}>
                  <span>{s.name}</span>
                  <input
                    type="checkbox"
                    checked={form.studentIds.includes(s.id!)}
                    onChange={(e) => toggleId('studentIds', s.id!, e.target.checked)}
                  />
                </label>
              ))}
              {!students?.length && <div className="muted">אין תלמידים.</div>}
            </div>
          </div>
          <div className="field">
            <label>הערות</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
            />
          </div>
          <button type="submit" className="btn chinuch">
            <Icon icon={ClipboardPlus} size={ICON_SIZE_SM} />
            {editId != null ? 'שמירת שינויים' : 'יצירה'}
          </button>
        </form>
      </CollapsibleAdd>
    </div>
  )
}
