import type { ExperienceSubmissionDraft } from "./experience-submission";
import { ideaPhotoError } from "./idea-photo-policy";
import { PROJECT_DOCUMENT_REQUIRED, projectFilesError } from "./file-policy";

const genericError = "No fue posible enviar tu proyecto. Verifica tu conexión e inténtalo nuevamente.";

export class ExperienceSubmitError extends Error {}

export async function submitExperience(draft: ExperienceSubmissionDraft): Promise<void> {
  const fileError = projectFilesError(draft.files);
  if (fileError) throw new ExperienceSubmitError(fileError);
  if (draft.ideaPhoto) {
    const photoError = ideaPhotoError(draft.ideaPhoto);
    if (photoError) throw new ExperienceSubmitError(photoError);
  }
  if (draft.payload.files.length !== draft.files.length || draft.files.some((file, index) => {
    const metadata = draft.payload.files[index];
    return metadata.fileName !== file.name || metadata.contentType !== file.type || metadata.sizeBytes !== file.size;
  })) throw new ExperienceSubmitError("Revisa los documentos antes de enviar tu proyecto.");
  const baseUrl = process.env.NEXT_PUBLIC_COTIZADOR_API_URL?.trim().replace(/\/+$/, "");
  if (!baseUrl) throw new ExperienceSubmitError(genericError);

  const formData = new FormData();
  formData.append("payload", JSON.stringify(draft.payload));
  for (const file of draft.files) formData.append("files", file);
  if (draft.ideaPhoto) formData.append("ideaPhoto", draft.ideaPhoto);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/public/experience-submissions`, {
      method: "POST", body: formData, credentials: "omit",
    });
  } catch {
    throw new ExperienceSubmitError(genericError);
  }
  if (response.status === 422) {
    const problem: unknown = await response.json().catch(() => null);
    if (problem && typeof problem === "object" && "processingErrorCode" in problem
      && problem.processingErrorCode === "PUBLIC_EXPERIENCE_DOCUMENTS_REQUIRED") {
      throw new ExperienceSubmitError(PROJECT_DOCUMENT_REQUIRED);
    }
  }
  if (response.status === 413) {
    throw new ExperienceSubmitError("Los documentos superan el tamaño permitido. Revisa los archivos antes de volver a enviar.");
  }
  if (response.status === 415) {
    throw new ExperienceSubmitError("No se pudo aceptar el formato de los documentos. Usa PDF, XLSX, PNG o JPG/JPEG.");
  }
  if (response.status !== 200 && response.status !== 201) throw new ExperienceSubmitError(genericError);
  const result: unknown = await response.json().catch(() => null);
  if (!result || typeof result !== "object" || !("status" in result) || result.status !== "RECEIVED"
    || !("submissionId" in result) || result.submissionId !== draft.payload.submissionId) {
    throw new ExperienceSubmitError(genericError);
  }
}
