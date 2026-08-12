import { useLiveQuery } from 'dexie-react-hooks'
import { IdCard, Loader2, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon, ICON_SIZE_SM } from '../../components/icons'
import { db } from '../../db'
import { nowISO } from '../../utils/dates'
import { geocodeAddress } from '../../utils/geocode'

export function ContactsPage() {
  const contacts = useLiveQuery(() => db.contacts.toArray(), [])
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState<
    'all' | 'withCoords' | 'withoutCoords'
  >('all')

  const sorted = useMemo(() => {
    const rows = [...(contacts ?? [])]
    rows.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    return rows
  }, [contacts])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sorted.filter((c) => {
      const hasCoords = c.lat != null && c.lng != null
      if (locationFilter === 'withCoords' && !hasCoords) return false
      if (locationFilter === 'withoutCoords' && hasCoords) return false

      if (!q) return true
      const hay = `${c.name} ${c.address ?? ''} ${c.phone ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [sorted, search, locationFilter])

  async function addContact(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    try {
      let lat: number | undefined
      let lng: number | undefined
      if (address.trim()) {
        const geo = await geocodeAddress(address)
        if (geo) {
          lat = geo.lat
          lng = geo.lng
        }
      }
      const ts = nowISO()
      await db.contacts.add({
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim() || undefined,
        customFields: {},
        lat,
        lng,
        createdAt: ts,
        updatedAt: ts,
      })
      setName('')
      setAddress('')
      setPhone('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid" style={{ gap: '1.25rem' }}>
      <section className="panel">
        <h2>איש קשר חדש</h2>
        <form className="form" onSubmit={addContact}>
          <div className="form-row">
            <div className="field">
              <label>שם</label>
              <input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label>טלפון</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="field">
              <label>כתובת</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="למיקום אוטומטי במפה"
              />
            </div>
          </div>
          <button type="submit" className="btn shlichut" disabled={busy}>
            {busy ? (
              <>
                <Icon icon={Loader2} size={ICON_SIZE_SM} className="spin" />
                שומר…
              </>
            ) : (
              <>
                <Icon icon={Plus} size={ICON_SIZE_SM} />
                הוספה
              </>
            )}
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>רשימה ({filtered.length})</h2>
        {!filtered.length ? (
          <div className="empty">עדיין אין אנשי קשר.</div>
        ) : (
          <>
            <div className="actions" style={{ marginBottom: '0.75rem' }}>
              <div className="field" style={{ flex: 1, minWidth: 220 }}>
                <label className="sr-only">חיפוש</label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="חיפוש לפי שם / כתובת / טלפון"
                  aria-label="חיפוש אנשי קשר"
                />
              </div>
              <div className="field" style={{ minWidth: 200 }}>
                <label className="sr-only">סינון מיקום</label>
                <select
                  value={locationFilter}
                  onChange={(e) =>
                    setLocationFilter(e.target.value as typeof locationFilter)
                  }
                  aria-label="סינון מיקום"
                >
                  <option value="all">כל אנשי הקשר</option>
                  <option value="withCoords">עם מיקום</option>
                  <option value="withoutCoords">ללא מיקום</option>
                </select>
              </div>
            </div>

            <div className="list">
              {filtered.map((c) => (
              <Link key={c.id} to={`/shlichut/contacts/${c.id}`} className="list-item">
                <div className="stack-sm">
                  {c.imageDataUrl ? (
                    <img
                      className="contact-avatar"
                      src={c.imageDataUrl}
                      alt={c.name}
                    />
                  ) : null}
                  <strong>{c.name}</strong>
                  <div className="meta">
                    {c.address || 'ללא כתובת'}
                    {c.phone ? ` · ${c.phone}` : ''}
                    {c.lat != null ? ' · על המפה' : ''}
                  </div>
                </div>
                <span className="btn small secondary">
                  <Icon icon={IdCard} size={ICON_SIZE_SM} />
                  כרטיס
                </span>
              </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
