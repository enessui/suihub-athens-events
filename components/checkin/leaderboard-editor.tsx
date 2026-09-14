'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Eye, EyeOff, Trash2, RotateCcw, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  getLeaderboardAdmin,
  setLeaderboardOverride,
  saveManualLeaderboardEntry,
  deleteLeaderboardOverride,
  type AdminLeaderboardRow,
} from '@/app/checkin/actions'

export function LeaderboardEditor() {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<AdminLeaderboardRow[]>([])
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [newName, setNewName] = useState('')
  const [newVisits, setNewVisits] = useState('')
  const router = useRouter()

  async function load() {
    setLoading(true)
    const res = await getLeaderboardAdmin()
    setLoading(false)
    if (res.error) {
      toast.error(res.error)
      return
    }
    setRows(res.rows ?? [])
  }

  function openEditor() {
    setOpen(true)
    void load()
  }

  function after(res?: { error?: string }) {
    if (res?.error) {
      toast.error(res.error)
      return
    }
    void load()
    router.refresh()
  }

  function saveCount(row: AdminLeaderboardRow, value: string) {
    const n = value.trim() === '' ? null : Math.max(0, parseInt(value, 10) || 0)
    if (!row.isManual && n === row.computed && !row.hidden) {
      // back to the computed value → clear the override entirely
      startTransition(async () => after(await setLeaderboardOverride({ email: row.email!, hidden: false, visits: null })))
      return
    }
    startTransition(async () => {
      const res = row.isManual
        ? await saveManualLeaderboardEntry({ id: row.overrideId!, name: row.name, visits: n ?? 0, hidden: row.hidden })
        : await setLeaderboardOverride({ email: row.email!, hidden: row.hidden, visits: n })
      after(res)
    })
  }

  function saveName(row: AdminLeaderboardRow, name: string) {
    if (!row.isManual || name.trim() === row.name) return
    startTransition(async () => after(await saveManualLeaderboardEntry({ id: row.overrideId!, name, visits: row.visits, hidden: row.hidden })))
  }

  function toggleHide(row: AdminLeaderboardRow) {
    startTransition(async () => {
      const res = row.isManual
        ? await saveManualLeaderboardEntry({ id: row.overrideId!, name: row.name, visits: row.visits, hidden: !row.hidden })
        : await setLeaderboardOverride({
            email: row.email!,
            hidden: !row.hidden,
            visits: row.visits === row.computed ? null : row.visits,
          })
      after(res)
    })
  }

  function remove(row: AdminLeaderboardRow) {
    if (!row.overrideId) return
    startTransition(async () => after(await deleteLeaderboardOverride(row.overrideId!)))
  }

  function addManual() {
    const name = newName.trim()
    if (!name) {
      toast.error('Enter a name.')
      return
    }
    const visits = Math.max(0, parseInt(newVisits, 10) || 0)
    startTransition(async () => {
      const res = await saveManualLeaderboardEntry({ name, visits })
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setNewName('')
      setNewVisits('')
      after(res)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={openEditor}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <Pencil className="size-3.5" />
        Edit
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit builder leaderboard</DialogTitle>
            <DialogDescription>
              Hide people, adjust their day count, or add someone manually. Changes apply to both the monthly and all-time tabs. Raw check-ins aren&apos;t affected.
            </DialogDescription>
          </DialogHeader>

          {/* Add someone manually */}
          <div className="flex items-end gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3">
            <div className="grid flex-1 gap-1">
              <Label htmlFor="lb-name" className="text-xs">Add a person</Label>
              <Input id="lb-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" />
            </div>
            <div className="grid w-20 gap-1">
              <Label htmlFor="lb-days" className="text-xs">Days</Label>
              <Input id="lb-days" type="number" min={0} value={newVisits} onChange={(e) => setNewVisits(e.target.value)} placeholder="0" />
            </div>
            <Button type="button" onClick={addManual} disabled={isPending} className="shrink-0">
              <Plus className="size-4" /> Add
            </Button>
          </div>

          {/* Existing entries */}
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No entries yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {rows.map((row) => (
                <li
                  key={row.email ?? row.overrideId}
                  className={`flex items-center gap-2 py-2 ${row.hidden ? 'opacity-45' : ''}`}
                >
                  {row.isManual ? (
                    <Input
                      defaultValue={row.name}
                      onBlur={(e) => saveName(row, e.target.value)}
                      className="h-8 flex-1"
                      aria-label="Name"
                    />
                  ) : (
                    <span className="flex-1 truncate text-sm font-medium">
                      {row.name}
                      {row.visits !== row.computed && (
                        <span className="ml-1 text-xs text-muted-foreground">(auto {row.computed})</span>
                      )}
                    </span>
                  )}
                  <Input
                    type="number"
                    min={0}
                    defaultValue={row.visits}
                    onBlur={(e) => saveCount(row, e.target.value)}
                    className="h-8 w-16 text-center"
                    aria-label="Days"
                    disabled={row.hidden}
                  />
                  <button
                    type="button"
                    onClick={() => toggleHide(row)}
                    disabled={isPending}
                    aria-label={row.hidden ? 'Show' : 'Hide'}
                    className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {row.hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                  {(row.isManual || row.overrideId) && (
                    <button
                      type="button"
                      onClick={() => remove(row)}
                      disabled={isPending}
                      aria-label={row.isManual ? 'Delete' : 'Reset to auto'}
                      className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                    >
                      {row.isManual ? <Trash2 className="size-4" /> : <RotateCcw className="size-4" />}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            The eye hides someone from the public board. The circular arrow resets an adjusted person back to their automatic count.
          </p>
        </DialogContent>
      </Dialog>
    </>
  )
}
