import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { PaymentProviderRegistry } from "@/lib/finance/provider-abstraction";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const capabilities = PaymentProviderRegistry.getAllCapabilities();

    return NextResponse.json({
      providers: capabilities,
      readinessComparison: {
        cinetpay: {
          selectionStatus: "PROVISIONAL_SELECTION (Priorité d'évaluation Jalon 3)",
          guineaMerchantAcceptance: "AWAITING_PROVIDER_APPROVAL (Souscription contrat marchand guinéen en cours)",
          gnfSettlement: "AWAITING_PROVIDER_APPROVAL (Reversibilité bancaire locale à Conakry non contractualisée)",
          orangeMoneyCollection: "UNCONFIRMED (Capacité technique documentée, convention Orange Guinée en attente)",
          mtnMomoCollection: "UNCONFIRMED (Capacité technique documentée, convention MTN Guinée en attente)",
          internationalCardsFranceEurope: "UNCONFIRMED (Sous réserve d'agrément acquiring international et réserve de garantie)",
          teacherPayoutDisbursements: "AWAITING_PROVIDER_APPROVAL (API Transfert soumise à pré-approvisionnement du compte marchand)",
          settlementDelays: "UNCONFIRMED (Délai indicatif J+1 à J+3 selon opérateur télécom)",
          processingFeesAndReserves: "UNCONFIRMED (Grille tarifaire et réserve de garantie non signées)",
          refundSupport: "UNCONFIRMED (Procédure manuelle via console marchand requise)",
          webhookSecurity: "CONFIRMED_SPECIFICATION (Signature HMAC-SHA256 intégrée dans l'adaptateur M3.01)",
        },
        fedapay: {
          selectionStatus: "PROVISIONAL_SECONDARY (Option de repli UEMOA)",
          guineaMerchantAcceptance: "UNCONFIRMED (Opérateur basé en zone UEMOA, compte guinéen direct non standard)",
          gnfSettlement: "UNCONFIRMED (Nécessite conversion de change XOF/GNF)",
          orangeMoneyCollection: "UNCONFIRMED (Orange Guinée non intégré nativement hors UEMOA)",
          mtnMomoCollection: "UNCONFIRMED (Couverture MTN régionale)",
          internationalCardsFranceEurope: "UNCONFIRMED (Acquiring Visa/Mastercard fonctionnel en UEMOA)",
          teacherPayoutDisbursements: "UNCONFIRMED (Restreint aux réseaux télécoms UEMOA)",
          settlementDelays: "UNCONFIRMED (Délais de compensation transfrontalière non vérifiés)",
          processingFeesAndReserves: "UNCONFIRMED (Frais transfrontaliers et commissions non fixés)",
          refundSupport: "UNCONFIRMED (Support technique partiel)",
          webhookSecurity: "CONFIRMED_SPECIFICATION (En-tête X-FEDAPAY-SIGNATURE HMAC-SHA256 intégrée)",
        },
      },
      currentPhase: "M3.01_PAYMENT_FOUNDATION",
      liveCollectionEnabled: false,
      notice:
        "Toutes les capacités sont soumises à la validation formelle des contrats marchands et des autorisations d'encaissement opérateurs.",
    });
  } catch (error: any) {
    console.error("GET /api/finance/providers error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne" },
      { status: 500 }
    );
  }
}
