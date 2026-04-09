-- ==============================================
-- TICKETSHIELD: Database Schema Initialization
-- ==============================================

CREATE TABLE public.tournaments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
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
    total_seats INTEGER DEFAULT 104,
    available_seats INTEGER DEFAULT 104,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
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
    event_type TEXT NOT NULL CHECK (event_type IN ('seat_select', 'seat_deselect', 'checkout_attempt', 'checkout_success', 'checkout_failed', 'ai_risk_checked')),
    seat_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Tournaments"
ON public.tournaments FOR SELECT
USING (true);

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

INSERT INTO public.tournaments (name, logo_url) VALUES
('Premier League 24/25', 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Premier_League_Logo.svg/1200px-Premier_League_Logo.svg.png'),
('Champions League', 'https://upload.wikimedia.org/wikipedia/vi/6/6b/UEFA_CHAMPIONS_LEAGUE.png');

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
    (SELECT id FROM public.tournaments WHERE name = 'Champions League' LIMIT 1),
    'Real Madrid',
    'Man City',
    'https://upload.wikimedia.org/wikipedia/vi/thumb/c/c7/Logo_Real_Madrid.svg/1200px-Logo_Real_Madrid.svg.png',
    'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/1200px-Manchester_City_FC_badge.svg.png',
    NOW() + INTERVAL '7 days',
    'Santiago Bernabeu',
    4500000,
    'Maximum',
    104,
    104
);
