import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowRight,
  Bell,
  ImagePlus,
  MapPin,
  Save,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon, ICON_SIZE_SM } from '../../components/icons'
import { MapView } from '../../components/MapView'
import { SaveBar } from '../../components/SaveBar'
import { PhoneLink } from '../../components/PhoneLink'
import { db } from '../../db'
import { useSaveFeedback } from '../../hooks/useSaveFeedback'
import { formatDate, nowISO } from '../../utils/dates'
import { geocodeAddress } from '../../utils/geocode'
import { fileToCompressedJpegDataUrl } from '../../utils/image'

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
    imageDataUrl: undefined as string | undefined,
    customFields: {} as Record<string, string>,
  })
  const [geoMsg, setGeoMsg] = useState('')
  const [imgBusy, setImgBusy] = useState(false)
  const [imgMsg, setImgMsg] = useState('')
  const [baseline, setBaseline] = useState('')
  const { saving, saved, error, runSave } = useSaveFeedback()

  const formSnapshot = useMemo(() => JSON.stringify(form), [form])
  const dirty = baseline !== '' && formSnapshot !== baseline

  useEffect(() => {
    if (!contact) return
    const initial = {
      name: contact.name,
      address: contact.address,
      phone: contact.phone ?? '',
      notes: contact.notes ?? '',
      lat: contact.lat,
      lng: contact.lng,
      imageDataUrl: contact.imageDataUrl,
      customFields: { ...contact.customFields },
    }
    setForm(initial)
    setBaseline(JSON.stringify(initial))
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

  async function save(e?: React.FormEvent) {
    e?.preventDefault()
    await runSave(async () => {
      await db.contacts.update(contactId, {
        name: form.name.trim(),
        address: form.address.trim(),
        phone: form.phone.trim() || undefined,
        notes: form.notes.trim() || undefined,
        lat: form.lat,
        lng: form.lng,
        imageDataUrl: form.imageDataUrl || undefined,
        customFields: form.customFields,
        updatedAt: nowISO(),
      })
      setBaseline(formSnapshot)
      setGeoMsg('נשמר.')
    })
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return

    if (!f.type.startsWith('image/')) {
      setImgMsg('קובץ לא נתמך. נא לבחור תמונה.')
      return
    }

    setImgBusy(true)
    setImgMsg('')
    try {
      const dataUrl = await fileToCompressedJpegDataUrl(f, {
        maxDimension: 512,
        quality: 0.82,
      })
      setForm((s) => ({ ...s, imageDataUrl: dataUrl }))
      setImgMsg('התמונה הוכנה לשמירה.')
    } catch {
      setImgMsg('שגיאה בהכנת התמונה. נסה שוב.')
    } finally {
      setImgBusy(false)
      e.target.value = ''
    }
  }

  function removeImage() {
    setForm((s) => ({ ...s, imageDataUrl: undefined }))
    setImgMsg('התמונה הוסרה (עדיין לא נשמר).')
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
    if (!confirm('למחוק את איש הקשר, התזכורות והיומן שלו?')) return
    await db.transaction(
      'rw',
      db.contacts,
      db.reminders,
      db.contactActivityLogs,
      db.activities,
      async () => {
        await db.reminders.where('contactId').equals(contactId).delete()
        await db.contactActivityLogs.where('contactId').equals(contactId).delete()
        await db.activities.where('contactId').equals(contactId).delete()
        await db.contacts.delete(contactId)
      },
    )
    navigate('/shlichut/contacts')
  }

  return (
    <div className="grid" style={{ gap: '1.25rem' }}>
      <div className="actions">
        <Link to="/shlichut/contacts" className="btn secondary small">
          <Icon icon={ArrowRight} size={ICON_SIZE_SM} />
          חזרה לרשימה
        </Link>
        <button type="button" className="btn danger small" onClick={remove}>
          <Icon icon={Trash2} size={ICON_SIZE_SM} />
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
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
              />
              {form.phone.trim() && (
                <div className="meta">
                  <PhoneLink phone={form.phone} />
                </div>
              )}
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
              <Icon icon={MapPin} size={ICON_SIZE_SM} />
              מיקום לפי כתובת
            </button>
            {geoMsg && <span className="muted">{geoMsg}</span>}
          </div>

          <div className="panel" style={{ padding: '0.75rem', background: 'var(--surface)' }}>
            <div className="actions" style={{ marginBottom: '0.35rem' }}>
              <strong>תמונה לאיש קשר</strong>
            </div>

            <div className="actions">
              {form.imageDataUrl ? (
                <>
                  <img
                    src={form.imageDataUrl}
                    alt={form.name || 'תמונה'}
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: 14,
                      objectFit: 'cover',
                      border: '1px solid rgba(31,42,36,0.12)',
                    }}
                  />
                  <button
                    type="button"
                    className="btn small ghost"
                    onClick={removeImage}
                    disabled={imgBusy}
                  >
                    <Icon icon={X} size={ICON_SIZE_SM} />
                    הסרה
                  </button>
                </>
              ) : (
                <span className="muted">אין תמונה עדיין.</span>
              )}

              <label className="btn secondary small" style={{ cursor: imgBusy ? 'not-allowed' : 'pointer' }}>
                <Icon icon={ImagePlus} size={ICON_SIZE_SM} />
                {imgBusy ? 'טוען…' : 'בחירת תמונה'}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={imgBusy}
                  onChange={onPickImage}
                />
              </label>
            </div>

            {imgMsg && <div className="meta">{imgMsg}</div>}
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
            <Icon icon={Save} size={ICON_SIZE_SM} />
            שמירת כרטיס
          </button>
        </form>
      </section>

      <SaveBar
        dirty={dirty}
        saving={saving}
        saved={saved}
        error={error}
        onSave={() => void save()}
        variant="shlichut"
        context={form.name || 'כרטיס איש קשר'}
      />

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
                  <Icon icon={Bell} size={ICON_SIZE_SM} />
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
                <span className="badge">
                  {l.kind === 'reminder' ? 'תזכורת' : l.kind === 'activity' ? 'פעילות' : 'הערה'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
