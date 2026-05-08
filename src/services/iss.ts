import { fetchJson } from '../lib/fetchJson'

type WhereTheIssResponse = {
  name?: string
  id?: number
  latitude: number
  longitude: number
  velocity?: number
  timestamp: number
}

type SpaceDevsAstronauts = {
  count?: number
  results?: Array<{
    name?: string
    status?: { name?: string }
    nationality?: string
  }>
}

export async function fetchIssNow() {
  // HTTPS endpoint (works on Vercel) and includes timestamp.
  const data = await fetchJson<WhereTheIssResponse>(
    'https://api.wheretheiss.at/v1/satellites/25544?units=kilometers',
  )
  return {
    latitude: data.latitude,
    longitude: data.longitude,
    timestampMs: data.timestamp * 1000,
  }
}

export async function fetchPeopleInSpace() {
  // Keyless HTTPS endpoint. Returns astronauts currently in space.
  const url = 'https://ll.thespacedevs.com/2.2.0/astronaut/?in_space=true&limit=100'
  const data = await fetchJson<SpaceDevsAstronauts>(url)
  const names = (data.results ?? []).map((p) => p.name).filter(Boolean) as string[]
  return {
    count: data.count ?? names.length,
    names,
    updatedAtMs: Date.now(),
  }
}

