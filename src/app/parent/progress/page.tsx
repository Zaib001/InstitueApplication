import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { UserRole } from "@prisma/client";

export default async function ParentProgressRedirectPage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== UserRole.PARENT && user.role !== UserRole.ADMIN)) {
    redirect("/login");
  }

  const parentProfile = await prisma.parentProfile.findUnique({
    where: { userId: user.id },
    include: {
      children: {
        where: { isArchived: false },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  if (!parentProfile || parentProfile.children.length === 0) {
    redirect("/parent/children");
  }

  const firstChild = parentProfile.children[0];
  redirect(`/parent/students/${firstChild.id}/progress`);
}
