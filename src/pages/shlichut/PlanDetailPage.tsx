import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowRight,
  Plus,
  Save,
  ShoppingCart,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon, ICON_SIZE_SM } from '../../components/icons'
import { SaveBar } from '../../components/SaveBar'
import { db } from '../../db'
import { useSaveFeedback } from '../../hooks/useSaveFeedback'
import { formatDate, formatMoney, nowISO, todayISO } from '../../utils/dates'

export function PlanDetailPage() {
  const { id } = useParams()
  const planId = Number(id)
  const navigate = useNavigate()

  const plan = useLiveQuery(async () => {
    if (!Number.isFinite(planId)) return null
    return (await db.plans.get(planId)) ?? null
  }, [planId])
  const tasks = useLiveQuery(
    () => db.planTasks.where('planId').equals(planId).sortBy('order'),
    [planId],
  )
  const shopping = useLiveQuery(
    () => db.shoppingItems.where('planId').equals(planId).toArray(),
    [planId],
  )
  const summaries = useLiveQuery(
    () => db.planSummaries.where('planId').equals(planId).reverse().sortBy('year'),
    [planId],
  )

  const [taskTitle, setTaskTitle] = useState('')
  const [shopName, setShopName] = useState('')
  const [shopQty, setShopQty] = useState('')
  const [shopCost, setShopCost] = useState('')
  const [summary, setSummary] = useState({
    whatWorked: '',
    whatDidnt: '',
    notesForNextYear: '',
  })
  const { saving, saved, runSave } = useSaveFeedback()

  const summaryDirty =
    summary.whatWorked.trim() !== '' ||
    summary.whatDidnt.trim() !== '' ||
    summary.notesForNextYear.trim() !== ''

  if (!Number.isFinite(planId)) {
    return <div className="empty">מזהה לא תקין</div>
  }
  if (plan === undefined) return <div className="empty">טוען…</div>
  if (plan === null) {
    return (
      <div className="empty">
        תוכנית לא נמצאה. <Link to="/shlichut/plans">חזרה</Link>
      </div>
    )
  }

  const shopTotal = (shopping ?? []).reduce(
    (s, i) => s + (i.estimatedCost ?? 0),
    0,
  )

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!taskTitle.trim()) return
    await db.planTasks.add({
      planId,
      title: taskTitle.trim(),
      done: false,
      order: (tasks?.length ?? 0) + 1,
    })
    setTaskTitle('')
  }

  async function toggleTask(id: number, done: boolean) {
    await db.planTasks.update(id, { done: !done })
  }

  async function addShop(e: React.FormEvent) {
    e.preventDefault()
    if (!shopName.trim()) return
    await db.shoppingItems.add({
      planId,
      name: shopName.trim(),
      quantity: shopQty.trim() || undefined,
      estimatedCost: shopCost ? Number(shopCost) : undefined,
      purchased: false,
    })
    setShopName('')
    setShopQty('')
    setShopCost('')
  }

  async function toggleShop(id: number, purchased: boolean) {
    await db.shoppingItems.update(id, { purchased: !purchased })
  }

  async function saveSummary(e?: React.FormEvent) {
    e?.preventDefault()
    await runSave(async () => {
      const year = Number(plan!.targetDate.slice(0, 4))
      await db.planSummaries.add({
        planId,
        year,
        whatWorked: summary.whatWorked.trim(),
        whatDidnt: summary.whatDidnt.trim(),
        notesForNextYear: summary.notesForNextYear.trim(),
        createdAt: nowISO(),
      })
      await db.plans.update(planId, { status: 'completed', updatedAt: nowISO() })
      setSummary({ whatWorked: '', whatDidnt: '', notesForNextYear: '' })
    })
  }

  async function removePlan() {
    if (!confirm('למחוק תוכנית ואת כל הפריטים שלה?')) return
    await db.transaction(
      'rw',
      db.plans,
      db.planTasks,
      db.shoppingItems,
      db.planSummaries,
      async () => {
        await db.planTasks.where('planId').equals(planId).delete()
        await db.shoppingItems.where('planId').equals(planId).delete()
        await db.planSummaries.where('planId').equals(planId).delete()
        await db.plans.delete(planId)
      },
    )
    navigate('/shlichut/plans')
  }

  return (
    <div className="grid" style={{ gap: '1.25rem' }}>
      <div className="actions">
        <Link to="/shlichut/plans" className="btn secondary small">
          <Icon icon={ArrowRight} size={ICON_SIZE_SM} />
          חזרה
        </Link>
        <button type="button" className="btn danger small" onClick={removePlan}>
          <Icon icon={Trash2} size={ICON_SIZE_SM} />
          מחיקה
        </button>
      </div>

      <section className="panel">
        <h2>{plan.title}</h2>
        <p>
          תאריך יעד: {formatDate(plan.targetDate)}
          {plan.budget != null ? ` · תקציב ${formatMoney(plan.budget)}` : ''}
          {` · סטטוס: ${plan.status === 'active' ? 'פעילה' : plan.status === 'completed' ? 'הושלמה' : 'ארכיון'}`}
        </p>
        {plan.description && <p>{plan.description}</p>}
        <p className="muted">
          הוצאות משוערות מקניות: {formatMoney(shopTotal)}
          {plan.budget != null
            ? ` · יתרה משוערת: ${formatMoney(plan.budget - shopTotal)}`
            : ''}
        </p>
      </section>

      <section className="panel">
        <h3>משימות</h3>
        <form className="actions" onSubmit={addTask} style={{ marginBottom: '0.75rem' }}>
          <input
            placeholder="משימה חדשה"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            style={{
              flex: 1,
              padding: '0.55rem 0.7rem',
              border: '1px solid var(--border)',
              borderRadius: 8,
            }}
          />
          <button type="submit" className="btn secondary small">
            <Icon icon={Plus} size={ICON_SIZE_SM} />
            הוספה
          </button>
        </form>
        <div className="list">
          {(tasks ?? []).map((t) => (
            <div key={t.id} className="list-item">
              <label className="actions" style={{ gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => t.id != null && toggleTask(t.id, t.done)}
                />
                <span style={{ textDecoration: t.done ? 'line-through' : undefined }}>
                  {t.title}
                </span>
              </label>
            </div>
          ))}
          {!tasks?.length && <div className="empty">אין משימות.</div>}
        </div>
      </section>

      <section className="panel">
        <h3>קניות ותקציב</h3>
        <form className="form" onSubmit={addShop} style={{ marginBottom: '0.75rem' }}>
          <div className="form-row">
            <div className="field">
              <label>פריט</label>
              <input
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
              />
            </div>
            <div className="field">
              <label>כמות</label>
              <input value={shopQty} onChange={(e) => setShopQty(e.target.value)} />
            </div>
            <div className="field">
              <label>עלות משוערת</label>
              <input
                type="number"
                min={0}
                value={shopCost}
                onChange={(e) => setShopCost(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn secondary small">
            <Icon icon={ShoppingCart} size={ICON_SIZE_SM} />
            הוספת פריט
          </button>
        </form>
        <div className="list">
          {(shopping ?? []).map((s) => (
            <div key={s.id} className="list-item">
              <label className="actions" style={{ gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={s.purchased}
                  onChange={() => s.id != null && toggleShop(s.id, s.purchased)}
                />
                <span>
                  {s.name}
                  {s.quantity ? ` (${s.quantity})` : ''}
                </span>
              </label>
              <span className="meta">
                {s.estimatedCost != null ? formatMoney(s.estimatedCost) : '—'}
              </span>
            </div>
          ))}
          {!shopping?.length && <div className="empty">אין פריטי קנייה.</div>}
        </div>
      </section>

      <section className="panel">
        <h3>סיכום אחרי האירוע</h3>
        <p className="muted">
          הסיכום יוקפץ בדשבורד כ־30–60 יום לפני אותו תאריך בשנה הבאה.
        </p>
        <form className="form" onSubmit={saveSummary}>
          <div className="field">
            <label>מה עבד</label>
            <textarea
              value={summary.whatWorked}
              onChange={(e) =>
                setSummary((s) => ({ ...s, whatWorked: e.target.value }))
              }
            />
          </div>
          <div className="field">
            <label>מה לא עבד</label>
            <textarea
              value={summary.whatDidnt}
              onChange={(e) =>
                setSummary((s) => ({ ...s, whatDidnt: e.target.value }))
              }
            />
          </div>
          <div className="field">
            <label>לשמור לשנה הבאה</label>
            <textarea
              value={summary.notesForNextYear}
              onChange={(e) =>
                setSummary((s) => ({ ...s, notesForNextYear: e.target.value }))
              }
            />
          </div>
          <button type="submit" className="btn shlichut">
            <Icon icon={Save} size={ICON_SIZE_SM} />
            שמירת סיכום ({todayISO().slice(0, 4)})
          </button>
        </form>
        {(summaries ?? []).length > 0 && (
          <div className="list" style={{ marginTop: '1rem' }}>
            {[...(summaries ?? [])].reverse().map((s) => (
              <div key={s.id} className="list-item alert-year">
                <div className="stack-sm">
                  <strong>סיכום {s.year}</strong>
                  <div className="meta">עבד: {s.whatWorked || '—'}</div>
                  <div className="meta">לא עבד: {s.whatDidnt || '—'}</div>
                  <div className="meta">לשנה הבאה: {s.notesForNextYear || '—'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <SaveBar
        dirty={summaryDirty}
        saving={saving}
        saved={saved}
        onSave={() => void saveSummary()}
        variant="shlichut"
      />
    </div>
  )
}
