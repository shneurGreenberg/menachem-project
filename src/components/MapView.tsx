import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons under Vite
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

interface MapPickerProps {
  lat?: number
  lng?: number
  onChange?: (lat: number, lng: number) => void
  markers?: { id: number | string; lat: number; lng: number; label: string }[]
  heightClass?: string
  draggable?: boolean
}

function ClickHandler({
  onChange,
}: {
  onChange?: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      onChange?.(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export function MapView({
  lat = 32.0853,
  lng = 34.7818,
  onChange,
  markers = [],
  heightClass = '',
  draggable = false,
}: MapPickerProps) {
  const center: [number, number] = [lat, lng]
  const showSingle = markers.length === 0 && lat != null && lng != null

  return (
    <div className={`map-wrap ${heightClass}`}>
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onChange && <ClickHandler onChange={onChange} />}
        {showSingle && (
          <Marker
            position={center}
            draggable={draggable}
            eventHandlers={
              draggable && onChange
                ? {
                    dragend: (e) => {
                      const m = e.target as L.Marker
                      const pos = m.getLatLng()
                      onChange(pos.lat, pos.lng)
                    },
                  }
                : undefined
            }
          />
        )}
        {markers.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]}>
            <Popup>{m.label}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
