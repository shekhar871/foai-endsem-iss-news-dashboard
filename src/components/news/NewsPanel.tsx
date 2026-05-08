import { ExternalLink, RefreshCcw, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import type { DashboardLoading, NewsArticle, NewsCategory, NewsState } from '../../types/dashboard'
import { EmptyState } from '../ui/EmptyState'
import { Spinner } from '../ui/Spinner'
import { NewsDistributionChart } from './NewsDistributionChart'

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString([], { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function ArticleCard({ a }: { a: NewsArticle }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex gap-3">
        {a.imageUrl ? (
          <img
            src={a.imageUrl}
            alt=""
            className="h-16 w-24 flex-none rounded-lg object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-16 w-24 flex-none rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-xs font-semibold text-zinc-700 dark:text-zinc-200">
              {a.source} • {a.category}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{formatDate(a.publishedAt)}</div>
          </div>

          <div className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">{a.title}</div>
          {a.description ? (
            <div className="mt-1 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-300">{a.description}</div>
          ) : null}

          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">{a.author ?? 'Unknown author'}</div>
            <a className="btn" href={a.url} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Read more</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export function NewsPanel({
  news,
  loading,
  onSetNews,
  onRefreshCategory,
}: {
  news: NewsState & { totalArticles: number; visibleArticles: NewsArticle[] }
  loading: DashboardLoading
  onSetNews: (updater: (prev: NewsState) => NewsState) => void
  onRefreshCategory: (category: NewsCategory) => void
}) {
  const counts: Record<NewsCategory, number> = {
    science: news.byCategory.science.length,
    technology: news.byCategory.technology.length,
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Breaking News</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {news.totalArticles ? `${news.totalArticles} articles` : 'No articles loaded yet'}
            </div>
          </div>
          <button
            className="btn"
            type="button"
            onClick={() => {
              onRefreshCategory('science')
              onRefreshCategory('technology')
              toast.success('Refreshing news')
            }}
            disabled={loading.refreshing}
          >
            <RefreshCcw className={loading.refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            <span className="hidden sm:inline">{loading.refreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        </div>

        <div className="px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                className="input pl-9"
                placeholder="Search title, source, author…"
                value={news.searchQuery}
                onChange={(e) => onSetNews((s) => ({ ...s, searchQuery: e.target.value }))}
              />
            </div>

            <select
              className="input sm:w-[180px]"
              value={news.sortBy}
              onChange={(e) => onSetNews((s) => ({ ...s, sortBy: e.target.value as NewsState['sortBy'] }))}
            >
              <option value="date">Sort by date</option>
              <option value="source">Sort by source</option>
            </select>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3">
            <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">News Distribution</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Click slice to filter</div>
              </div>
              <div className="mt-3">
                <NewsDistributionChart
                  counts={counts}
                  active={news.filterCategory}
                  onSelect={(c) => onSetNews((s) => ({ ...s, filterCategory: c }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="text-zinc-500 dark:text-zinc-400">
                  Showing <span className="font-semibold text-zinc-700 dark:text-zinc-200">{news.visibleArticles.length}</span>{' '}
                  article(s)
                  {news.filterCategory !== 'all' ? ` in ${news.filterCategory}` : ''}
                </div>

                <div className="flex items-center gap-2">
                  {(['science', 'technology'] as const).map((cat) => (
                    <button
                      key={cat}
                      className="btn"
                      type="button"
                      onClick={() => onRefreshCategory(cat)}
                      disabled={news.loadingByCategory[cat]}
                      title={`Refresh ${cat}`}
                    >
                      {news.loadingByCategory[cat] ? <Spinner /> : <RefreshCcw className="h-4 w-4" />}
                      <span className="hidden sm:inline">{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              {news.error ? (
                <EmptyState
                  title="News data unavailable"
                  description={news.error}
                  action={
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => {
                        onRefreshCategory('science')
                        onRefreshCategory('technology')
                      }}
                    >
                      Retry
                    </button>
                  }
                />
              ) : news.visibleArticles.length ? (
                <div className="grid grid-cols-1 gap-3">
                  {news.visibleArticles.map((a) => (
                    <ArticleCard key={a.id} a={a} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No matching articles"
                  description="Try clearing the search or selecting a different category filter."
                  action={
                    <button
                      className="btn"
                      type="button"
                      onClick={() => onSetNews((s) => ({ ...s, searchQuery: '', filterCategory: 'all' }))}
                    >
                      Clear filters
                    </button>
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

