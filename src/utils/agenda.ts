import type { ModuleId } from '../types'
import { addDaysLocal, formatDate, toLocalISODate } from './dates'
import { reminderModulePath } from './reminders'

export type AgendaKind =
  | 'reminder'
  | 'homeTask'
  | 'teachingPlan'
  | 'plan'
  | 'holiday'

export interface AgendaItem {
  key: string
  date: string
  title: string
  detail?: string
  module: ModuleId | 'holiday'
  kind: AgendaKind
  href?: string
  status?: 'open' | 'done'
}

export function moduleLabel(module: AgendaItem['module']): string {
  if (module === 'shlichut') return 'שליחות'
  if (module === 'chinuch') return 'חינוך'
  if (module === 'bayit') return 'בית'
  return 'חג'
}

export function googleCalendarUrl(item: AgendaItem): string {
  const start = item.date.replace(/-/g, '')
  const end = addDaysLocal(item.date, 1).replace(/-/g, '')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: item.title,
    dates: `${start}/${end}`,
    details: [moduleLabel(item.module), item.detail].filter(Boolean).join('\n'),
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function icsEscape(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
}

export function toIcs(items: AgendaItem[]): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
  const events = items
    .filter((i) => i.date)
    .map((i) => {
      const start = i.date.replace(/-/g, '')
      const end = addDaysLocal(i.date, 1).replace(/-/g, '')
      return [
        'BEGIN:VEVENT',
        `UID:${i.key}@menachem-project`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${start}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(i.title)}`,
        `DESCRIPTION:${icsEscape([moduleLabel(i.module), i.detail].filter(Boolean).join('\n'))}`,
        'END:VEVENT',
      ].join('\r\n')
    })
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'PRODID:-//Menachem//Personal//HE',
    'X-WR-CALNAME:ניהול אישי',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadIcs(items: AgendaItem[], filename = 'menachem-calendar.ics') {
  const blob = new Blob([toIcs(items)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function monthGrid(year: number, monthIndex: number): { iso: string; inMonth: boolean }[] {
  const first = new Date(year, monthIndex, 1)
  const startPad = first.getDay()
  const days = new Date(year, monthIndex + 1, 0).getDate()
  const cells: { iso: string; inMonth: boolean }[] = []
  for (let i = 0; i < startPad; i++) {
    const d = new Date(year, monthIndex, 1 - (startPad - i))
    cells.push({ iso: toLocalISODate(d), inMonth: false })
  }
  for (let d = 1; d <= days; d++) {
    cells.push({ iso: toLocalISODate(new Date(year, monthIndex, d)), inMonth: true })
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1]!
    const [y, m, day] = last.iso.split('-').map(Number)
    cells.push({
      iso: toLocalISODate(new Date(y, (m ?? 1) - 1, (day ?? 1) + 1)),
      inMonth: false,
    })
  }
  return cells
}

export function monthTitle(year: number, monthIndex: number): string {
  return new Date(year, monthIndex, 1).toLocaleDateString('he-IL', {
    month: 'long',
    year: 'numeric',
  })
}

export function reminderHref(module: ModuleId): string {
  return reminderModulePath(module)
}

export { formatDate }
