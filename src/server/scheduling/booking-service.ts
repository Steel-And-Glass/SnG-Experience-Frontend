import "server-only";
import type { CalendarProvider } from "./calendar-provider";
import { validateBooking } from "./scheduling-policy";
export function createBooking(input: unknown, provider: CalendarProvider, now: Date) {
  // Provider must revalidate availability atomically with creation, after replay lookup.
  // TODO Phase 2: verify received submission + advisor/mode using a trusted backend receipt.
  return provider.createBooking(validateBooking(input, now), now);
}
