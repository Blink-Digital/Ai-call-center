-- Check if the unique index was created
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'pathways' 
    AND schemaname = 'public'
    AND indexname LIKE '%phone%';

-- Check unique constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.pathways'::regclass
    AND contype = 'u';
