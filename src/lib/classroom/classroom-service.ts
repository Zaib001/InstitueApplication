import { prisma } from "@/lib/db/prisma";
import {
  ApplicationStatus,
  ClassroomStatus,
  PackageStatus,
  PricingOfferType,
  RequestStatus,
  TeacherVerificationStatus,
  TutoringMode,
  UserRole,
  NotificationEventType,
  NotificationPriority,
} from "@prisma/client";
import { PricingEngine } from "@/lib/pricing/pricing-engine";
import { NotificationService } from "@/lib/notifications/notification-service";

export class ClassroomServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "ClassroomServiceError";
    this.statusCode = statusCode;
  }
}

export interface ParentSelectionParams {
  requestId: string;
  applicationId: string;
  parentUserId: string;
}

export interface AdminAssistedClassroomParams {
  adminUserId: string;
  parentProfileId: string;
  studentId: string;
  teacherProfileId: string;
  subjectName: string;
  mode: TutoringMode;
  gradeLevelName?: string;
  cycle?: string | null;
  hourlyRateGnf?: number | null;
  monthlyRateGnf?: number | null;
  sessionsCount?: number | null;
  minutesPerSession?: number | null;
  assignmentSource: string; // "PHONE_INQUIRY" | "DIRECT_OFFICE" | "ADMIN_MATCH"
  adminNotes?: string | null;
  city?: string;
  commune?: string | null;
  locationAddress?: string | null;
  preferredSchedule?: string | null;
}

export interface ShortlistApplicationParams {
  requestId: string;
  applicationId: string;
  parentUserId: string;
}

/**
 * Shared Domain Service for Classroom Creation and Applications lifecycle
 */
export class ClassroomService {
  /**
   * Parent shortlists a submitted application
   */
  static async shortlistApplication({
    requestId,
    applicationId,
    parentUserId,
  }: ShortlistApplicationParams) {
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: parentUserId },
    });

    if (!parentProfile) {
      throw new ClassroomServiceError("Profil parent introuvable", 404);
    }

    const request = await prisma.tutoringRequest.findUnique({
      where: { id: requestId },
      include: { student: true },
    });

    if (!request) {
      throw new ClassroomServiceError("Demande de tutorat introuvable", 404);
    }

    if (request.parentId !== parentProfile.id) {
      throw new ClassroomServiceError(
        "Vous n'êtes pas autorisé à modifier cette demande",
        403
      );
    }

    if (request.status !== RequestStatus.OPEN) {
      throw new ClassroomServiceError(
        "Seules les demandes ouvertes permettent la présélection de candidatures",
        400
      );
    }

    const application = await prisma.teacherApplication.findUnique({
      where: { id: applicationId },
      include: {
        teacherProfile: {
          include: { user: true },
        },
      },
    });

    if (!application || application.requestId !== requestId) {
      throw new ClassroomServiceError("Candidature introuvable pour cette demande", 404);
    }

    if (application.status !== ApplicationStatus.SUBMITTED) {
      throw new ClassroomServiceError(
        `Impossible de présélectionner une candidature avec le statut ${application.status}`,
        400
      );
    }

    const updatedApplication = await prisma.$transaction(async (tx) => {
      const app = await tx.teacherApplication.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.SHORTLISTED,
        },
      });

      // Notification for teacher
      await NotificationService.publishNotificationEvent(
        {
          eventType: NotificationEventType.TEACHER_SHORTLISTED,
          recipientUserId: application.teacherProfile.userId,
          entityType: "TeacherApplication",
          entityId: applicationId,
          title: "Candidature présélectionnée !",
          message: `Votre candidature pour la demande de soutien en ${request.subjectName} (${request.student.fullName}) a été présélectionnée par la famille.`,
          linkUrl: `/teacher/applications`,
          priority: NotificationPriority.NORMAL,
          emailPayload: {
            subjectName: request.subjectName,
            studentName: request.student.fullName,
          },
        },
        tx
      );

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: parentUserId,
          action: "PARENT_SHORTLIST_APPLICATION",
          entityType: "TeacherApplication",
          entityId: applicationId,
          detailsJson: JSON.stringify({
            requestId,
            teacherProfileId: application.teacherProfileId,
          }),
        },
      });

      return app;
    });

    return updatedApplication;
  }

  /**
   * Workflow A: Parent selects a teacher from submitted/shortlisted applications
   * Atomically accepts application, sets request to MATCHED, creates Classroom with PENDING_PAYMENT,
   * cleanly rejects other candidates, and dispatches notifications.
   */
  static async createClassroomFromParentSelection({
    requestId,
    applicationId,
    parentUserId,
  }: ParentSelectionParams) {
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: parentUserId },
    });

    if (!parentProfile) {
      throw new ClassroomServiceError("Profil parent introuvable", 404);
    }

    const request = await prisma.tutoringRequest.findUnique({
      where: { id: requestId },
      include: {
        student: true,
        classroom: true,
      },
    });

    if (!request) {
      throw new ClassroomServiceError("Demande de tutorat introuvable", 404);
    }

    if (request.parentId !== parentProfile.id) {
      throw new ClassroomServiceError(
        "Vous n'êtes pas autorisé à valider cette demande",
        403
      );
    }

    if (request.status !== RequestStatus.OPEN) {
      throw new ClassroomServiceError(
        `Impossible de sélectionner un professeur : la demande est actuellement au statut ${request.status}`,
        400
      );
    }

    if (request.classroom) {
      throw new ClassroomServiceError(
        "Une classe a déjà été créée pour cette demande de soutien",
        409
      );
    }

    const application = await prisma.teacherApplication.findUnique({
      where: { id: applicationId },
      include: {
        teacherProfile: {
          include: { user: true },
        },
      },
    });

    if (!application || application.requestId !== requestId) {
      throw new ClassroomServiceError(
        "Candidature introuvable pour cette demande",
        404
      );
    }

    if (
      application.status !== ApplicationStatus.SUBMITTED &&
      application.status !== ApplicationStatus.SHORTLISTED
    ) {
      throw new ClassroomServiceError(
        `Impossible d'accepter une candidature avec le statut ${application.status}`,
        400
      );
    }

    // Security Gate: Teacher must be APPROVED and active
    if (
      application.teacherProfile.verificationStatus !==
      TeacherVerificationStatus.APPROVED
    ) {
      throw new ClassroomServiceError(
        "Ce professeur n'est pas encore certifié par la modération Monsieur Fanyi",
        403
      );
    }

    if (!application.teacherProfile.user.isActive) {
      throw new ClassroomServiceError(
        "Le compte de cet enseignant est temporairement suspendu",
        403
      );
    }

    // Determine pricing rates from application or request
    const isMonthly =
      application.proposedRateType === "MONTHLY" ||
      (!application.proposedRateType && request.budgetType === "MONTHLY");

    const monthlyRateGnf = isMonthly
      ? application.proposedRateGnf || request.budgetGnf
      : null;

    const hourlyRateGnf = !isMonthly
      ? application.proposedRateGnf || request.budgetGnf
      : null;

    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();

      // 1. Mark selected application as ACCEPTED
      const acceptedApp = await tx.teacherApplication.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.ACCEPTED,
          decisionAt: now,
        },
      });

      // 2. Reject all other competing active applications for this request
      await tx.teacherApplication.updateMany({
        where: {
          requestId,
          id: { not: applicationId },
          status: { in: [ApplicationStatus.SUBMITTED, ApplicationStatus.SHORTLISTED] },
        },
        data: {
          status: ApplicationStatus.REJECTED,
          decisionAt: now,
          rejectionReason:
            "Une autre candidature a été retenue par la famille pour cette demande de soutien.",
        },
      });

      // 3. Mark TutoringRequest as MATCHED
      const updatedRequest = await tx.tutoringRequest.update({
        where: { id: requestId },
        data: {
          status: RequestStatus.MATCHED,
        },
      });

      // 4. Create Classroom with strict PENDING_PAYMENT invariant
      const newClassroom = await tx.classroom.create({
        data: {
          requestId: request.id,
          teacherProfileId: application.teacherProfileId,
          studentId: request.studentId,
          subjectName: request.subjectName,
          mode: request.mode,
          hourlyRateGnf,
          monthlyRateGnf,
          isAssistedAssignment: false,
          status: ClassroomStatus.PENDING_PAYMENT,
        },
        include: {
          teacherProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          student: true,
        },
      });

      // 4b. Provision agreed TutoringPackage snapshot with deterministic session allocation
      const activeCommission = await PricingEngine.getActiveCommissionRate();
      const pricingType = isMonthly
        ? PricingOfferType.MONTHLY_PACKAGE
        : PricingOfferType.HOURLY;
      const packageAmountGnf = isMonthly
        ? (monthlyRateGnf || 800000)
        : (hourlyRateGnf || 50000);
      const packageSessionsCount = 8;
      const packageDurationMinutes = 60;

      const calculatedPricing = PricingEngine.calculatePackage({
        pricingType,
        amountGnf: packageAmountGnf,
        sessionsCount: packageSessionsCount,
        minutesPerSession: packageDurationMinutes,
        commissionRatePercent: activeCommission,
      });

      await tx.tutoringPackage.create({
        data: {
          classroomId: newClassroom.id,
          pricingType,
          hourlyRateGnf: calculatedPricing.hourlyRateGnf,
          totalAmountGnf: calculatedPricing.totalAmountGnf,
          sessionsCount: calculatedPricing.sessionsCount,
          minutesPerSession: calculatedPricing.minutesPerSession,
          totalPlannedMinutes: calculatedPricing.totalPlannedMinutes,
          baseSessionRateGnf: calculatedPricing.baseSessionRateGnf,
          remainderGnf: calculatedPricing.remainderGnf,
          commissionRatePercent: calculatedPricing.commissionRatePercent,
          totalPlatformCommissionGnf: calculatedPricing.totalPlatformCommissionGnf,
          totalTeacherShareGnf: calculatedPricing.totalTeacherShareGnf,
          allocationsJson: JSON.stringify(calculatedPricing.allocations),
          status: PackageStatus.PENDING_PAYMENT,
          version: 1,
          agreedAt: now,
        },
      });

      // 5. Notify Parent
      await NotificationService.publishNotificationEvent(
        {
          eventType: NotificationEventType.TEACHER_SELECTED,
          recipientUserId: parentUserId,
          entityType: "Classroom",
          entityId: newClassroom.id,
          title: "Professeur sélectionné avec succès !",
          message: `Félicitations ! Vous avez retenu la candidature de ${application.teacherProfile.user.fullName} pour ${request.student.fullName} en ${request.subjectName}. Votre classe est créée (en attente du règlement initial).`,
          linkUrl: `/parent/classes`,
          priority: NotificationPriority.HIGH,
          emailPayload: {
            subjectName: request.subjectName,
            studentName: request.student.fullName,
            teacherName: application.teacherProfile.user.fullName,
          },
        },
        tx
      );

      // 6. Notify Teacher
      await NotificationService.publishNotificationEvent(
        {
          eventType: NotificationEventType.TEACHER_SELECTED,
          recipientUserId: application.teacherProfile.userId,
          entityType: "Classroom",
          entityId: newClassroom.id,
          title: "Candidature acceptée !",
          message: `Excellente nouvelle ! Votre candidature pour encadrer ${request.student.fullName} en ${request.subjectName} a été retenue par la famille. La classe a été créée (statut : en attente de paiement initial).`,
          linkUrl: `/teacher/classes`,
          priority: NotificationPriority.URGENT,
          emailPayload: {
            subjectName: request.subjectName,
            studentName: request.student.fullName,
          },
        },
        tx
      );

      // 7. Audit log
      await tx.auditLog.create({
        data: {
          userId: parentUserId,
          action: "PARENT_SELECT_TEACHER",
          entityType: "Classroom",
          entityId: newClassroom.id,
          detailsJson: JSON.stringify({
            requestId,
            applicationId,
            teacherProfileId: application.teacherProfileId,
            studentId: request.studentId,
            monthlyRateGnf,
            hourlyRateGnf,
            status: ClassroomStatus.PENDING_PAYMENT,
          }),
        },
      });

      return {
        classroom: newClassroom,
        request: updatedRequest,
        application: acceptedApp,
      };
    });

    return result;
  }

  /**
   * Workflow B: Administrator-Assisted Direct Class Assignment
   * For telephone/in-person inquiries. Atomically provisions assisted TutoringRequest,
   * synthetic accepted application, and direct Classroom with PENDING_PAYMENT status and full audit trail.
   */
  static async createAdminAssistedClassroom({
    adminUserId,
    parentProfileId,
    studentId,
    teacherProfileId,
    subjectName,
    mode,
    gradeLevelName,
    cycle,
    hourlyRateGnf,
    monthlyRateGnf,
    sessionsCount,
    minutesPerSession,
    assignmentSource,
    adminNotes,
    city = "Conakry",
    commune,
    locationAddress,
    preferredSchedule,
  }: AdminAssistedClassroomParams) {
    // 1. Verify admin role
    const adminUser = await prisma.user.findUnique({
      where: { id: adminUserId },
    });

    if (!adminUser || adminUser.role !== UserRole.ADMIN) {
      throw new ClassroomServiceError(
        "Seuls les administrateurs Monsieur Fanyi peuvent effectuer une affectation directe",
        403
      );
    }

    // 2. Verify parent profile
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { id: parentProfileId },
      include: { user: true },
    });

    if (!parentProfile) {
      throw new ClassroomServiceError("Profil parent introuvable", 404);
    }

    // 3. Verify student belongs to parent
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
    });

    if (!student || student.parentId !== parentProfile.id) {
      throw new ClassroomServiceError(
        "L'élève sélectionné n'appartient pas à ce compte parent",
        404
      );
    }

    // 4. Verify teacher profile & strict APPROVED gate
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { id: teacherProfileId },
      include: { user: true },
    });

    if (!teacherProfile) {
      throw new ClassroomServiceError("Profil enseignant introuvable", 404);
    }

    if (
      teacherProfile.verificationStatus !== TeacherVerificationStatus.APPROVED
    ) {
      throw new ClassroomServiceError(
        "Affectation impossible : Cet enseignant n'a pas été approuvé par la modération",
        403
      );
    }

    if (!teacherProfile.user.isActive) {
      throw new ClassroomServiceError(
        "Affectation impossible : Le compte de cet enseignant est inactif ou suspendu",
        403
      );
    }

    // 5. Rates validation
    const hasHourly = typeof hourlyRateGnf === "number" && hourlyRateGnf > 0;
    const hasMonthly = typeof monthlyRateGnf === "number" && monthlyRateGnf > 0;

    if (!hasHourly && !hasMonthly) {
      throw new ClassroomServiceError(
        "Un tarif valide (horaire ou forfait mensuel en GNF) doit être stipulé pour cette affectation",
        400
      );
    }

    // 6. Duplicate prevention check
    const existingClassroom = await prisma.classroom.findFirst({
      where: {
        studentId,
        teacherProfileId,
        subjectName,
        status: { in: [ClassroomStatus.PENDING_PAYMENT, ClassroomStatus.ACTIVE] },
      },
    });

    if (existingClassroom) {
      throw new ClassroomServiceError(
        `Une classe existe déjà entre cet élève et ce professeur pour la matière ${subjectName}`,
        409
      );
    }

    const calculatedBudget = hasMonthly
      ? (monthlyRateGnf as number)
      : (hourlyRateGnf as number) * 8;
    const budgetType = hasMonthly ? "MONTHLY" : "HOURLY";

    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();

      // 1. Create assisted TutoringRequest
      const assistedRequest = await tx.tutoringRequest.create({
        data: {
          parentId: parentProfile.id,
          studentId: student.id,
          subjectName,
          gradeLevelName: gradeLevelName || student.gradeLevel,
          cycle: cycle || student.cycle,
          mode,
          budgetGnf: calculatedBudget,
          budgetType,
          city,
          commune,
          locationAddress,
          preferredSchedule,
          notes: adminNotes,
          status: RequestStatus.MATCHED,
          isAssisted: true,
          publishedAt: now,
        },
      });

      // 2. Create synthetic accepted application for full traceability
      const syntheticApp = await tx.teacherApplication.create({
        data: {
          requestId: assistedRequest.id,
          teacherProfileId: teacherProfile.id,
          pitchMessage: `Attribution directe assistée par l'administration (${assignmentSource})`,
          proposedRateGnf: hasMonthly ? monthlyRateGnf : hourlyRateGnf,
          proposedRateType: budgetType,
          status: ApplicationStatus.ACCEPTED,
          isAssisted: true,
          decisionAt: now,
        },
      });

      // 3. Create Classroom in PENDING_PAYMENT status
      const classroom = await tx.classroom.create({
        data: {
          requestId: assistedRequest.id,
          teacherProfileId: teacherProfile.id,
          studentId: student.id,
          subjectName,
          mode,
          hourlyRateGnf: hasHourly ? hourlyRateGnf : null,
          monthlyRateGnf: hasMonthly ? monthlyRateGnf : null,
          isAssistedAssignment: true,
          assignedByAdminId: adminUserId,
          assignmentSource: assignmentSource || "PHONE_INQUIRY",
          adminNotes: adminNotes || null,
          status: ClassroomStatus.PENDING_PAYMENT,
        },
        include: {
          teacherProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phoneNumber: true,
                },
              },
            },
          },
          student: true,
        },
      });

      // 3b. Provision agreed TutoringPackage snapshot with deterministic session allocation
      const activeCommission = await PricingEngine.getActiveCommissionRate();
      const pricingType = hasMonthly
        ? PricingOfferType.MONTHLY_PACKAGE
        : PricingOfferType.HOURLY;
      const packageAmountGnf = hasMonthly
        ? (monthlyRateGnf as number)
        : (hourlyRateGnf as number);
      const packageSessionsCount = sessionsCount && sessionsCount > 0 ? sessionsCount : 8;
      const packageDurationMinutes =
        minutesPerSession && minutesPerSession >= 15 ? minutesPerSession : 60;

      const calculatedPricing = PricingEngine.calculatePackage({
        pricingType,
        amountGnf: packageAmountGnf,
        sessionsCount: packageSessionsCount,
        minutesPerSession: packageDurationMinutes,
        commissionRatePercent: activeCommission,
      });

      await tx.tutoringPackage.create({
        data: {
          classroomId: classroom.id,
          pricingType,
          hourlyRateGnf: calculatedPricing.hourlyRateGnf,
          totalAmountGnf: calculatedPricing.totalAmountGnf,
          sessionsCount: calculatedPricing.sessionsCount,
          minutesPerSession: calculatedPricing.minutesPerSession,
          totalPlannedMinutes: calculatedPricing.totalPlannedMinutes,
          baseSessionRateGnf: calculatedPricing.baseSessionRateGnf,
          remainderGnf: calculatedPricing.remainderGnf,
          commissionRatePercent: calculatedPricing.commissionRatePercent,
          totalPlatformCommissionGnf: calculatedPricing.totalPlatformCommissionGnf,
          totalTeacherShareGnf: calculatedPricing.totalTeacherShareGnf,
          allocationsJson: JSON.stringify(calculatedPricing.allocations),
          status: PackageStatus.PENDING_PAYMENT,
          notes: adminNotes || null,
          version: 1,
          agreedAt: now,
        },
      });

      // 4. Notify Parent
      await NotificationService.publishNotificationEvent(
        {
          eventType: NotificationEventType.ADMIN_CLASSROOM_ASSIGNED,
          recipientUserId: parentProfile.userId,
          entityType: "Classroom",
          entityId: classroom.id,
          title: "Affectation directe confirmée",
          message: `L'administration Monsieur Fanyi a attribué le professeur ${teacherProfile.user.fullName} pour accompagner ${student.fullName} en ${subjectName}. Votre classe est enregistrée (en attente du règlement initial).`,
          linkUrl: `/parent/classes`,
          priority: NotificationPriority.URGENT,
          emailPayload: {
            subjectName,
            studentName: student.fullName,
            teacherName: teacherProfile.user.fullName,
          },
        },
        tx
      );

      // 5. Notify Teacher
      await NotificationService.publishNotificationEvent(
        {
          eventType: NotificationEventType.ADMIN_CLASSROOM_ASSIGNED,
          recipientUserId: teacherProfile.userId,
          entityType: "Classroom",
          entityId: classroom.id,
          title: "Nouvelle affectation directe !",
          message: `Vous avez été directement affecté(e) par l'administration pour encadrer ${student.fullName} en ${subjectName} (${mode}). La classe a été créée (en attente de règlement initial).`,
          linkUrl: `/teacher/classes`,
          priority: NotificationPriority.URGENT,
          emailPayload: {
            subjectName,
            studentName: student.fullName,
          },
        },
        tx
      );

      // 6. Audit Log identifying the admin and source
      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: "ADMIN_DIRECT_ASSIGNMENT",
          entityType: "Classroom",
          entityId: classroom.id,
          detailsJson: JSON.stringify({
            parentProfileId,
            studentId,
            teacherProfileId,
            subjectName,
            mode,
            assignmentSource,
            adminNotes,
            hourlyRateGnf,
            monthlyRateGnf,
            requestId: assistedRequest.id,
            syntheticAppId: syntheticApp.id,
            status: ClassroomStatus.PENDING_PAYMENT,
          }),
        },
      });

      return {
        classroom,
        request: assistedRequest,
        application: syntheticApp,
      };
    });

    return result;
  }
}

