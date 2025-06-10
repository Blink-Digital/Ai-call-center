-- Test if the current user can access the flowchart data
SELECT 
  id, 
  name, 
  phone_number, 
  creator_id, 
  created_at,
  CASE 
    WHEN jsonb_typeof(data) = 'object' AND jsonb_array_length(data->'nodes') > 0 THEN 'Has flowchart data'
    ELSE 'No flowchart data'
  END as data_status
FROM pathways
WHERE phone_number = '19787836427'
LIMIT 1;

-- Check if the API route can access the data
SELECT COUNT(*) as accessible_pathways
FROM pathways
WHERE creator_id = 'f42a2757-ccb6-4f1e-ab99-56769b12089c';
