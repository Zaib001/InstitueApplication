import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole, EmailDeliveryStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { EmailProvider } from "@/lib/notifications/email-provider";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const statusParam = searchParams.get("status");
    const skip = (page - 1) * limit;

    const where: Prisma.EmailOutboxWhereInput = {};
    if (
      statusParam &&
      Object.values(EmailDeliveryStatus).includes(statusParam as EmailDeliveryStatus)
    ) {
      where.status = statusParam as EmailDeliveryStatus;
    }

    const [items, totalCount, pendingCount, sentCount, deliveredCount, failedCount] =
      await Promise.all([
        prisma.emailOutbox.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          include: { notification: true },
        }),
        prisma.emailOutbox.count({ where }),
        prisma.emailOutbox.count({ where: { status: EmailDeliveryStatus.PENDING } }),
        prisma.emailOutbox.count({ where: { status: EmailDeliveryStatus.SENT } }),
        prisma.emailOutbox.count({ where: { status: EmailDeliveryStatus.DELIVERED } }),
        prisma.emailOutbox.count({
          where: {
            status: { in: [EmailDeliveryStatus.FAILED, EmailDeliveryStatus.PERMANENT_FAILURE] },
          },
        }),
      ]);

    return NextResponse.json({
      items,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
      stats: {
        pendingCount,
        sentCount,
        deliveredCount,
        failedCount,
        isLiveConfigured: EmailProvider.isLiveConfigured(),
      },
    });
  } catch (error: any) {
    console.error("[ADMIN_GET_OUTBOX_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

