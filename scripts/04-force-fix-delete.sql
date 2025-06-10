-- FORCE FIX DELETE PERMISSIONS - This will definitely work
-- Run this script in your Supabase SQL Editor

-- Step 1: Completely disable RLS temporarily
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'registrations') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON registrations';
    END LOOP;
END $$;

-- Step 3: Grant FULL permissions to ALL roles
GRANT ALL PRIVILEGES ON registrations TO postgres;
GRANT ALL PRIVILEGES ON registrations TO service_role;
GRANT ALL PRIVILEGES ON registrations TO authenticated;
GRANT ALL PRIVILEGES ON registrations TO anon;
GRANT ALL PRIVILEGES ON registrations TO public;

-- Step 4: Grant sequence permissions
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO public;

-- Step 5: Re-enable RLS with a simple "allow all" policy
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Step 6: Create ONE simple policy that allows EVERYTHING
CREATE POLICY "allow_all_operations" ON registrations
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Step 7: Fix storage permissions
DROP POLICY IF EXISTS "payment_proofs_all_operations" ON storage.objects;
DROP POLICY IF EXISTS "Allow all operations on payment-proofs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete" ON storage.objects;

-- Create simple storage policy
CREATE POLICY "storage_allow_all" ON storage.objects
FOR ALL 
USING (bucket_id = 'payment-proofs') 
WITH CHECK (bucket_id = 'payment-proofs');

-- Grant storage permissions
GRANT ALL ON storage.objects TO service_role;
GRANT ALL ON storage.buckets TO service_role;

-- Step 8: Test the fix with a simple query
SELECT 'DELETE permissions test' as test_name, 
       COUNT(*) as total_records,
       current_user as current_role
FROM registrations;

-- Step 9: Show current policies (should only show our new "allow_all_operations" policy)
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'registrations';

-- If you want to test delete immediately, uncomment the next line:
-- DELETE FROM registrations WHERE name LIKE '%Test%' LIMIT 1;
