import { prisma } from "@/lib/db/prisma";
import {
  NotificationEventType,
  NotificationPriority,
  SessionStatus,
  ReportStatus,
  DisputeStatus,
  HomeworkStatus,
  TeacherVerificationStatus,
  UserRole,
} from "@prisma/client";
import { NotificationService } from "./notification-service";

export interface ReminderJobSummary {
  job: string;
  evaluated: number;
  remindersSent: number;
}

export class ReminderService {
  /**
   * P14.27: 1. Upcoming Lesson Reminder (Default: 24h before lesson start)
   */
  static async triggerUpcomingLessonReminders(): Promise<ReminderJobSummary> {
    const now = new Date();
    // Target window: 23 hours to 25 hours from now
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const upcomingSessions = await prisma.lessonSession.findMany({
      where: {
        status: SessionStatus.SCHEDULED,
        scheduledStart: { gte: windowStart, lte: windowEnd },
      },
      include: {
        classroom: {
          include: {
            teacherProfile: { include: { user: true } },
            student: { include: { parent: { include: { user: true } } } },
          },
        },
      },
    });

    let sent = 0;
    for (const session of upcomingSessions) {
      const dateKey = session.scheduledStart.toISOString().split("T")[0];
      const startStr = session.scheduledStart.toLocaleTimeString("fr-GN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Conakry",
      });
      const dateFormatted = `${session.scheduledStart.toLocaleDateString("fr-GN", { timeZone: "Africa/Conakry" })} à ${startStr}`;

      // Notify Parent if not already reminded
      const parentUserId = session.classroom.student.parent.userId;
      const parentDedupKey = `reminder_lesson_parent_${session.id}_${dateKey}`;
      const parentAlreadyReminded = await prisma.notification.findFirst({
        where: { userId: parentUserId, dedupKey: parentDedupKey },
      });
      if (!parentAlreadyReminded) {
        await NotificationService.publishNotificationEvent({
          eventType: NotificationEventType.LESSON_REMINDER,
          recipientUserId: parentUserId,
          entityType: "LessonSession",
          entityId: session.id,
          title: `Rappel : Cours de ${session.classroom.subjectName} demain`,
          message: `La séance de ${session.classroom.subjectName} pour ${session.classroom.student.fullName} est prévue demain ${dateFormatted} avec ${session.classroom.teacherProfile.user.fullName}.`,
          linkUrl: `/parent/calendar`,
          priority: NotificationPriority.NORMAL,
          dedupKey: parentDedupKey,
          emailPayload: {
            subjectName: session.classroom.subjectName,
            studentName: session.classroom.student.fullName,
            teacherName: session.classroom.teacherProfile.user.fullName,
            scheduledStart: dateFormatted,
          },
        });
        sent++;
      }

      // Notify Teacher if not already reminded
      const teacherUserId = session.classroom.teacherProfile.userId;
      const teacherDedupKey = `reminder_lesson_teacher_${session.id}_${dateKey}`;
      const teacherAlreadyReminded = await prisma.notification.findFirst({
        where: { userId: teacherUserId, dedupKey: teacherDedupKey },
      });
      if (!teacherAlreadyReminded) {
        await NotificationService.publishNotificationEvent({
          eventType: NotificationEventType.LESSON_REMINDER,
          recipientUserId: teacherUserId,
          entityType: "LessonSession",
          entityId: session.id,
          title: `Rappel : Cours de ${session.classroom.subjectName} demain`,
          message: `Votre séance de ${session.classroom.subjectName} avec ${session.classroom.student.fullName} est prévue demain ${dateFormatted}.`,
          linkUrl: `/teacher/calendar`,
          priority: NotificationPriority.NORMAL,
          dedupKey: teacherDedupKey,
          emailPayload: {
            subjectName: session.classroom.subjectName,
            studentName: session.classroom.student.fullName,
            scheduledStart: dateFormatted,
          },
        });
        sent++;
      }
    }

    return { job: "upcoming-lessons", evaluated: upcomingSessions.length, remindersSent: sent };
  }

  /**
   * P14.27: 2. Pending Parent Report Validation Reminder (Default: after 48h pending)
   */
  static async triggerPendingValidationReminders(): Promise<ReminderJobSummary> {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const pendingSessions = await prisma.lessonSession.findMany({
      where: {
        status: SessionStatus.TEACHER_COMPLETED,
        report: {
          status: ReportStatus.SUBMITTED,
          submittedAt: { lte: fortyEightHoursAgo },
        },
        approval: null,
        dispute: null,
      },
      include: {
        classroom: {
          include: {
            teacherProfile: { include: { user: true } },
            student: { include: { parent: { include: { user: true } } } },
          },
        },
        report: true,
      },
    });

    let sent = 0;
    for (const session of pendingSessions) {
      const parentUserId = session.classroom.student.parent.userId;
      await NotificationService.publishNotificationEvent({
        eventType: NotificationEventType.LESSON_REPORT_SUBMITTED,
        recipientUserId: parentUserId,
        entityType: "LessonSession",
        entityId: session.id,
        title: `Rappel : Compte rendu de ${session.classroom.subjectName} en attente de validation`,
        message: `Le compte rendu de la séance du professeur ${session.classroom.teacherProfile.user.fullName} est en attente de votre validation depuis plus de 48 heures.`,
        linkUrl: `/parent/reports?sessionId=${session.id}`,
        priority: NotificationPriority.HIGH,
        dedupKey: `reminder_pending_val_${session.id}_48h`,
        emailPayload: {
          subjectName: session.classroom.subjectName,
          teacherName: session.classroom.teacherProfile.user.fullName,
          sessionId: session.id,
        },
      });
      sent++;
    }

    return { job: "pending-validations", evaluated: pendingSessions.length, remindersSent: sent };
  }

  /**
   * P14.27: 3. Homework Deadline Reminder (Default: 24h before deadline)
   */
  static async triggerHomeworkDeadlineReminders(): Promise<ReminderJobSummary> {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const dueHomework = await prisma.homeworkAssignment.findMany({
      where: {
        status: HomeworkStatus.ASSIGNED,
        dueDate: { gte: windowStart, lte: windowEnd },
      },
      include: {
        student: { include: { parent: { include: { user: true } } } },
        classroom: true,
      },
    });

    let sent = 0;
    for (const hw of dueHomework) {
      const parentUserId = hw.student.parent.userId;
      const dueFormatted = hw.dueDate?.toLocaleDateString("fr-GN", { timeZone: "Africa/Conakry" }) || "Demain";

      await NotificationService.publishNotificationEvent({
        eventType: NotificationEventType.HOMEWORK_ASSIGNED,
        recipientUserId: parentUserId,
        entityType: "HomeworkAssignment",
        entityId: hw.id,
        title: `Rappel : Devoir de ${hw.subjectName} à rendre demain`,
        message: `Le devoir « ${hw.title} » assigné à ${hw.student.fullName} arrive à échéance le ${dueFormatted}.`,
        linkUrl: `/parent/students/${hw.studentId}/progress#homework`,
        priority: NotificationPriority.NORMAL,
        dedupKey: `reminder_hw_due_${hw.id}`,
        emailPayload: {
          title: hw.title,
          subjectName: hw.subjectName,
          dueDate: dueFormatted,
          studentId: hw.studentId,
        },
      });
      sent++;
    }

    return { job: "homework-deadlines", evaluated: dueHomework.length, remindersSent: sent };
  }

  /**
   * P14.27: 4. Administrative Reminders (Unresolved disputes > 48h, Teacher reviews > 72h)
   */
  static async triggerAdminReminders(): Promise<ReminderJobSummary> {
    const admins = await prisma.user.findMany({
      where: { role: UserRole.ADMIN, isActive: true },
      select: { id: true },
    });

    if (admins.length === 0) {
      return { job: "admin-reminders", evaluated: 0, remindersSent: 0 };
    }

    let sent = 0;

    // Unresolved disputes > 48h
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const openDisputes = await prisma.lessonDispute.findMany({
      where: {
        status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
        createdAt: { lte: fortyEightHoursAgo },
      },
    });

    for (const dispute of openDisputes) {
      for (const admin of admins) {
        await NotificationService.publishNotificationEvent({
          eventType: NotificationEventType.DISPUTE_OPENED,
          recipientUserId: admin.id,
          entityType: "LessonDispute",
          entityId: dispute.id,
          title: `Alerte Admin : Litige de cours non résolu (> 48h)`,
          message: `Le litige sur la séance #${dispute.sessionId} requiert un arbitrage de la direction.`,
          linkUrl: `/admin/session-disputes`,
          priority: NotificationPriority.HIGH,
          dedupKey: `reminder_dispute_admin_${dispute.id}_48h_${admin.id}`,
          skipEmail: true, // in-app admin alert
        });
        sent++;
      }
    }

    // Teacher verifications pending > 72h
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const pendingTeachers = await prisma.teacherProfile.findMany({
      where: {
        verificationStatus: TeacherVerificationStatus.PENDING_REVIEW,
        submittedAt: { lte: seventyTwoHoursAgo },
      },
      include: { user: true },
    });

    for (const teacher of pendingTeachers) {
      for (const admin of admins) {
        await NotificationService.publishNotificationEvent({
          eventType: NotificationEventType.TEACHER_SUBMITTED_FOR_REVIEW,
          recipientUserId: admin.id,
          entityType: "TeacherProfile",
          entityId: teacher.id,
          title: `Alerte Admin : Dossier enseignant en attente (> 72h)`,
          message: `Le dossier de ${teacher.user.fullName} est en attente d'évaluation depuis plus de 3 jours.`,
          linkUrl: `/admin/verifications/${teacher.id}`,
          priority: NotificationPriority.NORMAL,
          dedupKey: `reminder_teacher_mod_${teacher.id}_72h_${admin.id}`,
          skipEmail: true,
        });
        sent++;
      }
    }

    return {
      job: "admin-reminders",
      evaluated: openDisputes.length + pendingTeachers.length,
      remindersSent: sent,
    };
  }

  /**
   * Executes all scheduled reminder batches
   */
  static async runAllReminders(): Promise<ReminderJobSummary[]> {
    const results: ReminderJobSummary[] = [];
    results.push(await this.triggerUpcomingLessonReminders());
    results.push(await this.triggerPendingValidationReminders());
    results.push(await this.triggerHomeworkDeadlineReminders());
    results.push(await this.triggerAdminReminders());
    return results;
  }
}
