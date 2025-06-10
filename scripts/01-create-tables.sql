-- Create the registrations table
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_registrations_ticket_id ON registrations(ticket_id);

-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT USING (bucket_id = 'payment-proofs');

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON registrations TO service_role;
GRANT ALL PRIVILEGES ON registrations TO authenticated;
GRANT ALL PRIVILEGES ON registrations TO anon;

-- Grant sequence permissions
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Enable Row Level Security but allow all operations
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations
CREATE POLICY "allow_all_operations" ON registrations
FOR ALL USING (true) WITH CHECK (true);

-- Create storage policy for all operations
CREATE POLICY "storage_allow_all" ON storage.objects
FOR ALL 
USING (bucket_id = 'payment-proofs') 
WITH CHECK (bucket_id = 'payment-proofs');

-- Grant storage permissions
GRANT ALL ON storage.objects TO service_role;
GRANT ALL ON storage.buckets TO service_role;

-- Create function to generate ticket IDs
CREATE OR REPLACE FUNCTION generate_ticket_id()
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate ticket ID when payment is confirmed
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
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_ticket_id ON registrations;
CREATE TRIGGER trigger_auto_generate_ticket_id
  BEFORE UPDATE ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_ticket_id();

-- Insert some sample data for testing
INSERT INTO registrations (name, email, phone, phone_type, university, payment_status, ticket_id) VALUES
('Ahmed Mohamed', 'ahmed.mohamed@example.com', '01012345678', 'egyptian', 'Cairo University', 'confirmed', '123456'),
('Sara Ali', 'sara.ali@example.com', '01098765432', 'egyptian', 'American University in Cairo', 'pending', NULL),
('Omar Hassan', 'omar.hassan@example.com', '01155667788', 'egyptian', 'Alexandria University', 'confirmed', '789012')
ON CONFLICT (email) DO NOTHING;

-- Show table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'registrations'
ORDER BY ordinal_position;

-- Show current data
SELECT 
  id,
  name,
  email,
  payment_status,
  ticket_id,
  created_at
FROM registrations
ORDER BY created_at DESC;
