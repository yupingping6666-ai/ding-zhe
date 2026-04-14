-- Migration: Add is_primary column to anniversaries table
ALTER TABLE anniversaries ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE;

-- Migrate existing data: mark the first "在一起" anniversary per space as primary
UPDATE anniversaries SET is_primary = TRUE
WHERE id IN (
  SELECT DISTINCT ON (space_id) id FROM anniversaries
  WHERE title LIKE '%在一起%'
  ORDER BY space_id, created_at ASC
);
