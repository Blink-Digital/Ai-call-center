-- Enable Row Level Security if not already enabled
ALTER TABLE pathways ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can access their own pathways" ON pathways;
DROP POLICY IF EXISTS "Users can insert their own pathways" ON pathways;
DROP POLICY IF EXISTS "Users can update their own pathways" ON pathways;
DROP POLICY IF EXISTS "Users can delete their own pathways" ON pathways;

-- Create RLS policies for secure access
CREATE POLICY "Users can select their own pathways"
  ON pathways
  FOR SELECT
  USING (auth.uid()::text = creator_id);

CREATE POLICY "Users can insert their own pathways"
  ON pathways
  FOR INSERT
  WITH CHECK (auth.uid()::text = creator_id);

CREATE POLICY "Users can update their own pathways"
  ON pathways
  FOR UPDATE
  USING (auth.uid()::text = creator_id)
  WITH CHECK (auth.uid()::text = creator_id);

CREATE POLICY "Users can delete their own pathways"
  ON pathways
  FOR DELETE
  USING (auth.uid()::text = creator_id);
