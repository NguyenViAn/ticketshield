-- Prevent two active tickets from claiming the same seat in the same match.
CREATE UNIQUE INDEX IF NOT EXISTS tickets_match_seat_active_idx
ON public.tickets (match_id, seat)
WHERE status IN ('Valid', 'Used');

-- Only decrement inventory when seats are still available.
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

-- Restore inventory when a valid ticket is cancelled.
CREATE OR REPLACE FUNCTION increment_available_seats(match_uuid UUID)
RETURNS boolean AS $$
DECLARE
    rows_updated INTEGER;
BEGIN
    UPDATE public.matches
    SET available_seats = LEAST(available_seats + 1, total_seats)
    WHERE id = match_uuid;

    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RETURN rows_updated = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
