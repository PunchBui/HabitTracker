import {
  addDays,
  addMonths,
  addWeeks,
  endOfDay,
  format,
  isSameDay,
  isSaturday,
  isSunday,
  lastDayOfMonth,
  parseISO,
  startOfDay,
  startOfWeek,
  subDays,
} from "date-fns"
import type { Habit, HabitLog } from "../types/habit"

const getDateKey = (date: Date | string): string => {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "yyyy-MM-dd")
}

const getWeekKey = (date: Date | string): string => {
  const d = typeof date === "string" ? parseISO(date) : date
  const monday = startOfWeek(d, { weekStartsOn: 1 })
  return format(monday, "yyyy-MM-dd")
}

const getMonthKey = (date: Date | string): string => {
  const d = typeof date === "string" ? parseISO(date) : date
  return format(d, "yyyy-MM")
}

const isWorkday = (date: Date): boolean => !isSaturday(date) && !isSunday(date)

const getPrevWorkday = (date: Date): Date => {
  let d = subDays(date, 1)
  while (!isWorkday(d)) {
    d = subDays(d, 1)
  }
  return d
}

const getNextWorkday = (date: Date): Date => {
  let d = addDays(date, 1)
  while (!isWorkday(d)) {
    d = addDays(d, 1)
  }
  return d
}

const isValidLogDate = (loggedAt: string): boolean =>
  !Number.isNaN(parseISO(loggedAt).getTime())

export const computeStreak = (habit: Habit, logs: HabitLog[], asOfDate?: Date): { current: number } => {
  const now = asOfDate ?? new Date()
  const endOfAsOf = endOfDay(now)
  const logsUpTo = asOfDate
    ? logs.filter((l) => l.logged_at && parseISO(l.logged_at).getTime() <= endOfAsOf.getTime())
    : logs
  if (logsUpTo.length === 0) return { current: 0 }

  const period = habit.period

  if (period === "day") {
    const dateSet = new Set(logsUpTo.map((l) => getDateKey(l.logged_at)))
    if (dateSet.size === 0) return { current: 0 }
    const todayKey = getDateKey(now)
    if (!dateSet.has(todayKey) && !dateSet.has(getDateKey(addDays(now, -1)))) {
      return { current: 0 }
    }
    let streak = 0
    let check = startOfDay(now)
    while (dateSet.has(getDateKey(check))) {
      streak++
      check = addDays(check, -1)
    }
    return { current: streak }
  }

  if (period === "workday") {
    const dates = [...new Set(logsUpTo.map((l) => getDateKey(l.logged_at)))].filter((k) => {
      const d = parseISO(k + "T12:00:00")
      return isWorkday(d)
    })
    if (dates.length === 0) return { current: 0 }
    const dateSet = new Set(dates)
    const check = isWorkday(now) ? startOfDay(now) : startOfDay(getPrevWorkday(now))
    const todayKey = getDateKey(check)
    if (!dateSet.has(todayKey) && !dateSet.has(getDateKey(getPrevWorkday(check)))) {
      return { current: 0 }
    }
    let streak = 0
    let cursor = check
    while (dateSet.has(getDateKey(cursor))) {
      streak++
      cursor = getPrevWorkday(cursor)
    }
    return { current: streak }
  }

  if (period === "week") {
    const weeks = [...new Set(logsUpTo.map((l) => getWeekKey(l.logged_at)))].sort().reverse()
    if (weeks.length === 0) return { current: 0 }
    const thisWeekKey = getWeekKey(now)
    const lastWeekKey = getWeekKey(addWeeks(now, -1))
    if (weeks[0] !== thisWeekKey && weeks[0] !== lastWeekKey) return { current: 0 }
    const weekSet = new Set(weeks)
    let streak = 0
    let check = now
    while (weekSet.has(getWeekKey(check))) {
      streak++
      check = addWeeks(check, -1)
    }
    return { current: streak }
  }

  if (period === "month") {
    const months = [...new Set(logsUpTo.map((l) => getMonthKey(l.logged_at)))].sort().reverse()
    if (months.length === 0) return { current: 0 }
    const thisMonthKey = getMonthKey(now)
    const lastMonthKey = getMonthKey(addMonths(now, -1))
    if (months[0] !== thisMonthKey && months[0] !== lastMonthKey) return { current: 0 }
    const monthSet = new Set(months)
    let streak = 0
    let check = now
    while (monthSet.has(getMonthKey(check))) {
      streak++
      check = addMonths(check, -1)
    }
    return { current: streak }
  }

  if (period === "n_per_week") {
    const n = habit.target_count ?? 1
    const logsByWeek = new Map<string, number>()
    for (const log of logsUpTo) {
      const wk = getWeekKey(log.logged_at)
      logsByWeek.set(wk, (logsByWeek.get(wk) ?? 0) + 1)
    }
    const thisWeekKey = getWeekKey(now)
    const lastWeekKey = getWeekKey(addWeeks(now, -1))
    if ((logsByWeek.get(thisWeekKey) ?? 0) < n && (logsByWeek.get(lastWeekKey) ?? 0) < n) {
      return { current: 0 }
    }
    let streak = 0
    let check = now
    while ((logsByWeek.get(getWeekKey(check)) ?? 0) >= n) {
      streak++
      check = addWeeks(check, -1)
    }
    return { current: streak }
  }

  if (period === "n_per_day") {
    const n = Number(habit.target_count) || 1
    const logsByDate = new Map<string, number>()
    for (const log of logsUpTo) {
      const key = getDateKey(log.logged_at)
      logsByDate.set(key, (logsByDate.get(key) ?? 0) + 1)
    }
    const todayKey = getDateKey(now)
    const yesterdayKey = getDateKey(addDays(now, -1))
    if ((logsByDate.get(todayKey) ?? 0) < n && (logsByDate.get(yesterdayKey) ?? 0) < n) {
      return { current: 0 }
    }
    let streak = 0
    let check = startOfDay(now)
    while ((logsByDate.get(getDateKey(check)) ?? 0) >= n) {
      streak++
      check = addDays(check, -1)
    }
    return { current: streak }
  }

  return { current: 0 }
}

/** Returns streak count from past periods only (excludes current period). Use when period is not complete. */
export const getStreakFromHistory = (habit: Habit, logs: HabitLog[], now: Date = new Date()): number => {
  const validLogs = logs.filter((l) => l.logged_at && isValidLogDate(l.logged_at))
  if (validLogs.length === 0) return 0

  const period = habit.period

  if (period === "day") {
    const dateSet = new Set(validLogs.map((l) => getDateKey(l.logged_at)))
    let check = startOfDay(addDays(now, -1))
    let streak = 0
    while (dateSet.has(getDateKey(check))) {
      streak++
      check = addDays(check, -1)
    }
    return streak
  }

  if (period === "workday") {
    const dates = [...new Set(validLogs.map((l) => getDateKey(l.logged_at)))].filter((k) => {
      const d = parseISO(k + "T12:00:00")
      return isWorkday(d)
    })
    const dateSet = new Set(dates)
    let check = startOfDay(getPrevWorkday(now))
    let streak = 0
    while (dateSet.has(getDateKey(check))) {
      streak++
      check = getPrevWorkday(check)
    }
    return streak
  }

  if (period === "week") {
    const weekSet = new Set(validLogs.map((l) => getWeekKey(l.logged_at)))
    let check = addWeeks(now, -1)
    let streak = 0
    while (weekSet.has(getWeekKey(check))) {
      streak++
      check = addWeeks(check, -1)
    }
    return streak
  }

  if (period === "month") {
    const monthSet = new Set(validLogs.map((l) => getMonthKey(l.logged_at)))
    let check = addMonths(now, -1)
    let streak = 0
    while (monthSet.has(getMonthKey(check))) {
      streak++
      check = addMonths(check, -1)
    }
    return streak
  }

  if (period === "n_per_week") {
    const n = Number(habit.target_count) || 1
    const logsByWeek = new Map<string, number>()
    for (const log of validLogs) {
      const wk = getWeekKey(log.logged_at)
      logsByWeek.set(wk, (logsByWeek.get(wk) ?? 0) + 1)
    }
    let check = addWeeks(now, -1)
    let streak = 0
    while ((logsByWeek.get(getWeekKey(check)) ?? 0) >= n) {
      streak++
      check = addWeeks(check, -1)
    }
    return streak
  }

  if (period === "n_per_day") {
    const n = Number(habit.target_count) || 1
    const logsByDate = new Map<string, number>()
    for (const log of validLogs) {
      const key = getDateKey(log.logged_at)
      logsByDate.set(key, (logsByDate.get(key) ?? 0) + 1)
    }
    let check = startOfDay(addDays(now, -1))
    let streak = 0
    while ((logsByDate.get(getDateKey(check)) ?? 0) >= n) {
      streak++
      check = addDays(check, -1)
    }
    return streak
  }

  return 0
}

export const getRemainingThisWeek = (
  habit: Habit,
  logs: HabitLog[],
  now: Date = new Date()
): number | null => {
  if (habit.period !== "n_per_week") return null
  const n = Number(habit.target_count) || 1
  const thisWeekKey = getWeekKey(now)
  const validLogs = logs.filter((l) => l.logged_at && isValidLogDate(l.logged_at))
  const thisWeekCount = validLogs.filter((l) => getWeekKey(l.logged_at) === thisWeekKey).length
  const remaining = Math.max(0, n - thisWeekCount)
  return remaining
}

/** Returns remaining count to reach target today for n_per_day habits; null otherwise. */
export const getRemainingToday = (
  habit: Habit,
  logs: HabitLog[],
  now: Date = new Date()
): number | null => {
  if (habit.period !== "n_per_day") return null
  const n = Number(habit.target_count) || 1
  const todayKey = getDateKey(now)
  const validLogs = logs.filter((l) => l.logged_at && isValidLogDate(l.logged_at))
  const todayCount = validLogs.filter((l) => getDateKey(l.logged_at) === todayKey).length
  return Math.max(0, n - todayCount)
}

/** Returns true if the current period is complete (user has logged). */
export const isPeriodComplete = (habit: Habit, logs: HabitLog[], now: Date = new Date()): boolean => {
  const validLogs = logs.filter((l) => l.logged_at && isValidLogDate(l.logged_at))
  const period = habit.period

  if (period === "day") {
    return validLogs.some((l) => isSameDay(new Date(l.logged_at), now))
  }

  if (period === "workday") {
    if (!isWorkday(now)) return true
    const todayKey = getDateKey(now)
    return validLogs.some((l) => getDateKey(l.logged_at) === todayKey)
  }

  if (period === "week") {
    const thisWeekKey = getWeekKey(now)
    return validLogs.some((l) => getWeekKey(l.logged_at) === thisWeekKey)
  }

  if (period === "month") {
    const thisMonthKey = getMonthKey(now)
    return validLogs.some((l) => getMonthKey(l.logged_at) === thisMonthKey)
  }

  if (period === "n_per_week") {
    const n = Number(habit.target_count) || 1
    const thisWeekKey = getWeekKey(now)
    const count = validLogs.filter((l) => getWeekKey(l.logged_at) === thisWeekKey).length
    return count >= n
  }

  if (period === "n_per_day") {
    const n = Number(habit.target_count) || 1
    const todayKey = getDateKey(now)
    const count = validLogs.filter((l) => getDateKey(l.logged_at) === todayKey).length
    return count >= n
  }

  return false
}

/** Returns end of current period - always, for showing time remaining when not complete. */
export const getPeriodDeadline = (habit: Habit, now: Date = new Date()): Date | null => {
  const period = habit.period

  if (period === "day") {
    return endOfDay(now)
  }

  if (period === "workday") {
    if (isWorkday(now)) return endOfDay(now)
    return endOfDay(getNextWorkday(now))
  }

  if (period === "n_per_day") {
    return endOfDay(now)
  }

  if (period === "week" || period === "n_per_week") {
    const dayOfWeek = now.getDay()
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
    const deadline = addDays(now, daysUntilSunday)
    return endOfDay(deadline)
  }

  if (period === "month") {
    const last = lastDayOfMonth(now)
    return endOfDay(last)
  }

  return null
}

export const getStreakLabel = (period: string, count: number): string => {
  if (count === 0) return ""
  const unit =
    period === "day" || period === "n_per_day"
      ? "day"
      : period === "workday"
        ? "workday"
        : period === "week" || period === "n_per_week"
          ? "week"
          : "month"
  return `${count} ${unit} streak`
}

/** @deprecated Use getPeriodDeadline instead. Kept for backward compat. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const computeStreakDeadline = (habit: Habit, _streak: number): Date | null =>
  getPeriodDeadline(habit)

export const formatTimeRemaining = (deadline: Date): string => {
  const now = new Date()
  const diffMs = deadline.getTime() - now.getTime()
  if (diffMs <= 0) return "expired"

  const totalMinutes = Math.floor(diffMs / 60000)
  const totalHours = Math.floor(totalMinutes / 60)
  const days = Math.floor(totalHours / 24)
  const hours = totalHours % 24
  const minutes = totalMinutes % 60

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h left` : `${days}d left`
  }
  if (totalHours > 0) {
    return minutes > 0 ? `${totalHours}h ${minutes}m left` : `${totalHours}h left`
  }
  return `${totalMinutes}m left`
}

/** Returns set of date keys (YYYY-MM-DD) that are "complete" for this habit in the given month. Used for calendar. */
export const getCompletedDatesForMonth = (
  habit: Habit,
  logs: HabitLog[],
  year: number,
  month: number
): Set<string> => {
  const result = new Set<string>()
  const validLogs = logs.filter((l) => l.logged_at && isValidLogDate(l.logged_at))
  const period = habit.period

  if (period === "day") {
    for (const l of validLogs) {
      const d = parseISO(l.logged_at)
      if (d.getFullYear() === year && d.getMonth() === month - 1) result.add(getDateKey(l.logged_at))
    }
    return result
  }
  if (period === "workday") {
    for (const l of validLogs) {
      const d = parseISO(l.logged_at)
      if (d.getFullYear() === year && d.getMonth() === month - 1 && isWorkday(d)) result.add(getDateKey(l.logged_at))
    }
    return result
  }
  if (period === "n_per_day") {
    const n = Number(habit.target_count) || 1
    const countByDate = new Map<string, number>()
    for (const l of validLogs) {
      const d = parseISO(l.logged_at)
      if (d.getFullYear() === year && d.getMonth() === month - 1) {
        const key = getDateKey(l.logged_at)
        countByDate.set(key, (countByDate.get(key) ?? 0) + 1)
      }
    }
    countByDate.forEach((count, key) => {
      if (count >= n) result.add(key)
    })
    return result
  }
  if (period === "week") {
    for (const l of validLogs) {
      const d = parseISO(l.logged_at)
      if (d.getFullYear() === year && d.getMonth() === month - 1) {
        const wk = getWeekKey(l.logged_at)
        const monday = parseISO(wk + "T12:00:00")
        if (monday.getMonth() === month - 1) result.add(getDateKey(monday))
      }
    }
    return result
  }
  if (period === "n_per_week") {
    const n = Number(habit.target_count) || 1
    const logsByWeek = new Map<string, number>()
    for (const l of validLogs) {
      const d = parseISO(l.logged_at)
      if (d.getFullYear() === year && d.getMonth() === month - 1) {
        const wk = getWeekKey(l.logged_at)
        logsByWeek.set(wk, (logsByWeek.get(wk) ?? 0) + 1)
      }
    }
    logsByWeek.forEach((count, weekKey) => {
      if (count >= n) {
        const monday = parseISO(weekKey + "T12:00:00")
        if (monday.getMonth() === month - 1) result.add(getDateKey(monday))
      }
    })
    return result
  }
  if (period === "month") {
    const hasLog = validLogs.some((l) => {
      const d = parseISO(l.logged_at)
      return d.getFullYear() === year && d.getMonth() === month - 1
    })
    if (hasLog) result.add(`${year}-${String(month).padStart(2, "0")}-01`)
    return result
  }
  return result
}

/** Whether the habit was "due" on this calendar date (e.g. workday = only Mon–Fri). */
export const isHabitDueOnDate = (habit: Habit, date: Date): boolean => {
  const period = habit.period
  if (period === "day" || period === "n_per_day" || period === "week" || period === "n_per_week" || period === "month") return true
  if (period === "workday") return isWorkday(date)
  return false
}

/** Whether the habit was completed on this date (or its period containing this date). */
export const isDateCompleteForHabit = (habit: Habit, logs: HabitLog[], dateKey: string): boolean => {
  const validLogs = logs.filter((l) => l.logged_at && isValidLogDate(l.logged_at))
  const period = habit.period
  const d = parseISO(dateKey + "T12:00:00")

  if (period === "day") return validLogs.some((l) => getDateKey(l.logged_at) === dateKey)
  if (period === "workday") {
    if (!isWorkday(d)) return true
    return validLogs.some((l) => getDateKey(l.logged_at) === dateKey)
  }
  if (period === "week") return validLogs.some((l) => getWeekKey(l.logged_at) === getWeekKey(d))
  if (period === "month") return validLogs.some((l) => getMonthKey(l.logged_at) === getMonthKey(d))
  if (period === "n_per_week") {
    const n = Number(habit.target_count) || 1
    const wk = getWeekKey(d)
    const count = validLogs.filter((l) => getWeekKey(l.logged_at) === wk).length
    return count >= n
  }
  if (period === "n_per_day") {
    const n = Number(habit.target_count) || 1
    const count = validLogs.filter((l) => getDateKey(l.logged_at) === dateKey).length
    return count >= n
  }
  return false
}

/** Log count on that date (for n_per_day display). Returns null for non-count habits. */
export const getLogCountOnDate = (habit: Habit, logs: HabitLog[], dateKey: string): number | null => {
  if (habit.period !== "n_per_day") return null
  const validLogs = logs.filter((l) => l.logged_at && isValidLogDate(l.logged_at))
  return validLogs.filter((l) => getDateKey(l.logged_at) === dateKey).length
}
