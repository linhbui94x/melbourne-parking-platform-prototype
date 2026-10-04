'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  CarFront,
  CircleHelp,
  Clock3,
  Filter,
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Bay } from '@/components/parking-map'

const ParkingMap = dynamic(
  () =>
    import('@/components/parking-map').then(
      (mod) => mod.ParkingMap
    ),
  { ssr: false }
)

export default function Page() {
  const [started, setStarted] = useState(false)
  const [query, setQuery] = useState('')
  const [vacantOnly, setVacantOnly] = useState(false)
  const [period, setPeriod] = useState('All time limits')
  const [selected, setSelected] = useState<Bay | null>(null)

  // Live bays from /api/parking
  const [bays, setBays] = useState<Bay[]>([])

  useEffect(() => {
    async function loadParking() {
      try {
        const response = await fetch('/api/parking', {
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error(
            `Parking API error: ${response.status}`
          )
        }

        const data = await response.json()

        if (Array.isArray(data)) {
          setBays(data)
        } else {
          console.error(
            'Unexpected API response:',
            data
          )
          setBays([])
        }
      } catch (error) {
        console.error(
          'Parking fetch error:',
          error
        )
        setBays([])
      }
    }

    loadParking()
  }, [])

  const filtered = useMemo(
    () =>
      bays.filter(
        (bay) =>
          (!vacantOnly ||
            bay.status === 'vacant') &&
          (!query ||
            bay.street
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (period === 'All time limits' ||
            bay.restriction.startsWith(period))
      ),
    [bays, query, vacantOnly, period]
  )

  if (!started) {
    return (
      <Landing
        onStart={() => setStarted(true)}
      />
    )
  }

  return (
    <main className="flex h-dvh min-h-0 flex-col overflow-hidden bg-[#eaf0ed] text-[#17342d]">
      <header className="relative z-30 flex h-14 shrink-0 items-center justify-between border-b border-white/60 bg-[#f9fcfa]/95 px-3 shadow-sm backdrop-blur md:h-16 md:px-8">
        <button
          className="flex items-center gap-2"
          onClick={() => setStarted(false)}
          aria-label="Return to Parking Melbourne home"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-[#126b50] text-white md:size-9">
            <CarFront className="size-4 md:size-5" />
          </span>

          <span className="text-base font-bold tracking-tight md:text-lg">
            Parking Melbourne
          </span>
        </button>

        <div className="hidden items-center gap-2 text-xs font-semibold text-[#55736a] sm:flex">
          <span className="size-2 rounded-full bg-[#28b487]" />
          Live data · Melbourne CBD
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-full"
          aria-label="Help"
        >
          <CircleHelp />
        </Button>
      </header>

      <section className="relative flex min-h-0 flex-1 w-full flex-col overflow-hidden">
        {/* Search bar */}
        <div className="relative z-20 order-1 shrink-0 border-b border-[#d8e4de] bg-[#f9fcfa] p-2.5 md:p-4">
          <div className="mx-auto flex max-w-3xl flex-col gap-2 rounded-2xl border border-white/70 bg-white/95 p-2 shadow-xl shadow-[#17342d]/15 backdrop-blur sm:flex-row">
            <div className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl bg-[#eef4f1] px-3">
              <Search className="size-5 shrink-0 text-[#55736a]" />

              <input
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                placeholder="Search a street, e.g. Collins Street"
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#789087] md:text-base"
                aria-label="Search by street"
              />

              {query && (
                <button
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                >
                  <X className="size-5" />
                </button>
              )}
            </div>

            <Button
              variant={
                vacantOnly
                  ? 'default'
                  : 'outline'
              }
              onClick={() =>
                setVacantOnly(!vacantOnly)
              }
              className="min-h-11 rounded-xl px-4"
            >
              <Filter data-icon="inline-start" />
              Vacant only
            </Button>
          </div>
        </div>

        {/* Map */}
        <div className="relative order-2 min-h-0 flex-1">
          <ParkingMap
            bays={filtered}
            selected={selected}
            onSelect={setSelected}
          />

          <div className="absolute bottom-6 right-3 z-10 hidden rounded-2xl border border-white/70 bg-white/95 p-3 text-xs shadow-lg backdrop-blur md:block">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-[#28b487]" />
              Vacant
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span className="size-3 rounded-full bg-[#ef5350]" />
              Occupied
            </div>
          </div>

          <button
            className="absolute right-3 top-4 z-10 grid size-11 place-items-center rounded-xl border border-white/70 bg-white text-[#126b50] shadow-lg md:right-6 md:top-6"
            aria-label="Centre on my location"
          >
            <Navigation className="size-5" />
          </button>
        </div>

        {/* Bottom panel */}
        <div className="relative z-20 order-3 shrink-0 border-t border-[#d8e4de] bg-[#eaf0ed] p-2.5 md:p-5 md:pl-8">
          <div className="w-full md:max-w-none">
            {selected ? (
              <Details
                bay={selected}
                onClose={() =>
                  setSelected(null)
                }
              />
            ) : (
              <div className="rounded-2xl border border-white/70 bg-white/95 p-3.5 shadow-xl backdrop-blur md:p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold md:text-base">
                    Find a bay in Melbourne CBD
                  </p>

                  <span className="text-xs text-[#55736a]">
                    {filtered.length} shown
                  </span>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {[
                    'All time limits',
                    '1P',
                    '2P',
                    '3P',
                    '4P',
                  ].map((option) => (
                    <button
                      key={option}
                      onClick={() =>
                        setPeriod(option)
                      }
                      className={`rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition md:px-3 md:py-2 md:text-xs ${
                        period === option
                          ? 'bg-[#17342d] text-white'
                          : 'bg-[#edf3f0] text-[#55736a]'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                <p className="mt-2.5 flex items-center gap-2 text-xs text-[#55736a]">
                  <MapPin className="size-4" />
                  Tap a marker to see restrictions
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

function Details({
  bay,
  onClose,
}: {
  bay: Bay
  onClose: () => void
}) {
  return (
    <article className="max-h-[42dvh] overflow-y-auto rounded-2xl border border-white/70 bg-white p-4 shadow-xl md:max-h-[48dvh] md:p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold">
            <span
              className={`size-3 rounded-full ${
                bay.status === 'vacant'
                  ? 'bg-[#28b487]'
                  : 'bg-[#ef5350]'
              }`}
            />

            {bay.status === 'vacant'
              ? 'Vacant now'
              : 'Occupied'}
          </div>

          <h2 className="mt-1.5 text-lg font-bold md:text-xl">
            {bay.street}
          </h2>

          <p className="text-xs text-[#55736a] md:text-sm">
            {bay.cross} · Bay {bay.id}
          </p>
        </div>

        <button
          onClick={onClose}
          className="rounded-full p-2 text-[#55736a] hover:bg-[#edf3f0]"
          aria-label="Close parking information"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="my-3 rounded-xl bg-[#edf3f0] p-3">
        <p className="text-xs font-bold tracking-wide text-[#126b50] md:text-sm">
          {bay.restriction ||
            'Restriction data unavailable'}
        </p>

        <p className="mt-1.5 text-xs leading-5 text-[#35564c] md:text-sm md:leading-6">
          {bay.detail ||
            'Restriction details will be added after the live bay connection is confirmed.'}
        </p>
      </div>

      <p className="flex items-center gap-2 text-[11px] text-[#789087] md:text-xs">
        <Clock3 className="size-4" />
        {bay.time}
      </p>
    </article>
  )
}

function Landing({
  onStart,
}: {
  onStart: () => void
}) {
  return (
    <main className="h-dvh overflow-hidden bg-[#071b20] text-white">
      <div className="relative mx-auto flex h-full max-w-7xl flex-col px-5 py-5 md:px-10 md:py-7">
        <div className="order-4 shrink-0 rounded-xl border border-white/10 bg-[#102f35] px-3 py-2.5 text-center text-[10px] font-semibold leading-4 text-[#b7d0ce] md:text-xs">
          Coming soon: Predictive Availability
          Heatmap &amp; Private Off-Street Car
          Parks
        </div>

        <header className="order-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-[#65e0bd] text-[#071b20] md:size-10">
              <CarFront className="size-5" />
            </span>

            <span className="text-lg font-bold tracking-tight md:text-xl">
              Parking Melbourne
            </span>
          </div>

          <span className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-semibold text-[#b7d0ce] md:text-xs">
            Melbourne CBD
          </span>
        </header>

        <div className="order-3 grid min-h-0 flex-1 items-center gap-5 py-4 md:grid-cols-[1.05fr_.95fr] md:gap-12 md:py-5">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#286069] bg-[#102f35] px-3 py-1.5 text-[11px] font-bold text-[#aee8d7] md:text-xs">
              <Sparkles className="size-3.5" />
              Real-time parking, made simple
            </div>

            <h1 className="max-w-2xl text-[2.75rem] font-bold leading-[.98] tracking-[-0.05em] sm:text-5xl md:text-7xl">
              Spend less time looking.{' '}
              <span className="text-[#ffcf68]">
                Park smarter.
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-[#b7d0ce] md:mt-5 md:text-lg md:leading-8">
              A clear, live view of on-street
              parking across Melbourne CBD. Find a
              bay, understand the restrictions, and
              get on with your day.
            </p>

            <Button
              onClick={onStart}
              className="mt-6 min-h-12 rounded-xl bg-[#ffcf68] px-6 text-sm font-bold text-[#071b20] shadow-[0_12px_30px_rgba(255,207,104,.18)] transition-all hover:-translate-y-0.5 hover:bg-[#ffe19a] hover:shadow-[0_16px_36px_rgba(255,207,104,.3)] md:mt-7 md:min-h-14 md:text-base"
            >
              Get Started
              <ArrowRight data-icon="inline-end" />
            </Button>

            <div className="mt-6 flex flex-wrap gap-4 text-xs text-[#b7d0ce] md:mt-8 md:gap-6 md:text-sm">
              <span className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-[#65e0bd]" />
                Driver-friendly design
              </span>

              <span className="flex items-center gap-2">
                <MapPin className="size-4 text-[#65e0bd]" />
                CBD coverage
              </span>
            </div>
          </div>

          <div className="relative hidden min-h-[300px] md:block">
            <div className="absolute inset-8 rotate-[-5deg] rounded-[2rem] border border-[#27606a] bg-[#0d2b32] shadow-2xl">
              <div className="absolute inset-5 rounded-2xl border border-[#285760] bg-[#123840]">
                <div className="absolute left-1/2 top-1/2 size-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#65e0bd]/30" />

                <span className="absolute left-[30%] top-[34%] size-4 rounded-full bg-[#65e0bd] shadow-[0_0_0_7px_rgba(101,224,189,.18)]" />

                <span className="absolute right-[28%] top-[51%] size-4 rounded-full bg-[#ff746c] shadow-[0_0_0_7px_rgba(255,116,108,.18)]" />

                <span className="absolute left-[47%] bottom-[25%] size-4 rounded-full bg-[#65e0bd] shadow-[0_0_0_7px_rgba(101,224,189,.18)]" />
              </div>
            </div>

            <div className="absolute bottom-1 right-1 rounded-2xl border border-[#2b6269] bg-[#102f35]/90 p-4 text-xs text-[#b7d0ce] shadow-xl">
              <div className="flex items-center gap-2 font-bold text-white">
                <span className="size-2.5 rounded-full bg-[#65e0bd]" />
                Live bay availability
              </div>

              <p className="mt-2">
                Updated every 2 minutes
              </p>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between text-[10px] text-[#769293] md:text-xs" />
      </div>
    </main>
  )
}