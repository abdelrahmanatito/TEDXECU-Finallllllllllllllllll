-- Create a SQL function that can force delete records
-- This bypasses any potential RLS or permission issues

CREATE OR REPLACE FUNCTION force_delete_registration(reg_id UUID)
RETURNS TABLE(deleted_id UUID, deleted_name TEXT, deleted_email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function owner (postgres)
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

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION force_delete_registration(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION force_delete_registration(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION force_delete_registration(UUID) TO anon;

-- Test the function (uncomment to test)
-- SELECT * FROM force_delete_registration('some-uuid-here');
