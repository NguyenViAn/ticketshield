-- ==========================================================
-- TICKETSHIELD: Database Seed Expansion (Tournaments & Matches)
-- Chạy tệp SQL này trong Supabase > SQL Editor để thêm dữ liệu
-- ==========================================================

-- 1. Insert More Tournaments
INSERT INTO public.tournaments (name, logo_url) 
VALUES 
('V-League 2024/25', 'https://upload.wikimedia.org/wikipedia/vi/9/9c/V.League_1_logo.svg'),
('La Liga', 'https://upload.wikimedia.org/wikipedia/commons/0/0f/LaLiga_logo_2023.svg'),
('Serie A', 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Lega_Serie_A_logo_%282021%29.svg');

-- 2. Insert More Matches
-- We use subqueries to dynamically link to the freshly created or existing tournaments.
INSERT INTO public.matches (tournament_id, home_team, away_team, home_logo, away_logo, date, stadium, base_price, security_level)
VALUES 
-- PL Matches (Assuming Premier League exists from initial seed)
(
    (SELECT id FROM public.tournaments WHERE name = 'Premier League 24/25' LIMIT 1),
    'Manchester United', 'Liverpool',
    'https://upload.wikimedia.org/wikipedia/vi/thumb/a/a1/Man_Utd_FC_logo.svg/1200px-Man_Utd_FC_logo.svg.png',
    'https://upload.wikimedia.org/wikipedia/vi/thumb/0/0c/Liverpool_FC_logo.png/1200px-Liverpool_FC_logo.png',
    NOW() + INTERVAL '10 days',
    'Old Trafford',
    3500000,
    'Maximum'
),
(
    (SELECT id FROM public.tournaments WHERE name = 'Premier League 24/25' LIMIT 1),
    'Tottenham', 'Manchester City',
    'https://upload.wikimedia.org/wikipedia/vi/thumb/b/b4/Tottenham_Hotspur.svg/1200px-Tottenham_Hotspur.svg.png',
    'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/1200px-Manchester_City_FC_badge.svg.png',
    NOW() + INTERVAL '12 days',
    'Tottenham Hotspur Stadium',
    2800000,
    'High'
),

-- V-League Matches
(
    (SELECT id FROM public.tournaments WHERE name = 'V-League 2024/25' LIMIT 1),
    'Hà Nội FC', 'Công An Hà Nội',
    'https://upload.wikimedia.org/wikipedia/vi/thumb/c/cd/Hanoi_Football_Club.svg/1200px-Hanoi_Football_Club.svg.png',
    'https://upload.wikimedia.org/wikipedia/vi/3/38/Logo_CAHN_FC.svg',
    NOW() + INTERVAL '4 days',
    'Sân vận động Hàng Đẫy',
    500000,
    'High'
),
(
    (SELECT id FROM public.tournaments WHERE name = 'V-League 2024/25' LIMIT 1),
    'Hoàng Anh Gia Lai', 'Thép Xanh Nam Định',
    'https://upload.wikimedia.org/wikipedia/vi/thumb/d/df/Hoang_Anh_Gia_Lai_FC.svg/1200px-Hoang_Anh_Gia_Lai_FC.svg.png',
    'https://upload.wikimedia.org/wikipedia/en/c/cd/Thep_Xanh_Nam_Dinh_FC_logo.svg',
    NOW() + INTERVAL '5 days',
    'Sân vận động Pleiku',
    300000,
    'Standard'
),

-- La Liga Matches
(
    (SELECT id FROM public.tournaments WHERE name = 'La Liga' LIMIT 1),
    'Barcelona', 'Real Madrid',
    'https://upload.wikimedia.org/wikipedia/vi/thumb/9/91/FC_Barcelona_logo.svg/1200px-FC_Barcelona_logo.svg.png',
    'https://upload.wikimedia.org/wikipedia/vi/thumb/c/c7/Logo_Real_Madrid.svg/1200px-Logo_Real_Madrid.svg.png',
    NOW() + INTERVAL '15 days',
    'Camp Nou',
    5000000,
    'Ultra'
),
(
    (SELECT id FROM public.tournaments WHERE name = 'La Liga' LIMIT 1),
    'Atletico Madrid', 'Sevilla',
    'https://commons.wikimedia.org/wiki/Special:Redirect/file/Atletico_Madrid_Logo_2024.svg',
    'https://upload.wikimedia.org/wikipedia/en/thumb/3/3b/Sevilla_FC_logo.svg/1200px-Sevilla_FC_logo.svg.png',
    NOW() + INTERVAL '14 days',
    'Cívitas Metropolitano',
    2000000,
    'High'
),

-- Serie A Matches
(
    (SELECT id FROM public.tournaments WHERE name = 'Serie A' LIMIT 1),
    'Juventus', 'AC Milan',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Juventus_FC_2017_icon_%28black%29.svg/1200px-Juventus_FC_2017_icon_%28black%29.svg.png',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Logo_of_AC_Milan.svg/1200px-Logo_of_AC_Milan.svg.png',
    NOW() + INTERVAL '8 days',
    'Allianz Stadium',
    3000000,
    'Maximum'
),
(
    (SELECT id FROM public.tournaments WHERE name = 'Serie A' LIMIT 1),
    'Inter Milan', 'Napoli',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/FC_Internazionale_Milano_2021.svg/1200px-FC_Internazionale_Milano_2021.svg.png',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/SSC_Napoli_logo.svg/1200px-SSC_Napoli_logo.svg.png',
    NOW() + INTERVAL '9 days',
    'San Siro',
    2800000,
    'High'
);
