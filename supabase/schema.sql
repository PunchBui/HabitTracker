-- habits table
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('bad', 'good', 'todo')),
  period text NOT NULL CHECK (period IN ('day', 'workday', 'week', 'month', 'n_per_week')),
  target_day int CHECK (target_day >= 0 AND target_day <= 6),
  target_date int CHECK (target_date >= 1 AND target_date <= 31),
  target_count int CHECK (target_count >= 1 AND target_count <= 7),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid
);

-- habit_logs table
CREATE TABLE IF NOT EXISTS habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  logged_at timestamptz NOT NULL DEFAULT now(),
  note text
);

-- RLS
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- Allow anon to do everything (development; restrict with auth later)
DROP POLICY IF EXISTS "habits_select" ON habits;
DROP POLICY IF EXISTS "habits_insert" ON habits;
DROP POLICY IF EXISTS "habits_update" ON habits;
DROP POLICY IF EXISTS "habits_delete" ON habits;
CREATE POLICY "habits_select" ON habits FOR SELECT TO anon USING (true);
CREATE POLICY "habits_insert" ON habits FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "habits_update" ON habits FOR UPDATE TO anon USING (true);
CREATE POLICY "habits_delete" ON habits FOR DELETE TO anon USING (true);

DROP POLICY IF EXISTS "habit_logs_select" ON habit_logs;
DROP POLICY IF EXISTS "habit_logs_insert" ON habit_logs;
DROP POLICY IF EXISTS "habit_logs_update" ON habit_logs;
DROP POLICY IF EXISTS "habit_logs_delete" ON habit_logs;
CREATE POLICY "habit_logs_select" ON habit_logs FOR SELECT TO anon USING (true);
CREATE POLICY "habit_logs_insert" ON habit_logs FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "habit_logs_update" ON habit_logs FOR UPDATE TO anon USING (true);
CREATE POLICY "habit_logs_delete" ON habit_logs FOR DELETE TO anon USING (true);
