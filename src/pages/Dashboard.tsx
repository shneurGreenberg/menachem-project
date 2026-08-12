import { useLiveQuery } from 'dexie-react-hooks'
import {
  Check,
  Calendar,
  ExternalLink,
  GraduationCap,
  HeartHandshake,
  Home,
  RotateCcw,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PriorityBadge, StatusBadge } from '../components/Badges'
import { Icon, ICON_SIZE_LG, ICON_SIZE_SM } from '../components/icons'
import { db, getSetting } from '../db'
import {
  daysUntil,
  formatDate,
  nowISO,
  nextAnniversary,
  todayISO,
  priorityWeight,
} from '../utils/dates'

export function Dashboard() {
  const [leadDays, setLeadDays] = useState(45)

  useEffect(() => {
    getSetting('planResurfaceLeadDays', '45').then((v) =>
      setLeadDays(Number(v) || 45),
    )
  }, [])

  const reminders = useLiveQuery(
    () => db.reminders.where('status').equals('open').toArray(),
    [],
  )
  const homeTasks = useLiveQuery(
    () => db.homeTasks.where('status').equals('open').toArray(),
    [],
  )
  const doneReminders = useLiveQuery(
    () => db.reminders.where('status').equals('done').toArray(),
    [],
  )
  const doneHomeTasks = useLiveQuery(
    () => db.homeTasks.where('status').equals('done').toArray(),
    [],
  )
  const plans = useLiveQuery(() => db.plans.toArray(), [])
  const summaries = useLiveQuery(() => db.planSummaries.toArray(), [])
  const activityTypes = useLiveQuery(() => db.activityTypes.toArray(), [])
  const contacts = useLiveQuery(() => db.contacts.count(), [])
  const students = useLiveQuery(() => db.students.count(), [])

  const openReminders = [...(reminders ?? [])].sort((a, b) => {
    const pw = priorityWeight(a.priority) - priorityWeight(b.priority)
    if (pw !== 0) return pw
    const ad = a.dueDate ?? '9999'
    const bd = b.dueDate ?? '9999'
    const dateCmp = ad.localeCompare(bd)
    if (dateCmp !== 0) return dateCmp
    return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
  })

  const openHome = [...(homeTasks ?? [])].sort((a, b) => {
    const pw = priorityWeight(a.priority) - priorityWeight(b.priority)
    if (pw !== 0) return pw
    const dateCmp = (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')
    if (dateCmp !== 0) return dateCmp
    return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
  })

  const recentDoneReminders = [...(doneReminders ?? [])]
    .sort((a, b) => (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt))
    .slice(0, 6)

  const recentDoneHomeTasks = [...(doneHomeTasks ?? [])]
    .sort((a, b) => (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt))
    .slice(0, 6)

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
          notes:
            rem.title + (rem.description ? ` — ${rem.description}` : ''),
          reminderId: id,
          createdAt: completedAt,
        })
      }
    }
  }

  async function reopenReminder(id: number) {
    await db.reminders.update(id, { status: 'open', completedAt: undefined })
  }

  async function completeHomeTask(id: number) {
    await db.homeTasks.update(id, { status: 'done', completedAt: nowISO() })
  }

  async function reopenHomeTask(id: number) {
    await db.homeTasks.update(id, { status: 'open', completedAt: undefined })
  }

  const yearAlerts =
    plans
      ?.map((plan) => {
        const next = nextAnniversary(plan.targetDate)
        const days = daysUntil(next)
        if (days < 0 || days > leadDays) return null
        const related = (summaries ?? []).filter((s) => s.planId === plan.id)
        if (!related.length && plan.status === 'active') {
          // still show upcoming plans without summary if within window
        }
        return { plan, next, days, related }
      })
      .filter(Boolean) ?? []

  const today = todayISO()
  const weekEnd = new Date()
  weekEnd.setDate(weekEnd.getDate() + 7)
  const weekISO = weekEnd.toISOString().slice(0, 10)

  const monthStart = new Date()
  monthStart.setDate(1)
  const monthStartISO = monthStart.toISOString().slice(0, 10)
  const nextMonth = new Date(monthStart)
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  const nextMonthISO = nextMonth.toISOString().slice(0, 10)

  const dueToday =
    openReminders.filter((r) => r.dueDate === today).length +
    openHome.filter((t) => t.dueDate === today).length
  const dueWeek =
    openReminders.filter((r) => r.dueDate && r.dueDate <= weekISO).length +
    openHome.filter((t) => t.dueDate && t.dueDate <= weekISO).length

  const dueMonth =
    openReminders.filter(
      (r) =>
        r.dueDate && r.dueDate >= monthStartISO && r.dueDate < nextMonthISO,
    ).length +
    openHome.filter(
      (t) =>
        t.dueDate && t.dueDate >= monthStartISO && t.dueDate < nextMonthISO,
    ).length

  return (
    <div>
      <section className="dashboard-hero page-header">
        <h1>דשבורד</h1>
        <p>תזכורות פתוחות מכל המחלקות, התראות שנתיות וקיצורי דרך.</p>
      </section>

      <section
        className="dashboard-section grid"
        style={{
          marginBottom: '1.25rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        }}
      >
        <div className="panel stat">
          <span className="value">{dueToday}</span>
          <span className="label">לביצוע היום</span>
        </div>
        <div className="panel stat">
          <span className="value">{dueWeek}</span>
          <span className="label">השבוע</span>
        </div>
        <div className="panel stat">
          <span className="value">{dueMonth}</span>
          <span className="label">החודש</span>
        </div>
        <div className="panel stat">
          <span className="value">{openReminders.length + openHome.length}</span>
          <span className="label">סה״כ פתוחים</span>
        </div>
      </section>

      <section className="dashboard-section panel" style={{ marginBottom: '1.25rem' }}>
        <h2>תזכורות פתוחות</h2>
        {!openReminders.length && !openHome.length ? (
          <div className="empty">אין תזכורות פתוחות כרגע.</div>
        ) : (
          <div className="list">
            {openReminders.map((r) => (
              <div key={`r-${r.id}`} className="list-item">
                <div className="stack-sm">
                  <strong>{r.title}</strong>
                  <div className="meta">
                    {r.module === 'shlichut'
                      ? 'שליחות'
                      : r.module === 'chinuch'
                        ? 'חינוך'
                        : 'בית'}
                    {r.dueDate ? ` · ${formatDate(r.dueDate)}` : ''}
                  </div>
                </div>
                <div className="actions">
                  <PriorityBadge priority={r.priority} />
                  <StatusBadge status={r.status} />
                  <button
                    type="button"
                    className="btn small shlichut"
                    onClick={() => r.id != null && completeReminder(r.id)}
                    aria-label={`סמן תזכורת "${r.title}" כבוצעה`}
                  >
                    <Icon icon={Check} size={ICON_SIZE_SM} />
                    בוצע
                  </button>
                  <Link
                    className="btn small secondary"
                    to={
                      r.module === 'shlichut'
                        ? '/shlichut/reminders'
                        : r.module === 'chinuch'
                          ? '/chinuch'
                          : '/bayit/tasks'
                    }
                  >
                    <Icon icon={ExternalLink} size={ICON_SIZE_SM} />
                    פתיחה
                  </Link>
                </div>
              </div>
            ))}
            {openHome.map((t) => (
              <div key={`h-${t.id}`} className="list-item">
                <div className="stack-sm">
                  <strong>{t.title}</strong>
                  <div className="meta">
                    בית
                    {t.dueDate ? ` · ${formatDate(t.dueDate)}` : ''}
                  </div>
                </div>
                <div className="actions">
                  <PriorityBadge priority={t.priority} />
                  <button
                    type="button"
                    className="btn small bayit"
                    onClick={() => t.id != null && completeHomeTask(t.id)}
                    aria-label={`סמן משימה "${t.title}" כבוצעה`}
                  >
                    <Icon icon={Check} size={ICON_SIZE_SM} />
                    בוצע
                  </button>
                  <Link className="btn small secondary" to="/bayit/tasks">
                    <Icon icon={ExternalLink} size={ICON_SIZE_SM} />
                    פתיחה
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-section panel" style={{ marginBottom: '1.25rem' }}>
        <h2>פתיחה מחדש</h2>
        {!recentDoneReminders.length && !recentDoneHomeTasks.length ? (
          <div className="empty">אין פריטים שבוצעו לאחרונה.</div>
        ) : (
          <div className="list">
            {recentDoneReminders.map((r) => (
              <div key={`dr-${r.id}`} className="list-item">
                <div className="stack-sm">
                  <strong>{r.title}</strong>
                  <div className="meta">{r.dueDate ? ` · ${formatDate(r.dueDate)}` : ''}</div>
                </div>
                <div className="actions">
                  <PriorityBadge priority={r.priority} />
                  <StatusBadge status={r.status} />
                  <button
                    type="button"
                    className="btn small secondary"
                    onClick={() => r.id != null && reopenReminder(r.id)}
                    aria-label={`פתח מחדש תזכורת "${r.title}"`}
                  >
                    <Icon icon={RotateCcw} size={ICON_SIZE_SM} />
                    פתח מחדש
                  </button>
                  <Link
                    className="btn small ghost"
                    to={r.module === 'shlichut' ? '/shlichut/reminders' : '/bayit/tasks'}
                  >
                    <Icon icon={ExternalLink} size={ICON_SIZE_SM} />
                    פתיחה
                  </Link>
                </div>
              </div>
            ))}
            {recentDoneHomeTasks.map((t) => (
              <div key={`dh-${t.id}`} className="list-item">
                <div className="stack-sm">
                  <strong>{t.title}</strong>
                  <div className="meta">{t.dueDate ? ` · ${formatDate(t.dueDate)}` : ''}</div>
                </div>
                <div className="actions">
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                  <button
                    type="button"
                    className="btn small secondary"
                    onClick={() => t.id != null && reopenHomeTask(t.id)}
                    aria-label={`פתח מחדש משימה "${t.title}"`}
                  >
                    <Icon icon={RotateCcw} size={ICON_SIZE_SM} />
                    פתח מחדש
                  </button>
                  <Link className="btn small ghost" to="/bayit/tasks">
                    <Icon icon={ExternalLink} size={ICON_SIZE_SM} />
                    פתיחה
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-section panel" style={{ marginBottom: '1.25rem' }}>
        <h2>מהשנה שעברה — לקראת אירועים חוזרים</h2>
        <p className="muted" style={{ marginBottom: '0.75rem' }}>
          מוצג כ־{leadDays} ימים לפני אותו תאריך בשנה הבאה (ניתן לשנות בהגדרות).
        </p>
        {!yearAlerts.length ? (
          <div className="empty">אין התראות שנתיות בחלון הזמן הנוכחי.</div>
        ) : (
          <div className="list">
            {yearAlerts.map((item) => {
              if (!item) return null
              const { plan, next, days, related } = item
              return (
                <div key={plan.id} className="list-item alert-year">
                  <div className="stack-sm">
                    <strong>{plan.title}</strong>
                    <div className="meta">
                      בעוד {days} ימים · {formatDate(next)}
                    </div>
                    {related.map((s) => (
                      <div key={s.id} className="meta">
                        {s.year}: {s.notesForNextYear || s.whatWorked || '—'}
                      </div>
                    ))}
                    {!related.length && (
                      <div className="meta">עדיין אין סיכום משנים קודמות.</div>
                    )}
                  </div>
                  <Link className="btn small bayit" to={`/shlichut/plans/${plan.id}`}>
                    <Icon icon={Calendar} size={ICON_SIZE_SM} />
                    לתוכנית
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="dashboard-section grid grid-3">
        <Link to="/shlichut" className="shortcut shlichut">
          <h3>
            <Icon icon={HeartHandshake} size={ICON_SIZE_LG} />
            שליחות
          </h3>
          <p>{contacts ?? 0} אנשי קשר · תזכורות, תוכניות ומפה</p>
        </Link>
        <Link to="/chinuch" className="shortcut chinuch">
          <h3>
            <Icon icon={GraduationCap} size={ICON_SIZE_LG} />
            חינוך
          </h3>
          <p>{students ?? 0} תלמידים · ציונים וחומרים</p>
        </Link>
        <Link to="/bayit" className="shortcut bayit">
          <h3>
            <Icon icon={Home} size={ICON_SIZE_LG} />
            בית
          </h3>
          <p>{openHome.length} משימות פתוחות · כספים</p>
        </Link>
      </section>
    </div>
  )
}
