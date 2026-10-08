const mediaBaseUrl = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim().replace(/\/+$/, "") ?? "";

export function mediaUrl(path: string): string {
  const normalizedPath = `/${path.replace(/^\/+/, "")}`;
  return `${mediaBaseUrl}${normalizedPath}`;
}
