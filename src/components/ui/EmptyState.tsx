import type React from 'react'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{title}</div>
      {description ? <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{description}</div> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}

