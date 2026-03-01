import { useState, useCallback, useEffect } from "react"
import { supabase } from "../lib/supabase"
import type { Habit } from "../types/habit"

export type HabitLogWithHabit = {
  id: string
  habit_id: string
  logged_at: string
  note: string | null
  habits: Pick<Habit, "id" | "name" | "type" | "period">
}

export const useAllLogs = (limit = 100) => {
  const [logs, setLogs] = useState<HabitLogWithHabit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAllLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from("habit_logs")
      .select(
        `
        id,
        habit_id,
        logged_at,
        note,
        habits (
          id,
          name,
          type,
          period
        )
      `
      )
      .order("logged_at", { ascending: false })
      .limit(limit)
    if (err) {
      setError(err.message)
      setLogs([])
    } else {
      setLogs((data ?? []) as HabitLogWithHabit[])
    }
    setLoading(false)
  }, [limit])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      const { data, error: err } = await supabase
        .from("habit_logs")
        .select(
          `
          id,
          habit_id,
          logged_at,
          note,
          habits (
            id,
            name,
            type,
            period
          )
        `
        )
        .order("logged_at", { ascending: false })
        .limit(limit)
      if (cancelled) return
      if (err) {
        setError(err.message)
        setLogs([])
      } else {
        setLogs((data ?? []) as HabitLogWithHabit[])
      }
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [limit])

  return { logs, loading, error, fetchAllLogs }
}
