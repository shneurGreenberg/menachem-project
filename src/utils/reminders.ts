import { db } from '../db'
import type { RepeatKind } from '../types'
import { addDaysLocal, addMonthsLocal, nowISO, todayISO } from './dates'

export async function completeReminder(id: number): Promise<void> {
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
  }

  if (rem.repeat && rem.repeat !== 'none') {
    const base = rem.dueDate || todayISO()
    const nextDate =
      rem.repeat === 'weekly' ? addDaysLocal(base, 7) : addMonthsLocal(base, 1)
    await db.reminders.add({
      title: rem.title,
      description: rem.description,
      contactId: rem.contactId,
      dueDate: nextDate,
      priority: rem.priority,
      status: 'open',
      module: rem.module,
      repeat: rem.repeat,
      createdAt: completedAt,
    })
  }
}

export async function reopenReminder(id: number): Promise<void> {
  await db.reminders.update(id, { status: 'open', completedAt: undefined })
}

export function repeatLabel(repeat?: RepeatKind): string {
  if (repeat === 'weekly') return 'שבועי'
  if (repeat === 'monthly') return 'חודשי'
  return ''
}

export function sortOpenItems<T extends { priority: string; dueDate?: string; createdAt: string }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => {
    const dateCmp = (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')
    if (dateCmp !== 0) return dateCmp
    const pw =
      (a.priority === 'high' ? 0 : a.priority === 'medium' ? 1 : 2) -
      (b.priority === 'high' ? 0 : b.priority === 'medium' ? 1 : 2)
    if (pw !== 0) return pw
    return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
  })
}

export function reminderModuleLabel(module: 'shlichut' | 'chinuch' | 'bayit'): string {
  if (module === 'shlichut') return 'שליחות'
  if (module === 'chinuch') return 'חינוך'
  return 'בית'
}

export function reminderModulePath(module: 'shlichut' | 'chinuch' | 'bayit'): string {
  if (module === 'shlichut') return '/shlichut/reminders'
  if (module === 'chinuch') return '/chinuch/tasks'
  return '/bayit/tasks'
}
