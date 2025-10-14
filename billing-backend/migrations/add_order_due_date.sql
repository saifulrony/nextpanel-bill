-- Migration: Add billing_period and due_date to orders table
-- Date: 2024

-- Add billing_period column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS billing_period VARCHAR(20);

-- Add due_date column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;

-- Update existing orders to have default due date (30 days from created_at)
UPDATE orders 
SET due_date = created_at + INTERVAL '30 days'
WHERE due_date IS NULL;

-- Set default billing_period for existing orders
UPDATE orders 
SET billing_period = 'monthly'
WHERE billing_period IS NULL;

