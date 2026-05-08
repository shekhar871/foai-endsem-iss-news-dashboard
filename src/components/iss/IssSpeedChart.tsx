import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

export function IssSpeedChart({
  speeds,
}: {
  speeds: { timestampMs: number; speedKmh: number }[]
}) {
  const labels = speeds.map((s) =>
    new Date(s.timestampMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  )

  const data = {
    labels,
    datasets: [
      {
        label: 'ISS Speed (km/h)',
        data: speeds.map((s) => s.speedKmh),
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124,58,237,0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
    ],
  }

  return (
    <div className="h-[180px]">
      <Line
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: 'top' },
            tooltip: { enabled: true },
          },
          scales: {
            x: { ticks: { maxTicksLimit: 6 } },
            y: {
              title: { display: true, text: 'km/h' },
              ticks: { callback: (v) => `${v}` },
            },
          },
        }}
      />
    </div>
  )
}

