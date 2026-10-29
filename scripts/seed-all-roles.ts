import {
  PrismaClient,
  UserRole,
  TeacherVerificationStatus,
  DocumentStatus,
  DocumentType,
  ClassroomStatus,
  SessionStatus,
  LedgerEntryType,
  PaymentOrderStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = process.env.SEED_PASSWORD || "Password123!";

// Helper to ensure a dummy PDF file exists in private storage for document viewing
function ensureDummyPrivateDocument(fileName: string, content: string): { filePath: string; size: number } {
  const uploadsDir = path.join(process.cwd(), "storage", "private-documents");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, fileName);
  // Generate a minimal valid PDF-compatible buffer
  const pdfHeader = `%PDF-1.4\n%Monsieur Fanyi Document Sécurisé\n1 0 obj\n<< /Title (${content}) >>\nendobj\ntrailer\n<< >>\n%%EOF\n`;
  const buffer = Buffer.from(pdfHeader, "utf-8");
  fs.writeFileSync(filePath, buffer);

  return { filePath, size: buffer.length };
}

async function main() {
  console.log("=====================================================");
  console.log("🌱 MONSIEUR FANYI — SEEDING ALL ROLES & WORKFLOWS 🌱");
  console.log("=====================================================");

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // -----------------------------------------------------------------
  // 1. MASTER DATA: SUBJECTS & GRADE LEVELS
  // -----------------------------------------------------------------
  console.log("\n[1/6] Vérification des données pédagogiques guinéennes...");

  const subjectsData = [
    { name: "Mathématiques", category: "Sciences" },
    { name: "Physique-Chimie", category: "Sciences" },
    { name: "Sciences de la Vie et de la Terre (SVT)", category: "Sciences" },
    { name: "Français & Littérature", category: "Lettres" },
    { name: "Anglais", category: "Langues" },
    { name: "Histoire-Géographie", category: "Sciences Humaines" },
    { name: "Philosophie", category: "Sciences Humaines" },
    { name: "Informatique & Bureautique", category: "Technologie" },
  ];

  for (const s of subjectsData) {
    await prisma.subject.upsert({
      where: { name: s.name },
      update: { category: s.category, isActive: true },
      create: { name: s.name, category: s.category, isActive: true },
    });
  }

  const gradeLevelsData = [
    { name: "6ème Année (Examen d'Entrée en 7ème)", cycle: "PRIMAIRE", orderIndex: 1 },
    { name: "9ème Année", cycle: "COLLEGE", orderIndex: 4 },
    { name: "10ème Année (Brevet / BEPC)", cycle: "COLLEGE", orderIndex: 5 },
    { name: "11ème Année", cycle: "LYCEE", orderIndex: 6 },
    { name: "12ème Année", cycle: "LYCEE", orderIndex: 7 },
    { name: "Terminale Sciences Mathématiques (SM)", cycle: "LYCEE", orderIndex: 8 },
    { name: "Terminale Sciences Expérimentales (SE)", cycle: "LYCEE", orderIndex: 9 },
    { name: "Terminale Sciences Sociales (SS)", cycle: "LYCEE", orderIndex: 10 },
    { name: "Université / Classes Préparatoires", cycle: "SUPERIEUR", orderIndex: 11 },
  ];

  for (const g of gradeLevelsData) {
    await prisma.gradeLevel.upsert({
      where: { name: g.name },
      update: { cycle: g.cycle, orderIndex: g.orderIndex },
      create: { name: g.name, cycle: g.cycle, orderIndex: g.orderIndex },
    });
  }

  const mathSubject = await prisma.subject.findFirst({ where: { name: "Mathématiques" } });
  const pcSubject = await prisma.subject.findFirst({ where: { name: "Physique-Chimie" } });
  const svtSubject = await prisma.subject.findFirst({ where: { name: "Sciences de la Vie et de la Terre (SVT)" } });
  const terminaleSm = await prisma.gradeLevel.findFirst({ where: { name: { contains: "Terminale Sciences Mathématiques" } } });
  const terminaleSe = await prisma.gradeLevel.findFirst({ where: { name: { contains: "Terminale Sciences Expérimentales" } } });
  const bepc = await prisma.gradeLevel.findFirst({ where: { name: { contains: "Brevet" } } });

  // -----------------------------------------------------------------
  // 2. SEED ADMIN ACCOUNT
  // -----------------------------------------------------------------
  console.log("\n[2/6] Seeding Compte Administrateur...");

  const adminEmail = "admin@monsieurfanyi.gn";
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      fullName: "Directeur Pédagogique M. Fanyi",
      role: UserRole.ADMIN,
      passwordHash,
      isActive: true,
      phoneNumber: "620000000",
    },
    create: {
      email: adminEmail,
      fullName: "Directeur Pédagogique M. Fanyi",
      role: UserRole.ADMIN,
      passwordHash,
      isActive: true,
      phoneNumber: "620000000",
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: "SEED_ADMIN_INITIALIZED",
      entityType: "User",
      entityId: adminUser.id,
      detailsJson: JSON.stringify({ email: adminEmail }),
    },
  });
  console.log(`  ✓ Administrateur : ${adminEmail} (Mot de passe: ${DEFAULT_PASSWORD})`);

  // -----------------------------------------------------------------
  // 3. SEED TUTORS (TEACHERS): APPROVED, PENDING, REJECTED, DRAFT
  // -----------------------------------------------------------------
  console.log("\n[3/6] Seeding Comptes Enseignants (Tuteurs avec différents statuts)...");

  // Ensure sample documents exist on disk
  const sampleCni = ensureDummyPrivateDocument("doc_sample_cni_camara.pdf", "CNI Guinéenne - Amadou Camara");
  const sampleDiploma = ensureDummyPrivateDocument("doc_sample_diplome_camara.pdf", "Diplôme de Master UGANC - Amadou Camara");
  const sampleCniSow = ensureDummyPrivateDocument("doc_sample_cni_sow.pdf", "CNI Guinéenne - Kadiatou Sow");
  const sampleDiplomaSow = ensureDummyPrivateDocument("doc_sample_diplome_sow.pdf", "Doctorat en Biologie UGANC - Kadiatou Sow");

  // 3A. Primary Approved Teacher (prof.camara / teacher@monsieurfanyi.gn)
  const teacherApprovedEmail = "teacher@monsieurfanyi.gn";
  const teacherApproved = await prisma.user.upsert({
    where: { email: teacherApprovedEmail },
    update: {
      fullName: "M. Amadou Camara",
      role: UserRole.TEACHER,
      passwordHash,
      isActive: true,
      phoneNumber: "621111111",
    },
    create: {
      email: teacherApprovedEmail,
      fullName: "M. Amadou Camara",
      role: UserRole.TEACHER,
      passwordHash,
      isActive: true,
      phoneNumber: "621111111",
    },
  });

  const profileApproved = await prisma.teacherProfile.upsert({
    where: { userId: teacherApproved.id },
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
      submittedAt: new Date(Date.now() - 7 * 86400000),
    },
    create: {
      userId: teacherApproved.id,
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
      submittedAt: new Date(Date.now() - 7 * 86400000),
    },
  });

  // Link subjects & grade levels
  if (mathSubject) {
    await prisma.teacherSubject.upsert({
      where: { teacherProfileId_subjectId: { teacherProfileId: profileApproved.id, subjectId: mathSubject.id } },
      update: {},
      create: { teacherProfileId: profileApproved.id, subjectId: mathSubject.id },
    });
  }
  if (pcSubject) {
    await prisma.teacherSubject.upsert({
      where: { teacherProfileId_subjectId: { teacherProfileId: profileApproved.id, subjectId: pcSubject.id } },
      update: {},
      create: { teacherProfileId: profileApproved.id, subjectId: pcSubject.id },
    });
  }
  if (terminaleSm) {
    await prisma.teacherGradeLevel.upsert({
      where: { teacherProfileId_gradeLevelId: { teacherProfileId: profileApproved.id, gradeLevelId: terminaleSm.id } },
      update: {},
      create: { teacherProfileId: profileApproved.id, gradeLevelId: terminaleSm.id },
    });
  }
  if (bepc) {
    await prisma.teacherGradeLevel.upsert({
      where: { teacherProfileId_gradeLevelId: { teacherProfileId: profileApproved.id, gradeLevelId: bepc.id } },
      update: {},
      create: { teacherProfileId: profileApproved.id, gradeLevelId: bepc.id },
    });
  }

  // Availabilities
  await prisma.availability.deleteMany({ where: { teacherProfileId: profileApproved.id } });
  await prisma.availability.createMany({
    data: [
      { teacherProfileId: profileApproved.id, dayOfWeek: 1, startTime: "16:00", endTime: "18:00" }, // Lundi
      { teacherProfileId: profileApproved.id, dayOfWeek: 3, startTime: "15:00", endTime: "18:00" }, // Mercredi
      { teacherProfileId: profileApproved.id, dayOfWeek: 6, startTime: "09:00", endTime: "13:00" }, // Samedi
    ],
  });

  // Documents
  await prisma.teacherDocument.deleteMany({ where: { teacherProfileId: profileApproved.id } });
  await prisma.teacherDocument.createMany({
    data: [
      {
        teacherProfileId: profileApproved.id,
        type: DocumentType.NATIONAL_ID,
        title: "Carte Nationale d'Identité Guinéenne",
        fileUrl: "doc_sample_cni_camara.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: sampleCni.size,
        status: DocumentStatus.VERIFIED,
        verifiedAt: new Date(),
      },
      {
        teacherProfileId: profileApproved.id,
        type: DocumentType.DIPLOMA,
        title: "Diplôme de Master 2 — UGANC",
        fileUrl: "doc_sample_diplome_camara.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: sampleDiploma.size,
        status: DocumentStatus.VERIFIED,
        verifiedAt: new Date(),
      },
    ],
  });
  console.log(`  ✓ Enseignant VALIDÉ : ${teacherApprovedEmail} (M. Amadou Camara, Statut: APPROVED)`);

  // 3B. Pending Review Teacher (tutor.pending@monsieurfanyi.gn / Dr. Kadiatou Sow)
  const teacherPendingEmail = "tutor.pending@monsieurfanyi.gn";
  const teacherPending = await prisma.user.upsert({
    where: { email: teacherPendingEmail },
    update: {
      fullName: "Dr. Kadiatou Sow",
      role: UserRole.TEACHER,
      passwordHash,
      isActive: true,
      phoneNumber: "622222222",
    },
    create: {
      email: teacherPendingEmail,
      fullName: "Dr. Kadiatou Sow",
      role: UserRole.TEACHER,
      passwordHash,
      isActive: true,
      phoneNumber: "622222222",
    },
  });

  const profilePending = await prisma.teacherProfile.upsert({
    where: { userId: teacherPending.id },
    update: {
      headline: "Enseignante universitaire et tutrice de SVT & Chimie",
      bio: "Docteure en Sciences Biologiques, enseignante-chercheuse à l'UGANC. Grande expérience de la remise à niveau des élèves en filières scientifiques.",
      city: "Conakry",
      serviceArea: "Dixinn, Kaloum, Matam, Kipé",
      yearsOfExperience: 5,
      degrees: "Doctorat en Biologie Cellulaire & Physiologie",
      institution: "UGANC",
      isHomeAvailable: true,
      isOnlineAvailable: true,
      monthlyPackageRateGnf: 750000,
      monthlyPackageSessions: 8,
      monthlyPackageHoursPerSession: 2,
      verificationStatus: TeacherVerificationStatus.PENDING_REVIEW,
      submittedAt: new Date(Date.now() - 3600000 * 4), // 4h ago
      termsAccepted: true,
      termsAcceptedAt: new Date(Date.now() - 3600000 * 4),
      termsVersion: "SRD_V2.0",
    },
    create: {
      userId: teacherPending.id,
      headline: "Enseignante universitaire et tutrice de SVT & Chimie",
      bio: "Docteure en Sciences Biologiques, enseignante-chercheuse à l'UGANC. Grande expérience de la remise à niveau des élèves en filières scientifiques.",
      city: "Conakry",
      serviceArea: "Dixinn, Kaloum, Matam, Kipé",
      yearsOfExperience: 5,
      degrees: "Doctorat en Biologie Cellulaire & Physiologie",
      institution: "UGANC",
      isHomeAvailable: true,
      isOnlineAvailable: true,
      monthlyPackageRateGnf: 750000,
      monthlyPackageSessions: 8,
      monthlyPackageHoursPerSession: 2,
      verificationStatus: TeacherVerificationStatus.PENDING_REVIEW,
      submittedAt: new Date(Date.now() - 3600000 * 4),
      termsAccepted: true,
      termsAcceptedAt: new Date(Date.now() - 3600000 * 4),
      termsVersion: "SRD_V2.0",
    },
  });

  if (svtSubject) {
    await prisma.teacherSubject.upsert({
      where: { teacherProfileId_subjectId: { teacherProfileId: profilePending.id, subjectId: svtSubject.id } },
      update: {},
      create: { teacherProfileId: profilePending.id, subjectId: svtSubject.id },
    });
  }
  if (terminaleSe) {
    await prisma.teacherGradeLevel.upsert({
      where: { teacherProfileId_gradeLevelId: { teacherProfileId: profilePending.id, gradeLevelId: terminaleSe.id } },
      update: {},
      create: { teacherProfileId: profilePending.id, gradeLevelId: terminaleSe.id },
    });
  }

  await prisma.availability.deleteMany({ where: { teacherProfileId: profilePending.id } });
  await prisma.availability.createMany({
    data: [
      { teacherProfileId: profilePending.id, dayOfWeek: 2, startTime: "16:00", endTime: "18:00" }, // Mardi
      { teacherProfileId: profilePending.id, dayOfWeek: 4, startTime: "16:00", endTime: "18:00" }, // Jeudi
      { teacherProfileId: profilePending.id, dayOfWeek: 6, startTime: "14:00", endTime: "17:00" }, // Samedi
    ],
  });

  await prisma.teacherDocument.deleteMany({ where: { teacherProfileId: profilePending.id } });
  await prisma.teacherDocument.createMany({
    data: [
      {
        teacherProfileId: profilePending.id,
        type: DocumentType.NATIONAL_ID,
        title: "Passeport de la République de Guinée",
        fileUrl: "doc_sample_cni_sow.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: sampleCniSow.size,
        status: DocumentStatus.PENDING,
      },
      {
        teacherProfileId: profilePending.id,
        type: DocumentType.DIPLOMA,
        title: "Doctorat d'État en Biologie — UGANC",
        fileUrl: "doc_sample_diplome_sow.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: sampleDiplomaSow.size,
        status: DocumentStatus.PENDING,
      },
    ],
  });
  console.log(`  ✓ Enseignant EN ATTENTE : ${teacherPendingEmail} (Dr. Kadiatou Sow, Statut: PENDING_REVIEW pour test validation admin)`);

  // 3C. Rejected Teacher (tutor.rejected@monsieurfanyi.gn / M. Boubacar Barry)
  const teacherRejectedEmail = "tutor.rejected@monsieurfanyi.gn";
  const teacherRejected = await prisma.user.upsert({
    where: { email: teacherRejectedEmail },
    update: {
      fullName: "M. Boubacar Barry",
      role: UserRole.TEACHER,
      passwordHash,
      isActive: true,
      phoneNumber: "623333333",
    },
    create: {
      email: teacherRejectedEmail,
      fullName: "M. Boubacar Barry",
      role: UserRole.TEACHER,
      passwordHash,
      isActive: true,
      phoneNumber: "623333333",
    },
  });

  await prisma.teacherProfile.upsert({
    where: { userId: teacherRejected.id },
    update: {
      headline: "Tuteur de Français & Philosophie",
      bio: "Licencié en Lettres Modernes, passionné de littérature africaine.",
      city: "Conakry",
      serviceArea: "Matoto, Tombolia",
      yearsOfExperience: 3,
      degrees: "Licence en Lettres Modernes",
      institution: "UGLC Sonfonia",
      verificationStatus: TeacherVerificationStatus.REJECTED,
      rejectionReason: "La photo de votre pièce d'identité est floue et le diplôme de Licence n'est pas lisible. Merci de téléverser un scan haute résolution de votre CNI recto-verso.",
      reviewedAt: new Date(),
      reviewerId: adminUser.id,
      termsAccepted: true,
      termsAcceptedAt: new Date(Date.now() - 86400000 * 2),
      termsVersion: "SRD_V2.0",
    },
    create: {
      userId: teacherRejected.id,
      headline: "Tuteur de Français & Philosophie",
      bio: "Licencié en Lettres Modernes, passionné de littérature africaine.",
      city: "Conakry",
      serviceArea: "Matoto, Tombolia",
      yearsOfExperience: 3,
      degrees: "Licence en Lettres Modernes",
      institution: "UGLC Sonfonia",
      verificationStatus: TeacherVerificationStatus.REJECTED,
      rejectionReason: "La photo de votre pièce d'identité est floue et le diplôme de Licence n'est pas lisible. Merci de téléverser un scan haute résolution de votre CNI recto-verso.",
      reviewedAt: new Date(),
      reviewerId: adminUser.id,
      termsAccepted: true,
      termsAcceptedAt: new Date(Date.now() - 86400000 * 2),
      termsVersion: "SRD_V2.0",
    },
  });
  console.log(`  ✓ Enseignant REJETÉ / COMPLÉMENT : ${teacherRejectedEmail} (M. Boubacar Barry, Statut: REJECTED avec motif explicatif)`);

  // -----------------------------------------------------------------
  // 4. SEED PARENT ACCOUNT WITH CHILDREN (STUDENT PROFILES)
  // -----------------------------------------------------------------
  console.log("\n[4/6] Seeding Compte Parent avec profil et enfants...");

  const parentEmail = "parent@monsieurfanyi.gn";
  const parentUser = await prisma.user.upsert({
    where: { email: parentEmail },
    update: {
      fullName: "M. Ibrahima Barry",
      role: UserRole.PARENT,
      passwordHash,
      isActive: true,
      phoneNumber: "624444444",
    },
    create: {
      email: parentEmail,
      fullName: "M. Ibrahima Barry",
      role: UserRole.PARENT,
      passwordHash,
      isActive: true,
      phoneNumber: "624444444",
    },
  });

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

  // Seed Children for Parent
  const existingChild1 = await prisma.studentProfile.findFirst({
    where: { parentId: parentProfile.id, fullName: "Mamadou Barry" },
  });
  if (!existingChild1) {
    await prisma.studentProfile.create({
      data: {
        parentId: parentProfile.id,
        fullName: "Mamadou Barry",
        gradeLevel: "Terminale Sciences Mathématiques",
        schoolName: "Lycée Sainte-Marie de Dixinn",
        dateOfBirth: new Date("2008-04-15"),
      },
    });
  }

  const existingChild2 = await prisma.studentProfile.findFirst({
    where: { parentId: parentProfile.id, fullName: "Fatoumata Barry" },
  });
  if (!existingChild2) {
    await prisma.studentProfile.create({
      data: {
        parentId: parentProfile.id,
        fullName: "Fatoumata Barry",
        gradeLevel: "3ème Année Collège (Brevet)",
        schoolName: "Collège Kipé",
        dateOfBirth: new Date("2011-09-20"),
      },
    });
  }
  console.log(`  ✓ Parent : ${parentEmail} (M. Ibrahima Barry, 2 enfants: Mamadou en Terminale SM et Fatoumata en 3ème)`);

  // -----------------------------------------------------------------
  // 5. SEED STUDENT ACCOUNT (STUDENT ROLE)
  // -----------------------------------------------------------------
  console.log("\n[5/6] Seeding Compte Élève (Rôle STUDENT)...");

  const studentEmail = "student@monsieurfanyi.gn";
  const studentUser = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {
      fullName: "Mamadou Barry",
      role: UserRole.STUDENT,
      passwordHash,
      isActive: true,
      phoneNumber: "625555555",
    },
    create: {
      email: studentEmail,
      fullName: "Mamadou Barry",
      role: UserRole.STUDENT,
      passwordHash,
      isActive: true,
      phoneNumber: "625555555",
    },
  });

  // Link StudentProfile to student user
  const studentProfileToLink = await prisma.studentProfile.findFirst({
    where: { parentId: parentProfile.id, fullName: "Mamadou Barry" },
  });
  if (studentProfileToLink) {
    await prisma.studentProfile.update({
      where: { id: studentProfileToLink.id },
      data: { userId: studentUser.id },
    });
  }
  console.log(`  ✓ Élève : ${studentEmail} (Mamadou Barry, Rôle: STUDENT, rattaché au parent)`);

  // -----------------------------------------------------------------
  // 5B. SEED REAL CLASSROOMS & SESSIONS (REAL HOURS, ATTENDANCE & SCHEDULE)
  // -----------------------------------------------------------------
  console.log("\n[5B] Seeding Classes Actives, Séances & Séquestres Réels...");

  const childMamadou = await prisma.studentProfile.findFirst({
    where: { parentId: parentProfile.id, fullName: "Mamadou Barry" },
  });
  const childFatoumata = await prisma.studentProfile.findFirst({
    where: { parentId: parentProfile.id, fullName: "Fatoumata Barry" },
  });

  if (childMamadou && childFatoumata) {
    // 1. Create or update Classroom 1 for Mamadou
    let classroom1 = await prisma.classroom.findFirst({
      where: { teacherProfileId: profileApproved.id, studentId: childMamadou.id },
    });
    if (!classroom1) {
      classroom1 = await prisma.classroom.create({
        data: {
          teacherProfileId: profileApproved.id,
          studentId: childMamadou.id,
          subjectName: "Mathématiques & Sciences Physiques (Terminale SM)",
          status: ClassroomStatus.ACTIVE,
        },
      });
    }

    // 2. Create or update Classroom 2 for Fatoumata
    let classroom2 = await prisma.classroom.findFirst({
      where: { teacherProfileId: profileApproved.id, studentId: childFatoumata.id },
    });
    if (!classroom2) {
      classroom2 = await prisma.classroom.create({
        data: {
          teacherProfileId: profileApproved.id,
          studentId: childFatoumata.id,
          subjectName: "Mathématiques & Préparation Brevet (Collège 3ème)",
          status: ClassroomStatus.ACTIVE,
        },
      });
    }

    // 3. Seed Completed Sessions (for real delivered hours & attendance)
    const existingCompleted = await prisma.lessonSession.count({
      where: {
        classroomId: classroom1.id,
        status: SessionStatus.PARENT_APPROVED,
      },
    });

    if (existingCompleted < 12) {
      const now = Date.now();
      // Seed 14 past completed sessions of 2h each (28 hours delivered)
      for (let i = 1; i <= 14; i++) {
        const sessionDate = new Date(now - i * 2 * 86400000); // every 2 days in the past
        const session = await prisma.lessonSession.create({
          data: {
            classroomId: classroom1.id,
            scheduledStart: sessionDate,
            scheduledEnd: new Date(sessionDate.getTime() + 120 * 60000),
            durationMinutes: 120, // 2 hours
            allocatedAmountGnf: 100000,
            isFunded: true,
            status: SessionStatus.PARENT_APPROVED,
            report: {
              create: {
                topicsCovered: `Séance N°${i} : Exercices approfondis sur les fonctions et équations différentielles.`,
                studentEffort: "Très bon investissement et régularité.",
                homeworkGiven: "Exercices 12 à 18 page 94 du manuel SM.",
              },
            },
            approval: {
              create: {
                approvedBy: parentUser.id,
                approvedAt: new Date(sessionDate.getTime() + 130 * 60000),
                feedbackNote: "Cours très bien expliqué, l'élève a bien progressé.",
              },
            },
          },
        });

        // Create teacher earning record (85% net, 15% platform commission)
        await prisma.teacherEarning.create({
          data: {
            teacherProfileId: profileApproved.id,
            sessionId: session.id,
            grossAmountGnf: 100000,
            commissionRatePercent: 15,
            platformCommissionGnf: 15000,
            teacherNetGnf: 85000,
            isPaidOut: false,
          },
        });
      }

      // Seed 8 past completed sessions for Fatoumata (16 hours delivered)
      for (let j = 1; j <= 8; j++) {
        const sessionDate2 = new Date(now - j * 3 * 86400000);
        const session2 = await prisma.lessonSession.create({
          data: {
            classroomId: classroom2.id,
            scheduledStart: sessionDate2,
            scheduledEnd: new Date(sessionDate2.getTime() + 120 * 60000),
            durationMinutes: 120,
            allocatedAmountGnf: 85000,
            isFunded: true,
            status: SessionStatus.PARENT_APPROVED,
            report: {
              create: {
                topicsCovered: `Séance N°${j} : Révision géométrie du triangle et théorème de Thalès.`,
                studentEffort: "Attention soutenue.",
              },
            },
            approval: {
              create: {
                approvedBy: parentUser.id,
                approvedAt: new Date(sessionDate2.getTime() + 130 * 60000),
              },
            },
          },
        });

        await prisma.teacherEarning.create({
          data: {
            teacherProfileId: profileApproved.id,
            sessionId: session2.id,
            grossAmountGnf: 85000,
            commissionRatePercent: 15,
            platformCommissionGnf: 12750,
            teacherNetGnf: 72250,
            isPaidOut: false,
          },
        });
      }
    }

    // 4. Seed Real Upcoming Sessions
    const existingUpcoming = await prisma.lessonSession.findFirst({
      where: {
        classroomId: classroom1.id,
        status: SessionStatus.SCHEDULED,
      },
    });

    if (!existingUpcoming) {
      const todaySessionTime = new Date();
      todaySessionTime.setHours(16, 30, 0, 0);

      await prisma.lessonSession.create({
        data: {
          classroomId: classroom1.id,
          scheduledStart: todaySessionTime,
          scheduledEnd: new Date(todaySessionTime.getTime() + 120 * 60000),
          durationMinutes: 120,
          allocatedAmountGnf: 100000,
          isFunded: true,
          status: SessionStatus.SCHEDULED,
        },
      });

      const tomorrowSessionTime = new Date(Date.now() + 86400000);
      tomorrowSessionTime.setHours(15, 0, 0, 0);

      await prisma.lessonSession.create({
        data: {
          classroomId: classroom2.id,
          scheduledStart: tomorrowSessionTime,
          scheduledEnd: new Date(tomorrowSessionTime.getTime() + 120 * 60000),
          durationMinutes: 120,
          allocatedAmountGnf: 85000,
          isFunded: true,
          status: SessionStatus.SCHEDULED,
        },
      });
    }

    // 5. Seed Real Payment Orders and Platform Escrow Ledger Entries
    const existingOrder = await prisma.paymentOrder.findFirst({
      where: { parentUserId: parentUser.id },
    });

    if (!existingOrder) {
      const order = await prisma.paymentOrder.create({
        data: {
          parentUserId: parentUser.id,
          classroomId: classroom1.id,
          totalAmountGnf: 2400000,
          status: PaymentOrderStatus.PAID,
        },
      });

      await prisma.paymentLedgerEntry.createMany({
        data: [
          {
            orderId: order.id,
            type: LedgerEntryType.PARENT_PAYMENT,
            amountGnf: 2400000,
            description: "Paiement forfait mensuel 8 séances Terminale SM via Orange Money",
            actorId: parentUser.id,
            reference: "OM-GN-88492041",
          },
          {
            orderId: order.id,
            type: LedgerEntryType.PLATFORM_COMMISSION,
            amountGnf: 360000, // 15%
            description: "Commission plateforme Monsieur Fanyi 15%",
            actorId: adminUser.id,
            reference: "COMM-15-2026-001",
          },
          {
            orderId: order.id,
            type: LedgerEntryType.TEACHER_EARNING,
            amountGnf: 2040000, // 85%
            description: "Part nette réservée pour l'enseignant (85%) en séquestre",
            actorId: teacherApproved.id,
            reference: "EARN-85-2026-001",
          },
        ],
      });
    }

    console.log(`  ✓ Classes & Séances : 2 classes actives, 22 séances réalisées (44h), 2 séances à venir, séquestre & 15% comm. initialisés.`);
  }

  // -----------------------------------------------------------------
  // 6. SUMMARY & CREDENTIALS TABLE
  // -----------------------------------------------------------------
  console.log("\n=====================================================");
  console.log("🎉 SEEDING TERMINÉ AVEC SUCCÈS ! IDENTIFIANTS DISPONIBLES :");
  console.log("=====================================================");
  console.log(`Mot de passe universel pour tous les comptes : "${DEFAULT_PASSWORD}"\n`);
  console.log("1. ADMINISTRATEUR :");
  console.log(`   • Email : ${adminEmail}`);
  console.log(`   • Rôle  : ADMIN (Accès /admin/dashboard et /admin/verifications)\n`);

  console.log("2. PROFESSEURS / TUTEURS (Différents statuts de vérification) :");
  console.log(`   • Validé & Approuvé : ${teacherApprovedEmail} (Statut: APPROVED, forfaits & matières configurés)`);
  console.log(`   • En attente d'instruction : ${teacherPendingEmail} (Statut: PENDING_REVIEW, visible dans la file admin)`);
  console.log(`   • Rejeté / Complément requis : ${teacherRejectedEmail} (Statut: REJECTED, pour tester la resoumission)\n`);

  console.log("3. PARENT :");
  console.log(`   • Email : ${parentEmail}`);
  console.log(`   • Rôle  : PARENT (Avec 2 enfants enregistrés : Mamadou & Fatoumata)\n`);

  console.log("4. ÉLÈVE :");
  console.log(`   • Email : ${studentEmail}`);
  console.log(`   • Rôle  : STUDENT (Mamadou Barry)\n`);
  console.log("=====================================================");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seeding :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
