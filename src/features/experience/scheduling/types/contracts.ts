export type SchedulingMode = "IN_PERSON" | "VIRTUAL";
export interface AvailabilityInput { mode: SchedulingMode; advisorCode: string; from: string; to: string }
export interface Slot { startsAt: string; endsAt: string }
export interface AvailabilityResult {
  timezone: "America/Bogota";
  mock: true;
  dates: { date: string; slots: Slot[] }[];
}
export interface BookingInput {
  submissionId: string; bookingRequestId: string; mode: SchedulingMode; advisorCode: string; startsAt: string;
}
export interface BookingResult extends Slot {
  bookingId: string; status: "CONFIRMED"; mode: SchedulingMode;
  timezone: "America/Bogota"; meetingUrl: null; mock: true;
}
