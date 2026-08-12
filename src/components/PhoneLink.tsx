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
