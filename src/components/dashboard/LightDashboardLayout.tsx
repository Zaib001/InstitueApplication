"use client";

import React, { useState } from "react";
import { LightSidebar } from "./LightSidebar";
import { LightRightProfile } from "./LightRightProfile";
import { AuthenticatedUser } from "@/lib/auth/session";
import { Menu, X } from "lucide-react";

interface LightDashboardLayoutProps {
  user: AuthenticatedUser;
  children: React.ReactNode;
  hideRightProfile?: boolean;
}

export function LightDashboardLayout({
  user,
  children,
  hideRightProfile = false,
}: LightDashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col antialiased">
      {/* Mobile Top Header (Small Screens Only) */}
      <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-extrabold text-[#16385c] text-sm">
            Monsieur<span className="text-[#e59a38] ml-1">Fanyi</span>
          </span>
        </div>

        <div className="w-8 h-8 rounded-full bg-[#16385c] text-white flex items-center justify-center text-xs font-bold">
          {user.fullName.charAt(0).toUpperCase()}
        </div>
      </header>

      {/* Main 3-Column Screen Canvas */}
      <div className="flex-1 flex w-full relative">
        {/* Left Sidebar (Desktop) */}
        <div className="hidden lg:block shrink-0">
          <LightSidebar user={user} />
        </div>

        {/* Left Sidebar Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative z-10 w-64 bg-white h-full shadow-2xl">
              <LightSidebar user={user} />
            </div>
          </div>
        )}

        {/* Center Main Dynamic Content */}
        <main className="flex-1 min-w-0 bg-[#f8fafc] flex flex-col">
          {children}
        </main>

        {/* Right Sidebar (Desktop only) */}
        {!hideRightProfile && (
          <div className="hidden xl:block shrink-0">
            <LightRightProfile user={user} />
          </div>
        )}
      </div>
    </div>
  );
}
