import {
  PrismaClient,
  UserRole,
  TeacherVerificationStatus,
  RequestStatus,
  TutoringMode,
  ApplicationStatus,
  ClassroomStatus,
  PricingOfferType,
  PackageStatus,
  SessionStatus,
  LessonAttendance,
  ReportStatus,
  DisputeStatus,
  HomeworkStatus,
  AssessmentType,
} from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { PricingEngine } from "../src/lib/pricing/pricing-engine";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "DemoFanyi2026!";

export async function seedPhase13Demo() {
  console.log("🌱 Déploiement des données de démonstration officielles Monsieur Fanyi (Milestone 2)...");

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  // 1. Administrateur Démo
  const adminUser = await prisma.user.upsert({
    where: { email: "admin.demo@monsieurfanyi.gn" },
    update: { passwordHash, isActive: true },
    create: {
      email: "admin.demo@monsieurfanyi.gn",
      fullName: "M. Ousmane Fanyi (Directeur Général)",
      phoneNumber: "+224620000001",
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log(`✅ Administrateur créé : ${adminUser.email}`);

  // 2. Parent Démo
  const parentUser = await prisma.user.upsert({
    where: { email: "mamadou.bah.demo@monsieurfanyi.gn" },
    update: { passwordHash, isActive: true },
    create: {
      email: "mamadou.bah.demo@monsieurfanyi.gn",
      fullName: "Mamadou Bah (Parent de Famille)",
      phoneNumber: "+224620000002",
      passwordHash,
      role: UserRole.PARENT,
      isActive: true,
      parentProfile: {
        create: {
          city: "Conakry",
          address: "Kipé, Commune de Ratoma",
          isAssistedRegistration: false,
        },
      },
    },
    include: { parentProfile: true },
  });

  let parentProfile = parentUser.parentProfile;
  if (!parentProfile) {
    parentProfile = await prisma.parentProfile.create({
      data: {
        userId: parentUser.id,
        city: "Conakry",
        address: "Kipé, Commune de Ratoma",
      },
    });
  }
  console.log(`✅ Parent créé : ${parentUser.email}`);

  // 3. Élèves de la famille Bah
  let studentIbrahima = await prisma.studentProfile.findFirst({
    where: { parentId: parentProfile.id, fullName: "Ibrahima Bah (Démo)" },
  });
  if (!studentIbrahima) {
    studentIbrahima = await prisma.studentProfile.create({
      data: {
        parentId: parentProfile.id,
        fullName: "Ibrahima Bah (Démo)",
        gradeLevel: "Terminale SM",
        cycle: "LYCEE",
        schoolName: "Lycée Sainte Marie de Conakry",
        preferredSubjects: ["Mathématiques", "Physique-Chimie"],
        notes: "Élève sérieux préparant le Baccalauréat Unique session 2026.",
      },
    });
  }

  let studentMariama = await prisma.studentProfile.findFirst({
    where: { parentId: parentProfile.id, fullName: "Mariama Bah (Démo)" },
  });
  if (!studentMariama) {
    studentMariama = await prisma.studentProfile.create({
      data: {
        parentId: parentProfile.id,
        fullName: "Mariama Bah (Démo)",
        gradeLevel: "10ème Année",
        cycle: "COLLEGE",
        schoolName: "Collège Kipé",
        preferredSubjects: ["Français", "Histoire"],
        notes: "Préparation du Brevet d'Études du Premier Cycle (BEPC).",
      },
    });
  }
  console.log(`✅ Élèves créés : ${studentIbrahima.fullName}, ${studentMariama.fullName}`);

  // 4. Enseignants Démo
  // Enseignant Agréé 1 : Dr. Alpha Sow (Mathématiques & Sciences)
  const teacher1User = await prisma.user.upsert({
    where: { email: "alpha.sow.demo@monsieurfanyi.gn" },
    update: { passwordHash, isActive: true },
    create: {
      email: "alpha.sow.demo@monsieurfanyi.gn",
      fullName: "Dr. Alpha Sow",
      phoneNumber: "+224620000003",
      passwordHash,
      role: UserRole.TEACHER,
      isActive: true,
      teacherProfile: {
        create: {
          headline: "Docteur en Mathématiques & Enseignant Chercheur",
          bio: "Plus de 8 ans d'expérience dans l'encadrement des classes d'examen en Guinée.",
          yearsOfExperience: 8,
          city: "Conakry",
          serviceArea: "Ratoma & Dixinn",
          verificationStatus: TeacherVerificationStatus.APPROVED,
          verifiedAt: new Date(),
          hourlyRateGnf: 60000,
          monthlyPackageRateGnf: 900000,
          monthlyPackageSessions: 8,
          monthlyPackageHoursPerSession: 2,
        },
      },
    },
    include: { teacherProfile: true },
  });
  const teacherProfile1 = teacher1User.teacherProfile!;

  // Enseignant Agréé 2 : Prof. Sekouba Traoré (Lettres & Philosophie)
  const teacher2User = await prisma.user.upsert({
    where: { email: "sekouba.traore.demo@monsieurfanyi.gn" },
    update: { passwordHash, isActive: true },
    create: {
      email: "sekouba.traore.demo@monsieurfanyi.gn",
      fullName: "Prof. Sékouba Traoré",
      phoneNumber: "+224620000004",
      passwordHash,
      role: UserRole.TEACHER,
      isActive: true,
      teacherProfile: {
        create: {
          headline: "Professeur Certifié de Lettres Modernes",
          bio: "Spécialiste de la méthodologie de dissertation et commentaire composé.",
          yearsOfExperience: 6,
          city: "Conakry",
          serviceArea: "Matam & Kaloum",
          verificationStatus: TeacherVerificationStatus.APPROVED,
          verifiedAt: new Date(),
          hourlyRateGnf: 50000,
          monthlyPackageRateGnf: 750000,
        },
      },
    },
    include: { teacherProfile: true },
  });
  const teacherProfile2 = teacher2User.teacherProfile!;

  // Enseignant En Attente : Mariama Barry (Modération administrative)
  const teacherPendingUser = await prisma.user.upsert({
    where: { email: "mariama.barry.demo@monsieurfanyi.gn" },
    update: { passwordHash, isActive: true },
    create: {
      email: "mariama.barry.demo@monsieurfanyi.gn",
      fullName: "Mme Mariama Barry",
      phoneNumber: "+224620000005",
      passwordHash,
      role: UserRole.TEACHER,
      isActive: true,
      teacherProfile: {
        create: {
          headline: "Licenciée en Sciences Économiques",
          bio: "Enseignante passionnée de Mathématiques appliquées et Économie.",
          yearsOfExperience: 3,
          city: "Conakry",
          verificationStatus: TeacherVerificationStatus.PENDING_REVIEW,
          submittedAt: new Date(),
        },
      },
    },
    include: { teacherProfile: true },
  });
  console.log(`✅ Enseignants créés : ${teacher1User.fullName} (Agréé), ${teacher2User.fullName} (Agréé), ${teacherPendingUser.fullName} (En attente)`);

  // 5. Scénario Démo A : Classe Parent-Led Active (Mathématiques Terminale SM)
  let tutoringRequestMath = await prisma.tutoringRequest.findFirst({
    where: { parentId: parentProfile.id, studentId: studentIbrahima.id, subjectName: "Mathématiques" },
  });
  if (!tutoringRequestMath) {
    tutoringRequestMath = await prisma.tutoringRequest.create({
      data: {
        parentId: parentProfile.id,
        studentId: studentIbrahima.id,
        subjectName: "Mathématiques",
        gradeLevelName: "Terminale SM",
        cycle: "LYCEE",
        mode: TutoringMode.HOME,
        status: RequestStatus.MATCHED,
        budgetGnf: 1200000,
        budgetType: "MONTHLY",
        city: "Conakry",
        commune: "Ratoma",
        neighborhood: "Kipé",
        publishedAt: new Date(Date.now() - 30 * 86400000),
      },
    });
  }

  let applicationMath = await prisma.teacherApplication.findFirst({
    where: { requestId: tutoringRequestMath.id, teacherProfileId: teacherProfile1.id },
  });
  if (!applicationMath) {
    applicationMath = await prisma.teacherApplication.create({
      data: {
        requestId: tutoringRequestMath.id,
        teacherProfileId: teacherProfile1.id,
        proposedRateGnf: 1200000,
        pitchMessage: "Bonjour M. Bah, j'ai accompagné de nombreux lauréats au bac SM avec une méthodologie rigoureuse.",
        status: ApplicationStatus.ACCEPTED,
        decisionAt: new Date(Date.now() - 28 * 86400000),
      },
    });
  }

  let classroomMath = await prisma.classroom.findFirst({
    where: { studentId: studentIbrahima.id, teacherProfileId: teacherProfile1.id, subjectName: "Mathématiques" },
  });
  if (!classroomMath) {
    classroomMath = await prisma.classroom.create({
      data: {
        requestId: tutoringRequestMath.id,
        teacherProfileId: teacherProfile1.id,
        studentId: studentIbrahima.id,
        subjectName: "Mathématiques",
        mode: TutoringMode.HOME,
        monthlyRateGnf: 1200000,
        status: ClassroomStatus.ACTIVE,
        assignmentSource: "PARENT_APPLICATION",
      },
    });
  }

  // Forfait Financier Mensuel configuré (1,200,000 GNF / 8 séances de 90 min)
  let packageMath = await prisma.tutoringPackage.findFirst({
    where: { classroomId: classroomMath.id },
  });
  if (!packageMath) {
    const breakdown = PricingEngine.calculateMonthlyPackage({
      totalAmountGnf: 1200000,
      sessionsCount: 8,
      durationMinutes: 90,
    });
    packageMath = await prisma.tutoringPackage.create({
      data: {
        classroomId: classroomMath.id,
        pricingType: PricingOfferType.MONTHLY_PACKAGE,
        totalAmountGnf: 1200000,
        sessionsCount: 8,
        minutesPerSession: 90,
        totalPlannedMinutes: 720,
        baseSessionRateGnf: 150000,
        remainderGnf: 0,
        commissionRatePercent: 15,
        totalPlatformCommissionGnf: 180000, // 15%
        totalTeacherShareGnf: 1020000, // 85%
        allocationsJson: JSON.stringify(breakdown.allocations),
        status: PackageStatus.ACTIVE,
        notes: "Forfait d'excellence Terminale SM (8 séances x 90 min)",
        fundedAt: new Date(Date.now() - 25 * 86400000),
      },
    });
  }
  console.log(`✅ Classe Démo A configurée : Mathématiques (Actif, Forfait 1,200,000 GNF)`);

  // Séances de la Classe de Mathématiques
  const basePast = Date.now() - 14 * 86400000;

  // Helper to safely get or create session
  async function getOrCreateSession(data: any) {
    let sess = await prisma.lessonSession.findFirst({
      where: {
        classroomId: data.classroomId,
        sessionSequence: data.sessionSequence,
      },
    });
    if (!sess) {
      sess = await prisma.lessonSession.create({ data });
    }
    return sess;
  }

  // Séance 1 : Validée par le parent (PRESENT)
  const session1 = await getOrCreateSession({
    classroomId: classroomMath.id,
    packageId: packageMath.id,
    sessionSequence: 1,
    scheduledStart: new Date(basePast + 1 * 86400000),
    scheduledEnd: new Date(basePast + 1 * 86400000 + 5400000),
    durationMinutes: 90,
    actualDurationMinutes: 90,
    status: SessionStatus.PARENT_APPROVED,
    attendanceStatus: LessonAttendance.PRESENT,
    attendanceRecordedAt: new Date(basePast + 1 * 86400000 + 5400000),
    attendanceRecordedById: teacher1User.id,
    allocatedAmountGnf: 150000,
    platformCommissionGnf: 22500,
    teacherNetGnf: 127500,
    title: "Séance #1 : Continuité et Dérivabilité",
  });

  await prisma.lessonReport.upsert({
    where: { sessionId: session1.id },
    update: {},
    create: {
      sessionId: session1.id,
      topicsCovered: "Théorème des valeurs intermédiaires et dérivées usuelles",
      learningObjectives: "Savoir appliquer le TVI et dériver les fonctions composées",
      studentEffort: "EXCELLENT",
      strengths: "Compréhension très rapide des concepts abstraits",
      areasForImprovement: "Bien rédiger la continuité stricte avant d'appliquer le théorème",
      status: ReportStatus.VALIDATED,
      progressRating: 5,
      submittedAt: new Date(basePast + 1 * 86400000 + 7200000),
    },
  });

  await prisma.lessonApproval.upsert({
    where: { sessionId: session1.id },
    update: {},
    create: {
      sessionId: session1.id,
      approvedBy: parentUser.id,
      feedbackNote: "Très bonne séance, Ibrahima a apprécié la clarté des explications.",
      approvedAt: new Date(basePast + 2 * 86400000),
    },
  });

  // Séance 2 : Arbitrée par l'administrateur suite à contestation (LATE)
  const session2 = await getOrCreateSession({
    classroomId: classroomMath.id,
    packageId: packageMath.id,
    sessionSequence: 2,
    scheduledStart: new Date(basePast + 4 * 86400000),
    scheduledEnd: new Date(basePast + 4 * 86400000 + 5400000),
    durationMinutes: 90,
    actualDurationMinutes: 75,
    status: SessionStatus.ADMIN_RESOLVED,
    attendanceStatus: LessonAttendance.LATE,
    attendanceRecordedAt: new Date(basePast + 4 * 86400000 + 5400000),
    attendanceRecordedById: teacher1User.id,
    allocatedAmountGnf: 150000,
    platformCommissionGnf: 22500,
    teacherNetGnf: 127500,
    title: "Séance #2 : Fonctions Logarithmes & Exponentielles",
  });

  await prisma.lessonReport.upsert({
    where: { sessionId: session2.id },
    update: {},
    create: {
      sessionId: session2.id,
      topicsCovered: "Fonction Logarithme Népérien : domaine et limites",
      learningObjectives: "Résoudre des équations ln(x) = k et étudier les variations",
      studentEffort: "GOOD",
      strengths: "Calcul algébrique maîtrisé",
      areasForImprovement: "Attention aux conditions d'existence sur le domaine",
      status: ReportStatus.VALIDATED,
      progressRating: 4,
      submittedAt: new Date(basePast + 4 * 86400000 + 7200000),
    },
  });

  await prisma.lessonDispute.upsert({
    where: { sessionId: session2.id },
    update: {},
    create: {
      sessionId: session2.id,
      openedBy: parentUser.id,
      category: "LATENESS",
      reason: "Le professeur est arrivé avec 20 minutes de retard en raison d'embouteillages.",
      status: DisputeStatus.RESOLVED_VALIDATED,
      teacherResponse: "Je confirme le retard dû à un accident sur l'axe Hamdallaye. Les 20 minutes ont été compensées.",
      teacherRespondedAt: new Date(basePast + 5 * 86400000),
      resolvedById: adminUser.id,
      resolvedAt: new Date(basePast + 6 * 86400000),
      adminNote: "Entente confirmée entre les deux parties. Rattrapage pédagogique validé.",
    },
  });

  // Séance 3 : En attente de validation parent (Idéal pour démonstration en direct !)
  const session3 = await getOrCreateSession({
    classroomId: classroomMath.id,
    packageId: packageMath.id,
    sessionSequence: 3,
    scheduledStart: new Date(basePast + 7 * 86400000),
    scheduledEnd: new Date(basePast + 7 * 86400000 + 5400000),
    durationMinutes: 90,
    actualDurationMinutes: 90,
    status: SessionStatus.TEACHER_COMPLETED,
    attendanceStatus: LessonAttendance.PRESENT,
    attendanceRecordedAt: new Date(basePast + 7 * 86400000 + 5400000),
    attendanceRecordedById: teacher1User.id,
    allocatedAmountGnf: 150000,
    platformCommissionGnf: 22500,
    teacherNetGnf: 127500,
    title: "Séance #3 : Équations Différentielles du 1er Ordre",
  });

  await prisma.lessonReport.upsert({
    where: { sessionId: session3.id },
    update: {},
    create: {
      sessionId: session3.id,
      topicsCovered: "Résolution de y' + ay = b et problèmes de conditions initiales",
      learningObjectives: "Déterminer la solution générale et la solution particulière",
      studentEffort: "EXCELLENT",
      strengths: "Démonstrations très rigoureuses, aucune hésitation sur les primitives",
      areasForImprovement: "Accélérer sur la rédaction des étapes préliminaires",
      status: ReportStatus.SUBMITTED,
      progressRating: 5,
      submittedAt: new Date(basePast + 7 * 86400000 + 7200000),
    },
  });

  // Séance 4 : Absence Excusée (EXCUSED)
  await getOrCreateSession({
    classroomId: classroomMath.id,
    packageId: packageMath.id,
    sessionSequence: 4,
    scheduledStart: new Date(basePast + 10 * 86400000),
    scheduledEnd: new Date(basePast + 10 * 86400000 + 5400000),
    durationMinutes: 90,
    status: SessionStatus.TEACHER_COMPLETED,
    attendanceStatus: LessonAttendance.EXCUSED,
    attendanceRecordedAt: new Date(basePast + 10 * 86400000 + 5400000),
    attendanceRecordedById: teacher1User.id,
    allocatedAmountGnf: 150000,
    platformCommissionGnf: 22500,
    teacherNetGnf: 127500,
    title: "Séance #4 : Géométrie dans l'Espace (Reportée pour raison médicale)",
  });

  // Séance 5 : Future Séance Programmée
  await getOrCreateSession({
    classroomId: classroomMath.id,
    packageId: packageMath.id,
    sessionSequence: 5,
    scheduledStart: new Date(Date.now() + 3 * 86400000),
    scheduledEnd: new Date(Date.now() + 3 * 86400000 + 5400000),
    durationMinutes: 90,
    status: SessionStatus.SCHEDULED,
    allocatedAmountGnf: 150000,
    platformCommissionGnf: 22500,
    teacherNetGnf: 127500,
    title: "Séance #5 : Nombres Complexes & Trigonométrie",
  });

  // 6. Carnet de Progression Numérique : Devoirs & Évaluations Démo
  const existingHw = await prisma.homeworkAssignment.findFirst({
    where: { classroomId: classroomMath.id, title: "Devoir Maison : Équations Différentielles" },
  });
  if (!existingHw) {
    await prisma.homeworkAssignment.create({
      data: {
        studentId: studentIbrahima.id,
        classroomId: classroomMath.id,
        teacherProfileId: teacherProfile1.id,
        subjectName: "Mathématiques",
        title: "Devoir Maison : Équations Différentielles",
        description: "Exercices 1 à 6 page 142 du manuel Terminale SM. Détailler toutes les solutions homogènes et particulières.",
        status: HomeworkStatus.COMPLETED,
        dueDate: new Date(basePast + 6 * 86400000),
        studentSubmission: "Exercices rédigés au propre sur 4 pages remises lors de la séance.",
        submittedAt: new Date(basePast + 6 * 86400000),
        teacherFeedback: "Excellent devoir (18/20). La rigueur mathématique est au niveau d'un baccalauréat avec mention Très Bien.",
        completedAt: new Date(basePast + 7 * 86400000),
      },
    });

    await prisma.homeworkAssignment.create({
      data: {
        studentId: studentIbrahima.id,
        classroomId: classroomMath.id,
        teacherProfileId: teacherProfile1.id,
        subjectName: "Mathématiques",
        title: "Devoir N°2 : Trigonométrie et Formules d'Euler",
        description: "Résolution des équations trigonométriques et linéarisation de cos^4(x).",
        status: HomeworkStatus.ASSIGNED,
        dueDate: new Date(Date.now() + 4 * 86400000),
      },
    });
  }

  const existingAssessment = await prisma.academicAssessment.findFirst({
    where: { studentId: studentIbrahima.id, classroomId: classroomMath.id },
  });
  if (!existingAssessment) {
    await prisma.academicAssessment.create({
      data: {
        studentId: studentIbrahima.id,
        classroomId: classroomMath.id,
        teacherProfileId: teacherProfile1.id,
        subjectName: "Mathématiques",
        title: "Contrôle N°1 : Analyse & Dérivation",
        assessmentType: AssessmentType.TOPIC_TEST,
        assessmentDate: new Date(basePast + 3 * 86400000),
        obtainedScore: 17.5,
        maxScore: 20,
        percentage: 87.5,
        learningObjectives: "Maîtrise du calcul des dérivées, limites indéterminées et asymptotes.",
        teacherComments: "Très belle copie. Les justifications sont précises et claires.",
      },
    });

    await prisma.academicAssessment.create({
      data: {
        studentId: studentIbrahima.id,
        classroomId: classroomMath.id,
        teacherProfileId: teacherProfile1.id,
        subjectName: "Mathématiques",
        title: "Interrogation Écrite : Fonctions Logarithmiques",
        assessmentType: AssessmentType.WEEKLY_QUIZ,
        assessmentDate: new Date(basePast + 8 * 86400000),
        obtainedScore: 16.0,
        maxScore: 20,
        percentage: 80.0,
        learningObjectives: "Résolution rapide d'équations avec ln et étude des variations.",
        teacherComments: "Bonne maîtrise des formules fondamentales.",
      },
    });
  }

  // Observations Pédagogiques
  const existingObs = await prisma.subjectProgressObservation.findFirst({
    where: { studentId: studentIbrahima.id, classroomId: classroomMath.id },
  });
  if (!existingObs) {
    await prisma.subjectProgressObservation.create({
      data: {
        studentId: studentIbrahima.id,
        classroomId: classroomMath.id,
        teacherProfileId: teacherProfile1.id,
        subjectName: "Mathématiques",
        observationDate: new Date(basePast + 9 * 86400000),
        topicsMastered: "Continuité, Dérivation, Logarithmes, Équations Différentielles",
        strengths: "Excellente logique déductive, Rapidité de calcul, Investissement personnel exemplaire",
        areasForImprovement: "Gagner en concision sur les préliminaires de rédaction",
        recommendations: "Poursuivre sur les nombres complexes avant d'aborder les intégrales et probabilités.",
        progressRating: 5,
      },
    });
  }
  console.log(`✅ Carnet de Progression Numérique Démo configuré : Devoirs, Notes (17.5/20 et 16/20) et Observations`);

  // 7. Scénario Démo B : Classe Affectation Directe Assistée par Téléphone (+50€)
  let classroomFr = await prisma.classroom.findFirst({
    where: { studentId: studentMariama.id, teacherProfileId: teacherProfile2.id, subjectName: "Français" },
  });
  if (!classroomFr) {
    classroomFr = await prisma.classroom.create({
      data: {
        teacherProfileId: teacherProfile2.id,
        studentId: studentMariama.id,
        subjectName: "Français",
        mode: TutoringMode.HOME,
        monthlyRateGnf: 750000,
        status: ClassroomStatus.PENDING_PAYMENT, // Strictement en attente de paiement
        isAssistedAssignment: true,
        assignmentSource: "PHONE_INQUIRY",
        assignedByAdminId: adminUser.id,
        adminNotes: "Demande reçue au standard téléphonique de Monsieur Fanyi Conakry. Famille souhaitant un renforcement pour le BEPC.",
      },
    });

    await prisma.tutoringPackage.create({
      data: {
        classroomId: classroomFr.id,
        pricingType: PricingOfferType.MONTHLY_PACKAGE,
        totalAmountGnf: 750000,
        sessionsCount: 8,
        minutesPerSession: 90,
        totalPlannedMinutes: 720,
        baseSessionRateGnf: 93750,
        remainderGnf: 0,
        commissionRatePercent: 15,
        totalPlatformCommissionGnf: 112500,
        totalTeacherShareGnf: 637500,
        status: PackageStatus.PENDING_PAYMENT,
        notes: "Forfait BEPC Français (Affectation directe assistée)",
      },
    });
  }
  console.log(`✅ Classe Démo B configurée : Français Mariama Bah (Affectation téléphonique directe, PENDING_PAYMENT)`);

  // 8. Demande Ouverte en Cours (pour démonstration candidature en direct)
  const openReq = await prisma.tutoringRequest.findFirst({
    where: { studentId: studentIbrahima.id, subjectName: "Physique-Chimie", status: RequestStatus.OPEN },
  });
  if (!openReq) {
    await prisma.tutoringRequest.create({
      data: {
        parentId: parentProfile.id,
        studentId: studentIbrahima.id,
        subjectName: "Physique-Chimie",
        gradeLevelName: "Terminale SM",
        cycle: "LYCEE",
        mode: TutoringMode.HOME,
        status: RequestStatus.OPEN,
        budgetGnf: 900000,
        budgetType: "MONTHLY",
        city: "Conakry",
        commune: "Ratoma",
        neighborhood: "Kipé",
        learningGoals: "Renforcement sur les circuits RLC et la cinétique chimique.",
        description: "Recherche un enseignant expérimenté pour 2 séances hebdomadaires à domicile.",
        publishedAt: new Date(),
      },
    });
    console.log(`✅ Demande ouverte publiée : Physique-Chimie pour Ibrahima Bah (Prête pour candidature en direct)`);
  }

  console.log("\n===============================================================================");
  console.log("🎉 ENVIRONNEMENT DE DÉMONSTRATION MONSIEUR FANYI (MILESTONE 2) PRÊT !");
  console.log("===============================================================================");
  console.log("Comptes de test (Mot de passe universel : DemoFanyi2026!) :\n");
  console.log("1. 🛡️  ADMINISTRATEUR :");
  console.log("   Email : admin.demo@monsieurfanyi.gn");
  console.log("   Rôle  : Direction & Audit | Accès complet aux validations, litiges & affectations directes\n");
  console.log("2. 👨‍👩‍👧 PARENT :");
  console.log("   Email : mamadou.bah.demo@monsieurfanyi.gn");
  console.log("   Rôle  : Parent de famille (Élèves : Ibrahima Bah & Mariama Bah)");
  console.log("   Accès : Validation séances, carnet de progression officiel, suivi des forfaits\n");
  console.log("3. 👨‍🏫 ENSEIGNANT AGRÉÉ 1 (Sciences) :");
  console.log("   Email : alpha.sow.demo@monsieurfanyi.gn");
  console.log("   Rôle  : Professeur de Mathématiques (Classe active avec Ibrahima Bah)\n");
  console.log("4. 👨‍🏫 ENSEIGNANT AGRÉÉ 2 (Lettres) :");
  console.log("   Email : sekouba.traore.demo@monsieurfanyi.gn");
  console.log("   Rôle  : Professeur de Français (Affectation directe assistée)\n");
  console.log("5. ⏳ ENSEIGNANT EN ATTENTE :");
  console.log("   Email : mariama.barry.demo@monsieurfanyi.gn");
  console.log("   Rôle  : Candidat tuteur en cours d'évaluation par la modération\n");
  console.log("===============================================================================\n");
}

if (require.main === module) {
  seedPhase13Demo()
    .then(async () => {
      await prisma.$disconnect();
      process.exit(0);
    })
    .catch(async (e) => {
      console.error("❌ Erreur lors du déploiement démo :", e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
