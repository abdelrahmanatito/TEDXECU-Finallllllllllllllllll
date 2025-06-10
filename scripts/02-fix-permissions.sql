-- Enable Row Level Security (RLS) on the registrations table
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable all operations for service role" ON registrations;
DROP POLICY IF EXISTS "Enable read access for all users" ON registrations;
DROP POLICY IF EXISTS "Enable insert for all users" ON registrations;
DROP POLICY IF EXISTS "Enable update for all users" ON registrations;
DROP POLICY IF EXISTS "Enable delete for all users" ON registrations;

-- Create a comprehensive policy for service role (admin operations)
CREATE POLICY "Enable all operations for service role" ON registrations
FOR ALL USING (true) WITH CHECK (true);

-- Grant necessary permissions to the authenticated role
GRANT ALL ON registrations TO authenticated;
GRANT ALL ON registrations TO anon;

-- Grant permissions to the service role (this is what your admin API uses)
GRANT ALL ON registrations TO service_role;

-- Make sure the service role can bypass RLS
ALTER TABLE registrations FORCE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (since we're using service role)
CREATE POLICY "Allow all operations" ON registrations
FOR ALL USING (true) WITH CHECK (true);

-- Grant usage on the sequence for ID generation
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Ensure storage permissions are correct
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Update storage policies to allow all operations
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete" ON storage.objects;

CREATE POLICY "Allow all operations on payment-proofs" ON storage.objects
FOR ALL USING (bucket_id = 'payment-proofs') WITH CHECK (bucket_id = 'payment-proofs');

-- Grant permissions on storage
GRANT ALL ON storage.objects TO service_role;
GRANT ALL ON storage.buckets TO service_role;
