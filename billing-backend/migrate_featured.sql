-- Add featured columns to plans table
-- Run this with: sqlite3 billing.db < migrate_featured.sql

-- Add is_featured column
ALTER TABLE plans ADD COLUMN is_featured BOOLEAN DEFAULT 0;

-- Add sort_order column  
ALTER TABLE plans ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Verify columns were added
SELECT name, is_featured, sort_order FROM plans LIMIT 1;

