export function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export function readJson<T>(key: string): T | null {
  return safeJsonParse<T>(localStorage.getItem(key))
}

export function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export type TtlEnvelope<T> = { savedAt: number; ttlMs: number; value: T }

export function readJsonWithTtl<T>(key: string): T | null {
  const env = readJson<TtlEnvelope<T>>(key)
  if (!env) return null
  if (Date.now() - env.savedAt > env.ttlMs) return null
  return env.value
}

export function writeJsonWithTtl<T>(key: string, value: T, ttlMs: number) {
  writeJson(key, { savedAt: Date.now(), ttlMs, value } satisfies TtlEnvelope<T>)
}

