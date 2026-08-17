import { db } from '../db'
import { daysUntil } from './dates'

export async function lastVisitByContact(): Promise<Map<number, string>> {
  const [acts, logs] = await Promise.all([
    db.activities.toArray(),
    db.contactActivityLogs.toArray(),
  ])
  const map = new Map<number, string>()
  for (const a of acts) {
    if (a.contactId == null || !a.date) continue
    const prev = map.get(a.contactId)
    if (!prev || a.date > prev) map.set(a.contactId, a.date)
  }
  for (const l of logs) {
    if (!l.contactId || !l.date) continue
    const prev = map.get(l.contactId)
    if (!prev || l.date > prev) map.set(l.contactId, l.date)
  }
  return map
}

export function lastVisitLabel(iso?: string): string {
  if (!iso) return 'לא ביקר'
  const ago = -daysUntil(iso)
  if (ago <= 0) return 'היום'
  if (ago === 1) return 'אתמול'
  if (ago < 30) return `לפני ${ago} ימים`
  const months = Math.floor(ago / 30)
  return months === 1 ? 'לפני חודש' : `לפני ${months} חודשים`
}
