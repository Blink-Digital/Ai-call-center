-- Check if the trigger function exists
SELECT EXISTS (
  SELECT 1 FROM pg_proc 
  WHERE proname = 'handle_new_user'
);

-- Check if the trigger exists
SELECT EXISTS (
  SELECT 1 FROM pg_trigger 
  WHERE tgname = 'on_auth_user_created'
);

-- View recent users in auth.users
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- View recent users in public.users
SELECT 
  id,
  email,
  name,
  company,
  phone_number,
  role,
  created_at,
  last_login
FROM public.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Check for users that exist in auth but not in public (should be empty)
SELECT 
  a.id,
  a.email,
  a.created_at as auth_created_at
FROM auth.users a
LEFT JOIN public.users p ON a.id = p.id
WHERE p.id IS NULL
ORDER BY a.created_at DESC;
