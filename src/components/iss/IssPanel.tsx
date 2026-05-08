import { RefreshCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import type { IssState } from '../../types/dashboard'
import { EmptyState } from '../ui/EmptyState'
import { Spinner } from '../ui/Spinner'
import { IssMap } from './IssMap'
import { IssSpeedChart } from './IssSpeedChart'
import { PeopleInSpaceCard } from './PeopleInSpaceCard'

export function IssPanel({
  iss,
  onRefresh,
  onToggleAutoRefresh,
}: {
  iss: IssState
  onRefresh: () => void
  onToggleAutoRefresh: () => void
}) {
  const latest = iss.latest

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">ISS Live Tracking</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {iss.autoRefresh ? 'Auto-refresh: ON (15s)' : 'Auto-refresh: OFF'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn"
              onClick={() => {
                onRefresh()
                toast.success('Refreshing ISS data')
              }}
              title="Manual refresh"
            >
              <RefreshCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              className="btn"
              onClick={() => {
                onToggleAutoRefresh()
                toast.success(`Auto-refresh: ${iss.autoRefresh ? 'OFF' : 'ON'}`)
              }}
              title="Toggle auto-refresh"
            >
              {iss.loading ? <Spinner /> : null}
              <span className="hidden sm:inline">Auto</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-4">
          <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-zinc-950">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Latitude / Longitude</div>
            <div className="mt-1 font-semibold">
              {latest ? `${latest.latitude.toFixed(3)}, ${latest.longitude.toFixed(3)}` : '—'}
            </div>
          </div>
          <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-zinc-950">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Speed</div>
            <div className="mt-1 font-semibold">
              {latest?.speedKmh != null ? `${latest.speedKmh.toFixed(2)} km/h` : '—'}
            </div>
          </div>
          <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-zinc-950">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Nearest place</div>
            <div className="mt-1 truncate font-semibold">{latest?.nearestPlace ?? '—'}</div>
          </div>
          <div className="rounded-xl bg-zinc-50 p-3 text-sm dark:bg-zinc-950">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Tracked positions</div>
            <div className="mt-1 font-semibold">{iss.positions.length}</div>
          </div>
        </div>

        <div className="px-4 pb-4">
          {iss.error ? (
            <EmptyState
              title="ISS data unavailable"
              description={iss.error}
              action={
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => onRefresh()}
                >
                  Retry
                </button>
              }
            />
          ) : (
            <IssMap latest={iss.latest} positions={iss.positions} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">ISS Speed Trend</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Last 30 measurements</div>
          </div>
          <div className="px-4 py-3">
            {iss.speeds.length ? (
              <IssSpeedChart speeds={iss.speeds} />
            ) : (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">Collecting speed samples…</div>
            )}
          </div>
        </div>

        <PeopleInSpaceCard people={iss.peopleInSpace} />
      </div>
    </div>
  )
}

