import { useLiveQuery } from 'dexie-react-hooks'
import { IdCard, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon, ICON_SIZE_SM } from '../../components/icons'
import { db } from '../../db'
import { nowISO } from '../../utils/dates'

export function StudentsPage() {
  const students = useLiveQuery(() => db.students.toArray(), [])
  const [name, setName] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [search, setSearch] = useState('')
  const [parentFilter, setParentFilter] = useState<'all' | 'withParent' | 'noParent'>('all')

  const sorted = useMemo(() => {
    const rows = [...(students ?? [])]
    rows.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    return rows
  }, [students])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sorted.filter((s) => {
      const hasParent = !!(s.parentName || s.parentPhone)
      if (parentFilter === 'withParent' && !hasParent) return false
      if (parentFilter === 'noParent' && hasParent) return false

      if (!q) return true
      const hay = `${s.name} ${s.parentName ?? ''} ${s.parentPhone ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [sorted, search, parentFilter])

  async function addStudent(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await db.students.add({
      name: name.trim(),
      parentName: parentName.trim() || undefined,
      parentPhone: parentPhone.trim() || undefined,
      createdAt: nowISO(),
    })
    setName('')
    setParentName('')
    setParentPhone('')
  }

  return (
    <div className="grid" style={{ gap: '1.25rem' }}>
      <section className="panel">
        <h2>תלמיד חדש</h2>
        <form className="form" onSubmit={addStudent}>
          <div className="form-row">
            <div className="field">
              <label>שם</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label>הורה</label>
              <input
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
              />
            </div>
            <div className="field">
              <label>טלפון הורה</label>
              <input
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn chinuch">
            <Icon icon={Plus} size={ICON_SIZE_SM} />
            הוספה
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="actions" style={{ marginBottom: '0.75rem' }}>
          <h2 style={{ margin: 0, flex: 1 }}>רשימה ({filtered.length})</h2>
        </div>
        {!filtered.length ? (
          <div className="empty">אין תלמידים.</div>
        ) : (
          <>
            <div className="actions" style={{ marginBottom: '0.75rem' }}>
              <div className="field" style={{ flex: 1, minWidth: 220 }}>
                <label className="sr-only">חיפוש</label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="חיפוש לפי שם / הורה / טלפון"
                  aria-label="חיפוש תלמידים"
                />
              </div>
              <div className="field" style={{ minWidth: 220 }}>
                <label className="sr-only">סינון הורה</label>
                <select
                  value={parentFilter}
                  onChange={(e) => setParentFilter(e.target.value as typeof parentFilter)}
                  aria-label="סינון לפי הורה"
                >
                  <option value="all">הכל</option>
                  <option value="withParent">עם פרטי הורה</option>
                  <option value="noParent">ללא פרטי הורה</option>
                </select>
              </div>
            </div>

            <div className="list">
              {filtered.map((s) => (
              <Link key={s.id} to={`/chinuch/students/${s.id}`} className="list-item">
                <div className="stack-sm">
                  <strong>{s.name}</strong>
                  <div className="meta">
                    {s.parentName || 'ללא הורה'}
                    {s.parentPhone ? ` · ${s.parentPhone}` : ''}
                  </div>
                </div>
                <span className="btn small secondary">
                  <Icon icon={IdCard} size={ICON_SIZE_SM} />
                  כרטיס
                </span>
              </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
