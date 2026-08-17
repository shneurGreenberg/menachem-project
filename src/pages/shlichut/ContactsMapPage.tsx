import { useLiveQuery } from 'dexie-react-hooks'
import { MapPin, User } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon, ICON_SIZE_SM } from '../../components/icons'
import { MapView } from '../../components/MapView'
import { db } from '../../db'
import { daysUntil } from '../../utils/dates'
import { lastVisitByContact, lastVisitLabel } from '../../utils/visits'

const AFFILIATIONS = ['קרוב', 'בינוני', 'רחוק', 'לא ידוע'] as const

export function ContactsMapPage() {
  const contacts = useLiveQuery(() => db.contacts.toArray(), [])
  const visits = useLiveQuery(() => lastVisitByContact(), [])
  const [affiliation, setAffiliation] = useState<'all' | string>('all')
  const [stale, setStale] = useState<'all' | 'never' | '30' | '60' | '90'>('all')

  const withCoords = useMemo(() => {
    return (contacts ?? []).filter((c) => {
      if (c.lat == null || c.lng == null || c.id == null) return false
      if (affiliation !== 'all') {
        const aff = c.customFields?.affiliation ?? ''
        if (aff !== affiliation) return false
      }
      if (stale !== 'all') {
        const last = visits?.get(c.id)
        if (stale === 'never') {
          if (last) return false
        } else {
          const days = last ? -daysUntil(last) : 9999
          if (days < Number(stale)) return false
        }
      }
      return true
    })
  }, [contacts, visits, affiliation, stale])

  const markers = useMemo(
    () =>
      withCoords.map((c) => {
        const last = visits?.get(c.id!)
        return {
          id: c.id!,
          lat: c.lat!,
          lng: c.lng!,
          label: c.name,
          imageDataUrl: c.imageDataUrl,
          address: c.address,
          phone: c.phone,
          meta: `ביקור: ${lastVisitLabel(last)}`,
          href: `/shlichut/contacts/${c.id}`,
        }
      }),
    [withCoords, visits],
  )

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <section className="panel">
        <h2>
          <Icon icon={MapPin} size={20} />
          מפת אנשי קשר
        </h2>
        <p>
          {withCoords.length} מתוך {contacts?.length ?? 0} עם מיקום
          {affiliation !== 'all' || stale !== 'all' ? ' (אחרי סינון)' : ''}.
        </p>
        <div className="actions" style={{ marginBottom: '0.75rem' }}>
          <div className="field" style={{ minWidth: 180 }}>
            <label className="sr-only">סינון זיקה</label>
            <select
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              aria-label="סינון לפי זיקה"
            >
              <option value="all">כל הזיקות</option>
              {AFFILIATIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ minWidth: 220 }}>
            <label className="sr-only">סינון ביקור</label>
            <select
              value={stale}
              onChange={(e) => setStale(e.target.value as typeof stale)}
              aria-label="סינון לפי ביקור אחרון"
            >
              <option value="all">כל הביקורים</option>
              <option value="never">לא ביקר</option>
              <option value="30">לפני 30+ ימים</option>
              <option value="60">לפני 60+ ימים</option>
              <option value="90">לפני 90+ ימים</option>
            </select>
          </div>
        </div>
        <MapView
          heightClass="tall"
          autoFitMarkers
          markers={markers}
        />
      </section>
      <section className="panel">
        <div className="list">
          {withCoords.map((c) => {
            const last = visits?.get(c.id!)
            const ago = last ? -daysUntil(last) : 999
            return (
              <Link key={c.id} to={`/shlichut/contacts/${c.id}`} className="list-item">
                <div className="actions" style={{ gap: '0.5rem' }}>
                  <Icon icon={User} size={ICON_SIZE_SM} />
                  <div className="stack-sm">
                    <strong>{c.name}</strong>
                    <div className={ago >= 60 ? 'meta stale' : 'meta'}>
                      {lastVisitLabel(last)}
                      {c.customFields?.affiliation
                        ? ` · ${c.customFields.affiliation}`
                        : ''}
                    </div>
                  </div>
                </div>
                <span className="meta">{c.address}</span>
              </Link>
            )
          })}
          {!withCoords.length && (
            <div className="empty">אין אנשי קשר שמתאימים לסינון, או שחסר מיקום.</div>
          )}
        </div>
      </section>
    </div>
  )
}
