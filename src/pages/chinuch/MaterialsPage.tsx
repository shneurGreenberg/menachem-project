import { useLiveQuery } from 'dexie-react-hooks'
import { BookPlus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { FilterEmpty, listCountLabel } from '../../components/FilterEmpty'
import { Icon, ICON_SIZE_SM } from '../../components/icons'
import { db } from '../../db'
import { compareHe, nowISO } from '../../utils/dates'

export function MaterialsPage() {
  const materials = useLiveQuery(async () => {
    const rows = await db.lessonMaterials.toArray()
    return rows.sort((a, b) => compareHe(a.title, b.title))
  }, [])
  const [form, setForm] = useState({
    title: '',
    content: '',
    url: '',
    notes: '',
    tags: '',
  })

  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<string>('all')

  const availableTags = useMemo(() => {
    const set = new Set<string>()
    for (const m of materials ?? []) {
      for (const t of m.tags ?? []) set.add(t)
    }
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [materials])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (materials ?? []).filter((m) => {
      if (tagFilter !== 'all' && !(m.tags ?? []).includes(tagFilter)) return false
      if (!q) return true
      const hay = `${m.title} ${m.content ?? ''} ${m.url ?? ''} ${m.notes ?? ''} ${(m.tags ?? []).join(' ')}`.toLowerCase()
      return hay.includes(q)
    })
  }, [materials, search, tagFilter])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    await db.lessonMaterials.add({
      title: form.title.trim(),
      content: form.content.trim() || undefined,
      url: form.url.trim() || undefined,
      notes: form.notes.trim() || undefined,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      createdAt: nowISO(),
    })
    setForm({ title: '', content: '', url: '', notes: '', tags: '' })
  }

  async function remove(id?: number) {
    if (id == null || !confirm('למחוק חומר?')) return
    await db.lessonMaterials.delete(id)
  }

  return (
    <div className="grid" style={{ gap: '1.25rem' }}>
      <section className="panel">
        <h2>חומר לימוד חדש</h2>
        <form className="form" onSubmit={add}>
          <div className="form-row">
            <div className="field">
              <label>כותרת</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>קישור</label>
              <input
                type="url"
                placeholder="https://..."
                value={form.url}
                onChange={(e) => setForm((s) => ({ ...s, url: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>תגיות (פסיקים)</label>
              <input
                value={form.tags}
                onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))}
              />
            </div>
          </div>
          <div className="field">
            <label>תוכן / טקסט</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>הערות</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
            />
          </div>
          <button type="submit" className="btn chinuch">
            <Icon icon={BookPlus} size={ICON_SIZE_SM} />
            הוספה
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="actions" style={{ marginBottom: '0.75rem' }}>
          <h2 style={{ margin: 0, flex: 1 }}>
            מאגר ({listCountLabel(filtered.length, materials?.length ?? 0)})
          </h2>
        </div>
        <div className="actions" style={{ marginBottom: '0.75rem' }}>
          <div className="field" style={{ flex: 1, minWidth: 220 }}>
            <label className="sr-only">חיפוש</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לפי כותרת / תוכן / תגיות"
              aria-label="חיפוש חומרים"
            />
          </div>
          <div className="field" style={{ minWidth: 220 }}>
            <label className="sr-only">סינון תג</label>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              aria-label="סינון לפי תג"
            >
              <option value="all">כל התגיות</option>
              {availableTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        {!filtered.length ? (
          <FilterEmpty
            sourceCount={materials?.length ?? 0}
            filteredCount={0}
            emptyLabel="אין חומרים."
            onClear={() => {
              setSearch('')
              setTagFilter('all')
            }}
          />
        ) : (
          <div className="list">
            {filtered.map((m) => (
              <div key={m.id} className="list-item">
                <div className="stack-sm">
                  <strong>{m.title}</strong>
                  {m.url && (
                    <a
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className="meta"
                      title={m.url}
                    >
                      פתיחת קישור
                    </a>
                  )}
                    {m.content && (
                      <div className="meta">{m.content.slice(0, 160)}</div>
                    )}
                    {m.tags?.length > 0 && (
                      <div className="actions">
                        {m.tags.map((t) => (
                          <span key={t} className="badge">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn small ghost"
                    onClick={() => remove(m.id)}
                  >
                    <Icon icon={Trash2} size={ICON_SIZE_SM} />
                    מחק
                  </button>
                </div>
              ))}
            </div>
        )}
      </section>
    </div>
  )
}
