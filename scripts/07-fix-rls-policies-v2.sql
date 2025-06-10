-- First, enable RLS on the pathways table
ALTER TABLE pathways ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can access their own pathways" ON pathways;
DROP POLICY IF EXISTS "Users can insert their own pathways" ON pathways;
DROP POLICY IF EXISTS "Users can update their own pathways" ON pathways;
DROP POLICY IF EXISTS "Users can delete their own pathways" ON pathways;
DROP POLICY IF EXISTS "Users can select their own pathways" ON pathways;

-- Create RLS policies with proper UUID handling
CREATE POLICY "Users can select their own pathways"
  ON pathways
  FOR SELECT
  USING (creator_id::text = auth.uid()::text);

CREATE POLICY "Users can insert their own pathways"
  ON pathways
  FOR INSERT
  WITH CHECK (creator_id::text = auth.uid()::text);

CREATE POLICY "Users can update their own pathways"
  ON pathways
  FOR UPDATE
  USING (creator_id::text = auth.uid()::text)
  WITH CHECK (creator_id::text = auth.uid()::text);

CREATE POLICY "Users can delete their own pathways"
  ON pathways
  FOR DELETE
  USING (creator_id::text = auth.uid()::text);
