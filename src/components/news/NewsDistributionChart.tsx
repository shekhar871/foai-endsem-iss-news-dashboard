import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'
import type { NewsCategory } from '../../types/dashboard'

ChartJS.register(ArcElement, Tooltip, Legend)

const COLORS: Record<NewsCategory, string> = {
  science: '#0ea5e9',
  technology: '#22c55e',
}

export function NewsDistributionChart({
  counts,
  active,
  onSelect,
}: {
  counts: Record<NewsCategory, number>
  active: NewsCategory | 'all'
  onSelect: (c: NewsCategory | 'all') => void
}) {
  const labels: NewsCategory[] = ['science', 'technology']
  const data = {
    labels,
    datasets: [
      {
        label: 'Articles',
        data: labels.map((l) => counts[l]),
        backgroundColor: labels.map((l) => COLORS[l]),
        borderWidth: 0,
      },
    ],
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="h-[220px]">
        <Doughnut
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            onClick: (_evt, elements) => {
              if (!elements.length) {
                onSelect('all')
                return
              }
              const idx = elements[0]?.index ?? -1
              const cat = labels[idx]
              if (!cat) return
              onSelect(active === cat ? 'all' : cat)
            },
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          className={`btn ${active === 'all' ? 'btn-primary' : ''}`}
          type="button"
          onClick={() => onSelect('all')}
        >
          All
        </button>
        {labels.map((c) => (
          <button
            key={c}
            className={`btn ${active === c ? 'btn-primary' : ''}`}
            type="button"
            onClick={() => onSelect(active === c ? 'all' : c)}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  )
}

