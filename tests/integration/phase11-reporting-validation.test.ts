import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  PrismaClient,
  UserRole,
  TeacherVerificationStatus,
  ClassroomStatus,
  SessionStatus,
  ReportStatus,
  DisputeStatus,
  LessonAttendance,
} from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { ReportingService, ReportingServiceError } from "@/lib/reporting/reporting-service";

const prisma = new PrismaClient();

describe("Phase 11: Lesson Reports, Parent Validation, Dispute Management & Academic Progress Foundations", () => {
  const ts = Date.now();
  const testPassword = "PasswordPhase11Test2026!";

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

  let classroomFunded: any;
  let sessionFunded1: any;
  let sessionFunded2: any;

  let classroomUnfunded: any;
  let sessionUnfunded: any;

  beforeAll(async () => {
    const passwordHash = await hashPassword(testPassword);

    // 1. Admin
    const admin = await prisma.user.create({
      data: {
        email: `admin.p11.${ts}@monsieurfanyi.gn`,
        fullName: "Superviseur Litiges & Rapports P11",
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
      },
    });
    adminUserId = admin.id;

    // 2. Parent A & Student A
    const parentUserA = await prisma.user.create({
      data: {
        email: `parentA.p11.${ts}@example.com`,
        fullName: "Amadou Diallo Parent P11",
        passwordHash,
        role: UserRole.PARENT,
        isActive: true,
      },
    });
    parentUserIdA = parentUserA.id;

    const parentProfA = await prisma.parentProfile.create({
      data: {
        userId: parentUserA.id,
        address: "Kipé Centre, Ratoma",
        city: "Conakry",
      },
    });
    parentProfileIdA = parentProfA.id;

    const studentA = await prisma.studentProfile.create({
      data: {
        parentId: parentProfA.id,
        fullName: "Fatoumata Diallo",
        gradeLevel: "Terminale SM",
        cycle: "LYCEE",
      },
    });
    studentIdA = studentA.id;

    // 3. Parent B & Student B (For cross-tenant intrusion tests)
    const parentUserB = await prisma.user.create({
      data: {
        email: `parentB.p11.${ts}@example.com`,
        fullName: "Ousmane Camara Parent B P11",
        passwordHash,
        role: UserRole.PARENT,
        isActive: true,
      },
    });
    parentUserIdB = parentUserB.id;

    const parentProfB = await prisma.parentProfile.create({
      data: {
        userId: parentUserB.id,
        address: "Taouyah, Dixinn",
        city: "Conakry",
      },
    });
    parentProfileIdB = parentProfB.id;

    const studentB = await prisma.studentProfile.create({
      data: {
        parentId: parentProfB.id,
        fullName: "Ibrahima Camara",
        gradeLevel: "3ème Année Collège",
        cycle: "COLLEGE",
      },
    });
    studentIdB = studentB.id;

    // 4. Teacher 1 (Approved)
    const teacherUser1 = await prisma.user.create({
      data: {
        email: `teacher1.p11.${ts}@example.com`,
        fullName: "Mamadou Sow Enseignant Titulaire P11",
        passwordHash,
        role: UserRole.TEACHER,
        isActive: true,
      },
    });
    teacherUserId1 = teacherUser1.id;

    const teacherProf1 = await prisma.teacherProfile.create({
      data: {
        userId: teacherUser1.id,
        headline: "Professeur Agréé de Mathématiques",
        verificationStatus: TeacherVerificationStatus.APPROVED,
        hourlyRateGnf: 100000,
        monthlyPackageRateGnf: 800000,
      },
    });
    teacherProfileId1 = teacherProf1.id;

    // 5. Teacher 2 (Unrelated teacher)
    const teacherUser2 = await prisma.user.create({
      data: {
        email: `teacher2.p11.${ts}@example.com`,
        fullName: "Boubacar Bah Enseignant Intrus P11",
        passwordHash,
        role: UserRole.TEACHER,
        isActive: true,
      },
    });
    teacherUserId2 = teacherUser2.id;

    const teacherProf2 = await prisma.teacherProfile.create({
      data: {
        userId: teacherUser2.id,
        headline: "Professeur de Français",
        verificationStatus: TeacherVerificationStatus.APPROVED,
      },
    });
    teacherProfileId2 = teacherProf2.id;

    // 6. Classroom A (Funded fixture)
    classroomFunded = await prisma.classroom.create({
      data: {
        teacherProfileId: teacherProf1.id,
        studentId: studentA.id,
        subjectName: "Mathématiques Avancées",
        mode: "HOME",
        hourlyRateGnf: 100000,
        status: ClassroomStatus.ACTIVE,
      },
    });

    // Session Funded 1 (For report submission & approval)
    sessionFunded1 = await prisma.lessonSession.create({
      data: {
        classroomId: classroomFunded.id,
        sessionSequence: 1,
        title: "Calcul Intégral & Primitives",
        scheduledStart: new Date("2026-06-01T15:00:00Z"),
        scheduledEnd: new Date("2026-06-01T17:00:00Z"),
        durationMinutes: 120,
        actualDurationMinutes: 120,
        attendanceStatus: LessonAttendance.PRESENT,
        allocatedAmountGnf: 200000,
        platformCommissionGnf: 30000,
        teacherNetGnf: 170000,
        isFunded: true,
        status: SessionStatus.SCHEDULED,
      },
    });

    // Session Funded 2 (For dispute workflow)
    sessionFunded2 = await prisma.lessonSession.create({
      data: {
        classroomId: classroomFunded.id,
        sessionSequence: 2,
        title: "Géométrie dans l'Espace",
        scheduledStart: new Date("2026-06-03T15:00:00Z"),
        scheduledEnd: new Date("2026-06-03T17:00:00Z"),
        durationMinutes: 120,
        actualDurationMinutes: 120,
        attendanceStatus: LessonAttendance.PRESENT,
        allocatedAmountGnf: 200000,
        platformCommissionGnf: 30000,
        teacherNetGnf: 170000,
        isFunded: true,
        status: SessionStatus.SCHEDULED,
      },
    });

    // 7. Classroom B (Unfunded fixture)
    classroomUnfunded = await prisma.classroom.create({
      data: {
        teacherProfileId: teacherProf1.id,
        studentId: studentB.id,
        subjectName: "Sciences Physiques",
        mode: "HOME",
        status: ClassroomStatus.PENDING_PAYMENT,
      },
    });

    sessionUnfunded = await prisma.lessonSession.create({
      data: {
        classroomId: classroomUnfunded.id,
        sessionSequence: 1,
        title: "Mécanique & Cinématique",
        scheduledStart: new Date("2026-06-05T14:00:00Z"),
        scheduledEnd: new Date("2026-06-05T16:00:00Z"),
        durationMinutes: 120,
        allocatedAmountGnf: 200000,
        platformCommissionGnf: 30000,
        teacherNetGnf: 170000,
        isFunded: false, // Unfunded!
        status: SessionStatus.SCHEDULED,
      },
    });
  });

  afterAll(async () => {
    // Cleanup in cascade
    await prisma.lessonDispute.deleteMany({
      where: { session: { classroomId: { in: [classroomFunded.id, classroomUnfunded.id] } } },
    });
    await prisma.lessonApproval.deleteMany({
      where: { session: { classroomId: { in: [classroomFunded.id, classroomUnfunded.id] } } },
    });
    await prisma.lessonReport.deleteMany({
      where: { session: { classroomId: { in: [classroomFunded.id, classroomUnfunded.id] } } },
    });
    await prisma.lessonSession.deleteMany({
      where: { classroomId: { in: [classroomFunded.id, classroomUnfunded.id] } },
    });
    await prisma.classroom.deleteMany({
      where: { id: { in: [classroomFunded.id, classroomUnfunded.id] } },
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

  it("P11.01: Assigned teacher can prepare and save a draft lesson report", async () => {
    const draft = await ReportingService.saveDraftReport({
      sessionId: sessionFunded1.id,
      topicsCovered: "Intégration par parties et calcul d'aires",
      learningObjectives: "Appliquer la formule d'intégration par parties",
      studentEffort: "Très investi et actif",
      strengths: "Compréhension rapide de la formule",
      areasForImprovement: "Vérifier le choix de u et v prime",
      homeworkGiven: "Exercices 12 et 15 page 120",
      homeworkDueDate: "2026-06-08",
      attendanceStatus: LessonAttendance.PRESENT,
      actualDurationMinutes: 120,
      actorUserId: teacherUserId1,
      actorRole: UserRole.TEACHER,
    });

    expect(draft.id).toBeDefined();
    expect(draft.status).toBe(ReportStatus.DRAFT);
    expect(draft.topicsCovered).toBe("Intégration par parties et calcul d'aires");
    expect(draft.draftSavedAt).toBeDefined();
  });

  it("P11.02: Unrelated teacher cannot create or edit another teacher's report (403)", async () => {
    await expect(
      ReportingService.saveDraftReport({
        sessionId: sessionFunded1.id,
        topicsCovered: "Tentative d'intrusion",
        actorUserId: teacherUserId2, // Teacher 2 is unrelated
        actorRole: UserRole.TEACHER,
      })
    ).rejects.toThrow(/Accès refusé/);
  });

  it("P11.03: Teacher can update their existing draft report", async () => {
    const updated = await ReportingService.saveDraftReport({
      sessionId: sessionFunded1.id,
      topicsCovered: "Intégration par parties et applications géométriques",
      learningObjectives: "Appliquer la formule d'intégration par parties sur deux exemples",
      studentEffort: "Bonne participation",
      strengths: "Calcul des primitives directes sans hésitation",
      areasForImprovement: "Éviter les erreurs d'inversion des bornes",
      actorUserId: teacherUserId1,
      actorRole: UserRole.TEACHER,
    });

    expect(updated.status).toBe(ReportStatus.DRAFT);
    expect(updated.topicsCovered).toContain("applications géométriques");
  });

  it("P11.04: Teacher submits complete lesson report: transitions to TEACHER_COMPLETED & SUBMITTED", async () => {
    const result = await ReportingService.submitLessonReport({
      sessionId: sessionFunded1.id,
      topicsCovered: "Intégration par parties, primitives usuelles et calcul d'aires délimitées",
      learningObjectives: "Savoir isoler u'(x) et v(x), calculer l'intégrale définie avec précision",
      studentEffort: "Excellente participation, élève concentrée",
      teacherNotes: "Très bon travail aujourd'hui, Fatoumata progresse vite.",
      strengths: "Rigueur dans les étapes de calcul et maîtrise des primitives de base",
      areasForImprovement: "Faire attention aux signes négatifs lors de la soustraction des bornes",
      homeworkGiven: "Exercices 1, 3 et 5 page 142 pour le prochain cours",
      homeworkDueDate: "2026-06-08T00:00:00Z",
      nextLessonRecommendations: "Poursuivre avec les équations différentielles",
      assessmentTitle: "Interrogation flash primitives",
      assessmentScore: 18,
      assessmentMaxScore: 20,
      assessmentComment: "Très bon résultat",
      progressRating: 5,
      attendanceStatus: LessonAttendance.PRESENT,
      actualDurationMinutes: 120,
      actorUserId: teacherUserId1,
      actorRole: UserRole.TEACHER,
    });

    expect(result.report.status).toBe(ReportStatus.SUBMITTED);
    expect(result.report.submittedAt).toBeDefined();
    expect(result.session.status).toBe(SessionStatus.TEACHER_COMPLETED);
    expect(result.session.actualDurationMinutes).toBe(120);
  });

  it("P11.05: In-app notification is delivered to parent when report is submitted", async () => {
    const notifs = await prisma.notification.findMany({
      where: {
        userId: parentUserIdA,
        title: "Compte rendu de cours disponible",
      },
    });

    expect(notifs.length).toBeGreaterThanOrEqual(1);
    expect(notifs[0].message).toContain("Mathématiques Avancées");
  });

  it("P11.06: Parent can query their child's lesson reports", async () => {
    const data = await ReportingService.getParentReports(parentUserIdA);

    expect(data.stats.awaitingValidation).toBeGreaterThanOrEqual(1);
    expect(data.sessions.some((s) => s.id === sessionFunded1.id)).toBe(true);

    const s = data.sessions.find((s) => s.id === sessionFunded1.id)!;
    expect(s.report?.topicsCovered).toContain("Intégration par parties");
    expect(s.report?.assessmentScore).toBe(18);
  });

  it("P11.07: Authorized parent approves the lesson: transitions to PARENT_APPROVED & VALIDATED", async () => {
    const result = await ReportingService.approveLessonSession({
      sessionId: sessionFunded1.id,
      feedbackNote: "Merci professeur, Fatoumata a trouvé le cours très clair !",
      actorUserId: parentUserIdA,
      actorRole: UserRole.PARENT,
    });

    expect(result.approval.id).toBeDefined();
    expect(result.approval.approvedBy).toBe(parentUserIdA);
    expect(result.report.status).toBe(ReportStatus.VALIDATED);
    expect(result.session.status).toBe(SessionStatus.PARENT_APPROVED);

    // Verify teacher receives notification
    const teacherNotifs = await prisma.notification.findMany({
      where: {
        userId: teacherUserId1,
        title: "Séance validée par le parent",
      },
    });
    expect(teacherNotifs.length).toBeGreaterThanOrEqual(1);
  });

  it("P11.08: Another parent cannot approve the lesson (403)", async () => {
    // Parent B trying to approve Session 1 of Parent A's child
    await expect(
      ReportingService.approveLessonSession({
        sessionId: sessionFunded1.id,
        actorUserId: parentUserIdB,
        actorRole: UserRole.PARENT,
      })
    ).rejects.toThrow(/Accès refusé/);
  });

  it("P11.09: Duplicate approval attempt on an already approved session is rejected", async () => {
    await expect(
      ReportingService.approveLessonSession({
        sessionId: sessionFunded1.id,
        actorUserId: parentUserIdA,
        actorRole: UserRole.PARENT,
      })
    ).rejects.toThrow(/déjà été validée|déjà été approuvée/);
  });

  it("P11.10: Approved report is protected against modification", async () => {
    await expect(
      ReportingService.saveDraftReport({
        sessionId: sessionFunded1.id,
        topicsCovered: "Modification interdite après validation parentale",
        actorUserId: teacherUserId1,
        actorRole: UserRole.TEACHER,
      })
    ).rejects.toThrow(/déjà été validé/);
  });

  it("P11.11: Financial Eligibility Service: validates funded & approved session without creating live earnings", async () => {
    const eligibility = await ReportingService.checkEarningsEligibility(sessionFunded1.id);

    expect(eligibility.isEligible).toBe(true);
    expect(eligibility.reasons).toHaveLength(0);
    expect(eligibility.sessionDetails?.isFunded).toBe(true);
    expect(eligibility.sessionDetails?.allocatedAmountGnf).toBe(200000);
    expect(eligibility.sessionDetails?.teacherNetGnf).toBe(170000);

    // Critical Milestone 3 Invariant: Zero TeacherEarning records exist prematurely
    const earningsInDb = await prisma.teacherEarning.findMany({
      where: { sessionId: sessionFunded1.id },
    });
    expect(earningsInDb).toHaveLength(0);
  });

  it("P11.12: Parent disputes a lesson session (Session 2): transitions to PARENT_DISPUTED & DISPUTED", async () => {
    // First, submit a report for Session 2
    await ReportingService.submitLessonReport({
      sessionId: sessionFunded2.id,
      topicsCovered: "Géométrie dans l'espace et produit scalaire 3D",
      learningObjectives: "Calculer le produit scalaire dans un repère orthonormal",
      studentEffort: "Participation moyenne",
      strengths: "Connaissance des formules",
      areasForImprovement: "Représentation dans l'espace",
      attendanceStatus: LessonAttendance.PRESENT,
      actualDurationMinutes: 120,
      actorUserId: teacherUserId1,
      actorRole: UserRole.TEACHER,
    });

    // Now parent disputes it: e.g. Incorrect duration
    const disputeResult = await ReportingService.disputeLessonSession({
      sessionId: sessionFunded2.id,
      category: "INCORRECT_DURATION",
      reason: "Le professeur est parti 45 minutes avant la fin prévue du cours sans explication.",
      actorUserId: parentUserIdA,
      actorRole: UserRole.PARENT,
    });

    expect(disputeResult.dispute.id).toBeDefined();
    expect(disputeResult.dispute.status).toBe(DisputeStatus.OPEN);
    expect(disputeResult.session.status).toBe(SessionStatus.PARENT_DISPUTED);

    // Verify report is marked as DISPUTED
    const report = await prisma.lessonReport.findUnique({
      where: { sessionId: sessionFunded2.id },
    });
    expect(report?.status).toBe(ReportStatus.DISPUTED);
  });

  it("P11.13: Dispute blocks earnings eligibility strictly", async () => {
    const eligibility = await ReportingService.checkEarningsEligibility(sessionFunded2.id);

    expect(eligibility.isEligible).toBe(false);
    expect(eligibility.reasons).toContain("UNRESOLVED_DISPUTE");
  });

  it("P11.14: Assigned teacher responds to the dispute: transitions dispute to UNDER_REVIEW", async () => {
    const updatedDispute = await ReportingService.respondToDispute({
      sessionId: sessionFunded2.id,
      teacherResponse: "J'ai dû écourter de 30 min suite à une urgence familiale signalée au gardien, et j'avais proposé de rattraper samedi.",
      actorUserId: teacherUserId1,
      actorRole: UserRole.TEACHER,
    });

    expect(updatedDispute.status).toBe(DisputeStatus.UNDER_REVIEW);
    expect(updatedDispute.teacherResponse).toContain("urgence familiale");
    expect(updatedDispute.teacherRespondedAt).toBeDefined();
  });

  it("P11.15: Administrator arbitrates dispute: records official resolution and updates status", async () => {
    const dispute = await prisma.lessonDispute.findUnique({
      where: { sessionId: sessionFunded2.id },
    });
    expect(dispute).toBeDefined();

    const resolved = await ReportingService.resolveDispute({
      disputeId: dispute!.id,
      resolutionType: "RESOLVED_VALIDATED",
      adminNote: "Accord trouvé : séance validée pour 1h30 et 30 minutes de rattrapage programmées samedi prochain.",
      actorUserId: adminUserId,
      actorRole: UserRole.ADMIN,
    });

    expect(resolved.status).toBe(DisputeStatus.RESOLVED_VALIDATED);
    expect(resolved.adminNote).toContain("Accord trouvé");
    expect(resolved.resolvedById).toBe(adminUserId);

    // Check session updated to ADMIN_RESOLVED
    const session = await prisma.lessonSession.findUnique({
      where: { id: sessionFunded2.id },
    });
    expect(session?.status).toBe(SessionStatus.ADMIN_RESOLVED);
  });

  it("P11.16: Unfunded session report submission works academically but is strictly ineligible financially", async () => {
    // Teacher drafts and completes unfunded session
    const result = await ReportingService.submitLessonReport({
      sessionId: sessionUnfunded.id,
      topicsCovered: "Cinématique du point matériel",
      learningObjectives: "Calculer les vecteurs vitesse et accélération",
      studentEffort: "Bonne écoute",
      strengths: "Calculs différentiels maîtrisés",
      areasForImprovement: "Unités physiques du système international",
      attendanceStatus: LessonAttendance.PRESENT,
      actualDurationMinutes: 120,
      actorUserId: teacherUserId1,
      actorRole: UserRole.TEACHER,
    });

    expect(result.report.status).toBe(ReportStatus.SUBMITTED);
    expect(result.session.isFunded).toBe(false);

    // Financial check: Must strictly return isEligible = false with SESSION_NOT_FUNDED
    const eligibility = await ReportingService.checkEarningsEligibility(sessionUnfunded.id);
    expect(eligibility.isEligible).toBe(false);
    expect(eligibility.reasons).toContain("SESSION_NOT_FUNDED");
  });

  it("P11.17: Audit logs exist for all critical reporting actions", async () => {
    const logs = await prisma.auditLog.findMany({
      where: {
        entityId: { in: [sessionFunded1.id, sessionFunded2.id] },
      },
      select: { action: true },
    });

    const actions = logs.map((l) => l.action);
    expect(actions).toContain("LESSON_SESSION_APPROVED");
    expect(actions).toContain("LESSON_SESSION_DISPUTED");
  });
});

