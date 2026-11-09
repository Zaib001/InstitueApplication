import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient, UserRole, TeacherVerificationStatus } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { verifyStudentOwnership } from "@/lib/auth/parent-guard";
import {
  verifyTeacherStudentAccess,
  getTeacherAssignedStudents,
} from "@/lib/auth/teacher-guard";
import {
  studentCreateSchema,
  studentUpdateSchema,
} from "@/lib/validation/parent";
import frMessages from "@/messages/fr.json";
import enMessages from "@/messages/en.json";

const prisma = new PrismaClient();

describe("Phase 05: Milestone 1 Remediation, Marketplace Architecture & Data Foundations", () => {
  const timestamp = Date.now();
  const testPassword = "RemediationPassword2026!";

  // Parent A & B
  const parentEmailA = `parent.p05.a.${timestamp}@monsieurfanyi.gn`;
  const parentEmailB = `parent.p05.b.${timestamp}@monsieurfanyi.gn`;

  let parentUserIdA: string;
  let parentProfileIdA: string;
  let parentUserIdB: string;
  let parentProfileIdB: string;

  let studentA1Id: string;
  let studentB1Id: string;

  // Teacher A & B
  const teacherEmailA = `teacher.p05.a.${timestamp}@monsieurfanyi.gn`;
  const teacherEmailB = `teacher.p05.b.${timestamp}@monsieurfanyi.gn`;

  let teacherUserIdA: string;
  let teacherProfileIdA: string;
  let teacherUserIdB: string;
  let teacherProfileIdB: string;

  beforeAll(async () => {
    const passwordHash = await hashPassword(testPassword);

    // 1. Create Parent A & ParentProfile
    const parentA = await prisma.user.create({
      data: {
        fullName: "Amadou Bah (Parent A)",
        email: parentEmailA,
        phoneNumber: `620${Math.floor(100000 + Math.random() * 900000)}`,
        passwordHash,
        role: UserRole.PARENT,
        isActive: true,
        parentProfile: {
          create: {
            city: "Conakry",
            address: "Ratoma Centre",
          },
        },
      },
      include: { parentProfile: true },
    });
    parentUserIdA = parentA.id;
    parentProfileIdA = parentA.parentProfile!.id;

    // 2. Create Parent B & ParentProfile
    const parentB = await prisma.user.create({
      data: {
        fullName: "Fatoumata Binta Diallo (Parent B)",
        email: parentEmailB,
        phoneNumber: `621${Math.floor(100000 + Math.random() * 900000)}`,
        passwordHash,
        role: UserRole.PARENT,
        isActive: true,
        parentProfile: {
          create: {
            city: "Kindia",
            address: "Carrefour Yole",
          },
        },
      },
      include: { parentProfile: true },
    });
    parentUserIdB = parentB.id;
    parentProfileIdB = parentB.parentProfile!.id;

    // 3. Create Student under Parent A
    const studentA = await prisma.studentProfile.create({
      data: {
        parentId: parentProfileIdA,
        fullName: "Kadiatou Bah",
        cycle: "LYCEE",
        gradeLevel: "Terminale SM",
        preferredSubjects: ["Mathématiques", "Physique-Chimie"],
      },
    });
    studentA1Id = studentA.id;

    // 4. Create Student under Parent B
    const studentB = await prisma.studentProfile.create({
      data: {
        parentId: parentProfileIdB,
        fullName: "Thierno Oumar Diallo",
        cycle: "COLLEGE",
        gradeLevel: "10ème Année",
        preferredSubjects: ["Français & Littérature"],
      },
    });
    studentB1Id = studentB.id;

    // 5. Create Teacher A & TeacherProfile (newly registered)
    const teacherA = await prisma.user.create({
      data: {
        fullName: "Dr. Alpha Oumar Sow (Teacher A)",
        email: teacherEmailA,
        phoneNumber: `622${Math.floor(100000 + Math.random() * 900000)}`,
        passwordHash,
        role: UserRole.TEACHER,
        isActive: true,
        teacherProfile: {
          create: {
            city: "Conakry",
            headline: "Docteur en Physique Théorique",
            verificationStatus: TeacherVerificationStatus.APPROVED,
            hourlyRateGnf: 150000,
            monthlyPackageRateGnf: 1200000,
          },
        },
      },
      include: { teacherProfile: true },
    });
    teacherUserIdA = teacherA.id;
    teacherProfileIdA = teacherA.teacherProfile!.id;

    // 6. Create Teacher B & TeacherProfile (newly registered)
    const teacherB = await prisma.user.create({
      data: {
        fullName: "M. Sekou Camara (Teacher B)",
        email: teacherEmailB,
        phoneNumber: `623${Math.floor(100000 + Math.random() * 900000)}`,
        passwordHash,
        role: UserRole.TEACHER,
        isActive: true,
        teacherProfile: {
          create: {
            city: "Conakry",
            headline: "Professeur de Mathématiques",
            verificationStatus: TeacherVerificationStatus.APPROVED,
            hourlyRateGnf: 120000,
            monthlyPackageRateGnf: 960000,
          },
        },
      },
      include: { teacherProfile: true },
    });
    teacherUserIdB = teacherB.id;
    teacherProfileIdB = teacherB.teacherProfile!.id;
  });

  afterAll(async () => {
    // Clean up created test data
    await prisma.auditLog.deleteMany({
      where: {
        userId: {
          in: [parentUserIdA, parentUserIdB, teacherUserIdA, teacherUserIdB],
        },
      },
    });
    await prisma.studentProfile.deleteMany({
      where: { id: { in: [studentA1Id, studentB1Id] } },
    });
    await prisma.parentProfile.deleteMany({
      where: { id: { in: [parentProfileIdA, parentProfileIdB] } },
    });
    await prisma.teacherProfile.deleteMany({
      where: { id: { in: [teacherProfileIdA, teacherProfileIdB] } },
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [parentUserIdA, parentUserIdB, teacherUserIdA, teacherUserIdB] },
      },
    });
    await prisma.$disconnect();
  });

  // -----------------------------------------------------------
  // Test 01: Newly registered teachers initially have 0 students
  // -----------------------------------------------------------
  it("P05.15.01: newly registered Teacher A and Teacher B initially have 0 assigned students", async () => {
    const studentsA = await getTeacherAssignedStudents(teacherProfileIdA);
    const studentsB = await getTeacherAssignedStudents(teacherProfileIdB);

    expect(studentsA).toHaveLength(0);
    expect(studentsB).toHaveLength(0);
  });

  // -----------------------------------------------------------
  // Test 02: Teacher cannot view unrelated students (access denied)
  // -----------------------------------------------------------
  it("P05.15.02: teacher cannot view unrelated students without authorized classroom", async () => {
    // Teacher A tries to view Parent A's student without an authorized classroom
    const accessA = await verifyTeacherStudentAccess(
      teacherProfileIdA,
      studentA1Id,
      UserRole.TEACHER
    );
    expect(accessA).toBeNull();

    // Teacher B tries to view Parent B's student without an authorized classroom
    const accessB = await verifyTeacherStudentAccess(
      teacherProfileIdB,
      studentB1Id,
      UserRole.TEACHER
    );
    expect(accessB).toBeNull();
  });

  // -----------------------------------------------------------
  // Test 03: Parent cannot view another parent's children
  // -----------------------------------------------------------
  it("P05.15.03: parent cannot view another parent's children (horizontal privilege escalation blocked)", async () => {
    // Parent A can access their own child
    const ownStudent = await verifyStudentOwnership(
      studentA1Id,
      parentProfileIdA,
      UserRole.PARENT
    );
    expect(ownStudent).not.toBeNull();
    expect(ownStudent?.id).toBe(studentA1Id);

    // Parent A CANNOT access Parent B's child
    const unauthorizedStudent = await verifyStudentOwnership(
      studentB1Id,
      parentProfileIdA,
      UserRole.PARENT
    );
    expect(unauthorizedStudent).toBeNull();

    // Parent B CANNOT access Parent A's child
    const unauthorizedStudentB = await verifyStudentOwnership(
      studentA1Id,
      parentProfileIdB,
      UserRole.PARENT
    );
    expect(unauthorizedStudentB).toBeNull();
  });

  // -----------------------------------------------------------
  // Test 04: Custom subject selection works
  // -----------------------------------------------------------
  it("P05.15.04: custom subject selection validates properly with non-empty string", () => {
    const validData = {
      fullName: "Mamadou Custom Student",
      cycle: "LYCEE",
      gradeLevel: "11ème Sciences Expérimentales",
      preferredSubjects: ["Autre"],
      customSubject: "Russe & Littérature Slave",
    };

    const parsed = studentCreateSchema.parse(validData);
    expect(parsed.customSubject).toBe("Russe & Littérature Slave");
    expect(parsed.preferredSubjects).toContain("Autre");
  });

  // -----------------------------------------------------------
  // Test 05: Custom subject persists in PostgreSQL
  // -----------------------------------------------------------
  it("P05.15.05: custom subject persists in database StudentProfile record", async () => {
    const studentWithCustom = await prisma.studentProfile.create({
      data: {
        parentId: parentProfileIdA,
        fullName: "Aissatou Barry",
        cycle: "LYCEE",
        gradeLevel: "12ème SM",
        preferredSubjects: ["Autre", "Mathématiques"],
        customSubject: "Robotique & Arduino",
      },
    });

    try {
      const fetched = await prisma.studentProfile.findUnique({
        where: { id: studentWithCustom.id },
      });

      expect(fetched).not.toBeNull();
      expect(fetched?.customSubject).toBe("Robotique & Arduino");
      expect(fetched?.preferredSubjects).toContain("Autre");
    } finally {
      await prisma.studentProfile.delete({ where: { id: studentWithCustom.id } });
    }
  });

  // -----------------------------------------------------------
  // Test 06: Custom subject can be edited
  // -----------------------------------------------------------
  it("P05.15.06: custom subject can be updated and preserved on edit", async () => {
    const student = await prisma.studentProfile.create({
      data: {
        parentId: parentProfileIdA,
        fullName: "Test Edit Student",
        cycle: "LYCEE",
        gradeLevel: "11ème SM",
        preferredSubjects: ["Autre"],
        customSubject: "Comptabilité Générale",
      },
    });

    try {
      // Update custom subject
      const updateData = {
        customSubject: "Comptabilité et Gestion Financière OHADA",
      };
      const parsed = studentUpdateSchema.parse(updateData);

      const updated = await prisma.studentProfile.update({
        where: { id: student.id },
        data: { customSubject: parsed.customSubject },
      });

      expect(updated.customSubject).toBe("Comptabilité et Gestion Financière OHADA");
    } finally {
      await prisma.studentProfile.delete({ where: { id: student.id } });
    }
  });

  // -----------------------------------------------------------
  // Test 07: Empty custom subject is rejected when "Autre" selected
  // -----------------------------------------------------------
  it("P05.15.07: empty or whitespace custom subject is rejected when 'Autre' is selected", () => {
    const invalidData1 = {
      fullName: "Invalid Student",
      cycle: "LYCEE",
      gradeLevel: "10ème Année",
      preferredSubjects: ["Autre"],
      customSubject: "",
    };

    expect(() => studentCreateSchema.parse(invalidData1)).toThrow();

    const invalidData2 = {
      fullName: "Invalid Student 2",
      cycle: "LYCEE",
      gradeLevel: "10ème Année",
      preferredSubjects: ["Autre"],
      customSubject: "   ",
    };

    expect(() => studentCreateSchema.parse(invalidData2)).toThrow();
  });

  // -----------------------------------------------------------
  // Test 08: Custom educational cycle can be saved
  // -----------------------------------------------------------
  it("P05.15.08: custom educational cycle validates properly with 'AUTRE' cycle", () => {
    const validData = {
      fullName: "Professional Student",
      cycle: "AUTRE",
      customCycle: "Formation Professionnelle BTS Électromécanique",
      gradeLevel: "1ère Année Brevet",
      preferredSubjects: ["Mathématiques"],
    };

    const parsed = studentCreateSchema.parse(validData);
    expect(parsed.cycle).toBe("AUTRE");
    expect(parsed.customCycle).toBe("Formation Professionnelle BTS Électromécanique");
  });

  // -----------------------------------------------------------
  // Test 09: Custom educational cycle persists in PostgreSQL
  // -----------------------------------------------------------
  it("P05.15.09: custom educational cycle persists in database StudentProfile record", async () => {
    const student = await prisma.studentProfile.create({
      data: {
        parentId: parentProfileIdB,
        fullName: "Ibrahima Sory Diallo",
        cycle: "AUTRE",
        customCycle: "Programme d'Alphabétisation Fonctionnelle Adulte",
        gradeLevel: "Module 2",
        preferredSubjects: ["Français & Littérature"],
      },
    });

    try {
      const fetched = await prisma.studentProfile.findUnique({
        where: { id: student.id },
      });

      expect(fetched).not.toBeNull();
      expect(fetched?.cycle).toBe("AUTRE");
      expect(fetched?.customCycle).toBe("Programme d'Alphabétisation Fonctionnelle Adulte");
    } finally {
      await prisma.studentProfile.delete({ where: { id: student.id } });
    }
  });

  // -----------------------------------------------------------
  // Test 10: Teacher onboarding accepts custom fields
  // -----------------------------------------------------------
  it("P05.15.10: teacher profile accepts customSubject and customGradeLevel", async () => {
    const updatedTeacher = await prisma.teacherProfile.update({
      where: { id: teacherProfileIdA },
      data: {
        customSubject: "Astronomie & Cosmologie",
        customGradeLevel: "Cycle Supérieur Spécialisé",
      },
    });

    expect(updatedTeacher.customSubject).toBe("Astronomie & Cosmologie");
    expect(updatedTeacher.customGradeLevel).toBe("Cycle Supérieur Spécialisé");
  });

  // -----------------------------------------------------------
  // Test 11: Teacher verification workflow integrity
  // -----------------------------------------------------------
  it("P05.15.11: teacher verification preserves document and status flow", async () => {
    // Add national id document to teacher
    const doc = await prisma.teacherDocument.create({
      data: {
        teacherProfileId: teacherProfileIdB,
        title: "Carte Nationale d'Identité Guinéenne",
        type: "NATIONAL_ID",
        fileUrl: "/uploads/documents/teacher_b_cni.pdf",
        fileSizeBytes: 245000,
        mimeType: "application/pdf",
      },
    });

    try {
      const profile = await prisma.teacherProfile.findUnique({
        where: { id: teacherProfileIdB },
        include: { documents: true },
      });

      expect(profile?.documents).toHaveLength(1);
      expect(profile?.documents[0].type).toBe("NATIONAL_ID");
    } finally {
      await prisma.teacherDocument.delete({ where: { id: doc.id } });
    }
  });

  // -----------------------------------------------------------
  // Test 12: Existing student management still works
  // -----------------------------------------------------------
  it("P05.15.12: existing student management (archive / update) operates without regression", async () => {
    // Archive student
    const archived = await prisma.studentProfile.update({
      where: { id: studentA1Id },
      data: { isArchived: true },
    });
    expect(archived.isArchived).toBe(true);

    // Unarchive
    const unarchived = await prisma.studentProfile.update({
      where: { id: studentA1Id },
      data: { isArchived: false },
    });
    expect(unarchived.isArchived).toBe(false);
  });

  // -----------------------------------------------------------
  // Test 13: Standard subject selection remains functional
  // -----------------------------------------------------------
  it("P05.15.13: standard subjects pass validation without requiring customSubject text", () => {
    const standardStudent = {
      fullName: "Standard Student",
      cycle: "PRIMAIRE",
      gradeLevel: "CM2",
      preferredSubjects: ["Mathématiques", "Français & Littérature"],
    };

    const parsed = studentCreateSchema.parse(standardStudent);
    expect(parsed.customSubject).toBeUndefined();
    expect(parsed.preferredSubjects).toEqual(["Mathématiques", "Français & Littérature"]);
  });

  // -----------------------------------------------------------
  // Test 14: Translations complete (FR default, EN complete)
  // -----------------------------------------------------------
  it("P05.15.14: translations contain required keys in FR and EN", () => {
    expect(frMessages.parent.form.customSubjectLabel).toBeDefined();
    expect(enMessages.parent.form.customSubjectLabel).toBeDefined();
    expect(frMessages.parent.form.customCycleLabel).toBeDefined();
    expect(enMessages.parent.form.customCycleLabel).toBeDefined();
    expect(frMessages.parent.form.otherOption).toBe("Autre");
    expect(enMessages.parent.form.otherOption).toBe("Other");
  });

  // -----------------------------------------------------------
  // Test 15: Prisma relations consistent
  // -----------------------------------------------------------
  it("P05.15.15: database schema relations maintain referential integrity", async () => {
    // Subject "Autre" exists in database
    const autreSubject = await prisma.subject.findFirst({
      where: { name: "Autre" },
    });
    expect(autreSubject).not.toBeNull();
    expect(autreSubject?.isActive).toBe(true);

    // GradeLevel "Autre" exists in database
    const autreGradeLevel = await prisma.gradeLevel.findFirst({
      where: { name: "Autre" },
    });
    expect(autreGradeLevel).not.toBeNull();
    expect(autreGradeLevel?.cycle).toBe("AUTRE");
  });

  // -----------------------------------------------------------
  // Test 16: Zero regression across existing models
  // -----------------------------------------------------------
  it("P05.15.16: master data and core roles remain uncorrupted", async () => {
    const userCount = await prisma.user.count();
    expect(userCount).toBeGreaterThanOrEqual(4);

    const subjectCount = await prisma.subject.count();
    expect(subjectCount).toBeGreaterThan(5);

    const gradeLevelCount = await prisma.gradeLevel.count();
    expect(gradeLevelCount).toBeGreaterThan(5);
  });
});
