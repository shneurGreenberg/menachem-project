import { beginSilentWrites, db, endSilentWrites } from '../db'

export type ExportImagePolicy = 'auto' | 'include' | 'exclude'

export const TABLES = [
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

type Row = Record<string, unknown> & { id?: number }

function rowTime(row: Row): string {
  return String(row.updatedAt ?? row.createdAt ?? '')
}

function mergeRows(table: string, local: Row[], remote: Row[]): Row[] {
  const map = new Map<number, Row>()
  for (const row of local) {
    if (row.id != null) map.set(row.id, row)
  }
  for (const row of remote) {
    if (row.id == null) continue
    const existing = map.get(row.id)
    if (!existing) {
      map.set(row.id, row)
      continue
    }
    const newer = rowTime(row) >= rowTime(existing) ? row : existing
    const older = newer === row ? existing : row
    if (table === 'contacts') {
      map.set(row.id, {
        ...newer,
        imageDataUrl: newer.imageDataUrl || older.imageDataUrl,
      })
    } else {
      map.set(row.id, newer)
    }
  }
  return [...map.values()]
}

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
  return JSON.stringify(payload)
}

export async function importAllData(
  json: string,
  options?: { merge?: boolean },
): Promise<void> {
  const parsed = JSON.parse(json) as {
    version?: number
    data?: Record<string, unknown[]>
  }
  if (!parsed.data || typeof parsed.data !== 'object') {
    throw new Error('קובץ גיבוי לא תקין')
  }

  beginSilentWrites()
  try {
    await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
      for (const table of TABLES) {
        const remote = (parsed.data?.[table] ?? []) as Row[]
        if (options?.merge) {
          const local = (await db.table(table).toArray()) as Row[]
          const merged = mergeRows(table, local, remote)
          await db.table(table).clear()
          if (merged.length) await db.table(table).bulkAdd(merged as never[])
        } else {
          await db.table(table).clear()
          if (Array.isArray(remote) && remote.length) {
            await db.table(table).bulkAdd(remote as never[])
          }
        }
      }
    })
  } finally {
    endSilentWrites()
  }
}
