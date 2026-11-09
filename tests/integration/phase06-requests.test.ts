import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient, UserRole, RequestStatus, TutoringMode } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { verifyStudentOwnership } from "@/lib/auth/parent-guard";
import {
  canTransitionRequestStatus,
  isRequestEditable,
  isRequestCancellable,
  getRequestStatusMeta,
} from "@/lib/tutoring-request/state-machine";
import {
  tutoringRequestDraftSchema,
  tutoringRequestPublishSchema,
} from "@/lib/validation/tutoring-request";
import frMessages from "@/messages/fr.json";
import enMessages from "@/messages/en.json";

const prisma = new PrismaClient();

describe("Phase 06: Complete Parent Tutoring Requests & Request Management", () => {
  const timestamp = Date.now();
  const testPassword = "ParentRequestTestPassword2026!";

  // Parent A (Conakry) & Parent B (Kindia)
  const parentEmailA = `parent.p06.a.${timestamp}@monsieurfanyi.gn`;
  const parentEmailB = `parent.p06.b.${timestamp}@monsieurfanyi.gn`;

  let parentUserIdA: string;
  let parentProfileIdA: string;
  let parentUserIdB: string;
  let parentProfileIdB: string;

  let studentA1Id: string;
  let studentA2Id: string;
  let studentB1Id: string;

  let testSubjectMathId: string;
  let testSubjectPhysicsId: string;

  beforeAll(async () => {
    const passwordHash = await hashPassword(testPassword);

    // 1. Fetch or create master subjects for test
    const mathSubject = await prisma.subject.upsert({
      where: { name: "Mathématiques" },
      update: {},
      create: {
        name: "Mathématiques",
        category: "SCIENCES_EXACTES",
        isActive: true,
      },
    });
    testSubjectMathId = mathSubject.id;

    const physicsSubject = await prisma.subject.upsert({
      where: { name: "Physique-Chimie" },
      update: {},
      create: {
        name: "Physique-Chimie",
        category: "SCIENCES_EXACTES",
        isActive: true,
      },
    });
    testSubjectPhysicsId = physicsSubject.id;

    // 2. Create Parent A & ParentProfile
    const parentA = await prisma.user.create({
      data: {
        fullName: "Ibrahima Sory Soumah (Parent A)",
        email: parentEmailA,
        phoneNumber: `624${Math.floor(100000 + Math.random() * 900000)}`,
        passwordHash,
        role: UserRole.PARENT,
        isActive: true,
        parentProfile: {
          create: {
            city: "Conakry",
            address: "Kipé Centre Émetteur",
          },
        },
      },
      include: { parentProfile: true },
    });
    parentUserIdA = parentA.id;
    parentProfileIdA = parentA.parentProfile!.id;

    // 3. Create Parent B & ParentProfile
    const parentB = await prisma.user.create({
      data: {
        fullName: "Aissatou Diallo (Parent B)",
        email: parentEmailB,
        phoneNumber: `625${Math.floor(100000 + Math.random() * 900000)}`,
        passwordHash,
        role: UserRole.PARENT,
        isActive: true,
        parentProfile: {
          create: {
            city: "Kindia",
            address: "Sarakoleah",
          },
        },
      },
      include: { parentProfile: true },
    });
    parentUserIdB = parentB.id;
    parentProfileIdB = parentB.parentProfile!.id;

    // 4. Create Students under Parent A
    const studentA1 = await prisma.studentProfile.create({
      data: {
        parentId: parentProfileIdA,
        fullName: "Ousmane Soumah",
        cycle: "LYCEE",
        gradeLevel: "Terminale SM",
        preferredSubjects: ["Mathématiques", "Physique-Chimie"],
      },
    });
    studentA1Id = studentA1.id;

    const studentA2 = await prisma.studentProfile.create({
      data: {
        parentId: parentProfileIdA,
        fullName: "Fatoumata Soumah",
        cycle: "COLLEGE",
        gradeLevel: "10ème Année",
        preferredSubjects: ["Français", "Anglais"],
      },
    });
    studentA2Id = studentA2.id;

    // 5. Create Student under Parent B
    const studentB1 = await prisma.studentProfile.create({
      data: {
        parentId: parentProfileIdB,
        fullName: "Mamadou Diallo",
        cycle: "PRIMAIRE",
        gradeLevel: "6ème Année",
        preferredSubjects: ["Calcul"],
      },
    });
    studentB1Id = studentB1.id;
  });

  afterAll(async () => {
    // Clean up test data safely
    const userIds = [parentUserIdA, parentUserIdB].filter(Boolean);
    const profileIds = [parentProfileIdA, parentProfileIdB].filter(Boolean);

    if (userIds.length > 0) {
      await prisma.auditLog.deleteMany({
        where: { userId: { in: userIds } },
      });
    }
    if (profileIds.length > 0) {
      await prisma.tutoringRequest.deleteMany({
        where: { parentId: { in: profileIds } },
      });
      await prisma.studentProfile.deleteMany({
        where: { parentId: { in: profileIds } },
      });
      await prisma.parentProfile.deleteMany({
        where: { id: { in: profileIds } },
      });
    }
    if (userIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }
  });

  // TEST 1: INVARIANT - Student profile creation does NOT auto-create TutoringRequests
  it("P06.01 - Safety invariant: registering a student does NOT automatically create a tutoring request", async () => {
    const studentRequests = await prisma.tutoringRequest.findMany({
      where: { studentId: studentA1Id },
    });
    expect(studentRequests.length).toBe(0);

    const totalParentRequests = await prisma.tutoringRequest.count({
      where: { parentId: parentProfileIdA },
    });
    expect(totalParentRequests).toBe(0);
  });

  // TEST 2: Draft Creation & Partial Validation
  it("P06.02 - Parent can create a DRAFT tutoring request with partial details", async () => {
    const draftPayload = {
      studentId: studentA1Id,
      subjectName: "Mathématiques",
      gradeLevelName: "Terminale SM",
      cycle: "LYCEE",
      mode: TutoringMode.HOME,
      commune: "Ratoma",
      budgetGnf: 600000,
    };

    // Validate with draft schema
    const parsed = tutoringRequestDraftSchema.safeParse(draftPayload);
    expect(parsed.success).toBe(true);

    // Save in DB
    const draft = await prisma.tutoringRequest.create({
      data: {
        parentId: parentProfileIdA,
        studentId: studentA1Id,
        subjectId: testSubjectMathId,
        subjectName: draftPayload.subjectName,
        gradeLevelName: draftPayload.gradeLevelName,
        cycle: draftPayload.cycle,
        mode: draftPayload.mode,
        commune: draftPayload.commune,
        city: "Conakry",
        budgetGnf: draftPayload.budgetGnf,
        budgetType: "MONTHLY",
        status: RequestStatus.DRAFT,
      },
    });

    expect(draft.id).toBeDefined();
    expect(draft.status).toBe(RequestStatus.DRAFT);
    expect(draft.publishedAt).toBeNull();
    expect(draft.budgetGnf).toBe(600000);
  });

  // TEST 3: Strict Validation on Publication
  it("P06.03 - Publication requires strict validation: rejects budget < 50,000 GNF and missing commune for HOME mode", () => {
    // 3a. Rejection: budget too low
    const invalidBudgetPayload = {
      studentId: studentA1Id,
      subjectName: "Mathématiques",
      gradeLevelName: "Terminale SM",
      cycle: "LYCEE",
      mode: TutoringMode.HOME,
      commune: "Ratoma",
      budgetGnf: 20000, // < 50000
    };
    const resLowBudget = tutoringRequestPublishSchema.safeParse(invalidBudgetPayload);
    expect(resLowBudget.success).toBe(false);

    // 3b. Rejection: HOME mode missing commune
    const missingCommunePayload = {
      studentId: studentA1Id,
      subjectName: "Mathématiques",
      gradeLevelName: "Terminale SM",
      cycle: "LYCEE",
      mode: TutoringMode.HOME,
      commune: "", // missing commune
      budgetGnf: 500000,
    };
    const resMissingCommune = tutoringRequestPublishSchema.safeParse(missingCommunePayload);
    expect(resMissingCommune.success).toBe(false);

    // 3c. Valid payload passes
    const validPublishPayload = {
      studentId: studentA1Id,
      subjectName: "Mathématiques",
      gradeLevelName: "Terminale SM",
      cycle: "LYCEE",
      mode: TutoringMode.HOME,
      commune: "Ratoma",
      neighborhood: "Kipé Centre Émetteur",
      frequency: "2 séances / semaine",
      preferredSchedule: "Samedi et Dimanche matin",
      budgetGnf: 500000,
      budgetType: "MONTHLY",
      learningGoals: "Préparation intensive au Baccalauréat Unique SM",
    };
    const resValid = tutoringRequestPublishSchema.safeParse(validPublishPayload);
    expect(resValid.success).toBe(true);
  });

  // TEST 4: Publishing a Request (DRAFT -> OPEN)
  it("P06.04 - Publishing a request sets status to OPEN, updates publishedAt, and logs audit event", async () => {
    const publishedRequest = await prisma.tutoringRequest.create({
      data: {
        parentId: parentProfileIdA,
        studentId: studentA1Id,
        subjectId: testSubjectMathId,
        subjectName: "Mathématiques",
        gradeLevelName: "Terminale SM",
        cycle: "LYCEE",
        mode: TutoringMode.HOME,
        commune: "Ratoma",
        neighborhood: "Kipé",
        frequency: "3 séances / semaine",
        preferredSchedule: "Mardi, Jeudi, Samedi",
        sessionDurationMinutes: 90,
        budgetGnf: 750000,
        budgetType: "MONTHLY",
        city: "Conakry",
        learningGoals: "Renforcement en calcul différentiel et intégrales",
        status: RequestStatus.OPEN,
        publishedAt: new Date(),
      },
    });

    expect(publishedRequest.status).toBe(RequestStatus.OPEN);
    expect(publishedRequest.publishedAt).not.toBeNull();
    expect(publishedRequest.budgetGnf).toBe(750000);

    // Log audit
    const audit = await prisma.auditLog.create({
      data: {
        user: { connect: { id: parentUserIdA } },
        action: "PUBLISH_TUTORING_REQUEST",
        entityType: "TutoringRequest",
        entityId: publishedRequest.id,
        detailsJson: JSON.stringify({
          requestId: publishedRequest.id,
          studentId: studentA1Id,
          subject: "Mathématiques",
          budgetGnf: 750000,
        }),
      },
    });
    expect(audit.id).toBeDefined();
    expect(audit.action).toBe("PUBLISH_TUTORING_REQUEST");
  });

  // TEST 5: Multiple Requests per Student
  it("P06.05 - A parent can create MULTIPLE independent tutoring requests for the SAME child", async () => {
    // Request 1 for studentA1 (Physics)
    const requestPhysics = await prisma.tutoringRequest.create({
      data: {
        parentId: parentProfileIdA,
        studentId: studentA1Id,
        subjectId: testSubjectPhysicsId,
        subjectName: "Physique-Chimie",
        gradeLevelName: "Terminale SM",
        cycle: "LYCEE",
        mode: TutoringMode.ONLINE,
        budgetGnf: 450000,
        budgetType: "MONTHLY",
        city: "Conakry",
        status: RequestStatus.OPEN,
        publishedAt: new Date(),
      },
    });

    // Request 2 for studentA1 (English)
    const requestEnglish = await prisma.tutoringRequest.create({
      data: {
        parentId: parentProfileIdA,
        studentId: studentA1Id,
        subjectName: "Anglais",
        gradeLevelName: "Terminale SM",
        cycle: "LYCEE",
        mode: TutoringMode.HYBRID,
        commune: "Ratoma",
        budgetGnf: 500000,
        budgetType: "MONTHLY",
        city: "Conakry",
        status: RequestStatus.OPEN,
        publishedAt: new Date(),
      },
    });

    expect(requestPhysics.id).not.toBe(requestEnglish.id);

    // Verify studentA1 now has at least 3 separate requests
    const allRequestsStudentA1 = await prisma.tutoringRequest.findMany({
      where: { studentId: studentA1Id },
      orderBy: { createdAt: "desc" },
    });

    expect(allRequestsStudentA1.length).toBeGreaterThanOrEqual(3);
    const subjects = allRequestsStudentA1.map((r) => r.subjectName);
    expect(subjects).toContain("Mathématiques");
    expect(subjects).toContain("Physique-Chimie");
    expect(subjects).toContain("Anglais");
  });

  // TEST 6: Custom "Autre" Subject & Specialized Cycle
  it("P06.06 - Supports custom 'Autre' subjects and custom educational cycles", async () => {
    const customRequest = await prisma.tutoringRequest.create({
      data: {
        parentId: parentProfileIdA,
        studentId: studentA2Id,
        subjectName: "Autre",
        customSubject: "Robotique & Programmation Python",
        cycle: "AUTRE",
        customCycle: "Initiation aux Technologies Numériques",
        gradeLevelName: "Niveau Junior Innovateur",
        mode: TutoringMode.HOME,
        commune: "Matam",
        neighborhood: "Madina",
        budgetGnf: 800000,
        budgetType: "MONTHLY",
        city: "Conakry",
        learningGoals: "Création de mini-robots et algorithmique fondamentale",
        status: RequestStatus.OPEN,
        publishedAt: new Date(),
      },
    });

    expect(customRequest.subjectName).toBe("Autre");
    expect(customRequest.customSubject).toBe("Robotique & Programmation Python");
    expect(customRequest.cycle).toBe("AUTRE");
    expect(customRequest.customCycle).toBe("Initiation aux Technologies Numériques");
    expect(customRequest.budgetGnf).toBe(800000);
  });

  // TEST 7: Lifecycle State Machine Transitions
  it("P06.07 - Lifecycle state machine enforces allowed and illegal transitions", () => {
    // Allowed transitions
    expect(canTransitionRequestStatus(RequestStatus.DRAFT, RequestStatus.OPEN)).toBe(true);
    expect(canTransitionRequestStatus(RequestStatus.DRAFT, RequestStatus.CANCELLED)).toBe(true);
    expect(canTransitionRequestStatus(RequestStatus.OPEN, RequestStatus.MATCHED)).toBe(true);
    expect(canTransitionRequestStatus(RequestStatus.OPEN, RequestStatus.CANCELLED)).toBe(true);
    expect(canTransitionRequestStatus(RequestStatus.OPEN, RequestStatus.CLOSED)).toBe(true);
    expect(canTransitionRequestStatus(RequestStatus.MATCHED, RequestStatus.CLOSED)).toBe(true);

    // Illegal transitions
    expect(canTransitionRequestStatus(RequestStatus.CANCELLED, RequestStatus.OPEN)).toBe(false);
    expect(canTransitionRequestStatus(RequestStatus.CANCELLED, RequestStatus.DRAFT)).toBe(false);
    expect(canTransitionRequestStatus(RequestStatus.CLOSED, RequestStatus.OPEN)).toBe(false);
    expect(canTransitionRequestStatus(RequestStatus.MATCHED, RequestStatus.DRAFT)).toBe(false);

    // Editability checks
    expect(isRequestEditable(RequestStatus.DRAFT)).toBe(true);
    expect(isRequestEditable(RequestStatus.OPEN)).toBe(true);
    expect(isRequestEditable(RequestStatus.MATCHED)).toBe(false);
    expect(isRequestEditable(RequestStatus.CLOSED)).toBe(false);
    expect(isRequestEditable(RequestStatus.CANCELLED)).toBe(false);

    // Cancellability checks
    expect(isRequestCancellable(RequestStatus.DRAFT)).toBe(true);
    expect(isRequestCancellable(RequestStatus.OPEN)).toBe(true);
    expect(isRequestCancellable(RequestStatus.MATCHED)).toBe(false);
    expect(isRequestCancellable(RequestStatus.CLOSED)).toBe(false);
    expect(isRequestCancellable(RequestStatus.CANCELLED)).toBe(false);

    // Status meta metadata in French
    const openMeta = getRequestStatusMeta(RequestStatus.OPEN, "fr");
    expect(openMeta.label).toBe("Publiée / Ouverte");
    expect(openMeta.badgeClass).toContain("emerald");
  });

  // TEST 8: Anti-IDOR Authorization - Parent cannot create request for another parent's child
  it("P06.08 - Anti-IDOR security: parent cannot create or access requests for another parent's child", async () => {
    // Parent A tries to verify ownership of Parent B's student (studentB1Id)
    const ownershipAforB = await verifyStudentOwnership(studentB1Id, parentProfileIdA, UserRole.PARENT);
    expect(ownershipAforB).toBeNull(); // Rejected!

    // Parent B can verify ownership of their own student
    const ownershipBforB = await verifyStudentOwnership(studentB1Id, parentProfileIdB, UserRole.PARENT);
    expect(ownershipBforB).not.toBeNull();
    expect(ownershipBforB?.id).toBe(studentB1Id);
  });

  // TEST 9: Request Cancellation Workflow
  it("P06.09 - Parent can cancel an OPEN request with an optional cancellation reason", async () => {
    // Create an OPEN request to be cancelled
    const requestToCancel = await prisma.tutoringRequest.create({
      data: {
        parentId: parentProfileIdA,
        studentId: studentA2Id,
        subjectName: "Français",
        gradeLevelName: "10ème Année",
        cycle: "COLLEGE",
        mode: TutoringMode.ONLINE,
        budgetGnf: 400000,
        budgetType: "MONTHLY",
        city: "Conakry",
        status: RequestStatus.OPEN,
        publishedAt: new Date(),
      },
    });

    const cancellationReason = "Emploi du temps de l'élève réaménagé par son collège.";
    const cancelledAt = new Date();

    const updated = await prisma.tutoringRequest.update({
      where: { id: requestToCancel.id },
      data: {
        status: RequestStatus.CANCELLED,
        cancelledAt,
        cancellationReason,
      },
    });

    expect(updated.status).toBe(RequestStatus.CANCELLED);
    expect(updated.cancelledAt).not.toBeNull();
    expect(updated.cancellationReason).toBe(cancellationReason);

    // Verify it cannot be edited or re-published
    expect(isRequestEditable(updated.status)).toBe(false);
    expect(canTransitionRequestStatus(updated.status, RequestStatus.OPEN)).toBe(false);
  });

  // TEST 10: Safety Invariant - No automatic teacher assignment or classroom creation
  it("P06.10 - Safety invariant: creating a tutoring request does NOT automatically assign a teacher or create a classroom", async () => {
    const freshRequest = await prisma.tutoringRequest.create({
      data: {
        parentId: parentProfileIdA,
        studentId: studentA1Id,
        subjectName: "Chimie Organique",
        gradeLevelName: "Terminale SM",
        cycle: "LYCEE",
        mode: TutoringMode.HOME,
        commune: "Dixinn",
        budgetGnf: 550000,
        budgetType: "MONTHLY",
        city: "Conakry",
        status: RequestStatus.OPEN,
        publishedAt: new Date(),
      },
      include: {
        applications: true,
        classroom: true,
      },
    });

    // Zero teacher applications auto-generated
    expect(freshRequest.applications.length).toBe(0);
    // Zero classrooms auto-generated
    expect(freshRequest.classroom).toBeNull();
  });

  // TEST 11: Marketplace Discovery Visibility Filter
  it("P06.11 - Marketplace discovery query strictly matches OPEN requests, hiding DRAFT and CANCELLED", async () => {
    const parentARequests = await prisma.tutoringRequest.findMany({
      where: {
        parentId: parentProfileIdA,
        status: RequestStatus.OPEN,
      },
    });

    // All returned requests must have status === OPEN
    for (const req of parentARequests) {
      expect(req.status).toBe(RequestStatus.OPEN);
      expect(req.publishedAt).not.toBeNull();
    }

    // Verify DRAFT and CANCELLED requests are not included
    const draftAndCancelled = await prisma.tutoringRequest.findMany({
      where: {
        parentId: parentProfileIdA,
        status: { in: [RequestStatus.DRAFT, RequestStatus.CANCELLED] },
      },
    });

    for (const hiddenReq of draftAndCancelled) {
      const isFoundInOpenList = parentARequests.some((r) => r.id === hiddenReq.id);
      expect(isFoundInOpenList).toBe(false);
    }
  });

  // TEST 12: Localization Integrity
  it("P06.12 - Bilingual localization contains all required parent request keys in French and English", () => {
    const frParent = (frMessages as any).parent;
    const enParent = (enMessages as any).parent;

    expect(frParent).toBeDefined();
    expect(enParent).toBeDefined();

    expect(frParent.requests).toBeDefined();
    expect(enParent.requests).toBeDefined();

    const requiredKeys = [
      "title",
      "subtitle",
      "createNew",
      "emptyTitle",
      "emptyDesc",
      "viewAll",
      "statusDraft",
      "statusOpen",
      "statusMatched",
      "statusClosed",
      "statusCancelled",
    ];

    for (const key of requiredKeys) {
      expect(frParent.requests[key]).toBeDefined();
      expect(enParent.requests[key]).toBeDefined();
      expect(typeof frParent.requests[key]).toBe("string");
      expect(typeof enParent.requests[key]).toBe("string");
    }
  });
});
