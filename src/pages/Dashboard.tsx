import { useLiveQuery } from 'dexie-react-hooks'
import {
  Check,
  Calendar,
  CalendarDays,
  ExternalLink,
  GraduationCap,
  HeartHandshake,
  Home,
  RotateCcw,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PriorityBadge, StatusBadge } from '../components/Badges'
import { Icon, ICON_SIZE_LG, ICON_SIZE_SM } from '../components/icons'
import { db, getSetting } from '../db'
import {
  addDaysLocal,
  daysUntil,
  formatDate,
  isOverdue,
  monthStartISO,
  nextAnniversary,
  nextMonthStartISO,
  nowISO,
  todayISO,
} from '../utils/dates'
import { upcomingHolidays } from '../utils/holidays'
import { notifyDueToday } from '../utils/notify'
import {
  completeReminder,
  reminderModuleLabel,
  reminderModulePath,
  reopenReminder,
  sortOpenItems,
} from '../utils/reminders'

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
  const contacts = useLiveQuery(() => db.contacts.count(), [])
  const students = useLiveQuery(() => db.students.count(), [])
  const notifyRow = useLiveQuery(
    () => db.settings.where('key').equals('notifyDueToday').first(),
    [],
  )

  const openReminders = sortOpenItems(reminders ?? [])
  const openHome = sortOpenItems(homeTasks ?? [])

  const recentDoneReminders = [...(doneReminders ?? [])]
    .sort((a, b) => (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt))
    .slice(0, 6)

  const recentDoneHomeTasks = [...(doneHomeTasks ?? [])]
    .sort((a, b) => (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt))
    .slice(0, 6)

  async function markReminderDone(id: number) {
    await completeReminder(id)
  }

  async function reopenRem(id: number) {
    await reopenReminder(id)
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
  const weekISO = addDaysLocal(today, 7)
  const monthStart = monthStartISO()
  const nextMonthISO = nextMonthStartISO()

  const dueToday =
    openReminders.filter((r) => r.dueDate === today).length +
    openHome.filter((t) => t.dueDate === today).length
  const dueWeek =
    openReminders.filter((r) => r.dueDate && r.dueDate >= today && r.dueDate <= weekISO).length +
    openHome.filter((t) => t.dueDate && t.dueDate >= today && t.dueDate <= weekISO).length

  const dueMonth =
    openReminders.filter(
      (r) =>
        r.dueDate && r.dueDate >= monthStart && r.dueDate < nextMonthISO,
    ).length +
    openHome.filter(
      (t) =>
        t.dueDate && t.dueDate >= monthStart && t.dueDate < nextMonthISO,
    ).length

  const holidays = useMemo(() => {
    try {
      return upcomingHolidays()
    } catch {
      return []
    }
  }, [])

  useEffect(() => {
    if (notifyRow?.value !== '1') return
    notifyDueToday(dueToday)
  }, [dueToday, notifyRow])

  return (
    <div>
      <section className="dashboard-hero page-header">
        <h1>דשבורד</h1>
        <p>תזכורות פתוחות מכל המחלקות, חגים, יומן וקיצורי דרך.</p>
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

      {holidays.length > 0 && (
        <section className="dashboard-section panel" style={{ marginBottom: '1.25rem' }}>
          <h2>חגים קרובים</h2>
          <div className="list">
            {holidays.map((h) => (
              <div key={`${h.date}:${h.title}`} className="list-item">
                <div className="stack-sm">
                  <strong>{h.title}</strong>
                  <div className="meta">
                    {h.days === 0
                      ? 'היום'
                      : h.days === 1
                        ? 'מחר'
                        : `בעוד ${h.days} ימים`}
                    {` · ${formatDate(h.date)}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="dashboard-section panel" style={{ marginBottom: '1.25rem' }}>
        <h2>תזכורות פתוחות</h2>
        {!openReminders.length && !openHome.length ? (
          <div className="empty">אין תזכורות פתוחות כרגע.</div>
        ) : (
          <div className="list">
            {openReminders.map((r) => (
              <div
                key={`r-${r.id}`}
                className={`list-item${isOverdue(r.dueDate) ? ' is-overdue' : ''}`}
              >
                <div className="stack-sm">
                  <strong>{r.title}</strong>
                  <div className="meta">
                    {reminderModuleLabel(r.module)}
                    {r.dueDate ? ` · ${formatDate(r.dueDate)}` : ''}
                    {isOverdue(r.dueDate) ? ' · באיחור' : ''}
                  </div>
                </div>
                <div className="actions">
                  <PriorityBadge priority={r.priority} />
                  <StatusBadge status={r.status} />
                  <button
                    type="button"
                    className="btn small shlichut"
                    onClick={() => r.id != null && markReminderDone(r.id)}
                    aria-label={`סמן תזכורת "${r.title}" כבוצעה`}
                  >
                    <Icon icon={Check} size={ICON_SIZE_SM} />
                    בוצע
                  </button>
                  <Link
                    className="btn small secondary"
                    to={reminderModulePath(r.module)}
                  >
                    <Icon icon={ExternalLink} size={ICON_SIZE_SM} />
                    פתיחה
                  </Link>
                </div>
              </div>
            ))}
            {openHome.map((t) => (
              <div
                key={`h-${t.id}`}
                className={`list-item${isOverdue(t.dueDate) ? ' is-overdue' : ''}`}
              >
                <div className="stack-sm">
                  <strong>{t.title}</strong>
                  <div className="meta">
                    בית
                    {t.dueDate ? ` · ${formatDate(t.dueDate)}` : ''}
                    {isOverdue(t.dueDate) ? ' · באיחור' : ''}
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
                    onClick={() => r.id != null && reopenRem(r.id)}
                    aria-label={`פתח מחדש תזכורת "${r.title}"`}
                  >
                    <Icon icon={RotateCcw} size={ICON_SIZE_SM} />
                    פתח מחדש
                  </button>
                  <Link
                    className="btn small ghost"
                    to={reminderModulePath(r.module)}
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
                  <Link className="btn small shlichut" to={`/shlichut/plans/${plan.id}`}>
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
        <Link to="/calendar" className="shortcut">
          <h3>
            <Icon icon={CalendarDays} size={ICON_SIZE_LG} />
            יומן
          </h3>
          <p>כל המשימות והחגים · ייצוא לגוגל</p>
        </Link>
      </section>
    </div>
  )
}
