import type { TicketWithMatch } from "@/types";

export type BookingGroupStatus = "Active" | "Cancelled";

export interface TicketBookingGroup {
  bookingGroupId: string;
  latestCreatedAt: string;
  matchTitle: string;
  primaryTicketId: string;
  seats: string[];
  seatCount: number;
  status: BookingGroupStatus;
  tickets: TicketWithMatch[];
  totalPrice: number;
}

export function groupTicketsByBooking(tickets: TicketWithMatch[]) {
  const groupedTickets = new Map<string, TicketWithMatch[]>();

  tickets.forEach((ticket) => {
    const bookingGroupId = ticket.booking_group_id ?? ticket.id;
    const existingTickets = groupedTickets.get(bookingGroupId) ?? [];
    existingTickets.push(ticket);
    groupedTickets.set(bookingGroupId, existingTickets);
  });

  return Array.from(groupedTickets.entries())
    .map(([bookingGroupId, grouped]) => {
      const orderedTickets = grouped
        .slice()
        .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime());
      const latestTicket = orderedTickets[0];
      const matchTitle = latestTicket?.matches
        ? `${latestTicket.matches.home_team} vs ${latestTicket.matches.away_team}`
        : "Unknown Match";
      const seats = orderedTickets
        .map((ticket) => ticket.seat)
        .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
      const status = orderedTickets.every((ticket) => ticket.status === "Cancelled") ? "Cancelled" : "Active";

      return {
        bookingGroupId,
        latestCreatedAt: latestTicket?.created_at ?? "",
        matchTitle,
        primaryTicketId: orderedTickets.find((ticket) => ticket.status !== "Cancelled")?.id ?? latestTicket?.id ?? bookingGroupId,
        seats,
        seatCount: seats.length,
        status,
        tickets: orderedTickets,
        totalPrice: orderedTickets.reduce((sum, ticket) => sum + ticket.price_paid, 0),
      } satisfies TicketBookingGroup;
    })
    .sort((left, right) => new Date(right.latestCreatedAt).getTime() - new Date(left.latestCreatedAt).getTime());
}
