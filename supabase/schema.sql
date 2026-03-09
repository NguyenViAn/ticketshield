-- ==============================================
-- TICKETSHIELD: Database Schema Initialization --
-- ==============================================

-- 1. Create Tournaments Table
CREATE TABLE public.tournaments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Matches Table
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
    total_seats INTEGER DEFAULT 50000,
    available_seats INTEGER DEFAULT 50000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Tickets Table
CREATE TABLE public.tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    seat TEXT NOT NULL,
    price_paid INTEGER NOT NULL,
    status TEXT CHECK (status IN ('Valid', 'Used', 'Cancelled', 'Suspended')) DEFAULT 'Valid',
    ai_validation_hash TEXT NOT NULL UNIQUE,
    purchase_ip TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies

-- Public Read Access for Tournaments
CREATE POLICY "Public Read Tournaments" 
ON public.tournaments FOR SELECT 
USING (true);

-- Public Read Access for Matches
CREATE POLICY "Public Read Matches" 
ON public.matches FOR SELECT 
USING (true);

-- Authenticated Read Access for Own Tickets
CREATE POLICY "Users Read Own Tickets" 
ON public.tickets FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Authenticated Insert Access for Tickets (Purchasing)
CREATE POLICY "Users Insert Own Tickets" 
ON public.tickets FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Authenticated Update Access for Own Tickets (Cancel, etc.)
CREATE POLICY "Users Update Own Tickets"
ON public.tickets FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Insert Seed Data (Tournaments)
INSERT INTO public.tournaments (name, logo_url) VALUES 
('Premier League 24/25', 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Premier_League_Logo.svg/1200px-Premier_League_Logo.svg.png'),
('Champions League', 'https://upload.wikimedia.org/wikipedia/vi/thumb/f/f3/Logo_UEFA_Champions_League.svg/1200px-Logo_UEFA_Champions_League.svg.png');

-- 7. Insert Seed Data (Matches)
-- (Copy UUIDs from Tournaments table to link properly in production, 
--  here we use subqueries for convenience)
INSERT INTO public.matches (tournament_id, home_team, away_team, home_logo, away_logo, date, stadium, base_price, security_level)
VALUES 
(
    (SELECT id FROM public.tournaments WHERE name = 'Premier League 24/25' LIMIT 1),
    'Arsenal', 'Chelsea',
    'https://upload.wikimedia.org/wikipedia/vi/thumb/5/53/Arsenal_FC.svg/1200px-Arsenal_FC.svg.png',
    'https://upload.wikimedia.org/wikipedia/vi/thumb/5/5c/Chelsea_crest.svg/1200px-Chelsea_crest.svg.png',
    NOW() + INTERVAL '3 days',
    'Emirates Stadium',
    2500000,
    'Ultra'
),
(
    (SELECT id FROM public.tournaments WHERE name = 'Champions League' LIMIT 1),
    'Real Madrid', 'Man City',
    'https://upload.wikimedia.org/wikipedia/vi/thumb/c/c7/Logo_Real_Madrid.svg/1200px-Logo_Real_Madrid.svg.png',
    'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/1200px-Manchester_City_FC_badge.svg.png',
    NOW() + INTERVAL '7 days',
    'Santiago Bernabéu',
    4500000,
    'Maximum'
);
