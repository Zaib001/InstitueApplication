import { PrismaClient, UserRole, TeacherVerificationStatus, DocumentStatus, DocumentType } from "@prisma/client";
import bcrypt from "bcryptjs";

const renderDatabaseUrl =
  "postgresql://monsieur_fanyi_user:KmbssELCJRWUFozPpGsDPxFxpP7M4mBE@dpg-dboqnnugekts73etvmug-a.frankfurt-postgres.render.com/monsieur_fanyi_c0oq?sslmode=require";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: renderDatabaseUrl,
    },
  },
});

async function main() {
  console.log("=================================================================");
  console.log("🚀 CONNEXION & SEEDING DES 3 UTILISATEURS SUR RENDER POSTGRESQL");
  console.log("=================================================================");

  // 1. Test Connection
  console.log("\n[1/4] Test de connexion à la base Render...");
  const ping = await prisma.$queryRawUnsafe("SELECT current_database(), current_user, version();");
  console.log("  ✓ Connexion réussie à Render PostgreSQL :", ping);

  // 2. Check if tables exist
  console.log("\n[2/4] Vérification des tables Prisma...");
  const tableCheck: any[] = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log(`  ✓ Nombre de tables publiques trouvées : ${tableCheck.length}`);
  const tableNames = tableCheck.map((t) => t.table_name);
  console.log("  Tables existantes :", tableNames);

  if (!tableNames.includes("User")) {
    console.log("\n⚠️ ATTENTION: La table 'User' n'existe pas encore sur Render.");
    console.log("Il est nécessaire d'appliquer le schéma Prisma (prisma db push).");
    return;
  }

  // 3. Seed Master Data (Subjects & GradeLevels)
  console.log("\n[3/4] Initialisation des référentiels pédagogiques guinéens...");
  const subjectsData = [
    { name: "Mathématiques", category: "Sciences" },
    { name: "Physique-Chimie", category: "Sciences" },
    { name: "Sciences de la Vie et de la Terre (SVT)", category: "Sciences" },
    { name: "Français & Littérature", category: "Lettres" },
    { name: "Anglais", category: "Langues" },
    { name: "Histoire-Géographie", category: "Sciences Humaines" },
    { name: "Philosophie", category: "Sciences Humaines" },
    { name: "Informatique & Bureautique", category: "Technologie" },
    { name: "Autre", category: "Spécialisé" },
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
    { name: "Autre", cycle: "AUTRE", orderIndex: 99 },
  ];

  for (const g of gradeLevelsData) {
    await prisma.gradeLevel.upsert({
      where: { name: g.name },
      update: { cycle: g.cycle, orderIndex: g.orderIndex },
      create: { name: g.name, cycle: g.cycle, orderIndex: g.orderIndex },
    });
  }
  console.log("  ✓ Référentiels pédagogiques synchronisés.");

  // 4. Seed the 3 Core Users
  console.log("\n[4/4] Création et synchronisation des 3 utilisateurs...");
  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);

  // 4A. Admin
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
  console.log(`  ✓ Administrateur : ${adminUser.email} (Mot de passe: Password123!)`);

  // 4B. Teacher
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

  // Subjects & GradeLevels for Teacher
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

  // Teacher Availabilities
  await prisma.availability.deleteMany({ where: { teacherProfileId: teacherProfile.id } });
  await prisma.availability.createMany({
    data: [
      { teacherProfileId: teacherProfile.id, dayOfWeek: 1, startTime: "16:00", endTime: "18:00" },
      { teacherProfileId: teacherProfile.id, dayOfWeek: 3, startTime: "15:00", endTime: "18:00" },
      { teacherProfileId: teacherProfile.id, dayOfWeek: 6, startTime: "09:00", endTime: "13:00" },
    ],
  });

  // Teacher Documents
  await prisma.teacherDocument.deleteMany({ where: { teacherProfileId: teacherProfile.id } });
  await prisma.teacherDocument.createMany({
    data: [
      {
        teacherProfileId: teacherProfile.id,
        type: DocumentType.NATIONAL_ID,
        title: "Carte Nationale d'Identité Guinéenne",
        fileUrl: "doc_sample_cni_camara.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 1024,
        status: DocumentStatus.VERIFIED,
        verifiedAt: new Date(),
      },
      {
        teacherProfileId: teacherProfile.id,
        type: DocumentType.DIPLOMA,
        title: "Diplôme de Master 2 — UGANC",
        fileUrl: "doc_sample_diplome_camara.pdf",
        mimeType: "application/pdf",
        fileSizeBytes: 2048,
        status: DocumentStatus.VERIFIED,
        verifiedAt: new Date(),
      },
    ],
  });
  console.log(`  ✓ Enseignant approuvé : ${teacherUser.email} (M. Amadou Camara, Statut: APPROVED)`);

  // 4C. Parent
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
  const childrenData = [
    {
      fullName: "Mamadou Barry",
      gradeLevel: "Terminale Sciences Mathématiques",
      schoolName: "Lycée Sainte-Marie de Dixinn",
      dateOfBirth: new Date("2008-04-15"),
    },
    {
      fullName: "Fatoumata Barry",
      gradeLevel: "3ème Année Collège (Brevet)",
      schoolName: "Collège Kipé",
      dateOfBirth: new Date("2011-09-20"),
    },
    {
      fullName: "Zaib Barry",
      gradeLevel: "Lycée (11ème - Terminale / BAC)",
      schoolName: "Lycée Kipé",
      dateOfBirth: new Date("2009-02-10"),
    },
  ];

  for (const c of childrenData) {
    const existing = await prisma.studentProfile.findFirst({
      where: { parentId: parentProfile.id, fullName: c.fullName },
    });
    if (!existing) {
      await prisma.studentProfile.create({
        data: {
          parentId: parentProfile.id,
          fullName: c.fullName,
          gradeLevel: c.gradeLevel,
          schoolName: c.schoolName,
          dateOfBirth: c.dateOfBirth,
          isArchived: false,
        },
      });
    }
  }
  console.log(`  ✓ Parent : ${parentUser.email} (M. Ibrahima Barry, avec 3 enfants actifs)`);

  console.log("\n=================================================================");
  console.log("🎉 SEEDING TERMINÉ AVEC SUCCÈS SUR RENDER POSTGRESQL !");
  console.log("=================================================================");
}

main()
  .catch((e) => {
    console.error("❌ ERREUR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

