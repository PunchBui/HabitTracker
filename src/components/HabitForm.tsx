import { useState } from "react"
import { PeriodSelector } from "./PeriodSelector"
import type { Habit, HabitType, Period } from "../types/habit"
import type { HabitInsert } from "../types/habit"

type HabitFormProps = {
  onSubmit: (habit: HabitInsert) => Promise<Habit | null>
  onCancel?: () => void
  initialHabit?: Habit | null
  onUpdate?: (id: string, habit: HabitInsert) => Promise<Habit | null>
}

const TYPES: { value: HabitType; label: string }[] = [
  { value: "bad", label: "Bad" },
  { value: "good", label: "Good" },
  { value: "todo", label: "Todo" },
]

const HABIT_COLORS: { value: string; hex: string }[] = [
  { value: "#ef4444", hex: "#ef4444" },
  { value: "#f97316", hex: "#f97316" },
  { value: "#eab308", hex: "#eab308" },
  { value: "#22c55e", hex: "#22c55e" },
  { value: "#14b8a6", hex: "#14b8a6" },
  { value: "#3b82f6", hex: "#3b82f6" },
  { value: "#8b5cf6", hex: "#8b5cf6" },
  { value: "#ec4899", hex: "#ec4899" },
  { value: "#6b7280", hex: "#6b7280" },
]

export const HabitForm = ({ onSubmit, onCancel, initialHabit, onUpdate }: HabitFormProps) => {
  const [name, setName] = useState(initialHabit?.name ?? "")
  const [type, setType] = useState<HabitType>((initialHabit?.type as HabitType) ?? "good")
  const [period, setPeriod] = useState<Period>((initialHabit?.period as Period) ?? "day")
  const [targetDay, setTargetDay] = useState<number | null>(initialHabit?.target_day ?? null)
  const [targetDate, setTargetDate] = useState<number | null>(initialHabit?.target_date ?? null)
  const [targetCount, setTargetCount] = useState<number | null>(initialHabit?.target_count ?? null)
  const [color, setColor] = useState<string | null>(initialHabit?.color ?? null)
  const [submitting, setSubmitting] = useState(false)

  const isEditMode = !!initialHabit && !!onUpdate

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (period === "n_per_week" && (!targetCount || targetCount < 1 || targetCount > 7)) return
    if (period === "n_per_day" && (!targetCount || targetCount < 1 || targetCount > 24)) return
    setSubmitting(true)
    const habit: HabitInsert = {
      name: name.trim(),
      type,
      period,
      target_day: period === "week" ? targetDay : null,
      target_date: period === "month" ? targetDate : null,
      target_count: period === "n_per_week" || period === "n_per_day" ? targetCount : null,
      color: color || null,
    }
    const result = isEditMode && initialHabit ? await onUpdate!(initialHabit.id, habit) : await onSubmit(habit)
    setSubmitting(false)
    if (result) {
      if (!isEditMode) {
        setName("")
        setType("good")
        setPeriod("day")
        setTargetDay(null)
        setTargetDate(null)
        setTargetCount(null)
        setColor(null)
      }
      onCancel?.()
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
        targetCount={targetCount}
        onChange={(p, td, tdt, tc) => {
          setPeriod(p)
          setTargetDay(td)
          setTargetDate(tdt)
          setTargetCount(tc)
        }}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700">Color</label>
        <div className="mt-1 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setColor(null)}
            title="Default (type color)"
            className={`h-8 w-8 rounded-full border-2 transition-shadow ${
              color === null ? "border-gray-900 ring-2 ring-gray-400" : "border-gray-300 hover:border-gray-400"
            }`}
            style={{ background: "repeating-conic-gradient(#e5e7eb 0% 25%, #f3f4f6 0% 50%) 50% / 12px 12px" }}
          />
          {HABIT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              title={c.value}
              className={`h-8 w-8 rounded-full border-2 transition-shadow ${
                color === c.value ? "border-gray-900 ring-2 ring-offset-1 ring-gray-500" : "border-gray-300 hover:border-gray-400"
              }`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? (isEditMode ? "Saving…" : "Adding…") : isEditMode ? "Save" : "Add habit"}
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
