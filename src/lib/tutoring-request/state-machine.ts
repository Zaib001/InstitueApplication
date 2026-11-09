import { RequestStatus } from "@prisma/client";

/**
 * Valid transitions for TutoringRequest lifecycle.
 * In Phase 06, parents control DRAFT, OPEN, and CANCELLED states.
 * MATCHED is controlled by subsequent matching and application acceptance.
 */
export const ALLOWED_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  [RequestStatus.DRAFT]: [RequestStatus.OPEN, RequestStatus.CANCELLED],
  [RequestStatus.OPEN]: [
    RequestStatus.CANCELLED,
    RequestStatus.CLOSED,
    RequestStatus.MATCHED,
    RequestStatus.ASSIGNED,
  ],
  [RequestStatus.ASSIGNED]: [RequestStatus.CLOSED, RequestStatus.CANCELLED],
  [RequestStatus.MATCHED]: [RequestStatus.CLOSED, RequestStatus.CANCELLED],
  [RequestStatus.CLOSED]: [], // Terminal state
  [RequestStatus.CANCELLED]: [], // Terminal state
};

/**
 * Validates whether a state transition from `currentStatus` to `nextStatus` is permitted.
 */
export function canTransitionRequestStatus(
  currentStatus: RequestStatus,
  nextStatus: RequestStatus
): boolean {
  if (currentStatus === nextStatus) return true;
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
}

/**
 * Checks whether a request can be edited by its owning parent.
 * Requests in MATCHED, CLOSED, or CANCELLED status cannot be freely modified.
 */
export function isRequestEditable(status: RequestStatus): boolean {
  return status === RequestStatus.DRAFT || status === RequestStatus.OPEN;
}

/**
 * Checks whether a request can be cancelled by its owning parent.
 * Requests in terminal states (CLOSED, CANCELLED) or active classes cannot be cancelled.
 */
export function isRequestCancellable(status: RequestStatus): boolean {
  return status === RequestStatus.DRAFT || status === RequestStatus.OPEN;
}

/**
 * Returns a human-friendly French badge label and styling for a RequestStatus.
 */
export function getRequestStatusMeta(status: RequestStatus, locale: string = "fr") {
  switch (status) {
    case RequestStatus.DRAFT:
      return {
        label: locale === "en" ? "Draft" : "Brouillon",
        shortLabel: locale === "en" ? "Draft" : "Brouillon",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
        dotClass: "bg-slate-400",
        description:
          locale === "en"
            ? "Saved privately. Invisible to tutors until published."
            : "Enregistrée en privé. Invisible pour les enseignants tant qu'elle n'est pas publiée.",
      };
    case RequestStatus.OPEN:
      return {
        label: locale === "en" ? "Published / Open" : "Publiée / Ouverte",
        shortLabel: locale === "en" ? "Open" : "Ouverte",
        badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
        dotClass: "bg-emerald-500",
        description:
          locale === "en"
            ? "Published on the marketplace. Verified tutors can discover and apply."
            : "Visible sur la plateforme. Les enseignants vérifiés peuvent postuler.",
      };
    case RequestStatus.ASSIGNED:
    case RequestStatus.MATCHED:
      return {
        label: locale === "en" ? "Tutor Matched" : "Professeur assigné",
        shortLabel: locale === "en" ? "Matched" : "Assignée",
        badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
        dotClass: "bg-blue-600",
        description:
          locale === "en"
            ? "A qualified tutor was selected and matched."
            : "Un professeur qualifié a été sélectionné et validé.",
      };
    case RequestStatus.CLOSED:
      return {
        label: locale === "en" ? "Completed / Closed" : "Terminée / Clôturée",
        shortLabel: locale === "en" ? "Closed" : "Clôturée",
        badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
        dotClass: "bg-purple-600",
        description:
          locale === "en"
            ? "This tutoring request has fulfilled its goals or was closed."
            : "Cette demande a atteint ses objectifs ou a été clôturée.",
      };
    case RequestStatus.CANCELLED:
      return {
        label: locale === "en" ? "Cancelled" : "Annulée",
        shortLabel: locale === "en" ? "Cancelled" : "Annulée",
        badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
        dotClass: "bg-rose-500",
        description:
          locale === "en"
            ? "This request was cancelled by the family."
            : "Cette demande a été annulée par la famille.",
      };
  }
}

