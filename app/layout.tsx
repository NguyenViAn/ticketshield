import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";
import { ParticlesBg } from "@/components/particles-bg";
import { AIBadge } from "@/components/ai-badge";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TicketShield | AI-Protected Football Tickets",
  description: "High-security online football ticket sales platform with built-in AI fraud detection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${orbitron.variable} bg-galaxy min-h-screen text-white antialiased overflow-x-hidden`}>
        <ParticlesBg />
        {children}
        <AIBadge />
      </body>
    </html>
  );
}
