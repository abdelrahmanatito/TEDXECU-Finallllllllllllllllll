-- NUCLEAR OPTION: Completely disable RLS for easy dashboard management
-- Use this if you want to manage records easily from Supabase dashboard

-- WARNING: This removes all security restrictions
-- Only use this for development/testing environments

-- Disable RLS completely
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "allow_all_operations" ON registrations;
DROP POLICY IF EXISTS "postgres_full_access" ON registrations;
DROP POLICY IF EXISTS "supabase_admin_full_access" ON registrations;
DROP POLICY IF EXISTS "service_role_all_access" ON registrations;
DROP POLICY IF EXISTS "authenticated_all_access" ON registrations;
DROP POLICY IF EXISTS "anon_all_access" ON registrations;

-- Grant all permissions to everyone (for development only)
GRANT ALL PRIVILEGES ON registrations TO postgres;
GRANT ALL PRIVILEGES ON registrations TO supabase_admin;
GRANT ALL PRIVILEGES ON registrations TO service_role;
GRANT ALL PRIVILEGES ON registrations TO authenticated;
GRANT ALL PRIVILEGES ON registrations TO anon;
GRANT ALL PRIVILEGES ON registrations TO public;

-- Grant sequence permissions
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO public;

-- Test the setup
SELECT 'RLS completely disabled - dashboard should work now' as status,
       COUNT(*) as total_records
FROM registrations;

-- Show current table info
SELECT 
  schemaname,
  tablename,
  tableowner,
  rowsecurity,
  hasindexes
FROM pg_tables 
WHERE tablename = 'registrations';
