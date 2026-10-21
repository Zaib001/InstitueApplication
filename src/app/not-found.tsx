import React from "react";
import Link from "next/link";
import { GraduationCap, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md mx-auto space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-brand-navy flex items-center justify-center text-white mx-auto shadow-lg">
          <GraduationCap className="w-8 h-8 text-[#e59a38]" />
        </div>
        <div className="space-y-2">
          <span className="text-4xl sm:text-5xl font-black font-heading text-brand-blue block">
            404
          </span>
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-brand-navy">
            Page Introuvable / Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#e59a38] hover:bg-[#d68b29] text-white font-semibold text-xs transition-colors shadow-md"
          >
            <Home className="w-4 h-4" />
            <span>Retour à l'accueil / Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
