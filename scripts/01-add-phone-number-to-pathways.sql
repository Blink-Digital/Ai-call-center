-- Add phone_number column to existing pathways table
ALTER TABLE pathways 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Create unique constraint to enforce "one phone number = one flowchart per user"
-- This prevents duplicate flowcharts for the same phone number by the same user
CREATE UNIQUE INDEX IF NOT EXISTS idx_pathways_phone_creator 
ON pathways (phone_number, creator_id) 
WHERE phone_number IS NOT NULL;

-- Add index for faster phone number lookups
CREATE INDEX IF NOT EXISTS idx_pathways_phone_number 
ON pathways (phone_number) 
WHERE phone_number IS NOT NULL;

-- Add comment to document the constraint
COMMENT ON INDEX idx_pathways_phone_creator IS 'Ensures one flowchart per phone number per user';
