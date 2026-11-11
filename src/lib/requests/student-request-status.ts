export type StudentRequestStateKey = "NO_REQUEST" | "DRAFT" | "PUBLISHED" | "MATCHED";

export interface StudentRequestStatusInfo {
  state: StudentRequestStateKey;
  labelFr: string;
  labelEn: string;
  descriptionFr: string;
  descriptionEn: string;
  actionLabelFr: string;
  actionLabelEn: string;
  actionHref: string;
  color: "slate" | "amber" | "indigo" | "emerald";
  activeRequestsCount: number;
}

export function deriveStudentRequestStatus(
  studentId: string,
  tutoringRequests: Array<{ id: string; status: string; subjectName?: string }>,
  classrooms: Array<{ id: string; status: string; subjectName?: string }> = []
): StudentRequestStatusInfo {
  // 1. Matched classroom or MATCHED status
  const hasMatchedClassroom = classrooms.some(
    (c) => c.status === "ACTIVE" || c.status === "PENDING_PAYMENT"
  );
  const hasMatchedRequest = tutoringRequests.some((r) => r.status === "MATCHED");

  if (hasMatchedClassroom || hasMatchedRequest) {
    return {
      state: "MATCHED",
      labelFr: "Professeur attribué",
      labelEn: "Tutor Assigned",
      descriptionFr: "Un professeur agréé est déjà affecté à cet élève.",
      descriptionEn: "An approved tutor is currently assigned to this student.",
      actionLabelFr: "Voir les cours",
      actionLabelEn: "View Classes",
      actionHref: "/parent/calendar",
      color: "emerald",
      activeRequestsCount: tutoringRequests.filter(
        (r) => r.status !== "CANCELLED" && r.status !== "CLOSED"
      ).length,
    };
  }

  // 2. Published / Active Request awaiting match
  const publishedReq = tutoringRequests.find(
    (r) => r.status === "PUBLISHED" || r.status === "OPEN"
  );
  if (publishedReq) {
    return {
      state: "PUBLISHED",
      labelFr: "Demande de cours envoyée",
      labelEn: "Tutoring Request Sent",
      descriptionFr: "Recherche d'un enseignant en cours par nos équipes.",
      descriptionEn: "Our team is actively matching qualified teachers.",
      actionLabelFr: "Voir la demande",
      actionLabelEn: "View Request",
      actionHref: `/parent/requests?studentId=${studentId}`,
      color: "indigo",
      activeRequestsCount: tutoringRequests.filter(
        (r) => r.status !== "CANCELLED" && r.status !== "CLOSED"
      ).length,
    };
  }

  // 3. Draft Request
  const draftReq = tutoringRequests.find((r) => r.status === "DRAFT");
  if (draftReq) {
    return {
      state: "DRAFT",
      labelFr: "Demande en brouillon",
      labelEn: "Draft Request",
      descriptionFr: "Une demande de cours est en cours de rédaction.",
      descriptionEn: "A tutoring request draft is in progress.",
      actionLabelFr: "Continuer la demande",
      actionLabelEn: "Continue Request",
      actionHref: `/parent/requests?action=new&studentId=${studentId}`,
      color: "amber",
      activeRequestsCount: tutoringRequests.filter(
        (r) => r.status !== "CANCELLED" && r.status !== "CLOSED"
      ).length,
    };
  }

  // 4. Registered without any tutoring request
  return {
    state: "NO_REQUEST",
    labelFr: "Inscrit — Aucune demande de cours",
    labelEn: "Registered — No Tutoring Request",
    descriptionFr:
      "Votre enfant est inscrit. Pour trouver un professeur certifié, effectuez une demande de cours.",
    descriptionEn:
      "Child is registered. To match an approved tutor, submit a tutoring request.",
    actionLabelFr: "Faire une demande de cours",
    actionLabelEn: "Request a Tutor",
    actionHref: `/parent/requests?action=new&studentId=${studentId}`,
    color: "slate",
    activeRequestsCount: 0,
  };
}

