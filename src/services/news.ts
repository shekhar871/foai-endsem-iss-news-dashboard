import { fetchJson } from '../lib/fetchJson'
import { readJsonWithTtl, writeJsonWithTtl } from '../lib/storage'
import type { NewsArticle, NewsCategory } from '../types/dashboard'

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

export async function fetchTopHeadlines(category: NewsCategory, force = false): Promise<NewsArticle[]> {
  if (!force) {
    const cached = readJsonWithTtl<NewsArticle[]>(cacheKey(category))
    if (cached) return cached
  }

  const apiKey = requireNewsApiKey()
  const url = new URL('https://newsapi.org/v2/top-headlines')
  url.searchParams.set('country', 'us')
  url.searchParams.set('category', category)
  url.searchParams.set('pageSize', '5')
  url.searchParams.set('apiKey', apiKey)

  const data = await fetchJson<NewsApiResponse>(url.toString())
  if (data.status !== 'ok') throw new Error(data.message || 'News API error')

  const mapped =
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

  writeJsonWithTtl(cacheKey(category), mapped, TTL_15_MIN_MS)
  return mapped
}

