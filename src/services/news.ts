import { fetchJson } from '../lib/fetchJson'
import { readJsonWithTtl, writeJsonWithTtl } from '../lib/storage'
import type { NewsArticle, NewsCategory } from '../types/dashboard'

type GdeltDocResponse = {
  articles?: Array<{
    url?: string
    title?: string
    seendate?: string
    sourceCountry?: string
    domain?: string
    language?: string
    socialimage?: string
  }>
}

type NewsApiResponse = {
  status: 'ok' | 'error'
  totalResults?: number
  articles?: Array<{
    source?: { id?: string | null; name?: string | null }
    author?: string | null
    title?: string | null
    description?: string | null
    url?: string | null
    urlToImage?: string | null
    publishedAt?: string | null
  }>
  message?: string
}

const TTL_15_MIN_MS = 15 * 60 * 1000

function cacheKey(category: NewsCategory) {
  return `foai.news.${category}`
}

function requireNewsApiKey() {
  const key = import.meta.env.VITE_NEWS_API_KEY
  if (!key) throw new Error('Missing VITE_NEWS_API_KEY in .env')
  return key
}

async function fetchFromGdelt(category: NewsCategory): Promise<NewsArticle[]> {
  const query = category === 'science' ? 'science OR space OR nasa' : 'technology OR AI OR software'
  const url = new URL('https://api.gdeltproject.org/api/v2/doc/doc')
  url.searchParams.set('query', query)
  url.searchParams.set('mode', 'ArtList')
  url.searchParams.set('format', 'json')
  url.searchParams.set('maxrecords', '5')
  url.searchParams.set('sort', 'HybridRel')
  url.searchParams.set('format', 'json')

  const data = await fetchJson<GdeltDocResponse>(url.toString())
  const mapped =
    data.articles?.slice(0, 5).map((a, idx) => {
      const title = a.title ?? 'Untitled'
      const urlValue = a.url ?? ''
      const publishedAt = a.seendate ? new Date(a.seendate).toISOString() : new Date().toISOString()
      const source = a.domain ?? a.sourceCountry ?? 'GDELT'
      const author = null
      const description = null
      const imageUrl = a.socialimage ?? null
      const id = `${category}-gdelt-${idx}-${publishedAt}-${title}`.replace(/\s+/g, '-')

      return {
        id,
        category,
        title,
        source,
        author,
        publishedAt,
        url: urlValue,
        imageUrl,
        description,
      } satisfies NewsArticle
    }) ?? []

  return mapped
}

export async function fetchTopHeadlines(category: NewsCategory, force = false): Promise<NewsArticle[]> {
  if (!force) {
    const cached = readJsonWithTtl<NewsArticle[]>(cacheKey(category))
    if (cached) return cached
  }

  const apiKey = import.meta.env.VITE_NEWS_API_KEY
  let mapped: NewsArticle[]

  if (apiKey) {
    try {
      const key = requireNewsApiKey()
      const url = new URL('https://newsapi.org/v2/top-headlines')
      url.searchParams.set('country', 'us')
      url.searchParams.set('category', category)
      url.searchParams.set('pageSize', '5')
      url.searchParams.set('apiKey', key)

      const data = await fetchJson<NewsApiResponse>(url.toString())
      if (data.status !== 'ok') throw new Error(data.message || 'News API error')

      mapped =
        data.articles?.map((a, idx) => {
          const title = a.title ?? 'Untitled'
          const urlValue = a.url ?? ''
          const publishedAt = a.publishedAt ?? new Date().toISOString()
          const source = a.source?.name ?? 'Unknown'
          const author = a.author ?? null
          const description = a.description ?? null
          const imageUrl = a.urlToImage ?? null
          const id = `${category}-${idx}-${publishedAt}-${title}`.replace(/\s+/g, '-')

          return {
            id,
            category,
            title,
            source,
            author,
            publishedAt,
            url: urlValue,
            imageUrl,
            description,
          } satisfies NewsArticle
        }) ?? []
    } catch {
      // If NewsAPI key is missing/invalid or request fails, auto-fallback to a keyless source (GDELT).
      mapped = await fetchFromGdelt(category)
    }
  } else {
    mapped = await fetchFromGdelt(category)
  }

  writeJsonWithTtl(cacheKey(category), mapped, TTL_15_MIN_MS)
  return mapped
}

