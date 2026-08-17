import { MapPinned, MessageCircle, Navigation, Phone } from 'lucide-react'
import { Icon, ICON_SIZE_SM } from './icons'
import { mapsUrl, wazeUrl, whatsappUrl } from '../utils/phone'

export function PhoneLink({ phone }: { phone?: string }) {
  const raw = phone?.trim()
  if (!raw) return null
  const href = `tel:${raw.replace(/[^\d+]/g, '')}`
  return (
    <a href={href} className="phone-link" dir="ltr">
      {raw}
    </a>
  )
}

export function ContactActions({
  phone,
  address,
  lat,
  lng,
}: {
  phone?: string
  address?: string
  lat?: number
  lng?: number
}) {
  const hasPhone = Boolean(phone?.trim())
  const hasAddress = Boolean(address?.trim()) || (lat != null && lng != null)
  if (!hasPhone && !hasAddress) return null

  return (
    <div className="actions">
      {hasPhone && (
        <>
          <a className="btn small secondary" href={`tel:${phone!.replace(/[^\d+]/g, '')}`}>
            <Icon icon={Phone} size={ICON_SIZE_SM} />
            חיוג
          </a>
          <a
            className="btn small shlichut"
            href={whatsappUrl(phone!)}
            target="_blank"
            rel="noreferrer"
          >
            <Icon icon={MessageCircle} size={ICON_SIZE_SM} />
            וואטסאפ
          </a>
        </>
      )}
      {hasAddress && (
        <>
          <a
            className="btn small secondary"
            href={wazeUrl(address ?? '', lat, lng)}
            target="_blank"
            rel="noreferrer"
          >
            <Icon icon={Navigation} size={ICON_SIZE_SM} />
            ווייז
          </a>
          <a
            className="btn small ghost"
            href={mapsUrl(address || `${lat},${lng}`)}
            target="_blank"
            rel="noreferrer"
          >
            <Icon icon={MapPinned} size={ICON_SIZE_SM} />
            מפות
          </a>
        </>
      )}
    </div>
  )
}
