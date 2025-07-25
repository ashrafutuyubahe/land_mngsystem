-- Migration to remove legacy coordinates field
-- Run this SQL command in your PostGIS database to remove the coordinates column

-- Drop the coordinates column from land_records table
ALTER TABLE land_records DROP COLUMN IF EXISTS coordinates;

-- Add comment to track migration
COMMENT ON TABLE land_records IS 'Updated: Removed legacy coordinates field - now using PostGIS geometry fields only';
