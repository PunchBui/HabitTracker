import type { Habit, HabitLog } from "../types/habit"

const getDateKey = (isoString: string): string => {
  const d = new Date(isoString)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

const getWeekKey = (isoString: string): string => {
  const d = new Date(isoString)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`
}

const getMonthKey = (isoString: string): string => {
  const d = new Date(isoString)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

const isWorkday = (date: Date): boolean => {
  const day = date.getDay()
  return day >= 1 && day <= 5
}

const addDays = (date: Date, n: number): Date => {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

const addWeeks = (date: Date, n: number): Date => addDays(date, n * 7)

const addMonths = (date: Date, n: number): Date => {
  const d = new Date(date)
  d.setMonth(d.getMonth() + n)
  return d
}

const getPrevWorkday = (date: Date): Date => {
  const d = new Date(date)
  d.setDate(d.getDate() - 1)
  while (!isWorkday(d)) {
    d.setDate(d.getDate() - 1)
  }
  return d
}

export const computeStreak = (habit: Habit, logs: HabitLog[]): { current: number } => {
  if (logs.length === 0) return { current: 0 }

  const now = new Date()
  const period = habit.period

  if (period === "day") {
    const dateSet = new Set(logs.map((l) => getDateKey(l.logged_at)))
    if (dateSet.size === 0) return { current: 0 }
    const todayKey = getDateKey(now.toISOString())
    if (!dateSet.has(todayKey) && !dateSet.has(getDateKey(addDays(now, -1).toISOString()))) {
      return { current: 0 }
    }
    let streak = 0
    let check = new Date(now)
    check.setHours(0, 0, 0, 0)
    while (dateSet.has(getDateKey(check.toISOString()))) {
      streak++
      check = addDays(check, -1)
    }
    return { current: streak }
  }

  if (period === "workday") {
    const dates = [...new Set(logs.map((l) => getDateKey(l.logged_at)))].filter((k) => {
      const d = new Date(k)
      return isWorkday(d)
    })
    if (dates.length === 0) return { current: 0 }
    const dateSet = new Set(dates)
    let check = isWorkday(now) ? new Date(now) : getPrevWorkday(now)
    check.setHours(0, 0, 0, 0)
    const todayKey = getDateKey(check.toISOString())
    if (!dateSet.has(todayKey) && !dateSet.has(getDateKey(getPrevWorkday(check).toISOString()))) {
      return { current: 0 }
    }
    let streak = 0
    while (dateSet.has(getDateKey(check.toISOString()))) {
      streak++
      check = getPrevWorkday(check)
    }
    return { current: streak }
  }

  if (period === "week") {
    const weeks = [...new Set(logs.map((l) => getWeekKey(l.logged_at)))].sort().reverse()
    if (weeks.length === 0) return { current: 0 }
    const thisWeekKey = getWeekKey(now.toISOString())
    const lastWeekKey = getWeekKey(addWeeks(now, -1).toISOString())
    if (weeks[0] !== thisWeekKey && weeks[0] !== lastWeekKey) return { current: 0 }
    const weekSet = new Set(weeks)
    let check = new Date(now)
    let streak = 0
    while (weekSet.has(getWeekKey(check.toISOString()))) {
      streak++
      check = addWeeks(check, -1)
    }
    return { current: streak }
  }

  if (period === "month") {
    const months = [...new Set(logs.map((l) => getMonthKey(l.logged_at)))].sort().reverse()
    if (months.length === 0) return { current: 0 }
    const thisMonthKey = getMonthKey(now.toISOString())
    const lastMonthKey = getMonthKey(addMonths(now, -1).toISOString())
    if (months[0] !== thisMonthKey && months[0] !== lastMonthKey) return { current: 0 }
    const monthSet = new Set(months)
    let check = new Date(now)
    let streak = 0
    while (monthSet.has(getMonthKey(check.toISOString()))) {
      streak++
      check = addMonths(check, -1)
    }
    return { current: streak }
  }

  if (period === "n_per_week") {
    const n = habit.target_count ?? 1
    const logsByWeek = new Map<string, number>()
    for (const log of logs) {
      const wk = getWeekKey(log.logged_at)
      logsByWeek.set(wk, (logsByWeek.get(wk) ?? 0) + 1)
    }
    const thisWeekKey = getWeekKey(now.toISOString())
    if ((logsByWeek.get(thisWeekKey) ?? 0) < n && (logsByWeek.get(getWeekKey(addWeeks(now, -1).toISOString())) ?? 0) < n) {
      return { current: 0 }
    }
    let streak = 0
    let check = new Date(now)
    while ((logsByWeek.get(getWeekKey(check.toISOString())) ?? 0) >= n) {
      streak++
      check = addWeeks(check, -1)
    }
    return { current: streak }
  }

  return { current: 0 }
}

export const getRemainingThisWeek = (habit: Habit, logs: HabitLog[]): number | null => {
  if (habit.period !== "n_per_week") return null
  const n = habit.target_count ?? 1
  const thisWeekKey = getWeekKey(new Date().toISOString())
  const thisWeekCount = logs.filter((l) => getWeekKey(l.logged_at) === thisWeekKey).length
  const remaining = Math.max(0, n - thisWeekCount)
  return remaining
}

export const getStreakLabel = (period: string, count: number): string => {
  if (count === 0) return ""
  const unit =
    period === "day"
      ? "day"
      : period === "workday"
        ? "workday"
        : period === "week" || period === "n_per_week"
          ? "week"
          : "month"
  return `${count} ${unit} streak`
}
