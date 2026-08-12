import { useLiveQuery } from 'dexie-react-hooks'
import { IdCard, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon, ICON_SIZE_SM } from '../../components/icons'
import { db } from '../../db'
import { nowISO } from '../../utils/dates'

export function StudentsPage() {
  const students = useLiveQuery(() => db.students.orderBy('name').toArray(), [])
  const [name, setName] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentPhone, setParentPhone] = useState('')

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
        <h2>רשימה</h2>
        {!students?.length ? (
          <div className="empty">אין תלמידים.</div>
        ) : (
          <div className="list">
            {students.map((s) => (
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
        )}
      </section>
    </div>
  )
}
