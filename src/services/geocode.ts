import { fetchJson } from '../lib/fetchJson'

type NominatimReverse = {
  display_name?: string
  name?: string
  address?: {
    city?: string
    town?: string
    village?: string
    state?: string
    country?: string
    ocean?: string
    sea?: string
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  // Nominatim requires a User-Agent; browsers may block custom UA headers,
  // but we can still provide an identifiable Referer via `headers`.
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
    String(lat),
  )}&lon=${encodeURIComponent(String(lon))}&zoom=6`

  const data = await fetchJson<NominatimReverse>(url, {
    headers: {
      Accept: 'application/json',
    },
  })

  const a = data.address
  const primary =
    a?.ocean ??
    a?.sea ??
    a?.city ??
    a?.town ??
    a?.village ??
    (data.name ? data.name : undefined)

  const country = a?.country
  const state = a?.state

  const parts = [primary, state, country].filter(Boolean) as string[]
  if (parts.length === 0) return data.display_name ?? null
  return parts.join(', ')
}

