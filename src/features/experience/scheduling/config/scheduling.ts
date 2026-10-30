import type { SchedulingMode } from "../types/contracts";

// PROVISIONAL. TODO: Replace with verified Steel & Glass scheduling policy.
export const schedulingPolicy = {
  timezone: "America/Bogota", workingDays: [1, 2, 3, 4, 5],
  startHour: 9, endHour: 17, slotDurationMinutes: 60, bufferMinutes: 0,
  minimumNoticeHours: 24, maximumBookingDays: 30,
} as const;

export function schedulingMode(answer: unknown): SchedulingMode | null {
  return answer === "centro_exp" ? "IN_PERSON" : answer === "reunion_virt" ? "VIRTUAL" : null;
}
export function bogotaDate(date: Date): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: schedulingPolicy.timezone }).format(date);
}
// Date-only arithmetic uses UTC, never the browser/host local timezone.
export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}
