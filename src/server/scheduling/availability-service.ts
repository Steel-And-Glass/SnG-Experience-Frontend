import "server-only";
import type { CalendarProvider } from "./calendar-provider";
import { validateAvailability } from "./scheduling-policy";
export function getAvailability(input: unknown, provider: CalendarProvider, now: Date) {
  return provider.getAvailability(validateAvailability(input, now), now);
}
