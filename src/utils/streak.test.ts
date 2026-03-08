import { describe, it, expect } from "vitest"
import { getLongestStreak, getRemainingThisWeek } from "./streak"
import type { Habit, HabitLog } from "../types/habit"

const createHabit = (overrides: Partial<Habit> = {}): Habit =>
  ({
    id: "habit-1",
    name: "Test",
    type: "good",
    period: "n_per_week",
    target_count: 3,
    created_at: new Date().toISOString(),
    ...overrides,
  }) as Habit

const createLog = (loggedAt: string): HabitLog =>
  ({
    id: "log-1",
    habit_id: "habit-1",
    logged_at: loggedAt,
    note: null,
  }) as HabitLog

describe("getRemainingThisWeek", () => {
  it("returns 1 when 2 logs exist for 3-per-week habit (bug fix)", () => {
    // Saturday March 1, 2025 - both logs in same week (Mon Mar 3 - Sun Mar 9 would be "this week" in some locales)
    // Use Wednesday March 5, 2025 as "now" - week is Mon Mar 3 - Sun Mar 9
    const now = new Date("2025-03-05T12:00:00.000Z")
    const habit = createHabit({ target_count: 3 })
    const logs: HabitLog[] = [
      createLog("2025-03-04T10:00:00.000Z"),
      createLog("2025-03-05T09:00:00.000Z"),
    ]
    const remaining = getRemainingThisWeek(habit, logs, now)
    expect(remaining).toBe(1)
  })

  it("returns 0 when 3 logs exist for 3-per-week habit", () => {
    const now = new Date("2025-03-05T12:00:00.000Z")
    const habit = createHabit({ target_count: 3 })
    const logs: HabitLog[] = [
      createLog("2025-03-03T10:00:00.000Z"),
      createLog("2025-03-04T10:00:00.000Z"),
      createLog("2025-03-05T09:00:00.000Z"),
    ]
    const remaining = getRemainingThisWeek(habit, logs, now)
    expect(remaining).toBe(0)
  })

  it("returns 2 when 1 log exists for 3-per-week habit", () => {
    const now = new Date("2025-03-05T12:00:00.000Z")
    const habit = createHabit({ target_count: 3 })
    const logs: HabitLog[] = [createLog("2025-03-05T09:00:00.000Z")]
    const remaining = getRemainingThisWeek(habit, logs, now)
    expect(remaining).toBe(2)
  })

  it("ignores logs from other weeks", () => {
    const now = new Date("2025-03-05T12:00:00.000Z")
    const habit = createHabit({ target_count: 3 })
    const logs: HabitLog[] = [
      createLog("2025-02-28T10:00:00.000Z"),
      createLog("2025-03-01T10:00:00.000Z"),
    ]
    const remaining = getRemainingThisWeek(habit, logs, now)
    expect(remaining).toBe(3)
  })

  it("uses local time consistently for week boundaries", () => {
    const now = new Date("2025-03-05T12:00:00.000Z")
    const habit = createHabit({ target_count: 3 })
    const logs: HabitLog[] = [
      createLog("2025-03-04T10:00:00.000Z"),
      createLog("2025-03-05T09:00:00.000Z"),
    ]
    const remaining = getRemainingThisWeek(habit, logs, now)
    expect(remaining).toBe(1)
    expect(remaining).not.toBe(2)
  })

  it("handles ISO format without milliseconds (PostgREST)", () => {
    const now = new Date("2025-03-05T12:00:00.000Z")
    const habit = createHabit({ target_count: 3 })
    const logs: HabitLog[] = [
      createLog("2025-03-04T10:00:00Z"),
      createLog("2025-03-05T09:00:00Z"),
    ]
    const remaining = getRemainingThisWeek(habit, logs, now)
    expect(remaining).toBe(1)
  })

  it("handles Supabase-style ISO format with offset", () => {
    const now = new Date("2025-03-05T12:00:00.000Z")
    const habit = createHabit({ target_count: 3 })
    const logs: HabitLog[] = [
      createLog("2025-03-04T10:00:00+00:00"),
      createLog("2025-03-05T09:00:00.000Z"),
    ]
    const remaining = getRemainingThisWeek(habit, logs, now)
    expect(remaining).toBe(1)
  })

  it("returns null for non-n_per_week habits", () => {
    const now = new Date("2025-03-05T12:00:00.000Z")
    const habit = createHabit({ period: "day" })
    const logs: HabitLog[] = [createLog("2025-03-05T09:00:00.000Z")]
    const remaining = getRemainingThisWeek(habit, logs, now)
    expect(remaining).toBeNull()
  })
})

describe("getLongestStreak", () => {
  it("returns the longest daily run", () => {
    const habit = createHabit({ period: "day", target_count: null })
    const logs: HabitLog[] = [
      createLog("2025-03-01T09:00:00.000Z"),
      createLog("2025-03-02T09:00:00.000Z"),
      createLog("2025-03-03T09:00:00.000Z"),
      createLog("2025-03-05T09:00:00.000Z"),
      createLog("2025-03-06T09:00:00.000Z"),
    ]
    expect(getLongestStreak(habit, logs)).toBe(3)
  })

  it("counts only days that meet n_per_day target", () => {
    const habit = createHabit({ period: "n_per_day", target_count: 2 })
    const logs: HabitLog[] = [
      createLog("2025-03-01T09:00:00.000Z"),
      createLog("2025-03-01T10:00:00.000Z"),
      createLog("2025-03-02T09:00:00.000Z"),
      createLog("2025-03-03T09:00:00.000Z"),
      createLog("2025-03-03T10:00:00.000Z"),
      createLog("2025-03-04T09:00:00.000Z"),
      createLog("2025-03-04T10:00:00.000Z"),
    ]
    expect(getLongestStreak(habit, logs)).toBe(2)
  })

  it("skips weekend gaps for workday habits", () => {
    const habit = createHabit({ period: "workday", target_count: null })
    const logs: HabitLog[] = [
      createLog("2025-03-06T09:00:00.000Z"), // Thu
      createLog("2025-03-07T09:00:00.000Z"), // Fri
      createLog("2025-03-10T09:00:00.000Z"), // Mon
      createLog("2025-03-12T09:00:00.000Z"), // Wed
    ]
    expect(getLongestStreak(habit, logs)).toBe(3)
  })
})
