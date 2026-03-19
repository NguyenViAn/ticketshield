const DEFAULT_TEAM_BADGE =
  "https://upload.wikimedia.org/wikipedia/commons/8/8e/Football_pictogram.svg";

const DEFAULT_LEAGUE_LOGO =
  "https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg";

const TEAM_LOGOS: Record<string, string> = {
  "ac milan": "https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg",
  "atm madrid": "https://upload.wikimedia.org/wikipedia/it/1/15/Club_Atl%C3%A9tico_de_Madrid_logo_2018.png",
  "arsenal": "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg",
  "atletico madrid": "https://upload.wikimedia.org/wikipedia/it/1/15/Club_Atl%C3%A9tico_de_Madrid_logo_2018.png",
  "barcelona": "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
  "bayern munich": "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg",
  "cahn": "https://upload.wikimedia.org/wikipedia/vi/3/38/Logo_CAHN_FC.svg",
  "borussia dortmund": "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg",
  "chelsea": "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg",
  "cong an ha noi": "https://upload.wikimedia.org/wikipedia/vi/3/38/Logo_CAHN_FC.svg",
  "cong an ha noi fc": "https://upload.wikimedia.org/wikipedia/vi/3/38/Logo_CAHN_FC.svg",
  "cong an ha na i": "https://upload.wikimedia.org/wikipedia/vi/3/38/Logo_CAHN_FC.svg",
  "dortmund": "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg",
  "ha noi fc": "https://upload.wikimedia.org/wikipedia/vi/b/b4/Logo_H%C3%A0_N%E1%BB%99i_FC.png",
  "ha na i fc": "https://upload.wikimedia.org/wikipedia/vi/b/b4/Logo_H%C3%A0_N%E1%BB%99i_FC.png",
  "hoang anh gia lai": "https://upload.wikimedia.org/wikipedia/vi/c/c9/Ho%C3%A0ng_Anh_Gia_Lai_FC.svg",
  "hoa ng anh gia lai": "https://upload.wikimedia.org/wikipedia/vi/c/c9/Ho%C3%A0ng_Anh_Gia_Lai_FC.svg",
  "inter milan": "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg",
  "juventus": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Juventus_FC_-_logo_black_%28Italy%2C_2020%29.svg",
  "liverpool": "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg",
  "manchester city": "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg",
  "manchester united": "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg",
  "nam dinh": "https://upload.wikimedia.org/wikipedia/en/c/cd/Thep_Xanh_Nam_Dinh_FC_logo.svg",
  "napoli": "https://upload.wikimedia.org/wikipedia/commons/2/2d/SSC_Neapel.svg",
  "real madrid": "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
  "sevilla": "https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg",
  "thep xanh nam dinh": "https://upload.wikimedia.org/wikipedia/en/c/cd/Thep_Xanh_Nam_Dinh_FC_logo.svg",
  "tha p xanh nam a a nh": "https://upload.wikimedia.org/wikipedia/en/c/cd/Thep_Xanh_Nam_Dinh_FC_logo.svg",
  "tottenham": "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg",
  "tottenham hotspur": "https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg",
};

const LEAGUE_LOGOS: Array<{ match: string[]; logo: string }> = [
  {
    match: ["premier league"],
    logo: "https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg",
  },
  {
    match: ["champions league", "c1"],
    logo: "https://upload.wikimedia.org/wikipedia/vi/6/6b/UEFA_CHAMPIONS_LEAGUE.png",
  },
  {
    match: ["la liga"],
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/0f/LaLiga_logo_2023.svg",
  },
  {
    match: ["serie a", "italia", "italy"],
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Lega_Serie_A_logo_%282021%29.svg",
  },
  {
    match: ["v league", "v-league"],
    logo: "https://upload.wikimedia.org/wikipedia/vi/4/4c/V.League_1_new_logo.svg",
  },
];

function normalizeKey(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function resolveTeamLogo(teamName: string, fallbackLogo?: string | null) {
  const normalized = normalizeKey(teamName);
  return TEAM_LOGOS[normalized] ?? fallbackLogo ?? DEFAULT_TEAM_BADGE;
}

export function resolveLeagueLogo(leagueName?: string | null, fallbackLogo?: string | null) {
  const normalized = normalizeKey(leagueName ?? "");
  const matchedLeague = LEAGUE_LOGOS.find((entry) => entry.match.some((keyword) => normalized.includes(keyword)));
  return matchedLeague?.logo ?? fallbackLogo ?? DEFAULT_LEAGUE_LOGO;
}

export { DEFAULT_LEAGUE_LOGO, DEFAULT_TEAM_BADGE };
