import { useLiveQuery } from 'dexie-react-hooks'
import { Check, History, List, Pencil, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon, ICON_SIZE_SM } from '../../components/icons'
import { CollapsibleAdd } from '../../components/CollapsibleAdd'
import { DateField } from '../../components/DateField'
import { FilterEmpty, listCountLabel } from '../../components/FilterEmpty'
import { PriorityBadge, StatusBadge } from '../../components/Badges'
import { db } from '../../db'
import type { ModuleId, Priority, RepeatKind } from '../../types'
import { formatDate, isOverdue, nowISO } from '../../utils/dates'
import {
  completeReminder,
  reopenReminder,
  repeatLabel,
  sortOpenItems,
} from '../../utils/reminders'

type PeopleKind = 'contact' | 'student' | 'none'

const NOUNS = {
  shlichut: {
    newTitle: 'תזכורת חדשה',
    editTitle: 'עריכת תזכורת',
    add: 'הוספת תזכורת',
    empty: 'אין תזכורות להצגה.',
    placeholder: 'למשל: מזוזה / התוועדות בבית',
  },
  chinuch: {
    newTitle: 'משימה חדשה',
    editTitle: 'עריכת משימה',
    add: 'הוספת משימה',
    empty: 'אין משימות להצגה.',
    placeholder: 'למשל: שיעור / מעקב אחרי תלמיד',
  },
} as const

interface RemindersPageProps {
  module?: Extract<ModuleId, 'shlichut' | 'chinuch'>
  people?: PeopleKind
}

export function RemindersPage({
  module = 'shlichut',
  people = module === 'chinuch' ? 'student' : 'contact',
}: RemindersPageProps) {
  const variant = module === 'chinuch' ? 'chinuch' : 'shlichut'
  const noun = NOUNS[variant]
  const reminders = useLiveQuery(
    () => db.reminders.where('module').equals(module).toArray(),
    [module],
  )
  const contacts = useLiveQuery(() => db.contacts.orderBy('name').toArray(), [])
  const students = useLiveQuery(() => db.students.orderBy('name').toArray(), [])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [personId, setPersonId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [repeat, setRepeat] = useState<RepeatKind>('none')
  const [editId, setEditId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [filter, setFilter] = useState<'open' | 'done' | 'all'>('open')
  const [search, setSearch] = useState('')
  const [personFilter, setPersonFilter] = useState<'all' | 'none' | number>('all')
  const formRef = useRef<HTMLDivElement>(null)

  function resetForm() {
    setEditId(null)
    setTitle('')
    setDescription('')
    setPersonId('')
    setDueDate('')
    setPriority('medium')
    setRepeat('none')
  }

  function startEdit(id: number) {
    const r = (reminders ?? []).find((x) => x.id === id)
    if (!r) return
    setEditId(id)
    setTitle(r.title)
    setDescription(r.description ?? '')
    setPersonId(
      people === 'student'
        ? r.studentId != null
          ? String(r.studentId)
          : ''
        : r.contactId != null
          ? String(r.contactId)
          : '',
    )
    setDueDate(r.dueDate ?? '')
    setPriority(r.priority)
    setRepeat(r.repeat ?? 'none')
    setFormOpen(true)
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  async function saveReminder(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      contactId:
        people === 'contact' && personId ? Number(personId) : undefined,
      studentId:
        people === 'student' && personId ? Number(personId) : undefined,
      dueDate: dueDate || undefined,
      priority,
      repeat: repeat === 'none' ? undefined : repeat,
    }
    if (editId != null) {
      const existing = await db.reminders.get(editId)
      if (existing) await db.reminders.put({ ...existing, ...payload })
    } else {
      await db.reminders.add({
        ...payload,
        status: 'open',
        module,
        createdAt: nowISO(),
      })
    }
    resetForm()
    setFormOpen(false)
  }

  async function markDone(id: number) {
    await completeReminder(id)
  }

  async function reopen(id: number) {
    await reopenReminder(id)
  }

  async function remove(id: number) {
    if (!confirm(module === 'chinuch' ? 'למחוק משימה?' : 'למחוק תזכורת?')) return
    await db.reminders.delete(id)
  }

  const personById = useMemo(() => {
    const m = new Map<number, string>()
    if (people === 'contact') {
      for (const c of contacts ?? []) {
        if (c.id != null) m.set(c.id, c.name)
      }
    } else if (people === 'student') {
      for (const s of students ?? []) {
        if (s.id != null) m.set(s.id, s.name)
      }
    }
    return m
  }, [people, contacts, students])

  const peopleRows = people === 'student' ? students : contacts
  const noneLabel = people === 'student' ? 'ללא תלמיד' : 'ללא איש קשר'
  const allLabel = people === 'student' ? 'כל התלמידים' : 'כל אנשי הקשר'
  const personHref = (id: number) =>
    people === 'student' ? `/chinuch/students/${id}` : `/shlichut/contacts/${id}`

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
      const linkedId = people === 'student' ? r.studentId : r.contactId

      if (people !== 'none' && personFilter !== 'all') {
        if (personFilter === 'none') {
          if (linkedId != null) return false
        } else if (linkedId !== personFilter) {
          return false
        }
      }

      if (!q) return true
      const pn = linkedId != null ? personById.get(linkedId) ?? noneLabel : noneLabel
      const hay = `${r.title} ${r.description ?? ''} ${pn} ${r.dueDate ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [sorted, filter, search, personFilter, personById, people, noneLabel])

  return (
    <div className="grid" style={{ gap: '1.25rem' }}>
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
              placeholder="חיפוש לפי כותרת / תיאור"
              aria-label="חיפוש"
            />
          </div>
          {people !== 'none' && (
            <div className="field" style={{ minWidth: 220 }}>
              <label className="sr-only">סינון</label>
              <select
                value={personFilter}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === 'all') setPersonFilter('all')
                  else if (v === 'none') setPersonFilter('none')
                  else setPersonFilter(Number(v))
                }}
                aria-label="סינון לפי אדם"
              >
                <option value="all">{allLabel}</option>
                <option value="none">{noneLabel}</option>
                {(peopleRows ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        {!filtered.length ? (
          <FilterEmpty
            sourceCount={reminders?.length ?? 0}
            filteredCount={0}
            emptyLabel={noun.empty}
            onClear={() => {
              setSearch('')
              setFilter('open')
              setPersonFilter('all')
            }}
          />
        ) : (
          <div className="list">
            {filtered.map((r) => {
              const linkedId = people === 'student' ? r.studentId : r.contactId
              return (
                <div
                  key={r.id}
                  className={`list-item${r.status === 'open' && isOverdue(r.dueDate) ? ' is-overdue' : ''}`}
                >
                  <div className="stack-sm">
                    <strong>{r.title}</strong>
                    <div className="meta">
                      {people !== 'none' &&
                        (linkedId ? (
                          <Link to={personHref(linkedId)}>
                            {personById.get(linkedId) ?? noneLabel}
                          </Link>
                        ) : (
                          noneLabel
                        ))}
                      {people !== 'none' && (r.dueDate || repeatLabel(r.repeat)) ? ' · ' : ''}
                      {r.dueDate ? formatDate(r.dueDate) : ''}
                      {repeatLabel(r.repeat) ? ` · ${repeatLabel(r.repeat)}` : ''}
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
                        className={`btn small ${variant}`}
                        onClick={() => r.id != null && markDone(r.id)}
                        aria-label={`סמן "${r.title}" כבוצע`}
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
                      className="btn small secondary"
                      onClick={() => r.id != null && startEdit(r.id)}
                      aria-label={`ערוך "${r.title}"`}
                    >
                      <Icon icon={Pencil} size={ICON_SIZE_SM} />
                      עריכה
                    </button>
                    <button
                      type="button"
                      className="btn small ghost"
                      onClick={() => r.id != null && remove(r.id)}
                      aria-label={`מחק "${r.title}"`}
                    >
                      <Icon icon={Trash2} size={ICON_SIZE_SM} />
                      מחק
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <div ref={formRef}>
        <CollapsibleAdd
          title={editId != null ? noun.editTitle : noun.newTitle}
          buttonLabel={noun.add}
          buttonClass={variant}
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open)
            if (!open) resetForm()
          }}
        >
          <form className="form" onSubmit={saveReminder}>
            <div className="form-row">
              <div className="field">
                <label>כותרת</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={noun.placeholder}
                />
              </div>
              {people !== 'none' && (
                <div className="field">
                  <label>{people === 'student' ? 'תלמיד' : 'איש קשר'}</label>
                  <select value={personId} onChange={(e) => setPersonId(e.target.value)}>
                    <option value="">—</option>
                    {(peopleRows ?? []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
              <div className="field">
                <label>חזרה</label>
                <select
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value as RepeatKind)}
                >
                  <option value="none">חד־פעמית</option>
                  <option value="weekly">כל שבוע</option>
                  <option value="monthly">כל חודש</option>
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
            <button type="submit" className={`btn ${variant}`}>
              <Icon icon={editId != null ? Save : Plus} size={ICON_SIZE_SM} />
              {editId != null ? 'שמירת שינויים' : 'הוספה'}
            </button>
          </form>
        </CollapsibleAdd>
      </div>
    </div>
  )
}

export function ChinuchTasksPage() {
  return <RemindersPage module="chinuch" people="student" />
}
