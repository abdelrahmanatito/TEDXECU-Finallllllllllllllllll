-- Add personal_photo_url column to registrations table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'registrations' 
        AND column_name = 'personal_photo_url'
    ) THEN
        ALTER TABLE registrations ADD COLUMN personal_photo_url TEXT;
        RAISE NOTICE 'Added personal_photo_url column to registrations table';
    ELSE
        RAISE NOTICE 'personal_photo_url column already exists in registrations table';
    END IF;
END $$;

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'registrations'
AND column_name = 'personal_photo_url';

-- Show sample data
SELECT 
  id,
  name,
  email,
  payment_status,
  personal_photo_url,
  created_at
FROM registrations
LIMIT 5;
