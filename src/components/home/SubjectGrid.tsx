"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { SectionContainer } from "./SectionContainer";
import { SectionHeading } from "./SectionHeading";
import {
  Calculator,
  Atom,
  BookOpen,
  Languages,
  Dna,
  Compass,
  Lightbulb,
  Coins,
  ArrowRight,
  GraduationCap,
} from "lucide-react";

export function SubjectGrid() {
  const { t } = useTranslation();
  const [selectedCycle, setSelectedCycle] = useState<"ALL" | "PRIMAIRE" | "COLLEGE" | "LYCEE">("ALL");

  const cycles = [
    { id: "ALL", label: t("subjects.allCycles", "Tous les Niveaux") },
    { id: "PRIMAIRE", label: t("subjects.primary", "Primaire (1ère à 6ème Année)") },
    { id: "COLLEGE", label: t("subjects.middle", "Collège (7ème au BEPC)") },
    { id: "LYCEE", label: t("subjects.high", "Lycée (11ème au Baccalauréat)") },
  ];

  const subjects = [
    {
      id: "maths",
      name: t("subjects.maths", "Mathématiques"),
      desc: t("subjects.mathsDesc", "Algèbre, géométrie, analyse et préparation aux examens."),
      icon: <Calculator className="w-6 h-6 text-brand-blue" aria-hidden="true" />,
      colorBg: "bg-blue-50/70 border-blue-100",
      cycles: ["PRIMAIRE", "COLLEGE", "LYCEE"],
      popular: true,
    },
    {
      id: "physique",
      name: t("subjects.physics", "Physique & Chimie"),
      desc: t("subjects.physicsDesc", "Mécanique, électricité, optique et chimie organique."),
      icon: <Atom className="w-6 h-6 text-brand-teal" aria-hidden="true" />,
      colorBg: "bg-teal-50/70 border-teal-100",
      cycles: ["COLLEGE", "LYCEE"],
      popular: true,
    },
    {
      id: "francais",
      name: t("subjects.french", "Français & Littérature"),
      desc: t("subjects.frenchDesc", "Orthographe, grammaire, compréhension et dissertation."),
      icon: <BookOpen className="w-6 h-6 text-amber-600" aria-hidden="true" />,
      colorBg: "bg-amber-50/70 border-amber-100",
      cycles: ["PRIMAIRE", "COLLEGE", "LYCEE"],
      popular: false,
    },
    {
      id: "anglais",
      name: t("subjects.english", "Anglais"),
      desc: t("subjects.englishDesc", "Expression orale, vocabulaire, grammaire et renforcement."),
      icon: <Languages className="w-6 h-6 text-indigo-600" aria-hidden="true" />,
      colorBg: "bg-indigo-50/70 border-indigo-100",
      cycles: ["COLLEGE", "LYCEE"],
      popular: false,
    },
    {
      id: "svt",
      name: t("subjects.svt", "Sciences / Biologie (SVT)"),
      desc: t("subjects.svtDesc", "Sciences naturelles, biologie cellulaire et géologie."),
      icon: <Dna className="w-6 h-6 text-emerald-600" aria-hidden="true" />,
      colorBg: "bg-emerald-50/70 border-emerald-100",
      cycles: ["PRIMAIRE", "COLLEGE", "LYCEE"],
      popular: false,
    },
    {
      id: "histoire",
      name: t("subjects.history", "Histoire & Géographie"),
      desc: t("subjects.historyDesc", "Programme national guinéen, cartographie et méthodologie."),
      icon: <Compass className="w-6 h-6 text-rose-600" aria-hidden="true" />,
      colorBg: "bg-rose-50/70 border-rose-100",
      cycles: ["COLLEGE", "LYCEE"],
      popular: false,
    },
    {
      id: "philo",
      name: t("subjects.philo", "Philosophie"),
      desc: t("subjects.philoDesc", "Dissertation philosophique, analyse de texte pour terminales."),
      icon: <Lightbulb className="w-6 h-6 text-yellow-600" aria-hidden="true" />,
      colorBg: "bg-yellow-50/70 border-yellow-100",
      cycles: ["LYCEE"],
      popular: false,
    },
    {
      id: "eco",
      name: t("subjects.eco", "Économie & Comptabilité"),
      desc: t("subjects.ecoDesc", "Comptabilité générale, mathématiques financières et gestion."),
      icon: <Coins className="w-6 h-6 text-sky-600" aria-hidden="true" />,
      colorBg: "bg-sky-50/70 border-sky-100",
      cycles: ["LYCEE"],
      popular: false,
    },
  ];

  const filteredSubjects =
    selectedCycle === "ALL"
      ? subjects
      : subjects.filter((s) => s.cycles.includes(selectedCycle));

  return (
    <SectionContainer id="professeurs" className="bg-white">
      <SectionHeading
        badge={t("subjects.badge", "Programme National Guinéen")}
        badgeIcon={<GraduationCap className="w-3.5 h-3.5 text-brand-blue" />}
        title={t("subjects.title", "Toutes les matières du Primaire à la Terminale")}
        subtitle={t(
          "subjects.subtitle",
          "Des enseignants spécialisés par matière et par niveau d'examen (Entrée en 7ème, BEPC, Baccalauréat Unique)."
        )}
      />

      {/* Onglets de filtrage par cycle avec transition spring */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
        {cycles.map((cycle) => (
          <button
            key={cycle.id}
            onClick={() => setSelectedCycle(cycle.id as any)}
            className={`relative px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200 cursor-pointer ${
              selectedCycle === cycle.id
                ? "text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            {selectedCycle === cycle.id && (
              <motion.div
                layoutId="activeCyclePill"
                className="absolute inset-0 rounded-full bg-brand-navy shadow-xs -z-10"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            {cycle.label}
          </button>
        ))}
      </div>

      {/* Grille des matières animée */}
      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence>
          {filteredSubjects.map((item) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className={`p-6 rounded-3xl border ${item.colorBg} shadow-premium hover:shadow-premium-hover transition-shadow duration-300 flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-xs flex items-center justify-center">
                    {item.icon}
                  </div>
                  {item.popular && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-blue text-white">
                      {t("subjects.popularBadge", "Très demandé")}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold font-heading text-brand-navy mb-1.5">
                  {item.name}
                </h3>
                <p className="text-xs text-brand-muted leading-relaxed mb-4">
                  {item.desc}
                </p>
              </div>

              <Link
                href={`/register?role=parent&subject=${item.id}`}
                className="inline-flex items-center text-xs font-bold text-brand-blue hover:text-brand-navy transition-colors pt-2 border-t border-slate-200/50 group"
              >
                <span>{t("subjects.findTutorFor", "Trouver un professeur")}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </SectionContainer>
  );
}
