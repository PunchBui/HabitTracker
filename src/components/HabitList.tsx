import { useState } from "react"
import { HabitCard } from "./HabitCard"
import { HabitForm } from "./HabitForm"
import { useHabits } from "../hooks/useHabits"
import type { HabitInsert } from "../types/habit"
import type { HabitType } from "../types/habit"

type Filter = "all" | HabitType

export const HabitList = () => {
  const { habits, loading, error, addHabit, deleteHabit } = useHabits()
  const [filter, setFilter] = useState<Filter>("all")
  const [showForm, setShowForm] = useState(false)

  const filteredHabits = habits.filter((h) => (filter === "all" ? true : h.type === filter))

  const handleAddHabit = async (habit: HabitInsert) => {
    return addHabit(habit)
  }

  return (
    <div>
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
            <HabitCard key={habit.id} habit={habit} onDelete={deleteHabit} />
          ))}
        </div>
      )}
    </div>
  )
}
