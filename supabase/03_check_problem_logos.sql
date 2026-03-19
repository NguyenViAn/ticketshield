-- Check current team names and logo URLs for known problematic clubs

SELECT
  id,
  home_team,
  away_team,
  home_logo,
  away_logo
FROM public.matches
WHERE
  LOWER(home_team) IN (
    'cahn',
    'ha noi fc',
    'hà nội fc',
    'hã  ná»™i fc',
    'hoang anh gia lai',
    'hoàng anh gia lai',
    'hoã ng anh gia lai',
    'thep xanh nam dinh',
    'thép xanh nam định',
    'thã©p xanh nam äá»‹nh',
    'napoli',
    'atm madrid',
    'atletico madrid'
  )
  OR LOWER(away_team) IN (
    'cahn',
    'ha noi fc',
    'hà nội fc',
    'hã  ná»™i fc',
    'hoang anh gia lai',
    'hoàng anh gia lai',
    'hoã ng anh gia lai',
    'thep xanh nam dinh',
    'thép xanh nam định',
    'thã©p xanh nam äá»‹nh',
    'napoli',
    'atm madrid',
    'atletico madrid'
  )
ORDER BY date ASC;
