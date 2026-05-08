import { fetchJson } from '../lib/fetchJson'
import { readJsonWithTtl, writeJsonWithTtl } from '../lib/storage'
import type { NewsArticle, NewsCategory } from '../types/dashboard'

type SpaceflightResponse = {
  results?: Array<{
    id: number
    title?: string
    url?: string
    image_url?: string
    news_site?: string
    summary?: string
    published_at?: string
    authors?: Array<{ name?: string }>
  }>
}

type HnAlgoliaResponse = {
  hits?: Array<{
    objectID: string
    title?: string | null
    url?: string | null
    author?: string | null
    created_at?: string | null
    story_text?: string | null
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
  // Keyless fallback sources that work in browsers:
  // - science: Spaceflight News API
  // - technology: Hacker News Algolia
  if (category === 'science') {
    const url = new URL('https://api.spaceflightnewsapi.net/v4/articles/')
    url.searchParams.set('limit', '5')
    const data = await fetchJson<SpaceflightResponse>(url.toString())
    return (
      data.results?.slice(0, 5).map((a, idx) => {
        const title = a.title ?? 'Untitled'
        const urlValue = a.url ?? ''
        const publishedAt = a.published_at ?? new Date().toISOString()
        const source = a.news_site ?? 'Spaceflight News'
        const author = a.authors?.map((x) => x.name).filter(Boolean).join(', ') || null
        const description = a.summary ?? null
        const imageUrl = a.image_url ?? null
        const id = `${category}-spaceflight-${a.id ?? idx}-${publishedAt}`.replace(/\s+/g, '-')
        return { id, category, title, source, author, publishedAt, url: urlValue, imageUrl, description } satisfies NewsArticle
      }) ?? []
    )
  }

  const hnUrl = new URL('https://hn.algolia.com/api/v1/search_by_date')
  hnUrl.searchParams.set('query', 'technology')
  hnUrl.searchParams.set('tags', 'story')
  hnUrl.searchParams.set('hitsPerPage', '5')
  const hn = await fetchJson<HnAlgoliaResponse>(hnUrl.toString())
  return (
    hn.hits?.slice(0, 5).map((h) => {
      const title = h.title ?? 'Untitled'
      const urlValue = h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`
      const publishedAt = h.created_at ?? new Date().toISOString()
      const source = 'Hacker News'
      const author = h.author ?? null
      const description = h.story_text ?? null
      const imageUrl = null
      const id = `${category}-hn-${h.objectID}`.replace(/\s+/g, '-')
      return { id, category, title, source, author, publishedAt, url: urlValue, imageUrl, description } satisfies NewsArticle
    }) ?? []
  )
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
      // If NewsAPI key is missing/invalid or request fails, auto-fallback to keyless sources.
      mapped = await fetchFromGdelt(category)
    }
  } else {
    mapped = await fetchFromGdelt(category)
  }

  writeJsonWithTtl(cacheKey(category), mapped, TTL_15_MIN_MS)
  return mapped
}

