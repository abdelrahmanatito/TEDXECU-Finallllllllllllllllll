-- Create admin functions for better management

-- Function to get registration statistics
CREATE OR REPLACE FUNCTION get_registration_stats()
RETURNS TABLE(
  total_registrations BIGINT,
  pending_registrations BIGINT,
  confirmed_registrations BIGINT,
  rejected_registrations BIGINT,
  tickets_sent BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_registrations,
    COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_registrations,
    COUNT(CASE WHEN payment_status = 'confirmed' THEN 1 END) as confirmed_registrations,
    COUNT(CASE WHEN payment_status = 'rejected' THEN 1 END) as rejected_registrations,
    COUNT(CASE WHEN ticket_sent = true THEN 1 END) as tickets_sent
  FROM registrations;
END;
$$ LANGUAGE plpgsql;

-- Function to confirm payment and generate ticket
CREATE OR REPLACE FUNCTION confirm_payment(registration_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  email TEXT,
  ticket_id TEXT,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  reg_record RECORD;
  new_ticket_id TEXT;
BEGIN
  -- Get the registration
  SELECT * INTO reg_record FROM registrations WHERE registrations.id = registration_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT registration_id, ''::TEXT, ''::TEXT, ''::TEXT, false, 'Registration not found';
    RETURN;
  END IF;
  
  IF reg_record.payment_status = 'confirmed' THEN
    RETURN QUERY SELECT reg_record.id, reg_record.name, reg_record.email, reg_record.ticket_id, true, 'Payment already confirmed';
    RETURN;
  END IF;
  
  -- Generate ticket ID if not exists
  IF reg_record.ticket_id IS NULL THEN
    new_ticket_id := generate_ticket_id();
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM registrations WHERE ticket_id = new_ticket_id) LOOP
      new_ticket_id := generate_ticket_id();
    END LOOP;
  ELSE
    new_ticket_id := reg_record.ticket_id;
  END IF;
  
  -- Update the registration
  UPDATE registrations 
  SET 
    payment_status = 'confirmed',
    ticket_id = new_ticket_id,
    confirmed_at = NOW()
  WHERE registrations.id = registration_id;
  
  RETURN QUERY SELECT reg_record.id, reg_record.name, reg_record.email, new_ticket_id, true, 'Payment confirmed successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to reject payment
CREATE OR REPLACE FUNCTION reject_payment(registration_id UUID, reason TEXT DEFAULT 'Payment verification failed')
RETURNS TABLE(
  id UUID,
  name TEXT,
  email TEXT,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  reg_record RECORD;
BEGIN
  -- Get the registration
  SELECT * INTO reg_record FROM registrations WHERE registrations.id = registration_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT registration_id, ''::TEXT, ''::TEXT, false, 'Registration not found';
    RETURN;
  END IF;
  
  -- Update the registration
  UPDATE registrations 
  SET 
    payment_status = 'rejected',
    ticket_id = NULL
  WHERE registrations.id = registration_id;
  
  RETURN QUERY SELECT reg_record.id, reg_record.name, reg_record.email, true, reason;
END;
$$ LANGUAGE plpgsql;

-- Function to mark ticket as sent
CREATE OR REPLACE FUNCTION mark_ticket_sent(registration_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE registrations 
  SET ticket_sent = true
  WHERE id = registration_id AND payment_status = 'confirmed';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_registration_stats() TO service_role;
GRANT EXECUTE ON FUNCTION confirm_payment(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION reject_payment(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION mark_ticket_sent(UUID) TO service_role;

-- Test the functions
SELECT * FROM get_registration_stats();

-- Show all functions created
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_registration_stats', 'confirm_payment', 'reject_payment', 'mark_ticket_sent', 'generate_ticket_id');
