-- Add personal_photo_url column directly without using functions
DO $$ 
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'registrations' 
        AND column_name = 'personal_photo_url'
    ) THEN
        -- Add the column
        ALTER TABLE registrations ADD COLUMN personal_photo_url TEXT;
        RAISE NOTICE 'Added personal_photo_url column to registrations table';
    ELSE
        RAISE NOTICE 'personal_photo_url column already exists in registrations table';
    END IF;
END $$;

-- Show table structure to identify the VARCHAR(10) issue
SELECT 
    column_name, 
    data_type, 
    character_maximum_length
FROM 
    information_schema.columns 
WHERE 
    table_name = 'registrations'
ORDER BY 
    ordinal_position;
