-- ==============================================
-- TICKETSHIELD: Clean Bootstrap v2
-- Run this after resetting the public schema.
-- ==============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.tournaments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.promotions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title_vi TEXT NOT NULL,
    title_en TEXT NOT NULL,
    description_vi TEXT NOT NULL,
    description_en TEXT NOT NULL,
    discount TEXT NOT NULL,
    gradient_code TEXT DEFAULT 'from-pink-600 to-purple-800',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    home_logo TEXT,
    away_logo TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    stadium TEXT NOT NULL,
    base_price INTEGER NOT NULL,
    security_level TEXT CHECK (security_level IN ('Standard', 'High', 'Maximum', 'Ultra')) DEFAULT 'High',
    total_seats INTEGER NOT NULL DEFAULT 104,
    available_seats INTEGER NOT NULL DEFAULT 104,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    seat TEXT NOT NULL,
    booking_group_id UUID,
    price_paid INTEGER NOT NULL,
    status TEXT CHECK (status IN ('Valid', 'Used', 'Cancelled', 'Suspended')) DEFAULT 'Valid',
    ai_validation_hash TEXT NOT NULL UNIQUE,
    purchase_ip TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.booking_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('seat_select', 'seat_deselect', 'checkout_attempt', 'checkout_success', 'checkout_failed')),
    seat_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.blocked_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL DEFAULT 'Spam',
    blocked_by UUID REFERENCES auth.users(id),
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id)
);

CREATE UNIQUE INDEX tickets_active_match_seat_unique
ON public.tickets (match_id, seat)
WHERE status IN ('Valid', 'Used');

CREATE INDEX tickets_user_match_status_idx
ON public.tickets (user_id, match_id, status);

CREATE INDEX booking_events_session_created_at_idx
ON public.booking_events (session_id, created_at DESC);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT COALESCE(
            (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
            false
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_user_blocked(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.blocked_users
        WHERE user_id = check_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

CREATE OR REPLACE FUNCTION public.decrement_available_seats(match_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.matches
    SET available_seats = GREATEST(available_seats - 1, 0)
    WHERE id = match_uuid
      AND available_seats > 0;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_available_seats(match_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.matches
    SET available_seats = LEAST(available_seats + 1, total_seats)
    WHERE id = match_uuid;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

    IF public.is_user_blocked(auth.uid()) THEN
        RAISE EXCEPTION 'Your account is blocked from purchasing tickets.';
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
        INSERT INTO public.tickets (
            user_id,
            match_id,
            seat,
            booking_group_id,
            price_paid,
            status,
            ai_validation_hash
        )
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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

REVOKE ALL ON FUNCTION public.checkout_booking(UUID, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.checkout_booking(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_available_seats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_available_seats(UUID) TO authenticated;

GRANT SELECT ON public.tournaments TO anon, authenticated;
GRANT SELECT ON public.promotions TO anon, authenticated;
GRANT SELECT ON public.matches TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.tickets TO authenticated;
GRANT INSERT ON public.booking_events TO anon;
GRANT SELECT, INSERT ON public.booking_events TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.blocked_users TO authenticated;
GRANT ALL ON public.tournaments, public.promotions, public.matches, public.tickets, public.booking_events, public.blocked_users TO service_role;

CREATE POLICY "Public Read Tournaments"
ON public.tournaments FOR SELECT
USING (true);

CREATE POLICY "Public Read Active Promotions"
ON public.promotions FOR SELECT
USING (active = true);

CREATE POLICY "Public Read Matches"
ON public.matches FOR SELECT
USING (true);

CREATE POLICY "Users Read Own Tickets"
ON public.tickets FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users Insert Own Tickets"
ON public.tickets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users Update Own Tickets"
ON public.tickets FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users Insert Booking Events"
ON public.booking_events FOR INSERT
TO anon, authenticated
WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Admin Read Blocked Users"
ON public.blocked_users FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin Insert Blocked Users"
ON public.blocked_users FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admin Delete Blocked Users"
ON public.blocked_users FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin Manage Matches"
ON public.matches FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin Read All Tickets"
ON public.tickets FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin Update All Tickets"
ON public.tickets FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin Read Booking Events"
ON public.booking_events FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin Manage Promotions"
ON public.promotions FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Block Blocked Users From Purchasing"
ON public.tickets FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id
    AND NOT public.is_user_blocked(auth.uid())
);

INSERT INTO public.tournaments (name, logo_url) VALUES
('Premier League 24/25', 'https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg'),
('Champions League', 'https://upload.wikimedia.org/wikipedia/vi/6/6b/UEFA_CHAMPIONS_LEAGUE.png'),
('La Liga', 'https://upload.wikimedia.org/wikipedia/commons/0/0f/LaLiga_logo_2023.svg'),
('Serie A', 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Lega_Serie_A_logo_%282021%29.svg'),
('V-League 2024/25', 'https://upload.wikimedia.org/wikipedia/vi/4/4c/V.League_1_new_logo.svg');

INSERT INTO public.promotions (title_vi, title_en, description_vi, description_en, discount, gradient_code) VALUES
(
    'Tet V-League Tickets',
    'Lunar New Year V-League Tickets',
    'Nhap ma TETCYBER de giam 20% cho cac tran dau dip Tet.',
    'Enter code TETCYBER to get 20% off on all match tickets during Lunar New Year.',
    '-20%',
    'from-pink-600 to-purple-800'
),
(
    'Combo Gia Dinh / Nhom',
    'Family / Group Combo',
    'Mua tu 4 ve tro len cho khu VIP va nhan nang cap bao mat mien phi.',
    'Buy 4+ tickets for VIP stands and get a free security upgrade.',
    'FREE UPGRADE',
    'from-cyan-600 to-blue-800'
),
(
    'Early Bird Doi Tuyen QG',
    'National Team Early Bird',
    'Mo ban som truoc 30 ngay cho thanh vien Platinum voi ma PLATINUM30.',
    'Early access 30 days before for Platinum members. Code: PLATINUM30.',
    '-10%',
    'from-orange-500 to-red-700'
);

INSERT INTO public.matches (
    tournament_id,
    home_team,
    away_team,
    home_logo,
    away_logo,
    date,
    stadium,
    base_price,
    security_level,
    total_seats,
    available_seats
)
VALUES
(
    (SELECT id FROM public.tournaments WHERE name = 'Premier League 24/25' LIMIT 1),
    'Arsenal',
    'Chelsea',
    'https://upload.wikimedia.org/wikipedia/vi/thumb/5/53/Arsenal_FC.svg/1200px-Arsenal_FC.svg.png',
    'https://upload.wikimedia.org/wikipedia/vi/thumb/5/5c/Chelsea_crest.svg/1200px-Chelsea_crest.svg.png',
    NOW() + INTERVAL '3 days',
    'Emirates Stadium',
    2500000,
    'Ultra',
    104,
    104
),
(
    (SELECT id FROM public.tournaments WHERE name = 'Premier League 24/25' LIMIT 1),
    'Manchester United',
    'Liverpool',
    'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
    'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
    NOW() + INTERVAL '5 days',
    'Old Trafford',
    3500000,
    'Maximum',
    104,
    104
),
(
    (SELECT id FROM public.tournaments WHERE name = 'Premier League 24/25' LIMIT 1),
    'Tottenham',
    'Manchester City',
    'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
    'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
    NOW() + INTERVAL '9 days',
    'Tottenham Hotspur Stadium',
    2800000,
    'High',
    104,
    104
),
(
    (SELECT id FROM public.tournaments WHERE name = 'Champions League' LIMIT 1),
    'Real Madrid',
    'Man City',
    'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
    'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
    NOW() + INTERVAL '7 days',
    'Santiago Bernabeu',
    4500000,
    'Maximum',
    104,
    104
),
(
    (SELECT id FROM public.tournaments WHERE name = 'Champions League' LIMIT 1),
    'Bayern Munich',
    'Borussia Dortmund',
    'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
    'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
    NOW() + INTERVAL '11 days',
    'Allianz Arena',
    4200000,
    'Maximum',
    104,
    104
),
(
    (SELECT id FROM public.tournaments WHERE name = 'La Liga' LIMIT 1),
    'Barcelona',
    'Atletico Madrid',
    'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
    'https://upload.wikimedia.org/wikipedia/it/1/15/Club_Atl%C3%A9tico_de_Madrid_logo_2018.png',
    NOW() + INTERVAL '13 days',
    'Camp Nou',
    5000000,
    'Ultra',
    104,
    104
),
(
    (SELECT id FROM public.tournaments WHERE name = 'La Liga' LIMIT 1),
    'Sevilla',
    'Valencia',
    'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg',
    'https://upload.wikimedia.org/wikipedia/en/c/ce/Valenciacf.svg',
    NOW() + INTERVAL '16 days',
    'Ramon Sanchez Pizjuan',
    1800000,
    'High',
    104,
    104
),
(
    (SELECT id FROM public.tournaments WHERE name = 'Serie A' LIMIT 1),
    'Juventus',
    'AC Milan',
    'https://upload.wikimedia.org/wikipedia/commons/b/bc/Juventus_FC_2017_icon_%28black%29.svg',
    'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
    NOW() + INTERVAL '8 days',
    'Allianz Stadium',
    3000000,
    'Maximum',
    104,
    104
),
(
    (SELECT id FROM public.tournaments WHERE name = 'Serie A' LIMIT 1),
    'Inter Milan',
    'Napoli',
    'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
    'https://upload.wikimedia.org/wikipedia/commons/2/28/SSC_Napoli_logo.svg',
    NOW() + INTERVAL '10 days',
    'San Siro',
    2800000,
    'High',
    104,
    104
),
(
    (SELECT id FROM public.tournaments WHERE name = 'V-League 2024/25' LIMIT 1),
    'Ha Noi FC',
    'Cong An Ha Noi',
    'https://upload.wikimedia.org/wikipedia/vi/b/b4/Logo_H%C3%A0_N%E1%BB%99i_FC.png',
    'https://upload.wikimedia.org/wikipedia/vi/3/38/Logo_CAHN_FC.svg',
    NOW() + INTERVAL '4 days',
    'Hang Day Stadium',
    500000,
    'High',
    104,
    104
),
(
    (SELECT id FROM public.tournaments WHERE name = 'V-League 2024/25' LIMIT 1),
    'Hoang Anh Gia Lai',
    'Thep Xanh Nam Dinh',
    'https://upload.wikimedia.org/wikipedia/vi/c/c9/Ho%C3%A0ng_Anh_Gia_Lai_FC.svg',
    'https://upload.wikimedia.org/wikipedia/en/c/cd/Thep_Xanh_Nam_Dinh_FC_logo.svg',
    NOW() + INTERVAL '6 days',
    'Pleiku Stadium',
    300000,
    'Standard',
    104,
    104
);
