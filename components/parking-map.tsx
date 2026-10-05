'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export type Bay = {
  id: string
  street: string
  cross: string
  restriction: string
  detail: string
  status: 'vacant' | 'occupied'
  lat: number
  lng: number
  time: string
}

function Recenter({ selected }: { selected: Bay | null }) {
  const map = useMap()
  useEffect(() => {
    if (selected) map.flyTo([selected.lat, selected.lng], 17, { duration: 0.6 })
  }, [map, selected])
  return null
}

function SearchViewport({ bays, query }: { bays: Bay[]; query: string }) {
  const map = useMap()

  useEffect(() => {
    if (!query) {
      map.setView([-37.8136, 144.9631], 15)
    } else if (bays.length === 1) {
      map.flyTo([bays[0].lat, bays[0].lng], 17, { duration: 0.6 })
    } else if (bays.length > 1) {
      const bounds = L.latLngBounds(
        bays.map((bay) => L.latLng(bay.lat, bay.lng))
      )
      map.fitBounds(bounds, { padding: [32, 32], maxZoom: 17 })
    }
  }, [bays, map, query])

  return null
}

export function ParkingMap({ bays, query, selected, onSelect }: { bays: Bay[]; query: string; selected: Bay | null; onSelect: (bay: Bay) => void }) {
  const mapRef = useRef<L.Map | null>(null)
  return (
    <MapContainer ref={mapRef} center={[-37.8136, 144.9631]} zoom={15} zoomControl={false} className="h-full w-full">
      <TileLayer
  attribution='&copy; OpenStreetMap contributors &copy; CARTO'
  url={`https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${process.env.NEXT_PUBLIC_CARTO_API_KEY}`}
/>
      <Recenter selected={selected} />
  <SearchViewport bays={bays} query={query} />
      {bays.map((bay) => (
        <CircleMarker
          key={bay.id}
          center={[bay.lat, bay.lng]}
          pathOptions={{ color: bay.status === 'vacant' ? '#087f5b' : '#c93232', fillColor: bay.status === 'vacant' ? '#28b487' : '#ef5350', fillOpacity: 1, weight: selected?.id === bay.id ? 5 : 2 }}
          radius={selected?.id === bay.id ? 11 : 8}
          eventHandlers={{ click: () => onSelect(bay) }}
        />
      ))}
    </MapContainer>
  )
}
