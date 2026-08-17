import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../db'
import { formatDate } from '../utils/dates'

export function SearchPage() {
  const [q, setQ] = useState('')
  const contacts = useLiveQuery(() => db.contacts.toArray(), [])
  const reminders = useLiveQuery(() => db.reminders.toArray(), [])
  const students = useLiveQuery(() => db.students.toArray(), [])
  const materials = useLiveQuery(() => db.lessonMaterials.toArray(), [])
  const homeTasks = useLiveQuery(() => db.homeTasks.toArray(), [])
  const plans = useLiveQuery(() => db.plans.toArray(), [])

  const needle = q.trim().toLowerCase()

  const results = useMemo(() => {
    if (needle.length < 2) {
      return {
        contacts: [],
        reminders: [],
        students: [],
        materials: [],
        homeTasks: [],
        plans: [],
      }
    }
    const match = (...parts: (string | undefined)[]) =>
      parts.join(' ').toLowerCase().includes(needle)

    return {
      contacts: (contacts ?? []).filter((c) =>
        match(c.name, c.address, c.phone, c.notes),
      ),
      reminders: (reminders ?? []).filter((r) =>
        match(r.title, r.description),
      ),
      students: (students ?? []).filter((s) =>
        match(s.name, s.parentName, s.parentPhone, s.phone, s.notes),
      ),
      materials: (materials ?? []).filter((m) =>
        match(m.title, m.content, m.notes, (m.tags ?? []).join(' ')),
      ),
      homeTasks: (homeTasks ?? []).filter((t) => match(t.title, t.description)),
      plans: (plans ?? []).filter((p) => match(p.title, p.description)),
    }
  }, [needle, contacts, reminders, students, materials, homeTasks, plans])

  const total =
    results.contacts.length +
    results.reminders.length +
    results.students.length +
    results.materials.length +
    results.homeTasks.length +
    results.plans.length

  return (
    <div className="grid" style={{ gap: '1.25rem' }}>
      <div className="page-header">
        <h1>חיפוש</h1>
        <p>אנשי קשר, תזכורות, תלמידים, חומרים, משימות ותוכניות.</p>
      </div>
      <section className="panel">
        <div className="field">
          <label className="sr-only">חיפוש כללי</label>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="לפחות שתי אותיות…"
            aria-label="חיפוש כללי"
          />
        </div>
      </section>

      {needle.length < 2 ? (
        <div className="empty">הקלידו כדי לחפש בכל האפליקציה.</div>
      ) : !total ? (
        <div className="empty">אין תוצאות ל«{q.trim()}».</div>
      ) : (
        <>
          {results.contacts.length > 0 && (
            <section className="panel">
              <h2>אנשי קשר</h2>
              <div className="list">
                {results.contacts.map((c) => (
                  <Link
                    key={c.id}
                    to={`/shlichut/contacts/${c.id}`}
                    className="list-item"
                  >
                    <div className="stack-sm">
                      <strong>{c.name}</strong>
                      <div className="meta">{c.address || c.phone || '—'}</div>
                    </div>
                    <span className="btn small secondary">כרטיס</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {results.reminders.length > 0 && (
            <section className="panel">
              <h2>תזכורות</h2>
              <div className="list">
                {results.reminders.map((r) => (
                  <Link
                    key={r.id}
                    to={
                      r.module === 'chinuch'
                        ? '/chinuch/tasks'
                        : r.module === 'bayit'
                          ? '/bayit/tasks'
                          : '/shlichut/reminders'
                    }
                    className="list-item"
                  >
                    <div className="stack-sm">
                      <strong>{r.title}</strong>
                      <div className="meta">
                        {r.status === 'done' ? 'בוצע' : 'פתוח'}
                        {r.dueDate ? ` · ${formatDate(r.dueDate)}` : ''}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {results.students.length > 0 && (
            <section className="panel">
              <h2>תלמידים</h2>
              <div className="list">
                {results.students.map((s) => (
                  <Link
                    key={s.id}
                    to={`/chinuch/students/${s.id}`}
                    className="list-item"
                  >
                    <strong>{s.name}</strong>
                    <span className="btn small secondary">כרטיס</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {results.plans.length > 0 && (
            <section className="panel">
              <h2>תוכניות שליחות</h2>
              <div className="list">
                {results.plans.map((p) => (
                  <Link
                    key={p.id}
                    to={`/shlichut/plans/${p.id}`}
                    className="list-item"
                  >
                    <strong>{p.title}</strong>
                    <span className="meta">{formatDate(p.targetDate)}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {results.materials.length > 0 && (
            <section className="panel">
              <h2>חומרי לימוד</h2>
              <div className="list">
                {results.materials.map((m) => (
                  <Link key={m.id} to="/chinuch/materials" className="list-item">
                    <strong>{m.title}</strong>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {results.homeTasks.length > 0 && (
            <section className="panel">
              <h2>משימות בית</h2>
              <div className="list">
                {results.homeTasks.map((t) => (
                  <Link key={t.id} to="/bayit/tasks" className="list-item">
                    <div className="stack-sm">
                      <strong>{t.title}</strong>
                      <div className="meta">
                        {t.status === 'done' ? 'בוצע' : 'פתוח'}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
