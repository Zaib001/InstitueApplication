/**
 * MONSIEUR FANYI — DOUBLE-ENTRY GENERAL LEDGER
 * Mathematically balanced double-entry accounting engine with compensating reversals.
 */

import { prisma } from "@/lib/db/prisma";
import {
  LedgerAccountType,
  LedgerEntryDirection,
  PostJournalParams,
  AccountBalanceSummary,
  STANDARD_ACCOUNTS,
  LedgerImbalanceError,
  FinancialError,
} from "./types";
import crypto from "crypto";

export class DoubleEntryLedger {
  /**
   * Standard account definitions with account type classification.
   */
  public static readonly STANDARD_ACCOUNT_DEFINITIONS: Array<{
    code: string;
    name: string;
    type: LedgerAccountType;
  }> = [
    {
      code: STANDARD_ACCOUNTS.PARENT_CLEARING,
      name: "Compte de compensation encaissements parents",
      type: LedgerAccountType.ASSET,
    },
    {
      code: STANDARD_ACCOUNTS.REFUND_CLEARING,
      name: "Compte de compensation remboursements parents",
      type: LedgerAccountType.ASSET,
    },
    {
      code: STANDARD_ACCOUNTS.DISBURSEMENT_CLEARING,
      name: "Compte de compensation décaissements et règlements enseignants",
      type: LedgerAccountType.ASSET,
    },
    {
      code: STANDARD_ACCOUNTS.UNALLOCATED_ESCROW,
      name: "Fonds prépayés parents en attente d'affectation",
      type: LedgerAccountType.LIABILITY,
    },
    {
      code: STANDARD_ACCOUNTS.CLASSROOM_FUNDS,
      name: "Fonds de provision affectés aux cours",
      type: LedgerAccountType.LIABILITY,
    },
    {
      code: STANDARD_ACCOUNTS.TEACHER_PAYABLE,
      name: "Rémunération due aux enseignants (validée)",
      type: LedgerAccountType.LIABILITY,
    },
    {
      code: STANDARD_ACCOUNTS.PAYOUT_LIABILITY,
      name: "Engagements de versement opérateurs mobiles",
      type: LedgerAccountType.LIABILITY,
    },
    {
      code: STANDARD_ACCOUNTS.PLATFORM_COMMISSION,
      name: "Revenus de commission de la plateforme",
      type: LedgerAccountType.REVENUE,
    },
    {
      code: STANDARD_ACCOUNTS.PARENT_FEE_CONTRIBUTIONS,
      name: "Contributions frais de paiement parents (2%)",
      type: LedgerAccountType.REVENUE,
    },
    {
      code: STANDARD_ACCOUNTS.PROVIDER_FEES,
      name: "Frais de passerelle de paiement et télécoms",
      type: LedgerAccountType.EXPENSE,
    },
  ];

  /**
   * Idempotently bootstraps the standard Chart of Accounts.
   */
  static async ensureStandardAccountsExist(txClient: any = prisma) {
    const existingAccounts = await txClient.ledgerAccount.findMany();
    const existingCodeSet = new Set(existingAccounts.map((a: any) => a.code));

    for (const def of DoubleEntryLedger.STANDARD_ACCOUNT_DEFINITIONS) {
      if (!existingCodeSet.has(def.code)) {
        await txClient.ledgerAccount.create({
          data: {
            code: def.code,
            name: def.name,
            type: def.type,
            currency: "GNF",
            isActive: true,
          },
        });
      }
    }
  }

  /**
   * Posts an atomic, balanced journal entry.
   * Enforces SUM(DEBIT) === SUM(CREDIT).
   */
  static async postJournalEntry(
    params: PostJournalParams,
    txClient: any = prisma
  ) {
    const { referenceType, referenceId, description, postedBy, currency = "GNF", lines } =
      params;

    if (!lines || lines.length < 2) {
      throw new FinancialError(
        "Une écriture comptable en partie double requiert au moins deux lignes.",
        "INVALID_JOURNAL_LINES",
        400
      );
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      if (!Number.isInteger(line.amountGnf) || line.amountGnf <= 0) {
        throw new FinancialError(
          `Montant invalide (${line.amountGnf}) pour le compte ${line.accountCode}: doit être un entier positif strict.`,
          "INVALID_LINE_AMOUNT",
          400
        );
      }

      if (line.direction === LedgerEntryDirection.DEBIT) {
        totalDebit += line.amountGnf;
      } else if (line.direction === LedgerEntryDirection.CREDIT) {
        totalCredit += line.amountGnf;
      } else {
        throw new FinancialError(
          `Direction d'écriture invalide: ${line.direction}`,
          "INVALID_DIRECTION",
          400
        );
      }
    }

    // Mathematical balance assertion
    if (totalDebit !== totalCredit) {
      throw new LedgerImbalanceError(totalDebit, totalCredit);
    }

    // Ensure chart of accounts is available
    await DoubleEntryLedger.ensureStandardAccountsExist(txClient);

    // Fetch accounts referenced in lines
    const accountCodes = Array.from(new Set(lines.map((l) => l.accountCode)));
    const accounts = await txClient.ledgerAccount.findMany({
      where: { code: { in: accountCodes } },
    });
    const accountMap = new Map(accounts.map((a: any) => [a.code, a.id]));

    for (const code of accountCodes) {
      if (!accountMap.has(code)) {
        throw new FinancialError(
          `Le compte comptable ${code} n'a pas été trouvé dans le plan comptable.`,
          "ACCOUNT_NOT_FOUND",
          404
        );
      }
    }

    const journalNumber = `jnl_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    const journal = await txClient.ledgerJournal.create({
      data: {
        journalNumber,
        referenceType,
        referenceId,
        description,
        currency,
        postedBy,
        isBalanced: true,
        totalDebit,
        totalCredit,
        entries: {
          create: lines.map((line) => ({
            accountId: accountMap.get(line.accountCode)!,
            direction: line.direction,
            amount: line.amountGnf,
            currency,
          })),
        },
      },
      include: {
        entries: {
          include: { account: true },
        },
      },
    });

    return journal;
  }

  /**
   * Posts a compensating reversal journal for an existing journal entry.
   */
  static async postCompensatingReversal(
    originalJournalNumber: string,
    reason: string,
    postedBy: string,
    txClient: any = prisma
  ) {
    const originalJournal = await txClient.ledgerJournal.findUnique({
      where: { journalNumber: originalJournalNumber },
      include: {
        entries: {
          include: { account: true },
        },
      },
    });

    if (!originalJournal) {
      throw new FinancialError(
        `Journal original introuvable: ${originalJournalNumber}`,
        "JOURNAL_NOT_FOUND",
        404
      );
    }

    // Invert every entry direction
    const reversedLines = originalJournal.entries.map((entry: any) => ({
      accountCode: entry.account.code,
      direction:
        entry.direction === LedgerEntryDirection.DEBIT
          ? LedgerEntryDirection.CREDIT
          : LedgerEntryDirection.DEBIT,
      amountGnf: entry.amount,
    }));

    return await DoubleEntryLedger.postJournalEntry(
      {
        referenceType: originalJournal.referenceType,
        referenceId: originalJournal.referenceId,
        description: `Contre-passation compensatoire de ${originalJournalNumber} : ${reason}`,
        postedBy,
        currency: originalJournal.currency,
        lines: reversedLines,
      },
      txClient
    );
  }

  /**
   * Calculates real-time balances for all ledger accounts.
   */
  static async getAccountBalances(
    txClient: any = prisma
  ): Promise<AccountBalanceSummary[]> {
    await DoubleEntryLedger.ensureStandardAccountsExist(txClient);

    const accounts = await txClient.ledgerAccount.findMany({
      include: {
        entries: true,
      },
      orderBy: { code: "asc" },
    });

    return accounts.map((account: any) => {
      let totalDebitsGnf = 0;
      let totalCreditsGnf = 0;

      for (const entry of account.entries) {
        if (entry.direction === LedgerEntryDirection.DEBIT) {
          totalDebitsGnf += entry.amount;
        } else {
          totalCreditsGnf += entry.amount;
        }
      }

      // Calculate net balance according to account classification:
      // ASSET & EXPENSE: Normal debit balance (Debits - Credits)
      // LIABILITY & REVENUE: Normal credit balance (Credits - Debits)
      let netBalanceGnf = 0;
      if (
        account.type === LedgerAccountType.ASSET ||
        account.type === LedgerAccountType.EXPENSE
      ) {
        netBalanceGnf = totalDebitsGnf - totalCreditsGnf;
      } else {
        netBalanceGnf = totalCreditsGnf - totalDebitsGnf;
      }

      return {
        accountCode: account.code,
        accountName: account.name,
        type: account.type,
        totalDebitsGnf,
        totalCreditsGnf,
        netBalanceGnf,
      };
    });
  }

  /**
   * Retrieves summary balance for a single account by its account code.
   */
  static async getAccountBalance(
    code: string,
    txClient: any = prisma
  ): Promise<AccountBalanceSummary> {
    const balances = await DoubleEntryLedger.getAccountBalances(txClient);
    const found = balances.find((b) => b.accountCode === code);
    if (!found) {
      return {
        accountCode: code,
        accountName: code,
        type: LedgerAccountType.LIABILITY,
        totalDebitsGnf: 0,
        totalCreditsGnf: 0,
        netBalanceGnf: 0,
      };
    }
    return found;
  }

  /**
   * Generates the comprehensive trial balance across all ledger accounts.
   */
  static async getTrialBalance(txClient: any = prisma) {
    const accounts = await DoubleEntryLedger.getAccountBalances(txClient);
    const totalDebitsGnf = accounts.reduce((s, a) => s + a.totalDebitsGnf, 0);
    const totalCreditsGnf = accounts.reduce((s, a) => s + a.totalCreditsGnf, 0);
    return {
      totalDebitsGnf,
      totalCreditsGnf,
      differenceGnf: Math.abs(totalDebitsGnf - totalCreditsGnf),
      isBalanced: totalDebitsGnf === totalCreditsGnf,
    };
  }
}

