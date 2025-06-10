-- Add phoneType column to registrations table

-- First check if the column already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'registrations'
    AND column_name = 'phone_type'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE registrations ADD COLUMN phone_type VARCHAR(20) DEFAULT 'egyptian';
  END IF;
END $$;

-- Update existing records to have a default value
UPDATE registrations 
SET phone_type = 'egyptian' 
WHERE phone_type IS NULL;

-- Show the updated table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'registrations'
ORDER BY ordinal_position;

-- Count of records updated
SELECT 'Records updated with default phone_type' as info, COUNT(*) as count
FROM registrations;
