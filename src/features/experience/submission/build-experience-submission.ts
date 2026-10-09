import { questions } from "../config/questions";
import { isAnswerValid, isQuestionVisible } from "../types/question";
import type { Answers, AnswerValue } from "../types/question";
import { advisorCodeFor } from "./advisor-codes";
import { projectFileContentType, projectFilesError } from "./file-policy";
import { EXPERIENCE_SUBMISSION_SOURCE, PUBLIC_EXPERIENCE_SCHEMA_VERSION } from "./experience-submission";
import type { ExperienceSubmissionDraft } from "./experience-submission";

export class ExperienceSubmissionError extends Error {
  constructor(public readonly field: string, message: string) {
    super(message);
    this.name = "ExperienceSubmissionError";
  }
}

export interface BuildExperienceSubmissionInput {
  submissionId: string;
  answers: Answers;
  files: readonly File[];
}

export function buildExperienceSubmission({ submissionId, answers, files }: BuildExperienceSubmissionInput): ExperienceSubmissionDraft {
  if (typeof submissionId !== "string" || !submissionId.trim()) {
    throw new ExperienceSubmissionError("submissionId", "submissionId is required.");
  }
  const snapshot: Record<string, AnswerValue> = {};
  for (const question of questions) {
    if (!isQuestionVisible(question, answers)) continue;
    const value = answers[question.id];
    if (!isAnswerValid(question, value)) {
      throw new ExperienceSubmissionError(question.id, `Invalid answer: ${question.id}`);
    }
    if (value === undefined || (typeof value === "string" && !value.trim()) || (Array.isArray(value) && !value.length)) continue;
    snapshot[question.id] = Array.isArray(value) ? [...value] : value;
  }
  function requiredText(id: string): string {
    const value = snapshot[id];
    if (typeof value !== "string" || !value.trim()) throw new ExperienceSubmissionError(id, `Required text: ${id}`);
    return value.trim();
  }
  function optionalText(id: string): string | undefined {
    const value = snapshot[id];
    return typeof value === "string" ? value.trim() || undefined : undefined;
  }
  const advisorDisplayName = requiredText("asesor");
  const advisorCode = advisorCodeFor(advisorDisplayName);
  if (!advisorCode) throw new ExperienceSubmissionError("asesor", "Unknown advisor; update the explicit mapping.");
  const fileError = projectFilesError(files);
  if (fileError) throw new ExperienceSubmissionError("files", fileError);
  return {
    payload: {
      submissionId,
      schemaVersion: PUBLIC_EXPERIENCE_SCHEMA_VERSION,
      source: EXPERIENCE_SUBMISSION_SOURCE,
      client: { fullName: requiredText("nombre"), whatsapp: requiredText("wa"), advisorCode, advisorDisplayName },
      project: {
        name: requiredText("proyecto"), city: requiredText("ciudad"),
        ...(optionalText("parcelacion") ? { subdivision: optionalText("parcelacion") } : {}),
        ...(optionalText("lote") ? { lotOrApartment: optionalText("lote") } : {}),
        ...(optionalText("project_documents") ? { notes: optionalText("project_documents") } : {}),
      },
      answers: snapshot,
      files: files.map((file) => ({ fileName: file.name, contentType: projectFileContentType(file)!, sizeBytes: file.size })),
    },
    files: [...files],
  };
}
