import { useLiveQuery } from 'dexie-react-hooks'
import { CalendarPlus, FolderOpen } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon, ICON_SIZE_SM } from '../../components/icons'
import { DateField } from '../../components/DateField'
import { db } from '../../db'
import { formatDate, formatMoney, nowISO, todayISO } from '../../utils/dates'

export function PlansPage() {
  const plans = useLiveQuery(() => db.plans.orderBy('targetDate').reverse().toArray(), [])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetDate, setTargetDate] = useState(todayISO())
  const [budget, setBudget] = useState('')

  async function addPlan(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !targetDate) return
    const ts = nowISO()
    await db.plans.add({
      title: title.trim(),
      description: description.trim() || undefined,
      targetDate,
      budget: budget ? Number(budget) : undefined,
      status: 'active',
      createdAt: ts,
      updatedAt: ts,
    })
    setTitle('')
    setDescription('')
    setBudget('')
    setTargetDate(todayISO())
  }

  return (
    <div className="grid" style={{ gap: '1.25rem' }}>
      <section className="panel">
        <h2>תוכנית חדשה</h2>
        <form className="form" onSubmit={addPlan}>
          <div className="form-row">
            <div className="field">
              <label>כותרת</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="למשל: ראש השנה בשכונה"
              />
            </div>
            <DateField
              label="תאריך יעד"
              value={targetDate}
              onChange={setTargetDate}
              required
            />
            <div className="field">
              <label>תקציב (₪)</label>
              <input
                type="number"
                min={0}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>תיאור</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <button type="submit" className="btn shlichut">
            <Icon icon={CalendarPlus} size={ICON_SIZE_SM} />
            יצירת תוכנית
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>תוכניות</h2>
        {!plans?.length ? (
          <div className="empty">אין תוכניות עדיין.</div>
        ) : (
          <div className="list">
            {plans.map((p) => (
              <Link key={p.id} to={`/shlichut/plans/${p.id}`} className="list-item">
                <div className="stack-sm">
                  <strong>{p.title}</strong>
                  <div className="meta">
                    {formatDate(p.targetDate)}
                    {p.budget != null ? ` · תקציב ${formatMoney(p.budget)}` : ''}
                    {` · ${p.status === 'active' ? 'פעילה' : p.status === 'completed' ? 'הושלמה' : 'בארכיון'}`}
                  </div>
                </div>
                <span className="btn small secondary">
                  <Icon icon={FolderOpen} size={ICON_SIZE_SM} />
                  פתיחה
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
