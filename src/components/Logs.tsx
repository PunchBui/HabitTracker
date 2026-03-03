import { parseISO } from "date-fns"
import { useState } from "react"
import { useAllLogs } from "../hooks/useAllLogs"
import { useHabitLogs } from "../hooks/useHabitLogs"
import { getHabitStyle } from "../utils/habitStyle"

const formatLogDate = (isoString: string): string => {
  const d = parseISO(isoString)
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  })
}

export const Logs = () => {
  const { logs, loading, error, fetchAllLogs } = useAllLogs()
  const { deleteLog } = useHabitLogs()

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDeleteLog = async (logId: string) => {
    setDeletingId(logId)
    const ok = await deleteLog(logId)
    setDeletingId(null)
    if (ok) fetchAllLogs()
  }

  return (
    <div>
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
              const habitStyle = getHabitStyle(habit)
              return (
                <li
                  key={log.id}
                  className="rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-gray-500">{formatLogDate(log.logged_at)}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${habitStyle.className}`}
                          style={habitStyle.style}
                        >
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
