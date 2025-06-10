-- Test query to see current pathways structure
-- This will show us what data exists and the new phone_number column
SELECT 
    id,
    name,
    phone_number,  -- This should now exist
    creator_id,
    created_at,
    CASE 
        WHEN data IS NOT NULL THEN 'Has flowchart data'
        ELSE 'No flowchart data'
    END as data_status
FROM pathways 
LIMIT 5;

-- Count total pathways
SELECT COUNT(*) as total_pathways FROM pathways;

-- Count pathways with phone numbers (should be 0 initially)
SELECT COUNT(*) as pathways_with_phone_numbers 
FROM pathways 
WHERE phone_number IS NOT NULL;
