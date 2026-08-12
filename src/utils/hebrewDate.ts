import { HDate } from '@hebcal/core'

export interface HDateParts {
  year: number
  month: number
  day: number
}

function dateToIsoLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function isoToHDateParts(iso: string): HDateParts {
  const hd = new HDate(new Date(iso.slice(0, 10) + 'T12:00:00'))
  return {
    year: hd.getFullYear(),
    month: hd.getMonth(),
    day: hd.getDate(),
  }
}

export function hDatePartsToIso(year: number, month: number, day: number): string {
  const hd = new HDate(day, month, year)
  return dateToIsoLocal(hd.greg())
}

export function formatHebrewDate(iso?: string): string {
  if (!iso) return '—'
  const hd = new HDate(new Date(iso.slice(0, 10) + 'T12:00:00'))
  return hd.renderGematriya(true, false)
}

export function getDaysInHebrewMonth(month: number, year: number): number {
  return HDate.daysInMonth(month, year)
}

export function getHebrewMonthOptions(year: number): { value: number; label: string }[] {
  const count = HDate.monthsInYear(year)
  return Array.from({ length: count }, (_, i) => {
    const month = i + 1
    const label = hebrewMonthLabel(month, year)
    return { value: month, label }
  })
}

export function hebrewMonthLabel(month: number, year: number): string {
  const rendered = new HDate(15, month, year).render('he', false)
  return rendered.replace(/^\S+\s+/, '').trim()
}

export function getHebrewYearOptions(
  centerYear = new HDate().getFullYear(),
  span = 12,
): number[] {
  const years: number[] = []
  for (let y = centerYear - span; y <= centerYear + span; y++) {
    if (y > 0) years.push(y)
  }
  return years
}

export function currentHebrewParts(): HDateParts {
  const hd = new HDate()
  return {
    year: hd.getFullYear(),
    month: hd.getMonth(),
    day: hd.getDate(),
  }
}
