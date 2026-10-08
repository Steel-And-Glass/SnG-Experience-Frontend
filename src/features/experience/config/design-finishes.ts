import { mediaUrl } from "@/lib/media-url";
import type { AnswerValue } from "../types/question";
import { designNeutralImage } from "./design-images";

export const finishQuestionId = "preferencia_acabado";
export const finishImageSize = { width: 1672, height: 941 };
// Six visible panels on the central material wall, in photograph coordinates.
export const finishHotspots = [
  { id: "upper-warm", answerValue: "madera_esp", x: 737, y: 181, width: 33, height: 95 },
  { id: "upper-dark", answerValue: "negro", x: 773, y: 179, width: 32, height: 97 },
  { id: "middle-light", answerValue: "blanco_gris", x: 738, y: 287, width: 31, height: 85 },
  { id: "middle-warm", answerValue: "madera_esp", x: 773, y: 285, width: 31, height: 87 },
  { id: "lower-grey", answerValue: "blanco_gris", x: 738, y: 383, width: 21, height: 77 },
  { id: "lower-dark", answerValue: "negro", x: 773, y: 383, width: 32, height: 77 },
] as const;

// Activate only when the real, camera-aligned assets are supplied.
export const finishImages: Readonly<Record<string, { src: string; available: boolean }>> = {
  negro: { src: mediaUrl("/experience/scenes/espacio-diseño-negro.webp"), available: true },
  blanco_gris: { src: mediaUrl("/experience/scenes/espacio-diseño-blanco.webp"), available: true },
  madera_esp: { src: mediaUrl("/experience/scenes/espacio-diseño-madera.webp"), available: true },
};

export function finishImageForAnswer(answer: AnswerValue | undefined): string {
  const variant = typeof answer === "string" ? finishImages[answer] : undefined;
  return variant?.available ? variant.src : designNeutralImage;
}

export function finishCoverGeometry(width: number, height: number) {
  const scale = Math.max(width / finishImageSize.width, height / finishImageSize.height);
  return { scale, x: (width - finishImageSize.width * scale) / 2, y: (height - finishImageSize.height * scale) / 2 };
}
