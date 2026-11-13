"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Loader2,
  Phone,
  Globe,
} from "lucide-react";

export default function ContactPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [websiteHoneypot, setWebsiteHoneypot] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!fullName || !email || !subject || !message) {
      setStatusMessage({
        type: "error",
        text: "Veuillez renseigner tous les champs obligatoires du formulaire.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          subject,
          message,
          website: websiteHoneypot,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMessage({
          type: "error",
          text: data.error || "Une erreur est survenue lors de l'envoi de votre message.",
        });
        setIsLoading(false);
        return;
      }

      setStatusMessage({
        type: "success",
        text:
          data.message ||
          "Votre message a bien été transmis à l'équipe Monsieur Fanyi. Nous vous répondrons sous 24 à 48 heures ouvrées.",
      });
      setFullName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setIsLoading(false);
    } catch {
      setStatusMessage({
        type: "error",
        text: "Impossible de joindre le serveur. Veuillez vérifier votre connexion ou nous écrire directement par email.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation retour */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-brand-navy transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à l&apos;accueil</span>
          </Link>
        </div>

        {/* Titre & Sous-titre */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[#b27219] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Écoute & Accompagnement Pédagogique</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-brand-navy tracking-tight">
            Contactez l&apos;Équipe Monsieur Fanyi
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Vous êtes parent, enseignant ou partenaire ? Notre équipe pédagogique et administrative basée à Conakry est à votre entière disposition.
          </p>
        </div>

        {/* Grille principale : Informations & Formulaire */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Colonne gauche : Coordonnées officielles */}
          <div className="lg:col-span-5 space-y-6">
            {/* Grille Coordonnées Directes Téléphone & Email */}
            <div className="space-y-4">
              {/* Carte Téléphone Officiel */}
              <div className="bg-gradient-to-br from-brand-navy to-[#0f2742] text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-brand-gold border border-white/15">
                    <Phone className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-400/25 px-2.5 py-1 rounded-full">
                    Ligne Directe
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                    Téléphone
                  </span>
                  <a
                    href="tel:+224612365314"
                    className="text-xl sm:text-2xl font-bold font-heading text-white hover:text-brand-gold transition-colors block tracking-tight"
                    title="Appeler Monsieur Fanyi au +224 612 365 314"
                  >
                    +224 612 365 314
                  </a>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-white/10">
                  Ligne officielle pour les familles, élèves et enseignants. Joignable du lundi au samedi de 08h00 à 19h00 (GMT).
                </p>
              </div>

              {/* Carte Email Professionnel */}
              <div className="bg-gradient-to-br from-brand-navy to-[#0f2742] text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-brand-gold border border-white/15">
                    <Mail className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="text-[11px] font-semibold text-amber-300 bg-amber-500/15 border border-amber-400/25 px-2.5 py-1 rounded-full">
                    Support Dédié
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                    E-mail
                  </span>
                  <a
                    href="mailto:contact@monsieurfanyi.com"
                    className="text-lg sm:text-xl font-bold font-heading text-white hover:text-brand-gold transition-colors break-all block"
                    title="Écrire à contact@monsieurfanyi.com"
                  >
                    contact@monsieurfanyi.com
                  </a>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-white/10">
                  Canal officiel pour toute demande d&apos;inscription assistée, vérification de dossier professeur, réclamation ou partenariat. Réponse sous 24h ouvrées.
                </p>
              </div>
            </div>

            {/* Carte Localisation, Permanence & Site Web */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-brand-navy flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Zone d&apos;Intervention Principale</span>
                  <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                    Grand Conakry (Kaloum, Dixinn, Matam, Ratoma, Matoto) et cours en ligne accessibles dans toute la République de Guinée.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pt-3 border-t border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Horaires de Permanence Pédagogique</span>
                  <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                    Lundi au Samedi : 08h00 – 19h00 (GMT)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pt-3 border-t border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Site Web Officiel</span>
                  <a
                    href="https://monsieurfanyi.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-brand-navy hover:text-[#e59a38] font-semibold leading-relaxed mt-0.5 block transition-colors"
                  >
                    https://monsieurfanyi.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pt-3 border-t border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Assistance Téléphonique Immédiate</span>
                  <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                    Nos conseillers pédagogiques sont joignables directement au{" "}
                    <a href="tel:+224612365314" className="font-bold text-brand-navy hover:text-[#e59a38] underline">
                      +224 612 365 314
                    </a>{" "}
                    pour vous guider dans le choix de votre enseignant.
                  </p>
                </div>
              </div>
            </div>

            {/* Rappel Juridique & Liens */}
            <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>Consultez nos engagements :</span>
              <div className="flex items-center gap-3 font-semibold text-brand-navy">
                <Link href="/cgu" className="hover:underline">CGU</Link>
                <span>•</span>
                <Link href="/charte" className="hover:underline">Charte Pédagogique</Link>
              </div>
            </div>
          </div>

          {/* Colonne droite : Formulaire de contact */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs">
            <h2 className="text-xl font-bold font-heading text-brand-navy mb-2">
              Envoyez-nous un Message
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Remplissez ce formulaire et notre équipe vous recontactera rapidement par courriel.
            </p>

            {statusMessage && (
              <div
                className={`p-4 rounded-2xl mb-6 text-xs flex items-start gap-3 ${
                  statusMessage.type === "success"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                    : "bg-rose-50 border border-rose-200 text-rose-900"
                }`}
              >
                {statusMessage.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{statusMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Honeypot field (hidden from genuine users) */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="contact-website">Ne pas remplir ce champ si vous êtes humain</label>
                <input
                  type="text"
                  id="contact-website"
                  name="website"
                  value={websiteHoneypot}
                  onChange={(e) => setWebsiteHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-fullname" className="block text-xs font-bold text-slate-700 mb-1">
                    Nom et Prénom <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="contact-fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Mamadou Barry"
                    disabled={isLoading}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e59a38] focus:border-transparent transition-all disabled:opacity-50"
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-xs font-bold text-slate-700 mb-1">
                    Adresse Email de Contact <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ex: m.barry@example.com"
                    disabled={isLoading}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e59a38] focus:border-transparent transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" className="block text-xs font-bold text-slate-700 mb-1">
                  Objet du Message <span className="text-rose-500">*</span>
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex: Demande de renseignement pour un élève de Terminale"
                  disabled={isLoading}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e59a38] focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-xs font-bold text-slate-700 mb-1">
                  Votre Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Expliquez en quelques lignes votre situation, vos besoins scolaires ou vos questions..."
                  disabled={isLoading}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e59a38] focus:border-transparent transition-all disabled:opacity-50 resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-[#e59a38] hover:bg-[#d68b29] text-white font-semibold text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transmission en cours...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Envoyer mon message</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

