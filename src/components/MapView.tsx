import { Fragment, useEffect, useState } from 'react'
import {
  MapContainer,
  Marker,
  Tooltip,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import { Link } from 'react-router-dom'
import MarkerClusterGroup from 'react-leaflet-markercluster'

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

// Slightly larger marker to visually highlight hover.
const HoverIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [30, 50],
  iconAnchor: [15, 50],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface MapPickerProps {
  lat?: number
  lng?: number
  onChange?: (lat: number, lng: number) => void
  markers?: {
    id: number | string
    lat: number
    lng: number
    label: string
    imageDataUrl?: string
    address?: string
    phone?: string
    href?: string
  }[]
  heightClass?: string
  draggable?: boolean
  autoFitMarkers?: boolean
  enableClustering?: boolean
  clusteringThreshold?: number
}

function AutoFitMarkers({ markers }: { markers: MapPickerProps['markers'] }) {
  const map = useMap()
  const fitKey = (markers ?? []).map((m) => `${m.id}:${m.lat}:${m.lng}`).join('|')

  useEffect(() => {
    if (!markers?.length) return
    const latLngs = markers.map((m) => [m.lat, m.lng] as [number, number])
    const bounds = L.latLngBounds(latLngs)

    if (markers.length === 1) {
      map.setView(latLngs[0], 15)
    } else {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 })
    }
  }, [map, fitKey, markers])

  return null
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
  autoFitMarkers = true,
  enableClustering = true,
  clusteringThreshold = 30,
}: MapPickerProps) {
  const center: [number, number] = [lat, lng]
  const showSingle = markers.length === 0 && lat != null && lng != null
  const [hoveredMarkerId, setHoveredMarkerId] = useState<number | string | null>(
    null,
  )

  const shouldCluster =
    enableClustering && markers.length >= clusteringThreshold && !onChange

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
        {autoFitMarkers && !onChange && markers.length > 0 && (
          <AutoFitMarkers markers={markers} />
        )}
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
        {shouldCluster ? (
          <MarkerClusterGroup chunkedLoading>
            {markers.map((m) => (
              <Marker
                key={m.id}
                position={[m.lat, m.lng]}
                icon={hoveredMarkerId === m.id ? HoverIcon : DefaultIcon}
                eventHandlers={{
                  mouseover: () => setHoveredMarkerId(m.id),
                  mouseout: () => setHoveredMarkerId(null),
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -6]}
                  opacity={0.98}
                  sticky={true}
                  className="contact-tooltip"
                >
                  <div className="contact-tooltip-card">
                    <div className="contact-tooltip-row">
                      {m.imageDataUrl ? (
                        <img
                          className="contact-avatar"
                          src={m.imageDataUrl}
                          alt={m.label}
                        />
                      ) : (
                        <div className="contact-avatar contact-avatar-placeholder">
                          {m.label.slice(0, 1)}
                        </div>
                      )}
                      <div className="contact-tooltip-text">
                        <div className="contact-tooltip-name">{m.label}</div>
                        {m.address ? (
                          <div className="contact-tooltip-line">{m.address}</div>
                        ) : null}
                        {m.phone ? (
                          <div className="contact-tooltip-line">{m.phone}</div>
                        ) : null}
                        {m.href ? (
                          <Link
                            to={m.href}
                            className="btn small ghost contact-tooltip-link"
                            aria-label={`לכרטיס של ${m.label}`}
                          >
                            כרטיס
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Tooltip>
              </Marker>
            ))}
          </MarkerClusterGroup>
        ) : (
          <Fragment>
            {markers.map((m) => (
              <Marker
                key={m.id}
                position={[m.lat, m.lng]}
                icon={hoveredMarkerId === m.id ? HoverIcon : DefaultIcon}
                eventHandlers={{
                  mouseover: () => setHoveredMarkerId(m.id),
                  mouseout: () => setHoveredMarkerId(null),
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -6]}
                  opacity={0.98}
                  sticky={true}
                  className="contact-tooltip"
                >
                  <div className="contact-tooltip-card">
                    <div className="contact-tooltip-row">
                      {m.imageDataUrl ? (
                        <img
                          className="contact-avatar"
                          src={m.imageDataUrl}
                          alt={m.label}
                        />
                      ) : (
                        <div className="contact-avatar contact-avatar-placeholder">
                          {m.label.slice(0, 1)}
                        </div>
                      )}
                      <div className="contact-tooltip-text">
                        <div className="contact-tooltip-name">{m.label}</div>
                        {m.address ? (
                          <div className="contact-tooltip-line">{m.address}</div>
                        ) : null}
                        {m.phone ? (
                          <div className="contact-tooltip-line">{m.phone}</div>
                        ) : null}
                        {m.href ? (
                          <Link
                            to={m.href}
                            className="btn small ghost contact-tooltip-link"
                            aria-label={`לכרטיס של ${m.label}`}
                          >
                            כרטיס
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Tooltip>
              </Marker>
            ))}
          </Fragment>
        )}
      </MapContainer>
    </div>
  )
}
