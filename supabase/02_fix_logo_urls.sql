-- ==========================================================
-- TICKETSHIELD: Fix broken team and tournament logo URLs
-- Run this in Supabase SQL Editor on the current database.
-- ==========================================================

-- 1. Tournament logos
UPDATE public.tournaments
SET logo_url = CASE
  WHEN LOWER(name) LIKE '%premier league%' THEN 'https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg'
  WHEN LOWER(name) LIKE '%champions league%' THEN 'https://upload.wikimedia.org/wikipedia/commons/0/08/UEFA_Champions_League_logo_2.svg'
  WHEN LOWER(name) LIKE '%la liga%' THEN 'https://upload.wikimedia.org/wikipedia/commons/0/0f/LaLiga_logo_2023.svg'
  WHEN LOWER(name) LIKE '%serie a%' THEN 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Lega_Serie_A_logo_%282021%29.svg'
  WHEN LOWER(name) LIKE '%v-league%' OR LOWER(name) LIKE '%v league%' THEN 'https://upload.wikimedia.org/wikipedia/vi/9/9c/V.League_1_logo.svg'
  ELSE logo_url
END;

-- 2. Home team logos
UPDATE public.matches
SET home_logo = CASE
  WHEN LOWER(home_team) = 'arsenal' THEN 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg'
  WHEN LOWER(home_team) = 'cahn' THEN 'https://upload.wikimedia.org/wikipedia/vi/3/38/Logo_CAHN_FC.svg'
  WHEN LOWER(home_team) = 'chelsea' THEN 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg'
  WHEN LOWER(home_team) = 'manchester united' THEN 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg'
  WHEN LOWER(home_team) = 'liverpool' THEN 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg'
  WHEN LOWER(home_team) IN ('tottenham', 'tottenham hotspur') THEN 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg'
  WHEN LOWER(home_team) = 'manchester city' THEN 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg'
  WHEN LOWER(home_team) = 'real madrid' THEN 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg'
  WHEN LOWER(home_team) = 'barcelona' THEN 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg'
  WHEN LOWER(home_team) = 'atletico madrid' THEN 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Atletico_Madrid_Logo_2024.svg'
  WHEN LOWER(home_team) = 'atm madrid' THEN 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Atletico_Madrid_Logo_2024.svg'
  WHEN LOWER(home_team) = 'sevilla' THEN 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg'
  WHEN LOWER(home_team) = 'juventus' THEN 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Juventus_FC_-_logo_black_%28Italy%2C_2020%29.svg'
  WHEN LOWER(home_team) = 'ac milan' THEN 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg'
  WHEN LOWER(home_team) = 'inter milan' THEN 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg'
  WHEN LOWER(home_team) = 'napoli' THEN 'https://upload.wikimedia.org/wikipedia/commons/2/2d/SSC_Neapel.svg'
  WHEN LOWER(home_team) = 'bayern munich' THEN 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg'
  WHEN LOWER(home_team) IN ('borussia dortmund', 'dortmund') THEN 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg'
  WHEN LOWER(home_team) IN ('ha noi fc', 'hà nội fc') THEN 'https://upload.wikimedia.org/wikipedia/vi/b/b4/Logo_H%C3%A0_N%E1%BB%99i_FC.png'
  WHEN LOWER(home_team) IN ('cong an ha noi', 'công an hà nội', 'cong an ha noi fc') THEN 'https://upload.wikimedia.org/wikipedia/vi/3/38/Logo_CAHN_FC.svg'
  WHEN LOWER(home_team) IN ('hoang anh gia lai', 'hoàng anh gia lai') THEN 'https://upload.wikimedia.org/wikipedia/vi/c/c9/Ho%C3%A0ng_Anh_Gia_Lai_FC.svg'
  WHEN LOWER(home_team) IN ('thep xanh nam dinh', 'thép xanh nam định', 'nam dinh', 'nam định') THEN 'https://upload.wikimedia.org/wikipedia/en/c/cd/Thep_Xanh_Nam_Dinh_FC_logo.svg'
  ELSE home_logo
END;

-- 3. Away team logos
UPDATE public.matches
SET away_logo = CASE
  WHEN LOWER(away_team) = 'arsenal' THEN 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg'
  WHEN LOWER(away_team) = 'cahn' THEN 'https://upload.wikimedia.org/wikipedia/vi/3/38/Logo_CAHN_FC.svg'
  WHEN LOWER(away_team) = 'chelsea' THEN 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg'
  WHEN LOWER(away_team) = 'manchester united' THEN 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg'
  WHEN LOWER(away_team) = 'liverpool' THEN 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg'
  WHEN LOWER(away_team) IN ('tottenham', 'tottenham hotspur') THEN 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg'
  WHEN LOWER(away_team) = 'manchester city' THEN 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg'
  WHEN LOWER(away_team) = 'real madrid' THEN 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg'
  WHEN LOWER(away_team) = 'barcelona' THEN 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg'
  WHEN LOWER(away_team) = 'atletico madrid' THEN 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Atletico_Madrid_Logo_2024.svg'
  WHEN LOWER(away_team) = 'atm madrid' THEN 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Atletico_Madrid_Logo_2024.svg'
  WHEN LOWER(away_team) = 'sevilla' THEN 'https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg'
  WHEN LOWER(away_team) = 'juventus' THEN 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Juventus_FC_-_logo_black_%28Italy%2C_2020%29.svg'
  WHEN LOWER(away_team) = 'ac milan' THEN 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg'
  WHEN LOWER(away_team) = 'inter milan' THEN 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg'
  WHEN LOWER(away_team) = 'napoli' THEN 'https://upload.wikimedia.org/wikipedia/commons/2/2d/SSC_Neapel.svg'
  WHEN LOWER(away_team) = 'bayern munich' THEN 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg'
  WHEN LOWER(away_team) IN ('borussia dortmund', 'dortmund') THEN 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg'
  WHEN LOWER(away_team) IN ('ha noi fc', 'hà nội fc') THEN 'https://upload.wikimedia.org/wikipedia/vi/b/b4/Logo_H%C3%A0_N%E1%BB%99i_FC.png'
  WHEN LOWER(away_team) IN ('cong an ha noi', 'công an hà nội', 'cong an ha noi fc') THEN 'https://upload.wikimedia.org/wikipedia/vi/3/38/Logo_CAHN_FC.svg'
  WHEN LOWER(away_team) IN ('hoang anh gia lai', 'hoàng anh gia lai') THEN 'https://upload.wikimedia.org/wikipedia/vi/c/c9/Ho%C3%A0ng_Anh_Gia_Lai_FC.svg'
  WHEN LOWER(away_team) IN ('thep xanh nam dinh', 'thép xanh nam định', 'nam dinh', 'nam định') THEN 'https://upload.wikimedia.org/wikipedia/en/c/cd/Thep_Xanh_Nam_Dinh_FC_logo.svg'
  ELSE away_logo
END;
