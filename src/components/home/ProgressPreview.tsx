"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n";
import { SectionContainer } from "./SectionContainer";
import { SectionHeading } from "./SectionHeading";
import {
  TrendingUp,
  CheckCircle2,
  Clock,
  Award,
  BookOpen,
  Calendar,
  MessageSquare,
  Sparkles,
  UserCheck,
} from "lucide-react";

export function ProgressPreview() {
  const { t } = useTranslation();

  return (
    <SectionContainer className="bg-white">
      <SectionHeading
        badge={t("progress.badge", "Suivi en Temps Réel")}
        badgeIcon={<TrendingUp className="w-3.5 h-3.5 text-brand-blue" />}
        title={t("progress.title", "Le tableau de bord parent : Suivez chaque progrès")}
        subtitle={t(
          "progress.subtitle",
          "Fini le doute sur ce qui a été fait. Après chaque cours, accédez aux comptes-rendus, aux devoirs et à l'évolution des notes de votre enfant."
        )}
      />

      {/* Maquette du Dashboard Parent (Inspirée de la référence Ed.Tech Dashboard) */}
      <div className="relative rounded-3xl bg-slate-900/95 text-white p-6 sm:p-8 lg:p-10 shadow-2xl border border-slate-800 overflow-hidden">
        
        {/* En-tête de la maquette */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-blue flex items-center justify-center text-white font-black text-lg">
              F
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Espace Parent — Ibrahima Barry</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                  Actif
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Élève : Mamadou Barry • Terminale Sciences Mathématiques • Conakry
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 italic bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
            {t("progress.sampleLabel", "Aperçu démonstratif de l'interface parent")}
          </div>
        </div>

        {/* 3 Cartes de Statistiques en Haut */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6">
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Séances planifiées</div>
              <div className="text-lg font-bold text-white">4 Séances en cours</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Séances effectuées & validées</div>
              <div className="text-lg font-bold text-white">18 Cours achevés</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-brand-gold flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="text-xs text-slate-400">Moyenne générale estimée</div>
              <div className="text-lg font-bold text-brand-gold">15.5 / 20 (+3 pts)</div>
            </div>
          </div>
        </div>

        {/* Corps du Dashboard : Graphique & Détails */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          
          {/* Bloc Gauche : Graphique d'Assiduité et Progression */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Assiduité & Rythme d'Apprentissage</h4>
                <p className="text-xs text-slate-400">Heures de soutien suivies sur les 30 derniers jours</p>
              </div>
              <span className="text-xs text-brand-teal font-semibold">100% Présence</span>
            </div>

            {/* Représentation graphique SVG soignée inspirée de la référence */}
            <div className="relative h-36 w-full pt-4">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Lignes de repère */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="0" y1="70" x2="500" y2="70" stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="0" y1="110" x2="500" y2="110" stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />

                {/* Surface sous la courbe */}
                <path
                  d="M0,90 Q70,40 140,70 T280,30 T420,50 T500,20 L500,120 L0,120 Z"
                  fill="url(#chartGradient)"
                />
                {/* Courbe principale */}
                <path
                  d="M0,90 Q70,40 140,70 T280,30 T420,50 T500,20"
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                {/* Point culminant */}
                <circle cx="280" cy="30" r="5" fill="#E9B44C" stroke="#10233F" strokeWidth="2" />
              </svg>
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-700/50">
              <span>Semaine 1</span>
              <span>Semaine 2</span>
              <span>Semaine 3 (Bac Blanc)</span>
              <span>Semaine 4</span>
            </div>
          </div>

          {/* Bloc Droit : Compte-Rendu du Dernier Cours */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-brand-teal" />
                Dernier Rapport Enseignant
              </span>
              <span className="text-[10px] text-slate-400">Hier à 18h15</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/50 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-300 font-semibold">
                <span>M. Camara (Professeur de Mathématiques)</span>
                <span className="text-brand-gold">5/5 ★</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                « Très bon investissement d'Ibrahima sur la résolution des équations différentielles. Exercices d'application du Bac réussis sans aide. Trois devoirs maison assignés pour jeudi. »
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                <span>Notion : Analyse & Intégrales</span>
                <span className="text-emerald-400 font-medium">Validé par le parent</span>
              </div>
            </div>

            {/* Progression par matières */}
            <div className="space-y-2 pt-1 text-xs">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Mathématiques</span>
                  <span className="text-blue-400 font-bold">82%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div className="bg-brand-blue h-full rounded-full w-[82%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">Physique-Chimie</span>
                  <span className="text-teal-400 font-bold">74%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div className="bg-brand-teal h-full rounded-full w-[74%]" />
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </SectionContainer>
  );
}
