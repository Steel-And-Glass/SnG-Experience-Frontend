import "server-only";
import type { AvailabilityInput, AvailabilityResult, BookingInput, BookingResult } from "../../features/experience/scheduling/types/contracts";
export interface CalendarProvider {
  getAvailability(input: AvailabilityInput, now: Date): Promise<AvailabilityResult>;
  createBooking(input: BookingInput, now: Date): Promise<BookingResult>;
}
