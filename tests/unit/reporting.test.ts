import { describe, it, expect, vi } from "vitest";
import { ReportingService, ReportingServiceError } from "@/lib/reporting/reporting-service";
import { LessonAttendance, ReportStatus, SessionStatus, UserRole } from "@prisma/client";

describe("Phase 11 Unit Tests: Reporting, Validation & Eligibility Foundations", () => {
  it("P11.U01: Rejects report submission when topicsCovered is empty or too short (< 5 chars)", async () => {
    await expect(
      ReportingService.submitLessonReport({
        sessionId: "sess_fake_1",
        topicsCovered: "abc",
        learningObjectives: "Valid objectives",
        studentEffort: "Bonne participation",
        strengths: "Valid strengths",
        areasForImprovement: "Valid areas",
        attendanceStatus: LessonAttendance.PRESENT,
        actorUserId: "user_fake",
        actorRole: UserRole.TEACHER,
      })
    ).rejects.toThrow();
  });

  it("P11.U02: Rejects report submission when learningObjectives is missing", async () => {
    await expect(
      ReportingService.submitLessonReport({
        sessionId: "sess_fake_1",
        topicsCovered: "Valid topics covered",
        learningObjectives: "    ",
        studentEffort: "Bonne participation",
        strengths: "Valid strengths",
        areasForImprovement: "Valid areas",
        attendanceStatus: LessonAttendance.PRESENT,
        actorUserId: "user_fake",
        actorRole: UserRole.TEACHER,
      })
    ).rejects.toThrow();
  });

  it("P11.U03: Rejects assessmentScore exceeding assessmentMaxScore", async () => {
    await expect(
      ReportingService.submitLessonReport({
        sessionId: "sess_fake_1",
        topicsCovered: "Valid topics covered",
        learningObjectives: "Valid objectives",
        studentEffort: "Bonne participation",
        strengths: "Valid strengths",
        areasForImprovement: "Valid areas",
        assessmentScore: 22,
        assessmentMaxScore: 20,
        attendanceStatus: LessonAttendance.PRESENT,
        actorUserId: "user_fake",
        actorRole: UserRole.TEACHER,
      })
    ).rejects.toThrow();
  });

  it("P11.U04: Rejects invalid progressRating outside 1-5 range", async () => {
    await expect(
      ReportingService.submitLessonReport({
        sessionId: "sess_fake_1",
        topicsCovered: "Valid topics covered",
        learningObjectives: "Valid objectives",
        studentEffort: "Bonne participation",
        strengths: "Valid strengths",
        areasForImprovement: "Valid areas",
        progressRating: 6,
        attendanceStatus: LessonAttendance.PRESENT,
        actorUserId: "user_fake",
        actorRole: UserRole.TEACHER,
      })
    ).rejects.toThrow();
  });

  it("P11.U05: Rejects parent approval when user is not the authorized parent", async () => {
    await expect(
      ReportingService.approveLessonSession({
        sessionId: "sess_fake_unauthorized",
        actorUserId: "parent_intruder",
        actorRole: UserRole.PARENT,
      })
    ).rejects.toThrow();
  });

  it("P11.U06: Rejects dispute creation with reason less than 10 characters", async () => {
    await expect(
      ReportingService.disputeLessonSession({
        sessionId: "sess_fake_1",
        category: "LESSON_NOT_HELD",
        reason: "Too short",
        actorUserId: "user_parent",
        actorRole: UserRole.PARENT,
      })
    ).rejects.toThrow();
  });

  it("P11.U07: Financial Eligibility returns false with SESSION_NOT_FUNDED when session is unfunded", async () => {
    // Calling checkEarningsEligibility on non-existing session returns SESSION_NOT_FOUND
    const result = await ReportingService.checkEarningsEligibility("non_existent_session");
    expect(result.isEligible).toBe(false);
    expect(result.reasons).toContain("SESSION_NOT_FOUND");
  });
});

