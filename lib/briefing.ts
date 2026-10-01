/** Response shape of POST /api/ai/candidate-briefing. */
export interface CandidateBriefing {
  matchScore: number;
  keyStrengths: string[];
  areasToProbe: string[];
  suggestedInterviewQuestions: string[];
  generatedAt: string;
  model: string;
  /** Which inputs the model actually had to work with. */
  sources: { resume: boolean; skills: boolean; transcript: boolean };
}
