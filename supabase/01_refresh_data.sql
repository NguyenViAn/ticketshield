-- ==========================================================
-- TICKETSHIELD: Database Clean & Refresh Data (Fix Logo Bugs)
-- WARNING: This will delete existing tournaments, matches, and tickets!
-- Run this in your Supabase > SQL Editor
-- ==========================================================

-- 1. TRUNCATE CURRENT DATA
TRUNCATE TABLE public.tournaments CASCADE;

-- 2. Insert Tournaments with Stable Native SVG Logos
INSERT INTO public.tournaments (name, logo_url) VALUES 
('Premier League 24/25', 'https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg'),
('Champions League', 'https://upload.wikimedia.org/wikipedia/vi/f/f3/Logo_UEFA_Champions_League.svg'),
('La Liga', 'https://upload.wikimedia.org/wikipedia/commons/0/0f/LaLiga_logo_2023.svg'),
('Serie A', 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Lega_Serie_A_logo_%282021%29.svg'),
('V-League 2024/25', 'https://upload.wikimedia.org/wikipedia/vi/9/9c/V.League_1_logo.svg');

-- 3. Insert Matches with guaranteed scalable native SVG team logos
INSERT INTO public.matches (tournament_id, home_team, away_team, home_logo, away_logo, date, stadium, base_price, security_level)
VALUES 
-- PL Matches
(
    (SELECT id FROM public.tournaments WHERE name = 'Premier League 24/25' LIMIT 1),
    'Arsenal', 'Chelsea',
    'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
    'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
    NOW() + INTERVAL '3 days', 'Emirates Stadium', 2500000, 'Ultra'
),
(
    (SELECT id FROM public.tournaments WHERE name = 'Premier League 24/25' LIMIT 1),
    'Manchester United', 'Liverpool',
    'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
    'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
    NOW() + INTERVAL '10 days', 'Old Trafford', 3500000, 'Maximum'
),
(
    (SELECT id FROM public.tournaments WHERE name = 'Premier League 24/25' LIMIT 1),
    'Tottenham', 'Manchester City',
    'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
    'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
    NOW() + INTERVAL '12 days', 'Tottenham Hotspur Stadium', 2800000, 'High'
),

-- Champions League Matches
(
    (SELECT id FROM public.tournaments WHERE name = 'Champions League' LIMIT 1),
    'Real Madrid', 'Manchester City',
    'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
    'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
    NOW() + INTERVAL '7 days', 'Santiago Bernabéu', 4500000, 'Maximum'
),
(
    (SELECT id FROM public.tournaments WHERE name = 'Champions League' LIMIT 1),
    'Bayern Munich', 'Dortmund',
    'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
    'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
    NOW() + INTERVAL '15 days', 'Allianz Arena', 3800000, 'High'
),

-- V-League Matches
(
    (SELECT id FROM public.tournaments WHERE name = 'V-League 2024/25' LIMIT 1),
    'Hà Nội FC', 'Công An Hà Nội',
    'https://upload.wikimedia.org/wikipedia/vi/c/cd/Hanoi_Football_Club.svg',
    'https://upload.wikimedia.org/wikipedia/vi/6/6b/Cong_an_Ha_Noi_FC.svg',
    NOW() + INTERVAL '4 days', 'Sân vận động Hàng Đẫy', 500000, 'High'
),
(
    (SELECT id FROM public.tournaments WHERE name = 'V-League 2024/25' LIMIT 1),
    'Hoàng Anh Gia Lai', 'Thép Xanh Nam Định',
    'https://upload.wikimedia.org/wikipedia/vi/d/df/Hoang_Anh_Gia_Lai_FC.svg',
    'https://upload.wikimedia.org/wikipedia/vi/1/12/Nam_Dinh_FC_logo_2021.svg',
    NOW() + INTERVAL '5 days', 'Sân vận động Pleiku', 300000, 'Standard'
),

-- La Liga Matches
(
    (SELECT id FROM public.tournaments WHERE name = 'La Liga' LIMIT 1),
    'Barcelona', 'Real Madrid',
    'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
    'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
    NOW() + INTERVAL '15 days', 'Camp Nou', 5000000, 'Ultra'
),
(
    (SELECT id FROM public.tournaments WHERE name = 'La Liga' LIMIT 1),
    'Atletico Madrid', 'Sevilla',
    'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
    'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg',
    NOW() + INTERVAL '14 days', 'Cívitas Metropolitano', 2000000, 'High'
),

-- Serie A Matches
(
    (SELECT id FROM public.tournaments WHERE name = 'Serie A' LIMIT 1),
    'Juventus', 'AC Milan',
    'https://upload.wikimedia.org/wikipedia/commons/b/bc/Juventus_FC_2017_icon_%28black%29.svg',
    'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
    NOW() + INTERVAL '8 days', 'Allianz Stadium', 3000000, 'Maximum'
),
(
    (SELECT id FROM public.tournaments WHERE name = 'Serie A' LIMIT 1),
    'Inter Milan', 'Napoli',
    'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
    'https://upload.wikimedia.org/wikipedia/commons/2/28/SSC_Napoli_logo.svg',
    NOW() + INTERVAL '9 days', 'San Siro', 2800000, 'High'
);
