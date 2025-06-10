-- Verify RLS is enabled and policies are created
SELECT 
  schemaname,
  tablename,
  rls_enabled
FROM pg_tables 
WHERE tablename = 'pathways';

-- Check the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'pathways';
