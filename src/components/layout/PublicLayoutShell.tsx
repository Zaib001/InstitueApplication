"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export function PublicLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide global public navbar and footer on dedicated authentication routes
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  if (isAuthRoute) {
    return (
      <main className="min-h-screen flex flex-col bg-slate-900 text-white selection:bg-amber-500 selection:text-slate-950">
        {children}
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
