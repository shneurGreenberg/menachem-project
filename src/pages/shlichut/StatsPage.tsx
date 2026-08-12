import { useLiveQuery } from 'dexie-react-hooks'
import { ClipboardList } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Icon, ICON_SIZE_SM } from '../../components/icons'
import { DateField } from '../../components/DateField'
import { db } from '../../db'
import { formatDate, formatMoney, monthKey, nowISO, todayISO } from '../../utils/dates'

export function StatsPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [contactFilter, setContactFilter] = useState<string>('all') // includes "none"
  const [monthFilter, setMonthFilter] = useState<string>('all') // YYYY-MM

  const types = useLiveQuery(() => db.activityTypes.toArray(), [])
  const contacts = useLiveQuery(() => db.contacts.toArray(), [])

  const [form, setForm] = useState({
    activityTypeId: '',
    contactId: '',
    date: todayISO(),
    participants: '',
    cost: '',
    notes: '',
    improvementNotes: '',
  })

  const typeName = (id: number) => types?.find((t) => t.id === id)?.name ?? '?'
  const contactName = (id?: number) =>
    id ? (contacts?.find((c) => c.id === id)?.name ?? '?') : '—'

  const monthOptions = useMemo(() => {
    const opts: string[] = []
    const now = new Date()
    for (let i = 0; i < 18; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      opts.push(`${y}-${m}`)
    }
    return opts
  }, [])

  const activities = useLiveQuery(() => {
    // Keep the query indexed using the best available filter first.
    const resolvedMonth = monthFilter !== 'all' ? monthFilter : null
    const resolvedType = typeFilter !== 'all' ? Number(typeFilter) : null
    const resolvedContact =
      contactFilter === 'all'
        ? null
        : contactFilter === 'none'
          ? null
          : Number(contactFilter)

    const wantsNoContact = contactFilter === 'none'

    let coll: any = db.activities

    if (resolvedMonth) {
      const [yS, mS] = resolvedMonth.split('-')
      const y = Number(yS)
      const m = Number(mS)
      const start = `${y}-${String(m).padStart(2, '0')}-01`
      const endExclDate = new Date(y, m, 1) // next month
      const endExcl = endExclDate.toISOString().slice(0, 10)
      coll = coll.where('date').between(start, endExcl, true, false)
    } else if (resolvedType != null) {
      coll = coll.where('activityTypeId').equals(resolvedType)
    } else if (resolvedContact != null) {
      coll = coll.where('contactId').equals(resolvedContact)
    }

    if (resolvedType != null) {
      coll = coll.filter((a: any) => a.activityTypeId === resolvedType)
    }
    if (wantsNoContact) {
      coll = coll.filter((a: any) => a.contactId == null)
    } else if (resolvedContact != null) {
      coll = coll.filter((a: any) => a.contactId === resolvedContact)
    }

    if (resolvedMonth && typeFilter === 'all' && contactFilter === 'all') {
      // nothing else to filter; avoids extra .filter overhead
    }

    return coll.toArray()
  }, [typeFilter, contactFilter, monthFilter])

  const byType = new Map<number, number>()
  const byMonth = new Map<string, number>()
  const byYear = new Map<string, number>()
  for (const a of activities ?? []) {
    byType.set(a.activityTypeId, (byType.get(a.activityTypeId) ?? 0) + 1)
    const mk = monthKey(a.date)
    byMonth.set(mk, (byMonth.get(mk) ?? 0) + 1)
    const y = a.date.slice(0, 4)
    byYear.set(y, (byYear.get(y) ?? 0) + 1)
  }

  async function addActivity(e: React.FormEvent) {
    e.preventDefault()
    if (!form.activityTypeId) return
    const createdAt = nowISO()
    const activityId = await db.activities.add({
      activityTypeId: Number(form.activityTypeId),
      contactId: form.contactId ? Number(form.contactId) : undefined,
      date: form.date,
      participants: form.participants ? Number(form.participants) : undefined,
      cost: form.cost ? Number(form.cost) : undefined,
      notes: form.notes.trim() || undefined,
      improvementNotes: form.improvementNotes.trim() || undefined,
      createdAt,
    })

    if (form.contactId) {
      await db.contactActivityLogs.add({
        contactId: Number(form.contactId),
        kind: 'activity',
        title: typeName(Number(form.activityTypeId)),
        details: form.notes.trim() || undefined,
        date: form.date,
        createdAt,
      })
    }
    void activityId
    setForm({
      activityTypeId: '',
      contactId: '',
      date: todayISO(),
      participants: '',
      cost: '',
      notes: '',
      improvementNotes: '',
    })
  }

  return (
    <div className="grid" style={{ gap: '1.25rem' }}>
      <section className="panel">
        <h2 style={{ marginBottom: '0.75rem' }}>סינון</h2>
        <div className="actions" style={{ marginBottom: '0.75rem' }}>
          <div className="field" style={{ minWidth: 220, flex: 1 }}>
            <label className="sr-only">סינון לפי סוג</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="סינון לפי סוג פעילות"
            >
              <option value="all">כל הסוגים</option>
              {(types ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ minWidth: 220, flex: 1 }}>
            <label className="sr-only">סינון לפי איש קשר</label>
            <select
              value={contactFilter}
              onChange={(e) => setContactFilter(e.target.value)}
              aria-label="סינון לפי איש קשר"
            >
              <option value="all">כל אנשי הקשר</option>
              <option value="none">ללא איש קשר</option>
              {(contacts ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ minWidth: 220, flex: 1 }}>
            <label className="sr-only">סינון לפי חודש ושנה</label>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              aria-label="סינון לפי חודש ושנה"
            >
              <option value="all">כל התקופות</option>
              {monthOptions.map((mk) => (
                <option key={mk} value={mk}>
                  {mk.replace('-', '/')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>רישום פעילות</h2>
        <form className="form" onSubmit={addActivity}>
          <div className="form-row">
            <div className="field">
              <label>סוג</label>
              <select
                required
                value={form.activityTypeId}
                onChange={(e) =>
                  setForm((s) => ({ ...s, activityTypeId: e.target.value }))
                }
              >
                <option value="">—</option>
                {(types ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>איש קשר</label>
              <select
                value={form.contactId}
                onChange={(e) =>
                  setForm((s) => ({ ...s, contactId: e.target.value }))
                }
              >
                <option value="">—</option>
                {(contacts ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <DateField label="תאריך" value={form.date} onChange={(date) => setForm((s) => ({ ...s, date }))} required />
            <div className="field">
              <label>משתתפים</label>
              <input
                type="number"
                min={0}
                value={form.participants}
                onChange={(e) =>
                  setForm((s) => ({ ...s, participants: e.target.value }))
                }
              />
            </div>
            <div className="field">
              <label>עלות</label>
              <input
                type="number"
                min={0}
                value={form.cost}
                onChange={(e) => setForm((s) => ({ ...s, cost: e.target.value }))}
              />
            </div>
          </div>
          <div className="field">
            <label>הערות</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>הערות שיפור</label>
            <textarea
              value={form.improvementNotes}
              onChange={(e) =>
                setForm((s) => ({ ...s, improvementNotes: e.target.value }))
              }
            />
          </div>
          <button type="submit" className="btn shlichut">
            <Icon icon={ClipboardList} size={ICON_SIZE_SM} />
            רישום
          </button>
        </form>
      </section>

      <section className="grid grid-3">
        <div className="panel">
          <h3>לפי סוג</h3>
          <div className="list">
            {[...byType.entries()].map(([id, count]) => (
              <div key={id} className="list-item">
                <span>{typeName(id)}</span>
                <strong>{count}</strong>
              </div>
            ))}
            {!byType.size && <div className="empty">אין נתונים</div>}
          </div>
        </div>
        <div className="panel">
          <h3>לפי חודש</h3>
          <div className="list">
            {[...byMonth.entries()]
              .sort((a, b) => b[0].localeCompare(a[0]))
              .slice(0, 8)
              .map(([m, count]) => (
                <div key={m} className="list-item">
                  <span>{m}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            {!byMonth.size && <div className="empty">אין נתונים</div>}
          </div>
        </div>
        <div className="panel">
          <h3>לפי שנה</h3>
          <div className="list">
            {[...byYear.entries()]
              .sort((a, b) => b[0].localeCompare(a[0]))
              .map(([y, count]) => (
                <div key={y} className="list-item">
                  <span>{y}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            {!byYear.size && <div className="empty">אין נתונים</div>}
          </div>
        </div>
      </section>

      <section className="panel">
        <h3>סיכומי פעילות אחרונים</h3>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>תאריך</th>
                <th>סוג</th>
                <th>איש קשר</th>
                <th>משתתפים</th>
                <th>עלות</th>
                <th>הערות</th>
              </tr>
            </thead>
            <tbody>
              {[...(activities ?? [])]
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 30)
                .map((a) => (
                  <tr key={a.id}>
                    <td>{formatDate(a.date)}</td>
                    <td>{typeName(a.activityTypeId)}</td>
                    <td>{contactName(a.contactId)}</td>
                    <td>{a.participants ?? '—'}</td>
                    <td>{a.cost != null ? formatMoney(a.cost) : '—'}</td>
                    <td>{a.notes || a.improvementNotes || '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {!activities?.length && <div className="empty">אין פעילויות.</div>}
        </div>
      </section>
    </div>
  )
}
