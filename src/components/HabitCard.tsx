import { useState, useEffect } from "react"
import { LogModal } from "./LogModal"
import { useHabitLogs } from "../hooks/useHabitLogs"
import { computeStreak, getRemainingThisWeek, getStreakLabel } from "../utils/streak"
import type { Habit, HabitLog } from "../types/habit"

const getPeriodLabel = (habit: { period: string; target_count?: number | null }): string => {
  if (habit.period === "n_per_week") {
    const n = habit.target_count ?? 1
    return `At least ${n}/week`
  }
  const labels: Record<string, string> = {
    day: "Daily",
    workday: "Workdays",
    week: "Weekly",
    month: "Monthly",
  }
  return labels[habit.period] ?? habit.period
}

const TYPE_STYLES: Record<string, string> = {
  bad: "bg-red-100 text-red-800",
  good: "bg-green-100 text-green-800",
  todo: "bg-blue-100 text-blue-800",
}

type HabitCardProps = {
  habit: Habit
  onLogSuccess?: () => void
  onDelete?: (habitId: string) => Promise<boolean>
}

export const HabitCard = ({ habit, onLogSuccess, onDelete }: HabitCardProps) => {
  const [showLogModal, setShowLogModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [logCount, setLogCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [logs, setLogs] = useState<HabitLog[]>([])
  const { fetchLogsForHabit, addLog } = useHabitLogs()

  const handleDelete = async () => {
    if (!onDelete) return
    setDeleting(true)
    const ok = await onDelete(habit.id)
    setDeleting(false)
    if (ok) setShowDeleteConfirm(false)
  }

  useEffect(() => {
    const load = async () => {
      const fetchedLogs = await fetchLogsForHabit(habit.id)
      setLogs(fetchedLogs)
      setLogCount(fetchedLogs.length)
      const { current } = computeStreak(habit, fetchedLogs)
      setStreak(current)
    }
    load()
  }, [habit, fetchLogsForHabit])

  const handleLog = async (habitId: string, loggedAt: Date, note: string | null) => {
    const result = await addLog({ habit_id: habitId, logged_at: loggedAt.toISOString(), note })
    if (result) {
      const fetchedLogs = await fetchLogsForHabit(habit.id)
      setLogs(fetchedLogs)
      setLogCount(fetchedLogs.length)
      const { current } = computeStreak(habit, fetchedLogs)
      setStreak(current)
      onLogSuccess?.()
    }
  }

  const periodLabel = getPeriodLabel(habit)
  const remainingThisWeek = getRemainingThisWeek(habit, logs)

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900">{habit.name}</h3>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLES[habit.type] ?? "bg-gray-100 text-gray-800"}`}>
                {habit.type}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{periodLabel}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-400">
              <span>{logCount} log{logCount !== 1 ? "s" : ""}</span>
              {streak > 0 && <span className="font-medium text-amber-600">{getStreakLabel(habit.period, streak)}</span>}
              {remainingThisWeek !== null && remainingThisWeek > 0 && (
                <span className="font-medium text-indigo-600">{remainingThisWeek} remaining this week</span>
              )}
              {remainingThisWeek !== null && remainingThisWeek === 0 && (
                <span className="font-medium text-green-600">Goal met this week</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowLogModal(true)}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Log
            </button>
            {onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Delete habit?</h3>
            <p className="mt-2 text-sm text-gray-600">
              "{habit.name}" and all its logs will be permanently deleted. This cannot be undone.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogModal && (
        <LogModal
          habit={habit}
          onLog={handleLog}
          onClose={() => setShowLogModal(false)}
        />
      )}
    </>
  )
}
