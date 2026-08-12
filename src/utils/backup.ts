import { db } from '../db'

export type ExportImagePolicy = 'auto' | 'include' | 'exclude'

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

export async function exportAllData(options?: {
  imagePolicy?: ExportImagePolicy
  imageMaxChars?: number
}): Promise<string> {
  const imagePolicy = options?.imagePolicy ?? 'auto'
  const imageMaxChars = options?.imageMaxChars ?? 50_000

  const payload: Record<string, unknown> = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {},
  }
  const data: Record<string, unknown[]> = {}

  let contactImagesIncluded = 0
  let contactImagesExcluded = 0

  for (const table of TABLES) {
    let rows = await db.table(table).toArray()

    if (table === 'contacts') {
      rows = rows.map((row) => {
        const r = { ...(row as Record<string, unknown>) }
        const image = typeof r.imageDataUrl === 'string' ? r.imageDataUrl : undefined

        if (!image) return r

        if (imagePolicy === 'exclude') {
          delete r.imageDataUrl
          contactImagesExcluded++
          return r
        }

        if (imagePolicy === 'include') {
          contactImagesIncluded++
          return r
        }

        // auto
        if (image.length > imageMaxChars) {
          delete r.imageDataUrl
          contactImagesExcluded++
          return r
        }

        contactImagesIncluded++
        return r
      })
    }

    data[table] = rows
  }

  if (contactImagesIncluded || contactImagesExcluded) {
    payload['imageExportStats'] = {
      contactImagesIncluded,
      contactImagesExcluded,
      imagePolicy,
      imageMaxChars,
    }
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
