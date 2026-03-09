import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "../globals.css";
import { AIBadge } from "@/components/shared/ai-badge";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AuthProvider } from "@/components/providers/auth-provider";
import { routing } from '@/i18n/routing';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans-modern",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading-modern",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TicketShield | AI-Protected Football Tickets",
  description: "High-security online football ticket sales platform with built-in AI fraud detection.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} bg-slate-50 min-h-screen text-slate-900 antialiased overflow-x-hidden pt-16 flex flex-col`}>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <Navbar />
            <div className="flex-grow">
              {children}
            </div>
            <Footer />
            <AIBadge />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
