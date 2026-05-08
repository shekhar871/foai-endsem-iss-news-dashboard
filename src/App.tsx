import 'leaflet/dist/leaflet.css'
import { useMemo } from 'react'
import { Moon, RefreshCcw, Sun } from 'lucide-react'
import toast from 'react-hot-toast'
import { ChatWidget } from './components/chat/ChatWidget'
import { IssPanel } from './components/iss/IssPanel'
import { NewsPanel } from './components/news/NewsPanel'
import { useDashboardData } from './hooks/useDashboardData'
import { useTheme } from './hooks/useTheme'

export default function App() {
  const { isDark, setTheme } = useTheme()
  const { iss, news, refreshAll, loading, refreshIssOnce, setIss, setNews, refreshNewsCategory } = useDashboardData()

  const subtitle = useMemo(() => {
    const parts: string[] = []
    if (iss.latest) parts.push(`ISS: ${iss.latest.latitude.toFixed(3)}, ${iss.latest.longitude.toFixed(3)}`)
    if (news.totalArticles > 0) parts.push(`News: ${news.totalArticles} articles`)
    return parts.join(' • ')
  }, [iss.latest, news.totalArticles])

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold tracking-wide text-indigo-600 dark:text-indigo-400">
              MISSION CONTROL DASHBOARD
            </div>
            <div className="truncate text-lg font-semibold tracking-tight">
              Real‑Time ISS and News Intelligence
            </div>
            {subtitle ? (
              <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              className="btn"
              type="button"
              onClick={() => {
                void refreshAll()
                toast.success('Refreshing dashboard data')
              }}
              disabled={loading.refreshing}
              title={loading.refreshing ? 'Refreshing…' : 'Refresh now'}
            >
              <RefreshCcw className={loading.refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              <span className="hidden sm:inline">{loading.refreshing ? 'Refreshing…' : 'Refresh now'}</span>
            </button>

            <button
              className="btn"
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              title={isDark ? 'Switch to light' : 'Switch to dark'}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="hidden sm:inline">Switch to {isDark ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <IssPanel
            iss={iss}
            onRefresh={() => void refreshIssOnce()}
            onToggleAutoRefresh={() => setIss((s) => ({ ...s, autoRefresh: !s.autoRefresh }))}
          />
        </section>

        <aside className="lg:col-span-1">
          <NewsPanel
            news={news}
            loading={loading}
            onSetNews={(updater) => setNews((prev) => updater(prev))}
            onRefreshCategory={(cat) => void refreshNewsCategory(cat, true)}
          />
        </aside>
      </main>

      <ChatWidget iss={iss} news={news} />
    </div>
  )
}
