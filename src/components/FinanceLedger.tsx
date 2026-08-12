import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { db, getSetting } from '../db'
import type { FinanceType } from '../types'
import {
  formatDate,
  formatMoney,
  monthKey,
  nowISO,
  parseCategories,
  todayISO,
} from '../utils/dates'
import { FilterEmpty, listCountLabel } from './FilterEmpty'
import { DateField } from './DateField'
import { Icon, ICON_SIZE_SM } from './icons'

interface FinanceRow {
  id?: number
  type: FinanceType
  amount: number
  category: string
  description?: string
  date: string
  createdAt: string
}

interface FinanceLedgerProps {
  table: 'homeTransactions' | 'chabadFinance'
  heading: string
  intro?: string
  buttonClass: 'bayit' | 'shlichut'
  incomeSetting: string
  expenseSetting: string
  incomeFallback: string[]
  expenseFallback: string[]
}

export function FinanceLedger({
  table,
  heading,
  intro,
  buttonClass,
  incomeSetting,
  expenseSetting,
  incomeFallback,
  expenseFallback,
}: FinanceLedgerProps) {
  const rows = useLiveQuery(
    () => db.table(table).orderBy('date').reverse().toArray() as Promise<FinanceRow[]>,
    [table],
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
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | FinanceType>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState('all')

  useEffect(() => {
    void (async () => {
      const inc = await getSetting(incomeSetting)
      const exp = await getSetting(expenseSetting)
      setIncomeCats(parseCategories(inc, incomeFallback))
      setExpenseCats(parseCategories(exp, expenseFallback))
    })()
  }, [incomeSetting, expenseSetting, incomeFallback, expenseFallback])

  const cats = form.type === 'income' ? incomeCats : expenseCats
  const months = useMemo(() => {
    const set = new Set<string>()
    for (const r of rows ?? []) set.add(monthKey(r.date))
    return [...set].sort((a, b) => b.localeCompare(a))
  }, [rows])

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const r of rows ?? []) set.add(r.category)
    return [...set].sort((a, b) => a.localeCompare(b, 'he'))
  }, [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (rows ?? []).filter((r) => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return false
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false
      if (monthFilter !== 'all' && monthKey(r.date) !== monthFilter) return false
      if (!q) return true
      const hay = `${r.type} ${r.category} ${r.description ?? ''} ${r.amount}`.toLowerCase()
      return hay.includes(q)
    })
  }, [rows, search, typeFilter, categoryFilter, monthFilter])

  const scoped = monthFilter === 'all' ? (rows ?? []) : (rows ?? []).filter((r) => monthKey(r.date) === monthFilter)
  const income = scoped.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  const expense = scoped.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0)

  async function addRow(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || !form.category) return
    await db.table(table).add({
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
    await db.table(table).delete(id)
  }

  function clearFilters() {
    setSearch('')
    setTypeFilter('all')
    setCategoryFilter('all')
    setMonthFilter('all')
  }

  return (
    <div className="grid" style={{ gap: '1.25rem' }}>
      <section className="grid grid-3">
        <div className="panel stat">
          <span className="value" style={{ color: 'var(--ok)' }}>
            {formatMoney(income)}
          </span>
          <span className="label">הכנסות{monthFilter !== 'all' ? ` · ${monthFilter}` : ''}</span>
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
        <h2>{heading}</h2>
        {intro && <p className="muted">{intro}</p>}
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
          <button type="submit" className={`btn ${buttonClass}`}>
            <Icon icon={Plus} size={ICON_SIZE_SM} />
            הוספה
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="actions" style={{ marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, flex: 1 }}>
            יומן ({listCountLabel(filtered.length, rows?.length ?? 0)})
          </h3>
        </div>
        <div className="actions" style={{ marginBottom: '0.75rem' }}>
          <div className="field" style={{ flex: 1, minWidth: 220 }}>
            <label className="sr-only">חיפוש</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לפי קטגוריה / תיאור / סכום"
              aria-label="חיפוש כספים"
            />
          </div>
          <div className="field" style={{ minWidth: 160 }}>
            <label className="sr-only">סינון סוג</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              aria-label="סינון לפי סוג"
            >
              <option value="all">הכל</option>
              <option value="income">הכנסה</option>
              <option value="expense">הוצאה</option>
            </select>
          </div>
          <div className="field" style={{ minWidth: 180 }}>
            <label className="sr-only">סינון חודש</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              aria-label="סינון לפי חודש"
            >
              <option value="all">כל החודשים</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ minWidth: 200 }}>
            <label className="sr-only">סינון קטגוריה</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="סינון לפי קטגוריה"
            >
              <option value="all">כל הקטגוריות</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
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
              {filtered.map((r) => (
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
          <FilterEmpty
            sourceCount={rows?.length ?? 0}
            filteredCount={filtered.length}
            emptyLabel="אין רשומות."
            onClear={clearFilters}
          />
        </div>
      </section>
    </div>
  )
}
