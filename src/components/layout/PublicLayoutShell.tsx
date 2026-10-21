"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export function PublicLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide global public navbar and footer on dashboard and authentication routes
  const isDashboardOrAuthRoute =
    pathname.startsWith("/parent") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  if (isDashboardOrAuthRoute) {
    return <main className="min-h-screen flex flex-col">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
