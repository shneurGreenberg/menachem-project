export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
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
  const year = now.getFullYear()
  let next = new Date(year, (m ?? 1) - 1, d ?? 1, 12)
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  if (next < today) {
    next = new Date(year + 1, (m ?? 1) - 1, d ?? 1, 12)
  }
  return next.toISOString().slice(0, 10)
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
