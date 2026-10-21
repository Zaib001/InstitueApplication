"use client";

import React from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { TrustStrip } from "@/components/home/TrustStrip";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { SubjectGrid } from "@/components/home/SubjectGrid";
import { LearningExperienceSection } from "@/components/home/LearningExperienceSection";
import { ProgressPreview } from "@/components/home/ProgressPreview";
import { TeacherVerificationSection } from "@/components/home/TeacherVerificationSection";
import { PricingExplainer } from "@/components/home/PricingExplainer";
import { BecomeTeacherSection } from "@/components/home/BecomeTeacherSection";
import { FAQSection } from "@/components/home/FAQSection";
import { FinalCTASection } from "@/components/home/FinalCTASection";

export default function HomePage() {
  return (
    <div className="w-full flex flex-col space-y-4 sm:space-y-8">
      {/* 01. Hero Section à fort impact visuel */}
      <HeroSection />

      {/* 02. Bandeau de Réassurance & Avantages */}
      <TrustStrip />

      {/* 03. Comment ça marche en 4 étapes */}
      <HowItWorksSection />

      {/* 04. Matières & Niveaux scolaires guinéens */}
      <SubjectGrid />

      {/* 05. Récit d'apprentissage & Pédagogie personnalisée */}
      <LearningExperienceSection />

      {/* 06. Aperçu Dashboard Parent : Suivi en direct */}
      <ProgressPreview />

      {/* 07. Protocole de vérification des enseignants */}
      <TeacherVerificationSection />

      {/* 08. Simulateur financier & Transparence 15/85 */}
      <PricingExplainer />

      {/* 09. Espace Enseignants & Recrutement */}
      <BecomeTeacherSection />

      {/* 10. Questions Fréquentes interactives */}
      <FAQSection />

      {/* 11. Bannière finale d'action */}
      <FinalCTASection />
    </div>
  );
}
