/**
 * The employer-facing Candidate Card shape. This is the ONLY candidate data a shortlist link exposes:
 * no email, phone, ID numbers, internal notes or platform user ids.
 */
export interface CandidateCardData {
  id: number;
  name: string;
  targetRole: string | null;
  location: string | null;
  experience: string | null;
  salaryExpectation: number | null;
  availability: string | null;
  keySkills: string[];
  match: string | null;
  communication: { rating: number; note: string | null } | null;
  roleAssessment: { name: string; score: number; max: number; note: string | null } | null;
  interviewReadiness: number | null;
  assessedAt: string | null;
  recruiterNote: string | null;
  hasCv: boolean;
  interviewRequested: boolean;
}

export function toCandidateCard(e: any, interviewRequested = false): CandidateCardData {
  const hasRole = e.role_assessment_name && e.role_assessment_score !== null && e.role_assessment_max;
  return {
    id: e.id,
    name: e.display_name,
    targetRole: e.target_role ?? null,
    location: e.location ?? null,
    experience: e.experience ?? null,
    salaryExpectation: e.salary_expectation ?? null,
    availability: e.availability ?? null,
    keySkills: e.key_skills ?? [],
    match: e.match_level ?? null,
    communication: e.communication_rating ? { rating: e.communication_rating, note: e.communication_note ?? null } : null,
    roleAssessment: hasRole ? { name: e.role_assessment_name, score: e.role_assessment_score, max: e.role_assessment_max, note: e.role_assessment_note ?? null } : null,
    interviewReadiness: e.interview_readiness ?? null,
    // Only show an assessment date when something was actually assessed
    assessedAt: e.assessed_at && (e.match_level || e.communication_rating || e.interview_readiness || hasRole) ? new Date(e.assessed_at).toISOString() : null,
    recruiterNote: e.recruiter_note ?? null,
    hasCv: Boolean(e.cv_s3_key || e.cv_external_url),
    interviewRequested,
  };
}
