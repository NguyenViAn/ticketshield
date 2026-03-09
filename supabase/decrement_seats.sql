-- RPC function to decrement available_seats atomically
CREATE OR REPLACE FUNCTION decrement_available_seats(match_uuid UUID)
RETURNS boolean AS $$
DECLARE
    rows_updated INTEGER;
BEGIN
    UPDATE public.matches
    SET available_seats = available_seats - 1
    WHERE id = match_uuid
      AND available_seats > 0;

    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RETURN rows_updated = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
