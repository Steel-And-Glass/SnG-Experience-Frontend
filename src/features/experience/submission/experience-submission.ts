import type { AnswerValue } from "../types/question";

export const PUBLIC_EXPERIENCE_SCHEMA_VERSION = "sng-public-experience-v1";
export const EXPERIENCE_SUBMISSION_SOURCE = "SNG_WEB";

export interface ExperienceSubmissionFile {
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface ExperienceSubmission {
  submissionId: string;
  schemaVersion: typeof PUBLIC_EXPERIENCE_SCHEMA_VERSION;
  source: typeof EXPERIENCE_SUBMISSION_SOURCE;
  client: { fullName: string; whatsapp: string; advisorCode: string; advisorDisplayName: string };
  project: { name: string; city: string; subdivision?: string; lotOrApartment?: string; notes?: string };
  answers: Record<string, AnswerValue>;
  files: ExperienceSubmissionFile[];
}

export interface ExperienceSubmissionDraft {
  payload: ExperienceSubmission;
  files: readonly File[];
}

// Generate once per logical submission, outside the pure builder; retain for retries.
export function createExperienceSubmissionId(): string {
  if (typeof globalThis.crypto?.randomUUID !== "function") {
    throw new Error("Secure UUID generation is unavailable; use a secure browser context.");
  }
  return globalThis.crypto.randomUUID();
}
