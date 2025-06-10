-- Fix Supabase Dashboard Delete Permissions
-- This will allow you to delete records directly from the Supabase interface

-- Step 1: Check current user and role
SELECT current_user, current_role;

-- Step 2: Temporarily disable RLS to allow dashboard operations
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;

-- Step 3: Grant ALL permissions to the postgres role (used by Supabase dashboard)
GRANT ALL PRIVILEGES ON TABLE registrations TO postgres;
GRANT ALL PRIVILEGES ON TABLE registrations TO supabase_admin;

-- Step 4: Grant permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_admin;

-- Step 5: If you want to keep RLS enabled, create a policy for postgres role
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows postgres (dashboard) to do everything
CREATE POLICY "postgres_full_access" ON registrations
FOR ALL 
TO postgres
USING (true) 
WITH CHECK (true);

-- Create a policy for supabase_admin role
CREATE POLICY "supabase_admin_full_access" ON registrations
FOR ALL 
TO supabase_admin
USING (true) 
WITH CHECK (true);

-- Step 6: Alternative - If you want to completely disable RLS for easier management
-- Uncomment the next line if you want to disable RLS entirely:
-- ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;

-- Step 7: Test delete operation
-- This should work now from the Supabase dashboard
SELECT 'Dashboard permissions fixed' as status, 
       COUNT(*) as total_records,
       current_user as current_role
FROM registrations;

-- Step 8: Show all current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'registrations'
ORDER BY policyname;

-- Step 9: Show table permissions
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'registrations'
ORDER BY grantee, privilege_type;
