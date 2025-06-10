-- TEDxECU Registration System Database Setup
-- Run this script in your Supabase SQL Editor

-- Step 1: Create the registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  phone_type VARCHAR(20) DEFAULT 'egyptian',
  university VARCHAR(255) NOT NULL,
  payment_proof_url TEXT,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'confirmed', 'rejected')),
  ticket_id VARCHAR(10) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  ticket_sent BOOLEAN DEFAULT FALSE
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_registrations_ticket_id ON registrations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at);

-- Step 3: Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Disable RLS for easier management (development mode)
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;

-- Step 5: Grant all permissions to all roles
GRANT ALL PRIVILEGES ON registrations TO postgres;
GRANT ALL PRIVILEGES ON registrations TO supabase_admin;
GRANT ALL PRIVILEGES ON registrations TO service_role;
GRANT ALL PRIVILEGES ON registrations TO authenticated;
GRANT ALL PRIVILEGES ON registrations TO anon;
GRANT ALL PRIVILEGES ON registrations TO public;

-- Step 6: Grant sequence permissions for ID generation
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO public;

-- Step 7: Set up storage policies for payment proofs
DROP POLICY IF EXISTS "Allow all operations on payment-proofs" ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_all_operations" ON storage.objects;
DROP POLICY IF EXISTS "storage_allow_all" ON storage.objects;

CREATE POLICY "payment_proofs_full_access" ON storage.objects
FOR ALL 
USING (bucket_id = 'payment-proofs') 
WITH CHECK (bucket_id = 'payment-proofs');

-- Step 8: Grant storage permissions
GRANT ALL ON storage.objects TO service_role;
GRANT ALL ON storage.buckets TO service_role;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Step 9: Create function to generate ticket IDs
CREATE OR REPLACE FUNCTION generate_ticket_id()
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Step 10: Create trigger to auto-generate ticket ID when payment is confirmed
CREATE OR REPLACE FUNCTION auto_generate_ticket_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'confirmed' AND (OLD.payment_status != 'confirmed' OR OLD.payment_status IS NULL) THEN
    IF NEW.ticket_id IS NULL THEN
      NEW.ticket_id := generate_ticket_id();
      -- Ensure uniqueness
      WHILE EXISTS (SELECT 1 FROM registrations WHERE ticket_id = NEW.ticket_id AND id != NEW.id) LOOP
        NEW.ticket_id := generate_ticket_id();
      END LOOP;
      NEW.confirmed_at := NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create the trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_ticket_id ON registrations;
CREATE TRIGGER trigger_auto_generate_ticket_id
  BEFORE UPDATE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_ticket_id();

-- Step 12: Create admin helper functions
CREATE OR REPLACE FUNCTION get_registration_stats()
RETURNS TABLE(
  total_registrations BIGINT,
  pending_registrations BIGINT,
  confirmed_registrations BIGINT,
  rejected_registrations BIGINT,
  tickets_sent BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_registrations,
    COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_registrations,
    COUNT(CASE WHEN payment_status = 'confirmed' THEN 1 END) as confirmed_registrations,
    COUNT(CASE WHEN payment_status = 'rejected' THEN 1 END) as rejected_registrations,
    COUNT(CASE WHEN ticket_sent = true THEN 1 END) as tickets_sent
  FROM registrations;
END;
$$ LANGUAGE plpgsql;

-- Step 13: Create force delete function for admin use
CREATE OR REPLACE FUNCTION force_delete_registration(reg_id UUID)
RETURNS TABLE(deleted_id UUID, deleted_name TEXT, deleted_email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_record RECORD;
BEGIN
    -- First get the record details
    SELECT id, name, email INTO deleted_record
    FROM registrations 
    WHERE id = reg_id;
    
    -- If record doesn't exist, raise exception
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registration with ID % not found', reg_id;
    END IF;
    
    -- Delete the record
    DELETE FROM registrations WHERE id = reg_id;
    
    -- Return the deleted record info
    RETURN QUERY SELECT deleted_record.id, deleted_record.name, deleted_record.email;
END;
$$;

-- Step 14: Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION generate_ticket_id() TO service_role;
GRANT EXECUTE ON FUNCTION get_registration_stats() TO service_role;
GRANT EXECUTE ON FUNCTION force_delete_registration(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION generate_ticket_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_registration_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION force_delete_registration(UUID) TO authenticated;

-- Step 15: Insert sample data for testing
INSERT INTO registrations (name, email, phone, phone_type, university, payment_status, ticket_id) VALUES
('Ahmed Mohamed', 'ahmed.mohamed@example.com', '01012345678', 'egyptian', 'Cairo University', 'confirmed', '123456'),
('Sara Ali', 'sara.ali@example.com', '01098765432', 'egyptian', 'American University in Cairo', 'pending', NULL),
('Omar Hassan', 'omar.hassan@example.com', '01155667788', 'egyptian', 'Alexandria University', 'confirmed', '789012'),
('Fatma Ibrahim', 'fatma.ibrahim@example.com', '01234567890', 'egyptian', 'Egyptian Chinese University', 'pending', NULL),
('Mohamed Youssef', 'mohamed.youssef@example.com', '01987654321', 'egyptian', 'German University in Cairo', 'rejected', NULL)
ON CONFLICT (email) DO NOTHING;

-- Step 16: Verify the setup
SELECT 'Database setup completed successfully!' as status;

-- Show table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'registrations'
ORDER BY ordinal_position;

-- Show current data count
SELECT 
  'Total registrations' as info,
  COUNT(*) as count
FROM registrations;

-- Show sample data
SELECT 
  id,
  name,
  email,
  payment_status,
  ticket_id,
  created_at
FROM registrations
ORDER BY created_at DESC
LIMIT 5;

-- Show storage bucket
SELECT 
  'Storage bucket status' as info,
  id as bucket_id,
  name as bucket_name,
  public as is_public
FROM storage.buckets 
WHERE name = 'payment-proofs';
