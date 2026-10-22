import { mediaUrl } from "@/lib/media-url";

// Exact, case-sensitive R2 keys verified against the supplied public URLs.
export const homeMedia = {
  hero: mediaUrl("/website/hero/Casa-interior.webp"),
  projects: {
    building: mediaUrl("/website/projects/Edificio-exterior.webp"),
    residence: mediaUrl("/website/projects/Casa-gris-exterior.webp"),
    landscape: mediaUrl("/website/projects/Vista-exterior.webp"),
  },
  solutions: mediaUrl("/website/solutions/Pasillo_cristal.webp"),
};
