import { eachDayOfInterval, endOfMonth, format, getDate, startOfMonth } from "date-fns"
import type { Habit } from "../types/habit"
import type { HabitStyleResult } from "../utils/habitStyle"

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

type StreakCalendarProps = {
  year: number
  month: number
  habits: Habit[]
  completedDatesPerHabit: Map<string, Set<string>>
  getHabitStyle: (habit: Habit) => HabitStyleResult
  onPrevMonth: () => void
  onNextMonth: () => void
  onDayClick?: (dateKey: string) => void
}

const getDaysInMonth = (year: number, month: number): Date[] => {
  const start = startOfMonth(new Date(year, month - 1))
  const end = endOfMonth(start)
  return eachDayOfInterval({ start, end })
}

const getDateKeyFromDate = (d: Date): string => format(d, "yyyy-MM-dd")

export const StreakCalendar = ({
  year,
  month,
  habits,
  completedDatesPerHabit,
  getHabitStyle,
  onPrevMonth,
  onNextMonth,
  onDayClick,
}: StreakCalendarProps) => {
  const days = getDaysInMonth(year, month)
  const firstDay = startOfMonth(new Date(year, month - 1))
  const startOffset = firstDay.getDay()
  const padding = Array.from({ length: startOffset }, (_, i) => ({ key: `pad-${i}`, empty: true }))
  const now = new Date()
  const todayKey = getDateKeyFromDate(now)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevMonth}
          className="rounded-lg px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100"
          aria-label="Previous month"
        >
          ←
        </button>
        <h3 className="text-base font-semibold text-gray-900">
          {format(new Date(year, month - 1), "MMMM yyyy")}
        </h3>
        <button
          type="button"
          onClick={onNextMonth}
          className="rounded-lg px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1 font-medium text-gray-500">
            {label}
          </div>
        ))}
        {padding.map((p) => (
          <div key={p.key} className="aspect-square" />
        ))}
        {days.map((d) => {
          const key = getDateKeyFromDate(d)
          const isToday = key === todayKey
          const isFuture = d > now
          return (
            <button
              key={key}
              type="button"
              onClick={() => onDayClick?.(key)}
              className={`flex min-h-[3rem] flex-col items-center justify-start rounded-lg border p-1 text-left ${
                isToday ? "border-indigo-500 bg-indigo-50" : "border-transparent bg-gray-50 hover:bg-gray-100"
              } ${isFuture ? "opacity-60" : ""}`}
            >
              <span className={`text-xs font-medium ${isToday ? "text-indigo-700" : "text-gray-700"}`}>
                {getDate(d)}
              </span>
              <div className="mt-0.5 flex flex-wrap justify-center gap-0.5">
                {habits.map((habit) => {
                  const completed = completedDatesPerHabit.get(habit.id)?.has(key)
                  const style = getHabitStyle(habit)
                  const bg = style.style?.backgroundColor ?? "#9ca3af"
                  return (
                    <span
                      key={habit.id}
                      className={`h-2 w-2 shrink-0 rounded-full ${completed ? "" : "opacity-25"}`}
                      style={{ backgroundColor: bg }}
                      title={habit.name}
                    />
                  )
                })}
              </div>
            </button>
          )
        })}
      </div>

      {habits.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
          {habits.map((habit) => {
            const style = getHabitStyle(habit)
            const bg = style.style?.backgroundColor ?? "#9ca3af"
            return (
              <div key={habit.id} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: bg }} />
                <span className="text-xs text-gray-600">{habit.name}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
