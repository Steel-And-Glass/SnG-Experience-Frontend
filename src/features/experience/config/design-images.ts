import { mediaUrl } from "@/lib/media-url";
import type { AnswerValue } from "../types/question";

export const designNeutralImage = mediaUrl("/experience/scenes/espacio-diseno.webp");

// Enable each entry only after adding its real asset with matching camera,
// framing and resolution. Missing assets must never be replaced by duplicates.
export const designImages: Readonly<Record<string, { src: string; available: boolean }>> = {
  desaparece: { src: mediaUrl("/experience/scenes/espacio-diseno-transparencia.webp"), available: true },
  integrada: { src: mediaUrl("/experience/scenes/espacio-diseno-integracion.webp"), available: true },
  protagonismo: { src: mediaUrl("/experience/scenes/espacio-diseno-protagonismo.webp"), available: true },
};

export function designImageForAnswer(answer: AnswerValue | undefined, visible: boolean): string {
  if (!visible || typeof answer !== "string") return designNeutralImage;
  const variant = designImages[answer];
  return variant?.available ? variant.src : designNeutralImage;
}
