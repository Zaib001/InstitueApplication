import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  PrismaClient,
  UserRole,
  TeacherVerificationStatus,
  ClassroomStatus,
  SessionStatus,
  ReportStatus,
  LessonAttendance,
  HomeworkStatus,
  AssessmentType,
} from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { ProgressService, ProgressServiceError } from "@/lib/progress/progress-service";

const prisma = new PrismaClient();

describe("Phase 12 Integration Tests: Advanced Digital Student Progress Book", () => {
  const ts = Date.now();
  const testPassword = "PasswordPhase12Test2026!";

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

  let classroom1: any;
  let sessionDelivered1: any;
  let sessionDelivered2: any;
  let sessionScheduledFuture: any;

  let createdHomeworkId: string;
  let createdAssessment1Id: string;
  let createdAssessment2Id: string;

  beforeAll(async () => {
    const passwordHash = await hashPassword(testPassword);

    // 1. Admin User
    const admin = await prisma.user.create({
      data: {
        email: `admin.p12.${ts}@monsieurfanyi.gn`,
        fullName: "Directeur Académique P12",
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
      },
    });
    adminUserId = admin.id;

    // 2. Parent A & Student A
    const parentUserA = await prisma.user.create({
      data: {
        email: `parentA.p12.${ts}@example.com`,
        fullName: `Mamadou Bah Parent P12 ${ts}`,
        phoneNumber: `+224621${Math.floor(100000 + Math.random() * 900000)}`,
        passwordHash,
        role: UserRole.PARENT,
        isActive: true,
      },
    });
    parentUserIdA = parentUserA.id;

    const parentProfA = await prisma.parentProfile.create({
      data: {
        userId: parentUserA.id,
        address: "Kipé, Ratoma",
        city: "Conakry",
      },
    });
    parentProfileIdA = parentProfA.id;

    const studentA = await prisma.studentProfile.create({
      data: {
        parentId: parentProfA.id,
        fullName: `Ibrahima Bah Élève P12 ${ts}`,
        gradeLevel: "3ème Année Collège",
        cycle: "COLLEGE",
        schoolName: "Lycée Français Albert Camus",
        preferredSubjects: ["Mathématiques", "Physique-Chimie"],
      },
    });
    studentIdA = studentA.id;

    // 3. Parent B & Student B (unrelated family)
    const parentUserB = await prisma.user.create({
      data: {
        email: `parentB.p12.${ts}@example.com`,
        fullName: `Fatoumata Camara Parent P12 ${ts}`,
        phoneNumber: `+224622${Math.floor(100000 + Math.random() * 900000)}`,
        passwordHash,
        role: UserRole.PARENT,
        isActive: true,
      },
    });
    parentUserIdB = parentUserB.id;

    const parentProfB = await prisma.parentProfile.create({
      data: {
        userId: parentUserB.id,
        address: "Matam Centre",
        city: "Conakry",
      },
    });
    parentProfileIdB = parentProfB.id;

    const studentB = await prisma.studentProfile.create({
      data: {
        parentId: parentProfB.id,
        fullName: `Aïssatou Camara Élève P12 ${ts}`,
        gradeLevel: "Terminale SM",
        cycle: "LYCEE",
        schoolName: "Lycée Sainte Marie",
        preferredSubjects: ["Mathématiques"],
      },
    });
    studentIdB = studentB.id;

    // 4. Teacher 1 (assigned to Student A)
    const teacherUser1 = await prisma.user.create({
      data: {
        email: `teacher1.p12.${ts}@example.com`,
        fullName: "Dr. Alpha Sow Tuteur P12",
        phoneNumber: `+224623${Math.floor(100000 + Math.random() * 900000)}`,
        passwordHash,
        role: UserRole.TEACHER,
        isActive: true,
      },
    });
    teacherUserId1 = teacherUser1.id;

    const teacherProf1 = await prisma.teacherProfile.create({
      data: {
        userId: teacherUser1.id,
        headline: "Professeur Agrégé de Mathématiques",
        verificationStatus: TeacherVerificationStatus.APPROVED,
        serviceArea: "Conakry Nord",
      },
    });
    teacherProfileId1 = teacherProf1.id;

    // 5. Teacher 2 (unassigned)
    const teacherUser2 = await prisma.user.create({
      data: {
        email: `teacher2.p12.${ts}@example.com`,
        fullName: "Mme Mariama Barry Tuteur P12",
        phoneNumber: `+224624${Math.floor(100000 + Math.random() * 900000)}`,
        passwordHash,
        role: UserRole.TEACHER,
        isActive: true,
      },
    });
    teacherUserId2 = teacherUser2.id;

    const teacherProf2 = await prisma.teacherProfile.create({
      data: {
        userId: teacherUser2.id,
        headline: "Enseignante de Français & Littérature",
        verificationStatus: TeacherVerificationStatus.APPROVED,
        serviceArea: "Conakry Sud",
      },
    });
    teacherProfileId2 = teacherProf2.id;

    // 6. Classroom for Student A with Teacher 1
    classroom1 = await prisma.classroom.create({
      data: {
        studentId: studentIdA,
        teacherProfileId: teacherProfileId1,
        subjectName: "Mathématiques",
        status: ClassroomStatus.ACTIVE,
        hourlyRateGnf: 80000,
      },
    });

    // 7. Sessions: 2 delivered and approved, 1 scheduled in future
    const pastDate1 = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const pastDate2 = new Date(Date.now() - 3 * 24 * 3600 * 1000);
    const futureDate = new Date(Date.now() + 5 * 24 * 3600 * 1000);

    sessionDelivered1 = await prisma.lessonSession.create({
      data: {
        classroomId: classroom1.id,
        sessionSequence: 1,
        title: "Séance 1: Racines carrées et calcul algébrique",
        scheduledStart: pastDate1,
        scheduledEnd: new Date(pastDate1.getTime() + 7200000),
        durationMinutes: 120,
        actualDurationMinutes: 120,
        status: SessionStatus.PARENT_APPROVED,
        attendanceStatus: LessonAttendance.PRESENT,
        attendanceRecordedAt: pastDate1,
        isFunded: true,
      },
    });

    await prisma.lessonReport.create({
      data: {
        sessionId: sessionDelivered1.id,
        status: ReportStatus.VALIDATED,
        topicsCovered: "Propriétés des racines carrées et simplifications",
        learningObjectives: "Savoir simplifier un radical sous forme a*sqrt(b)",
        studentEffort: "Très concentré et volontaire",
        strengths: "Calcul mental rapide",
        areasForImprovement: "Prendre le temps de bien poser les étapes",
        submittedAt: pastDate1,
      },
    });

    sessionDelivered2 = await prisma.lessonSession.create({
      data: {
        classroomId: classroom1.id,
        sessionSequence: 2,
        title: "Séance 2: Théorème de Pythagore et réciproque",
        scheduledStart: pastDate2,
        scheduledEnd: new Date(pastDate2.getTime() + 7200000),
        durationMinutes: 120,
        actualDurationMinutes: 120,
        status: SessionStatus.PARENT_APPROVED,
        attendanceStatus: LessonAttendance.PRESENT,
        attendanceRecordedAt: pastDate2,
        isFunded: true,
      },
    });

    await prisma.lessonReport.create({
      data: {
        sessionId: sessionDelivered2.id,
        status: ReportStatus.VALIDATED,
        topicsCovered: "Démonstrations géométriques et réciproque de Pythagore",
        learningObjectives: "Démontrer qu'un triangle est rectangle",
        studentEffort: "Excellente participation",
        strengths: "Rigueur dans les étapes de rédaction géométrique",
        areasForImprovement: "Attention aux unités",
        submittedAt: pastDate2,
      },
    });

    sessionScheduledFuture = await prisma.lessonSession.create({
      data: {
        classroomId: classroom1.id,
        sessionSequence: 3,
        title: "Séance 3: Trigonométrie dans le triangle rectangle",
        scheduledStart: futureDate,
        scheduledEnd: new Date(futureDate.getTime() + 7200000),
        durationMinutes: 120,
        status: SessionStatus.SCHEDULED,
        isFunded: true,
      },
    });
  });

  afterAll(async () => {
    // Teardown created test data
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

    await prisma.academicAssessment.deleteMany({
      where: { studentId: { in: [studentIdA, studentIdB] } },
    });

    await prisma.homeworkAssignment.deleteMany({
      where: { studentId: { in: [studentIdA, studentIdB] } },
    });

    await prisma.subjectProgressObservation.deleteMany({
      where: { studentId: { in: [studentIdA, studentIdB] } },
    });

    const sessionIds = [sessionDelivered1?.id, sessionDelivered2?.id, sessionScheduledFuture?.id].filter(Boolean) as string[];
    if (sessionIds.length > 0) {
      await prisma.lessonReport.deleteMany({
        where: { sessionId: { in: sessionIds } },
      });
    }

    if (classroom1?.id) {
      await prisma.lessonSession.deleteMany({
        where: { classroomId: classroom1.id },
      });

      await prisma.classroom.deleteMany({
        where: { id: classroom1.id },
      });
    }

    await prisma.studentProfile.deleteMany({
      where: { id: { in: [studentIdA, studentIdB] } },
    });

    await prisma.parentProfile.deleteMany({
      where: { id: { in: [parentProfileIdA, parentProfileIdB] } },
    });

    await prisma.teacherProfile.deleteMany({
      where: { id: { in: [teacherProfileId1, teacherProfileId2] } },
    });

    await prisma.user.deleteMany({
      where: {
        id: { in: [adminUserId, parentUserIdA, parentUserIdB, teacherUserId1, teacherUserId2] },
      },
    });

    await prisma.$disconnect();
  });

  // ----------------------------------------------------
  // TEST SUITE: Phase 12 Digital Progress Book
  // ----------------------------------------------------

  it("P12.01: Parent A successfully accesses their child's progress book", async () => {
    const book = await ProgressService.getProgressBook(studentIdA, parentUserIdA, UserRole.PARENT);

    expect(book).toBeDefined();
    expect(book.student.fullName).toContain("Ibrahima Bah Élève P12");
    expect(book.student.gradeLevel).toBe("3ème Année Collège");
    expect(book.summary.deliveredSessions).toBe(2);
    expect(book.attendance.ratePercentage).toBe(100);
  });

  it("P12.02: Multi-tenant boundary: Parent B is strictly blocked from viewing Student A's progress book", async () => {
    await expect(
      ProgressService.getProgressBook(studentIdA, parentUserIdB, UserRole.PARENT)
    ).rejects.toThrow("Accès refusé. Vous n'êtes pas le parent de cet élève.");
  });

  it("P12.03: Assigned Teacher 1 can view Student A's progress book", async () => {
    const book = await ProgressService.getProgressBook(studentIdA, teacherUserId1, UserRole.TEACHER);

    expect(book).toBeDefined();
    expect(book.student.fullName).toContain("Ibrahima Bah Élève P12");
  });

  it("P12.04: Unassigned Teacher 2 is strictly blocked from viewing Student A's progress book", async () => {
    await expect(
      ProgressService.getProgressBook(studentIdA, teacherUserId2, UserRole.TEACHER)
    ).rejects.toThrow("Accès refusé. Vous n'êtes pas l'enseignant assigné à cet élève.");
  });

  it("P12.05: Administrator can view any student's progress book", async () => {
    const book = await ProgressService.getProgressBook(studentIdA, adminUserId, UserRole.ADMIN);

    expect(book).toBeDefined();
    expect(book.student.fullName).toContain("Ibrahima Bah Élève P12");
  });

  it("P12.06: Assigned Teacher assigns structured homework with notification and audit log", async () => {
    const hw = await ProgressService.createHomework({
      studentId: studentIdA,
      classroomId: classroom1.id,
      sessionId: sessionDelivered2.id,
      title: "Exercices d'application sur la réciproque de Pythagore",
      description: "Résoudre les exercices 7 et 8 page 112 du manuel scolaire.",
      dueDate: new Date(Date.now() + 4 * 24 * 3600 * 1000),
      actorUserId: teacherUserId1,
      actorRole: UserRole.TEACHER,
    });

    expect(hw).toBeDefined();
    expect(hw.title).toBe("Exercices d'application sur la réciproque de Pythagore");
    expect(hw.status).toBe(HomeworkStatus.ASSIGNED);
    createdHomeworkId = hw.id;

    // Check notification sent to Parent A
    const notif = await prisma.notification.findFirst({
      where: {
        userId: parentUserIdA,
        title: "Nouveau devoir assigné",
      },
      orderBy: { createdAt: "desc" },
    });
    expect(notif).toBeDefined();
    expect(notif?.message).toContain("réciproque de Pythagore");

    // Check audit log
    const audit = await prisma.auditLog.findFirst({
      where: {
        entityId: hw.id,
        action: "HOMEWORK_ASSIGNED",
      },
    });
    expect(audit).toBeDefined();
  });

  it("P12.07: Parent updates homework to IN_PROGRESS and then SUBMITTED", async () => {
    // 1. Mark in progress
    const inProgress = await ProgressService.updateHomeworkStatus({
      homeworkId: createdHomeworkId,
      status: HomeworkStatus.IN_PROGRESS,
      actorUserId: parentUserIdA,
      actorRole: UserRole.PARENT,
    });
    expect(inProgress.status).toBe(HomeworkStatus.IN_PROGRESS);

    // 2. Submit work with student notes
    const submitted = await ProgressService.updateHomeworkStatus({
      homeworkId: createdHomeworkId,
      status: HomeworkStatus.SUBMITTED,
      studentSubmission: "Exercices terminés sur feuille double, les calculs sont détaillés.",
      actorUserId: parentUserIdA,
      actorRole: UserRole.PARENT,
    });

    expect(submitted.status).toBe(HomeworkStatus.SUBMITTED);
    expect(submitted.studentSubmission).toContain("Exercices terminés");
    expect(submitted.submittedAt).toBeDefined();

    // Notification to teacher
    const teacherNotif = await prisma.notification.findFirst({
      where: {
        userId: teacherUserId1,
        title: "Devoir rendu par l'élève",
      },
    });
    expect(teacherNotif).toBeDefined();
  });

  it("P12.08: Parent cannot bypass teacher review and mark homework as COMPLETED", async () => {
    await expect(
      ProgressService.updateHomeworkStatus({
        homeworkId: createdHomeworkId,
        status: HomeworkStatus.COMPLETED,
        actorUserId: parentUserIdA,
        actorRole: UserRole.PARENT,
      })
    ).rejects.toThrow("validation finale est réservée au professeur");
  });

  it("P12.09: Teacher reviews homework, adds feedback and validates as COMPLETED", async () => {
    const completed = await ProgressService.updateHomeworkStatus({
      homeworkId: createdHomeworkId,
      status: HomeworkStatus.COMPLETED,
      teacherFeedback: "Excellent travail, les démonstrations sont rigoureuses.",
      actorUserId: teacherUserId1,
      actorRole: UserRole.TEACHER,
    });

    expect(completed.status).toBe(HomeworkStatus.COMPLETED);
    expect(completed.teacherFeedback).toContain("Excellent travail");
    expect(completed.completedAt).toBeDefined();
    expect(completed.reviewedAt).toBeDefined();

    // Check parent received confirmation notification
    const parentNotif = await prisma.notification.findFirst({
      where: {
        userId: parentUserIdA,
        title: "Devoir corrigé par l'enseignant",
      },
    });
    expect(parentNotif).toBeDefined();
  });

  it("P12.10: Teacher records academic assessments with score bounds and percentage", async () => {
    // 1. Diagnostic assessment: 16/20 = 80%
    const ass1 = await ProgressService.createAssessment({
      studentId: studentIdA,
      classroomId: classroom1.id,
      sessionId: sessionDelivered1.id,
      title: "Évaluation diagnostique : Calcul littéral",
      assessmentType: AssessmentType.DIAGNOSTIC,
      obtainedScore: 16,
      maxScore: 20,
      learningObjectives: "Développement et factorisation",
      teacherComments: "Très bon niveau de rentrée",
      actorUserId: teacherUserId1,
      actorRole: UserRole.TEACHER,
    });

    expect(ass1.obtainedScore).toBe(16);
    expect(ass1.maxScore).toBe(20);
    expect(ass1.percentage).toBe(80);
    createdAssessment1Id = ass1.id;

    // 2. Monthly exam: 18/20 = 90%
    const ass2 = await ProgressService.createAssessment({
      studentId: studentIdA,
      classroomId: classroom1.id,
      sessionId: sessionDelivered2.id,
      title: "Contrôle mensuel #1 : Géométrie et racines carrées",
      assessmentType: AssessmentType.MONTHLY_EXAM,
      obtainedScore: 18,
      maxScore: 20,
      learningObjectives: "Racines carrées et réciproque de Pythagore",
      teacherComments: "Très belle progression",
      actorUserId: teacherUserId1,
      actorRole: UserRole.TEACHER,
    });

    expect(ass2.percentage).toBe(90);
    createdAssessment2Id = ass2.id;
  });

  it("P12.11: Teacher records qualitative observation and progress rating", async () => {
    const obs = await ProgressService.createObservation({
      studentId: studentIdA,
      classroomId: classroom1.id,
      topicsMastered: "Calculs avec radicaux, théorème de Pythagore",
      strengths: "Rigueur analytique et régularité",
      areasForImprovement: "Approfondir les problèmes ouverts",
      recommendations: "Poursuivre avec un rythme de 2 devoirs hebdomadaires",
      progressRating: 5,
      actorUserId: teacherUserId1,
      actorRole: UserRole.TEACHER,
    });

    expect(obs).toBeDefined();
    expect(obs.progressRating).toBe(5);
    expect(obs.subjectName).toBe("Mathématiques");
  });

  it("P12.12: Progress book aggregation computes overall average, evolution chart, and timeline", async () => {
    const book = await ProgressService.getProgressBook(studentIdA, parentUserIdA, UserRole.PARENT);

    // Overall Average: (80 + 90) / 2 = 85%, which is 17.0 / 20
    expect(book.summary.overallAveragePercentage).toBe(85);
    expect(book.summary.overallAverageScore20).toBe(17);
    expect(book.summary.totalAssessmentsCount).toBe(2);
    expect(book.summary.hasEnoughChartData).toBe(true);

    // Evolution Chart data has 2 points
    expect(book.assessments.length).toBe(2);
    expect(book.assessments[0].percentage).toBe(80);
    expect(book.assessments[1].percentage).toBe(90);

    // Homework stats: 1 completed, 0 active
    expect(book.summary.completedHomeworkCount).toBe(1);
    expect(book.summary.activeHomeworkCount).toBe(0);

    // Subject breakdown
    const mathSub = book.subjects.find((s: any) => s.subjectName === "Mathématiques");
    expect(mathSub).toBeDefined();
    expect(mathSub!.averageScore20).toBe(17);
    expect(mathSub!.completedLessonsCount).toBe(2);

    // Reverse chronological timeline
    expect(book.timeline.length).toBeGreaterThanOrEqual(5); // 3 sessions + 1 homework + 2 assessments
    const dates = book.timeline.map((t: any) => new Date(t.date).getTime());
    for (let i = 0; i < dates.length - 1; i++) {
      expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
    }
  });

  it("P12.13: Teacher Progress List returns assigned student summary with stats", async () => {
    const teacherStudents = await ProgressService.getTeacherProgressList(teacherUserId1);

    expect(teacherStudents.length).toBe(1);
    const st = teacherStudents[0];
    expect(st.studentId).toBe(studentIdA);
    expect(st.fullName).toContain("Ibrahima Bah Élève P12");
    expect(st.completedSessionsCount).toBe(2);
    expect(st.latestAssessment).toBeDefined();
    expect(st.latestAssessment.score).toBe(18);

    // Unassigned teacher has 0 students
    const unassignedStudents = await ProgressService.getTeacherProgressList(teacherUserId2);
    expect(unassignedStudents.length).toBe(0);
  });

  it("P12.14: Administrator Academic Oversight tracks national KPIs, missing reports and student details", async () => {
    const oversight = await ProgressService.getAdminAcademicProgress();

    expect(oversight.stats.totalStudents).toBeGreaterThanOrEqual(2);
    expect(oversight.stats.totalCompletedSessions).toBeGreaterThanOrEqual(2);
    expect(oversight.stats.totalAssessmentsRecorded).toBeGreaterThanOrEqual(2);

    // Search filter test using unique timestamp
    const filtered = await ProgressService.getAdminAcademicProgress({ search: `${ts}` });
    expect(filtered.students.length).toBe(2); // studentA and studentB both have ts
    const foundA = filtered.students.find((s) => s.studentId === studentIdA);
    expect(foundA).toBeDefined();
    expect(foundA?.fullName).toContain("Ibrahima Bah Élève P12");
  });
});
