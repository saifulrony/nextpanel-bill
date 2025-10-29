-- Migration: Add order_id column to payments table
-- Date: 2025-01-25

-- Add order_id column to payments table if it doesn't exist
ALTER TABLE payments ADD COLUMN order_id TEXT REFERENCES orders(id);
