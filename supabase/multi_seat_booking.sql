-- Multi-seat booking v1
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS booking_group_id UUID;

UPDATE public.tickets
SET booking_group_id = id
WHERE booking_group_id IS NULL;

ALTER TABLE public.matches
ALTER COLUMN total_seats SET DEFAULT 104;

ALTER TABLE public.matches
ALTER COLUMN available_seats SET DEFAULT 104;

UPDATE public.matches
SET total_seats = 104
WHERE total_seats = 50000;

UPDATE public.matches
SET available_seats = LEAST(available_seats, 104)
WHERE available_seats > 104;

CREATE TABLE IF NOT EXISTS public.booking_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('seat_select', 'seat_deselect', 'checkout_attempt', 'checkout_success', 'checkout_failed')),
    seat_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users Insert Booking Events"
ON public.booking_events FOR INSERT
TO anon, authenticated
WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_valid_demo_seat(seat_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    tier TEXT;
    seat_number INTEGER;
BEGIN
    IF seat_id !~ '^(VIP|Premium|Standard|Economy)-[0-9]+$' THEN
        RETURN FALSE;
    END IF;

    tier := split_part(seat_id, '-', 1);
    seat_number := split_part(seat_id, '-', 2)::INTEGER;

    RETURN (
        (tier = 'VIP' AND seat_number BETWEEN 1 AND 14)
        OR (tier = 'Premium' AND seat_number BETWEEN 1 AND 22)
        OR (tier = 'Standard' AND seat_number BETWEEN 1 AND 30)
        OR (tier = 'Economy' AND seat_number BETWEEN 1 AND 38)
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.get_demo_seat_price(base_price INTEGER, seat_id TEXT)
RETURNS INTEGER AS $$
BEGIN
    IF seat_id LIKE 'VIP-%' THEN
        RETURN base_price * 2.5;
    ELSIF seat_id LIKE 'Premium-%' THEN
        RETURN base_price * 1.5;
    ELSIF seat_id LIKE 'Standard-%' THEN
        RETURN base_price;
    ELSIF seat_id LIKE 'Economy-%' THEN
        RETURN base_price * 0.75;
    END IF;

    RAISE EXCEPTION 'Invalid seat id: %', seat_id;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.checkout_booking(match_uuid UUID, seat_ids TEXT[])
RETURNS JSONB AS $$
DECLARE
    requested_seat_count INTEGER;
    current_active_ticket_count INTEGER;
    conflicting_seat_count INTEGER;
    inserted_ticket_ids UUID[];
    booking_group_uuid UUID;
    match_record public.matches%ROWTYPE;
    total_price INTEGER;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    IF seat_ids IS NULL THEN
        RAISE EXCEPTION 'At least one seat is required.';
    END IF;

    requested_seat_count := COALESCE(array_length(seat_ids, 1), 0);

    IF requested_seat_count < 1 OR requested_seat_count > 4 THEN
        RAISE EXCEPTION 'Seat selection must contain between 1 and 4 seats.';
    END IF;

    IF EXISTS (
        SELECT seat_id
        FROM unnest(seat_ids) AS seat_id
        GROUP BY seat_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Duplicate seats are not allowed.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM unnest(seat_ids) AS seat_id
        WHERE NOT public.is_valid_demo_seat(seat_id)
    ) THEN
        RAISE EXCEPTION 'One or more selected seats are invalid.';
    END IF;

    SELECT *
    INTO match_record
    FROM public.matches
    WHERE id = match_uuid
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Match not found.';
    END IF;

    IF match_record.available_seats < requested_seat_count THEN
        RAISE EXCEPTION 'Not enough available seats.';
    END IF;

    SELECT COUNT(*)
    INTO current_active_ticket_count
    FROM public.tickets
    WHERE user_id = auth.uid()
      AND match_id = match_uuid
      AND status IN ('Valid', 'Used');

    IF current_active_ticket_count + requested_seat_count > 4 THEN
        RAISE EXCEPTION 'Maximum 4 active seats per user per match.';
    END IF;

    SELECT COUNT(*)
    INTO conflicting_seat_count
    FROM public.tickets
    WHERE match_id = match_uuid
      AND seat = ANY(seat_ids)
      AND status IN ('Valid', 'Used');

    IF conflicting_seat_count > 0 THEN
        RAISE EXCEPTION 'One or more selected seats are no longer available.';
    END IF;

    booking_group_uuid := gen_random_uuid();

    WITH inserted AS (
        INSERT INTO public.tickets (user_id, match_id, seat, booking_group_id, price_paid, status, ai_validation_hash)
        SELECT
            auth.uid(),
            match_uuid,
            seat_id,
            booking_group_uuid,
            public.get_demo_seat_price(match_record.base_price, seat_id),
            'Valid',
            'TS-' || UPPER(SUBSTRING(md5(random()::TEXT || clock_timestamp()::TEXT || seat_id) FROM 1 FOR 10)) || '-' || EXTRACT(EPOCH FROM clock_timestamp())::BIGINT
        FROM unnest(seat_ids) AS seat_id
        RETURNING id, price_paid
    )
    SELECT array_agg(id ORDER BY id), COALESCE(SUM(price_paid), 0)
    INTO inserted_ticket_ids, total_price
    FROM inserted;

    UPDATE public.matches
    SET available_seats = available_seats - requested_seat_count
    WHERE id = match_uuid;

    RETURN jsonb_build_object(
        'bookingGroupId', booking_group_uuid,
        'ticketIds', inserted_ticket_ids,
        'totalPrice', total_price
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
