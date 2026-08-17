import { HebrewCalendar, flags, type Event } from '@hebcal/core'
import { daysUntil, toLocalISODate, todayISO } from './dates'

const KEEP = flags.CHAG | flags.MAJOR_FAST | flags.MINOR_HOLIDAY | flags.MODERN_HOLIDAY

export interface UpcomingHoliday {
  date: string
  title: string
  days: number
}

export function upcomingHolidays(withinDays = 45): UpcomingHoliday[] {
  const start = new Date()
  start.setHours(12, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + withinDays)
  return holidaysBetween(toLocalISODate(start), toLocalISODate(end)).filter(
    (h) => h.date >= todayISO(),
  ).slice(0, 8)
}

export function holidaysBetween(startISO: string, endISO: string): UpcomingHoliday[] {
  const start = new Date(startISO.slice(0, 10) + 'T12:00:00')
  const end = new Date(endISO.slice(0, 10) + 'T12:00:00')
  const events = HebrewCalendar.calendar({
    start,
    end,
    il: true,
    locale: 'he',
    noModern: false,
    noRoshChodesh: true,
    noMinorFast: true,
    noSpecialShabbat: true,
    omer: false,
    sedrot: false,
  }) as Event[]

  const seen = new Set<string>()
  const out: UpcomingHoliday[] = []
  for (const ev of events) {
    if (!(ev.getFlags() & KEEP)) continue
    const date = toLocalISODate(ev.getDate().greg())
    if (date < startISO.slice(0, 10) || date > endISO.slice(0, 10)) continue
    const title = ev.render('he')
    const key = `${date}:${title}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ date, title, days: daysUntil(date) })
  }
  return out
}
