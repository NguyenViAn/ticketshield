"use client";

import { usePathname } from "next/navigation";
import { AIBadge } from "@/components/shared/ai-badge";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

function isAdminPath(pathname: string) {
  return /^\/(?:vi|en)\/admin(?:\/|$)/.test(pathname);
}

export function LocaleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isAdminPath(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col pt-16">
      <Navbar />
      <div className="flex-grow">{children}</div>
      <Footer />
      <AIBadge />
    </div>
  );
}
