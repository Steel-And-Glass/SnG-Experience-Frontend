export const MAX_PROJECT_FILES = 5;
export const MAX_PROJECT_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_PROJECT_FILES_TOTAL_SIZE_BYTES = 100 * 1024 * 1024;
export const PROJECT_FILE_MIME_TYPES = {
  pdf: "application/pdf",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
} as const;
export const SUPPORTED_PROJECT_FILE_EXTENSIONS = Object.keys(PROJECT_FILE_MIME_TYPES);
export const PROJECT_FILE_ACCEPT = SUPPORTED_PROJECT_FILE_EXTENSIONS.map((extension) => `.${extension}`).join(",");
type FileMetadata = Pick<File, "name" | "size" | "type">;

export function projectFileContentType(file: FileMetadata): string | undefined {
  const extension = /\.([^.]+)$/.exec(file.name)?.[1].toLowerCase() ?? "";
  return Object.hasOwn(PROJECT_FILE_MIME_TYPES, extension)
    ? PROJECT_FILE_MIME_TYPES[extension as keyof typeof PROJECT_FILE_MIME_TYPES] : undefined;
}

// UX validation only. The backend must verify the actual file contents.
export function projectFileError(file: FileMetadata): string | undefined {
  if (!projectFileContentType(file)) return "Formato no permitido. Usa PDF, XLSX, PNG o JPG/JPEG.";
  if (!Number.isSafeInteger(file.size) || file.size <= 0) return "El archivo está vacío o su tamaño no es válido.";
  if (file.size > MAX_PROJECT_FILE_SIZE_BYTES) return `Máximo ${MAX_PROJECT_FILE_SIZE_BYTES / 1024 / 1024} MB por archivo.`;
}

export function projectFilesError(files: readonly FileMetadata[]): string | undefined {
  if (files.length > MAX_PROJECT_FILES) return `Máximo ${MAX_PROJECT_FILES} archivos.`;
  for (const file of files) {
    const error = projectFileError(file);
    if (error) return `${file.name}: ${error}`;
  }
  if (files.reduce((total, file) => total + file.size, 0) > MAX_PROJECT_FILES_TOTAL_SIZE_BYTES) {
    return `Máximo ${MAX_PROJECT_FILES_TOTAL_SIZE_BYTES / 1024 / 1024} MB en total.`;
  }
}
