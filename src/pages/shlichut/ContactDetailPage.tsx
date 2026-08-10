import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MapView } from '../../components/MapView'
import { db } from '../../db'
import { formatDate, nowISO } from '../../utils/dates'
import { geocodeAddress } from '../../utils/geocode'

export function ContactDetailPage() {
  const { id } = useParams()
  const contactId = Number(id)
  const navigate = useNavigate()

  const contact = useLiveQuery(async () => {
    if (!Number.isFinite(contactId)) return null
    return (await db.contacts.get(contactId)) ?? null
  }, [contactId])
  const fieldDefs = useLiveQuery(
    () => db.customFieldDefs.orderBy('order').toArray(),
    [],
  )
  const logs = useLiveQuery(
    () =>
      db.contactActivityLogs
        .where('contactId')
        .equals(contactId)
        .reverse()
        .sortBy('date'),
    [contactId],
  )
  const reminders = useLiveQuery(
    () => db.reminders.where('contactId').equals(contactId).toArray(),
    [contactId],
  )

  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    notes: '',
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    customFields: {} as Record<string, string>,
  })
  const [geoMsg, setGeoMsg] = useState('')

  useEffect(() => {
    if (!contact) return
    setForm({
      name: contact.name,
      address: contact.address,
      phone: contact.phone ?? '',
      notes: contact.notes ?? '',
      lat: contact.lat,
      lng: contact.lng,
      customFields: { ...contact.customFields },
    })
  }, [contact])

  if (!Number.isFinite(contactId)) {
    return <div className="empty">מזהה לא תקין</div>
  }
  if (contact === undefined) {
    return <div className="empty">טוען…</div>
  }
  if (contact === null) {
    return (
      <div className="empty">
        איש קשר לא נמצא. <Link to="/shlichut/contacts">חזרה</Link>
      </div>
    )
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    await db.contacts.update(contactId, {
      name: form.name.trim(),
      address: form.address.trim(),
      phone: form.phone.trim() || undefined,
      notes: form.notes.trim() || undefined,
      lat: form.lat,
      lng: form.lng,
      customFields: form.customFields,
      updatedAt: nowISO(),
    })
    setGeoMsg('נשמר.')
  }

  async function geocode() {
    setGeoMsg('מחפש כתובת…')
    const geo = await geocodeAddress(form.address)
    if (!geo) {
      setGeoMsg('לא נמצא מיקום. ניתן לגרור את הסימון ידנית.')
      return
    }
    setForm((s) => ({ ...s, lat: geo.lat, lng: geo.lng }))
    setGeoMsg(geo.displayName)
  }

  async function remove() {
    if (!confirm('למחוק את איש הקשר?')) return
    await db.contacts.delete(contactId)
    navigate('/shlichut/contacts')
  }

  return (
    <div className="grid" style={{ gap: '1.25rem' }}>
      <div className="actions">
        <Link to="/shlichut/contacts" className="btn secondary small">
          ← חזרה לרשימה
        </Link>
        <button type="button" className="btn danger small" onClick={remove}>
          מחיקה
        </button>
      </div>

      <section className="panel">
        <h2>{form.name || 'כרטיס איש קשר'}</h2>
        <form className="form" onSubmit={save}>
          <div className="form-row">
            <div className="field">
              <label>שם</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>טלפון</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
              />
            </div>
          </div>
          <div className="field">
            <label>כתובת</label>
            <input
              value={form.address}
              onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
            />
          </div>
          <div className="actions">
            <button type="button" className="btn secondary small" onClick={geocode}>
              מיקום לפי כתובת (Nominatim)
            </button>
            {geoMsg && <span className="muted">{geoMsg}</span>}
          </div>

          {(fieldDefs ?? []).map((f) => (
            <div className="field" key={f.id}>
              <label>{f.label}</label>
              {f.type === 'select' ? (
                <select
                  value={form.customFields[f.key] ?? ''}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      customFields: { ...s.customFields, [f.key]: e.target.value },
                    }))
                  }
                >
                  <option value="">—</option>
                  {(f.options ?? []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : 'text'}
                  value={form.customFields[f.key] ?? ''}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      customFields: { ...s.customFields, [f.key]: e.target.value },
                    }))
                  }
                />
              )}
            </div>
          ))}

          <div className="field">
            <label>הערות</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
            />
          </div>

          <button type="submit" className="btn shlichut">
            שמירת כרטיס
          </button>
        </form>
      </section>

      <section className="panel">
        <h3>מפה — גרור את הסימון לעדכון מיקום</h3>
        <MapView
          lat={form.lat ?? 32.0853}
          lng={form.lng ?? 34.7818}
          draggable
          onChange={(lat, lng) => setForm((s) => ({ ...s, lat, lng }))}
        />
        <p className="muted" style={{ marginTop: '0.5rem' }}>
          {form.lat != null
            ? `${form.lat.toFixed(5)}, ${form.lng?.toFixed(5)}`
            : 'אין מיקום עדיין'}
        </p>
      </section>

      <section className="panel">
        <h3>תזכורות מקושרות</h3>
        {!reminders?.length ? (
          <div className="empty">אין תזכורות לאיש קשר זה.</div>
        ) : (
          <div className="list">
            {reminders.map((r) => (
              <div key={r.id} className="list-item">
                <div>
                  <strong>{r.title}</strong>
                  <div className="meta">
                    {r.status === 'done' ? 'בוצע' : 'פתוח'}
                    {r.dueDate ? ` · ${formatDate(r.dueDate)}` : ''}
                  </div>
                </div>
                <Link to="/shlichut/reminders" className="btn small secondary">
                  תזכורות
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h3>היסטוריית פעילות</h3>
        {!logs?.length ? (
          <div className="empty">עדיין אין רישומים.</div>
        ) : (
          <div className="list">
            {[...(logs ?? [])].reverse().map((l) => (
              <div key={l.id} className="list-item">
                <div className="stack-sm">
                  <strong>{l.title}</strong>
                  {l.details && <div className="meta">{l.details}</div>}
                  <div className="meta">{formatDate(l.date)}</div>
                </div>
                <span className="badge">{l.kind}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
