import { useState, useCallback } from "react"
import { supabase } from "../lib/supabase"
import type { HabitLog, HabitLogInsert } from "../types/habit"

export const useHabitLogs = () => {
  const [error, setError] = useState<string | null>(null)

  const fetchLogsForHabit = useCallback(async (habitId: string, limit = 50): Promise<HabitLog[]> => {
    setError(null)
    const { data, error: err } = await supabase
      .from("habit_logs")
      .select("*")
      .eq("habit_id", habitId)
      .order("logged_at", { ascending: false })
      .limit(limit)
    if (err) {
      setError(err.message)
      return []
    }
    return data ?? []
  }, [])

  const addLog = useCallback(
    async (log: HabitLogInsert): Promise<HabitLog | null> => {
      setError(null)
      const { data, error: err } = await supabase.from("habit_logs").insert(log).select().single()
      if (err) {
        setError(err.message)
        return null
      }
      return data
    },
    []
  )

  const deleteLog = useCallback(async (logId: string): Promise<boolean> => {
    setError(null)
    const { error: err } = await supabase.from("habit_logs").delete().eq("id", logId)
    if (err) {
      setError(err.message)
      return false
    }
    return true
  }, [])

  return { error, fetchLogsForHabit, addLog, deleteLog }
}
