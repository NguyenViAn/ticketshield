import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";

import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans-modern",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading-modern",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TicketShield | AI-Protected Football Tickets",
  description: "High-security online football ticket sales platform with built-in AI fraud detection.",
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} min-h-screen overflow-x-hidden bg-background text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
