import type { Tables, TablesInsert } from "./database"

export type HabitType = "bad" | "good" | "todo"
export type Period = "day" | "workday" | "week" | "month"

export type Habit = Tables<"habits">
export type HabitInsert = TablesInsert<"habits">

export type HabitLog = Tables<"habit_logs">
export type HabitLogInsert = TablesInsert<"habit_logs">
