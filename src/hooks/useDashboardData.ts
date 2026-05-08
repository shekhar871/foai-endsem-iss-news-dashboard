import { useCallback, useEffect, useMemo, useState } from 'react'
import { haversineKm } from '../lib/haversine'
import type { DashboardLoading, IssSample, IssState, NewsCategory, NewsState } from '../types/dashboard'
import { useInterval } from './useInterval'
import { fetchIssNow, fetchPeopleInSpace } from '../services/iss'
import { reverseGeocode } from '../services/geocode'
import { fetchTopHeadlines } from '../services/news'

const ISS_POSITIONS_MAX = 15
const ISS_SPEED_SAMPLES_MAX = 30

function emptyNewsState(): NewsState {
  return {
    categories: ['science', 'technology'],
    byCategory: { science: [], technology: [] },
    filterCategory: 'all',
    searchQuery: '',
    sortBy: 'date',
    error: null,
    loadingByCategory: { science: false, technology: false },
    lastUpdatedByCategory: { science: null, technology: null },
  }
}

function emptyIssState(): IssState {
  return {
    latest: null,
    positions: [],
    speeds: [],
    peopleInSpace: null,
    autoRefresh: true,
    error: null,
    loading: false,
  }
}

function computeSpeedKmh(prev: { latitude: number; longitude: number; timestampMs: number }, next: {
  latitude: number
  longitude: number
  timestampMs: number
}) {
  const distanceKm = haversineKm(prev, next)
  const dtHours = (next.timestampMs - prev.timestampMs) / (1000 * 60 * 60)
  if (dtHours <= 0) return null
  const speed = distanceKm / dtHours
  return Number.isFinite(speed) ? speed : null
}

export function useDashboardData() {
  const [iss, setIss] = useState<IssState>(() => emptyIssState())
  const [news, setNews] = useState<NewsState>(() => emptyNewsState())
  const [loading, setLoading] = useState<DashboardLoading>({ refreshing: false })

  const refreshIssOnce = useCallback(async () => {
    setIss((s) => ({ ...s, loading: true, error: null }))
    try {
      const pos = await fetchIssNow()

      let nearestPlace: string | null = null
      try {
        nearestPlace = await reverseGeocode(pos.latitude, pos.longitude)
      } catch {
        nearestPlace = null
      }

      setIss((s) => {
        const prev = s.positions[s.positions.length - 1] ?? s.latest
        const speedKmh = prev ? computeSpeedKmh(prev, pos) : null
        const sample: IssSample = { ...pos, speedKmh, nearestPlace }
        const nextPositions = [...s.positions, sample].slice(-ISS_POSITIONS_MAX)
        const nextSpeeds =
          sample.speedKmh != null
            ? [...s.speeds, { timestampMs: sample.timestampMs, speedKmh: sample.speedKmh }].slice(
                -ISS_SPEED_SAMPLES_MAX,
              )
            : s.speeds

        return {
          ...s,
          latest: sample,
          positions: nextPositions,
          speeds: nextSpeeds,
          loading: false,
          error: null,
        }
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch ISS position'
      setIss((s) => ({ ...s, loading: false, error: msg }))
    }
  }, [])

  const refreshPeople = useCallback(async () => {
    try {
      const data = await fetchPeopleInSpace()
      setIss((s) => ({ ...s, peopleInSpace: data }))
    } catch {
      // non-fatal
    }
  }, [])

  const refreshNewsCategory = useCallback(async (category: NewsCategory, force = false) => {
    setNews((s) => ({
      ...s,
      error: null,
      loadingByCategory: { ...s.loadingByCategory, [category]: true },
    }))
    try {
      const items = await fetchTopHeadlines(category, force)
      setNews((s) => ({
        ...s,
        byCategory: { ...s.byCategory, [category]: items },
        loadingByCategory: { ...s.loadingByCategory, [category]: false },
        lastUpdatedByCategory: { ...s.lastUpdatedByCategory, [category]: Date.now() },
      }))
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch news'
      setNews((s) => ({
        ...s,
        error: msg,
        loadingByCategory: { ...s.loadingByCategory, [category]: false },
      }))
    }
  }, [])

  const refreshAll = useCallback(async () => {
    setLoading({ refreshing: true })
    try {
      await Promise.all([
        refreshIssOnce(),
        refreshPeople(),
        refreshNewsCategory('science', true),
        refreshNewsCategory('technology', true),
      ])
    } finally {
      setLoading({ refreshing: false })
    }
  }, [refreshIssOnce, refreshNewsCategory, refreshPeople])

  // initial load
  useEffect(() => {
    let cancelled = false
    const id = window.setTimeout(() => {
      if (cancelled) return
      void refreshIssOnce()
      void refreshPeople()
      void refreshNewsCategory('science')
      void refreshNewsCategory('technology')
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ISS polling every 15s
  useInterval(
    () => {
      if (!iss.autoRefresh) return
      void refreshIssOnce()
    },
    15_000,
  )

  const totalArticles = useMemo(() => {
    return Object.values(news.byCategory).reduce((acc, a) => acc + a.length, 0)
  }, [news.byCategory])

  const visibleArticles = useMemo(() => {
    const categories: NewsCategory[] =
      news.filterCategory === 'all' ? news.categories : [news.filterCategory]
    const combined = categories.flatMap((c) => news.byCategory[c] ?? [])

    const q = news.searchQuery.trim().toLowerCase()
    const filtered = q
      ? combined.filter((a) => {
          const hay = `${a.title} ${a.source} ${a.author ?? ''} ${a.description ?? ''}`.toLowerCase()
          return hay.includes(q)
        })
      : combined

    const sorted = [...filtered].sort((a, b) => {
      if (news.sortBy === 'source') return a.source.localeCompare(b.source)
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    })

    return sorted
  }, [news.byCategory, news.categories, news.filterCategory, news.searchQuery, news.sortBy])

  const derivedNews = useMemo(() => {
    return {
      ...news,
      totalArticles,
      visibleArticles,
    }
  }, [news, totalArticles, visibleArticles])

  return {
    iss,
    setIss,
    news: derivedNews,
    setNews,
    refreshIssOnce,
    refreshPeople,
    refreshNewsCategory,
    refreshAll,
    loading,
  }
}

