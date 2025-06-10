-- Create function to check if a column exists
CREATE OR REPLACE FUNCTION check_column_exists(
  table_name TEXT,
  column_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = check_column_exists.table_name 
    AND column_name = check_column_exists.column_name
  ) INTO column_exists;
  
  RETURN column_exists;
END;
$$ LANGUAGE plpgsql;

-- Create function to add personal_photo_url column
CREATE OR REPLACE FUNCTION add_personal_photo_column() RETURNS VOID AS $$
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
END;
$$ LANGUAGE plpgsql;

-- Test the functions
SELECT check_column_exists('registrations', 'personal_photo_url');
SELECT add_personal_photo_column();
SELECT check_column_exists('registrations', 'personal_photo_url');
