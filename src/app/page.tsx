"use client";

import React from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { InfiniteMarquee } from "@/components/home/InfiniteMarquee";
import { TrustStrip } from "@/components/home/TrustStrip";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { SubjectGrid } from "@/components/home/SubjectGrid";
import { ParallaxShowcase } from "@/components/home/ParallaxShowcase";
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

      {/* 02. Bandeau défilant infini avec badges de confiance et examens guinéens */}
      <InfiniteMarquee />

      {/* 03. Bandeau de Réassurance & Avantages */}
      <TrustStrip />

      {/* 04. Comment ça marche en 4 étapes */}
      <HowItWorksSection />

      {/* 05. Matières & Niveaux scolaires guinéens */}
      <SubjectGrid />

      {/* 06. Showcase animé à plusieurs calques et témoignages */}
      <ParallaxShowcase />

      {/* 07. Récit d'apprentissage & Pédagogie personnalisée */}
      <LearningExperienceSection />

      {/* 08. Aperçu Dashboard Parent : Suivi en direct */}
      <ProgressPreview />

      {/* 09. Protocole de vérification des enseignants */}
      <TeacherVerificationSection />

      {/* 10. Simulateur financier & Transparence 15/85 */}
      <PricingExplainer />

      {/* 11. Espace Enseignants & Recrutement */}
      <BecomeTeacherSection />

      {/* 12. Questions Fréquentes interactives */}
      <FAQSection />

      {/* 13. Bannière finale d'action */}
      <FinalCTASection />
    </div>
  );
}
