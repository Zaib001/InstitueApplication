import { PrismaClient, UserRole, TeacherVerificationStatus, DocumentStatus, DocumentType } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function purgeDatabaseToThreeUsers() {
  console.log("=====================================================");
  console.log("🧹 MONSIEUR FANYI — PURGING DATABASE TO 3 CORE USERS 🧹");
  console.log("=====================================================");

  const targetEmails = [
    "admin@monsieurfanyi.gn",
    "teacher@monsieurfanyi.gn",
    "parent@monsieurfanyi.gn",
  ];

  // 1. Snapshot backup of existing database to disk
  console.log("\n[1/5] Création d'une sauvegarde instantanée de sécurité...");
  const backupDir = path.join(process.cwd(), "storage", "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const allUsersBefore = await prisma.user.findMany({
    include: {
      parentProfile: { include: { children: true } },
      teacherProfile: {
        include: {
          subjects: true,
          gradeLevels: true,
          availabilities: true,
          documents: true,
        },
      },
    },
  });

  const backupFilePath = path.join(backupDir, `backup_before_purge_${Date.now()}.json`);
  fs.writeFileSync(
    backupFilePath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        totalUsers: allUsersBefore.length,
        users: allUsersBefore,
      },
      null,
      2
    )
  );
  console.log(`  ✓ Sauvegarde enregistrée dans: ${backupFilePath}`);

  // 2. Locate or ensure the 3 core users
  console.log("\n[2/5] Vérification des 3 comptes principaux...");
  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);

  // 2A. Admin
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@monsieurfanyi.gn" },
    update: {
      fullName: "Directeur Pédagogique M. Fanyi",
      role: UserRole.ADMIN,
      passwordHash: defaultPasswordHash,
      isActive: true,
      phoneNumber: "620000000",
    },
    create: {
      email: "admin@monsieurfanyi.gn",
      fullName: "Directeur Pédagogique M. Fanyi",
      role: UserRole.ADMIN,
      passwordHash: defaultPasswordHash,
      isActive: true,
      phoneNumber: "620000000",
    },
  });

  // 2B. Teacher
  const teacherUser = await prisma.user.upsert({
    where: { email: "teacher@monsieurfanyi.gn" },
    update: {
      fullName: "M. Amadou Camara",
      role: UserRole.TEACHER,
      passwordHash: defaultPasswordHash,
      isActive: true,
      phoneNumber: "621111111",
    },
    create: {
      email: "teacher@monsieurfanyi.gn",
      fullName: "M. Amadou Camara",
      role: UserRole.TEACHER,
      passwordHash: defaultPasswordHash,
      isActive: true,
      phoneNumber: "621111111",
    },
  });

  // 2C. Parent
  const parentUser = await prisma.user.upsert({
    where: { email: "parent@monsieurfanyi.gn" },
    update: {
      fullName: "M. Ibrahima Barry",
      role: UserRole.PARENT,
      passwordHash: defaultPasswordHash,
      isActive: true,
      phoneNumber: "624444444",
    },
    create: {
      email: "parent@monsieurfanyi.gn",
      fullName: "M. Ibrahima Barry",
      role: UserRole.PARENT,
      passwordHash: defaultPasswordHash,
      isActive: true,
      phoneNumber: "624444444",
    },
  });

  // Parent Profile & Children
  const parentProfile = await prisma.parentProfile.upsert({
    where: { userId: parentUser.id },
    update: {
      city: "Conakry",
      address: "Kipé Centre, Commune de Ratoma (près du Carrefour Centre Émetteur)",
    },
    create: {
      userId: parentUser.id,
      city: "Conakry",
      address: "Kipé Centre, Commune de Ratoma (près du Carrefour Centre Émetteur)",
    },
  });

  // Ensure active children for Parent
  await prisma.studentProfile.updateMany({
    where: { parentId: parentProfile.id },
    data: { isArchived: false, archivedAt: null },
  });

  const existingChildren = await prisma.studentProfile.findMany({
    where: { parentId: parentProfile.id },
  });

  if (existingChildren.length === 0) {
    await prisma.studentProfile.create({
      data: {
        parentId: parentProfile.id,
        fullName: "Mamadou Barry",
        gradeLevel: "Terminale Sciences Mathématiques",
        schoolName: "Lycée Sainte-Marie de Dixinn",
        dateOfBirth: new Date("2008-04-15"),
        isArchived: false,
      },
    });
    await prisma.studentProfile.create({
      data: {
        parentId: parentProfile.id,
        fullName: "Fatoumata Barry",
        gradeLevel: "3ème Année Collège (Brevet)",
        schoolName: "Collège Kipé",
        dateOfBirth: new Date("2011-09-20"),
        isArchived: false,
      },
    });
  }

  // Teacher Profile
  const teacherProfile = await prisma.teacherProfile.upsert({
    where: { userId: teacherUser.id },
    update: {
      headline: "Professeur certifié de Mathématiques & Physique-Chimie (Lycée & Terminale)",
      bio: "Diplômé de l'UGANC, 9 ans d'enseignement dans les lycées de Conakry. Spécialiste de la préparation au Baccalauréat SM et SE avec 98% de réussite pour mes élèves.",
      city: "Conakry",
      serviceArea: "Ratoma, Kipé, Lambanyi, Nongo, Sonfonia",
      yearsOfExperience: 9,
      degrees: "Master 2 en Didactique des Sciences Physiques",
      institution: "Université Gamal Abdel Nasser de Conakry (UGANC)",
      isHomeAvailable: true,
      isOnlineAvailable: true,
      monthlyPackageRateGnf: 800000,
      monthlyPackageSessions: 8,
      monthlyPackageHoursPerSession: 2,
      verificationStatus: TeacherVerificationStatus.APPROVED,
      verifiedAt: new Date(),
      reviewerId: adminUser.id,
      rejectionReason: null,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      termsVersion: "SRD_V2.0",
    },
    create: {
      userId: teacherUser.id,
      headline: "Professeur certifié de Mathématiques & Physique-Chimie (Lycée & Terminale)",
      bio: "Diplômé de l'UGANC, 9 ans d'enseignement dans les lycées de Conakry. Spécialiste de la préparation au Baccalauréat SM et SE avec 98% de réussite pour mes élèves.",
      city: "Conakry",
      serviceArea: "Ratoma, Kipé, Lambanyi, Nongo, Sonfonia",
      yearsOfExperience: 9,
      degrees: "Master 2 en Didactique des Sciences Physiques",
      institution: "Université Gamal Abdel Nasser de Conakry (UGANC)",
      isHomeAvailable: true,
      isOnlineAvailable: true,
      monthlyPackageRateGnf: 800000,
      monthlyPackageSessions: 8,
      monthlyPackageHoursPerSession: 2,
      verificationStatus: TeacherVerificationStatus.APPROVED,
      verifiedAt: new Date(),
      reviewerId: adminUser.id,
      rejectionReason: null,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      termsVersion: "SRD_V2.0",
    },
  });

  // Ensure subjects, grade levels, and availability for teacher
  const mathSub = await prisma.subject.findFirst({ where: { name: "Mathématiques" } });
  const pcSub = await prisma.subject.findFirst({ where: { name: "Physique-Chimie" } });
  if (mathSub) {
    await prisma.teacherSubject.upsert({
      where: { teacherProfileId_subjectId: { teacherProfileId: teacherProfile.id, subjectId: mathSub.id } },
      update: {},
      create: { teacherProfileId: teacherProfile.id, subjectId: mathSub.id },
    });
  }
  if (pcSub) {
    await prisma.teacherSubject.upsert({
      where: { teacherProfileId_subjectId: { teacherProfileId: teacherProfile.id, subjectId: pcSub.id } },
      update: {},
      create: { teacherProfileId: teacherProfile.id, subjectId: pcSub.id },
    });
  }

  const termSm = await prisma.gradeLevel.findFirst({ where: { name: { contains: "Sciences Mathématiques" } } });
  const bepc = await prisma.gradeLevel.findFirst({ where: { name: { contains: "Brevet" } } });
  if (termSm) {
    await prisma.teacherGradeLevel.upsert({
      where: { teacherProfileId_gradeLevelId: { teacherProfileId: teacherProfile.id, gradeLevelId: termSm.id } },
      update: {},
      create: { teacherProfileId: teacherProfile.id, gradeLevelId: termSm.id },
    });
  }
  if (bepc) {
    await prisma.teacherGradeLevel.upsert({
      where: { teacherProfileId_gradeLevelId: { teacherProfileId: teacherProfile.id, gradeLevelId: bepc.id } },
      update: {},
      create: { teacherProfileId: teacherProfile.id, gradeLevelId: bepc.id },
    });
  }

  const existingAvail = await prisma.availability.findMany({ where: { teacherProfileId: teacherProfile.id } });
  if (existingAvail.length === 0) {
    await prisma.availability.createMany({
      data: [
        { teacherProfileId: teacherProfile.id, dayOfWeek: 1, startTime: "16:00", endTime: "18:00" },
        { teacherProfileId: teacherProfile.id, dayOfWeek: 3, startTime: "15:00", endTime: "18:00" },
        { teacherProfileId: teacherProfile.id, dayOfWeek: 6, startTime: "09:00", endTime: "13:00" },
      ],
    });
  }

  // 3. Delete transactional & test data across all tables
  console.log("\n[3/5] Suppression des données transactionnelles et de test...");

  // Financial & Ledger (must be deleted before sessions and classrooms)
  await prisma.paymentLedgerEntry.deleteMany({});
  await prisma.teacherEarning.deleteMany({});
  await prisma.paymentAttempt.deleteMany({});
  await prisma.paymentOrder.deleteMany({});
  await prisma.refundCase.deleteMany({});
  console.log("  ✓ Enregistrements comptables, gains et commandes supprimés");

  // Academic / Progress
  await prisma.subjectProgressObservation.deleteMany({});
  await prisma.academicAssessment.deleteMany({});
  await prisma.homeworkAssignment.deleteMany({});
  console.log("  ✓ Devoirs et bilans supprimés");

  // Dispute / Reports / Sessions / Classrooms
  await prisma.lessonDispute.deleteMany({});
  await prisma.lessonApproval.deleteMany({});
  await prisma.lessonReport.deleteMany({});
  await prisma.lessonSession.deleteMany({});
  await prisma.classroomMessage.deleteMany({});
  await prisma.tutoringPackage.deleteMany({});
  await prisma.classroom.deleteMany({});
  console.log("  ✓ Séances, comptes rendus, forfaits et classes supprimés");

  // Requests & Applications & Offers
  await prisma.teacherPricingOffer.deleteMany({});
  await prisma.teacherApplication.deleteMany({});
  await prisma.tutoringRequest.deleteMany({});
  console.log("  ✓ Candidatures, offres et demandes de cours supprimées");

  // Notifications & Outbox
  await prisma.notification.deleteMany({});
  await prisma.emailOutbox.deleteMany({});
  console.log("  ✓ Notifications et boîte d'envoi d'emails vidées");

  // Tokens & Sessions & Audits
  await prisma.accountInvitationToken.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.auditLog.deleteMany({});
  console.log("  ✓ Sessions et jetons temporaires supprimés");

  // Ratings
  await prisma.rating.deleteMany({});

  // 4. Delete all other users and profiles
  console.log("\n[4/5] Suppression des utilisateurs de test...");
  const preservedUserIds = [adminUser.id, teacherUser.id, parentUser.id];
  const preservedParentProfileId = parentProfile.id;
  const preservedTeacherProfileId = teacherProfile.id;

  // Delete other student profiles
  await prisma.studentProfile.deleteMany({
    where: { parentId: { not: preservedParentProfileId } },
  });

  // Delete other parent profiles
  await prisma.parentProfile.deleteMany({
    where: { id: { not: preservedParentProfileId } },
  });

  // Delete other teacher subjects, grade levels, availabilities, docs
  await prisma.teacherSubject.deleteMany({
    where: { teacherProfileId: { not: preservedTeacherProfileId } },
  });
  await prisma.teacherGradeLevel.deleteMany({
    where: { teacherProfileId: { not: preservedTeacherProfileId } },
  });
  await prisma.availability.deleteMany({
    where: { teacherProfileId: { not: preservedTeacherProfileId } },
  });
  await prisma.teacherDocument.deleteMany({
    where: { teacherProfileId: { not: preservedTeacherProfileId } },
  });

  // Delete other teacher profiles
  await prisma.teacherProfile.deleteMany({
    where: { id: { not: preservedTeacherProfileId } },
  });

  // Delete other notification preferences
  await prisma.notificationPreference.deleteMany({
    where: { userId: { notIn: preservedUserIds } },
  });

  // Delete all users other than the 3 preserved users
  const deletedUsersResult = await prisma.user.deleteMany({
    where: { id: { notIn: preservedUserIds } },
  });
  console.log(`  ✓ ${deletedUsersResult.count} utilisateurs de test supprimés.`);

  // 5. Final verification & Summary
  console.log("\n[5/5] État final de la base de données...");
  const finalUsers = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true },
  });

  console.log(`\nUtilisateurs actifs restants (${finalUsers.length}) :`);
  for (const u of finalUsers) {
    console.log(`  • [${u.role}] ${u.fullName} (${u.email}) — Mot de passe: Password123!`);
  }

  // Record audit log entry
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: "DATABASE_PURGED_TO_3_USERS",
      entityType: "System",
      entityId: adminUser.id,
      detailsJson: JSON.stringify({
        preservedUsers: finalUsers.map((u) => ({ email: u.email, role: u.role })),
        deletedUsersCount: deletedUsersResult.count,
        cleanedAt: new Date().toISOString(),
      }),
    },
  });

  console.log("\n=====================================================");
  console.log("✅ BASE DE DONNÉES PURGÉE ET PRÊTE POUR LES TESTS !");
  console.log("=====================================================");
}

purgeDatabaseToThreeUsers()
  .catch((err) => {
    console.error("❌ ERREUR PURGE:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
