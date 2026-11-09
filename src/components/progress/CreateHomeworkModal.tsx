"use client";

import React, { useState } from "react";
import { X, BookOpen, Calendar, Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface ClassroomOption {
  id: string;
  subjectName: string;
}

interface CreateHomeworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  classrooms: ClassroomOption[];
  onSuccess: () => void;
}

export function CreateHomeworkModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  classrooms,
  onSuccess,
}: CreateHomeworkModalProps) {
  const { t } = useTranslation();
  const [classroomId, setClassroomId] = useState(classrooms[0]?.id || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!classroomId) {
      setError("Veuillez sélectionner une matière / classe.");
      return;
    }
    if (!title.trim() || title.trim().length < 3) {
      setError("Le titre du devoir doit comporter au moins 3 caractères.");
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      setError("Les consignes doivent comporter au moins 5 caractères.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}/homework`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId,
          title: title.trim(),
          description: description.trim(),
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la création du devoir.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-homework-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 id="create-homework-title" className="text-lg font-bold text-slate-900">
                {t("progressBook.homework.newHomeworkBtn", "Assigner un devoir")}
              </h2>
              <p className="text-xs text-slate-500">Pour {studentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {classrooms.length > 1 ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Matière
              </label>
              <select
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              >
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.subjectName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Matière :</span>
              <span className="ml-2 text-sm font-medium text-slate-800">
                {classrooms[0]?.subjectName || "Général"}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Titre du devoir *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Exercices 4 et 5 page 42 - Théorème de Thalès"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Consignes et exercices à réaliser *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détaillez les notions à travailler, les étapes attendues ou les questions à traiter..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {t("progressBook.homework.dueDate", "Date limite de rendu")}
            </label>
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
              <Calendar className="pointer-events-none absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50 transition"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("progressBook.homework.newHomeworkBtn", "Assigner le devoir")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

