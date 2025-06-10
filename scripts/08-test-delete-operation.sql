-- Test delete operation to verify it works
-- Run this to test if delete is working

-- First, let's see what records we have
SELECT 
  id,
  name,
  email,
  payment_status,
  created_at
FROM registrations 
ORDER BY created_at DESC 
LIMIT 10;

-- Create a test record to delete
INSERT INTO registrations (name, email, phone, university, payment_status)
VALUES ('DELETE TEST USER', 'delete.test@example.com', '01234567890', 'Test University', 'pending')
RETURNING id, name, email;

-- Now try to delete the test record
-- Replace 'test-id-here' with the actual ID from the INSERT above
-- DELETE FROM registrations WHERE email = 'delete.test@example.com';

-- Verify the delete worked
SELECT COUNT(*) as remaining_test_records
FROM registrations 
WHERE email = 'delete.test@example.com';

-- Show current permissions for troubleshooting
SELECT 
  'Current user: ' || current_user as info
UNION ALL
SELECT 
  'Current role: ' || current_role as info
UNION ALL
SELECT 
  'RLS enabled: ' || CASE WHEN rowsecurity THEN 'YES' ELSE 'NO' END as info
FROM pg_tables 
WHERE tablename = 'registrations';
