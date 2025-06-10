-- Create a function to run arbitrary SQL
CREATE OR REPLACE FUNCTION run_sql(sql_query TEXT) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE sql_query;
  result := '{"status": "success", "message": "SQL executed successfully"}'::JSONB;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := jsonb_build_object(
    'status', 'error',
    'message', SQLERRM,
    'detail', SQLSTATE
  );
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
SELECT run_sql('SELECT NOW();');
