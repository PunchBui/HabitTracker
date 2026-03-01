import { useState } from "react"
import { PeriodSelector } from "./PeriodSelector"
import type { Habit, HabitType, Period } from "../types/habit"
import type { HabitInsert } from "../types/habit"

type HabitFormProps = {
  onSubmit: (habit: HabitInsert) => Promise<Habit | null>
  onCancel?: () => void
}

const TYPES: { value: HabitType; label: string }[] = [
  { value: "bad", label: "Bad" },
  { value: "good", label: "Good" },
  { value: "todo", label: "Todo" },
]

export const HabitForm = ({ onSubmit, onCancel }: HabitFormProps) => {
  const [name, setName] = useState("")
  const [type, setType] = useState<HabitType>("good")
  const [period, setPeriod] = useState<Period>("day")
  const [targetDay, setTargetDay] = useState<number | null>(null)
  const [targetDate, setTargetDate] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    const habit: HabitInsert = {
      name: name.trim(),
      type,
      period,
      target_day: period === "week" ? targetDay : null,
      target_date: period === "month" ? targetDate : null,
    }
    const result = await onSubmit(habit)
    setSubmitting(false)
    if (result) {
      setName("")
      setType("good")
      setPeriod("day")
      setTargetDay(null)
      setTargetDate(null)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Habit name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Drink 8 glasses of water"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Type</label>
        <div className="mt-1 flex gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                type === t.value
                  ? t.value === "bad"
                    ? "bg-red-600 text-white"
                    : t.value === "good"
                      ? "bg-green-600 text-white"
                      : "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <PeriodSelector
        value={period}
        targetDay={targetDay}
        targetDate={targetDate}
        onChange={(p, td, tdt) => {
          setPeriod(p)
          setTargetDay(td)
          setTargetDate(tdt)
        }}
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Adding…" : "Add habit"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
