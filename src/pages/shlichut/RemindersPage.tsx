import { useLiveQuery } from 'dexie-react-hooks'
import { Check, History, List, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon, ICON_SIZE_SM } from '../../components/icons'
import { DateField } from '../../components/DateField'
import { PriorityBadge, StatusBadge } from '../../components/Badges'
import { db } from '../../db'
import type { Priority } from '../../types'
import { formatDate, nowISO, todayISO } from '../../utils/dates'

export function RemindersPage() {
  const reminders = useLiveQuery(
    () => db.reminders.where('module').equals('shlichut').reverse().sortBy('createdAt'),
    [],
  )
  const contacts = useLiveQuery(() => db.contacts.orderBy('name').toArray(), [])
  const activityTypes = useLiveQuery(() => db.activityTypes.toArray(), [])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [contactId, setContactId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [filter, setFilter] = useState<'open' | 'done' | 'all'>('open')

  async function addReminder(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    await db.reminders.add({
      title: title.trim(),
      description: description.trim() || undefined,
      contactId: contactId ? Number(contactId) : undefined,
      dueDate: dueDate || undefined,
      priority,
      status: 'open',
      module: 'shlichut',
      createdAt: nowISO(),
    })
    setTitle('')
    setDescription('')
    setContactId('')
    setDueDate('')
    setPriority('medium')
  }

  async function completeReminder(id: number) {
    const rem = await db.reminders.get(id)
    if (!rem || rem.status === 'done') return
    const completedAt = nowISO()
    await db.reminders.update(id, { status: 'done', completedAt })

    if (rem.contactId) {
      await db.contactActivityLogs.add({
        contactId: rem.contactId,
        kind: 'reminder',
        title: `תזכורת בוצעה: ${rem.title}`,
        details: rem.description,
        date: todayISO(),
        createdAt: completedAt,
      })

      const defaultType = activityTypes?.[0]
      if (defaultType?.id != null) {
        await db.activities.add({
          contactId: rem.contactId,
          activityTypeId: defaultType.id,
          date: todayISO(),
          notes: rem.title + (rem.description ? ` — ${rem.description}` : ''),
          reminderId: id,
          createdAt: completedAt,
        })
      }
    }
  }

  async function reopen(id: number) {
    await db.reminders.update(id, { status: 'open', completedAt: undefined })
  }

  async function remove(id: number) {
    if (!confirm('למחוק תזכורת?')) return
    await db.reminders.delete(id)
  }

  const contactName = (cid?: number) =>
    contacts?.find((c) => c.id === cid)?.name ?? 'ללא איש קשר'

  const filtered = (reminders ?? []).filter((r) => {
    if (filter === 'all') return true
    return r.status === filter
  })

  return (
    <div className="grid" style={{ gap: '1.25rem' }}>
      <section className="panel">
        <h2>תזכורת חדשה</h2>
        <form className="form" onSubmit={addReminder}>
          <div className="form-row">
            <div className="field">
              <label>כותרת</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="למשל: מזוזה / התוועדות בבית"
              />
            </div>
            <div className="field">
              <label>איש קשר</label>
              <select value={contactId} onChange={(e) => setContactId(e.target.value)}>
                <option value="">—</option>
                {(contacts ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <DateField
              label="תאריך יעד (אופציונלי)"
              value={dueDate}
              onChange={setDueDate}
            />
            <div className="field">
              <label>עדיפות</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                <option value="high">גבוהה</option>
                <option value="medium">בינונית</option>
                <option value="low">נמוכה</option>
              </select>
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
            <Icon icon={Plus} size={ICON_SIZE_SM} />
            הוספה
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="actions" style={{ marginBottom: '0.75rem' }}>
          <h2 style={{ margin: 0, flex: 1 }}>רשימה</h2>
          {(['open', 'done', 'all'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`btn small ${filter === f ? '' : 'secondary'}`}
              onClick={() => setFilter(f)}
            >
              <Icon
                icon={f === 'open' ? List : f === 'done' ? History : List}
                size={ICON_SIZE_SM}
              />
              {f === 'open' ? 'פתוחות' : f === 'done' ? 'היסטוריה' : 'הכל'}
            </button>
          ))}
        </div>
        {!filtered.length ? (
          <div className="empty">אין תזכורות להצגה.</div>
        ) : (
          <div className="list">
            {filtered.map((r) => (
              <div key={r.id} className="list-item">
                <div className="stack-sm">
                  <strong>{r.title}</strong>
                  <div className="meta">
                    {r.contactId ? (
                      <Link to={`/shlichut/contacts/${r.contactId}`}>
                        {contactName(r.contactId)}
                      </Link>
                    ) : (
                      contactName()
                    )}
                    {r.dueDate ? ` · ${formatDate(r.dueDate)}` : ''}
                  </div>
                  {r.description && <div className="meta">{r.description}</div>}
                </div>
                <div className="actions">
                  <PriorityBadge priority={r.priority} />
                  <StatusBadge status={r.status} />
                  {r.status === 'open' ? (
                    <button
                      type="button"
                      className="btn small shlichut"
                      onClick={() => r.id != null && completeReminder(r.id)}
                    >
                      <Icon icon={Check} size={ICON_SIZE_SM} />
                      בוצע
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn small secondary"
                      onClick={() => r.id != null && reopen(r.id)}
                    >
                      <Icon icon={RotateCcw} size={ICON_SIZE_SM} />
                      פתח מחדש
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn small ghost"
                    onClick={() => r.id != null && remove(r.id)}
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
    </div>
  )
}
