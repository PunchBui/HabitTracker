-- Add optional color to habits (hex or any CSS color)
ALTER TABLE habits ADD COLUMN IF NOT EXISTS color text;
