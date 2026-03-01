import { useState, useCallback, useEffect } from "react"
import { supabase } from "../lib/supabase"
import type { Habit, HabitInsert } from "../types/habit"

export const useHabits = () => {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHabits = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase.from("habits").select("*").order("created_at", { ascending: false })
    if (err) {
      setError(err.message)
      setHabits([])
    } else {
      setHabits(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      const { data, error: err } = await supabase.from("habits").select("*").order("created_at", { ascending: false })
      if (cancelled) return
      if (err) {
        setError(err.message)
        setHabits([])
      } else {
        setHabits(data ?? [])
      }
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const addHabit = useCallback(
    async (habit: HabitInsert): Promise<Habit | null> => {
      setError(null)
      const { data, error: err } = await supabase.from("habits").insert(habit).select().single()
      if (err) {
        setError(err.message)
        return null
      }
      if (data) {
        setHabits((prev) => [data, ...prev])
        return data
      }
      return null
    },
    []
  )

  const updateHabit = useCallback(
    async (id: string, updates: Partial<HabitInsert>): Promise<Habit | null> => {
      setError(null)
      const { data, error: err } = await supabase.from("habits").update(updates).eq("id", id).select().single()
      if (err) {
        setError(err.message)
        return null
      }
      if (data) {
        setHabits((prev) => prev.map((h) => (h.id === id ? data : h)))
        return data
      }
      return null
    },
    []
  )

  const deleteHabit = useCallback(async (id: string): Promise<boolean> => {
    setError(null)
    const { error: err } = await supabase.from("habits").delete().eq("id", id)
    if (err) {
      setError(err.message)
      return false
    }
    setHabits((prev) => prev.filter((h) => h.id !== id))
    return true
  }, [])

  return { habits, loading, error, fetchHabits, addHabit, updateHabit, deleteHabit }
}
