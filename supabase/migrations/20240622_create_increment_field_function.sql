
-- Function to increment a numeric field safely
CREATE OR REPLACE FUNCTION public.increment_field(
  row_id UUID,
  table_name TEXT,
  field_name TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_value INTEGER;
  query TEXT;
BEGIN
  -- Validate table name to prevent SQL injection
  IF table_name NOT IN ('stock_monitors') THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name;
  END IF;
  
  -- Validate field name to prevent SQL injection
  IF field_name NOT IN ('consecutive_errors') THEN
    RAISE EXCEPTION 'Invalid field name: %', field_name;
  END IF;
  
  -- Build and execute query to get current value
  query := format('SELECT %I FROM %I WHERE id = $1', field_name, table_name);
  EXECUTE query INTO current_value USING row_id;
  
  -- If NULL, default to 0
  current_value := COALESCE(current_value, 0);
  
  -- Increment by 1
  current_value := current_value + 1;
  
  -- Update the value
  query := format('UPDATE %I SET %I = $1 WHERE id = $2', table_name, field_name);
  EXECUTE query USING current_value, row_id;
  
  RETURN current_value;
END;
$$;
