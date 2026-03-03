import { useState } from "react"
import { HabitList } from "./components/HabitList"
import { Logs } from "./components/Logs"

type View = "habits" | "logs"

const App = () => {
  const [activeView, setActiveView] = useState<View>("habits")

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Habit Tracker</h1>
          <p className="text-sm text-gray-500">Track good, bad, and todo habits</p>
          <nav className="mt-3 flex gap-2">
            <button
              onClick={() => setActiveView("habits")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${activeView === "habits" ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            >
              Habits
            </button>
            <button
              onClick={() => setActiveView("logs")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${activeView === "logs" ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            >
              Logs
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6">
        {activeView === "habits" ? <HabitList /> : <Logs />}
      </main>
    </div>
  )
}

export default App
