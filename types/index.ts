import type { SessionFeaturesPayload } from "@/lib/ai/sessionFeatures";

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

export interface PromotionRow {
    id: string;
    title_vi: string;
    title_en: string;
    description_vi: string;
    description_en: string;
    discount: string;
    gradient_code: string;
    active: boolean;
}

export type TicketStatus = "Valid" | "Used" | "Cancelled" | "Suspended";

export interface Ticket {
    id: string;
    user_id: string;
    match_id: string;
    seat: string;
    booking_group_id: string | null;
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

export interface AdminStats {
    matchCount: number;
    ticketCount: number;
    totalRevenue: number;
    blockedUserCount: number;
}

export interface BlockedUser {
    id: string;
    user_id: string;
    reason: string;
    blocked_by: string | null;
    blocked_at: string;
}

export interface AdminTicket extends Ticket {
    matches: {
        home_team: string;
        away_team: string;
        stadium: string;
        date: string;
    };
}

export type BookingEventType =
    | "seat_select"
    | "seat_deselect"
    | "checkout_attempt"
    | "checkout_success"
    | "checkout_failed"
    | "ai_risk_checked";

export interface BookingEventMetadata {
    ipAddress?: string | null;
    retryCount?: number;
    seatIds?: string[];
    selectedCount?: number;
    timeSinceLastActionMs?: number | null;
    riskLevel?: "low" | "warning" | "high";
    confidence?: number | null;
    checkedAt?: string;
    step?: "seat_page" | "payment_pre_checkout";
    riskCheckStatus?: "passed" | "failed_open";
    features?: SessionFeaturesPayload;
    sessionId?: string;
    warningAccepted?: boolean;
}

export interface BookingEvent {
    id: string;
    session_id: string;
    user_id: string | null;
    match_id: string;
    event_type: BookingEventType;
    seat_count: number;
    metadata: BookingEventMetadata | null;
    created_at: string;
}

export interface AdminPromotion extends PromotionRow {
    created_at: string;
}
