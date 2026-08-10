import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../../db'
import { nowISO } from '../../utils/dates'
import { geocodeAddress } from '../../utils/geocode'

export function ContactsPage() {
  const contacts = useLiveQuery(() => db.contacts.orderBy('name').toArray(), [])
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)

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
            {busy ? 'שומר…' : 'הוספה'}
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>רשימה ({contacts?.length ?? 0})</h2>
        {!contacts?.length ? (
          <div className="empty">עדיין אין אנשי קשר.</div>
        ) : (
          <div className="list">
            {contacts.map((c) => (
              <Link key={c.id} to={`/shlichut/contacts/${c.id}`} className="list-item">
                <div className="stack-sm">
                  <strong>{c.name}</strong>
                  <div className="meta">
                    {c.address || 'ללא כתובת'}
                    {c.phone ? ` · ${c.phone}` : ''}
                    {c.lat != null ? ' · על המפה' : ''}
                  </div>
                </div>
                <span className="btn small secondary">כרטיס</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
