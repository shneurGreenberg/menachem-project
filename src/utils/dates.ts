export function toLocalISODate(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayISO(): string {
  return toLocalISODate(new Date())
}

export function addDaysLocal(iso: string, days: number): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  return toLocalISODate(new Date(y, (m ?? 1) - 1, (d ?? 1) + days))
}

export function monthStartISO(from: Date = new Date()): string {
  return toLocalISODate(new Date(from.getFullYear(), from.getMonth(), 1))
}

export function nextMonthStartISO(from: Date = new Date()): string {
  return toLocalISODate(new Date(from.getFullYear(), from.getMonth() + 1, 1))
}

/** Inclusive start and exclusive end for a YYYY-MM month in local time. */
export function monthRange(yearMonth: string): { start: string; endExcl: string } {
  const [y, m] = yearMonth.split('-').map(Number)
  const start = `${y}-${String(m).padStart(2, '0')}-01`
  const endExcl = toLocalISODate(new Date(y, m, 1))
  return { start, endExcl }
}

export function nowISO(): string {
  return new Date().toISOString()
}

export function formatDate(iso?: string): string {
  if (!iso) return '—'
  const d = iso.slice(0, 10)
  const [y, m, day] = d.split('-')
  if (!y || !m || !day) return iso
  return `${day}/${m}/${y}`
}

export function daysUntil(dateISO: string): number {
  const target = new Date(dateISO.slice(0, 10) + 'T12:00:00')
  const now = new Date()
  now.setHours(12, 0, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function isOverdue(dueDate?: string, today = todayISO()): boolean {
  return Boolean(dueDate && dueDate < today)
}

export function compareByDueDate(a?: string, b?: string): number {
  return (a ?? '9999').localeCompare(b ?? '9999')
}

export function compareHe(a: string, b: string): number {
  return a.localeCompare(b, 'he')
}

export function priorityWeight(p: string): number {
  if (p === 'high') return 0
  if (p === 'medium') return 1
  return 2
}

export function priorityLabel(p: string): string {
  if (p === 'high') return 'גבוהה'
  if (p === 'medium') return 'בינונית'
  return 'נמוכה'
}

export function parseCategories(raw: string | undefined, fallback: string[]): string[] {
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) return parsed.map(String)
  } catch {
    /* ignore */
  }
  return fallback
}

/** Next anniversary of a calendar date (month/day), from today. */
export function nextAnniversary(dateISO: string): string {
  const [, m, d] = dateISO.slice(0, 10).split('-').map(Number)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let next = new Date(now.getFullYear(), (m ?? 1) - 1, d ?? 1)
  if (next < today) {
    next = new Date(now.getFullYear() + 1, (m ?? 1) - 1, d ?? 1)
  }
  return toLocalISODate(next)
}

export function monthKey(dateISO: string): string {
  return dateISO.slice(0, 7)
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    maximumFractionDigits: 0,
  }).format(n)
}
