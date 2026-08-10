import { db } from '../db'

const TABLES = [
  'contacts',
  'customFieldDefs',
  'plans',
  'planTasks',
  'planSummaries',
  'shoppingItems',
  'activityTypes',
  'activities',
  'reminders',
  'chabadFinance',
  'students',
  'grades',
  'lessonMaterials',
  'teachingPlans',
  'homeTransactions',
  'homeTasks',
  'settings',
  'contactActivityLogs',
] as const

export async function exportAllData(): Promise<string> {
  const payload: Record<string, unknown> = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {},
  }
  const data: Record<string, unknown[]> = {}
  for (const table of TABLES) {
    data[table] = await db.table(table).toArray()
  }
  payload.data = data
  return JSON.stringify(payload, null, 2)
}

export async function importAllData(json: string): Promise<void> {
  const parsed = JSON.parse(json) as {
    version?: number
    data?: Record<string, unknown[]>
  }
  if (!parsed.data || typeof parsed.data !== 'object') {
    throw new Error('קובץ גיבוי לא תקין')
  }

  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const table of TABLES) {
      await db.table(table).clear()
      const rows = parsed.data?.[table]
      if (Array.isArray(rows) && rows.length) {
        await db.table(table).bulkAdd(rows as never[])
      }
    }
  })
}

export function downloadJson(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
