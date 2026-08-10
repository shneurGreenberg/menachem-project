export interface GeocodeResult {
  lat: number
  lng: number
  displayName: string
}

export async function geocodeAddress(
  address: string,
): Promise<GeocodeResult | null> {
  const q = address.trim()
  if (!q) return null

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', q)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('accept-language', 'he')

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  })
  if (!res.ok) return null
  const data = (await res.json()) as Array<{
    lat: string
    lon: string
    display_name: string
  }>
  if (!data.length) return null
  return {
    lat: Number(data[0].lat),
    lng: Number(data[0].lon),
    displayName: data[0].display_name,
  }
}
