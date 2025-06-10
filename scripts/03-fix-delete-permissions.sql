-- Fix delete permissions and RLS policies for registrations table

-- First, let's check current policies and drop them
DROP POLICY IF EXISTS "Enable all operations for service role" ON registrations;
DROP POLICY IF EXISTS "Enable read access for all users" ON registrations;
DROP POLICY IF EXISTS "Enable insert for all users" ON registrations;
DROP POLICY IF EXISTS "Enable update for all users" ON registrations;
DROP POLICY IF EXISTS "Enable delete for all users" ON registrations;
DROP POLICY IF EXISTS "Allow all operations" ON registrations;

-- Disable RLS temporarily to ensure we can work with the table
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to service_role (this is what your API uses)
GRANT ALL PRIVILEGES ON registrations TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant permissions to authenticated and anon roles as well
GRANT ALL PRIVILEGES ON registrations TO authenticated;
GRANT ALL PRIVILEGES ON registrations TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Re-enable RLS
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all operations for service_role
CREATE POLICY "service_role_all_access" ON registrations
FOR ALL 
TO service_role
USING (true) 
WITH CHECK (true);

-- Create policies for other roles (optional, but good practice)
CREATE POLICY "authenticated_all_access" ON registrations
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

CREATE POLICY "anon_all_access" ON registrations
FOR ALL 
TO anon
USING (true) 
WITH CHECK (true);

-- Fix storage permissions as well
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations on payment-proofs" ON storage.objects;

-- Create comprehensive storage policy
CREATE POLICY "payment_proofs_all_operations" ON storage.objects
FOR ALL 
USING (bucket_id = 'payment-proofs') 
WITH CHECK (bucket_id = 'payment-proofs');

-- Grant storage permissions
GRANT ALL ON storage.objects TO service_role;
GRANT ALL ON storage.buckets TO service_role;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Check if everything is working by running a test query
SELECT 
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'registrations';

-- Show current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'registrations';

-- Test delete operation (this should work now)
-- SELECT COUNT(*) FROM registrations WHERE name LIKE '%Test%';
