import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { PriorityBadge, StatusBadge } from '../../components/Badges'
import { db } from '../../db'
import type { Priority } from '../../types'
import { formatDate, nowISO } from '../../utils/dates'

export function HomeTasksPage() {
  const tasks = useLiveQuery(async () => {
    const rows = await db.homeTasks.toArray()
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [filter, setFilter] = useState<'open' | 'done' | 'all'>('open')

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    await db.homeTasks.add({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
      priority,
      status: 'open',
      createdAt: nowISO(),
    })
    setTitle('')
    setDescription('')
    setDueDate('')
    setPriority('medium')
  }

  async function complete(id: number) {
    await db.homeTasks.update(id, { status: 'done', completedAt: nowISO() })
  }

  async function reopen(id: number) {
    await db.homeTasks.update(id, { status: 'open', completedAt: undefined })
  }

  async function remove(id: number) {
    if (!confirm('למחוק משימה?')) return
    await db.homeTasks.delete(id)
  }

  const filtered = (tasks ?? []).filter((t) => {
    if (filter === 'all') return true
    return t.status === filter
  })

  return (
    <div className="grid" style={{ gap: '1.25rem' }}>
      <section className="panel">
        <h2>משימת בית חדשה</h2>
        <form className="form" onSubmit={add}>
          <div className="form-row">
            <div className="field">
              <label>כותרת</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="field">
              <label>תאריך יעד</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
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
          <button type="submit" className="btn bayit">
            הוספה
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="actions" style={{ marginBottom: '0.75rem' }}>
          <h2 style={{ margin: 0, flex: 1 }}>משימות</h2>
          {(['open', 'done', 'all'] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`btn small ${filter === f ? '' : 'secondary'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'open' ? 'לעשות' : f === 'done' ? 'היסטוריה' : 'הכל'}
            </button>
          ))}
        </div>
        {!filtered.length ? (
          <div className="empty">אין משימות.</div>
        ) : (
          <div className="list">
            {filtered.map((t) => (
              <div key={t.id} className="list-item">
                <div className="stack-sm">
                  <strong>{t.title}</strong>
                  {t.description && <div className="meta">{t.description}</div>}
                  <div className="meta">
                    {t.dueDate ? formatDate(t.dueDate) : 'ללא תאריך'}
                  </div>
                </div>
                <div className="actions">
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                  {t.status === 'open' ? (
                    <button
                      type="button"
                      className="btn small bayit"
                      onClick={() => t.id != null && complete(t.id)}
                    >
                      בוצע
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn small secondary"
                      onClick={() => t.id != null && reopen(t.id)}
                    >
                      פתח מחדש
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn small ghost"
                    onClick={() => t.id != null && remove(t.id)}
                  >
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
