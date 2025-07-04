-- Check if users exist in both tables
SELECT 
  'auth.users' as table_name,
  COUNT(*) as user_count
FROM auth.users
UNION ALL
SELECT 
  'public.users' as table_name,
  COUNT(*) as user_count
FROM public.users;

-- Check for any users that exist in auth but not in public
SELECT 
  a.id,
  a.email,
  a.created_at as auth_created_at,
  a.raw_user_meta_data
FROM auth.users a
LEFT JOIN public.users p ON a.id = p.id
WHERE p.id IS NULL
ORDER BY a.created_at DESC;

-- Show recent users from public.users if any exist
SELECT 
  id,
  email,
  name,
  company,
  phone_number,
  role,
  created_at
FROM public.users 
ORDER BY created_at DESC 
LIMIT 10;
