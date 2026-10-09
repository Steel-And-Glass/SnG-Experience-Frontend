export const ADVISOR_CODES = {
  "Andrés Candela": "ANDRES_CANDELA",
  "Valeria Álvarez": "VALERIA_ALVAREZ",
  "Alejandra Del Río": "ALEJANDRA_DEL_RIO",
  "Julián Sierra": "JULIAN_SIERRA",
  "Paula Chica": "PAULA_CHICA",
  "No sé / contacto directo": "DIRECT_CONTACT",
} as const;

export function advisorCodeFor(displayName: string): string | undefined {
  return Object.hasOwn(ADVISOR_CODES, displayName)
    ? ADVISOR_CODES[displayName as keyof typeof ADVISOR_CODES] : undefined;
}
