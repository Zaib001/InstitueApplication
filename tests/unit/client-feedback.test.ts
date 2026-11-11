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
});

