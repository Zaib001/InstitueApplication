import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { DoubleEntryLedger } from "@/lib/finance/double-entry-ledger";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Réservé aux administrateurs" },
        { status: 403 }
      );
    }

    const balances = await DoubleEntryLedger.getAccountBalances();

    const totalDebits = balances.reduce(
      (sum, item) => sum + item.totalDebitsGnf,
      0
    );
    const totalCredits = balances.reduce(
      (sum, item) => sum + item.totalCreditsGnf,
      0
    );

    return NextResponse.json({
      accounts: balances,
      trialBalance: {
        totalDebitsGnf: totalDebits,
        totalCreditsGnf: totalCredits,
        isBalanced: totalDebits === totalCredits,
        discrepancyGnf: Math.abs(totalDebits - totalCredits),
      },
    });
  } catch (error: any) {
    console.error("GET /api/finance/ledger/accounts error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne" },
      { status: 500 }
    );
  }
}

