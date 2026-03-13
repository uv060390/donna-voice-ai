"use client";

import { SessionProvider } from "next-auth/react";
import { Navbar } from "@/components/Navbar";
import { Suspense } from "react";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Suspense fallback={<div className="h-16 bg-[#0d1b2a]" />}>
        <Navbar />
      </Suspense>
      {children}
    </SessionProvider>
  );
}
