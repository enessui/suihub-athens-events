export type Spot = {
  id: string
  label: string
  // circle center coordinates on the SVG floor map (viewBox 0 0 720 620)
  cx: number
  cy: number
}

// Floor layout:
// - Bar (top) and Reception (bottom) along the left wall (no reservable spots)
// - Table 1 (6 seats) top, Couch 1 (2 spots) to its left
// - Table 2 (4 seats) under Table 1
// - Couch 2 (2 spots, vertical) under Table 2
// - 3 high standing tables under Couch 2
export const SPOTS: Spot[] = [
  // Table 1 — 6 seats (3 top, 3 bottom)
  { id: 'T1-1', label: 'Table 1 · Seat 1', cx: 430, cy: 60 },
  { id: 'T1-2', label: 'Table 1 · Seat 2', cx: 500, cy: 60 },
  { id: 'T1-3', label: 'Table 1 · Seat 3', cx: 570, cy: 60 },
  { id: 'T1-4', label: 'Table 1 · Seat 4', cx: 430, cy: 160 },
  { id: 'T1-5', label: 'Table 1 · Seat 5', cx: 500, cy: 160 },
  { id: 'T1-6', label: 'Table 1 · Seat 6', cx: 570, cy: 160 },
  // Couch 1 — left of Table 1
  { id: 'C1-1', label: 'Couch 1 · Left', cx: 255, cy: 110 },
  { id: 'C1-2', label: 'Couch 1 · Right', cx: 315, cy: 110 },
  // Table 2 — under Table 1 (4 seats)
  { id: 'T2-1', label: 'Table 2 · Seat 1', cx: 465, cy: 235 },
  { id: 'T2-2', label: 'Table 2 · Seat 2', cx: 535, cy: 235 },
  { id: 'T2-3', label: 'Table 2 · Seat 3', cx: 465, cy: 335 },
  { id: 'T2-4', label: 'Table 2 · Seat 4', cx: 535, cy: 335 },
  // Couch 2 — under Table 2 (vertical, reversed)
  { id: 'C2-1', label: 'Couch 2 · Top', cx: 500, cy: 405 },
  { id: 'C2-2', label: 'Couch 2 · Bottom', cx: 500, cy: 462 },
  // High standing tables — under Couch 2
  { id: 'H1', label: 'High table 1', cx: 370, cy: 530 },
  { id: 'H2', label: 'High table 2', cx: 470, cy: 530 },
  { id: 'H3', label: 'High table 3', cx: 570, cy: 530 },
]

export type Reservation = {
  id: string
  spot_id: string
  date: string
  start_hour: number
  end_hour: number
  name: string
  email: string
  created_at: string
}

// Open hours: reservations can start at 10:00 and must end by 19:00
export const OPEN_HOUR = 10
export const CLOSE_HOUR = 19

export function formatHourRange(start: number, end: number): string {
  return `${String(start).padStart(2, '0')}:00 – ${String(end).padStart(2, '0')}:00`
}
