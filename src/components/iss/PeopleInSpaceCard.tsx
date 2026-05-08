import type { PeopleInSpace } from '../../types/dashboard'

export function PeopleInSpaceCard({ people }: { people: PeopleInSpace | null }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">People in Space Right Now</div>
      </div>
      <div className="px-4 py-3 text-sm">
        <div className="flex items-baseline justify-between">
          <div className="text-zinc-500 dark:text-zinc-400">Total</div>
          <div className="text-xl font-semibold">{people?.count ?? '—'}</div>
        </div>

        {people?.names?.length ? (
          <div className="mt-3">
            <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Names</div>
            <ul className="mt-2 grid grid-cols-1 gap-1 text-sm text-zinc-700 dark:text-zinc-200">
              {people.names.slice(0, 12).map((n) => (
                <li key={n} className="truncate rounded-md bg-zinc-50 px-2 py-1 dark:bg-zinc-950">
                  {n}
                </li>
              ))}
            </ul>
            {people.names.length > 12 ? (
              <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                +{people.names.length - 12} more
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">Names not available.</div>
        )}
      </div>
    </div>
  )
}

