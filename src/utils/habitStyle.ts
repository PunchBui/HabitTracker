const TYPE_STYLES: Record<string, string> = {
  bad: "bg-red-100 text-red-800",
  good: "bg-green-100 text-green-800",
  todo: "bg-blue-100 text-blue-800",
}

type HabitLike = { type: string; color?: string | null }

export type HabitStyleResult = {
  className: string
  style?: { backgroundColor: string; color: string }
}

export const getHabitStyle = (habit: HabitLike): HabitStyleResult => {
  if (habit.color) {
    return {
      className: "",
      style: { backgroundColor: habit.color, color: "#fff" },
    }
  }
  return { className: TYPE_STYLES[habit.type] ?? "bg-gray-100 text-gray-800", style: undefined }
}
