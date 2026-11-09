import { prisma } from "@/lib/db/prisma";
import {
  NotificationEventType,
  NotificationPriority,
  EmailDeliveryStatus,
  Prisma,
} from "@prisma/client";
import { OutboxWorker } from "./outbox-worker";
import { EmailTemplateRegistry } from "./email-templates";

export interface PublishNotificationEventParams {
  eventType: NotificationEventType;
  recipientUserId: string;
  actorUserId?: string;
  entityType?: string;
  entityId?: string;
  title?: string;
  message?: string;
  linkUrl?: string;
  priority?: NotificationPriority;
  emailPayload?: Record<string, any>;
  dedupKey?: string;
  skipEmail?: boolean;
}

export class NotificationService {
  /**
   * Universal Domain Event Publisher.
   * Atomically records the in-app notification (and transactional email outbox item if eligible),
   * honoring recipient preferences, and dispatches an asynchronous outbox worker.
   */
  static async publishNotificationEvent(
    params: PublishNotificationEventParams,
    tx?: Prisma.TransactionClient
  ) {
    const db = tx || prisma;
    const {
      eventType,
      recipientUserId,
      entityType,
      entityId,
      linkUrl,
      priority = NotificationPriority.NORMAL,
      dedupKey,
      skipEmail = false,
    } = params;

    // 1. Fetch recipient user & preferences
    const recipient = await db.user.findUnique({
      where: { id: recipientUserId },
      include: { notificationPreference: true },
    });

    if (!recipient) {
      console.warn(`[NOTIFICATION_SERVICE] Recipient user not found: ${recipientUserId}`);
      return null;
    }

    // 2. Resolve default title and message if not explicitly provided
    const resolvedTitle = params.title || this.getDefaultTitle(eventType);
    const resolvedMessage = params.message || this.getDefaultMessage(eventType);

    // 3. Deduplication check if key provided
    if (dedupKey) {
      const existing = await db.notification.findFirst({
        where: { userId: recipientUserId, dedupKey },
      });
      if (existing) {
        return existing;
      }
    }

    // 4. Create in-app Notification
    const notification = await db.notification.create({
      data: {
        userId: recipientUserId,
        eventType,
        priority,
        title: resolvedTitle,
        message: resolvedMessage,
        linkUrl: linkUrl || null,
        entityType: entityType || null,
        entityId: entityId || null,
        dedupKey: dedupKey || null,
      },
    });

    // 5. Check email eligibility
    const isEmailEligible =
      !skipEmail &&
      Boolean(recipient.email) &&
      this.isEventEmailEligible(eventType, recipient.notificationPreference);

    if (isEmailEligible && recipient.email) {
      const templateName = this.mapEventToTemplateName(eventType);
      const emailPayload = params.emailPayload || {};
      const subject = resolvedTitle;

      // Unique outbox deduplication key
      const outboxDedupKey = dedupKey
        ? `outbox_${dedupKey}`
        : `outbox_${notification.id}_${eventType}_${Date.now()}`;

      await db.emailOutbox.create({
        data: {
          notificationId: notification.id,
          eventType,
          recipientEmail: recipient.email,
          recipientName: recipient.fullName,
          subject,
          templateName,
          locale: "fr",
          payloadJson: JSON.stringify({
            ...emailPayload,
            recipientName: recipient.fullName,
            appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          }),
          status: EmailDeliveryStatus.PENDING,
          dedupKey: outboxDedupKey,
        },
      });

      // If not inside an open transaction, trigger outbox flush asynchronously
      if (!tx) {
        setTimeout(() => {
          OutboxWorker.processOutbox(5).catch((err) =>
            console.error("[ASYNC_OUTBOX_FLUSH_ERROR]", err)
          );
        }, 50);
      }
    }

    return notification;
  }

  /**
   * Helper: Map event type to template name
   */
  private static mapEventToTemplateName(eventType: NotificationEventType): string {
    switch (eventType) {
      case NotificationEventType.AUTH_WELCOME:
        return "welcome";
      case NotificationEventType.AUTH_ACTIVATION:
        return "account-activation";
      case NotificationEventType.AUTH_PASSWORD_RESET:
        return "password-reset";
      case NotificationEventType.TEACHER_VERIFIED:
        return "teacher-verified";
      case NotificationEventType.TEACHER_REJECTED:
        return "teacher-rejected";
      case NotificationEventType.TEACHER_APPLICATION_RECEIVED:
        return "teacher-application-received";
      case NotificationEventType.TEACHER_SHORTLISTED:
        return "teacher-shortlisted";
      case NotificationEventType.TEACHER_SELECTED:
        return "teacher-selected";
      case NotificationEventType.ADMIN_CLASSROOM_ASSIGNED:
        return "admin-classroom-assigned";
      case NotificationEventType.PACKAGE_CONFIRMED:
        return "package-confirmed";
      case NotificationEventType.SCHEDULE_CHANGED:
        return "schedule-changed";
      case NotificationEventType.LESSON_CANCELLED:
        return "lesson-cancelled";
      case NotificationEventType.LESSON_REMINDER:
        return "lesson-reminder";
      case NotificationEventType.LESSON_REPORT_SUBMITTED:
        return "lesson-report-ready";
      case NotificationEventType.LESSON_APPROVED:
        return "lesson-approved";
      case NotificationEventType.DISPUTE_OPENED:
        return "dispute-opened";
      case NotificationEventType.DISPUTE_RESOLVED:
        return "dispute-resolved";
      case NotificationEventType.HOMEWORK_ASSIGNED:
        return "homework-assigned";
      case NotificationEventType.ASSESSMENT_RECORDED:
        return "assessment-recorded";
      case NotificationEventType.ACADEMIC_PROGRESS_DIGEST:
        return "academic-progress-digest";
      default:
        return "welcome";
    }
  }

  /**
   * Checks whether the event is email-eligible according to user preferences
   */
  private static isEventEmailEligible(
    eventType: NotificationEventType,
    prefs?: any
  ): boolean {
    // Critical security and account actions ALWAYS send email
    if (
      eventType === NotificationEventType.AUTH_WELCOME ||
      eventType === NotificationEventType.AUTH_ACTIVATION ||
      eventType === NotificationEventType.AUTH_PASSWORD_RESET ||
      eventType === NotificationEventType.AUTH_PASSWORD_CHANGED ||
      eventType === NotificationEventType.TEACHER_VERIFIED ||
      eventType === NotificationEventType.TEACHER_REJECTED ||
      eventType === NotificationEventType.TEACHER_SELECTED ||
      eventType === NotificationEventType.ADMIN_CLASSROOM_ASSIGNED ||
      eventType === NotificationEventType.DISPUTE_OPENED ||
      eventType === NotificationEventType.DISPUTE_RESOLVED
    ) {
      return true;
    }

    // If user has custom preferences, check specific toggles
    if (prefs) {
      if (
        eventType === NotificationEventType.LESSON_REMINDER &&
        !prefs.emailLessonReminders
      ) {
        return false;
      }
      if (
        eventType === NotificationEventType.LESSON_REPORT_SUBMITTED &&
        !prefs.emailReportSubmitted
      ) {
        return false;
      }
      if (
        eventType === NotificationEventType.HOMEWORK_ASSIGNED &&
        !prefs.emailHomeworkAssigned
      ) {
        return false;
      }
      if (
        eventType === NotificationEventType.ASSESSMENT_RECORDED &&
        !prefs.emailAssessmentRecorded
      ) {
        return false;
      }
      if (
        eventType === NotificationEventType.ACADEMIC_PROGRESS_DIGEST &&
        !prefs.emailProgressDigest
      ) {
        return false;
      }
      if (
        eventType === NotificationEventType.OPPORTUNITY_MATCHED &&
        !prefs.emailMarketplaceOpportunities
      ) {
        return false;
      }
    }

    // Default to true for transactional business updates
    return true;
  }

  private static getDefaultTitle(eventType: NotificationEventType): string {
    switch (eventType) {
      case NotificationEventType.AUTH_WELCOME:
        return "Bienvenue sur Monsieur Fanyi";
      case NotificationEventType.AUTH_ACTIVATION:
        return "Activez votre compte Monsieur Fanyi";
      case NotificationEventType.AUTH_PASSWORD_RESET:
        return "Réinitialisation de votre mot de passe";
      case NotificationEventType.TEACHER_VERIFIED:
        return "Profil enseignant certifié !";
      case NotificationEventType.TEACHER_REJECTED:
        return "Dossier enseignant à corriger";
      case NotificationEventType.TEACHER_APPLICATION_RECEIVED:
        return "Nouvelle candidature reçue";
      case NotificationEventType.TEACHER_SHORTLISTED:
        return "Candidature présélectionnée !";
      case NotificationEventType.TEACHER_SELECTED:
        return "Candidature retenue par la famille !";
      case NotificationEventType.ADMIN_CLASSROOM_ASSIGNED:
        return "Affectation directe confirmée";
      case NotificationEventType.PACKAGE_CONFIRMED:
        return "Forfait de cours configuré";
      case NotificationEventType.SCHEDULE_CREATED:
        return "Séances planifiées au calendrier";
      case NotificationEventType.SCHEDULE_CHANGED:
        return "Séance de cours reprogrammée";
      case NotificationEventType.LESSON_CANCELLED:
        return "Séance de cours annulée";
      case NotificationEventType.LESSON_REMINDER:
        return "Rappel : Séance de cours prochaine";
      case NotificationEventType.LESSON_REPORT_SUBMITTED:
        return "Compte rendu de cours disponible";
      case NotificationEventType.LESSON_APPROVED:
        return "Séance validée par le parent";
      case NotificationEventType.DISPUTE_OPENED:
        return "Litige ouvert sur une séance";
      case NotificationEventType.DISPUTE_TEACHER_RESPONDED:
        return "Réponse de l'enseignant au litige";
      case NotificationEventType.DISPUTE_RESOLVED:
        return "Décision arbitrale enregistrée";
      case NotificationEventType.HOMEWORK_ASSIGNED:
        return "Nouveau devoir assigné";
      case NotificationEventType.HOMEWORK_SUBMITTED:
        return "Devoir rendu par l'élève";
      case NotificationEventType.HOMEWORK_GRADED:
        return "Devoir corrigé et noté";
      case NotificationEventType.ASSESSMENT_RECORDED:
        return "Nouvelle évaluation notée";
      case NotificationEventType.PROGRESS_OBSERVATION_RECORDED:
        return "Observation pédagogique enregistrée";
      case NotificationEventType.ACADEMIC_PROGRESS_DIGEST:
        return "Bilan de progression disponible";
      default:
        return "Notification Monsieur Fanyi";
    }
  }

  private static getDefaultMessage(eventType: NotificationEventType): string {
    switch (eventType) {
      case NotificationEventType.AUTH_WELCOME:
        return "Votre compte a été initialisé avec succès. Découvrez nos fonctionnalités de soutien scolaire.";
      case NotificationEventType.TEACHER_VERIFIED:
        return "Votre profil a été vérifié et approuvé par la modération. Vous pouvez postuler aux offres de cours.";
      case NotificationEventType.TEACHER_SELECTED:
        return "La famille a sélectionné votre profil pour accompagner son enfant. La classe a été créée.";
      case NotificationEventType.ADMIN_CLASSROOM_ASSIGNED:
        return "L'administration Monsieur Fanyi a procédé à une affectation directe suite à une demande téléphonique.";
      case NotificationEventType.LESSON_REPORT_SUBMITTED:
        return "Le professeur a déposé le compte rendu de la séance. Vous pouvez le consulter et valider le cours.";
      case NotificationEventType.LESSON_APPROVED:
        return "La famille a officiellement validé la séance dispensée.";
      default:
        return "Une mise à jour importante concerne vos activités sur Monsieur Fanyi.";
    }
  }

  // =========================================================================
  // CONSUMER QUERIES & MUTATIONS
  // =========================================================================

  /**
   * Retrieves paginated notifications for the authenticated user
   */
  static async getUserNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      onlyUnread?: boolean;
      onlyRead?: boolean;
      priority?: NotificationPriority;
    } = {}
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(50, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = { userId };
    if (options.onlyUnread) {
      where.isRead = false;
    } else if (options.onlyRead) {
      where.isRead = true;
    }
    if (options.priority) {
      where.priority = options.priority;
    }

    const [items, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      items,
      totalCount,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    };
  }

  /**
   * Returns current unread count for user's bell badge
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Marks a specific notification as read, enforcing user ownership
   */
  static async markAsRead(notificationId: string, userId: string) {
    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!existing) {
      throw new Error("Notification introuvable ou accès non autorisé.");
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Marks all unread notifications as read for the user
   */
  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Retrieves or initializes user notification preferences
   */
  static async getUserPreferences(userId: string) {
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId },
      });
    }

    return prefs;
  }

  /**
   * Updates user notification preferences
   */
  static async updateUserPreferences(
    userId: string,
    data: {
      emailLessonReminders?: boolean;
      emailReportSubmitted?: boolean;
      emailHomeworkAssigned?: boolean;
      emailAssessmentRecorded?: boolean;
      emailProgressDigest?: boolean;
      emailMarketplaceOpportunities?: boolean;
      emailMarketing?: boolean;
    }
  ) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...data,
      },
      update: {
        ...data,
      },
    });
  }
}

