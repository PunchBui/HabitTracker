import { endOfDay, format, parseISO } from "date-fns"
import type { Habit, HabitLog } from "../types/habit"
import { getHabitStyle } from "../utils/habitStyle"
import {
  computeStreak,
  getLogCountOnDate,
  getStreakLabel,
  isDateCompleteForHabit,
  isHabitDueOnDate,
} from "../utils/streak"

type DayDetailModalProps = {
  dateKey: string
  habits: Habit[]
  habitLogsMap: Map<string, HabitLog[]>
  onClose: () => void
}

const parseDateKey = (dateKey: string): Date => parseISO(dateKey + "T12:00:00")

export const DayDetailModal = ({
  dateKey,
  habits,
  habitLogsMap,
  onClose,
}: DayDetailModalProps) => {
  const date = parseDateKey(dateKey)
  const endOfDayDate = endOfDay(date)
  const formattedDate = format(date, "EEEE, MMMM d, yyyy")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-lg font-semibold text-gray-900">{formattedDate}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-4 py-3">
          {habits.length === 0 ? (
            <p className="text-sm text-gray-500">No habits.</p>
          ) : (
            <ul className="space-y-2">
              {habits.map((habit) => {
                const logs = habitLogsMap.get(habit.id) ?? []
                const due = isHabitDueOnDate(habit, date)
                const completed = isDateCompleteForHabit(habit, logs, dateKey)
                const streakResult = computeStreak(habit, logs, endOfDayDate)
                const streak = streakResult.current
                const logCount = getLogCountOnDate(habit, logs, dateKey)
                const style = getHabitStyle(habit)
                const n = habit.period === "n_per_day" ? Number(habit.target_count) || 1 : null
                return (
                  <li
                    key={habit.id}
                    className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-gray-50/50 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="flex items-center gap-2 font-medium text-gray-900"
                        style={style.style ? { color: style.style.color } : undefined}
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: style.style?.backgroundColor ?? "#9ca3af" }}
                        />
                        {habit.name}
                      </span>
                      <span className="shrink-0 text-xs font-medium text-amber-600">
                        {streak > 0 ? getStreakLabel(habit.period, streak) : "—"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-600">
                      <span>
                        Due: {due ? <span className="text-green-600">Yes</span> : <span className="text-gray-400">No</span>}
                      </span>
                      <span>
                        Logged:{" "}
                        {n !== null ? (
                          <span className={completed ? "text-green-600 font-medium" : "text-amber-600"}>
                            {logCount ?? 0}/{n}
                          </span>
                        ) : completed ? (
                          <span className="text-green-600 font-medium">Yes</span>
                        ) : (
                          <span className="text-gray-500">No</span>
                        )}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
