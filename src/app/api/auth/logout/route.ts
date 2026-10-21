import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Erreur lors de la déconnexion." }, { status: 500 });
  }
}
