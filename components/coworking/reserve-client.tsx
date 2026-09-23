'use client'

import { useState } from 'react'
import { CheckinClient } from '@/components/checkin/checkin-client'
import { MeetingRoomBooker } from '@/components/meeting-room/meeting-room-booker'
import type { MeetingBooking } from '@/lib/meeting-room'
import type { CheckinEntry, DailyCount, LeaderboardEntry } from '@/app/checkin/actions'

export function ReserveClient({
  initialDate,
  initialMeetingBookings,
  initialMode = 'checkin',
  checkinCount,
  leaderboard,
  allTimeLeaderboard,
  attendance,
  isAdmin,
}: {
  initialDate: string
  initialMeetingBookings: MeetingBooking[]
  initialMode?: 'meeting' | 'checkin'
  checkinCount: number
  leaderboard: LeaderboardEntry[]
  allTimeLeaderboard: LeaderboardEntry[]
  attendance: { today: CheckinEntry[]; daily: DailyCount[] } | null
  isAdmin: boolean
}) {
  const [mode, setMode] = useState<'meeting' | 'checkin'>(initialMode)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex h-9 items-stretch self-start rounded-lg border border-border p-0.5">
        <button
          type="button"
          onClick={() => setMode('checkin')}
          className={`flex items-center rounded-md px-4 text-sm font-medium transition-colors ${
            mode === 'checkin' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Check in
        </button>
        <button
          type="button"
          onClick={() => setMode('meeting')}
          className={`flex items-center rounded-md px-4 text-sm font-medium transition-colors ${
            mode === 'meeting' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Meeting room (3rd floor)
        </button>
      </div>

      {mode === 'checkin' ? (
        <CheckinClient
          initialCount={checkinCount}
          leaderboard={leaderboard}
          allTimeLeaderboard={allTimeLeaderboard}
          attendance={attendance}
          isAdmin={isAdmin}
        />
      ) : (
        <MeetingRoomBooker
          initialDate={initialDate}
          initialBookings={initialMeetingBookings}
          isAdmin={isAdmin}
        />
      )}
    </div>
  )
}
