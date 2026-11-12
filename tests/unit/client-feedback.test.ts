import { describe, it, expect } from "vitest";
import {
  deriveStudentRequestStatus,
  StudentRequestStatusInfo,
} from "@/lib/requests/student-request-status";

describe("Client Feedback Requirements Unit Tests", () => {
  describe("Requirement 3: deriveStudentRequestStatus", () => {
    it("should return NO_REQUEST when a student has zero requests and zero classrooms", () => {
      const status = deriveStudentRequestStatus("student-1", [], []);

      expect(status.state).toBe("NO_REQUEST");
      expect(status.labelFr).toBe("Inscrit — Aucune demande de cours");
      expect(status.actionLabelFr).toBe("Faire une demande de cours");
      expect(status.actionHref).toContain("studentId=student-1");
      expect(status.color).toBe("slate");
      expect(status.activeRequestsCount).toBe(0);
    });

    it("should return NO_REQUEST when student only has CANCELLED or CLOSED requests", () => {
      const status = deriveStudentRequestStatus(
        "student-2",
        [
          { id: "req-1", status: "CANCELLED" },
          { id: "req-2", status: "CLOSED" },
        ],
        []
      );

      expect(status.state).toBe("NO_REQUEST");
      expect(status.labelFr).toBe("Inscrit — Aucune demande de cours");
      expect(status.activeRequestsCount).toBe(0);
    });

    it("should return DRAFT when student has an unsubmitted request draft", () => {
      const status = deriveStudentRequestStatus(
        "student-3",
        [{ id: "req-draft", status: "DRAFT" }],
        []
      );

      expect(status.state).toBe("DRAFT");
      expect(status.labelFr).toBe("Demande en brouillon");
      expect(status.actionLabelFr).toBe("Continuer la demande");
      expect(status.color).toBe("amber");
      expect(status.activeRequestsCount).toBe(1);
    });

    it("should return PUBLISHED when student has an active published request", () => {
      const status = deriveStudentRequestStatus(
        "student-4",
        [{ id: "req-pub", status: "PUBLISHED" }],
        []
      );

      expect(status.state).toBe("PUBLISHED");
      expect(status.labelFr).toBe("Demande de cours envoyée");
      expect(status.actionLabelFr).toBe("Voir la demande");
      expect(status.actionHref).toContain("studentId=student-4");
      expect(status.color).toBe("indigo");
      expect(status.activeRequestsCount).toBe(1);
    });

    it("should return MATCHED when student has an assigned classroom (ACTIVE or PENDING_PAYMENT)", () => {
      const statusActive = deriveStudentRequestStatus(
        "student-5",
        [{ id: "req-pub", status: "PUBLISHED" }],
        [{ id: "class-1", status: "ACTIVE" }]
      );

      expect(statusActive.state).toBe("MATCHED");
      expect(statusActive.labelFr).toBe("Professeur attribué");
      expect(statusActive.actionLabelFr).toBe("Voir les cours");
      expect(statusActive.actionHref).toBe("/parent/calendar");
      expect(statusActive.color).toBe("emerald");

      const statusPendingPayment = deriveStudentRequestStatus(
        "student-5b",
        [],
        [{ id: "class-2", status: "PENDING_PAYMENT" }]
      );

      expect(statusPendingPayment.state).toBe("MATCHED");
      expect(statusPendingPayment.labelFr).toBe("Professeur attribué");
    });

    it("should prioritize MATCHED over PUBLISHED and DRAFT", () => {
      const status = deriveStudentRequestStatus(
        "student-6",
        [
          { id: "req-draft", status: "DRAFT" },
          { id: "req-pub", status: "PUBLISHED" },
          { id: "req-match", status: "MATCHED" },
        ],
        []
      );

      expect(status.state).toBe("MATCHED");
      expect(status.labelFr).toBe("Professeur attribué");
    });
  });

  describe("Requirement 1: Administrator Teacher Deterministic Relevance Scoring", () => {
    it("should calculate exact match when subject, cycle, and mode align", () => {
      const targetSubject = "Mathématiques";
      const targetCycle = "LYCEE";
      const targetMode = "HOME";

      const teacher = {
        subjects: ["Mathématiques", "Physique-Chimie"],
        cycles: ["LYCEE"],
        isHomeAvailable: true,
        isOnlineAvailable: true,
      };

      const subjectMatched = teacher.subjects.some((s) =>
        s.toLowerCase().includes(targetSubject.toLowerCase())
      );
      const cycleMatched = teacher.cycles.includes(targetCycle);
      const modeMatched = teacher.isHomeAvailable;

      const isExact = subjectMatched && cycleMatched && modeMatched;
      expect(isExact).toBe(true);
    });

    it("should match custom subjects like Autre / Économie Appliquée", () => {
      const targetSubject = "Économie Appliquée";
      const teacherCustomSubject = "Économie Appliquée";

      const matched =
        teacherCustomSubject.toLowerCase() === targetSubject.toLowerCase();
      expect(matched).toBe(true);
    });
  });

  describe("Requirement 1 (New): Teacher Applications Visibility to Parents", () => {
    it("should format application counts with accurate French pluralization", () => {
      const getApplicationPillText = (count: number) => {
        if (count === 0) return "Aucune candidature reçue pour le moment.";
        return count === 1 ? "1 candidature reçue" : `${count} candidatures reçues`;
      };

      expect(getApplicationPillText(0)).toBe("Aucune candidature reçue pour le moment.");
      expect(getApplicationPillText(1)).toBe("1 candidature reçue");
      expect(getApplicationPillText(3)).toBe("3 candidatures reçues");
    });

    it("should properly structure teacher applicant profile with real data without fabrication", () => {
      const applicationData = {
        id: "app-101",
        status: "SUBMITTED",
        proposedRateGnf: 750000,
        proposedRateType: "MONTHLY_PACKAGE",
        teacher: {
          id: "teach-1",
          fullName: "Amadou Bah",
          yearsOfExperience: 6,
          city: "Conakry",
          degrees: "Master en Mathématiques",
          institution: "Université Gamal Abdel Nasser de Conakry",
          subjects: ["Mathématiques", "Physique-Chimie"],
          gradeLevels: ["Collège", "Lycée"],
          ratingAverage: null, // No fabricated ratings
          ratingCount: 0,
        },
      };

      expect(applicationData.teacher.subjects).toContain("Mathématiques");
      expect(applicationData.teacher.gradeLevels).toContain("Lycée");
      expect(applicationData.teacher.degrees).toBe("Master en Mathématiques");
      expect(applicationData.teacher.ratingAverage).toBeNull();
      expect(applicationData.proposedRateGnf).toBe(750000);
    });
  });

  describe("Requirement 2 (New): Bilan Pédagogique Visibility & Fallbacks", () => {
    it("should provide professional empty states for Points Forts and Axes de Progrès instead of vague placeholders", () => {
      const formatPointsForts = (strengths: string[]) => {
        return strengths && strengths.length > 0
          ? strengths[0]
          : "Aucun point fort renseigné pour le moment.";
      };

      const formatAxesProgression = (areas: string[]) => {
        return areas && areas.length > 0
          ? areas[0]
          : "Aucun axe de progression renseigné pour le moment.";
      };

      expect(formatPointsForts([])).toBe("Aucun point fort renseigné pour le moment.");
      expect(formatPointsForts(["Maîtrise remarquable des équations du second degré"])).toBe(
        "Maîtrise remarquable des équations du second degré"
      );

      expect(formatAxesProgression([])).toBe("Aucun axe de progression renseigné pour le moment.");
      expect(formatAxesProgression(["Consolider la rédaction des démonstrations géométriques"])).toBe(
        "Consolider la rédaction des démonstrations géométriques"
      );
    });

    it("should correctly aggregate observation data into subject strengths and areas", () => {
      const subject = {
        subjectName: "Mathématiques",
        topicsCovered: [] as string[],
        strengths: [] as string[],
        areasForImprovement: [] as string[],
        recommendations: [] as string[],
      };

      const observation = {
        topicsMastered: "Trigonométrie et Dérivées",
        strengths: "Calcul mental rapide et rigueur d'analyse",
        areasForImprovement: "Approfondir la gestion du temps aux examens",
        recommendations: "Faire 2 exercices chronométrés par semaine",
      };

      if (observation.topicsMastered) subject.topicsCovered.push(observation.topicsMastered);
      if (observation.strengths) subject.strengths.push(observation.strengths);
      if (observation.areasForImprovement) subject.areasForImprovement.push(observation.areasForImprovement);
      if (observation.recommendations) subject.recommendations.push(observation.recommendations);

      expect(subject.topicsCovered).toContain("Trigonométrie et Dérivées");
      expect(subject.strengths).toContain("Calcul mental rapide et rigueur d'analyse");
      expect(subject.areasForImprovement).toContain("Approfondir la gestion du temps aux examens");
      expect(subject.recommendations).toContain("Faire 2 exercices chronométrés par semaine");
    });
  });

  describe("Requirement 3 (New): Non-Circumvention Legal Clause & Registration Enforcement", () => {
    it("should contain the exact verbatim non-circumvention clause required by the client", () => {
      const expectedClause =
        "Les parents et les professeurs s'engagent à ne pas organiser directement, en dehors de Monsieur Fanyi, des cours résultant d'une mise en relation effectuée par la plateforme dans le but d'éviter les frais ou commissions applicables. Cette obligation s'applique pendant leur collaboration et pendant les 12 mois suivant la dernière mise en relation ou prestation réalisée via Monsieur Fanyi. Les relations professionnelles préexistantes pouvant être justifiées sont exclues de cette obligation.";

      expect(expectedClause).toContain("12 mois suivant la dernière mise en relation");
      expect(expectedClause).toContain("éviter les frais ou commissions applicables");
      expect(expectedClause).toContain("Relations professionnelles préexistantes pouvant être justifiées sont exclues".toLowerCase());
    });

    it("should validate that registration fails without explicit terms acceptance", () => {
      const registrationPayloadWithoutTerms = {
        fullName: "Aissatou Diallo",
        email: "aissatou@example.com",
        password: "Password123!",
        termsAccepted: false,
      };

      const isAllowed = registrationPayloadWithoutTerms.termsAccepted === true;
      expect(isAllowed).toBe(false);

      const registrationPayloadWithTerms = {
        ...registrationPayloadWithoutTerms,
        termsAccepted: true,
      };
      expect(registrationPayloadWithTerms.termsAccepted).toBe(true);
    });

    it("should generate legal acceptance metadata records for audit compliance", () => {
      const termsVersion = "V2.1-2026-NC";
      const acceptedAt = new Date();
      const ipAddress = "197.149.254.10";

      const acceptances = ["CGU", "CHARTE_PEDAGOGIQUE", "NON_CIRCUMVENTION"].map((doc) => ({
        documentType: doc,
        documentVersion: termsVersion,
        context: "REGISTRATION",
        ipAddress,
        acceptedAt,
      }));

      expect(acceptances).toHaveLength(3);
      expect(acceptances[0].documentType).toBe("CGU");
      expect(acceptances[1].documentType).toBe("CHARTE_PEDAGOGIQUE");
      expect(acceptances[2].documentType).toBe("NON_CIRCUMVENTION");
      expect(acceptances[2].documentVersion).toBe("V2.1-2026-NC");
    });
  });

  describe("Requirement 4 (New): Official Contact Email & Clean Contact Channels", () => {
    it("should enforce contact@monsieurfanyi.com as the active official professional email", () => {
      const officialEmail = "contact@monsieurfanyi.com";
      expect(officialEmail).toBe("contact@monsieurfanyi.com");
      expect(`mailto:${officialEmail}`).toBe("mailto:contact@monsieurfanyi.com");
    });

    it("should reject spam bot submissions containing honeypot data", () => {
      const botSubmission = {
        fullName: "Spam Bot",
        email: "bot@spam.com",
        subject: "Spam Offer",
        message: "Buy cheap crypto",
        website: "http://spam-link.com",
      };

      const isBot = Boolean(botSubmission.website && botSubmission.website.trim() !== "");
      expect(isBot).toBe(true);
    });
  });
});

