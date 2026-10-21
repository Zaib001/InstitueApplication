"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { SectionContainer } from "./SectionContainer";
import { SectionHeading } from "./SectionHeading";
import { ChevronDown, HelpCircle } from "lucide-react";

export function FAQSection() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: t("faq.q1", "Comment les professeurs sont-ils vérifiés ?"),
      a: t(
        "faq.a1",
        "Chaque enseignant doit obligatoirement téléverser sa pièce d'identité officielle (CNI guinéenne ou Passeport) ainsi que ses diplômes universitaires certifiés. Notre équipe administrative examine manuellement chaque dossier avant d'autoriser le professeur à postuler."
      ),
    },
    {
      q: t("faq.q2", "Quels sont les moyens de paiement acceptés en Guinée ?"),
      a: t(
        "faq.a2",
        "La plateforme est conçue pour Orange Money Guinée et MTN Mobile Money. Les fonds sont versés à l'avance et restent conservés en sécurité sur la plateforme jusqu'à ce que la séance soit réalisée et approuvée par le parent."
      ),
    },
    {
      q: t("faq.q3", "Que se passe-t-il si un cours n'a pas lieu ?"),
      a: t(
        "faq.a3",
        "Si le professeur ne s'est pas présenté ou si le cours a été interrompu, le parent dispose d'un bouton de contestation immédiat. L'argent de la séance reste bloqué et n'est jamais transféré au professeur. L'administrateur arbitre et peut décider du report ou du remboursement."
      ),
    },
    {
      q: t("faq.q4", "Comment puis-je suivre ce que mon enfant apprend ?"),
      a: t(
        "faq.a4",
        "Après chaque séance, le professeur doit obligatoirement rédiger un compte-rendu structuré comprenant : les notions abordées, l'implication de l'élève, les devoirs à faire et ses observations. Vous y accédez directement depuis votre espace parent."
      ),
    },
    {
      q: t("faq.q5", "Les cours ont-ils lieu à domicile ou en ligne ?"),
      a: t(
        "faq.a5",
        "Vous avez le choix ! Lors de la création de votre demande, vous précisez votre quartier à Conakry pour des cours à domicile, ou l'option cours en ligne (via lien externe Google Meet/Zoom sécurisé)."
      ),
    },
    {
      q: t("faq.q6", "Quel est le délai moyen pour trouver un professeur ?"),
      a: t(
        "faq.a6",
        "Dès la publication de votre demande, les professeurs vérifiés et disponibles dans votre zone reçoivent une notification. La majorité des parents reçoivent leurs premières candidatures qualifiées en moins de 24 à 48 heures."
      ),
    },
  ];

  return (
    <SectionContainer id="faq" narrow className="bg-white">
      <SectionHeading
        badge={t("faq.badge", "Aide & Réponses")}
        badgeIcon={<HelpCircle className="w-3.5 h-3.5 text-brand-blue" />}
        title={t("faq.title", "Questions Fréquentes")}
        subtitle={t(
          "faq.subtitle",
          "Tout ce que vous devez savoir pour organiser sereinement le soutien scolaire de vos enfants."
        )}
      />

      <div className="space-y-3.5">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <motion.div
              key={index}
              initial={false}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? "bg-slate-50/80 border-[#16385c]/30 shadow-sm"
                  : "bg-white border-slate-200/80 hover:border-slate-300"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 focus:outline-none cursor-pointer"
                aria-expanded={isOpen}
              >
                <span className="font-bold text-sm sm:text-base text-brand-navy flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-blue-100/60 text-brand-blue text-xs flex items-center justify-center shrink-0">
                    Q
                  </span>
                  {faq.q}
                </span>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="shrink-0 text-brand-muted"
                >
                  <ChevronDown className="w-5 h-5" aria-hidden="true" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-brand-muted leading-relaxed pl-14 border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </SectionContainer>
  );
}
