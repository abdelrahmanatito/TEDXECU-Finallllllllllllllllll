-- Create a function to execute arbitrary SQL statements
CREATE OR REPLACE FUNCTION execute_sql(sql_statement TEXT) RETURNS VOID AS $$
BEGIN
    EXECUTE sql_statement;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check the ticket_id column length
SELECT 
    column_name, 
    data_type, 
    character_maximum_length
FROM 
    information_schema.columns 
WHERE 
    table_name = 'registrations'
    AND column_name = 'ticket_id';

-- If ticket_id is VARCHAR(10), let's alter it to be longer
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'registrations' 
        AND column_name = 'ticket_id'
        AND data_type = 'character varying'
        AND character_maximum_length = 10
    ) THEN
        ALTER TABLE registrations ALTER COLUMN ticket_id TYPE VARCHAR(20);
        RAISE NOTICE 'Modified ticket_id column to VARCHAR(20)';
    END IF;
END $$;

-- Verify the change
SELECT 
    column_name, 
    data_type, 
    character_maximum_length
FROM 
    information_schema.columns 
WHERE 
    table_name = 'registrations'
    AND column_name = 'ticket_id';
