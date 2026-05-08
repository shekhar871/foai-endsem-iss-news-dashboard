export type LatLng = {
  latitude: number
  longitude: number
}

export type IssPosition = LatLng & {
  timestampMs: number
}

export type IssSample = IssPosition & {
  speedKmh: number | null
  nearestPlace: string | null
}

export type PeopleInSpace = {
  count: number
  names: string[]
  updatedAtMs: number
}

export type IssState = {
  latest: IssSample | null
  positions: IssSample[]
  speeds: { timestampMs: number; speedKmh: number }[]
  peopleInSpace: PeopleInSpace | null
  autoRefresh: boolean
  error: string | null
  loading: boolean
}

export type NewsCategory = 'science' | 'technology'

export type NewsArticle = {
  id: string
  category: NewsCategory
  title: string
  source: string
  author: string | null
  publishedAt: string
  url: string
  imageUrl: string | null
  description: string | null
}

export type NewsState = {
  categories: NewsCategory[]
  byCategory: Record<NewsCategory, NewsArticle[]>
  filterCategory: NewsCategory | 'all'
  searchQuery: string
  sortBy: 'date' | 'source'
  totalArticles?: number
  visibleArticles?: NewsArticle[]
  error: string | null
  loadingByCategory: Record<NewsCategory, boolean>
  lastUpdatedByCategory: Record<NewsCategory, number | null>
}

export type DashboardLoading = {
  refreshing: boolean
}

