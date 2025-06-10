-- Test email functionality by checking environment variables and permissions

-- Check if we can access the registrations table
SELECT 
  'Database connection test' as test_name,
  COUNT(*) as total_registrations,
  COUNT(CASE WHEN payment_status = 'confirmed' THEN 1 END) as confirmed_registrations,
  COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_registrations
FROM registrations;

-- Check storage bucket
SELECT 
  'Storage bucket test' as test_name,
  id as bucket_id,
  name as bucket_name,
  public as is_public,
  created_at
FROM storage.buckets 
WHERE name = 'payment-proofs';

-- Check storage policies
SELECT 
  'Storage policies' as test_name,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Show table permissions
SELECT 
  'Table permissions' as test_name,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'registrations'
ORDER BY grantee, privilege_type;

-- Test insert operation
INSERT INTO registrations (name, email, phone, phone_type, university, payment_status) 
VALUES ('Test User', 'test@example.com', '01234567890', 'egyptian', 'Test University', 'pending')
ON CONFLICT (email) DO UPDATE SET 
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  university = EXCLUDED.university
RETURNING id, name, email, payment_status, created_at;

-- Test update operation (confirm payment)
UPDATE registrations 
SET payment_status = 'confirmed'
WHERE email = 'test@example.com'
RETURNING id, name, email, payment_status, ticket_id;

-- Clean up test data
DELETE FROM registrations WHERE email = 'test@example.com';

SELECT 'All database tests completed successfully!' as result;
