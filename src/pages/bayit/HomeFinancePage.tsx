import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Icon, ICON_SIZE_SM } from '../../components/icons'
import { DateField } from '../../components/DateField'
import { db, getSetting } from '../../db'
import type { FinanceType } from '../../types'
import { formatDate, formatMoney, nowISO, parseCategories, todayISO } from '../../utils/dates'

export function HomeFinancePage() {
  const rows = useLiveQuery(
    () => db.homeTransactions.orderBy('date').reverse().toArray(),
    [],
  )
  const [incomeCats, setIncomeCats] = useState<string[]>([])
  const [expenseCats, setExpenseCats] = useState<string[]>([])
  const [form, setForm] = useState({
    type: 'expense' as FinanceType,
    amount: '',
    category: '',
    description: '',
    date: todayISO(),
  })

  useEffect(() => {
    void (async () => {
      const inc = await getSetting('homeIncomeCategories')
      const exp = await getSetting('homeExpenseCategories')
      setIncomeCats(parseCategories(inc, ['משכורת', 'מתנות', 'אחר']))
      setExpenseCats(
        parseCategories(exp, ['מזון', 'דיור', 'תחבורה', 'בריאות', 'חינוך', 'אחר']),
      )
    })()
  }, [])

  const cats = form.type === 'income' ? incomeCats : expenseCats
  const income = (rows ?? [])
    .filter((r) => r.type === 'income')
    .reduce((s, r) => s + r.amount, 0)
  const expense = (rows ?? [])
    .filter((r) => r.type === 'expense')
    .reduce((s, r) => s + r.amount, 0)

  async function addRow(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || !form.category) return
    await db.homeTransactions.add({
      type: form.type,
      amount: Number(form.amount),
      category: form.category,
      description: form.description.trim() || undefined,
      date: form.date,
      createdAt: nowISO(),
    })
    setForm((s) => ({ ...s, amount: '', description: '', category: '' }))
  }

  async function remove(id?: number) {
    if (id == null || !confirm('למחוק רשומה?')) return
    await db.homeTransactions.delete(id)
  }

  return (
    <div className="grid" style={{ gap: '1.25rem' }}>
      <section className="grid grid-3">
        <div className="panel stat">
          <span className="value" style={{ color: 'var(--ok)' }}>
            {formatMoney(income)}
          </span>
          <span className="label">הכנסות</span>
        </div>
        <div className="panel stat">
          <span className="value" style={{ color: 'var(--danger)' }}>
            {formatMoney(expense)}
          </span>
          <span className="label">הוצאות</span>
        </div>
        <div className="panel stat">
          <span className="value">{formatMoney(income - expense)}</span>
          <span className="label">יתרה</span>
        </div>
      </section>

      <section className="panel">
        <h2>רשומה חדשה — כספי בית</h2>
        <form className="form" onSubmit={addRow}>
          <div className="form-row">
            <div className="field">
              <label>סוג</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    type: e.target.value as FinanceType,
                    category: '',
                  }))
                }
              >
                <option value="income">הכנסה</option>
                <option value="expense">הוצאה</option>
              </select>
            </div>
            <div className="field">
              <label>סכום</label>
              <input
                type="number"
                min={0}
                required
                value={form.amount}
                onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>קטגוריה</label>
              <select
                required
                value={form.category}
                onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
              >
                <option value="">—</option>
                {cats.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <DateField
              label="תאריך"
              value={form.date}
              onChange={(date) => setForm((s) => ({ ...s, date }))}
              required
            />
          </div>
          <div className="field">
            <label>תיאור</label>
            <input
              value={form.description}
              onChange={(e) =>
                setForm((s) => ({ ...s, description: e.target.value }))
              }
            />
          </div>
          <button type="submit" className="btn bayit">
            <Icon icon={Plus} size={ICON_SIZE_SM} />
            הוספה
          </button>
        </form>
      </section>

      <section className="panel">
        <h3>יומן</h3>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>תאריך</th>
                <th>סוג</th>
                <th>קטגוריה</th>
                <th>סכום</th>
                <th>תיאור</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.date)}</td>
                  <td>{r.type === 'income' ? 'הכנסה' : 'הוצאה'}</td>
                  <td>{r.category}</td>
                  <td
                    style={{
                      color: r.type === 'income' ? 'var(--ok)' : 'var(--danger)',
                    }}
                  >
                    {formatMoney(r.amount)}
                  </td>
                  <td>{r.description || '—'}</td>
                  <td>
                    <button
                      type="button"
                      className="btn small ghost"
                      onClick={() => remove(r.id)}
                    >
                      <Icon icon={Trash2} size={ICON_SIZE_SM} />
                      מחק
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows?.length && <div className="empty">אין רשומות.</div>}
        </div>
      </section>
    </div>
  )
}
