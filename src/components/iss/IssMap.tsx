import L from 'leaflet'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip } from 'react-leaflet'
import type { IssSample } from '../../types/dashboard'

// Fix Leaflet default icon paths for bundlers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString(),
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString(),
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString(),
})

export function IssMap({ latest, positions }: { latest: IssSample | null; positions: IssSample[] }) {
  const center: [number, number] = latest ? [latest.latitude, latest.longitude] : [0, 0]
  const polyline = positions.map((p) => [p.latitude, p.longitude] as [number, number])

  return (
    <div className="h-[360px] w-full overflow-hidden rounded-2xl">
      <MapContainer center={center} zoom={3} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {polyline.length >= 2 ? (
          <Polyline positions={polyline} pathOptions={{ color: '#7c3aed', weight: 3, opacity: 0.9 }} />
        ) : null}

        {latest ? (
          <Marker position={[latest.latitude, latest.longitude]}>
            <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
              <div className="text-xs">
                <div>
                  <span className="font-semibold">Lat/Lon:</span> {latest.latitude.toFixed(4)},{' '}
                  {latest.longitude.toFixed(4)}
                </div>
                {latest.speedKmh != null ? (
                  <div>
                    <span className="font-semibold">Speed:</span> {latest.speedKmh.toFixed(2)} km/h
                  </div>
                ) : null}
              </div>
            </Tooltip>
          </Marker>
        ) : null}
      </MapContainer>
    </div>
  )
}

