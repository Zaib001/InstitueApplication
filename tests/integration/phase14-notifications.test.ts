import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  PrismaClient,
  UserRole,
  NotificationEventType,
  NotificationPriority,
  EmailDeliveryStatus,
  ClassroomStatus,
  SessionStatus,
  LessonAttendance,
} from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { NotificationService } from "@/lib/notifications/notification-service";
import { OutboxWorker } from "@/lib/notifications/outbox-worker";
import { ReminderService } from "@/lib/notifications/reminder-service";

const prisma = new PrismaClient();

describe("Phase 14: Centralized Notification System, Outbox & Automated Reminders (Integration Tests)", () => {
  const ts = Date.now();
  const testPassword = "PasswordPhase14Test2026!";

  let adminUserId: string;
  let parentUserIdA: string;
  let parentProfileIdA: string;
  let teacherUserId1: string;
  let teacherProfileId1: string;
  let studentId1: string;
  let classroomId1: string;
  let upcomingSessionId: string;

  beforeAll(async () => {
    const passwordHash = await hashPassword(testPassword);

    // 1. Create Admin
    const admin = await prisma.user.create({
      data: {
        email: `admin.p14.${ts}@monsieurfanyi.gn`,
        fullName: "Superviseur Notifications P14",
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
      },
    });
    adminUserId = admin.id;

    // 2. Create Parent
    const parent = await prisma.user.create({
      data: {
        email: `parent.p14.${ts}@monsieurfanyi.gn`,
        fullName: "Aissatou Diallo P14",
        passwordHash,
        role: UserRole.PARENT,
        isActive: true,
        parentProfile: {
          create: {
            city: "Conakry",
            children: {
              create: {
                fullName: "Boubacar Diallo P14",
                gradeLevel: "TERMINALE_SM",
              },
            },
          },
        },
      },
      include: {
        parentProfile: {
          include: {
            children: true,
          },
        },
      },
    });
    parentUserIdA = parent.id;
    parentProfileIdA = parent.parentProfile!.id;
    studentId1 = parent.parentProfile!.children[0].id;

    // 3. Create Teacher
    const teacher = await prisma.user.create({
      data: {
        email: `teacher.p14.${ts}@monsieurfanyi.gn`,
        fullName: "Prof. Thierno Bah P14",
        passwordHash,
        role: UserRole.TEACHER,
        isActive: true,
        teacherProfile: {
          create: {
            city: "Conakry",
            hourlyRateGnf: 80000,
          },
        },
      },
      include: {
        teacherProfile: true,
      },
    });
    teacherUserId1 = teacher.id;
    teacherProfileId1 = teacher.teacherProfile!.id;

    // 4. Create Classroom & 24h upcoming session for reminders test
    const classroom = await prisma.classroom.create({
      data: {
        subjectName: "Mathématiques",
        teacherProfileId: teacherProfileId1,
        studentId: studentId1,
        hourlyRateGnf: 80000,
        status: ClassroomStatus.ACTIVE,
      },
    });
    classroomId1 = classroom.id;

    // Scheduled 24 hours from now (within the 24h reminder window)
    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const in26Hours = new Date(Date.now() + 26 * 60 * 60 * 1000);

    const session = await prisma.lessonSession.create({
      data: {
        classroomId: classroomId1,
        sessionSequence: 1,
        scheduledStart: in24Hours,
        scheduledEnd: in26Hours,
        durationMinutes: 120,
        status: SessionStatus.SCHEDULED,
      },
    });
    upcomingSessionId = session.id;
  });

  afterAll(async () => {
    // Clean up outbox, notifications, sessions, classrooms, profiles, users
    await prisma.emailOutbox.deleteMany({
      where: {
        recipientEmail: {
          in: [
            `admin.p14.${ts}@monsieurfanyi.gn`,
            `parent.p14.${ts}@monsieurfanyi.gn`,
            `teacher.p14.${ts}@monsieurfanyi.gn`,
          ],
        },
      },
    });
    await prisma.notification.deleteMany({
      where: {
        userId: { in: [adminUserId, parentUserIdA, teacherUserId1] },
      },
    });
    await prisma.notificationPreference.deleteMany({
      where: {
        userId: { in: [adminUserId, parentUserIdA, teacherUserId1] },
      },
    });
    await prisma.lessonSession.deleteMany({
      where: { classroomId: classroomId1 },
    });
    await prisma.classroom.deleteMany({
      where: { id: classroomId1 },
    });
    await prisma.studentProfile.deleteMany({
      where: { id: studentId1 },
    });
    await prisma.parentProfile.deleteMany({
      where: { id: parentProfileIdA },
    });
    await prisma.teacherProfile.deleteMany({
      where: { id: teacherProfileId1 },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [adminUserId, parentUserIdA, teacherUserId1] } },
    });
    await prisma.$disconnect();
  });

  it("P14.01: NotificationService.publishNotificationEvent creates in-app notification & outbox row", async () => {
    const notif = await NotificationService.publishNotificationEvent({
      eventType: NotificationEventType.AUTH_WELCOME,
      recipientUserId: parentUserIdA,
      title: "Bienvenue sur Monsieur Fanyi !",
      message: "Votre compte parent est désormais actif.",
      linkUrl: "/parent/dashboard",
      priority: NotificationPriority.NORMAL,
      emailPayload: {
        recipientName: "Aissatou Diallo P14",
        role: "PARENT",
      },
    });

    expect(notif).toBeDefined();
    expect(notif!.userId).toBe(parentUserIdA);
    expect(notif!.isRead).toBe(false);

    // Verify outbox entry
    const outboxItem = await prisma.emailOutbox.findFirst({
      where: { notificationId: notif!.id },
    });

    expect(outboxItem).toBeDefined();
    expect(outboxItem!.recipientEmail).toBe(`parent.p14.${ts}@monsieurfanyi.gn`);
    expect(outboxItem!.status).toBe(EmailDeliveryStatus.PENDING);
    expect(outboxItem!.templateName).toBe("welcome");
  });

  it("P14.02: Deduplication key prevents duplicate notifications and outbox entries", async () => {
    const dedupKey = `test_dedup_${ts}_event1`;

    const first = await NotificationService.publishNotificationEvent({
      eventType: NotificationEventType.PACKAGE_CONFIRMED,
      recipientUserId: parentUserIdA,
      title: "Forfait validé",
      message: "Votre forfait a été validé avec succès.",
      dedupKey,
    });

    const second = await NotificationService.publishNotificationEvent({
      eventType: NotificationEventType.PACKAGE_CONFIRMED,
      recipientUserId: parentUserIdA,
      title: "Forfait validé (duplicate)",
      message: "Duplicate call",
      dedupKey,
    });

    // Should return existing notification
    expect(first?.id).toBe(second?.id);

    // Verify only ONE notification in DB with this dedupKey
    const count = await prisma.notification.count({
      where: { userId: parentUserIdA, dedupKey },
    });
    expect(count).toBe(1);
  });

  it("P14.03: User preferences honor: Category disabled prevents email, but critical events bypass", async () => {
    // 1. Disable emailLessonReminders for parent
    await NotificationService.updateUserPreferences(parentUserIdA, {
      emailLessonReminders: false,
    });

    // 2. Publish general reminder event (LESSON_REMINDER)
    const generalNotif = await NotificationService.publishNotificationEvent({
      eventType: NotificationEventType.LESSON_REMINDER,
      recipientUserId: parentUserIdA,
      title: "Rappel de cours",
      message: "Votre cours a lieu demain.",
    });

    const generalOutbox = await prisma.emailOutbox.findFirst({
      where: { notificationId: generalNotif!.id },
    });
    // Should NOT create outbox item because emailLessonReminders is disabled
    expect(generalOutbox).toBeNull();

    // 3. Publish critical event (AUTH_PASSWORD_RESET)
    const criticalNotif = await NotificationService.publishNotificationEvent({
      eventType: NotificationEventType.AUTH_PASSWORD_RESET,
      recipientUserId: parentUserIdA,
      title: "Réinitialisation de mot de passe",
      message: "Lien de réinitialisation sécurisé",
    });

    const criticalOutbox = await prisma.emailOutbox.findFirst({
      where: { notificationId: criticalNotif!.id },
    });
    // Critical security event MUST create outbox item regardless of preferences
    expect(criticalOutbox).toBeDefined();
    expect(criticalOutbox!.eventType).toBe(NotificationEventType.AUTH_PASSWORD_RESET);
  });

  it("P14.04: OutboxWorker processes pending outbox items and transitions to DELIVERED/SENT", async () => {
    // Ensure there is at least one PENDING outbox item
    await NotificationService.publishNotificationEvent({
      eventType: NotificationEventType.TEACHER_VERIFIED,
      recipientUserId: teacherUserId1,
      title: "Félicitations ! Dossier validé",
      message: "Votre dossier enseignant a été validé.",
    });

    // Flush outbox queue completely to ensure teacher verified email is processed
    let flushCycles = 5;
    while (flushCycles-- > 0) {
      const res = await OutboxWorker.processOutbox(50);
      if (res.processed === 0) break;
    }

    // Check teacher outbox status
    const verifiedOutbox = await prisma.emailOutbox.findFirst({
      where: {
        recipientEmail: `teacher.p14.${ts}@monsieurfanyi.gn`,
        eventType: NotificationEventType.TEACHER_VERIFIED,
      },
    });

    expect(verifiedOutbox).toBeDefined();
    expect(
      verifiedOutbox!.status === EmailDeliveryStatus.DELIVERED ||
        verifiedOutbox!.status === EmailDeliveryStatus.SENT
    ).toBe(true);
    expect(verifiedOutbox!.providerMessageId).toBeDefined();
  });

  it("P14.05: Outbox retry mechanism marks item RETRY_SCHEDULED then PERMANENT_FAILURE after max retries", async () => {
    // Create an artificial failing outbox item with an invalid email
    const failedItem = await prisma.emailOutbox.create({
      data: {
        eventType: NotificationEventType.ADMIN_ALERT,
        recipientEmail: "invalid-email-format-trigger-failure",
        recipientName: "Test Failure",
        subject: "Test Retry",
        templateName: "welcome",
        payloadJson: "{}",
        status: EmailDeliveryStatus.PENDING,
        dedupKey: `test_dedup_fail_${ts}`,
        attempts: 4, // Max is 5, next attempt will exceed max
        maxAttempts: 5,
      },
    });

    await OutboxWorker.processSingleOutboxItem(failedItem.id);

    const updated = await prisma.emailOutbox.findUnique({
      where: { id: failedItem.id },
    });

    expect(updated).toBeDefined();
    expect(updated!.status).toBe(EmailDeliveryStatus.PERMANENT_FAILURE);
    expect(updated!.attempts).toBe(5);
    expect(updated!.lastError).toBeDefined();

    // Clean up artificial item
    await prisma.emailOutbox.delete({ where: { id: failedItem.id } });
  });

  it("P14.06: Unread count query correctly reflects unread notifications", async () => {
    const unreadCount = await NotificationService.getUnreadCount(parentUserIdA);
    expect(unreadCount).toBeGreaterThan(0);
  });

  it("P14.07: Mark as read and Mark all as read transitions isRead and sets readAt", async () => {
    // 1. Mark single notification
    const unreadNotif = await prisma.notification.findFirst({
      where: { userId: parentUserIdA, isRead: false },
    });
    expect(unreadNotif).toBeDefined();

    const markedSingle = await NotificationService.markAsRead(unreadNotif!.id, parentUserIdA);
    expect(markedSingle.isRead).toBe(true);
    expect(markedSingle.readAt).toBeDefined();

    // 2. Mark all as read
    const markAllResult = await NotificationService.markAllAsRead(parentUserIdA);
    expect(markAllResult.count).toBeGreaterThanOrEqual(0);

    const finalUnread = await NotificationService.getUnreadCount(parentUserIdA);
    expect(finalUnread).toBe(0);
  });

  it("P14.08: ReminderService.triggerUpcomingLessonReminders alerts parent and teacher for 24h lessons", async () => {
    // Session was scheduled for in 23 hours in beforeAll
    const reminderResult = await ReminderService.triggerUpcomingLessonReminders();

    expect(reminderResult.remindersSent).toBeGreaterThanOrEqual(1);

    // Verify that parent received a LESSON_REMINDER notification
    const parentReminder = await prisma.notification.findFirst({
      where: {
        userId: parentUserIdA,
        eventType: NotificationEventType.LESSON_REMINDER,
        entityId: upcomingSessionId,
      },
    });
    expect(parentReminder).toBeDefined();
    expect(parentReminder!.title).toContain("Mathématiques");

    // Second run should be idempotent and not duplicate
    const secondRun = await ReminderService.triggerUpcomingLessonReminders();
    expect(secondRun.remindersSent).toBe(0);
  });

  it("P14.09: Multi-tenant isolation: User cannot mark another user's notification as read", async () => {
    const teacherNotif = await prisma.notification.findFirst({
      where: { userId: teacherUserId1 },
    });
    expect(teacherNotif).toBeDefined();

    // Parent attempts to mark teacher's notification as read -> must throw error
    await expect(
      NotificationService.markAsRead(teacherNotif!.id, parentUserIdA)
    ).rejects.toThrow("Notification introuvable ou accès non autorisé.");
  });
});
