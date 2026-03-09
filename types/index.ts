export type SecurityLevel = "Standard" | "High" | "Maximum" | "Ultra";

export interface Match {
    id: string; // UUID from DB
    tournament_id: string;
    home_team: string; // Updated to snake_case from DB
    away_team: string;
    home_logo: string;
    away_logo: string;
    date: string; // ISO 8601
    stadium: string;
    base_price: number;
    security_level: SecurityLevel;
    total_seats: number;
    available_seats: number;
    tournaments?: { name: string };
}

export interface Promotion {
    id: string;
    title: string;
    description: string;
    discount: string;
    gradientCode: string;
}

export type TicketStatus = "Valid" | "Used" | "Cancelled" | "Suspended";

export interface Ticket {
    id: string;
    user_id: string;
    match_id: string;
    seat: string;
    price_paid: number;
    status: string; // 'Valid', 'Used', 'Cancelled', etc.
    ai_validation_hash: string;
    purchase_ip: string | null;
    created_at: string;
}

// Wrapper for relational JOIN queries
export interface TicketWithMatch extends Ticket {
    matches: Match;
}
