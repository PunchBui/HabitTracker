import { useState, useEffect } from "react"
import { LogModal } from "./LogModal"
import { useHabitLogs } from "../hooks/useHabitLogs"
import type { Habit } from "../types/habit"

const PERIOD_LABELS: Record<string, string> = {
  day: "Daily",
  workday: "Workdays",
  week: "Weekly",
  month: "Monthly",
}

const TYPE_STYLES: Record<string, string> = {
  bad: "bg-red-100 text-red-800",
  good: "bg-green-100 text-green-800",
  todo: "bg-blue-100 text-blue-800",
}

type HabitCardProps = {
  habit: Habit
  onLogSuccess?: () => void
}

export const HabitCard = ({ habit, onLogSuccess }: HabitCardProps) => {
  const [showLogModal, setShowLogModal] = useState(false)
  const [logCount, setLogCount] = useState(0)
  const { fetchLogsForHabit, addLog } = useHabitLogs()

  useEffect(() => {
    const load = async () => {
      const logs = await fetchLogsForHabit(habit.id)
      setLogCount(logs.length)
    }
    load()
  }, [habit.id, fetchLogsForHabit])

  const handleLog = async (habitId: string, loggedAt: Date, note: string | null) => {
    const result = await addLog({ habit_id: habitId, logged_at: loggedAt.toISOString(), note })
    if (result) {
      setLogCount((c) => c + 1)
      onLogSuccess?.()
    }
  }

  const periodLabel = PERIOD_LABELS[habit.period] ?? habit.period

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
            <p className="mt-2 text-xs text-gray-400">{logCount} log{logCount !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => setShowLogModal(true)}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Log
          </button>
        </div>
      </div>

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
