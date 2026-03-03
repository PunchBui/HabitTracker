import { describe, it, expect } from "vitest"
import { getRemainingThisWeek } from "./streak"
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
