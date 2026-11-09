import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  PrismaClient,
  UserRole,
  RequestStatus,
  TutoringMode,
  TeacherVerificationStatus,
  ClassroomStatus,
  PackageStatus,
  PricingOfferType,
  SessionStatus,
  LessonAttendance,
} from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import {
  SchedulingEngine,
  SchedulingEngineError,
} from "@/lib/scheduling/scheduling-engine";
import { PricingEngine } from "@/lib/pricing/pricing-engine";
import { ClassroomService } from "@/lib/classroom/classroom-service";

const prisma = new PrismaClient();

describe("Phase 10: Classroom Calendar, Session Scheduling, Attendance & Academic Record Foundations", () => {
  const ts = Date.now();
  const testPassword = "PasswordPhase10Test2026!";

  let adminUserId: string;
  let parentUserIdA: string;
  let parentProfileIdA: string;
  let studentIdA: string;

  let parentUserIdB: string;
  let parentProfileIdB: string;
  let studentIdB: string;

  let teacherUserId1: string;
  let teacherProfileId1: string;

  let teacherUserId2: string;
  let teacherProfileId2: string;

  let classroomA: any;
  let packageA: any;

  let classroomB: any;
  let packageB: any;

  beforeAll(async () => {
    const passwordHash = await hashPassword(testPassword);

    // 1. Admin
    const admin = await prisma.user.create({
      data: {
        email: `admin.p10.${ts}@monsieurfanyi.gn`,
        fullName: "Superviseur Académique P10",
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
      },
    });
    adminUserId = admin.id;

    // 2. Parent A & Student A
    const parentA = await prisma.user.create({
      data: {
        email: `parent.p10.a.${ts}@monsieurfanyi.gn`,
        fullName: "Fatoumata Camara P10",
        passwordHash,
        role: UserRole.PARENT,
        isActive: true,
        parentProfile: {
          create: {
            city: "Conakry",
            address: "Kipe",
            children: {
              create: {
                fullName: "Ibrahima Camara P10",
                gradeLevel: "Terminale SM",
                cycle: "LYCEE",
              },
            },
          },
        },
      },
      include: {
        parentProfile: {
          include: { children: true },
        },
      },
    });
    parentUserIdA = parentA.id;
    parentProfileIdA = parentA.parentProfile!.id;
    studentIdA = parentA.parentProfile!.children[0].id;

    // 3. Parent B & Student B
    const parentB = await prisma.user.create({
      data: {
        email: `parent.p10.b.${ts}@monsieurfanyi.gn`,
        fullName: "Sekou Diallo P10",
        passwordHash,
        role: UserRole.PARENT,
        isActive: true,
        parentProfile: {
          create: {
            city: "Conakry",
            address: "Dixinn",
            children: {
              create: {
                fullName: "Aissatou Diallo P10",
                gradeLevel: "3ème Année Collège",
                cycle: "COLLEGE",
              },
            },
          },
        },
      },
      include: {
        parentProfile: {
          include: { children: true },
        },
      },
    });
    parentUserIdB = parentB.id;
    parentProfileIdB = parentB.parentProfile!.id;
    studentIdB = parentB.parentProfile!.children[0].id;

    // 4. Teacher 1 (Mathématiques, Approved)
    const teacher1 = await prisma.user.create({
      data: {
        email: `teacher.p10.math.${ts}@monsieurfanyi.gn`,
        fullName: "Prof. Ousmane Barry P10",
        passwordHash,
        role: UserRole.TEACHER,
        isActive: true,
        teacherProfile: {
          create: {
            headline: "Enseignant Agrégé de Mathématiques",
            city: "Conakry",
            yearsOfExperience: 8,
            verificationStatus: TeacherVerificationStatus.APPROVED,
            hourlyRateGnf: 100000,
            monthlyPackageRateGnf: 800000,
            availabilities: {
              createMany: {
                data: [
                  { dayOfWeek: 1, startTime: "14:00", endTime: "19:00" }, // Lundi
                  { dayOfWeek: 3, startTime: "14:00", endTime: "19:00" }, // Mercredi
                  { dayOfWeek: 5, startTime: "14:00", endTime: "19:00" }, // Vendredi
                ],
              },
            },
          },
        },
      },
      include: { teacherProfile: true },
    });
    teacherUserId1 = teacher1.id;
    teacherProfileId1 = teacher1.teacherProfile!.id;

    // 5. Teacher 2 (Physique, Approved)
    const teacher2 = await prisma.user.create({
      data: {
        email: `teacher.p10.phys.${ts}@monsieurfanyi.gn`,
        fullName: "Dr. Kadiatou Sow P10",
        passwordHash,
        role: UserRole.TEACHER,
        isActive: true,
        teacherProfile: {
          create: {
            headline: "Docteure en Physique-Chimie",
            city: "Conakry",
            yearsOfExperience: 6,
            verificationStatus: TeacherVerificationStatus.APPROVED,
            hourlyRateGnf: 120000,
            monthlyPackageRateGnf: 960000,
          },
        },
      },
      include: { teacherProfile: true },
    });
    teacherUserId2 = teacher2.id;
    teacherProfileId2 = teacher2.teacherProfile!.id;

    // 6. Create Classroom A (Teacher 1 + Student A, 8-session Monthly package: 800,000 GNF)
    classroomA = await prisma.classroom.create({
      data: {
        teacherProfileId: teacherProfileId1,
        studentId: studentIdA,
        subjectName: "Mathématiques Avancées",
        mode: TutoringMode.HOME,
        monthlyRateGnf: 800000,
        status: ClassroomStatus.PENDING_PAYMENT,
      },
    });

    const calculatedPricingA = PricingEngine.calculateMonthlyPackage({
      totalAmountGnf: 800000,
      sessionsCount: 8,
      durationMinutes: 90,
      commissionRatePercent: 15,
    });

    packageA = await prisma.tutoringPackage.create({
      data: {
        classroomId: classroomA.id,
        pricingType: PricingOfferType.MONTHLY_PACKAGE,
        totalAmountGnf: calculatedPricingA.totalAmountGnf,
        sessionsCount: calculatedPricingA.sessionsCount,
        minutesPerSession: calculatedPricingA.minutesPerSession,
        totalPlannedMinutes: calculatedPricingA.totalPlannedMinutes,
        baseSessionRateGnf: calculatedPricingA.baseSessionRateGnf,
        remainderGnf: calculatedPricingA.remainderGnf,
        commissionRatePercent: calculatedPricingA.commissionRatePercent,
        totalPlatformCommissionGnf: calculatedPricingA.totalPlatformCommissionGnf,
        totalTeacherShareGnf: calculatedPricingA.totalTeacherShareGnf,
        allocationsJson: JSON.stringify(calculatedPricingA.allocations),
        status: PackageStatus.PENDING_PAYMENT,
      },
    });

    // 7. Create Classroom B (Teacher 2 + Student B)
    classroomB = await prisma.classroom.create({
      data: {
        teacherProfileId: teacherProfileId2,
        studentId: studentIdB,
        subjectName: "Physique-Chimie",
        mode: TutoringMode.ONLINE,
        monthlyRateGnf: 600000,
        externalVideoUrl: "https://meet.jit.si/fanyi-physique-b",
        status: ClassroomStatus.PENDING_PAYMENT,
      },
    });

    const calculatedPricingB = PricingEngine.calculateMonthlyPackage({
      totalAmountGnf: 600000,
      sessionsCount: 6,
      durationMinutes: 60,
      commissionRatePercent: 15,
    });

    packageB = await prisma.tutoringPackage.create({
      data: {
        classroomId: classroomB.id,
        pricingType: PricingOfferType.MONTHLY_PACKAGE,
        totalAmountGnf: calculatedPricingB.totalAmountGnf,
        sessionsCount: calculatedPricingB.sessionsCount,
        minutesPerSession: calculatedPricingB.minutesPerSession,
        totalPlannedMinutes: calculatedPricingB.totalPlannedMinutes,
        baseSessionRateGnf: calculatedPricingB.baseSessionRateGnf,
        remainderGnf: calculatedPricingB.remainderGnf,
        commissionRatePercent: calculatedPricingB.commissionRatePercent,
        totalPlatformCommissionGnf: calculatedPricingB.totalPlatformCommissionGnf,
        totalTeacherShareGnf: calculatedPricingB.totalTeacherShareGnf,
        allocationsJson: JSON.stringify(calculatedPricingB.allocations),
        status: PackageStatus.PENDING_PAYMENT,
      },
    });
  });

  afterAll(async () => {
    // Clean test data
    await prisma.lessonSession.deleteMany({
      where: { classroomId: { in: [classroomA.id, classroomB.id] } },
    });
    await prisma.tutoringPackage.deleteMany({
      where: { classroomId: { in: [classroomA.id, classroomB.id] } },
    });
    await prisma.classroom.deleteMany({
      where: { id: { in: [classroomA.id, classroomB.id] } },
    });
    await prisma.availability.deleteMany({
      where: { teacherProfileId: { in: [teacherProfileId1, teacherProfileId2] } },
    });
    await prisma.studentProfile.deleteMany({
      where: { id: { in: [studentIdA, studentIdB] } },
    });
    await prisma.parentProfile.deleteMany({
      where: { id: { in: [parentProfileIdA, parentProfileIdB] } },
    });
    await prisma.teacherProfile.deleteMany({
      where: { id: { in: [teacherProfileId1, teacherProfileId2] } },
    });
    await prisma.notification.deleteMany({
      where: {
        userId: { in: [adminUserId, parentUserIdA, parentUserIdB, teacherUserId1, teacherUserId2] },
      },
    });
    await prisma.auditLog.deleteMany({
      where: {
        userId: { in: [adminUserId, parentUserIdA, parentUserIdB, teacherUserId1, teacherUserId2] },
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [adminUserId, parentUserIdA, parentUserIdB, teacherUserId1, teacherUserId2] },
      },
    });
    await prisma.$disconnect();
  });

  it("P10.01: Batch plans 8 sessions from packageA matching recurring slots", async () => {
    const result = await SchedulingEngine.planSessionsFromPackage({
      classroomId: classroomA.id,
      startDate: "2026-06-01T00:00:00Z", // Lundi 1er Juin 2026
      recurringSlots: [
        { dayOfWeek: 1, startTime: "16:00" }, // Lundi 16:00
        { dayOfWeek: 3, startTime: "16:00" }, // Mercredi 16:00
      ],
      userId: teacherUserId1,
      userRole: UserRole.TEACHER,
      notes: "Programme Trimestriel Mathématiques",
    });

    expect(result.success).toBe(true);
    expect(result.sessionsCount).toBe(8);
    expect(result.sessions).toHaveLength(8);

    // Verify session sequences and duration
    result.sessions.forEach((sess, idx) => {
      expect(sess.sessionSequence).toBe(idx + 1);
      expect(sess.durationMinutes).toBe(90);
      expect(sess.status).toBe(SessionStatus.SCHEDULED);
      expect(sess.isFunded).toBe(false); // Unfunded pending payment classroom
    });
  });

  it("P10.02: Reconciles exact financial allocations from Phase 09 package across all 8 sessions", async () => {
    const sessions = await prisma.lessonSession.findMany({
      where: { classroomId: classroomA.id },
      orderBy: { sessionSequence: "asc" },
    });

    expect(sessions).toHaveLength(8);

    let sumAllocated = 0;
    let sumCommission = 0;
    let sumTeacherNet = 0;

    sessions.forEach((s) => {
      sumAllocated += s.allocatedAmountGnf;
      sumCommission += s.platformCommissionGnf;
      sumTeacherNet += s.teacherNetGnf;
    });

    // Package total was 800,000 GNF
    expect(sumAllocated).toBe(800000);
    // 15% platform commission = 120,000 GNF
    expect(sumCommission).toBe(120000);
    // 85% teacher share = 680,000 GNF
    expect(sumTeacherNet).toBe(680000);
    expect(sumCommission + sumTeacherNet).toBe(sumAllocated);
  });

  it("P10.03: Prevents exceeding the agreed package session count", async () => {
    // Attempting to plan more sessions when all 8 are already scheduled
    await expect(
      SchedulingEngine.planSessionsFromPackage({
        classroomId: classroomA.id,
        startDate: "2026-07-01T00:00:00Z",
        recurringSlots: [{ dayOfWeek: 1, startTime: "16:00" }],
        userId: teacherUserId1,
        userRole: UserRole.TEACHER,
      })
    ).rejects.toThrow(/déjà été planifié/);
  });

  it("P10.04: Conflict detection blocks overlapping confirmed booking for same teacher", async () => {
    // Teacher 1 has Session 1 on Monday 2026-06-01 from 16:00 to 17:30
    const startOverlap = new Date("2026-06-01T16:30:00Z");
    const endOverlap = new Date("2026-06-01T18:00:00Z");

    const conflict = await SchedulingEngine.checkTeacherConflicts(
      teacherProfileId1,
      startOverlap,
      endOverlap
    );

    expect(conflict.hasConflict).toBe(true);
    expect(conflict.message).toContain("Chevauchement avec une autre séance");
  });

  it("P10.05: Allows adjacent non-overlapping lessons on interval boundary", async () => {
    // Teacher 1 has lesson 16:00 to 17:30. A lesson ending at 16:00 or starting at 17:30 is contiguous!
    const adjacentBeforeStart = new Date("2026-06-01T14:30:00Z");
    const adjacentBeforeEnd = new Date("2026-06-01T16:00:00Z");

    const conflictBefore = await SchedulingEngine.checkTeacherConflicts(
      teacherProfileId1,
      adjacentBeforeStart,
      adjacentBeforeEnd
    );
    expect(conflictBefore.hasConflict).toBe(false);

    const adjacentAfterStart = new Date("2026-06-01T17:30:00Z");
    const adjacentAfterEnd = new Date("2026-06-01T19:00:00Z");

    const conflictAfter = await SchedulingEngine.checkTeacherConflicts(
      teacherProfileId1,
      adjacentAfterStart,
      adjacentAfterEnd
    );
    expect(conflictAfter.hasConflict).toBe(false);
  });

  it("P10.06: Reschedules a session with reason and preserves financial allocation intact", async () => {
    const session = await prisma.lessonSession.findFirst({
      where: { classroomId: classroomA.id, sessionSequence: 2 },
    });
    expect(session).not.toBeNull();

    const originalAlloc = session!.allocatedAmountGnf;
    const originalCom = session!.platformCommissionGnf;
    const originalNet = session!.teacherNetGnf;

    // Reschedule Session 2 to a non-conflicting time: Tuesday 2026-06-09 at 15:00
    const newStart = "2026-06-09T15:00:00Z";
    const newEnd = "2026-06-09T16:30:00Z";

    const rescheduled = await SchedulingEngine.rescheduleSession({
      sessionId: session!.id,
      newStart,
      newEnd,
      reason: "Demande du parent pour préparation de contrôle de physique",
      actorUserId: parentUserIdA,
      actorRole: UserRole.PARENT,
    });

    expect(rescheduled.status).toBe(SessionStatus.RESCHEDULED);
    expect(rescheduled.rescheduledFromStart).not.toBeNull();
    expect(rescheduled.rescheduleReason).toBe("Demande du parent pour préparation de contrôle de physique");
    expect(rescheduled.rescheduledById).toBe(parentUserIdA);

    // Strict Invariance: Allocation unchanged
    expect(rescheduled.allocatedAmountGnf).toBe(originalAlloc);
    expect(rescheduled.platformCommissionGnf).toBe(originalCom);
    expect(rescheduled.teacherNetGnf).toBe(originalNet);
  });

  it("P10.07: Cancels a session with audit trail and prevents re-cancelling", async () => {
    const session = await prisma.lessonSession.findFirst({
      where: { classroomId: classroomA.id, sessionSequence: 3 },
    });
    expect(session).not.toBeNull();

    const cancelled = await SchedulingEngine.cancelSession({
      sessionId: session!.id,
      reason: "Empêchement médical justifié de l'élève",
      actorUserId: parentUserIdA,
      actorRole: UserRole.PARENT,
    });

    expect(cancelled.status).toBe(SessionStatus.CANCELLED);
    expect(cancelled.cancelledAt).not.toBeNull();
    expect(cancelled.cancelledById).toBe(parentUserIdA);
    expect(cancelled.cancellationReason).toBe("Empêchement médical justifié de l'élève");

    // Attempting to cancel again should fail
    await expect(
      SchedulingEngine.cancelSession({
        sessionId: session!.id,
        reason: "Deuxième tentative",
        actorUserId: teacherUserId1,
        actorRole: UserRole.TEACHER,
      })
    ).rejects.toThrow(/déjà annulée/);
  });

  it("P10.08: Records structured attendance status and actual duration without rewriting price", async () => {
    const session = await prisma.lessonSession.findFirst({
      where: { classroomId: classroomA.id, sessionSequence: 1 },
    });
    expect(session).not.toBeNull();

    const originalAlloc = session!.allocatedAmountGnf;

    const attended = await SchedulingEngine.recordAttendance({
      sessionId: session!.id,
      attendanceStatus: LessonAttendance.PRESENT,
      actualStart: "2026-06-01T16:02:00Z",
      actualEnd: "2026-06-01T17:35:00Z",
      actualDurationMinutes: 93,
      notes: "Élève très attentif sur les exponentielles",
      actorUserId: teacherUserId1,
      actorRole: UserRole.TEACHER,
    });

    expect(attended.attendanceStatus).toBe(LessonAttendance.PRESENT);
    expect(attended.actualDurationMinutes).toBe(93);
    expect(attended.attendanceNotes).toBe("Élève très attentif sur les exponentielles");
    expect(attended.attendanceRecordedAt).not.toBeNull();
    expect(attended.attendanceRecordedById).toBe(teacherUserId1);

    // Invariant: Duration adjustment does not alter agreed package price
    expect(attended.allocatedAmountGnf).toBe(originalAlloc);
  });

  it("P10.09: Multi-tenant RBAC: Parent A cannot view or modify Classroom B sessions", async () => {
    // 1. Plan 6 sessions for Classroom B (Sekou Diallo + Dr. Kadiatou Sow)
    const resB = await SchedulingEngine.planSessionsFromPackage({
      classroomId: classroomB.id,
      startDate: "2026-06-02T00:00:00Z",
      recurringSlots: [{ dayOfWeek: 2, startTime: "15:00" }],
      userId: adminUserId,
      userRole: UserRole.ADMIN,
    });
    expect(resB.sessionsCount).toBe(6);

    // 2. Parent A queries calendar sessions
    const parentASessions = await SchedulingEngine.getCalendarSessions({
      userId: parentUserIdA,
      userRole: UserRole.PARENT,
    });

    // Parent A should ONLY see Classroom A sessions, never Classroom B
    parentASessions.forEach((s) => {
      expect(s.classroomId).toBe(classroomA.id);
      expect(s.classroom.student.id).toBe(studentIdA);
    });

    // Parent A attempting to reschedule a Classroom B session must be rejected with 403
    const sessionB1 = resB.sessions[0];
    await expect(
      SchedulingEngine.rescheduleSession({
        sessionId: sessionB1.id,
        newStart: "2026-06-03T15:00:00Z",
        reason: "Tentative d'intrusion",
        actorUserId: parentUserIdA,
        actorRole: UserRole.PARENT,
      })
    ).rejects.toThrow(/Accès refusé/);
  });

  it("P10.10: Financial Guard: Zero premature teacher earnings exist for unfunded planned sessions", async () => {
    // Verify that NO TeacherEarning records exist for any sessions of Classroom A
    const earnings = await prisma.teacherEarning.findMany({
      where: {
        session: { classroomId: classroomA.id },
      },
    });

    expect(earnings).toHaveLength(0);
  });
});

