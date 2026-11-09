/**
 * Monsieur Fanyi — Deterministic Marketplace Matching Engine
 * Standard: SRD V2.0 — Milestone 2 / Phase 07 (P07.06)
 *
 * Implements deterministic matching between approved teachers and open tutoring requests
 * based on 5 pillars:
 * 1. Teacher Verification Gate (APPROVED status required)
 * 2. Subject match (standard & custom "Autre" with token normalization)
 * 3. Educational level / cycle compatibility
 * 4. Tutoring modality compatibility (HOME, ONLINE, HYBRID)
 * 5. Geographic proximity (city + commune service area for in-home lessons)
 */

export interface TeacherProfileMatchInput {
  id: string;
  verificationStatus: string;
  city: string;
  serviceArea?: string | null;
  isHomeAvailable: boolean;
  isOnlineAvailable: boolean;
  customSubject?: string | null;
  customGradeLevel?: string | null;
  subjects?: Array<{
    subjectId: string;
    subject?: { id: string; name: string } | null;
  }>;
  gradeLevels?: Array<{
    gradeLevelId: string;
    gradeLevel?: { id: string; name: string; cycle: string } | null;
  }>;
}

export interface TutoringRequestMatchInput {
  id: string;
  subjectId?: string | null;
  subjectName: string;
  customSubject?: string | null;
  cycle?: string | null;
  customCycle?: string | null;
  gradeLevelName: string;
  mode: string; // "HOME" | "ONLINE" | "HYBRID"
  city: string;
  commune?: string | null;
  budgetGnf?: number;
  status: string;
}

export interface MatchResult {
  isMatch: boolean;
  isRecommended: boolean;
  score: number; // 0 to 100
  reasons: string[];
  breakdown: {
    subjectMatched: boolean;
    levelMatched: boolean;
    modeMatched: boolean;
    locationMatched: boolean;
  };
}

/**
 * Normalizes text for semantic token comparison (lowercase, trimmed, strip accents).
 */
export function normalizeToken(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Evaluates whether two custom subject strings have meaningful overlap.
 */
export function matchCustomSubjectTokens(
  teacherCustom: string | null | undefined,
  requestCustom: string | null | undefined
): boolean {
  const normTeacher = normalizeToken(teacherCustom);
  const normRequest = normalizeToken(requestCustom);

  if (!normTeacher || !normRequest) return false;
  if (normTeacher === normRequest) return true;
  if (normTeacher.includes(normRequest) || normRequest.includes(normTeacher)) return true;

  // Token-level check (words >= 3 chars)
  const teacherTokens = normTeacher.split(/[\s,;-]+/).filter((w) => w.length >= 3);
  const requestTokens = normRequest.split(/[\s,;-]+/).filter((w) => w.length >= 3);

  return teacherTokens.some((t) => requestTokens.includes(t));
}

/**
 * Evaluates compatibility between an approved teacher and an open tutoring request.
 */
export function calculateOpportunityMatch(
  teacher: TeacherProfileMatchInput,
  request: TutoringRequestMatchInput
): MatchResult {
  const reasons: string[] = [];
  let score = 0;

  // 1. Verification Gate
  if (teacher.verificationStatus !== "APPROVED") {
    return {
      isMatch: false,
      isRecommended: false,
      score: 0,
      reasons: ["Enseignant non approuvé"],
      breakdown: {
        subjectMatched: false,
        levelMatched: false,
        modeMatched: false,
        locationMatched: false,
      },
    };
  }

  // 2. Subject Compatibility (40 points max)
  let subjectMatched = false;
  const isCustomSubject =
    request.subjectName.toLowerCase() === "autre" || !!request.customSubject;

  if (isCustomSubject) {
    // Check custom subject overlap or if teacher teaches "Autre"
    if (matchCustomSubjectTokens(teacher.customSubject, request.customSubject)) {
      subjectMatched = true;
      score += 40;
      reasons.push(`Matière spécifique correspondante (${request.customSubject || "Spécialité"})`);
    } else {
      const hasAutreSubject = teacher.subjects?.some(
        (s) => s.subject?.name.toLowerCase() === "autre"
      );
      if (hasAutreSubject) {
        subjectMatched = true;
        score += 30;
        reasons.push("Matière personnalisée prise en charge");
      }
    }
  } else {
    // Standard subject
    const matchesStandard = teacher.subjects?.some((s) => {
      if (request.subjectId && s.subjectId === request.subjectId) return true;
      if (s.subject?.name && normalizeToken(s.subject.name) === normalizeToken(request.subjectName))
        return true;
      return false;
    });

    if (matchesStandard) {
      subjectMatched = true;
      score += 40;
      reasons.push(`Matière enseignée : ${request.subjectName}`);
    }
  }

  // 3. Level & Cycle Compatibility (25 points max)
  let levelMatched = false;
  const normGrade = normalizeToken(request.gradeLevelName);
  const reqCycle = (request.cycle || "").toUpperCase();

  const exactGradeMatch = teacher.gradeLevels?.some((gl) => {
    return normalizeToken(gl.gradeLevel?.name) === normGrade;
  });

  const cycleMatch = teacher.gradeLevels?.some((gl) => {
    return gl.gradeLevel?.cycle && gl.gradeLevel.cycle.toUpperCase() === reqCycle;
  });

  if (exactGradeMatch) {
    levelMatched = true;
    score += 25;
    reasons.push(`Niveau d'enseignement exact : ${request.gradeLevelName}`);
  } else if (cycleMatch) {
    levelMatched = true;
    score += 20;
    reasons.push(`Cycle éducatif compatible : ${reqCycle}`);
  } else if (reqCycle === "AUTRE" && teacher.customGradeLevel) {
    levelMatched = true;
    score += 20;
    reasons.push("Formation spécialisée prise en charge");
  }

  // 4. Tutoring Mode Compatibility (20 points max)
  let modeMatched = false;
  const reqMode = request.mode.toUpperCase();

  if (reqMode === "HOME" || reqMode === "IN_HOME") {
    if (teacher.isHomeAvailable) {
      modeMatched = true;
      score += 20;
      reasons.push("Cours à domicile disponibles");
    }
  } else if (reqMode === "ONLINE") {
    if (teacher.isOnlineAvailable) {
      modeMatched = true;
      score += 20;
      reasons.push("Cours en ligne disponibles");
    }
  } else if (reqMode === "HYBRID") {
    if (teacher.isHomeAvailable && teacher.isOnlineAvailable) {
      modeMatched = true;
      score += 20;
      reasons.push("Mode hybride (domicile & en ligne) entièrement couvert");
    } else if (teacher.isHomeAvailable || teacher.isOnlineAvailable) {
      modeMatched = true;
      score += 15;
      reasons.push("Format d'enseignement partiellement compatible");
    }
  }

  // 5. Geographic Proximity for In-Home (15 points max)
  let locationMatched = false;
  if (reqMode === "ONLINE") {
    // Online has no geographic boundary
    locationMatched = true;
    score += 15;
  } else {
    // Check city
    const sameCity = normalizeToken(teacher.city) === normalizeToken(request.city);
    if (sameCity) {
      if (!request.commune) {
        locationMatched = true;
        score += 15;
        reasons.push(`Même ville (${request.city})`);
      } else {
        const normCommune = normalizeToken(request.commune);
        const normServiceArea = normalizeToken(teacher.serviceArea);
        if (!normServiceArea || normServiceArea.includes(normCommune)) {
          locationMatched = true;
          score += 15;
          reasons.push(`Zone desservie : ${request.commune}`);
        } else {
          // Same city but different commune
          locationMatched = true;
          score += 8;
          reasons.push(`Même ville (${request.city}), commune voisine`);
        }
      }
    }
  }

  const isMatch = subjectMatched && (levelMatched || modeMatched);
  const isRecommended = score >= 60 && subjectMatched;

  return {
    isMatch,
    isRecommended,
    score: Math.min(100, score),
    reasons,
    breakdown: {
      subjectMatched,
      levelMatched,
      modeMatched,
      locationMatched,
    },
  };
}

