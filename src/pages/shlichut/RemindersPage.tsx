import { useLiveQuery } from 'dexie-react-hooks'
import { Check, History, List, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon, ICON_SIZE_SM } from '../../components/icons'
import { DateField } from '../../components/DateField'
import { FilterEmpty, listCountLabel } from '../../components/FilterEmpty'
import { PriorityBadge, StatusBadge } from '../../components/Badges'
import { db } from '../../db'
import type { Priority } from '../../types'
import { formatDate, isOverdue, nowISO } from '../../utils/dates'
import { completeReminder, reopenReminder, sortOpenItems } from '../../utils/reminders'

export function RemindersPage() {
  const reminders = useLiveQuery(
    () => db.reminders.where('module').equals('shlichut').toArray(),
    [],
  )
  const contacts = useLiveQuery(() => db.contacts.orderBy('name').toArray(), [])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [contactId, setContactId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [filter, setFilter] = useState<'open' | 'done' | 'all'>('open')
  const [search, setSearch] = useState('')
  const [contactFilter, setContactFilter] = useState<
    'all' | 'none' | number
  >('all')

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

  async function markDone(id: number) {
    await completeReminder(id)
  }

  async function reopen(id: number) {
    await reopenReminder(id)
  }

  async function remove(id: number) {
    if (!confirm('למחוק תזכורת?')) return
    await db.reminders.delete(id)
  }

  const contactById = useMemo(() => {
    const m = new Map<number, string>()
    for (const c of contacts ?? []) {
      if (c.id != null) m.set(c.id, c.name)
    }
    return m
  }, [contacts])

  const sorted = useMemo(() => {
    const rows = [...(reminders ?? [])]
    const open = sortOpenItems(rows.filter((r) => r.status === 'open'))
    const done = rows
      .filter((r) => r.status !== 'open')
      .sort((a, b) => (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt))
    return [...open, ...done]
  }, [reminders])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sorted.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false

      if (contactFilter !== 'all') {
        if (contactFilter === 'none') {
          if (r.contactId != null) return false
        } else {
          if (r.contactId !== contactFilter) return false
        }
      }

      if (!q) return true
      const cn =
        r.contactId != null ? contactById.get(r.contactId) ?? 'ללא איש קשר' : 'ללא איש קשר'
      const hay = `${r.title} ${r.description ?? ''} ${cn} ${r.dueDate ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [sorted, filter, search, contactFilter, contactById])

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
          <h2 style={{ margin: 0, flex: 1 }}>
            רשימה ({listCountLabel(filtered.length, reminders?.length ?? 0)})
          </h2>
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
        <div className="actions" style={{ marginBottom: '0.75rem' }}>
          <div className="field" style={{ flex: 1, minWidth: 220 }}>
            <label className="sr-only">חיפוש</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לפי כותרת / תיאור / איש קשר"
              aria-label="חיפוש תזכורות"
            />
          </div>
          <div className="field" style={{ minWidth: 220 }}>
            <label className="sr-only">סינון איש קשר</label>
            <select
              value={contactFilter}
              onChange={(e) => {
                const v = e.target.value
                if (v === 'all') setContactFilter('all')
                else if (v === 'none') setContactFilter('none')
                else setContactFilter(Number(v))
              }}
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
        </div>
        {!filtered.length ? (
          <FilterEmpty
            sourceCount={reminders?.length ?? 0}
            filteredCount={0}
            emptyLabel="אין תזכורות להצגה."
            onClear={() => {
              setSearch('')
              setFilter('open')
              setContactFilter('all')
            }}
          />
        ) : (
          <div className="list">
            {filtered.map((r) => (
              <div
                key={r.id}
                className={`list-item${r.status === 'open' && isOverdue(r.dueDate) ? ' is-overdue' : ''}`}
              >
                <div className="stack-sm">
                  <strong>{r.title}</strong>
                  <div className="meta">
                    {r.contactId ? (
                      <Link to={`/shlichut/contacts/${r.contactId}`}>
                        {contactById.get(r.contactId) ?? 'ללא איש קשר'}
                      </Link>
                    ) : (
                      'ללא איש קשר'
                    )}
                    {r.dueDate ? ` · ${formatDate(r.dueDate)}` : ''}
                    {r.status === 'open' && isOverdue(r.dueDate) ? ' · באיחור' : ''}
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
                      onClick={() => r.id != null && markDone(r.id)}
                      aria-label={`סמן תזכורת "${r.title}" כבוצעה`}
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
                    aria-label={`מחק תזכורת "${r.title}"`}
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
