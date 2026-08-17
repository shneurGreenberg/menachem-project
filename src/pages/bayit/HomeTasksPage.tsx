import { useLiveQuery } from 'dexie-react-hooks'
import { Check, History, List, Pencil, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { CollapsibleAdd } from '../../components/CollapsibleAdd'
import { Icon, ICON_SIZE_SM } from '../../components/icons'
import { DateField } from '../../components/DateField'
import { FilterEmpty, listCountLabel } from '../../components/FilterEmpty'
import { PriorityBadge, StatusBadge } from '../../components/Badges'
import { db } from '../../db'
import type { Priority } from '../../types'
import { formatDate, isOverdue, nowISO } from '../../utils/dates'
import { sortOpenItems } from '../../utils/reminders'

export function HomeTasksPage() {
  const tasks = useLiveQuery(() => db.homeTasks.toArray(), [])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [editId, setEditId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [filter, setFilter] = useState<'open' | 'done' | 'all'>('open')
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all')
  const formRef = useRef<HTMLDivElement>(null)

  function resetForm() {
    setEditId(null)
    setTitle('')
    setDescription('')
    setDueDate('')
    setPriority('medium')
  }

  function startEdit(id: number) {
    const t = (tasks ?? []).find((x) => x.id === id)
    if (!t) return
    setEditId(id)
    setTitle(t.title)
    setDescription(t.description ?? '')
    setDueDate(t.dueDate ?? '')
    setPriority(t.priority)
    setFormOpen(true)
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
      priority,
    }
    if (editId != null) {
      const existing = await db.homeTasks.get(editId)
      if (existing) await db.homeTasks.put({ ...existing, ...payload })
    } else {
      await db.homeTasks.add({
        ...payload,
        status: 'open',
        createdAt: nowISO(),
      })
    }
    resetForm()
    setFormOpen(false)
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rows = (tasks ?? []).filter((t) => {
      if (filter !== 'all' && t.status !== filter) return false
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false

      if (!q) return true
      const hay = `${t.title} ${t.description ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
    const open = sortOpenItems(rows.filter((t) => t.status === 'open'))
    const done = rows
      .filter((t) => t.status !== 'open')
      .sort((a, b) => (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt))
    return filter === 'done' ? done : filter === 'open' ? open : [...open, ...done]
  }, [tasks, filter, priorityFilter, search])

  return (
    <div className="grid" style={{ gap: '1.25rem' }}>
      <section className="panel">
        <div className="actions" style={{ marginBottom: '0.75rem' }}>
          <h2 style={{ margin: 0, flex: 1 }}>
            משימות ({listCountLabel(filtered.length, tasks?.length ?? 0)})
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
              {f === 'open' ? 'לעשות' : f === 'done' ? 'היסטוריה' : 'הכל'}
            </button>
          ))}
        </div>
        <div className="actions" style={{ marginBottom: '0.75rem' }}>
          <div className="field" style={{ flex: 1, minWidth: 220 }}>
            <label className="sr-only">חיפוש</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לפי כותרת / תיאור"
              aria-label="חיפוש משימות"
            />
          </div>
          <div className="field" style={{ minWidth: 220 }}>
            <label className="sr-only">סינון עדיפות</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
              aria-label="סינון לפי עדיפות"
            >
              <option value="all">כל העדיפויות</option>
              <option value="high">גבוהה</option>
              <option value="medium">בינונית</option>
              <option value="low">נמוכה</option>
            </select>
          </div>
        </div>
        {!filtered.length ? (
          <FilterEmpty
            sourceCount={tasks?.length ?? 0}
            filteredCount={0}
            emptyLabel="אין משימות."
            onClear={() => {
              setSearch('')
              setFilter('open')
              setPriorityFilter('all')
            }}
          />
        ) : (
          <div className="list">
            {filtered.map((t) => (
              <div
                key={t.id}
                className={`list-item${t.status === 'open' && isOverdue(t.dueDate) ? ' is-overdue' : ''}`}
              >
                <div className="stack-sm">
                  <strong>{t.title}</strong>
                  {t.description && <div className="meta">{t.description}</div>}
                  <div className="meta">
                    {t.dueDate ? formatDate(t.dueDate) : 'ללא תאריך'}
                    {t.status === 'open' && isOverdue(t.dueDate) ? ' · באיחור' : ''}
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
                      <Icon icon={Check} size={ICON_SIZE_SM} />
                      בוצע
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn small secondary"
                      onClick={() => t.id != null && reopen(t.id)}
                    >
                      <Icon icon={RotateCcw} size={ICON_SIZE_SM} />
                      פתח מחדש
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn small secondary"
                    onClick={() => t.id != null && startEdit(t.id)}
                    aria-label={`ערוך משימה "${t.title}"`}
                  >
                    <Icon icon={Pencil} size={ICON_SIZE_SM} />
                    עריכה
                  </button>
                  <button
                    type="button"
                    className="btn small ghost"
                    onClick={() => t.id != null && remove(t.id)}
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

      <div ref={formRef}>
      <CollapsibleAdd
        title={editId != null ? 'עריכת משימה' : 'משימת בית חדשה'}
        buttonLabel="הוספת משימה"
        buttonClass="bayit"
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) resetForm()
        }}
      >
        <form className="form" onSubmit={save}>
          <div className="form-row">
            <div className="field">
              <label>כותרת</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <DateField label="תאריך יעד" value={dueDate} onChange={setDueDate} />
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
            <Icon icon={editId != null ? Save : Plus} size={ICON_SIZE_SM} />
            {editId != null ? 'שמירת שינויים' : 'הוספה'}
          </button>
        </form>
      </CollapsibleAdd>
      </div>
    </div>
  )
}
