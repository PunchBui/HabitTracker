-- Add optional time-of-day for habit (day vs night)
ALTER TABLE habits ADD COLUMN IF NOT EXISTS time_of_day text CHECK (time_of_day IS NULL OR time_of_day IN ('day', 'night'));
