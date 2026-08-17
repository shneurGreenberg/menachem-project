export function phoneDigits(phone: string): string {
  let d = phone.replace(/[^\d+]/g, '')
  if (d.startsWith('+')) d = d.slice(1)
  if (d.startsWith('0')) d = `972${d.slice(1)}`
  return d
}

export function whatsappUrl(phone: string): string {
  return `https://wa.me/${phoneDigits(phone)}`
}

export function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

export function wazeUrl(address: string, lat?: number, lng?: number): string {
  if (lat != null && lng != null) {
    return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
  }
  return `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`
}
