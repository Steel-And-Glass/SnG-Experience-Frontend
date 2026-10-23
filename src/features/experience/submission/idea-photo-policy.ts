export const MAX_IDEA_PHOTO_SIZE_BYTES = 20 * 1024 * 1024;
export const IDEA_PHOTO_ACCEPT = ".jpg,.jpeg,.png";

export function ideaPhotoError(file: File): string | undefined {
  const extension = /\.([^.]+)$/.exec(file.name)?.[1].toLowerCase();
  const expected = extension === "jpg" || extension === "jpeg" ? "image/jpeg"
    : extension === "png" ? "image/png" : undefined;
  if (!expected || (file.type && file.type.toLowerCase() !== expected)) {
    return "Formato no permitido. Usa JPG, JPEG o PNG con un tipo de archivo coherente.";
  }
  if (!Number.isSafeInteger(file.size) || file.size <= 0) return "La fotografía está vacía o su tamaño no es válido.";
  if (file.size > MAX_IDEA_PHOTO_SIZE_BYTES) return "La fotografía supera el máximo de 20 MB.";
}
