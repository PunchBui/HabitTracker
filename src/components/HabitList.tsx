import { getMonth, getYear } from "date-fns"
import { useState, useEffect, useMemo } from "react"
import { HabitCard } from "./HabitCard"
import { HabitForm } from "./HabitForm"
import { DayDetailModal } from "./DayDetailModal"
import { StreakCalendar } from "./StreakCalendar"
import { useAllLogs } from "../hooks/useAllLogs"
import { useHabits } from "../hooks/useHabits"
import { useHabitLogs } from "../hooks/useHabitLogs"
import type { HabitInsert, HabitLog } from "../types/habit"
import type { HabitType } from "../types/habit"
import { getHabitStyle } from "../utils/habitStyle"
import {
  computeStreak,
  getCompletedDatesForMonth,
  getPeriodDeadline,
  getRemainingThisWeek,
  getRemainingToday,
  getStreakFromHistory,
  getStreakLabel,
  isPeriodComplete,
  formatTimeRemaining,
} from "../utils/streak"

type Filter = "all" | HabitType

type StreakInfo = {
  current: number
  streakFromHistory: number
  deadline: Date | null
  remainingThisWeek: number | null
  remainingToday: number | null
  periodComplete: boolean
}

export const HabitList = () => {
  const { logs, fetchAllLogs } = useAllLogs()
  const { habits, loading, error, addHabit, updateHabit, deleteHabit } = useHabits()
  const { fetchLogsForHabit } = useHabitLogs()
  const [filter, setFilter] = useState<Filter>("all")
  const [showForm, setShowForm] = useState(false)
  const [streaks, setStreaks] = useState<Map<string, StreakInfo>>(new Map())
  const [completedDatesInMonth, setCompletedDatesInMonth] = useState<Map<string, Set<string>>>(new Map())
  const [habitLogsMap, setHabitLogsMap] = useState<Map<string, HabitLog[]>>(new Map())
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null)
  const [calendarYear, setCalendarYear] = useState(() => getYear(new Date()))
  const [calendarMonth, setCalendarMonth] = useState(() => getMonth(new Date()) + 1)
  const [, setTick] = useState<number>(0)

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const loadStreaks = async () => {
      const map = new Map<string, StreakInfo>()
      const completedMap = new Map<string, Set<string>>()
      const logsMap = new Map<string, HabitLog[]>()
      for (const habit of habits) {
        const habitLogs = await fetchLogsForHabit(habit.id)
        logsMap.set(habit.id, habitLogs)
        const { current } = computeStreak(habit, habitLogs)
        const periodComplete = isPeriodComplete(habit, habitLogs)
        const streakFromHistory = getStreakFromHistory(habit, habitLogs)
        const deadline = getPeriodDeadline(habit)
        const remainingThisWeek = getRemainingThisWeek(habit, habitLogs)
        const remainingToday = getRemainingToday(habit, habitLogs)
        map.set(habit.id, {
          current,
          streakFromHistory,
          deadline,
          remainingThisWeek,
          remainingToday,
          periodComplete,
        })
        completedMap.set(
          habit.id,
          getCompletedDatesForMonth(habit, habitLogs, calendarYear, calendarMonth)
        )
      }
      setStreaks(map)
      setCompletedDatesInMonth(completedMap)
      setHabitLogsMap(logsMap)
    }
    loadStreaks()
  }, [habits, fetchLogsForHabit, logs, calendarYear, calendarMonth])

  const sortedHabits = useMemo(() => {
    return [...habits].sort((a, b) => {
      const deadlineA = streaks.get(a.id)?.deadline
      const deadlineB = streaks.get(b.id)?.deadline
      if (!deadlineA && !deadlineB) return 0
      if (!deadlineA) return 1
      if (!deadlineB) return -1
      return deadlineA.getTime() - deadlineB.getTime()
    })
  }, [habits, streaks])

  const onTrackHabits = useMemo(
    () => sortedHabits.filter((h) => streaks.get(h.id)?.periodComplete ?? false),
    [sortedHabits, streaks]
  )
  const expiringHabits = useMemo(
    () =>
      sortedHabits
        .filter((h) => !(streaks.get(h.id)?.periodComplete ?? true))
        .sort((a, b) => {
          const da = streaks.get(a.id)?.deadline
          const db = streaks.get(b.id)?.deadline
          if (!da) return 1
          if (!db) return -1
          return da.getTime() - db.getTime()
        }),
    [sortedHabits, streaks]
  )

  const filteredHabits = habits.filter((h) => (filter === "all" ? true : h.type === filter))

  const handleAddHabit = async (habit: HabitInsert) => {
    return addHabit(habit)
  }

  return (
    <div>
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Streak summary</h2>
        {habits.length === 0 ? (
          <p className="text-sm text-gray-500">No habits yet. Add habits to see streaks.</p>
        ) : (
          <div className="space-y-4">
            <StreakCalendar
              year={calendarYear}
              month={calendarMonth}
              habits={habits}
              completedDatesPerHabit={completedDatesInMonth}
              getHabitStyle={getHabitStyle}
              onDayClick={(key) => setSelectedDateKey(key)}
              onPrevMonth={() => {
                if (calendarMonth === 1) {
                  setCalendarMonth(12)
                  setCalendarYear((y) => y - 1)
                } else {
                  setCalendarMonth((m) => m - 1)
                }
              }}
              onNextMonth={() => {
                if (calendarMonth === 12) {
                  setCalendarMonth(1)
                  setCalendarYear((y) => y + 1)
                } else {
                  setCalendarMonth((m) => m + 1)
                }
              }}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-green-200 bg-green-50/50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-green-800">On track</h3>
                {onTrackHabits.length === 0 ? (
                  <p className="text-xs text-green-700/80">No habits completed for current period yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {onTrackHabits.map((habit) => {
                      const info = streaks.get(habit.id)
                      const streak = info?.current ?? 0
                      const label = getStreakLabel(habit.period, streak)
                      const habitStyle = getHabitStyle(habit)
                      return (
                        <li
                          key={habit.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-green-200/60 bg-white px-2 py-1.5"
                        >
                          <span className="flex min-w-0 items-center gap-1.5 truncate">
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={habitStyle.style ?? { backgroundColor: "#22c55e" }}
                            />
                            <span className="truncate font-medium text-gray-900">{habit.name}</span>
                          </span>
                          <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            {streak > 0 ? label : "Done"}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-amber-800">Expiring</h3>
                {expiringHabits.length === 0 ? (
                  <p className="text-xs text-amber-700/80">All habits on track for this period.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {expiringHabits.map((habit) => {
                      const info = streaks.get(habit.id)
                      const timeLeft = info?.deadline ? formatTimeRemaining(info.deadline) : null
                      const historyLabel =
                        (info?.streakFromHistory ?? 0) > 0
                          ? getStreakLabel(habit.period, info!.streakFromHistory)
                          : ""
                      const remaining = info?.remainingThisWeek ?? null
                      const remainingToday = info?.remainingToday ?? null
                      const habitStyle = getHabitStyle(habit)
                      return (
                        <li
                          key={habit.id}
                          className="flex flex-col gap-0.5 rounded-lg border border-amber-200/60 bg-white px-2 py-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex min-w-0 items-center gap-1.5 truncate">
                              <span
                                className="h-2 w-2 shrink-0 rounded-full"
                                style={habitStyle.style ?? { backgroundColor: "#f59e0b" }}
                              />
                              <span className="truncate font-medium text-gray-900" title={habit.name}>
                                {habit.name}
                              </span>
                            </span>
                            {timeLeft && (
                              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                {timeLeft}
                                {historyLabel ? ` · ${historyLabel}` : ""}
                              </span>
                            )}
                          </div>
                          {remaining !== null && remaining > 0 && (
                            <span className="text-xs text-amber-700/90">{remaining} more this week</span>
                          )}
                          {remainingToday !== null && remainingToday > 0 && (
                            <span className="text-xs text-amber-700/90">{remainingToday} more today</span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {selectedDateKey && (
        <DayDetailModal
          dateKey={selectedDateKey}
          habits={habits}
          habitLogsMap={habitLogsMap}
          onClose={() => setSelectedDateKey(null)}
          onLogSuccess={fetchAllLogs}
        />
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          {(["all", "good", "bad", "todo"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showForm ? "Cancel" : "Add habit"}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <HabitForm onSubmit={handleAddHabit} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading habits…</p>
      ) : filteredHabits.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500">
          {habits.length === 0
            ? "No habits yet. Add one to get started!"
            : `No ${filter === "all" ? "" : filter + " "}habits.`}
        </p>
      ) : (
        <div className="space-y-3">
          {filteredHabits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} onUpdate={updateHabit} onDelete={deleteHabit} />
          ))}
        </div>
      )}
    </div>
  )
}
