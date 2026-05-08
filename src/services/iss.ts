import { fetchJson } from '../lib/fetchJson'

type IssNowResponse = {
  message: string
  timestamp: number
  iss_position: { latitude: string; longitude: string }
}

type AstrosResponse = {
  message: string
  number: number
  people?: { name: string; craft: string }[]
}

const OPEN_NOTIFY_BASE = 'http://api.open-notify.org'

export async function fetchIssNow() {
  const data = await fetchJson<IssNowResponse>(`${OPEN_NOTIFY_BASE}/iss-now.json`)
  const latitude = Number.parseFloat(data.iss_position.latitude)
  const longitude = Number.parseFloat(data.iss_position.longitude)
  return {
    latitude,
    longitude,
    timestampMs: data.timestamp * 1000,
  }
}

export async function fetchPeopleInSpace() {
  const data = await fetchJson<AstrosResponse>(`${OPEN_NOTIFY_BASE}/astros.json`)
  const names = (data.people ?? []).map((p) => p.name).filter(Boolean)
  return {
    count: data.number,
    names,
    updatedAtMs: Date.now(),
  }
}

