-- Verify RLS is enabled
SELECT 
  schemaname,
  tablename,
  relrowsecurity AS rls_enabled
FROM pg_tables 
JOIN pg_class ON pg_tables.tablename = pg_class.relname
WHERE tablename = 'pathways';

-- Check the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'pathways';
