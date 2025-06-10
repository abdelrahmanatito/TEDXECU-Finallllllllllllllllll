-- Add personal photo column to registrations table
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS personal_photo_url TEXT;

-- Update the existing sample data to include some test photo URLs
UPDATE registrations 
SET personal_photo_url = 'https://via.placeholder.com/300x400/dc2626/ffffff?text=Photo+' || SUBSTRING(name FROM 1 FOR 1)
WHERE personal_photo_url IS NULL;

-- Show updated table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'registrations'
ORDER BY ordinal_position;

-- Show sample data with new column
SELECT 
  id,
  name,
  email,
  payment_status,
  ticket_id,
  personal_photo_url,
  created_at
FROM registrations
ORDER BY created_at DESC
LIMIT 5;
