-- Check if RLS is enabled on pathways table
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'pathways' 
    AND schemaname = 'public';

-- List all RLS policies on pathways table
SELECT 
    policyname,
    cmd as command_type,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'pathways' 
    AND schemaname = 'public'
ORDER BY policyname;
