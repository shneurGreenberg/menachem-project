import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, ChevronRight, Download, ExternalLink } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon, ICON_SIZE_SM } from '../components/icons'
import { db } from '../db'
import {
  downloadIcs,
  googleCalendarUrl,
  monthGrid,
  monthTitle,
  moduleLabel,
  type AgendaItem,
} from '../utils/agenda'
import { todayISO } from '../utils/dates'
import { holidaysBetween } from '../utils/holidays'
import { reminderModulePath } from '../utils/reminders'

const WEEKDAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

export function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState(todayISO())
  const [filter, setFilter] = useState<'all' | AgendaItem['module']>('all')

  const reminders = useLiveQuery(() => db.reminders.toArray(), [])
  const homeTasks = useLiveQuery(() => db.homeTasks.toArray(), [])
  const teaching = useLiveQuery(() => db.teachingPlans.toArray(), [])
  const plans = useLiveQuery(() => db.plans.toArray(), [])

  const cells = useMemo(() => monthGrid(year, month), [year, month])
  const rangeStart = cells[0]?.iso ?? `${year}-${String(month + 1).padStart(2, '0')}-01`
  const rangeEnd = cells[cells.length - 1]?.iso ?? rangeStart

  const holidays = useMemo(
    () => holidaysBetween(rangeStart, rangeEnd),
    [rangeStart, rangeEnd],
  )

  const items = useMemo(() => {
    const out: AgendaItem[] = []
    for (const r of reminders ?? []) {
      if (!r.dueDate) continue
      out.push({
        key: `r-${r.id}`,
        date: r.dueDate,
        title: r.title,
        detail: r.description,
        module: r.module,
        kind: 'reminder',
        href: reminderModulePath(r.module),
        status: r.status,
      })
    }
    for (const t of homeTasks ?? []) {
      if (!t.dueDate) continue
      out.push({
        key: `h-${t.id}`,
        date: t.dueDate,
        title: t.title,
        detail: t.description,
        module: 'bayit',
        kind: 'homeTask',
        href: '/bayit/tasks',
        status: t.status,
      })
    }
    for (const p of teaching ?? []) {
      if (!p.date) continue
      out.push({
        key: `tp-${p.id}`,
        date: p.date,
        title: p.title,
        detail: p.topic,
        module: 'chinuch',
        kind: 'teachingPlan',
        href: '/chinuch/plans',
        status: p.status === 'done' ? 'done' : 'open',
      })
    }
    for (const p of plans ?? []) {
      out.push({
        key: `pl-${p.id}`,
        date: p.targetDate,
        title: p.title,
        detail: p.description,
        module: 'shlichut',
        kind: 'plan',
        href: p.id != null ? `/shlichut/plans/${p.id}` : '/shlichut/plans',
        status: p.status === 'active' ? 'open' : 'done',
      })
    }
    for (const h of holidays) {
      out.push({
        key: `hol-${h.date}-${h.title}`,
        date: h.date,
        title: h.title,
        module: 'holiday',
        kind: 'holiday',
      })
    }
    return out.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, 'he'))
  }, [reminders, homeTasks, teaching, plans, holidays])

  const visible = filter === 'all' ? items : items.filter((i) => i.module === filter)
  const byDay = useMemo(() => {
    const m = new Map<string, AgendaItem[]>()
    for (const i of visible) {
      const arr = m.get(i.date) ?? []
      arr.push(i)
      m.set(i.date, arr)
    }
    return m
  }, [visible])

  const dayItems = byDay.get(selected) ?? []

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  function goToday() {
    const t = new Date()
    setYear(t.getFullYear())
    setMonth(t.getMonth())
    setSelected(todayISO())
  }

  return (
    <div className="grid" style={{ gap: '1.25rem' }}>
      <div className="page-header">
        <h1>יומן</h1>
        <p>כל המשימות, התזכורות, התוכניות והחגים במקום אחד. אפשר גם לייצא ליומן גוגל.</p>
      </div>

      <section className="panel">
        <div className="actions" style={{ marginBottom: '0.75rem' }}>
          <button type="button" className="btn small ghost" onClick={() => shiftMonth(-1)} aria-label="חודש קודם">
            <Icon icon={ChevronRight} size={ICON_SIZE_SM} />
          </button>
          <h2 style={{ margin: 0, flex: 1 }}>{monthTitle(year, month)}</h2>
          <button type="button" className="btn small secondary" onClick={goToday}>
            היום
          </button>
          <button type="button" className="btn small ghost" onClick={() => shiftMonth(1)} aria-label="חודש הבא">
            <Icon icon={ChevronLeft} size={ICON_SIZE_SM} />
          </button>
        </div>
        <div className="actions" style={{ marginBottom: '0.75rem' }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            aria-label="סינון יומן"
          >
            <option value="all">הכל</option>
            <option value="shlichut">שליחות</option>
            <option value="chinuch">חינוך</option>
            <option value="bayit">בית</option>
            <option value="holiday">חגים</option>
          </select>
          <button
            type="button"
            className="btn small secondary"
            onClick={() => downloadIcs(visible)}
          >
            <Icon icon={Download} size={ICON_SIZE_SM} />
            ייצוא ICS לגוגל
          </button>
        </div>
        <p className="muted">
          ייצוא: ביומן גוגל → הגדרות → ייבוא. כל קובץ מעדכן את האירועים שיוצאו.
        </p>
        <div className="cal-weekdays">
          {WEEKDAYS.map((d) => (
            <div key={d} className="cal-weekday">
              {d}
            </div>
          ))}
        </div>
        <div className="cal-grid">
          {cells.map((c) => {
            const dayItemsForCell = byDay.get(c.iso) ?? []
            const isToday = c.iso === todayISO()
            const isSelected = c.iso === selected
            return (
              <button
                key={c.iso}
                type="button"
                className={`cal-cell${c.inMonth ? '' : ' is-outside'}${isToday ? ' is-today' : ''}${isSelected ? ' is-selected' : ''}`}
                onClick={() => setSelected(c.iso)}
              >
                <span className="cal-num">{Number(c.iso.slice(8))}</span>
                <div className="cal-dots">
                  {dayItemsForCell.slice(0, 3).map((i) => (
                    <span key={i.key} className={`cal-dot mod-${i.module}`} title={i.title} />
                  ))}
                  {dayItemsForCell.length > 3 && (
                    <span className="cal-more">+{dayItemsForCell.length - 3}</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="panel">
        <h2>
          {selected === todayISO() ? 'היום' : selected.split('-').reverse().join('/')}
        </h2>
        {!dayItems.length ? (
          <div className="empty">אין פריטים ביום זה.</div>
        ) : (
          <div className="list">
            {dayItems.map((i) => (
              <div key={i.key} className="list-item">
                <div className="stack-sm">
                  <strong>{i.title}</strong>
                  <div className="meta">
                    {moduleLabel(i.module)}
                    {i.status === 'done' ? ' · בוצע' : ''}
                    {i.detail ? ` · ${i.detail}` : ''}
                  </div>
                </div>
                <div className="actions">
                  <a
                    className="btn small secondary"
                    href={googleCalendarUrl(i)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    גוגל
                  </a>
                  {i.href && (
                    <Link className="btn small ghost" to={i.href}>
                      <Icon icon={ExternalLink} size={ICON_SIZE_SM} />
                      פתיחה
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
