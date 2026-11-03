"use client";

import React from "react";
import { HeroSection } from "@/components/home/HeroSection";
import { InfiniteMarquee } from "@/components/home/InfiniteMarquee";
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
    <div className="w-full flex flex-col space-y-4 sm:space-y-10">
      {/* 01. Hero Section & Expérience Visuelle Complète (Maquette) */}
      <HeroSection />

      {/* 02. Bandeau défilant infini avec badges de confiance et examens guinéens */}
      <InfiniteMarquee />

      {/* 03. Comment ça marche en 4 étapes */}
      <HowItWorksSection />

      {/* 04. Matières & Niveaux scolaires guinéens */}
      <SubjectGrid />

      {/* 05. Showcase animé à plusieurs calques et témoignages */}
      <ParallaxShowcase />

      {/* 06. Récit d'apprentissage & Pédagogie personnalisée */}
      <LearningExperienceSection />

      {/* 07. Aperçu Dashboard Parent : Suivi en direct */}
      <ProgressPreview />

      {/* 08. Protocole de vérification des enseignants */}
      <TeacherVerificationSection />

      {/* 09. Simulateur financier & Transparence 15/85 */}
      <PricingExplainer />

      {/* 10. Espace Enseignants & Recrutement */}
      <BecomeTeacherSection />

      {/* 11. Questions Fréquentes interactives */}
      <FAQSection />

      {/* 12. Bannière finale d'action */}
      <FinalCTASection />
    </div>
  );
}
