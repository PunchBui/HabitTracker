import type { Period } from "../types/habit"

type PeriodSelectorProps = {
  value: Period
  targetDay: number | null
  targetDate: number | null
  onChange: (period: Period, targetDay: number | null, targetDate: number | null) => void
}

const PERIODS: { value: Period; label: string }[] = [
  { value: "day", label: "Every day" },
  { value: "workday", label: "Workdays (Mon–Fri)" },
  { value: "week", label: "Once per week" },
  { value: "month", label: "Once per month" },
]

const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
]

export const PeriodSelector = ({ value, targetDay, targetDate, onChange }: PeriodSelectorProps) => {
  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const period = e.target.value as Period
    const newTargetDay = period === "week" ? (targetDay ?? 1) : null
    const newTargetDate = period === "month" ? (targetDate ?? 1) : null
    onChange(period, newTargetDay, newTargetDate)
  }

  const handleTargetDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(value, parseInt(e.target.value, 10), targetDate)
  }

  const handleTargetDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value ? parseInt(e.target.value, 10) : null
    onChange(value, targetDay, v ?? null)
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Period</label>
      <select
        value={value}
        onChange={handlePeriodChange}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        {PERIODS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {value === "week" && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Target day</label>
          <select
            value={targetDay ?? ""}
            onChange={handleTargetDayChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {DAY_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {value === "month" && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Target date (1–31)</label>
          <input
            type="number"
            min={1}
            max={31}
            value={targetDate ?? ""}
            onChange={handleTargetDateChange}
            placeholder="e.g. 1"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      )}
    </div>
  )
}
