import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { MapView } from '../../components/MapView'
import { db } from '../../db'

export function ContactsMapPage() {
  const contacts = useLiveQuery(() => db.contacts.toArray(), [])
  const withCoords = (contacts ?? []).filter(
    (c) => c.lat != null && c.lng != null && c.id != null,
  )

  const center = withCoords[0]
    ? { lat: withCoords[0].lat!, lng: withCoords[0].lng! }
    : { lat: 32.0853, lng: 34.7818 }

  return (
    <div className="grid" style={{ gap: '1rem' }}>
      <section className="panel">
        <h2>מפת אנשי קשר</h2>
        <p>{withCoords.length} מתוך {contacts?.length ?? 0} עם מיקום.</p>
        <MapView
          lat={center.lat}
          lng={center.lng}
          heightClass="tall"
          markers={withCoords.map((c) => ({
            id: c.id!,
            lat: c.lat!,
            lng: c.lng!,
            label: c.name,
          }))}
        />
      </section>
      <section className="panel">
        <div className="list">
          {withCoords.map((c) => (
            <Link key={c.id} to={`/shlichut/contacts/${c.id}`} className="list-item">
              <strong>{c.name}</strong>
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
