import { useLiveQuery } from 'dexie-react-hooks'
import { IdCard, Loader2, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FilterEmpty, listCountLabel } from '../../components/FilterEmpty'
import { Icon, ICON_SIZE_SM } from '../../components/icons'
import { db } from '../../db'
import { compareHe, nowISO } from '../../utils/dates'
import { geocodeAddress } from '../../utils/geocode'

export function ContactsPage() {
  const contacts = useLiveQuery(() => db.contacts.toArray(), [])
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [geoMsg, setGeoMsg] = useState('')
  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState<
    'all' | 'withCoords' | 'withoutCoords'
  >('all')

  const sorted = useMemo(() => {
    const rows = [...(contacts ?? [])]
    rows.sort((a, b) => compareHe(a.name, b.name))
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
    setGeoMsg('')
    try {
      let lat: number | undefined
      let lng: number | undefined
      if (address.trim()) {
        const geo = await geocodeAddress(address)
        if (geo) {
          lat = geo.lat
          lng = geo.lng
        } else {
          setGeoMsg('לא נמצא מיקום לכתובת — אפשר להוסיף ידנית בכרטיס.')
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
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
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
          {geoMsg && <p className="muted">{geoMsg}</p>}
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
        <h2>רשימה ({listCountLabel(filtered.length, sorted.length)})</h2>
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
        {!filtered.length ? (
          <FilterEmpty
            sourceCount={sorted.length}
            filteredCount={0}
            emptyLabel="עדיין אין אנשי קשר."
            onClear={() => {
              setSearch('')
              setLocationFilter('all')
            }}
          />
        ) : (
          <div className="list">
            {filtered.map((c) => (
              <Link key={c.id} to={`/shlichut/contacts/${c.id}`} className="list-item">
                <div className="actions" style={{ gap: '0.65rem', alignItems: 'center' }}>
                  {c.imageDataUrl ? (
                    <img className="contact-avatar" src={c.imageDataUrl} alt="" />
                  ) : (
                    <div className="contact-avatar contact-avatar-placeholder">
                      {c.name.slice(0, 1)}
                    </div>
                  )}
                  <div className="stack-sm">
                    <strong>{c.name}</strong>
                    <div className="meta">
                      {c.address || 'ללא כתובת'}
                      {c.phone ? ` · ${c.phone}` : ''}
                      {c.lat != null ? ' · על המפה' : ''}
                    </div>
                  </div>
                </div>
                <span className="btn small secondary">
                  <Icon icon={IdCard} size={ICON_SIZE_SM} />
                  כרטיס
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
