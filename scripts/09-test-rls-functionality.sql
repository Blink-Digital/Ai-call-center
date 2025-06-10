-- Test RLS functionality by checking if we can access pathways
-- This should only return pathways for the authenticated user
SELECT 
  id,
  name,
  phone_number,
  creator_id,
  created_at,
  CASE 
    WHEN data IS NOT NULL AND data != '{}' THEN 'Has flowchart data'
    ELSE 'No flowchart data'
  END as data_status
FROM pathways
WHERE phone_number IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- Check total count
SELECT COUNT(*) as accessible_pathways FROM pathways;
