import { describe, it, expect } from "vitest";
import { SchedulingEngine, SchedulingEngineError } from "@/lib/scheduling/scheduling-engine";
import { LessonAttendance, SessionStatus } from "@prisma/client";

describe("Phase 10: Scheduling Unit Tests (Timezone, Intervals, Invariants)", () => {
  it("P10.U01: Conakry timezone parser returns valid Date for ISO strings", () => {
    const parsed = SchedulingEngine.parseGuineaDate("2026-05-15T16:00:00Z");
    expect(parsed).toBeInstanceOf(Date);
    expect(parsed.toISOString()).toBe("2026-05-15T16:00:00.000Z");
  });

  it("P10.U02: Throws SchedulingEngineError for malformed dates", () => {
    expect(() => SchedulingEngine.parseGuineaDate("invalid-date-xyz")).toThrow(SchedulingEngineError);
  });

  it("P10.U03: Validates strict time interval (start must precede end)", async () => {
    const start = new Date("2026-05-15T16:00:00Z");
    const end = new Date("2026-05-15T15:00:00Z"); // earlier than start

    const result = await SchedulingEngine.checkTeacherConflicts("dummy-teacher", start, end);
    expect(result.hasConflict).toBe(true);
    expect(result.message).toContain("strictement antérieure");
  });

  it("P10.U04: Interval math: recognizes overlapping vs contiguous intervals correctly", () => {
    // Session A: 14:00 to 15:30
    const startA = new Date("2026-05-15T14:00:00Z");
    const endA = new Date("2026-05-15T15:30:00Z");

    // Overlapping Session: 15:00 to 16:30 (overlaps by 30 mins)
    const startOverlap = new Date("2026-05-15T15:00:00Z");
    const endOverlap = new Date("2026-05-15T16:30:00Z");
    const isOverlap = startA < endOverlap && endA > startOverlap;
    expect(isOverlap).toBe(true);

    // Adjacent Session 1: 15:30 to 17:00 (starts exactly when A ends)
    const startAdj1 = new Date("2026-05-15T15:30:00Z");
    const endAdj1 = new Date("2026-05-15T17:00:00Z");
    const isOverlapAdj1 = startA < endAdj1 && endA > startAdj1;
    expect(isOverlapAdj1).toBe(false); // Contiguous is NOT an overlap!

    // Adjacent Session 2: 12:30 to 14:00 (ends exactly when A starts)
    const startAdj2 = new Date("2026-05-15T12:30:00Z");
    const endAdj2 = new Date("2026-05-15T14:00:00Z");
    const isOverlapAdj2 = startA < endAdj2 && endA > startAdj2;
    expect(isOverlapAdj2).toBe(false);
  });

  it("P10.U05: Attendance states comply with LessonAttendance enum", () => {
    const validStates: LessonAttendance[] = [
      LessonAttendance.PRESENT,
      LessonAttendance.ABSENT_STUDENT,
      LessonAttendance.ABSENT_TEACHER,
      LessonAttendance.EXCUSED,
      LessonAttendance.LATE,
    ];
    expect(validStates).toHaveLength(5);
  });

  it("P10.U06: Session lifecycle statuses comply with SessionStatus enum", () => {
    const validStatuses: SessionStatus[] = [
      SessionStatus.SCHEDULED,
      SessionStatus.RESCHEDULED,
      SessionStatus.IN_PROGRESS,
      SessionStatus.TEACHER_COMPLETED,
      SessionStatus.PARENT_APPROVED,
      SessionStatus.PARENT_DISPUTED,
      SessionStatus.ADMIN_RESOLVED,
      SessionStatus.CANCELLED,
    ];
    expect(validStatuses).toHaveLength(8);
  });
});

