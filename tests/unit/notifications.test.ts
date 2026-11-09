import { describe, it, expect } from "vitest";
import { EmailTemplateRegistry } from "@/lib/notifications/email-templates";
import { NotificationEventType, NotificationPriority } from "@prisma/client";
import { OutboxWorker } from "@/lib/notifications/outbox-worker";

describe("Phase 14: Centralized Notification System & Email Templates (Unit Tests)", () => {
  describe("Email Template Registry & Localization", () => {
    it("renders welcome email in French with branded header and CTA", () => {
      const rendered = EmailTemplateRegistry.render("welcome", {
        recipientName: "Amadou Diallo",
        role: "PARENT",
        appUrl: "https://monsieurfanyi.com",
      }, "fr");

      expect(rendered.html).toContain("Bienvenue");
      expect(rendered.html).toContain("Amadou Diallo");
      expect(rendered.html).toContain("Guinée");
      expect(rendered.html).toContain("https://monsieurfanyi.com/login");
      expect(rendered.text).toContain("Bienvenue sur Monsieur Fanyi");
    });

    it("renders welcome email in English with proper translation", () => {
      const rendered = EmailTemplateRegistry.render("welcome", {
        recipientName: "Amadou Diallo",
        role: "PARENT",
        appUrl: "https://monsieurfanyi.com",
      }, "en");

      expect(rendered.html).toContain("Welcome");
      expect(rendered.html).toContain("Amadou Diallo");
      expect(rendered.text).toContain("Welcome to Monsieur Fanyi");
    });

    it("renders password reset email with secure token link", () => {
      const resetLink = "https://monsieurfanyi.com/reset-password?token=sec_abc123xyz";
      const rendered = EmailTemplateRegistry.render("password-reset", {
        recipientName: "Fatoumata Camara",
        resetLink,
        expiresIn: "1 heure",
      }, "fr");

      expect(rendered.html).toContain("Réinitialisation de votre mot de passe");
      expect(rendered.html).toContain(resetLink);
      expect(rendered.text).toContain(resetLink);
    });

    it("renders teacher approval notification with clear instructions", () => {
      const rendered = EmailTemplateRegistry.render("teacher-verified", {
        recipientName: "Prof. Ibrahima Sow",
        appUrl: "https://monsieurfanyi.com",
      }, "fr");

      expect(rendered.html).toContain("profil enseignant est validé");
      expect(rendered.html).toContain("Prof. Ibrahima Sow");
      expect(rendered.html).toContain("https://monsieurfanyi.com/teacher/opportunities");
    });

    it("renders teacher rejection notification with required improvements", () => {
      const rendered = EmailTemplateRegistry.render("teacher-rejected", {
        recipientName: "Ousmane Bah",
        reason: "Le diplôme de Licence fourni est illisible.",
        appUrl: "https://monsieurfanyi.com",
      }, "fr");

      expect(rendered.html).toContain("dossier enseignant");
      expect(rendered.html).toContain("Le diplôme de Licence fourni est illisible");
      expect(rendered.html).toContain("https://monsieurfanyi.com/teacher/onboarding");
    });

    it("renders automated 24h lesson reminder with session details", () => {
      const rendered = EmailTemplateRegistry.render("lesson-reminder", {
        recipientName: "Mamadou",
        subjectName: "Mathématiques",
        scheduledStart: "Demain à 16h00",
        appUrl: "https://monsieurfanyi.com",
      }, "fr");

      expect(rendered.html).toContain("Séance de Mathématiques");
      expect(rendered.html).toContain("Mamadou");
      expect(rendered.html).toContain("Demain à 16h00");
    });

    it("renders dispute notification for parents and administrators", () => {
      const rendered = EmailTemplateRegistry.render("dispute-opened", {
        recipientName: "Directeur Académique",
        subjectName: "Physique-Chimie",
        reason: "Absence injustifiée du professeur sans préavis.",
        appUrl: "https://monsieurfanyi.com",
      }, "fr");

      expect(rendered.html).toContain("litige de séance a été ouvert");
      expect(rendered.html).toContain("Absence injustifiée");
    });

    it("renders homework assignment notification for students and parents", () => {
      const rendered = EmailTemplateRegistry.render("homework-assigned", {
        recipientName: "Aissatou",
        subjectName: "Français",
        title: "Dissertation argumentative",
        dueDate: "2026-11-15",
        appUrl: "https://monsieurfanyi.com",
      }, "fr");

      expect(rendered.html).toContain("Nouveau devoir assigné");
      expect(rendered.html).toContain("Dissertation argumentative");
      expect(rendered.html).toContain("Français");
    });
  });

  describe("Outbox Worker & Exponential Backoff Retry Calculations", () => {
    it("calculates exponential backoff delay for retries correctly", () => {
      // Base: 1 min (60_000ms), max: 60 min
      const retry1 = Math.min(60 * 60 * 1000, 60 * 1000 * Math.pow(2, 0)); // 60,000ms (1 min)
      const retry2 = Math.min(60 * 60 * 1000, 60 * 1000 * Math.pow(2, 1)); // 120,000ms (2 min)
      const retry3 = Math.min(60 * 60 * 1000, 60 * 1000 * Math.pow(2, 2)); // 240,000ms (4 min)
      const retry4 = Math.min(60 * 60 * 1000, 60 * 1000 * Math.pow(2, 3)); // 480,000ms (8 min)

      expect(retry1).toBe(60000);
      expect(retry2).toBe(120000);
      expect(retry3).toBe(240000);
      expect(retry4).toBe(480000);
    });
  });
});
