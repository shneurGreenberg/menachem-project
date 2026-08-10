import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../../db'
import { formatDate, formatMoney, monthKey, nowISO, todayISO } from '../../utils/dates'

export function StatsPage() {
  const activities = useLiveQuery(() => db.activities.toArray(), [])
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
            <div className="field">
              <label>תאריך</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
              />
            </div>
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
