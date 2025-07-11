-- Verify that phone_number column was added to pathways table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pathways' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
