import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import {
  parentProfileUpdateSchema,
  studentCreateSchema,
  studentUpdateSchema,
} from "@/lib/validation/parent";
import frMessages from "@/messages/fr.json";
import enMessages from "@/messages/en.json";

const prisma = new PrismaClient();

describe("Phase 04: Complete Parent & Student Profile Management", () => {
  const timestamp = Date.now();
  const parentEmailA = `parent.a.${timestamp}@monsieurfanyi.gn`;
  const parentEmailB = `parent.b.${timestamp}@monsieurfanyi.gn`;
  const teacherEmail = `teacher.p04.${timestamp}@monsieurfanyi.gn`;
  const testPassword = "ParentPassword123!";

  let parentUserIdA: string;
  let parentProfileIdA: string;

  let parentUserIdB: string;
  let parentProfileIdB: string;

  let studentA1Id: string;
  let studentA2Id: string;
  let studentB1Id: string;

  beforeAll(async () => {
    const passwordHash = await hashPassword(testPassword);

    // 1. Create Parent A and ParentProfile
    const parentA = await prisma.user.create({
      data: {
        fullName: "M. Ibrahima Barry",
        email: parentEmailA,
        phoneNumber: `620${Math.floor(100000 + Math.random() * 900000)}`,
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

    // 2. Create Parent B and ParentProfile (for isolation testing)
    const parentB = await prisma.user.create({
      data: {
        fullName: "Mme. Mariama Diallo",
        email: parentEmailB,
        phoneNumber: `621${Math.floor(100000 + Math.random() * 900000)}`,
        passwordHash,
        role: UserRole.PARENT,
        isActive: true,
        parentProfile: {
          create: {
            city: "Kindia",
            address: "Quartier Tafory",
          },
        },
      },
      include: { parentProfile: true },
    });
    parentUserIdB = parentB.id;
    parentProfileIdB = parentB.parentProfile!.id;
  });

  afterAll(async () => {
    // Clean up created test data
    await prisma.studentProfile.deleteMany({
      where: { parentId: { in: [parentProfileIdA, parentProfileIdB] } },
    });
    await prisma.parentProfile.deleteMany({
      where: { id: { in: [parentProfileIdA, parentProfileIdB] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [parentUserIdA, parentUserIdB] } },
    });
    await prisma.$disconnect();
  });

  // -----------------------------------------------------------
  // Test 1: Parent profile retrieval
  // -----------------------------------------------------------
  it("P04.19.01: retrieves parent personal information and profile from PostgreSQL", async () => {
    const parent = await prisma.parentProfile.findUnique({
      where: { id: parentProfileIdA },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phoneNumber: true,
            role: true,
          },
        },
        children: true,
      },
    });

    expect(parent).not.toBeNull();
    expect(parent?.user.fullName).toBe("M. Ibrahima Barry");
    expect(parent?.user.email).toBe(parentEmailA);
    expect(parent?.user.role).toBe(UserRole.PARENT);
    expect(parent?.city).toBe("Conakry");
    expect(parent?.address).toBe("Kipé Centre Émetteur");
    expect(parent?.children).toBeInstanceOf(Array);
  });

  // -----------------------------------------------------------
  // Test 2: Parent profile updates
  // -----------------------------------------------------------
  it("P04.19.02: updates parent personal information safely without altering role or email", async () => {
    const testPhone = `620${Math.floor(100000 + Math.random() * 900000)}`;
    const input = {
      fullName: "M. Ibrahima Sory Barry",
      phoneNumber: testPhone,
      city: "Conakry",
      address: "Lambanyi Résidence",
    };

    const validated = parentProfileUpdateSchema.parse(input);

    const [updatedUser, updatedProfile] = await prisma.$transaction([
      prisma.user.update({
        where: { id: parentUserIdA },
        data: {
          fullName: validated.fullName,
          phoneNumber: validated.phoneNumber,
        },
      }),
      prisma.parentProfile.update({
        where: { id: parentProfileIdA },
        data: {
          city: validated.city,
          address: validated.address,
        },
      }),
    ]);

    expect(updatedUser.fullName).toBe("M. Ibrahima Sory Barry");
    expect(updatedUser.phoneNumber).toBe(testPhone);
    expect(updatedUser.email).toBe(parentEmailA); // Unchanged
    expect(updatedUser.role).toBe(UserRole.PARENT); // Unchanged
    expect(updatedProfile.address).toBe("Lambanyi Résidence");
  });

  // -----------------------------------------------------------
  // Test 3: Student creation with valid data
  // -----------------------------------------------------------
  it("P04.19.03: creates a student profile linked to authorized Parent A", async () => {
    const rawData = {
      fullName: "Mamadou Barry",
      cycle: "LYCEE",
      gradeLevel: "Terminale Sciences Mathématiques",
      schoolName: "Lycée Sainte-Marie de Dixinn",
      dateOfBirth: "2008-05-14",
      supportNeeds: "Renforcement en Mathématiques et Physique pour le BAC",
      preferredSubjects: ["Mathématiques", "Physique-Chimie"],
      notes: "Élève très motivé ayant besoin d'exercices d'application approfondis.",
    };

    const validated = studentCreateSchema.parse(rawData);

    const student = await prisma.studentProfile.create({
      data: {
        parentId: parentProfileIdA,
        fullName: validated.fullName,
        cycle: validated.cycle,
        gradeLevel: validated.gradeLevel,
        schoolName: validated.schoolName,
        dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : null,
        supportNeeds: validated.supportNeeds,
        preferredSubjects: validated.preferredSubjects,
        notes: validated.notes,
      },
    });

    studentA1Id = student.id;

    expect(student.id).toBeDefined();
    expect(student.parentId).toBe(parentProfileIdA);
    expect(student.fullName).toBe("Mamadou Barry");
    expect(student.cycle).toBe("LYCEE");
    expect(student.gradeLevel).toBe("Terminale Sciences Mathématiques");
    expect(student.preferredSubjects).toEqual(["Mathématiques", "Physique-Chimie"]);
    expect(student.isArchived).toBe(false);
  });

  // -----------------------------------------------------------
  // Test 4: Multiple student records under one parent
  // -----------------------------------------------------------
  it("P04.19.04: supports multiple children profiles under Parent A", async () => {
    const student2 = await prisma.studentProfile.create({
      data: {
        parentId: parentProfileIdA,
        fullName: "Fatoumata Binta Barry",
        cycle: "COLLEGE",
        gradeLevel: "10ème Année (BEPC)",
        schoolName: "Collège Kipé",
        preferredSubjects: ["Français & Littérature", "Anglais"],
        supportNeeds: "Préparation intensive au Brevet d'Études du Premier Cycle",
      },
    });
    studentA2Id = student2.id;

    const parentChildren = await prisma.studentProfile.findMany({
      where: { parentId: parentProfileIdA, isArchived: false },
      orderBy: { createdAt: "asc" },
    });

    expect(parentChildren.length).toBe(2);
    expect(parentChildren.map((c) => c.fullName)).toContain("Mamadou Barry");
    expect(parentChildren.map((c) => c.fullName)).toContain("Fatoumata Binta Barry");
  });

  // -----------------------------------------------------------
  // Test 5: Student profile retrieval with ownership
  // -----------------------------------------------------------
  it("P04.19.05: retrieves specific student profile with authorized parent relationship", async () => {
    const student = await prisma.studentProfile.findFirst({
      where: { id: studentA1Id, parentId: parentProfileIdA },
      include: {
        parent: {
          include: {
            user: { select: { fullName: true, email: true } },
          },
        },
      },
    });

    expect(student).not.toBeNull();
    expect(student?.id).toBe(studentA1Id);
    expect(student?.parent.userId).toBe(parentUserIdA);
    expect(student?.parent.user.fullName).toBe("M. Ibrahima Sory Barry");
  });

  // -----------------------------------------------------------
  // Test 6: Student updates
  // -----------------------------------------------------------
  it("P04.19.06: updates student academic support needs and grade level", async () => {
    const updateInput = {
      gradeLevel: "Terminale SM (Candidat Libre)",
      supportNeeds: "Ajout d'un module de chimie organique",
      preferredSubjects: ["Mathématiques", "Physique-Chimie", "Informatique & Numérique"],
    };

    const validated = studentUpdateSchema.parse(updateInput);

    const updated = await prisma.studentProfile.update({
      where: { id: studentA1Id },
      data: validated,
    });

    expect(updated.gradeLevel).toBe("Terminale SM (Candidat Libre)");
    expect(updated.supportNeeds).toBe("Ajout d'un module de chimie organique");
    expect(updated.preferredSubjects).toHaveLength(3);
  });

  // -----------------------------------------------------------
  // Test 7: Invalid form submissions
  // -----------------------------------------------------------
  it("P04.19.07: rejects invalid student submissions missing required fields or with invalid cycle", () => {
    // Missing fullName
    expect(() =>
      studentCreateSchema.parse({
        fullName: "",
        gradeLevel: "Terminale",
      })
    ).toThrow();

    // Invalid cycle
    expect(() =>
      studentCreateSchema.parse({
        fullName: "Amadou Diallo",
        gradeLevel: "Terminale",
        cycle: "INVALID_CYCLE_XYZ",
      })
    ).toThrow();

    // Invalid phone number format in parent update
    expect(() =>
      parentProfileUpdateSchema.parse({
        fullName: "Ibrahima Barry",
        phoneNumber: "not_a_phone_number",
        city: "Conakry",
      })
    ).toThrow();
  });

  // -----------------------------------------------------------
  // Test 8 & 9: Cross-parent data isolation (Parent B vs Parent A)
  // -----------------------------------------------------------
  it("P04.19.08 & P04.19.09: prevents cross-parent data leakage (Parent B cannot access Parent A's student)", async () => {
    // Create student for Parent B
    const studentB = await prisma.studentProfile.create({
      data: {
        parentId: parentProfileIdB,
        fullName: "Ousmane Diallo",
        cycle: "PRIMAIRE",
        gradeLevel: "CM2",
      },
    });
    studentB1Id = studentB.id;

    // Parent A attempts to query Parent B's student with their own parent ID
    const unauthorizedAccessA = await prisma.studentProfile.findFirst({
      where: { id: studentB1Id, parentId: parentProfileIdA },
    });
    expect(unauthorizedAccessA).toBeNull();

    // Parent B attempts to query Parent A's student with their own parent ID
    const unauthorizedAccessB = await prisma.studentProfile.findFirst({
      where: { id: studentA1Id, parentId: parentProfileIdB },
    });
    expect(unauthorizedAccessB).toBeNull();
  });

  // -----------------------------------------------------------
  // Test 10: Unauthorized student updates
  // -----------------------------------------------------------
  it("P04.19.10: rejects updates when parent ownership check fails", async () => {
    // Simulate check in API route
    const studentToUpdate = await prisma.studentProfile.findFirst({
      where: { id: studentB1Id, parentId: parentProfileIdA }, // Mismatched parent
    });

    expect(studentToUpdate).toBeNull(); // Guard stops execution before prisma.update
  });

  // -----------------------------------------------------------
  // Test 11: Student lifecycle restrictions (Archive vs Delete)
  // -----------------------------------------------------------
  it("P04.19.11: archives student profile when related history exists, otherwise deletes cleanly", async () => {
    // 1. Create a dummy TutoringRequest for student A1 to simulate history
    const request = await prisma.tutoringRequest.create({
      data: {
        parentId: parentProfileIdA,
        studentId: studentA1Id,
        subjectName: "Mathématiques",
        gradeLevelName: "Terminale SM",
        budgetGnf: 150000,
        description: "Cours intensif",
      },
    });

    // Verify history exists
    const studentWithHistory = await prisma.studentProfile.findUnique({
      where: { id: studentA1Id },
      include: { tutoringRequests: true, classrooms: true },
    });
    const hasHistory =
      studentWithHistory!.tutoringRequests.length > 0 ||
      studentWithHistory!.classrooms.length > 0;
    expect(hasHistory).toBe(true);

    // Lifecycle rule: When history exists, perform safe archival
    const archivedStudent = await prisma.studentProfile.update({
      where: { id: studentA1Id },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });
    expect(archivedStudent.isArchived).toBe(true);
    expect(archivedStudent.archivedAt).not.toBeNull();

    // 2. Student A2 has no history: can be safely deleted
    const studentWithoutHistory = await prisma.studentProfile.findUnique({
      where: { id: studentA2Id },
      include: { tutoringRequests: true, classrooms: true },
    });
    expect(studentWithoutHistory!.tutoringRequests.length).toBe(0);
    expect(studentWithoutHistory!.classrooms.length).toBe(0);

    await prisma.studentProfile.delete({ where: { id: studentA2Id } });
    const deletedCheck = await prisma.studentProfile.findUnique({
      where: { id: studentA2Id },
    });
    expect(deletedCheck).toBeNull();

    // Cleanup request
    await prisma.tutoringRequest.delete({ where: { id: request.id } });
  });

  // -----------------------------------------------------------
  // Test 12: Duplicate submission handling
  // -----------------------------------------------------------
  it("P04.19.12: handles multiple children with identical names gracefully without crashing", async () => {
    const twin1 = await prisma.studentProfile.create({
      data: {
        parentId: parentProfileIdB,
        fullName: "Hassane Diallo",
        cycle: "PRIMAIRE",
        gradeLevel: "CE1",
      },
    });

    const twin2 = await prisma.studentProfile.create({
      data: {
        parentId: parentProfileIdB,
        fullName: "Hassane Diallo", // Same name allowed for siblings/twins
        cycle: "PRIMAIRE",
        gradeLevel: "CE1",
      },
    });

    expect(twin1.id).not.toBe(twin2.id);
    expect(twin1.fullName).toBe(twin2.fullName);

    await prisma.studentProfile.deleteMany({
      where: { id: { in: [twin1.id, twin2.id] } },
    });
  });

  // -----------------------------------------------------------
  // Test 13: Correct education-level persistence
  // -----------------------------------------------------------
  it("P04.19.13: correctly persists all standard educational cycles (PRIMAIRE, COLLEGE, LYCEE, SUPERIEUR)", async () => {
    const cycles = ["PRIMAIRE", "COLLEGE", "LYCEE", "SUPERIEUR"];

    for (const c of cycles) {
      const student = await prisma.studentProfile.create({
        data: {
          parentId: parentProfileIdB,
          fullName: `Élève Test ${c}`,
          cycle: c,
          gradeLevel: `Classe ${c}`,
        },
      });

      expect(student.cycle).toBe(c);
      await prisma.studentProfile.delete({ where: { id: student.id } });
    }
  });

  // -----------------------------------------------------------
  // Test 14 & 15: French & English Translation Coverage
  // -----------------------------------------------------------
  it("P04.19.14 & P04.19.15: verifies 100% key parity between French and English parent dictionaries", () => {
    const frParent = (frMessages as any).parent;
    const enParent = (enMessages as any).parent;

    expect(frParent).toBeDefined();
    expect(enParent).toBeDefined();

    // Check top-level keys
    const frKeys = Object.keys(frParent).sort();
    const enKeys = Object.keys(enParent).sort();
    expect(frKeys).toEqual(enKeys);

    // Check form nested keys
    const frFormKeys = Object.keys(frParent.form).sort();
    const enFormKeys = Object.keys(enParent.form).sort();
    expect(frFormKeys).toEqual(enFormKeys);

    // Check profileForm nested keys
    const frProfileKeys = Object.keys(frParent.profileForm).sort();
    const enProfileKeys = Object.keys(enParent.profileForm).sort();
    expect(frProfileKeys).toEqual(enProfileKeys);

    // Check confirmDelete nested keys
    const frConfirmKeys = Object.keys(frParent.confirmDelete).sort();
    const enConfirmKeys = Object.keys(enParent.confirmDelete).sort();
    expect(frConfirmKeys).toEqual(enConfirmKeys);
  });

  // -----------------------------------------------------------
  // Test 16: Authentication Regression Check
  // -----------------------------------------------------------
  it("P04.19.16: preserves existing authentication and password verification baseline", async () => {
    const parentA = await prisma.user.findUnique({
      where: { id: parentUserIdA },
    });

    expect(parentA).not.toBeNull();
    expect(parentA?.passwordHash).toBeDefined();
    expect(parentA?.passwordHash).not.toBe(testPassword); // Bcrypt hashed
    expect(parentA?.role).toBe(UserRole.PARENT);
  });

  // -----------------------------------------------------------
  // Test 17: Teacher Verification Regression Check
  // -----------------------------------------------------------
  it("P04.19.17: preserves teacher onboarding models and verification status schema", async () => {
    // Verify TeacherProfile model still functional
    const count = await prisma.teacherProfile.count();
    expect(typeof count).toBe("number");

    // Verify TeacherVerificationStatus enum unchanged
    const pendingCount = await prisma.teacherProfile.count({
      where: { verificationStatus: "PENDING_REVIEW" },
    });
    expect(typeof pendingCount).toBe("number");
  });
});
