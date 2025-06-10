-- Verify the registrations table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'registrations'
ORDER BY ordinal_position;

-- Add personal_photo_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'registrations' 
        AND column_name = 'personal_photo_url'
    ) THEN
        ALTER TABLE registrations ADD COLUMN personal_photo_url TEXT;
        RAISE NOTICE 'Added personal_photo_url column';
    ELSE
        RAISE NOTICE 'personal_photo_url column already exists';
    END IF;
END $$;

-- Ensure ticket_id column exists and has proper format
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'registrations' 
        AND column_name = 'ticket_id'
    ) THEN
        ALTER TABLE registrations ADD COLUMN ticket_id TEXT;
        RAISE NOTICE 'Added ticket_id column';
    ELSE
        RAISE NOTICE 'ticket_id column already exists';
    END IF;
END $$;

-- Ensure ticket_sent column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'registrations' 
        AND column_name = 'ticket_sent'
    ) THEN
        ALTER TABLE registrations ADD COLUMN ticket_sent BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added ticket_sent column';
    ELSE
        RAISE NOTICE 'ticket_sent column already exists';
    END IF;
END $$;

-- Generate ticket IDs for existing records that don't have them
UPDATE registrations 
SET ticket_id = 'TEDx' || LPAD((ROW_NUMBER() OVER (ORDER BY created_at))::TEXT, 6, '0')
WHERE ticket_id IS NULL OR ticket_id = '';

-- Update some test records with personal photos if they don't have them
UPDATE registrations 
SET personal_photo_url = 'https://via.placeholder.com/300x400/dc2626/ffffff?text=' || SUBSTRING(name FROM 1 FOR 1)
WHERE personal_photo_url IS NULL;

-- Show final table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'registrations'
ORDER BY ordinal_position;

-- Show sample data
SELECT 
  id,
  name,
  email,
  payment_status,
  ticket_id,
  ticket_sent,
  personal_photo_url IS NOT NULL as has_photo,
  payment_proof_url IS NOT NULL as has_proof,
  created_at
FROM registrations
ORDER BY created_at DESC
LIMIT 5;
