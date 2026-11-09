import { describe, it, expect } from "vitest";
import { ProgressService, ProgressServiceError } from "@/lib/progress/progress-service";
import { HomeworkStatus, AssessmentType, UserRole } from "@prisma/client";

describe("Phase 12 Unit Tests: Digital Student Progress Book Foundations", () => {
  it("P12.U01: Rejects assessment creation when title is too short (< 3 chars)", async () => {
    await expect(
      ProgressService.createAssessment({
        studentId: "s1",
        classroomId: "c1",
        title: "ab",
        assessmentType: AssessmentType.TOPIC_TEST,
        obtainedScore: 15,
        maxScore: 20,
        actorUserId: "u1",
        actorRole: UserRole.TEACHER,
      })
    ).rejects.toThrow("Le titre de l'évaluation doit comporter au moins 3 caractères.");
  });

  it("P12.U02: Rejects assessment creation when maxScore <= 0", async () => {
    await expect(
      ProgressService.createAssessment({
        studentId: "s1",
        classroomId: "c1",
        title: "Contrôle de fractions",
        assessmentType: AssessmentType.TOPIC_TEST,
        obtainedScore: 10,
        maxScore: 0,
        actorUserId: "u1",
        actorRole: UserRole.TEACHER,
      })
    ).rejects.toThrow("La note maximale doit être strictement supérieure à zéro.");
  });

  it("P12.U03: Rejects assessment creation when obtainedScore is negative", async () => {
    await expect(
      ProgressService.createAssessment({
        studentId: "s1",
        classroomId: "c1",
        title: "Contrôle de fractions",
        assessmentType: AssessmentType.TOPIC_TEST,
        obtainedScore: -2,
        maxScore: 20,
        actorUserId: "u1",
        actorRole: UserRole.TEACHER,
      })
    ).rejects.toThrow("La note obtenue ne peut pas être négative.");
  });

  it("P12.U04: Rejects assessment creation when obtainedScore > maxScore", async () => {
    await expect(
      ProgressService.createAssessment({
        studentId: "s1",
        classroomId: "c1",
        title: "Contrôle de fractions",
        assessmentType: AssessmentType.TOPIC_TEST,
        obtainedScore: 21,
        maxScore: 20,
        actorUserId: "u1",
        actorRole: UserRole.TEACHER,
      })
    ).rejects.toThrow("La note obtenue (21) ne peut pas dépasser la note maximale (20).");
  });

  it("P12.U05: Rejects homework assignment when title is too short (< 3 chars)", async () => {
    await expect(
      ProgressService.createHomework({
        studentId: "s1",
        classroomId: "c1",
        title: "no",
        description: "Exercices page 25",
        actorUserId: "u1",
        actorRole: UserRole.TEACHER,
      })
    ).rejects.toThrow("Le titre du devoir doit comporter au moins 3 caractères.");
  });

  it("P12.U06: Rejects homework assignment when description is too short (< 5 chars)", async () => {
    await expect(
      ProgressService.createHomework({
        studentId: "s1",
        classroomId: "c1",
        title: "Devoir de maths",
        description: "abc",
        actorUserId: "u1",
        actorRole: UserRole.TEACHER,
      })
    ).rejects.toThrow("Les consignes du devoir doivent comporter au moins 5 caractères.");
  });

  it("P12.U07: Rejects qualitative observation when progressRating is outside 1-5 range", async () => {
    await expect(
      ProgressService.createObservation({
        studentId: "s1",
        classroomId: "c1",
        topicsMastered: "Notions de base",
        progressRating: 6,
        actorUserId: "u1",
        actorRole: UserRole.TEACHER,
      })
    ).rejects.toThrow("L'évaluation globale doit être comprise entre 1 et 5 étoiles.");
  });

  it("P12.U08: Rejects qualitative observation when progressRating is 0 or negative", async () => {
    await expect(
      ProgressService.createObservation({
        studentId: "s1",
        classroomId: "c1",
        topicsMastered: "Notions de base",
        progressRating: 0,
        actorUserId: "u1",
        actorRole: UserRole.TEACHER,
      })
    ).rejects.toThrow("L'évaluation globale doit être comprise entre 1 et 5 étoiles.");
  });
});

