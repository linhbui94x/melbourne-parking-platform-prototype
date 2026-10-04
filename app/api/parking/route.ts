import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function fetchAllRows(table: string) {
  const pageSize = 1000
  let from = 0
  let allRows: any[] = []

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, from + pageSize - 1)

    if (error) throw error

    if (!data || data.length === 0) break

    allRows = allRows.concat(data)

    if (data.length < pageSize) break

    from += pageSize
  }

  return allRows
}

export async function GET() {
  try {
    const statuses = await fetchAllRows("sensor_status_current")
    const stagingBays = await fetchAllRows("staging_bays")

    const bayMap = new Map<string, any>()

    for (const bay of stagingBays) {
      if (
        bay.KerbsideID !== null &&
        bay.KerbsideID !== undefined &&
        bay.Latitude !== null &&
        bay.Longitude !== null
      ) {
        bayMap.set(String(bay.KerbsideID), bay)
      }
    }

    const mappedBays = statuses
      .map((status: any) => {
        const bay = bayMap.get(String(status.kerbside_id))

        if (!bay) return null

        return {
          id: String(status.kerbside_id),
          street: bay.RoadSegmentDescription || "Unknown street",
          cross: bay.RoadSegmentDescription || "",
          restriction: "",
          detail: "",
          status:
            status.status_description === "Unoccupied"
              ? "vacant"
              : "occupied",
          lat: Number(bay.Latitude),
          lng: Number(bay.Longitude),
          time: status.status_timestamp || "",
        }
      })
      .filter(Boolean)

    return NextResponse.json(mappedBays)
  } catch (error: any) {
    console.error("Parking API error:", error)

    return NextResponse.json(
      {
        error: error?.message || "Failed to load parking data",
      },
      { status: 500 }
    )
  }
}