import { useLiveQuery } from 'dexie-react-hooks'
import { MapPin, User } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Icon, ICON_SIZE_SM } from '../../components/icons'
import { MapView } from '../../components/MapView'
import { db } from '../../db'

export function ContactsMapPage() {
  const contacts = useLiveQuery(() => db.contacts.toArray(), [])
  const withCoords = useMemo(
    () => (contacts ?? []).filter((c) => c.lat != null && c.lng != null && c.id != null),
    [contacts],
  )
  const markers = useMemo(
    () =>
      withCoords.map((c) => ({
        id: c.id!,
        lat: c.lat!,
        lng: c.lng!,
        label: c.name,
        imageDataUrl: c.imageDataUrl,
        address: c.address,
        phone: c.phone,
        href: `/shlichut/contacts/${c.id}`,
      })),
    [withCoords],
  )

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <section className="panel">
        <h2>
          <Icon icon={MapPin} size={20} />
          מפת אנשי קשר
        </h2>
        <p>{withCoords.length} מתוך {contacts?.length ?? 0} עם מיקום.</p>
        <MapView
          // Auto-fit uses the markers' bounds; fallback center is handled inside MapView.
          heightClass="tall"
          autoFitMarkers
          markers={markers}
        />
      </section>
      <section className="panel">
        <div className="list">
          {withCoords.map((c) => (
            <Link key={c.id} to={`/shlichut/contacts/${c.id}`} className="list-item">
              <div className="actions" style={{ gap: '0.5rem' }}>
                <Icon icon={User} size={ICON_SIZE_SM} />
                <strong>{c.name}</strong>
              </div>
              <span className="meta">{c.address}</span>
            </Link>
          ))}
          {!withCoords.length && (
            <div className="empty">הוסיפו כתובת או מיקום בכרטיס איש קשר.</div>
          )}
        </div>
      </section>
    </div>
  )
}
