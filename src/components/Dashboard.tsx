import { useState, useEffect } from "react"
import { useAllLogs } from "../hooks/useAllLogs"
import { useHabits } from "../hooks/useHabits"
import { useHabitLogs } from "../hooks/useHabitLogs"
import { computeStreak, getStreakLabel } from "../utils/streak"

const TYPE_STYLES: Record<string, string> = {
  bad: "bg-red-100 text-red-800",
  good: "bg-green-100 text-green-800",
  todo: "bg-blue-100 text-blue-800",
}

const formatLogDate = (isoString: string): string => {
  const d = new Date(isoString)
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export const Dashboard = () => {
  const { logs, loading, error, fetchAllLogs } = useAllLogs()
  const { habits } = useHabits()
  const { fetchLogsForHabit, deleteLog } = useHabitLogs()

  const [streaks, setStreaks] = useState<Map<string, number>>(new Map())
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDeleteLog = async (logId: string) => {
    setDeletingId(logId)
    const ok = await deleteLog(logId)
    setDeletingId(null)
    if (ok) fetchAllLogs()
  }

  useEffect(() => {
    const loadStreaks = async () => {
      const map = new Map<string, number>()
      for (const habit of habits) {
        const habitLogs = await fetchLogsForHabit(habit.id)
        const { current } = computeStreak(habit, habitLogs)
        map.set(habit.id, current)
      }
      setStreaks(map)
    }
    loadStreaks()
  }, [habits, fetchLogsForHabit, logs])

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Streak summary</h2>
        {habits.length === 0 ? (
          <p className="text-sm text-gray-500">No habits yet. Add habits to see streaks.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {habits.map((habit) => {
              const streak = streaks.get(habit.id) ?? 0
              const label = getStreakLabel(habit.period, streak)
              return (
                <div
                  key={habit.id}
                  className={`rounded-lg border border-gray-200 bg-white px-3 py-2 ${TYPE_STYLES[habit.type] ?? "bg-gray-100 text-gray-800"}`}
                >
                  <span className="font-medium">{habit.name}</span>
                  {label ? <span className="ml-2 text-sm">— {label}</span> : null}
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">All activity</h2>
        {error && <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {loading ? (
          <p className="text-gray-500">Loading logs…</p>
        ) : logs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500">
            No logs yet. Log a habit to see activity here.
          </p>
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => {
              const habit = log.habits
              if (!habit) return null
              const isDeleting = deletingId === log.id
              return (
                <li
                  key={log.id}
                  className="rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-gray-500">{formatLogDate(log.logged_at)}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLES[habit.type] ?? "bg-gray-100 text-gray-800"}`}>
                          {habit.name}
                        </span>
                      </div>
                      {log.note && <p className="mt-2 text-sm text-gray-600">{log.note}</p>}
                    </div>
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      disabled={isDeleting}
                      className="shrink-0 rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      title="Delete log"
                    >
                      {isDeleting ? "…" : "Delete"}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
