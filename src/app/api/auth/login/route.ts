import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/auth/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Données invalides." },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const callbackUrl = typeof body.callbackUrl === "string" ? body.callbackUrl : undefined;

    // Look up user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Adresse email ou mot de passe incorrect." },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Ce compte a été suspendu ou désactivé. Veuillez contacter le support." },
        { status: 403 }
      );
    }

    // Verify password hash
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Adresse email ou mot de passe incorrect." },
        { status: 401 }
      );
    }

    // Record login audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "USER_LOGIN",
        entityType: "User",
        entityId: user.id,
      },
    });

    // Create session in DB and set cookie
    await createSession({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });

    // Determine target redirect
    let defaultRedirect = "/parent/dashboard";
    if (user.role === "TEACHER") defaultRedirect = "/teacher/dashboard";
    if (user.role === "ADMIN") defaultRedirect = "/admin/dashboard";

    let redirectUrl = defaultRedirect;
    if (callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")) {
      // Validate that callbackUrl matches role
      if (
        (user.role === "PARENT" && (callbackUrl.startsWith("/parent") || callbackUrl.startsWith("/settings"))) ||
        (user.role === "TEACHER" && (callbackUrl.startsWith("/teacher") || callbackUrl.startsWith("/settings"))) ||
        (user.role === "ADMIN" && (callbackUrl.startsWith("/admin") || callbackUrl.startsWith("/settings")))
      ) {
        redirectUrl = callbackUrl;
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      redirectUrl,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Une erreur inattendue est survenue lors de la connexion." },
      { status: 500 }
    );
  }
}
