import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { SaveBar } from '../../components/SaveBar'
import { db } from '../../db'
import { useSaveFeedback } from '../../hooks/useSaveFeedback'
import { formatDate, todayISO } from '../../utils/dates'

export function StudentDetailPage() {
  const { id } = useParams()
  const studentId = Number(id)
  const navigate = useNavigate()

  const student = useLiveQuery(async () => {
    if (!Number.isFinite(studentId)) return null
    return (await db.students.get(studentId)) ?? null
  }, [studentId])
  const grades = useLiveQuery(
    () => db.grades.where('studentId').equals(studentId).reverse().sortBy('date'),
    [studentId],
  )

  const [form, setForm] = useState({
    name: '',
    phone: '',
    parentName: '',
    parentPhone: '',
    notes: '',
    topicsLearned: '',
  })
  const [gradeForm, setGradeForm] = useState({
    subject: '',
    score: '',
    maxScore: '100',
    date: todayISO(),
    notes: '',
  })
  const [baseline, setBaseline] = useState('')
  const { saving, saved, runSave } = useSaveFeedback()

  const formSnapshot = useMemo(() => JSON.stringify(form), [form])
  const dirty = baseline !== '' && formSnapshot !== baseline

  useEffect(() => {
    if (!student) return
    const initial = {
      name: student.name,
      phone: student.phone ?? '',
      parentName: student.parentName ?? '',
      parentPhone: student.parentPhone ?? '',
      notes: student.notes ?? '',
      topicsLearned: student.topicsLearned ?? '',
    }
    setForm(initial)
    setBaseline(JSON.stringify(initial))
  }, [student])

  if (!Number.isFinite(studentId)) {
    return <div className="empty">מזהה לא תקין</div>
  }
  if (student === undefined) return <div className="empty">טוען…</div>
  if (student === null) {
    return (
      <div className="empty">
        תלמיד לא נמצא. <Link to="/chinuch/students">חזרה</Link>
      </div>
    )
  }

  async function save(e?: React.FormEvent) {
    e?.preventDefault()
    await runSave(async () => {
      await db.students.update(studentId, {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        parentName: form.parentName.trim() || undefined,
        parentPhone: form.parentPhone.trim() || undefined,
        notes: form.notes.trim() || undefined,
        topicsLearned: form.topicsLearned.trim() || undefined,
      })
      setBaseline(formSnapshot)
    })
  }

  async function addGrade(e: React.FormEvent) {
    e.preventDefault()
    if (!gradeForm.subject || !gradeForm.score) return
    await db.grades.add({
      studentId,
      subject: gradeForm.subject.trim(),
      score: Number(gradeForm.score),
      maxScore: Number(gradeForm.maxScore) || 100,
      date: gradeForm.date,
      notes: gradeForm.notes.trim() || undefined,
    })
    setGradeForm({
      subject: '',
      score: '',
      maxScore: '100',
      date: todayISO(),
      notes: '',
    })
  }

  async function remove() {
    if (!confirm('למחוק תלמיד וציונים?')) return
    await db.transaction('rw', db.students, db.grades, async () => {
      await db.grades.where('studentId').equals(studentId).delete()
      await db.students.delete(studentId)
    })
    navigate('/chinuch/students')
  }

  return (
    <div className="grid" style={{ gap: '1.25rem' }}>
      <div className="actions">
        <Link to="/chinuch/students" className="btn secondary small">
          ← חזרה
        </Link>
        <button type="button" className="btn danger small" onClick={remove}>
          מחיקה
        </button>
      </div>

      <section className="panel">
        <h2>{form.name}</h2>
        <form className="form" onSubmit={save}>
          <div className="form-row">
            <div className="field">
              <label>שם</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>טלפון</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>הורה</label>
              <input
                value={form.parentName}
                onChange={(e) =>
                  setForm((s) => ({ ...s, parentName: e.target.value }))
                }
              />
            </div>
            <div className="field">
              <label>טלפון הורה</label>
              <input
                value={form.parentPhone}
                onChange={(e) =>
                  setForm((s) => ({ ...s, parentPhone: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="field">
            <label>מה למד</label>
            <textarea
              value={form.topicsLearned}
              onChange={(e) =>
                setForm((s) => ({ ...s, topicsLearned: e.target.value }))
              }
            />
          </div>
          <div className="field">
            <label>הערות אישיות</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
            />
          </div>
          <button type="submit" className="btn chinuch">
            שמירה
          </button>
        </form>
      </section>

      <SaveBar
        dirty={dirty}
        saving={saving}
        saved={saved}
        onSave={() => void save()}
        variant="chinuch"
      />

      <section className="panel">
        <h3>ציונים</h3>
        <form className="form" onSubmit={addGrade} style={{ marginBottom: '1rem' }}>
          <div className="form-row">
            <div className="field">
              <label>נושא</label>
              <input
                required
                value={gradeForm.subject}
                onChange={(e) =>
                  setGradeForm((s) => ({ ...s, subject: e.target.value }))
                }
              />
            </div>
            <div className="field">
              <label>ציון</label>
              <input
                type="number"
                required
                value={gradeForm.score}
                onChange={(e) =>
                  setGradeForm((s) => ({ ...s, score: e.target.value }))
                }
              />
            </div>
            <div className="field">
              <label>מתוך</label>
              <input
                type="number"
                value={gradeForm.maxScore}
                onChange={(e) =>
                  setGradeForm((s) => ({ ...s, maxScore: e.target.value }))
                }
              />
            </div>
            <div className="field">
              <label>תאריך</label>
              <input
                type="date"
                value={gradeForm.date}
                onChange={(e) =>
                  setGradeForm((s) => ({ ...s, date: e.target.value }))
                }
              />
            </div>
          </div>
          <button type="submit" className="btn secondary small">
            הוספת ציון
          </button>
        </form>
        <div className="list">
          {[...(grades ?? [])].reverse().map((g) => (
            <div key={g.id} className="list-item">
              <div className="stack-sm">
                <strong>
                  {g.subject}: {g.score}/{g.maxScore}
                </strong>
                <div className="meta">{formatDate(g.date)}</div>
              </div>
            </div>
          ))}
          {!grades?.length && <div className="empty">אין ציונים.</div>}
        </div>
      </section>
    </div>
  )
}
