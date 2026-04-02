export type TicketTierId = "VIP" | "Premium" | "Standard" | "Economy";
export const MAX_BOOKING_SEATS = 4;

export interface TicketTierDefinition {
  id: TicketTierId;
  name: string;
  description: string;
  priceMultiplier: number;
  totalSeats: number;
}

export const TICKET_TIERS: TicketTierDefinition[] = [
  {
    id: "VIP",
    name: "VIP Courtside",
    description: "",
    priceMultiplier: 2.5,
    totalSeats: 14,
  },
  {
    id: "Premium",
    name: "Premium Tier",
    description: "",
    priceMultiplier: 1.5,
    totalSeats: 22,
  },
  {
    id: "Standard",
    name: "Standard Admission",
    description: "",
    priceMultiplier: 1,
    totalSeats: 30,
  },
  {
    id: "Economy",
    name: "Economy Bowl",
    description: "",
    priceMultiplier: 0.75,
    totalSeats: 38,
  },
];

const SEAT_ID_PATTERN = /^(VIP|Premium|Standard|Economy)-(\d+)$/;

export function getTierDefinition(tierId: TicketTierId) {
  return TICKET_TIERS.find((tier) => tier.id === tierId) ?? null;
}

export function getTierFromSeatId(seatId: string | null | undefined): TicketTierId | null {
  if (!seatId) {
    return null;
  }

  const match = seatId.match(SEAT_ID_PATTERN);
  if (!match) {
    return null;
  }

  return match[1] as TicketTierId;
}

export function isConcreteSeatId(seatId: string | null | undefined) {
  return Boolean(getTierFromSeatId(seatId));
}

export function getSeatNumber(seatId: string | null | undefined) {
  if (!seatId) {
    return null;
  }

  const match = seatId.match(SEAT_ID_PATTERN);
  if (!match) {
    return null;
  }

  return Number(match[2]);
}

export function getSeatPrice(basePrice: number, seatId: string | null | undefined) {
  const tierId = getTierFromSeatId(seatId);

  if (!tierId) {
    return null;
  }

  const tier = getTierDefinition(tierId);
  if (!tier) {
    return null;
  }

  return basePrice * tier.priceMultiplier;
}

export function normalizeSeatIds(seatIds: string[]) {
  return seatIds.map((seatId) => seatId.trim()).filter(Boolean);
}

export function areSeatIdsUnique(seatIds: string[]) {
  return new Set(seatIds).size === seatIds.length;
}

export function areConcreteSeatIds(seatIds: string[]) {
  return seatIds.every((seatId) => isConcreteSeatId(seatId));
}

export function getSeatsTotalPrice(basePrice: number, seatIds: string[]) {
  return seatIds.reduce((sum, seatId) => sum + (getSeatPrice(basePrice, seatId) ?? 0), 0);
}

export function getSeatSelectionSummary(seatIds: string[]) {
  return seatIds
    .slice()
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
    .join(", ");
}

export function findFirstAvailableSeat(tierId: TicketTierId, takenSeats: string[]) {
  const tier = getTierDefinition(tierId);

  if (!tier) {
    return null;
  }

  for (let seatNumber = 1; seatNumber <= tier.totalSeats; seatNumber += 1) {
    const seatId = `${tierId}-${seatNumber}`;
    if (!takenSeats.includes(seatId)) {
      return seatId;
    }
  }

  return null;
}
