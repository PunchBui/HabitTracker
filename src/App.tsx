import { HabitList } from "./components/HabitList"

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Habit Tracker</h1>
          <p className="text-sm text-gray-500">Track good, bad, and todo habits</p>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6">
        <HabitList />
      </main>
    </div>
  )
}

export default App
