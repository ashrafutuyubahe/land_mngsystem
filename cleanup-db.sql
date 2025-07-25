-- Database cleanup script to fix enum conflicts
-- Run this manually in your PostgreSQL database

-- Drop dependent objects first
DROP TABLE IF EXISTS inspections CASCADE;
DROP TABLE IF EXISTS construction_permits CASCADE;

-- Drop the enum types that are causing conflicts
DROP TYPE IF EXISTS construction_permits_constructiontype_enum CASCADE;
DROP TYPE IF EXISTS construction_permits_permitstatus_enum CASCADE;
DROP TYPE IF EXISTS inspections_inspectiontype_enum CASCADE;
DROP TYPE IF EXISTS inspections_inspectionstatus_enum CASCADE;

-- The tables will be recreated when you restart the application
-- with the corrected enum values
