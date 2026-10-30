import "server-only";
import type { CalendarProvider } from "./calendar-provider";
import type { AvailabilityInput, AvailabilityResult, BookingInput, BookingResult, Slot } from "../../features/experience/scheduling/types/contracts";
import { addDays } from "../../features/experience/scheduling/config/scheduling";
import { schedulingPolicy as policy, SchedulingError } from "./scheduling-policy";

// Mock booking is development-only and not production persistence.
export class MockCalendarProvider implements CalendarProvider {
  private occupied = new Set<string>();
  private requests = new Map<string, { input: BookingInput; result: BookingResult }>();
  // Both modes share the advisor's calendar. Also useful for deterministic conflict tests.
  occupy(advisorCode: string, startsAt: string) { this.occupied.add(`${advisorCode}|${startsAt}`); }
  async getAvailability(input: AvailabilityInput, now: Date): Promise<AvailabilityResult> {
    const dates: AvailabilityResult["dates"] = [];
    for (let date = input.from; date <= input.to; date = addDays(date, 1)) {
      const slots: Slot[] = [];
      const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
      // Fixed fixtures: weekends and the 15th are closed; noon is occupied.
      if (policy.workingDays.some(day => day === weekday) && !date.endsWith("-15")) {
        for (let minute = policy.startHour * 60; minute + policy.slotDurationMinutes <= policy.endHour * 60;
          minute += policy.slotDurationMinutes + policy.bufferMinutes) {
          const stamp = (value: number) => `${date}T${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}:00-05:00`;
          const startsAt = stamp(minute);
          if (minute === 12 * 60 || Date.parse(startsAt) < now.getTime() + policy.minimumNoticeHours * 3600000
            || this.occupied.has(`${input.advisorCode}|${startsAt}`)) continue;
          slots.push({ startsAt, endsAt: stamp(minute + policy.slotDurationMinutes) });
        }
      }
      dates.push({ date, slots });
    }
    return { timezone: policy.timezone, mock: true, dates };
  }
  async createBooking(input: BookingInput, now: Date): Promise<BookingResult> {
    const previous = this.requests.get(input.bookingRequestId);
    if (previous) {
      if (JSON.stringify(previous.input) !== JSON.stringify(input)) throw new SchedulingError("idempotency_conflict", 409);
      return previous.result;
    }
    const date = input.startsAt.slice(0, 10);
    const available = await this.getAvailability({ ...input, from: date, to: date }, now);
    const slot = available.dates[0]?.slots.find(slot => slot.startsAt === input.startsAt);
    // Recheck after the await: two concurrent requests cannot claim the same slot.
    const retried = this.requests.get(input.bookingRequestId);
    if (retried) {
      if (JSON.stringify(retried.input) !== JSON.stringify(input)) throw new SchedulingError("idempotency_conflict", 409);
      return retried.result;
    }
    if (!slot || this.occupied.has(`${input.advisorCode}|${input.startsAt}`)) throw new SchedulingError("slot_unavailable", 409);
    const result: BookingResult = { ...slot, bookingId: `mock-${input.bookingRequestId}`, status: "CONFIRMED",
      mode: input.mode, timezone: policy.timezone, meetingUrl: null, mock: true };
    this.occupy(input.advisorCode, input.startsAt);
    this.requests.set(input.bookingRequestId, { input, result });
    return result;
  }
}
